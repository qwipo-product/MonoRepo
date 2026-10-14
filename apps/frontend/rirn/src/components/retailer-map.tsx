import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import type { Retailer } from '../lib/retailer-base';
import { isUnlocked, mappingFor } from '../lib/company-session';
import { RetailerPopupCard } from './retailer-popup-card';

/**
 * The discovery map.
 *
 * The important behaviour here is NOT the cartography — it's that an unmapped
 * retailer is deliberately imprecise.
 *
 * PRD §16 puts "approximate location" at Level 1 (public) and the exact
 * address at Level 2 (consent). So a retailer the company hasn't mapped is
 * drawn as a soft disc, offset from its true position by up to ~400m: you can
 * see that a pocket of Kondapur has fourteen kirana stores, but you cannot
 * drive to one. Map the retailer and the pin snaps to its real coordinates.
 *
 * That turns the privacy rule into something a reviewer can see, instead of
 * a policy buried in an API contract.
 *
 * The offset is deterministic per NRID — a fuzz that reshuffled on every
 * render would both look broken and, worse, average out to the true position
 * if someone watched long enough.
 */

export type PinState = 'mapped' | 'unlocked' | 'locked';

export function pinStateFor(nrid: string): PinState {
  if (mappingFor(nrid)) return 'mapped';
  if (isUnlocked(nrid)) return 'unlocked';
  return 'locked';
}

/** ~±400m, stable per retailer. */
function fuzz(nrid: string, axis: 0 | 1): number {
  let h = 2166136261;
  const key = `${nrid}:${axis}`;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 0.0072;
}

export function displayPosition(r: Retailer, state: PinState): [number, number] {
  if (state === 'locked') return [r.lat + fuzz(r.nrid, 0), r.lng + fuzz(r.nrid, 1)];
  return [r.lat, r.lng];
}

/* ------------------------------------------------------------------ *
 * Markers
 * ------------------------------------------------------------------ */

const MAPPED = '#2563eb'; // primary — you hold an ID for this retailer
const UNLOCKED = '#d97706'; // warning — you've looked, but haven't mapped it
const LOCKED = '#64748b'; // neutral — known to the network, not to you

/** Precise teardrop, for retailers whose exact position you've earned. */
function preciseIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'rirn-marker',
    html: `<div style="
        width:36px;height:36px;background:${color};
        border:3.5px solid #fff;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 3px 8px rgba(0,0,0,.35);
        display:flex;align-items:center;justify-content:center;">
        <div style="transform:rotate(45deg);width:9px;height:9px;background:#fff;border-radius:50%"></div>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

/**
 * Soft disc — reads as "somewhere around here", which is the truth.
 *
 * Solid enough to survive a busy OpenStreetMap tile. The first version used a
 * 20%-opacity fill and vanished against the map's own shop and hospital
 * icons, which made the base look empty rather than withheld — the opposite
 * of the point.
 */
function approximateIcon(): L.DivIcon {
  return L.divIcon({
    className: 'rirn-marker rirn-marker-approx',
    html: `<div style="
        width:30px;height:30px;border-radius:50%;
        background:${LOCKED};opacity:.94;
        border:3px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,.45);
        display:flex;align-items:center;justify-content:center;">
        <div style="width:9px;height:9px;border-radius:50%;background:#fff;opacity:.9"></div>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

const ICONS: Record<PinState, L.DivIcon> = {
  mapped: preciseIcon(MAPPED),
  unlocked: preciseIcon(UNLOCKED),
  locked: approximateIcon(),
};

/* ------------------------------------------------------------------ *
 * Map
 * ------------------------------------------------------------------ */

/** Re-frames the map whenever the result set changes. */
function FitResults({ retailers }: { retailers: Retailer[] }) {
  const map = useMap();
  useEffect(() => {
    if (!retailers.length) return;
    const bounds = L.latLngBounds(retailers.map((r) => [r.lat, r.lng] as [number, number]));
    // Not animated: re-framing should be instant when results change, and an
    // animated fit leaves the map stranded at the old zoom if the animation
    // is ever interrupted or suppressed.
    map.fitBounds(bounds.pad(0.25), { animate: false });
  }, [retailers, map]);
  return null;
}

interface RetailerMapProps {
  retailers: Retailer[];
  selectedNrid?: string;
  /** Pin click — selects, and pops the card open on the map. */
  onSelect: (nrid: string) => void;
  /** The card's CTA — opens the full detail panel. */
  onOpenDetail: (nrid: string) => void;
  /** Bumped by the parent whenever unlock/mapping state changes, to re-render pins. */
  revision: number;
}

export function RetailerMap({
  retailers,
  selectedNrid,
  onSelect,
  onOpenDetail,
  revision,
}: RetailerMapProps) {
  const markers = useMemo(
    () =>
      retailers.map((r) => {
        const state = pinStateFor(r.nrid);
        return { r, state, pos: displayPosition(r, state) };
      }),
    // `revision` is the point: pin state lives in the session store, not props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [retailers, revision],
  );

  return (
    // `isolate` is load-bearing. Leaflet gives its own panes z-index 400–1000
    // (markers 600, popups 700, controls 800), and shadcn's Sheet and Dialog
    // sit at z-50. Without a stacking context here, the map draws straight
    // through any overlay opened on top of it. This keeps Leaflet's z-indexes
    // to itself.
    <MapContainer
      center={[17.4401, 78.3489]}
      zoom={12}
      className="isolate h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitResults retailers={retailers} />
      <MarkerClusterGroup chunkedLoading maxClusterRadius={45}>
        {markers.map(({ r, state, pos }) => (
          <Marker
            key={r.nrid}
            position={pos}
            icon={ICONS[state]}
            zIndexOffset={r.nrid === selectedNrid ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(r.nrid) }}
          >
            <Popup className="rirn-popup" minWidth={300} maxWidth={300} closeButton={false}>
              <RetailerPopupCard retailer={r} onOpenDetail={() => onOpenDetail(r.nrid)} />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}

/** Shared legend — the map is unreadable without it. */
export function MapLegend() {
  const items: [PinState, string, string][] = [
    ['mapped', MAPPED, 'Mapped — your DMS ID is attached'],
    ['unlocked', UNLOCKED, 'Unlocked — not mapped yet'],
    ['locked', LOCKED, 'Approximate location only'],
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map(([state, color, label]) => (
        <span key={state} className="flex items-center gap-1.5 text-xs text-gray-600">
          {state === 'locked' ? (
            <span
              className="h-3 w-3 rounded-full border-2 border-dashed"
              style={{ borderColor: `${color}99`, background: `${color}33` }}
            />
          ) : (
            <span className="h-3 w-3 rounded-full" style={{ background: color }} />
          )}
          {label}
        </span>
      ))}
    </div>
  );
}
