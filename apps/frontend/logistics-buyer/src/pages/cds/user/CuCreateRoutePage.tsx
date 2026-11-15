// CDS User — Create Delivery Route (/cds/delivery-planning/create). Replica of the LBNP Create Delivery Route screen
// (src/pages/delivery-routes/CreateDeliveryRoutePage.tsx) and its Optimized Delivery Routes modal
// (OptimizedRoutesModal.tsx, RouteMapView.tsx) on the CDS store's Ready for Delivery orders.
// CDS differences: no beats (Locality takes the Beat's place), no sales person, no Self Fleet / 3PL choice, no delivery
// cost; the delivery date is tomorrow or later (next-day rule). Deliverable units per line = accepted − delivered.
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import dayjs, { type Dayjs } from 'dayjs';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import DataLoading from '../../../components/DataLoading';
import { cdsApi, type OrderRow } from '../../../api/services/cds.service';
import { round2, routeMetrics, sequenceStops } from '../../../cds/planning';
import type { CdsStore, OrderLine, Retailer } from '../../../cds/types';
import { toastWarning } from '../../../utils/helpers';
import { addCurrency, addWeight } from '../../../utils/pipes';
import { fmtDate, fmtNumber, MONTH_SHORT } from '../../delivery-routes/drFormat';
import { ROUTE_COLORS } from '../../delivery-routes/RouteMapView';
import { alertError, downloadCsv, toast, useLoad, useMeta } from '../ui';
import '../../delivery-routes/CreateDeliveryRoutePage.css';
import '../../delivery-routes/OptimizedRoutesModal.css';
import '../../delivery-routes/RouteMapView.css';
import './CuRoutePages.css';

// ---------------------------------------------------------------- helpers

const left = (l: OrderLine) => Math.max(0, l.acceptedQty - l.deliveredQty);
/** Weight still to deliver (accepted at the CDS, not yet delivered). */
const orderKg = (o: { lines: OrderLine[] }) => round2(o.lines.reduce((s, l) => s + left(l) * l.unitWeightKg, 0));
/** Value still to deliver. */
const orderValue = (o: { lines: OrderLine[] }) => round2(o.lines.reduce((s, l) => s + left(l) * l.unitPrice, 0));
const uniq = <T,>(xs: T[]) => Array.from(new Set(xs));
const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0);
const pad = (n: number) => String(n).padStart(2, '0');
/** Local calendar day "YYYY-MM-DD" of an ISO time. */
const localDay = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const localDate = (ymd: string) => new Date(`${ymd}T00:00:00`);
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ordinal = (d: number) => (d >= 11 && d <= 13 ? 'th' : d % 10 === 1 ? 'st' : d % 10 === 2 ? 'nd' : d % 10 === 3 ? 'rd' : 'th');
/** "November 16th, 2026" (same as LBNP). */
const formatDisplayDate = (ymd: string) => {
  if (!ymd) return '';
  const d = localDate(ymd);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}${ordinal(d.getDate())}, ${d.getFullYear()}`;
};
/** "16 Nov 2026" */
const formatDeliveryDate = (ymd: string) => {
  const [y, m, d] = (ymd || '').split('-').map(Number);
  return y && m && d ? `${d} ${MONTH_SHORT[m - 1]} ${y}` : '';
};
const fmtEta = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
const pct = (load: number, cap: number) => (cap > 0 ? round2((load / cap) * 100) : 0);
const colorOf = (i: number) => ROUTE_COLORS[i % ROUTE_COLORS.length];

/** One row of the Available Orders table. */
interface Row {
  id: string;
  orderNo: string;
  orderDate: string;
  day: string;
  retailerId: string;
  retailerName: string;
  locality: string;
  distributorName: string;
  value: number;
  kg: number;
  order: OrderRow;
}
type SortKey = 'orderDate' | 'retailerName' | 'locality' | 'distributorName' | 'orderNo' | 'value' | 'kg';
const NUMERIC: SortKey[] = ['value', 'kg'];

interface DropdownState { open: boolean; style: React.CSSProperties; search: string; checked: Set<string> }
const closedDropdown = (): DropdownState => ({ open: false, style: {}, search: '', checked: new Set() });

interface PlanRequest { plannedDate: string; orders: OrderRow[] }

/** A proposed route being reviewed (one vehicle). Retailers are in visiting order from the CDS store. */
interface EditRoute {
  key: string;
  name: string;
  vehicleId: string;
  vehicleRegNo: string;
  vehicleType: string;
  capacityKg: number;
  retailers: Retailer[];
  orderIds: string[];
  localities: string[];
  loadKg: number;
  orderValue: number;
  distanceKm: number;
  etaMinutes: number;
}

/**
 * Recomputes a route after a move: visiting order and distance / time the same way the CDS API does (nearest
 * neighbour + 2-opt from the store), load and value from the order rows. The API recomputes and checks on confirm.
 */
function rebuild(r: EditRoute, retailers: Retailer[], orderIds: string[], store: CdsStore | undefined, byId: Map<string, OrderRow>): EditRoute {
  const origin = store ?? retailers[0];
  const seq = origin && retailers.length ? sequenceStops(origin, retailers).map((i) => retailers[i]) : [];
  const m = origin && seq.length ? routeMetrics([origin, origin, ...seq], seq.length + 1) : { distanceKm: 0, etaMinutes: 0 };
  const os = orderIds.map((id) => byId.get(id)).filter((o): o is OrderRow => !!o);
  return {
    ...r, retailers: seq, orderIds, localities: uniq(seq.map((x) => x.locality)),
    loadKg: round2(sum(os, orderKg)), orderValue: round2(sum(os, orderValue)), distanceKm: m.distanceKm, etaMinutes: m.etaMinutes,
  };
}

// ---------------------------------------------------------------- icons (LBNP Create Delivery Route)

const FunnelIcon = ({ size = 14, stroke = 'currentColor' }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const SortArrow = ({ dir }: { dir: 'asc' | 'desc' }) => (
  <svg className="sort-arrow" width="8" height="14" viewBox="0 0 8 14" style={{ transform: dir === 'asc' ? 'rotate(180deg)' : undefined }}>
    <rect x="3" y="0" width="2" height="9" fill="#2563eb" />
    <polygon points="0,8 8,8 4,14" fill="#2563eb" />
  </svg>
);

// ---------------------------------------------------------------- Map View (LBNP RouteMapView)

const storeIcon = L.divIcon({
  className: 'cds-map-pin',
  html: '<span style="background:#1a1a2e;border-radius:6px"><i class="fas fa-warehouse" style="font-size:12px"></i></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});
const stopIcon = (color: string, n: number) =>
  L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:50%;"><span style="color:#fff;font-size:11px;font-weight:700;line-height:1;">${n}</span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

function FitTo({ points, fullscreen }: { points: [number, number][]; fullscreen: boolean }) {
  const map = useMap();
  const key = JSON.stringify(points);
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 14);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 300);
    return () => window.clearTimeout(t);
  }, [map, fullscreen]);
  return null;
}

function CuRoutesMapView({ routes, store, byId, onMove }: {
  routes: EditRoute[]; store: CdsStore | undefined; byId: Map<string, OrderRow>; onMove: (retailerId: string, fromKey: string, toKey: string) => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const anchorRef = useRef<number | null>(null);
  const [expandedKpi, setExpandedKpi] = useState<Set<number>>(new Set());
  const [fullscreen, setFullscreen] = useState(false);

  const layers = useMemo(() => routes.map((r, i) => {
    const color = colorOf(i);
    const stops = r.retailers.map((c, k) => {
      const orders = r.orderIds.map((id) => byId.get(id)).filter((o): o is OrderRow => !!o && o.retailerId === c.id);
      return { c, seq: k + 1, orders, icon: stopIcon(color, k + 1) };
    });
    const line: [number, number][] = [...(store ? [[store.lat, store.lng] as [number, number]] : []), ...r.retailers.map((c) => [c.lat, c.lng] as [number, number])];
    return { r, color, stops, line };
  }), [routes, store, byId]);

  const localityTotals = useMemo(() => {
    const m: Record<string, number> = {};
    routes.forEach((r) => r.retailers.forEach((c) => (m[c.locality] = (m[c.locality] || 0) + 1)));
    return m;
  }, [routes]);

  const visible = layers.filter((_, i) => selected.size === 0 || selected.has(i));
  const points: [number, number][] = [...(store && selected.size === 0 ? [[store.lat, store.lng] as [number, number]] : []), ...visible.flatMap((l) => l.stops.map((s) => [s.c.lat, s.c.lng] as [number, number]))];

  const showAllRoutes = () => {
    anchorRef.current = null;
    setSelected(new Set());
  };
  const onItemClick = (e: React.MouseEvent, i: number) => {
    let next: Set<number>;
    if (e.shiftKey) {
      const a = anchorRef.current ?? i;
      next = new Set();
      for (let k = Math.min(a, i); k <= Math.max(a, i); k++) next.add(k);
    } else if (e.ctrlKey || e.metaKey) {
      next = new Set(selected);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      anchorRef.current = i;
    } else {
      next = new Set([i]);
      anchorRef.current = i;
    }
    if (next.size === 0) showAllRoutes();
    else setSelected(next);
  };

  return (
    <div className={`route-map-view map-view-container${fullscreen ? ' map-fullscreen' : ''}`}>
      <div className="map-sidebar">
        <button className={`show-all-btn${selected.size === 0 ? ' active' : ''}`} onClick={showAllRoutes}>
          <i className="fas fa-layer-group" /> Show All Routes{' '}
        </button>
        <div className="map-hint">Click a route to focus it · Shift-click for a range · Ctrl/⌘-click to add · Click a stop to move it</div>
        {layers.map(({ r, color }, i) => {
          const expanded = expandedKpi.has(i);
          const util = pct(r.loadKg, r.capacityKg);
          const inRoute: Record<string, number> = {};
          r.retailers.forEach((c) => (inRoute[c.locality] = (inRoute[c.locality] || 0) + 1));
          const locs = Object.entries(inRoute).sort((a, b) => b[1] - a[1]);
          return (
            <div
              key={r.key}
              className={`route-item${selected.has(i) ? ' active' : ''}`}
              title="Click to focus · Shift-click for a range · Ctrl/⌘-click to add"
              onMouseDown={(e) => e.shiftKey && e.preventDefault()}
              onClick={(e) => onItemClick(e, i)}
            >
              <div className="route-item-header">
                <span className="route-dot" style={{ background: color }} />
                <strong>{r.name}</strong>
                <span className="direction-badge">{r.vehicleRegNo}</span>
              </div>
              <div className="route-item-details">
                <div>{r.retailers.length} stops · {fmtNumber(r.distanceKm, 1, 1)} km</div>
                <div>₹{fmtNumber(r.orderValue, 2, 2)} · {fmtEta(r.etaMinutes)} · {r.vehicleType}</div>
                <div>Wt: {fmtNumber(r.loadKg, 2, 2)} kg · Cap: {r.capacityKg} kg</div>
              </div>
              <div className="kpi-box">
                <div className="kpi-row">
                  <span className="kpi-label">Vehicle Utilized</span>
                  <span className={`kpi-value${util > 100 ? ' text-danger' : ''}`}>{fmtNumber(util, 0, 0)}%</span>
                </div>
                <span
                  className="kpi-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedKpi((s) => {
                      const n = new Set(s);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    });
                  }}
                >
                  {expanded ? '▲ Hide details' : '▼ Show details'}
                </span>
              </div>
              {expanded && (
                <div className="route-beats">
                  <div className="route-beats-title">{locs.length} localities:</div>
                  <div className="route-beat-tags">
                    {locs.map(([name, n]) => {
                      const total = localityTotals[name] || n;
                      return (
                        <span key={name} className="route-beat-tag" style={{ borderLeftColor: color }}>
                          {name} ({n}/{total}) <span className="beat-pct">{Math.round((n / total) * 100)}%</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="map-wrapper">
        <MapContainer id="route-map" center={store ? [store.lat, store.lng] : [17.4, 78.5]} zoom={12} style={{ width: '100%', height: '100%' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
          {store && (
            <Marker position={[store.lat, store.lng]} icon={storeIcon}>
              <Tooltip direction="top" offset={[0, -12]}><b>{store.name}</b> · start</Tooltip>
            </Marker>
          )}
          {visible.map(({ r, color, stops, line }) => (
            <Fragment key={r.key}>
              {line.length >= 2 && <Polyline positions={line} pathOptions={{ color, weight: 3, opacity: 0.5, dashArray: '8 4' }} />}
              {stops.map(({ c, seq, orders, icon }) => (
                <Marker key={`${r.key}-${c.id}`} position={[c.lat, c.lng]} icon={icon}>
                  <Popup maxWidth={360} maxHeight={420}>
                    <div className="cu-map-popup">
                      <div className="cu-map-popup-head" style={{ background: color }}>
                        <strong>{c.name}</strong>
                        <div>{c.ownerName}</div>
                      </div>
                      <div className="cu-map-popup-body">
                        <table>
                          <tbody>
                            <tr><td>Retailer ID</td><td className="fw-semibold">{c.code}</td></tr>
                            <tr><td>Stop #</td><td className="fw-semibold">{seq}</td></tr>
                            <tr><td>Mobile</td><td><a href={`tel:${c.phone}`} style={{ color: '#2563eb' }}>{c.phone || '-'}</a></td></tr>
                            <tr><td>Locality</td><td>{c.locality || '-'}</td></tr>
                            <tr><td>Route</td><td>{r.name} · {r.vehicleRegNo}</td></tr>
                            <tr><td>Order Value</td><td className="fw-semibold">₹{sum(orders, orderValue).toLocaleString('en-IN')}</td></tr>
                            <tr><td>Order Count</td><td>{orders.length}</td></tr>
                            <tr><td>Weight</td><td>{round2(sum(orders, orderKg))} kg</td></tr>
                            <tr><td>Address</td><td>{c.address}</td></tr>
                          </tbody>
                        </table>
                        <hr />
                        <div className="cu-map-popup-title">Orders ({orders.length})</div>
                        <table className="cu-map-popup-orders">
                          <thead><tr><th>#</th><th>Order No.</th><th>Value</th><th>Wt</th></tr></thead>
                          <tbody>
                            {orders.map((o, k) => (
                              <tr key={o.id}><td>{k + 1}</td><td>{o.orderNo}</td><td>₹{orderValue(o).toLocaleString('en-IN')}</td><td>{orderKg(o)} kg</td></tr>
                            ))}
                          </tbody>
                        </table>
                        {routes.length >= 2 && (
                          <>
                            <hr />
                            <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>Move to:</div>
                            <div className="cu-map-popup-move">
                              {layers.filter((x) => x.r.key !== r.key).map((x) => (
                                <button key={x.r.key} style={{ background: x.color }} onClick={() => onMove(c.id, r.key, x.r.key)}>{x.r.name}</button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </Fragment>
          ))}
          <FitTo points={points} fullscreen={fullscreen} />
        </MapContainer>
        <button className="map-fullscreen-btn" title={fullscreen ? 'Exit Fullscreen' : 'Expand Map'} onClick={() => setFullscreen((f) => !f)}>
          <i className={`fas ${fullscreen ? 'fa-compress' : 'fa-expand'}`} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Optimized Delivery Routes modal (LBNP OptimizedRoutesModal)

function CuOptimizedRoutesModal({ plan, store, onClose, onConfirmed }: { plan: PlanRequest; store: CdsStore | undefined; onClose: () => void; onConfirmed: () => void }) {
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<EditRoute[]>([]);
  const [unplanned, setUnplanned] = useState<string[]>([]);
  const [tab, setTab] = useState<'routes' | 'mapView'>('routes');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [locSectionOpen, setLocSectionOpen] = useState(false);
  const [hoveredLoc, setHoveredLoc] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const byId = useMemo(() => new Map(plan.orders.map((o) => [o.id, o])), [plan]);

  useEffect(() => {
    let live = true;
    cdsApi.planRoutes({ orderIds: plan.orders.map((o) => o.id), plannedDate: plan.plannedDate }).then(
      (res) => {
        if (!live) return;
        setRoutes(res.routes.map((r, i) => ({
          key: r.vehicleId, name: `Route ${i + 1}`, vehicleId: r.vehicleId, vehicleRegNo: r.vehicleRegNo, vehicleType: r.vehicleType, capacityKg: r.capacityKg,
          retailers: r.retailers.filter((x): x is Retailer => !!x), orderIds: [...r.orderIds], localities: r.localities,
          loadKg: r.loadKg, orderValue: r.orderValue, distanceKm: r.distanceKm, etaMinutes: r.etaMinutes,
        })));
        setUnplanned(res.unplannedOrderIds);
        setLoading(false);
      },
      (e) => {
        if (!live) return;
        void alertError(e);
        onClose();
      },
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const used = useMemo(() => routes.filter((r) => r.orderIds.length > 0), [routes]);
  const summary = useMemo(() => {
    const W = Math.ceil(sum(used, (r) => r.loadKg));
    const A = Math.ceil(sum(used, (r) => r.orderValue));
    const cap = sum(used, (r) => r.capacityKg);
    const counts: Record<string, number> = {};
    used.forEach((r) => (counts[r.vehicleType] = (counts[r.vehicleType] || 0) + 1));
    return { W, A, util: cap > 0 ? round2((W / cap) * 100) : 0, counts, points: sum(used, (r) => r.retailers.length) };
  }, [used]);
  const localityMetrics = useMemo(() => {
    const m = new Map<string, { total: number; trips: Map<string, number> }>();
    routes.forEach((r) => r.retailers.forEach((c) => {
      const e = m.get(c.locality) ?? { total: 0, trips: new Map<string, number>() };
      e.total += 1;
      e.trips.set(r.name, (e.trips.get(r.name) || 0) + 1);
      m.set(c.locality, e);
    }));
    return Array.from(m.entries())
      .map(([name, e]) => ({ name, total: e.total, trips: Array.from(e.trips.entries()).sort((a, b) => b[1] - a[1]) }))
      .sort((a, b) => b.total - a.total);
  }, [routes]);
  const unplannedRows = unplanned.map((id) => byId.get(id)).filter((o): o is OrderRow => !!o);

  const move = (retailerId: string, fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    const from = routes.find((r) => r.key === fromKey);
    const to = routes.find((r) => r.key === toKey);
    const retailer = from?.retailers.find((x) => x.id === retailerId);
    if (!from || !to || !retailer) return;
    const moving = from.orderIds.filter((id) => byId.get(id)?.retailerId === retailerId);
    const nextFrom = rebuild(from, from.retailers.filter((x) => x.id !== retailerId), from.orderIds.filter((id) => !moving.includes(id)), store, byId);
    const nextTo = rebuild(to, [...to.retailers, retailer], [...to.orderIds, ...moving], store, byId);
    setRoutes((rs) => rs.map((r) => (r.key === fromKey ? nextFrom : r.key === toKey ? nextTo : r)));
    if (nextTo.loadKg > nextTo.capacityKg) {
      toastWarning('Over vehicle capacity', `${nextTo.vehicleRegNo} carries ${nextTo.capacityKg} kg; ${nextTo.name} now weighs ${Math.ceil(nextTo.loadKg)} kg. Move a retailer to another route before you confirm.`);
    }
  };

  const downloadRoutesCSV = () => {
    const cols = [
      { key: 'deliveryDate', label: 'Delivery Date' }, { key: 'route', label: 'Route' }, { key: 'vehicle', label: 'Vehicle' }, { key: 'vehicleType', label: 'Vehicle Type' },
      { key: 'capacity', label: 'Vehicle Capacity (kg)' }, { key: 'load', label: 'Orders Weight (kg)' }, { key: 'util', label: 'Vehicle Utilized %' },
      { key: 'points', label: 'Number of Points' }, { key: 'orders', label: 'Number of Orders' }, { key: 'localities', label: 'Localities' },
      { key: 'stops', label: 'Stops (visiting order)' }, { key: 'km', label: 'KMs' }, { key: 'time', label: 'Travel Time' }, { key: 'value', label: 'Order Value' },
    ];
    downloadCsv(`routes-${plan.plannedDate}`, cols, routes.map((r) => ({
      deliveryDate: plan.plannedDate, route: r.name, vehicle: r.vehicleRegNo, vehicleType: r.vehicleType, capacity: r.capacityKg, load: r.loadKg,
      util: pct(r.loadKg, r.capacityKg), points: r.retailers.length, orders: r.orderIds.length, localities: r.localities.join(', '),
      stops: r.retailers.map((c, i) => `${i + 1}. ${c.name}`).join(' | '), km: r.distanceKm, time: fmtEta(r.etaMinutes), value: r.orderValue,
    })));
  };

  const onConfirm = async () => {
    if (!routes.length) {
      toastWarning('Failed to get routes!', 'No route data available');
      return;
    }
    if (!used.length) {
      toastWarning('No routes to confirm!', 'All routes are empty');
      return;
    }
    setConfirming(true);
    try {
      await cdsApi.confirmRoutes({ plannedDate: plan.plannedDate, routes: used.map((r) => ({ vehicleId: r.vehicleId, orderIds: r.orderIds })) });
      void toast('Routes created successfully');
      onConfirmed();
    } catch (e) {
      void alertError(e);
      setConfirming(false);
    }
  };

  const toggleRoute = (key: string) => setExpanded((s) => {
    const n = new Set(s);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    return n;
  });

  return (
    <div className="optimized-routes-modal modal-overlay">
      <div className={`modal-container${tab === 'mapView' ? ' modal-container-wide' : ''}`}>
        <div className="modal-header">
          <h2>Optimized Delivery Routes</h2>
          <button className="close-button" aria-label="Close" onClick={onClose}><i className="fas fa-times" /></button>
        </div>

        {(loading || confirming) && <DataLoading message={confirming ? 'Confirming routes...' : 'Loading optimized routes...'} showTip />}

        {!loading && !confirming && (
          <>
            <div className="modal-body">
              <div className="sub-tabs">
                <div className="sub-tab-list">
                  <div className={`sub-tab${tab === 'routes' ? ' active' : ''}`} onClick={() => setTab('routes')}> Routes </div>
                  <div className={`sub-tab${tab === 'mapView' ? ' active' : ''}`} onClick={() => setTab('mapView')}>
                    <i className="fas fa-map-marked-alt" style={{ marginRight: 4 }} /> Map View{' '}
                  </div>
                </div>
                <button style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 13 }} onClick={downloadRoutesCSV}> Download CSV </button>
              </div>

              {unplannedRows.length > 0 && (
                <div className="cds-note warn mt-3">
                  <i className="fas fa-triangle-exclamation mt-1" />
                  <div>
                    <b>{unplannedRows.length} order{unplannedRows.length === 1 ? '' : 's'} could not be planned</b> — no free vehicle of your CDS has room for {unplannedRows.length === 1 ? 'it' : 'them'} on {formatDeliveryDate(plan.plannedDate)}. {unplannedRows.length === 1 ? 'It stays' : 'They stay'} Ready for Delivery; plan {unplannedRows.length === 1 ? 'it' : 'them'} for another day.
                    <ul className="cu-unplanned-list">
                      {unplannedRows.map((o) => <li key={o.id}>{o.orderNo} · {o.retailerName} ({o.locality}) · {orderKg(o)} kg</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {tab === 'routes' && (
                <div className="routes-tab">
                  <div className="summary-section">
                    <div className="summary-item">
                      <div className="summary-label">Total Vehicle Types ({used.length} vehicles)</div>
                      <div className="summary-value">
                        {Object.entries(summary.counts).map(([t, n]) => <div key={t}>{t} <strong>({n})</strong></div>)}
                        {!used.length && '-'}
                      </div>
                    </div>
                    <div className="summary-item"><div className="summary-label">Total Delivery Points</div><div className="summary-value">{summary.points}</div></div>
                    <div className="summary-item"><div className="summary-label">Total Weight</div><div className="summary-value">{summary.W.toLocaleString('en-IN')} kgs</div></div>
                    <div className="summary-item"><div className="summary-label">Average Vehicle Utilization</div><div className="summary-value">{fmtNumber(summary.util, 2, 2)}%</div></div>
                    <div className="summary-item"><div className="summary-label">Total Order Value</div><div className="summary-value">₹ {summary.A.toLocaleString('en-IN')}</div></div>
                  </div>

                  {localityMetrics.length > 0 && (
                    <div className="beat-metrics-section">
                      <h3 onClick={() => setLocSectionOpen((x) => !x)}>
                        Delivery Points by Locality <i className={`fas ${locSectionOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                      </h3>
                      {locSectionOpen && (
                        <div className="beat-grid">
                          {localityMetrics.map((b) => (
                            <div key={b.name} className="beat-card" onMouseEnter={() => setHoveredLoc(b.name)} onMouseLeave={() => setHoveredLoc(null)}>
                              <div className="beat-name" title={b.name}>{b.name}</div>
                              <div className="beat-points">{b.total}<span> pts</span></div>
                              <div className={`beat-trips${b.trips.length > 1 ? ' multi-trip' : ''}`}>{b.trips.length} {b.trips.length === 1 ? 'trip' : 'trips'}</div>
                              {hoveredLoc === b.name && (
                                <div className="beat-tooltip">
                                  {b.trips.map(([route, n]) => (
                                    <div key={route} className="beat-tooltip-row"><span className="tt-route">{route}</span><span className="tt-points">{n} pts</span></div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {routes.map((r) => {
                    const util = pct(r.loadKg, r.capacityKg);
                    const over = r.loadKg > r.capacityKg;
                    const ordersOf = (retailerId: string) => r.orderIds.map((id) => byId.get(id)).filter((o): o is OrderRow => !!o && o.retailerId === retailerId);
                    return (
                      <div key={r.key} className="route-card">
                        <div className="route-header">
                          <div className="route-title"><i className="fas fa-route" /> {r.name} · {r.vehicleRegNo}</div>
                          <div className="route-meta">
                            {r.localities.length > 0 && <span className="cu-route-localities">{r.localities.join(', ')}</span>}
                            <span className="meta-date">{formatDeliveryDate(plan.plannedDate)}</span>
                          </div>
                        </div>
                        {over && (
                          <div className="cu-over-capacity">
                            <i className="fas fa-triangle-exclamation" />Over vehicle capacity by {Math.ceil(r.loadKg - r.capacityKg)} kg — move a retailer to another route before you confirm.
                          </div>
                        )}
                        <div className="route-stats">
                          <div className="stat">
                            <div className="stat-label">Vehicle / Actual Wt / Vehicle Utilization</div>
                            <div className="stat-value">
                              {r.vehicleType} ({fmtNumber(r.capacityKg, 0, 0)} kg) /<span>{fmtNumber(r.loadKg, 0, 0)} kgs</span> /<span className={over ? 'text-danger' : ''}>{fmtNumber(util, 2, 2)}%</span>
                            </div>
                          </div>
                          <div className="stat">
                            <div className="stat-label">Order Value / Distance / Travel Time</div>
                            <div className="stat-value">
                              {' '}₹ {fmtNumber(r.orderValue, 0, 0)} /<span>{fmtNumber(r.distanceKm, 1, 1)} km</span> /<span>{fmtEta(r.etaMinutes)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="orders-section">
                          <div className="orders-header" onClick={() => toggleRoute(r.key)}>
                            Delivery Points ({r.retailers.length}) <i className={`fas ${expanded.has(r.key) ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                          </div>
                          {expanded.has(r.key) && (
                            <div className="customer-list">
                              {r.retailers.map((c, i) => {
                                const os = ordersOf(c.id);
                                return (
                                  <div key={c.id} className="customer-row">
                                    <div>
                                      <span className="cu-stop-no">{i + 1}</span><i className="fas fa-map-marker-alt" /> {c.name}
                                      <span className="cu-locality">· {c.locality}</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="order-pill">{os.length} orders · {round2(sum(os, orderKg))} kg</span>
                                      {routes.length >= 2 && (
                                        <select
                                          className="form-select form-select-sm cu-move-select"
                                          aria-label={`Move ${c.name} to another route`}
                                          value=""
                                          onChange={(e) => e.target.value && move(c.id, r.key, e.target.value)}
                                        >
                                          <option value="">Move to…</option>
                                          {routes.filter((x) => x.key !== r.key).map((x) => <option key={x.key} value={x.key}>{x.name} · {x.vehicleRegNo}</option>)}
                                        </select>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {!r.retailers.length && (
                                <div className="customer-row text-muted">No delivery points — this route is left out when you confirm.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === 'mapView' && <CuRoutesMapView routes={routes} store={store} byId={byId} onMove={move} />}
            </div>
            <div className="modal-footer">
              <button className="btn-back" onClick={onClose}>Back</button>
              <button className="btn-confirm-routes" onClick={() => void onConfirm()}> Confirm Routes </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- page

export function CuCreateRoutePage() {
  const navigate = useNavigate();
  const meta = useMeta();
  const orders = useLoad(() => cdsApi.searchOrders({ statuses: ['READY_FOR_DELIVERY'], pageSize: 0 }), []);
  const tomorrow = meta.data?.tomorrow ?? '';
  const store = meta.data?.stores[0];
  const [pickedDate, setPickedDate] = useState('');
  const deliveryDate = pickedDate && (!tomorrow || pickedDate >= tomorrow) ? pickedDate : tomorrow;
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [appliedLocalities, setAppliedLocalities] = useState<string[]>([]);
  const [dd, setDd] = useState<DropdownState>(closedDropdown);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'orderDate', dir: 'desc' });
  const [plan, setPlan] = useState<PlanRequest | null>(null);

  const rows = useMemo<Row[]>(() => (orders.data?.rows ?? []).map((o) => ({
    id: o.id, orderNo: o.orderNo, orderDate: o.confirmedAt, day: localDay(o.confirmedAt), retailerId: o.retailerId, retailerName: o.retailerName,
    locality: o.locality, distributorName: o.distributorName, value: orderValue(o), kg: orderKg(o), order: o,
  })), [orders.data]);
  const availableDates = useMemo(() => uniq(rows.map((r) => r.day).filter(Boolean)).sort(), [rows]);
  const allLocalities = useMemo(() => uniq(rows.map((r) => r.locality).filter(Boolean)).sort(), [rows]);
  const filtered = useMemo(() => rows.filter((r) => !appliedLocalities.length || appliedLocalities.includes(r.locality)), [rows, appliedLocalities]);
  const tableData = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let c: number;
      if (sort.key === 'orderDate') c = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
      else if (NUMERIC.includes(sort.key)) c = (a[sort.key] as number) - (b[sort.key] as number);
      else c = String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''));
      return c * dir;
    });
  }, [filtered, sort]);

  const chosen = filtered.filter((r) => selected.has(r.id));
  const selectAll = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const setMany = (ids: string[], on: boolean) => setSelected((s) => {
    const n = new Set(s);
    ids.forEach((id) => (on ? n.add(id) : n.delete(id)));
    return n;
  });

  // ---- order date chips (all Ready orders of that day, like LBNP)
  const ordersForDate = (day: string) => rows.filter((r) => r.day === day);
  const isDateSelected = (day: string) => {
    const os = ordersForDate(day);
    return os.length > 0 && os.every((r) => selected.has(r.id));
  };
  const allDatesSelected = availableDates.length > 0 && availableDates.every(isDateSelected);

  // ---- sorting
  const onSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  // ---- locality filter dropdown
  const toggleFilter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (dd.open) {
      setDd((d) => ({ ...d, open: false }));
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 16;
    const above = spaceBelow < 360 && rect.top > 360;
    setDd({
      open: true,
      search: '',
      checked: new Set(appliedLocalities.length ? appliedLocalities : allLocalities),
      style: {
        position: 'fixed', left: rect.left, zIndex: 1001, maxHeight: Math.min(360, above ? rect.top - 16 : spaceBelow), overflow: 'auto',
        ...(above ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
      },
    });
  };
  const q = dd.search.trim().toLowerCase();
  const shownLocalities = q ? allLocalities.filter((n) => n.toLowerCase().includes(q)) : allLocalities;
  const ddSelectAll = shownLocalities.length > 0 && shownLocalities.every((n) => dd.checked.has(n));
  const setChecked = (names: string[], on: boolean) => setDd((d) => {
    const checked = new Set(d.checked);
    names.forEach((n) => (on ? checked.add(n) : checked.delete(n)));
    return { ...d, checked };
  });
  const applyFilter = () => {
    const checked = allLocalities.filter((n) => dd.checked.has(n));
    // same as LBNP: all checked → no filter; none checked → also no filter
    setAppliedLocalities(checked.length === allLocalities.length ? [] : checked);
    setDd((d) => ({ ...d, open: false }));
  };
  const clearFilter = () => {
    setAppliedLocalities([]);
    setDd((d) => ({ ...d, checked: new Set() })); // the dropdown stays open
  };

  // ---- plan routes
  const planRoutes = () => {
    if (!chosen.length) {
      toastWarning('Warning', 'Please select at least one order');
      return;
    }
    if (!deliveryDate) return;
    setPlan({ plannedDate: deliveryDate, orders: chosen.map((r) => r.order) });
  };

  const header = (key: SortKey, icon: string, label: string, centered = false, filter = false) => (
    <th className="mat-mdc-header-cell">
      <div className={`th-wrap${centered ? ' centered' : ''}`}>
        <div className="th-content sortable" onClick={() => onSort(key)}>
          <i className={`fas ${icon}`} /> {label}
          {sort.key === key && <SortArrow dir={sort.dir} />}
        </div>
        {filter && (
          <button className={`beat-filter-btn${appliedLocalities.length ? ' active' : ''}`} aria-label="Filter by locality" onClick={toggleFilter}>
            <FunnelIcon />
            {appliedLocalities.length > 0 && <span className="filter-badge">{appliedLocalities.length}</span>}
          </button>
        )}
      </div>
    </th>
  );

  const noOrders = !!orders.data && rows.length === 0;

  return (
    <div className="create-delivery-route-page create-route-container">
      <header className="orders-header">
        <button className="back-btn" aria-label="Back" onClick={() => navigate('/cds/delivery-planning')}><i className="fas fa-arrow-left" /></button>
        <h1><i className="fas fa-route" /> Create Delivery Route</h1>
      </header>

      <div className="route-card">
        <div className="card-content w-100 p-3">
          <div className="route-config-bar">
            <div className="config-item">
              <label className="config-label">Delivery Date</label>
              <div ref={fieldRef}>
                <TextField
                  size="small"
                  value={formatDisplayDate(deliveryDate)}
                  onClick={() => setPickerAnchor(fieldRef.current)}
                  sx={{ width: 200, cursor: 'pointer', '& input': { cursor: 'pointer' } }}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton size="small" edge="start" aria-label="Open calendar" onClick={(e) => { e.stopPropagation(); setPickerAnchor(fieldRef.current); }}>
                          <span className="material-icons" style={{ fontSize: 20 }}>calendar_today</span>
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
              <small className="text-muted">Tomorrow or a later day</small>
              <Popover open={!!pickerAnchor && !!tomorrow} anchorEl={pickerAnchor} onClose={() => setPickerAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
                <DateCalendar
                  value={deliveryDate ? dayjs(deliveryDate) : null}
                  minDate={dayjs(tomorrow)}
                  shouldDisableDate={(d: Dayjs) => d.format('YYYY-MM-DD') < tomorrow}
                  onChange={(v: Dayjs | null) => {
                    if (v) setPickedDate(v.format('YYYY-MM-DD'));
                    setPickerAnchor(null);
                  }}
                />
              </Popover>
            </div>
          </div>

          <div className="section">
            <h2>Order Dates</h2>
            <div className="date-options">
              {availableDates.map((d) => (
                <label key={d} className={`date-checkbox${isDateSelected(d) ? ' checked' : ''}`}>
                  <input type="checkbox" checked={isDateSelected(d)} onChange={() => setMany(ordersForDate(d).map((r) => r.id), !isDateSelected(d))} />
                  <span>{fmtDate(localDate(d), 'd-M-yyyy')}</span>
                </label>
              ))}
              {noOrders && <span className="text-muted small">No order dates</span>}
            </div>
            {availableDates.some(isDateSelected) && (
              <div className="selected-dates">
                <span className="selected-dates-label">Selected Dates:</span>
                {allDatesSelected ? (
                  <span className="date-tag">All dates selected <button aria-label="Clear all dates" onClick={() => setSelected(new Set())}><i className="fas fa-times" /></button></span>
                ) : (
                  availableDates.filter(isDateSelected).map((d) => (
                    <span key={d} className="date-tag">
                      {fmtDate(localDate(d), 'd-M-yyyy')}{' '}
                      <button aria-label={`Remove ${d}`} onClick={() => setMany(ordersForDate(d).map((r) => r.id), false)}><i className="fas fa-times" /></button>
                    </span>
                  ))
                )}
              </div>
            )}
          </div>

          {appliedLocalities.length > 0 && (
            <div className="applied-filters">
              <span className="applied-label"><FunnelIcon stroke="#4b5563" /> Locality Filters </span>
              {appliedLocalities.map((b) => (
                <span key={b} className="filter-chip">{b} <i className="fas fa-times" onClick={() => setAppliedLocalities((xs) => xs.filter((x) => x !== b))} /></span>
              ))}
              <span className="clear-all-link" onClick={() => setAppliedLocalities([])}>Clear all</span>
            </div>
          )}

          <div className="section">
            <div className="orders-title-row">
              <h2 className="mb-0">Available Orders</h2>
              <label className="select-all-checkbox">
                <input type="checkbox" checked={selectAll} onChange={(e) => setMany(filtered.map((r) => r.id), e.target.checked)} /> Select All
              </label>
            </div>
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th className="mat-mdc-header-cell select-col" />
                    {header('orderDate', 'fa-calendar', 'Order Date')}
                    {header('retailerName', 'fa-store', 'Retailer Name')}
                    {header('locality', 'fa-map-marker-alt', 'Locality', false, true)}
                    {header('distributorName', 'fa-industry', 'Distributor')}
                    {header('orderNo', 'fa-hashtag', 'Order No.')}
                    {header('value', 'fa-rupee-sign', 'Order Value', true)}
                    {header('kg', 'fa-weight-hanging', 'Weight (kg)', true)}
                  </tr>
                </thead>
                <tbody>
                  {orders.loading && !orders.data && (
                    <tr><td className="text-center py-4" colSpan={8}><span className="spinner-border spinner-border-sm text-primary me-2" />Loading orders...</td></tr>
                  )}
                  {orders.error && (
                    <tr><td className="text-center py-4 text-danger" colSpan={8}>{orders.error} <button className="btn btn-link btn-sm p-0 ms-2" onClick={orders.reload}>Retry</button></td></tr>
                  )}
                  {tableData.map((o) => (
                    <tr key={o.id} className="order-row">
                      <td className="select-col">
                        <input type="checkbox" aria-label={`Select ${o.orderNo}`} checked={selected.has(o.id)} onChange={(e) => setMany([o.id], e.target.checked)} />
                      </td>
                      <td>{fmtDate(o.orderDate, 'dd-MM-yyyy')}</td>
                      <td>{o.retailerName}</td>
                      <td>{o.locality}</td>
                      <td>{o.distributorName}</td>
                      <td>{o.orderNo}</td>
                      <td className="text-center">{addCurrency(o.value)}</td>
                      <td className="text-center">{addWeight(o.kg)}</td>
                    </tr>
                  ))}
                  {noOrders && (
                    <tr>
                      <td className="text-center py-4" colSpan={8}>
                        <i className="fas fa-inbox mb-3 text-muted" style={{ fontSize: '2rem' }} />
                        <p className="mb-0">No orders available</p>
                        <small className="text-muted">Orders appear here once they are Ready for Delivery at your CDS.</small>
                      </td>
                    </tr>
                  )}
                  {!noOrders && !!orders.data && tableData.length === 0 && (
                    <tr><td className="text-center py-4" colSpan={8}> No orders available </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="summary-row">
              <div><span className="text-primary"><i className="fas fa-list-ol" /> Selected Orders:</span> <span className="fw-bold">{chosen.length}</span></div>
              <div><span className="text-primary"><i className="fas fa-store" /> Retailers:</span> <span className="fw-bold">{uniq(chosen.map((r) => r.retailerId)).length}</span></div>
              <div><span className="text-primary"><i className="fas fa-rupee-sign" /> Total Order Value:</span> <span className="fw-bold">{addCurrency(sum(chosen, (r) => r.value))}</span></div>
              <div><span className="text-primary"><i className="fas fa-weight-hanging" /> Total Weight:</span> <span className="fw-bold">{addWeight(sum(chosen, (r) => r.kg))}</span></div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="cancel-btn" onClick={() => navigate('/cds/delivery-planning')}>Cancel</button>
            <button className="confirm-btn" disabled={!!plan || noOrders || !deliveryDate} onClick={planRoutes}>
              {plan ? <><i className="fas fa-spinner fa-spin" /> Planning…</> : 'Plan Routes'}
            </button>
          </div>
        </div>
      </div>

      {dd.open && (
        <>
          <div className="filter-backdrop" onClick={() => setDd((d) => ({ ...d, open: false }))} />
          <div className="filter-dropdown" style={dd.style} onClick={(e) => e.stopPropagation()}>
            <div className="filter-search">
              <i className="fas fa-search" />
              <input autoFocus placeholder="Search locality..." value={dd.search} onChange={(e) => { const search = e.target.value; setDd((d) => ({ ...d, search })); }} />
            </div>
            <div className="filter-list">
              <label className="filter-item select-all-item">
                <input type="checkbox" checked={ddSelectAll} onChange={() => setChecked(shownLocalities, !ddSelectAll)} />
                <span>SELECT ALL</span>
              </label>
              {shownLocalities.map((n) => (
                <label key={n} className="filter-item">
                  <input type="checkbox" checked={dd.checked.has(n)} onChange={() => setChecked([n], !dd.checked.has(n))} />
                  <span>{n}</span>
                </label>
              ))}
            </div>
            <div className="filter-footer">
              <span className="filter-count">{dd.checked.size} SELECTED</span>
              <div className="filter-actions">
                <button className="filter-clear" onClick={clearFilter}>Clear</button>
                <button className="filter-apply" onClick={applyFilter}>Apply</button>
              </div>
            </div>
          </div>
        </>
      )}

      {plan && (
        <CuOptimizedRoutesModal
          plan={plan}
          store={store}
          onClose={() => setPlan(null)}
          onConfirmed={() => {
            setPlan(null);
            navigate('/cds/delivery-planning');
          }}
        />
      )}
    </div>
  );
}
