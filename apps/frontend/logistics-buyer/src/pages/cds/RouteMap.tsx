// Route map for CDS trips and plans — numbered stops joined in visit order, on the same map tiles as
// Delivery Planning › Route map. Opens as a dialog from Trips, Trip details and Pickup Planning.
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { pointInPolygon, ringAreaKm2 } from '../../cds/planning';

/** Trip stops → map stops (number, name, address, done / pending). */
export const mapStops = (stops: { seq: number; name: string; address: string; lat: number; lng: number; status: MapStop['status'] }[]): MapStop[] =>
  stops.map((s) => ({ seq: s.seq, name: s.name, detail: s.address, lat: s.lat, lng: s.lng, status: s.status }));

export interface MapStop { seq: number; name: string; detail?: string; lat: number; lng: number; status?: 'PENDING' | 'DONE' | 'PARTIAL' | 'FAILED' }

const COLORS = { PENDING: '#2563eb', DONE: '#16a34a', PARTIAL: '#d97706', FAILED: '#dc2626' } as const;

const pin = (s: MapStop) =>
  L.divIcon({
    className: 'cds-map-pin',
    html: `<span style="background:${COLORS[s.status ?? 'PENDING']}">${s.seq}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

function Fit({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 14);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, points]);
  return null;
}

/** Map of the stops in order. `groups` draws several routes (one line each); `line={false}` shows points only. */
export function RouteMap({ stops, height = 420, groups, line = true }: { stops: MapStop[]; height?: number; groups?: MapStop[][]; line?: boolean }) {
  const shown = stops.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));
  const lines = useMemo(() => (groups ?? [shown]).map((g) => g.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng)).map((s) => [s.lat, s.lng] as [number, number])), [groups, shown]);
  const points = useMemo(() => shown.map((s) => [s.lat, s.lng] as [number, number]), [shown]);
  if (!shown.length) return <div className="cds-empty">No locations to show</div>;
  return (
    <div className="cds-map" style={{ height }}>
      <MapContainer center={points[0]} zoom={12} style={{ width: '100%', height: '100%' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
        {line && lines.map((p, i) => <Polyline key={i} positions={p} pathOptions={{ color: groups ? STORE_COLORS[i % STORE_COLORS.length] : '#2563eb', weight: 3, opacity: 0.8, dashArray: '8 6' }} />)}
        {shown.map((s, i) => (
          <Marker key={`${i}-${s.seq}-${s.name}`} position={[s.lat, s.lng]} icon={pin(s)}>
            <Tooltip direction="top" offset={[0, -12]}><b>{s.seq}. {s.name}</b>{s.detail && <div>{s.detail}</div>}</Tooltip>
          </Marker>
        ))}
        <Fit points={points} />
      </MapContainer>
    </div>
  );
}

/** "Map View" dialog with the stop list beside the map. */
export function RouteMapDialog({ title, subtitle, stops, onClose, groups, line }: { title: string; subtitle?: string; stops: MapStop[]; onClose: () => void; groups?: MapStop[][]; line?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div className="modal-overlay fm-overlay" onClick={onClose}>
      <div className="cds-map-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="cds-map-dialog-head">
          <div><h2><i className="fas fa-map-location-dot me-2" />{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <button className="close-btn" onClick={onClose} aria-label="Close"><i className="fas fa-times" /></button>
        </div>
        <div className="cds-map-dialog-body">
          <ol className="cds-map-stops">
            {stops.map((s, i) => (
              <li key={`${i}-${s.seq}-${s.name}`}>
                <span className="dot" style={{ background: COLORS[s.status ?? 'PENDING'] }}>{s.seq}</span>
                <div><div className="fw-semibold">{s.name}</div>{s.detail && <div className="text-muted text-xs">{s.detail}</div>}</div>
              </li>
            ))}
          </ol>
          <RouteMap stops={stops} height={460} groups={groups} line={line} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------- CDS service areas (coverage map + polygon editor)

export const STORE_COLORS = ['#2563eb', '#7c3aed', '#0d9488', '#d97706', '#db2777', '#0891b2'];
export const OUTSIDE_COLOR = '#9ca3af';
type Ring = [number, number][];
export interface AreaStore { id: string; name: string; lat: number; lng: number; polygon: Ring; active: boolean }
export interface AreaRetailer { id: string; name: string; locality: string; lat: number; lng: number; storeId: string | null }

const storeIcon = (color: string) =>
  L.divIcon({ className: 'cds-map-pin', html: `<span style="background:${color};border-radius:6px"><i class="fas fa-warehouse" style="font-size:12px"></i></span>`, iconSize: [28, 28], iconAnchor: [14, 14] });

function FitRings({ rings, focus }: { rings: Ring[]; focus?: [number, number] | null }) {
  const map = useMap();
  const key = JSON.stringify(rings);
  useEffect(() => {
    const pts = rings.flat();
    if (pts.length) map.fitBounds(L.latLngBounds(pts), { padding: [24, 24] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  useEffect(() => {
    if (focus) map.setView(focus, 14);
  }, [map, focus]);
  return null;
}

/** All CDS service areas with every retailer: coloured by the CDS store that serves it, grey when outside every area. */
export function CoverageMap({ stores, retailers, focusId, height = 440 }: { stores: AreaStore[]; retailers: AreaRetailer[]; focusId?: string | null; height?: number }) {
  const color = (id: string | null) => (id ? STORE_COLORS[Math.max(0, stores.findIndex((s) => s.id === id)) % STORE_COLORS.length] : OUTSIDE_COLOR);
  const focus = retailers.find((r) => r.id === focusId);
  return (
    <div className="cds-map" style={{ height }}>
      <MapContainer center={[17.41, 78.49]} zoom={11} style={{ width: '100%', height: '100%' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
        {stores.map((s) => s.polygon.length >= 3 && (
          <Polygon key={s.id} positions={s.polygon} pathOptions={{ color: color(s.id), weight: 2, fillOpacity: s.active ? 0.12 : 0.04, dashArray: s.active ? undefined : '6 6' }}>
            <Tooltip sticky>{s.name}{s.active ? '' : ' (inactive)'}</Tooltip>
          </Polygon>
        ))}
        {retailers.map((r) => (
          <CircleMarker key={r.id} center={[r.lat, r.lng]} radius={r.id === focusId ? 8 : 4}
            pathOptions={{ color: r.id === focusId ? '#111827' : r.storeId ? color(r.storeId) : '#dc2626', weight: r.id === focusId ? 3 : 1, fillColor: color(r.storeId), fillOpacity: 0.85 }}>
            <Tooltip direction="top">{r.name} · {r.locality}<br />{r.storeId ? stores.find((s) => s.id === r.storeId)?.name : 'Outside every CDS area (3PL)'}</Tooltip>
          </CircleMarker>
        ))}
        {stores.map((s) => <Marker key={`m-${s.id}`} position={[s.lat, s.lng]} icon={storeIcon(color(s.id))}><Tooltip direction="top" offset={[0, -12]}><b>{s.name}</b></Tooltip></Marker>)}
        <FitRings rings={stores.map((s) => s.polygon).filter((p) => p.length >= 3)} focus={focus ? [focus.lat, focus.lng] : null} />
      </MapContainer>
    </div>
  );
}

function ClickToAdd({ onAdd }: { onAdd: (p: [number, number]) => void }) {
  useMapEvents({ click: (e) => onAdd([Math.round(e.latlng.lat * 1e6) / 1e6, Math.round(e.latlng.lng * 1e6) / 1e6]) });
  return null;
}
const vertexIcon = L.divIcon({ className: 'cds-vertex', iconSize: [14, 14], iconAnchor: [7, 7] });

/** Draw / edit one CDS store's service area. Click the map to add a point; drag a point to move it. */
export function PolygonEditorDialog({ store, others, retailers, busy, onSave, onClose }: {
  store: AreaStore; others: AreaStore[]; retailers: AreaRetailer[]; busy: boolean; onSave: (ring: Ring) => void; onClose: () => void;
}) {
  const [ring, setRing] = useState<Ring>(store.polygon);
  const inside = retailers.filter((r) => ring.length >= 3 && pointInPolygon(r, ring));
  const shared = inside.filter((r) => others.some((o) => o.active && o.polygon.length >= 3 && pointInPolygon(r, o.polygon)));
  const area = ringAreaKm2(ring);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div className="modal-overlay fm-overlay" onClick={onClose}>
      <div className="cds-map-dialog" role="dialog" aria-modal="true" aria-label={`Service area · ${store.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="cds-map-dialog-head">
          <div><h2><i className="fas fa-draw-polygon me-2" />Service Area · {store.name}</h2><p>Click the map to add a point. Drag a point to move it.</p></div>
          <button className="close-btn" onClick={onClose} aria-label="Close"><i className="fas fa-times" /></button>
        </div>
        <div className="cds-map-dialog-body">
          <div className="cds-area-side">
            <div className="cds-area-figures">
              <div><b>{ring.length}</b><span>points</span></div>
              <div><b>{area}</b><span>km²</span></div>
              <div><b>{inside.length}</b><span>retailers inside</span></div>
            </div>
            {shared.length > 0 && <div className="cds-note warn"><i className="fas fa-triangle-exclamation mt-1" /><div>{shared.length} retailer{shared.length === 1 ? ' is' : 's are'} also inside another CDS area. They go to the nearest CDS store.</div></div>}
            <div className="cds-note"><i className="fas fa-circle-info mt-1" /><div>New Seller Store orders use the saved area. Orders already allocated keep their CDS store.</div></div>
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-sm btn-outline-secondary" disabled={!ring.length} onClick={() => setRing((r) => r.slice(0, -1))}><i className="fas fa-rotate-left me-1" />Undo point</button>
              <button className="btn btn-sm btn-outline-secondary" disabled={!ring.length} onClick={() => setRing([])}><i className="fas fa-eraser me-1" />Clear</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setRing(store.polygon)}><i className="fas fa-clock-rotate-left me-1" />Reset</button>
            </div>
            <div className="d-flex gap-2 mt-auto">
              <button className="btn btn-outline-secondary flex-fill" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary flex-fill" disabled={busy || ring.length < 3} onClick={() => onSave(ring)}><i className="fas fa-floppy-disk me-1" />Save Area</button>
            </div>
          </div>
          <div className="cds-map" style={{ height: 480 }}>
            <MapContainer center={[store.lat, store.lng]} zoom={12} style={{ width: '100%', height: '100%', cursor: 'crosshair' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
              {others.filter((o) => o.polygon.length >= 3).map((o) => <Polygon key={o.id} positions={o.polygon} pathOptions={{ color: OUTSIDE_COLOR, weight: 1, fillOpacity: 0.06, dashArray: '4 4' }}><Tooltip sticky>{o.name}</Tooltip></Polygon>)}
              {ring.length >= 3 && <Polygon positions={ring} pathOptions={{ color: '#2563eb', weight: 2, fillOpacity: 0.15 }} />}
              {ring.length === 2 && <Polyline positions={ring} pathOptions={{ color: '#2563eb', weight: 2 }} />}
              {retailers.map((r) => <CircleMarker key={r.id} center={[r.lat, r.lng]} radius={3} pathOptions={{ color: inside.includes(r) ? '#2563eb' : OUTSIDE_COLOR, weight: 1, fillOpacity: 0.8 }} />)}
              {ring.map((p, i) => (
                <Marker key={i} position={p} icon={vertexIcon} draggable
                  eventHandlers={{ dragend: (e) => { const ll = (e.target as L.Marker).getLatLng(); setRing((r) => r.map((x, j) => (j === i ? [Math.round(ll.lat * 1e6) / 1e6, Math.round(ll.lng * 1e6) / 1e6] : x))); } }} />
              ))}
              <Marker position={[store.lat, store.lng]} icon={storeIcon('#2563eb')}><Tooltip direction="top" offset={[0, -12]}>{store.name}</Tooltip></Marker>
              <ClickToAdd onAdd={(p) => setRing((r) => [...r, p])} />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
