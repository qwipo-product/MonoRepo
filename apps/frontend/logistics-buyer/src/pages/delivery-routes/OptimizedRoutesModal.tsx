// Screen B-2 — Optimized Delivery Routes modal (spec 03 §5). Always mounted by the Create page; `show` toggles it.
// The effect on the inputs mirrors Angular ngOnChanges (it runs on page load and on every input change).
import { useLayoutEffect, useState, useEffect, useReducer, useRef } from 'react';
import DataLoading from '../../components/DataLoading';
import { addressService } from '../../api/services/address.service';
import { deliveryRoutesService } from '../../api/services/routePlanning.service';
import { useAuth } from '../../hooks/useAuth';
import { toastSuccess, toastWarning } from '../../utils/helpers';
import { fmtNumber, MONTH_SHORT } from './drFormat';
import RouteMapView from './RouteMapView';
import './OptimizedRoutesModal.css';

export interface PlanOrder {
  orderId?: string;
  orderType?: string;
  orderAmount: number;
  orderDeadWeight?: number;
  orderVolWeight?: number;
  seq?: string;
}
export interface PlanCustomer {
  customerId: string;
  customerName?: string;
  customerBusinessName: string;
  customerMobileNumber?: string;
  beatName?: string | null;
  salesPersonName?: string | null;
  lat?: number | null;
  long?: number | null;
  seq: string;
  totalAmount: number;
  orderCount: number;
  totalDeadWeight: number;
  totalVolWeight: number;
  orders: PlanOrder[];
}
export interface PlanBeat { name: string; inRoute: number; total: number; coherencePct: number }
export interface PlanRoute {
  routeId: string;
  routeName: string;
  routeDirection?: string;
  vehicleType: string;
  vehicleCapacity: number;
  vehicleCost: number;
  customerCount: number;
  orderCount: number;
  distanceKm: number;
  estimatedTimeHours?: number;
  estimatedTimeFormatted?: string;
  totalAmount: number;
  totalWeightKg: number;
  totalVolWeightKg: number;
  vehicleUtilized: number;
  deliveryCostPercentage: number;
  digitalOrderPercentage: number;
  saleOrderPercentage: number;
  beatCoherenceScore?: number;
  beatCoherenceReason?: string;
  routeExplanation?: string;
  expectedDeliveryDate?: string;
  beats?: PlanBeat[];
  customers: PlanCustomer[];
  [k: string]: any;
}
export interface MoveCustomerEvent { customerId: string; fromRouteId: string; toRouteId: string }

interface Summary {
  totalWeight: string | number;
  totalInvoiceValue: string | number;
  totalDeliveryCost: string | number;
  totalVehicleUtilization: number;
  totalDeliveryPercentage: number;
  vehicleCounts: Record<string, number>;
  vehicleTypes: string[];
  totalDeliveryPoints?: number;
}
interface BeatMetric { beatName: string; totalPoints: number; tripCount: number; trips: { routeName: string; points: number }[] }

const round2 = (n: number) => Math.round(n * 100) / 100;
const round0 = (n: number) => Math.round(n);
const EMPTY_SUMMARY: Summary = { totalWeight: 0, totalInvoiceValue: 0, totalDeliveryCost: 0, totalVehicleUtilization: 0, totalDeliveryPercentage: 0, vehicleCounts: {}, vehicleTypes: [] };

export function calculateSummary(routes: PlanRoute[]): Summary {
  if (!routes.length) return { ...EMPTY_SUMMARY, vehicleCounts: {}, vehicleTypes: [] };
  const W = Math.ceil(routes.reduce((s, r) => s + (Number(r.totalVolWeightKg) || 0), 0));
  const A = Math.ceil(routes.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0));
  const C = Math.ceil(routes.reduce((s, r) => s + (Number(r.vehicleCost) || 0), 0));
  const cap = routes.reduce((s, r) => s + (Number(r.vehicleCapacity) || 0), 0);
  const vehicleCounts: Record<string, number> = {};
  const vehicleTypes: string[] = [];
  routes.forEach((r) => {
    const t = r.vehicleType || 'Unknown';
    if (!(t in vehicleCounts)) {
      vehicleCounts[t] = 0;
      vehicleTypes.push(t);
    }
    vehicleCounts[t] += 1;
  });
  return {
    totalWeight: W.toLocaleString('en-IN'),
    totalInvoiceValue: A.toLocaleString('en-IN'),
    totalDeliveryCost: C.toLocaleString('en-IN'),
    totalVehicleUtilization: cap > 0 ? round2((W / cap) * 100) : 0,
    totalDeliveryPercentage: A > 0 ? (C / A) * 100 : 0,
    vehicleCounts,
    vehicleTypes,
    totalDeliveryPoints: routes.reduce((s, r) => s + (Number(r.customerCount) || 0), 0),
  };
}

export function computeBeatMetrics(routes: PlanRoute[]): BeatMetric[] {
  const m = new Map<string, { totalPoints: number; trips: Map<string, number> }>();
  routes.forEach((r) => (r.customers || []).forEach((c) => {
    const b = c.beatName || 'No Beat';
    if (!m.has(b)) m.set(b, { totalPoints: 0, trips: new Map() });
    const e = m.get(b)!;
    e.totalPoints += 1;
    e.trips.set(r.routeName, (e.trips.get(r.routeName) || 0) + 1); // [as-built] keyed by routeName
  }));
  return Array.from(m.entries())
    .map(([beatName, e]) => ({
      beatName,
      totalPoints: e.totalPoints,
      tripCount: e.trips.size,
      trips: Array.from(e.trips.entries()).map(([routeName, points]) => ({ routeName, points })).sort((a, b) => b.points - a.points),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
const DIRECTIONS = ['East', 'Northeast', 'North', 'Northwest', 'West', 'Southwest', 'South', 'Southeast'];

/** spec 03 §5.7 step 8 */
function recomputeRoute(r: PlanRoute, F: Record<string, number>, depot: { lat: number; long: number }) {
  r.customerCount = r.customers.length;
  r.orderCount = r.customers.reduce((s, c) => s + (c.orderCount || c.orders?.length || 0), 0);
  r.totalAmount = r.customers.reduce((s, c) => s + (Number(c.totalAmount) || 0), 0);
  r.totalWeightKg = r.customers.reduce((s, c) => s + (Number(c.totalDeadWeight) || 0), 0);
  r.totalVolWeightKg = r.customers.reduce((s, c) => s + (Number(c.totalVolWeight) || 0), 0);
  r.vehicleUtilized = r.vehicleCapacity > 0 ? round2((r.totalVolWeightKg / r.vehicleCapacity) * 100) : 0;
  r.deliveryCostPercentage = r.totalAmount > 0 ? round2((r.vehicleCost / r.totalAmount) * 100) : 0;
  const all = r.customers.flatMap((c) => c.orders || []);
  const N = all.length;
  r.digitalOrderPercentage = N ? round0((all.filter((o) => o.orderType === 'Digital').length / N) * 100) : 0;
  r.saleOrderPercentage = N ? round0((all.filter((o) => o.orderType === 'Sales').length / N) * 100) : 0;
  const inRoute: Record<string, number> = {};
  r.customers.forEach((c) => {
    const b = c.beatName || 'No Beat';
    inRoute[b] = (inRoute[b] || 0) + 1;
  });
  const beats = Object.entries(inRoute)
    .map(([name, n]) => {
      const total = F[name] || n;
      return { name, inRoute: n, total, coherencePct: round0((n / total) * 100) };
    })
    .sort((a, b) => b.inRoute - a.inRoute);
  r.beats = beats;
  if (beats.length) r.beatCoherenceScore = round0(beats.reduce((s, b) => s + b.coherencePct, 0) / beats.length);
  const split = beats.filter((b) => b.coherencePct < 100);
  r.beatCoherenceReason = split.length
    ? `${split.length} of ${beats.length} sales beat${beats.length > 1 ? 's' : ''} are split across routes. ` +
      split.map((b) => `${b.name} has ${b.inRoute} of its ${b.total} delivery points in this route (${b.total - b.inRoute} assigned to other routes due to vehicle capacity or distance constraints)`).join('. ') +
      '. Beats are split when a single vehicle cannot serve all customers in a territory due to weight capacity limits or maximum stop constraints.'
    : undefined;
  const pts = r.customers.filter((c) => c.lat != null && c.long != null);
  if (pts.length && depot.lat !== 0 && depot.long !== 0) {
    const mLat = pts.reduce((s, c) => s + Number(c.lat), 0) / pts.length;
    const mLng = pts.reduce((s, c) => s + Number(c.long), 0) / pts.length;
    const angle = (Math.atan2(mLat - depot.lat, mLng - depot.long) * 180) / Math.PI;
    r.routeDirection = DIRECTIONS[Math.round(((angle + 360) % 360) / 45) % 8];
    const km = haversineKm(depot.lat, depot.long, mLat, mLng).toFixed(1);
    const full = beats.filter((b) => b.coherencePct === 100).length;
    r.routeExplanation = `Serves ${r.routeDirection} sector, ${km}km from depot. ${full}/${beats.length} beats fully contained. Vehicle ${r.vehicleUtilized}% utilized (${Math.round(r.totalWeightKg)}/${r.vehicleCapacity} kg).`;
  }
}

function formatDeliveryDate(ymd: string): string {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${d} ${MONTH_SHORT[m - 1]} ${y}`;
}

interface Props {
  show: boolean;
  selectedOrderNumbers: string[];
  selectedSLA: string;
  selectedDeliveryDate: string;
  selectedOrderDate: string;
  logisticsMode: string;
  onClose: () => void;
  onConfirm: () => void;
}

interface State {
  isLoading: boolean;
  routes: PlanRoute[];
  summary: Summary;
  beatMetrics: BeatMetric[];
  activeSubTab: 'routes' | 'mapView';
  expandedRoutes: Set<string>;
  beatSectionExpanded: boolean;
  hoveredBeat: string | null;
  buyerAddress: any;
  buyerAddressId: string;
}

export default function OptimizedRoutesModal(props: Props) {
  const { user } = useAuth();
  const buyerId = user?.id ?? '';
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [s] = useState<State>(() => ({
    isLoading: true, routes: [], summary: { ...EMPTY_SUMMARY }, beatMetrics: [], activeSubTab: 'routes', expandedRoutes: new Set(),
    beatSectionExpanded: false, hoveredBeat: null, buyerAddress: null, buyerAddressId: '',
  }));
  const propsRef = useRef(props);
  useLayoutEffect(() => {
    propsRef.current = props;
  }, [props]);

  const getRoutes = async () => {
    const p = propsRef.current;
    try {
      const body: { orderIds: string[]; buyerId: string; deliveryDate: string; logisticsMode?: string } = {
        orderIds: p.selectedOrderNumbers.map(String), buyerId, deliveryDate: p.selectedDeliveryDate,
      };
      if (p.logisticsMode) body.logisticsMode = p.logisticsMode;
      const res = await deliveryRoutesService.getOptimizedRoutes(body);
      if (!res?.success) return; // [as-built] loader never clears
      s.routes = res.data?.routes || [];
      s.summary = calculateSummary(s.routes);
      s.beatMetrics = computeBeatMetrics(s.routes);
      s.isLoading = false;
      force();
    } catch (e) {
      console.error('Error getting routes:', e);
      s.isLoading = false;
      force();
      propsRef.current.onClose();
      toastWarning('Failed to get routes!', 'There is some issue with the orders latitude and longitude');
    }
  };

  // ngOnChanges
  useEffect(() => {
    (async () => {
      s.isLoading = true;
      force();
      try {
        const res = await addressService.getDefaultAddress(buyerId);
        s.buyerAddress = res?.data;
        s.buyerAddressId = res?.data?.id || '';
        if (propsRef.current.show) {
          s.activeSubTab = 'routes';
          s.routes = [];
          s.expandedRoutes = new Set();
          s.beatSectionExpanded = false;
          force();
          await getRoutes();
        }
      } catch (e) {
        console.error('Error in ngOnChanges:', e);
        s.isLoading = false;
        force();
        toastWarning('Failed to get routes!', 'There is some issue with the orders latitude and longitude');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.show, props.selectedOrderNumbers, props.selectedSLA, props.selectedDeliveryDate, props.selectedOrderDate, props.logisticsMode]);

  const onBack = () => props.onClose();

  const downloadRoutesCSV = () => {
    const p = propsRef.current;
    const header = ['Order Date', 'Delivery Date', 'Route', 'Direction', 'Vehicle Name', 'Vehicle Capacity (kg)', 'Orders Vol Weight (kg)', 'Vehicle Utilized %', 'Number of Points', 'KMs', 'Travel Time', 'Invoice Value', 'Sales %', 'Digital %', 'Beat Coherence %', 'Total Beats', 'Beat Splits'];
    const beatRoutes: Record<string, Set<string>> = {};
    s.routes.forEach((r) => (r.customers || []).forEach((c) => {
      if (!c.beatName) return;
      (beatRoutes[c.beatName] ||= new Set()).add(r.routeId);
    }));
    const rows = s.routes.map((r) => {
      const beats = Array.from(new Set((r.customers || []).map((c) => c.beatName).filter((b): b is string => !!b)));
      const splits = beats.filter((b) => (beatRoutes[b]?.size || 0) > 1).map((b) => `${b}(${beatRoutes[b].size} trips)`);
      return [
        p.selectedOrderDate || '', r.expectedDeliveryDate || '', r.routeName, r.routeDirection, r.vehicleType, r.vehicleCapacity || 0,
        r.totalVolWeightKg || 0, r.vehicleUtilized || 0, r.customerCount || 0, r.distanceKm || 0, r.estimatedTimeFormatted, r.totalAmount || 0,
        r.saleOrderPercentage || 0, r.digitalOrderPercentage || 0, r.beatCoherenceScore || 0, beats.length, splits.length ? splits.join(', ') : 'No splits',
      ];
    });
    const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(q).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `routes-${p.selectedOrderDate || p.selectedDeliveryDate || new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  };

  const onConfirm = async () => {
    if (!s.routes.length) {
      toastWarning('Failed to get routes!', 'No route data available');
      return;
    }
    s.isLoading = true;
    force();
    try {
      const nonEmpty = s.routes.filter((r) => r.customers?.length > 0);
      if (!nonEmpty.length) {
        toastWarning('No routes to confirm!', 'All routes are empty');
        s.isLoading = false;
        force();
        return;
      }
      const res = await deliveryRoutesService.createRoutePlan({ routes: nonEmpty, buyerId, buyerAddressId: s.buyerAddressId, sla: propsRef.current.selectedSLA });
      s.isLoading = false;
      force();
      if (res) {
        toastSuccess('Success!', 'Routes created successfully');
        propsRef.current.onConfirm();
      }
      // [as-built] null (HTTP error) → nothing happens, the modal stays open
    } catch (e) {
      console.error('Error creating routes:', e);
      s.isLoading = false;
      force();
      toastWarning('Failed to create routes!', 'There is some issue with the orders latitude and longitude');
    }
  };

  const onMoveCustomer = async ({ customerId, fromRouteId, toRouteId }: MoveCustomerEvent) => {
    const from = s.routes.find((r) => r.routeId === fromRouteId);
    const to = s.routes.find((r) => r.routeId === toRouteId);
    if (!from || !to) return;
    const w = from.customers.findIndex((c) => c.customerId === customerId);
    if (w < 0) return;
    const [cust] = from.customers.splice(w, 1);
    to.customers.push(cust);
    const depot = { lat: parseFloat(s.buyerAddress?.latitude || '0'), long: parseFloat(s.buyerAddress?.longitude || '0') };
    s.isLoading = true;
    force();
    try {
      const res = await deliveryRoutesService.resequenceRoutes({
        routes: [{ routeId: from.routeId, customers: from.customers }, { routeId: to.routeId, customers: to.customers }],
        depot,
        buyerId,
      });
      const list: any[] = Array.isArray(res) ? res : [];
      list.forEach((f) => {
        const B = s.routes.find((r) => r.routeId === f.routeId);
        if (!B) return;
        const seqOf: Record<string, number> = {};
        (f.customers || []).forEach((x: any) => (seqOf[x.customerId] = Number(x.seq) || 0));
        B.customers.sort((a, b) => (seqOf[a.customerId] || 0) - (seqOf[b.customerId] || 0));
        B.customers.forEach((c, i) => {
          c.seq = String(i + 1);
          (c.orders || []).forEach((o) => (o.seq = String(i + 1)));
        });
        B.distanceKm = +((Number(f.distanceMeters) || 0) / 1000).toFixed(2);
        const secs = Number(f.durationSecs) || 0;
        B.estimatedTimeHours = +(secs / 3600).toFixed(2);
        const h = Math.floor(secs / 3600);
        const m = Math.round((secs % 3600) / 60);
        B.estimatedTimeFormatted = h > 0 ? `${h}h ${m}m` : `${m}m`;
      });
      const F: Record<string, number> = {};
      s.routes.forEach((r) => (r.customers || []).forEach((c) => {
        const b = c.beatName || 'No Beat';
        F[b] = (F[b] || 0) + 1;
      }));
      [from, to].forEach((r) => recomputeRoute(r, F, depot));
      s.summary = calculateSummary(s.routes);
      s.beatMetrics = computeBeatMetrics(s.routes);
      s.routes = [...s.routes];
    } catch (e) {
      console.error('Resequence failed:', e);
      const i = to.customers.findIndex((c) => c.customerId === customerId);
      if (i >= 0) to.customers.splice(i, 1);
      from.customers.splice(w, 0, cust);
      toastWarning('Move failed', 'Could not resequence routes. The move has been reverted.');
    } finally {
      s.isLoading = false;
      force();
    }
  };

  if (!props.show) return null;

  const toggleRoute = (id: string) => {
    if (s.expandedRoutes.has(id)) s.expandedRoutes.delete(id);
    else s.expandedRoutes.add(id);
    force();
  };

  return (
    <div className="optimized-routes-modal modal-overlay">
      <div className={`modal-container${s.activeSubTab === 'mapView' ? ' modal-container-wide' : ''}`}>
        <div className="modal-header">
          <h2>Optimized Delivery Routes</h2>
          <button className="close-button" onClick={onBack}><i className="fas fa-times" /></button>
        </div>

        {s.isLoading && <DataLoading message="Loading optimized routes..." showTip />}

        {!s.isLoading && (
          <>
            <div className="modal-body">
              <div className="sub-tabs">
                <div className="sub-tab-list">
                  <div className={`sub-tab${s.activeSubTab === 'routes' ? ' active' : ''}`} onClick={() => { s.activeSubTab = 'routes'; force(); }}> Routes </div>
                  <div className={`sub-tab${s.activeSubTab === 'mapView' ? ' active' : ''}`} onClick={() => { s.activeSubTab = 'mapView'; force(); }}>
                    <i className="fas fa-map-marked-alt" style={{ marginRight: 4 }} /> Map View{' '}
                  </div>
                </div>
                <button style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 13 }} onClick={downloadRoutesCSV}> Download CSV </button>
              </div>

              {s.activeSubTab === 'routes' && (
                <div className="routes-tab">
                  <div className="summary-section">
                    <div className="summary-item">
                      <div className="summary-label">Total Vehicle Types ({s.routes.length} vehicles)</div>
                      <div className="summary-value">
                        {s.summary.vehicleTypes.map((t) => (
                          <div key={t}>{t} <strong>({s.summary.vehicleCounts[t]})</strong></div>
                        ))}
                      </div>
                    </div>
                    <div className="summary-item"><div className="summary-label">Total Delivery Points</div><div className="summary-value">{s.summary.totalDeliveryPoints}</div></div>
                    <div className="summary-item"><div className="summary-label">Total Weight</div><div className="summary-value">{s.summary.totalWeight} kgs</div></div>
                    <div className="summary-item"><div className="summary-label">Total Vehicle Utilization</div><div className="summary-value">{fmtNumber(s.summary.totalVehicleUtilization, 2, 2)}%</div></div>
                    <div className="summary-item"><div className="summary-label">Total Invoice Value</div><div className="summary-value">₹ {s.summary.totalInvoiceValue}</div></div>
                    <div className="summary-item"><div className="summary-label">Total Delivery Cost</div><div className="summary-value">₹ {s.summary.totalDeliveryCost}</div></div>
                    <div className="summary-item"><div className="summary-label">Total Delivery Cost %</div><div className="summary-value">{fmtNumber(s.summary.totalDeliveryPercentage, 2, 2)}%</div></div>
                  </div>

                  {s.beatMetrics.length > 0 && (
                    <div className="beat-metrics-section">
                      <h3 onClick={() => { s.beatSectionExpanded = !s.beatSectionExpanded; force(); }}>
                        Delivery Points by Beat <i className={`fas ${s.beatSectionExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                      </h3>
                      {s.beatSectionExpanded && (
                        <div className="beat-grid">
                          {s.beatMetrics.map((b) => (
                            <div key={b.beatName} className="beat-card" onMouseEnter={() => { s.hoveredBeat = b.beatName; force(); }} onMouseLeave={() => { s.hoveredBeat = null; force(); }}>
                              <div className="beat-name" title={b.beatName}>{b.beatName}</div>
                              <div className="beat-points">{b.totalPoints}<span> pts</span></div>
                              <div className={`beat-trips${b.tripCount > 1 ? ' multi-trip' : ''}`}>{b.tripCount} {b.tripCount === 1 ? 'trip' : 'trips'}</div>
                              {s.hoveredBeat === b.beatName && (
                                <div className="beat-tooltip">
                                  {b.trips.map((t) => (
                                    <div key={t.routeName} className="beat-tooltip-row"><span className="tt-route">{t.routeName}</span><span className="tt-points">{t.points} pts</span></div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {s.routes.map((r) => (
                    <div key={r.routeId} className="route-card">
                      <div className="route-header">
                        <div className="route-title"><i className="fas fa-route" /> {r.routeName}</div>
                        <div className="route-meta">
                          {!!r.digitalOrderPercentage && <span className="meta-digital">{fmtNumber(r.digitalOrderPercentage, 0, 0)}% Digital</span>}
                          {!!r.digitalOrderPercentage && !!r.saleOrderPercentage && <span className="meta-amp">&amp;</span>}
                          {!!r.saleOrderPercentage && <span className="meta-sales">{fmtNumber(r.saleOrderPercentage, 0, 0)}% Sales</span>}
                          <span className="meta-date">{formatDeliveryDate(props.selectedDeliveryDate)}</span>
                        </div>
                      </div>
                      <div className="route-stats">
                        <div className="stat">
                          <div className="stat-label">Vehicle Wt / Actual Wt / Vehicle Utilization</div>
                          <div className="stat-value">
                            {r.vehicleType} /<span>{fmtNumber(r.totalVolWeightKg, 0, 0)} kgs</span> /<span>{r.vehicleUtilized ? fmtNumber(r.vehicleUtilized, 2, 2) : 0}%</span>
                          </div>
                        </div>
                        <div className="stat">
                          <div className="stat-label">Invoice Value / Delivery Cost / Delivery Cost %</div>
                          <div className="stat-value">
                            {' '}₹ {fmtNumber(r.totalAmount || 0, 0, 0)} /<span>₹ {fmtNumber(r.vehicleCost, 0, 0)} </span> /<span> {fmtNumber(r.deliveryCostPercentage || 0, 2, 2)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="orders-section">
                        <div className="orders-header" onClick={() => toggleRoute(r.routeId)}>
                          Delivery Points ({r.customers.length}) <i className={`fas ${s.expandedRoutes.has(r.routeId) ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                        </div>
                        {s.expandedRoutes.has(r.routeId) && (
                          <div className="customer-list">
                            {r.customers.map((c) => (
                              <div key={c.customerId} className="customer-row">
                                <div><i className="fas fa-map-marker-alt" /> {c.customerBusinessName}</div>
                                <span className="order-pill">{c.orderCount} orders</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {s.activeSubTab === 'mapView' && <RouteMapView routes={s.routes} onMoveCustomer={(e) => void onMoveCustomer(e)} />}
            </div>
            <div className="modal-footer">
              <button className="btn-back" onClick={onBack}>Back</button>
              <button className="btn-confirm-routes" onClick={() => void onConfirm()}> Confirm Routes </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
