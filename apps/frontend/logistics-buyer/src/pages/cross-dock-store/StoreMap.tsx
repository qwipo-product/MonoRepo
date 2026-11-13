// Map of one Cross Dock Store: its delivery area, its retailers, and optionally a rider's route with numbered stops.
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { XdCds, XdRetailer } from '../../types/crossDock';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors';

function badge(html: string, bg: string, size = 26) {
  return L.divIcon({
    className: 'sc-map-icon',
    html: `<div style="width:${size}px;height:${size}px;border-radius:8px;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);">${html}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function Fit({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

export interface RouteStop {
  seq: number;
  lat: number;
  lng: number;
  label: string;
  done?: boolean;
}

interface Props {
  store: XdCds;
  retailers: XdRetailer[];
  /** Retailers to emphasise (e.g. selected for a run). */
  highlight?: string[];
  route?: RouteStop[];
  height?: number;
}

export default function StoreMap({ store, retailers, highlight, route, height = 340 }: Props) {
  const pts = useMemo<[number, number][]>(() => (route?.length ? [[store.lat, store.lng], ...route.map((s) => [s.lat, s.lng] as [number, number])] : store.polygon), [store, route]);
  const home: [number, number] = [store.lat, store.lng];
  return (
    <div className="sc-map" style={{ height }}>
      <MapContainer center={home} zoom={14} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <Fit points={pts} />
        <Polygon positions={store.polygon} pathOptions={{ color: '#2563eb', weight: 2, fillOpacity: 0.08 }} />
        {retailers.map((rt) => {
          const on = highlight?.includes(rt.id);
          return (
            <CircleMarker key={rt.id} center={[rt.lat, rt.lng]} radius={on ? 6 : 4} pathOptions={{ color: '#fff', weight: 1, fillColor: on ? '#d97706' : '#2563eb', fillOpacity: on ? 1 : 0.6 }}>
              <Tooltip>{`${rt.name} · ${rt.locality}`}</Tooltip>
            </CircleMarker>
          );
        })}
        <Marker position={home} icon={badge('<i class="fas fa-store"></i>', '#1e3a8a', 30)}>
          <Tooltip direction="top" offset={[0, -14]}>{store.name}</Tooltip>
        </Marker>
        {route?.length ? (
          <>
            <Polyline positions={[home, ...route.map((s) => [s.lat, s.lng] as [number, number]), home]} pathOptions={{ color: '#1e3a8a', weight: 3, dashArray: '8 6', opacity: 0.8 }} />
            {route.map((s) => (
              <Marker key={s.seq} position={[s.lat, s.lng]} icon={badge(String(s.seq), s.done ? '#059669' : '#d97706', 22)} zIndexOffset={1000}>
                <Tooltip direction="right" offset={[12, 0]}>{`${s.seq}. ${s.label}`}</Tooltip>
              </Marker>
            ))}
          </>
        ) : null}
      </MapContainer>
    </div>
  );
}
