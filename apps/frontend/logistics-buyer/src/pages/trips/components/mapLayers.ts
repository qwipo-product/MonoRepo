// Port of TripsComponent.addHopsToLayerGroup + marker / popup builders (spec 04 §7.1).
import L from 'leaflet';
import type { Hop } from '../../../api/services/logisticsOrders.service';
import { addCurrency } from '../../../utils/pipes';
import { formatToIndianDateTime } from '../../../utils/helpers';

export type MapViewMode = 'both' | 'planned' | 'delivered';

export const MAP_CENTER: [number, number] = [17.4, 78.5];
export const MAP_ZOOM = 12;
export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors &copy; CARTO';
export const MULTI_TRIP_COLORS = ['#e63946', '#2a9d8f', '#e9c46a', '#264653', '#f4a261', '#7209b7'];

const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Single-trip marker colour by invoice value: < 3000 red, 3000–7000 orange, > 7000 green, missing → purple. */
export function invoiceColor(v: unknown): string {
  if (v === null || v === undefined || v === '') return '#800080';
  const n = Number(v);
  if (isNaN(n)) return '#800080';
  if (n < 3000) return '#E53935';
  if (n <= 7000) return '#FB8C00';
  return '#43A047';
}

function markerIcon(label: unknown, color: string, digital: boolean): L.DivIcon {
  const shared = `background:${color};width:24px;height:24px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);box-sizing:border-box;display:flex;align-items:center;justify-content:center;`;
  const html = digital
    ? `<div style="${shared}transform:rotate(45deg);"><span style="transform:rotate(-45deg);color:#fff;font-size:10px;font-weight:bold;line-height:1;">${esc(label)}</span></div>`
    : `<div style="${shared}border-radius:50%;color:#fff;font-size:11px;font-weight:bold;line-height:1;">${esc(label)}</div>`;
  // No className → Leaflet's default "leaflet-div-icon" class applies, like the original L.divIcon call.
  return L.divIcon({ html, iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12] });
}

function popupHtml(h: Hop): string {
  const line = (t: string) => `<div style="font-weight:600;">${t}</div>`;
  return `<div style="min-width:80px;display:flex;flex-direction:column;gap:4px;">${[
    line(`Retailer Name : ${esc(h.pointName || 'Stop')}`),
    line(`Order Type : ${h.isDigitalOnly ? 'Digital' : 'Sales'}`),
    line(`Invoice Value : ${esc(addCurrency(h.invoicevalue ?? 0))}`),
    // missing weight → literally "undefined Kg" (as-built)
    line(`Volumetric Weight : ${esc(String(h.weight))} Kg`),
    // undelivered → "NaN-NaN-NaN 12:NaN AM" (formatter receives the literal "N/A")
    line(`Delivery Time : ${esc(formatToIndianDateTime(h.deliveredAt || 'N/A'))}`),
  ].join('')}</div>`;
}

const isNum = (v: unknown) => v !== null && v !== undefined && v !== '' && !isNaN(Number(v));

/** Adds markers + polylines for a trip to `group`; returns every marker position (for fitBounds). */
export function addHopsToLayerGroup(group: L.LayerGroup, planned: Hop[], delivered: Hop[], color: string, mode: MapViewMode, isMulti: boolean): L.LatLngTuple[] {
  const points: L.LatLngTuple[] = [];
  if (mode === 'both' || mode === 'planned') {
    const sorted = [...planned].sort((a, b) => +a.stopNumber - +b.stopNumber);
    const line: L.LatLngTuple[] = [];
    sorted.forEach((h, i) => {
      if (!isNum(h.pointLat) || !isNum(h.pointLng)) return;
      const ll: L.LatLngTuple = [Number(h.pointLat), Number(h.pointLng)];
      const c = isMulti ? color : invoiceColor(h.invoicevalue);
      L.marker(ll, { icon: markerIcon(h.stopNumber ?? i + 1, c, !!h.isDigitalOnly) }).bindPopup(popupHtml(h), { maxWidth: 300 }).addTo(group);
      line.push(ll);
      points.push(ll);
    });
    if (line.length >= 2) L.polyline(line, { color: isMulti ? color : '#0000FF', weight: 2, opacity: 0.9, dashArray: '8 4' }).addTo(group);
  }
  if (mode === 'both' || mode === 'delivered') {
    const sorted = [...delivered].sort((a, b) => +(a.liveStopNumber as any) - +(b.liveStopNumber as any));
    const line: L.LatLngTuple[] = [];
    sorted.forEach((h, i) => {
      if (!isNum(h.liveLat) || !isNum(h.liveLng)) return;
      const ll: L.LatLngTuple = [Number(h.liveLat), Number(h.liveLng)];
      const c = isMulti ? color : invoiceColor(h.invoicevalue);
      L.marker(ll, { icon: markerIcon(h.liveStopNumber ?? i + 1, c, !!h.isDigitalOnly) }).bindPopup(popupHtml(h), { maxWidth: 300 }).addTo(group);
      line.push(ll);
      points.push(ll);
    });
    if (line.length >= 2) L.polyline(line, { color: isMulti ? color : '#800080', weight: 2, opacity: 0.8 }).addTo(group);
  }
  return points;
}
