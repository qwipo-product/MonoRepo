// Leaflet map of the cross-dock network: CDS delivery areas, distributors, retailers, the Service Centre yard, and
// optionally one trip's route with numbered stops.
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { XdOverview, XdStopView } from '../../types/crossDock';
import { cdsColor, DIRECT_COLOR } from './mapColors';

// The upstream app's CARTO tiles now return "API key required" placeholders, so the cross-dock maps use OpenStreetMap's.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors';
function badgeIcon(html: string, bg: string, size = 28) {
  return L.divIcon({
    className: 'sc-map-icon',
    html: `<div style="width:${size}px;height:${size}px;border-radius:8px;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);">${html}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Re-measures the map when its container changes size (sidebar toggle, window resize). */
function KeepSized() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function FitTo({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

interface Props {
  overview: XdOverview;
  showRetailers?: boolean;
  showDistributors?: boolean;
  /** Only these distributors (e.g. the ones on a trip). */
  distributorIds?: string[];
  /** One trip's stops, in order. */
  route?: XdStopView[];
  /** CDS to emphasise (others are drawn lighter). */
  focusCdsId?: string | null;
  onCdsClick?: (cdsId: string) => void;
  height?: number;
}

export default function NetworkMap({ overview, showRetailers = true, showDistributors = true, distributorIds, route, focusCdsId, onCdsClick, height }: Props) {
  const yard = overview.yard;
  const distributors = useMemo(
    () => overview.distributors.filter((d) => !distributorIds || distributorIds.includes(d.id)),
    [overview, distributorIds],
  );

  const fitPoints = useMemo<[number, number][]>(() => {
    if (route?.length) return [yard, ...route.map((s) => [s.lat, s.lng] as [number, number])];
    return [...overview.cdss.flatMap((c) => c.polygon), ...distributors.map((d) => [d.lat, d.lng] as [number, number])];
  }, [overview, distributors, route, yard]);

  return (
    <div className="sc-map" style={height ? { height } : undefined}>
      <MapContainer center={yard} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <KeepSized />
        <FitTo points={fitPoints} />

        {overview.cdss.map((c) => {
          const color = cdsColor(overview, c.id);
          const dim = focusCdsId && focusCdsId !== c.id;
          const live = c.status === 'LIVE';
          return (
            <Polygon
              key={c.id}
              positions={c.polygon}
              pathOptions={{ color: live ? color : DIRECT_COLOR, weight: focusCdsId === c.id ? 3 : 2, dashArray: live ? undefined : '6 6', fillOpacity: dim ? 0.04 : live ? 0.12 : 0.05, opacity: dim ? 0.4 : 1 }}
              eventHandlers={onCdsClick ? { click: () => onCdsClick(c.id) } : undefined}
            >
              <Tooltip sticky>{`${c.name}${live ? '' : ' (onboarding: orders here go direct for now)'}`}</Tooltip>
            </Polygon>
          );
        })}

        {showRetailers &&
          overview.retailers.map((rt) => (
            <CircleMarker key={rt.id} center={[rt.lat, rt.lng]} radius={4} pathOptions={{ color: '#fff', weight: 1, fillColor: cdsColor(overview, rt.cdsId), fillOpacity: 0.95 }}>
              <Tooltip>{`${rt.name} · ${rt.locality} · ${rt.cdsId ? `cross-dock via ${overview.cdss.find((c) => c.id === rt.cdsId)?.code}` : 'direct delivery'}`}</Tooltip>
            </CircleMarker>
          ))}

        {overview.cdss.map((c) => (
          <Marker key={`m-${c.id}`} position={[c.lat, c.lng]} icon={badgeIcon('<i class="fas fa-store"></i>', c.status === 'LIVE' ? cdsColor(overview, c.id) : DIRECT_COLOR)}>
            <Tooltip direction="top" offset={[0, -12]}>{`${c.code} · ${c.operatorName}`}</Tooltip>
          </Marker>
        ))}

        {showDistributors &&
          distributors.map((d) => (
            <Marker key={d.id} position={[d.lat, d.lng]} icon={badgeIcon('<i class="fas fa-industry"></i>', '#334155', 26)}>
              <Tooltip direction="top" offset={[0, -12]}>{`${d.name} · ${d.locality}`}</Tooltip>
            </Marker>
          ))}

        <Marker position={yard} icon={badgeIcon('<i class="fas fa-truck-moving"></i>', '#1e3a8a', 30)}>
          <Tooltip direction="top" offset={[0, -14]}>Service Centre yard</Tooltip>
        </Marker>

        {route?.length ? (
          <>
            <Polyline positions={[yard, ...route.map((s) => [s.lat, s.lng] as [number, number]), yard]} pathOptions={{ color: '#1e3a8a', weight: 3, dashArray: '8 6', opacity: 0.8 }} />
            {route.map((s) => (
              <Marker key={`s-${s.seq}`} position={[s.lat, s.lng]} icon={badgeIcon(String(s.seq), s.status === 'DONE' ? '#059669' : '#2563eb', 24)} zIndexOffset={1000}>
                <Tooltip direction="right" offset={[12, 0]}>{`${s.seq}. ${s.action === 'PICKUP' ? 'Pick up at' : 'Drop at'} ${s.placeName}`}</Tooltip>
              </Marker>
            ))}
          </>
        ) : null}
      </MapContainer>
    </div>
  );
}

export function MapLegend({ overview, showRetailers = true }: { overview: XdOverview; showRetailers?: boolean }) {
  return (
    <div className="sc-legend mt-2">
      {overview.cdss.map((c) => (
        <span key={c.id}>
          <i className="sc-swatch" style={{ background: c.status === 'LIVE' ? cdsColor(overview, c.id) : 'transparent', border: `2px ${c.status === 'LIVE' ? 'solid' : 'dashed'} ${c.status === 'LIVE' ? cdsColor(overview, c.id) : DIRECT_COLOR}` }} />
          {c.code}
          {c.status === 'LIVE' ? '' : ' (onboarding)'}
        </span>
      ))}
      {showRetailers && (
        <span>
          <i className="sc-dot" style={{ background: DIRECT_COLOR }} />
          Retailer outside a live CDS area (direct)
        </span>
      )}
      <span>
        <i className="fas fa-industry" style={{ color: '#334155' }} aria-hidden="true" />
        Distributor
      </span>
      <span>
        <i className="fas fa-truck-moving" style={{ color: '#1e3a8a' }} aria-hidden="true" />
        Service Centre yard
      </span>
    </div>
  );
}
