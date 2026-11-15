// CDS User modules, built like the LBNP screens: GRN (opened from Trips › GRN), Delivery Planning and Create Delivery
// Route, and Customers. Every call is limited to the user's own CDS store (checked again by the API).
import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import dayjs, { type Dayjs } from 'dayjs';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { cdsApi, type OrderRow, type ReturnRow } from '../../api/services/cds.service';
import { ORDER_STATUS, TRIP_TYPE } from '../../cds/status';
import { routeMetrics, sequenceStops } from '../../cds/planning';
import DataLoading from '../../components/DataLoading';
import Paginator from '../../components/Paginator';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '../../hooks/usePagePermissions';
import type { CustomerLocationUpdate, CustomerMasterRow } from '../../api/services/customerMaster.service';
import UpdateLocationDialog from '../customer-master/UpdateLocationDialog';
import { RouteMap } from './RouteMap';
import { dayKey, dmy, longDate, products, startOfDay, Th, ymd } from './ScPlanningPages';
import { Badge, downloadCsv, ErrorBox, kg, money, sumOf, useAction, useCdsSession, useLoad, useMeta } from './ui';
import '../delivery-routes/DeliveryRoutesPage.css';
import '../delivery-routes/CreateDeliveryRoutePage.css';
import '../delivery-routes/OptimizedRoutesModal.css';
import '../trips/TripDetailsPage.css';
import '../customer-master/CustomerMasterPage.css';

// ---------------------------------------------------------------- Delivery Planning (LBNP Delivery Planning)

/** Delivery Planning — same screen as LBNP Delivery Planning. Created routes become trips in Trips › Deliveries. */
export function DeliveryPlanningPage() {
  const navigate = useNavigate();
  return (
    <div className="cds-page delivery-routes-page cds-planning-lbnp container-fluid p-3 bg-light h-100">
      <div className="row px-3">
        <div className="col-md-6">
          <div className="d-flex align-items-center">
            <i className="fas fa-shopping-bag text-primary me-2 fs-5" />
            <h1 className="fs-3 mb-0 fw-bold">Delivery Planning</h1>
          </div>
          <p className="text-muted small">Manage and track your delivery routes</p>
        </div>
        <div className="col-md-6 d-flex justify-content-md-end justify-content-start align-items-end gap-2 pt-3">
          <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" onClick={() => navigate('/cds/delivery-planning/create')}>
            <i className="fas fa-upload me-1 fs-6" /><span className="fs-6">Create Delivery Route</span>
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="mat-card mat-elevation-z3 mb-4">
          <div className="mat-card-content p-0">
            <table className="mat-mdc-table w-100">
              <thead>
                <tr className="mat-mdc-header-row">
                  <Th icon="fa-calendar" label="Created Date" />
                  <Th icon="fa-hashtag" label="Route ID" />
                  <Th icon="fa-map-marker-alt" label="Drop Points" align="center" />
                  <Th icon="fa-calendar-check" label="DELIVERY DATE" align="center" />
                  <Th icon="fa-weight-hanging" label="Weight / Vol" align="right" />
                  <Th icon="fa-info-circle" label="Status" align="center" />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center py-4" colSpan={6}>
                    <i className="fas fa-inbox mb-3 text-muted" style={{ fontSize: '2rem' }} />
                    <p className="mb-0">No delivery plannings found</p>
                    <p className="mb-0 small text-muted mt-1">Created routes move to <a role="button" className="text-primary" onClick={() => navigate('/cds/trips?tab=RETAILER_DELIVERY')}>Trips › Deliveries</a>.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

type DeliveryStop = { id: string; seq: number; name: string; address: string; lat: number; lng: number; orders: number; returns: number; kg: number; value: number };

/** Create Delivery Route — same layout as LBNP Create Delivery Route: Delivery Date and Area, Order Dates, Available
 *  Orders (and returns to collect), then "Plan Delivery Route" opens the delivery route (like Optimized Delivery Routes). */
export function CreateDeliveryPlanPage() {
  const navigate = useNavigate();
  const meta = useMeta();
  const [area, setArea] = useState('');
  const [days, setDays] = useState<Set<string>>(new Set());
  const [selO, setSelO] = useState<Set<string>>(new Set());
  const [selR, setSelR] = useState<Set<string>>(new Set());
  const [date, setDate] = useState<Date | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [planning, setPlanning] = useState(false);
  const min = meta.data ? new Date(`${meta.data.settings.nextDayPlanning ? meta.data.tomorrow : meta.data.today}T00:00:00`) : startOfDay(new Date());
  const day = date ?? min;
  const orders = useLoad(() => cdsApi.searchOrders({ statuses: ['READY_FOR_DELIVERY'], pageSize: 0 }), []);
  const rets = useLoad(() => cdsApi.searchReturns({ statuses: ['RETURN_INITIATED'], unplanned: true, pageSize: 0 }), []);
  const allOrders = useMemo(() => orders.data?.rows ?? [], [orders.data]);
  const allReturns = useMemo(() => rets.data?.rows ?? [], [rets.data]);
  const areas = Array.from(new Set(allOrders.map((o) => o.locality).filter(Boolean))).sort();
  const orderDays = useMemo(() => Array.from(new Set(allOrders.map((o) => dayKey(o.confirmedAt)))).sort(), [allOrders]);
  const rows = allOrders.filter((o) => (!area || o.locality === area) && (!days.size || days.has(dayKey(o.confirmedAt))));
  const chosenO = allOrders.filter((o) => selO.has(o.id));
  const chosenR = allReturns.filter((r) => selR.has(r.id));
  const left = (o: OrderRow) => o.lines.filter((l) => l.acceptedQty - l.deliveredQty > 0);
  const weight = (o: OrderRow) => sumOf(left(o), (l) => (l.acceptedQty - l.deliveredQty) * l.unitWeightKg);
  const allOn = rows.length > 0 && rows.every((o) => selO.has(o.id));
  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => set((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleDay = (d: string) => toggle(setDays, d);
  const plan = () => {
    if (!chosenO.length && !chosenR.length) { void Swal.fire({ icon: 'warning', text: 'Select at least one order to plan the delivery route', confirmButtonColor: '#1e3a8a' }); return; }
    setPlanning(true);
  };
  return (
    <div className="cds-page create-delivery-route-page create-route-container">
      <header className="orders-header">
        <button className="back-btn" aria-label="Back" onClick={() => navigate('/cds/delivery-planning')}><i className="fas fa-arrow-left" /></button>
        <h1><i className="fas fa-route" /> Create Delivery Route <small className="cds-route-chip ms-2">{TRIP_TYPE.RETAILER_DELIVERY.direction}</small></h1>
      </header>

      <div className="route-card">
        <div className="card-content w-100 p-3">
          <div className="route-config-bar">
            <div className="config-item">
              <label className="config-label">Delivery Date</label>
              <div ref={fieldRef}>
                <TextField
                  size="small"
                  value={longDate(day)}
                  onClick={() => setAnchor(fieldRef.current)}
                  sx={{ width: 220, cursor: 'pointer', '& input': { cursor: 'pointer' } }}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton size="small" edge="start" aria-label="Open calendar" onClick={(e) => { e.stopPropagation(); setAnchor(fieldRef.current); }}>
                          <span className="material-icons" style={{ fontSize: 20 }}>calendar_today</span>
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
              <Popover open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
                <DateCalendar value={dayjs(day)} minDate={dayjs(min)} maxDate={dayjs(min).add(7, 'day')} onChange={(v: Dayjs | null) => { if (v) setDate(startOfDay(v.toDate())); setAnchor(null); }} />
              </Popover>
            </div>
            <div className="config-item">
              <label className="config-label" htmlFor="dp-area">Area</label>
              <select id="dp-area" className="form-select cds-config-select" value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">All Areas</option>{areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="section">
            <h2>Order Dates</h2>
            <div className="date-options">
              {orderDays.map((d) => (
                <label key={d} className={`date-checkbox${days.has(d) ? ' checked' : ''}`}>
                  <input type="checkbox" checked={days.has(d)} onChange={() => toggleDay(d)} />
                  <span>{dmy(`${d}T00:00:00`)}</span>
                </label>
              ))}
              {!orderDays.length && <span className="text-muted small">No orders ready for delivery. Orders are ready after the GRN.</span>}
            </div>
          </div>

          {area && (
            <div className="applied-filters">
              <span className="applied-label"><i className="fas fa-filter" style={{ color: '#4b5563' }} /> Filters </span>
              <span className="filter-chip">Area: {area} <i className="fas fa-times" role="button" aria-label="Remove Area" onClick={() => setArea('')} /></span>
              <span className="clear-all-link" role="button" onClick={() => setArea('')}>Clear all</span>
            </div>
          )}

          <div className="section">
            <div className="orders-title-row">
              <h2 className="mb-0">Available Orders <small className="text-muted fw-normal">({rows.length} ready for delivery)</small></h2>
              <label className="select-all-checkbox">
                <input type="checkbox" checked={allOn} onChange={(e) => setSelO((s) => { const n = new Set(s); rows.forEach((o) => (e.target.checked ? n.add(o.id) : n.delete(o.id))); return n; })} /> Select All
              </label>
            </div>
            {(orders.error || rets.error) && <ErrorBox text={orders.error || rets.error} onRetry={() => { orders.reload(); rets.reload(); }} />}
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th className="mat-mdc-header-cell select-col" />
                    {['fa-calendar|Order Date', 'fa-hashtag|Order Number', 'fa-store|Retailer Name', 'fa-map-marker-alt|Area', 'fa-boxes-stacked|Products', 'fa-indian-rupee-sign|Order Value', 'fa-weight-hanging|Weight (kg)', 'fa-circle-info|Status'].map((h) => {
                      const [icon, label] = h.split('|');
                      return <th key={label} className="mat-mdc-header-cell"><div className="th-wrap"><div className="th-content"><i className={`fas ${icon}`} /> {label}</div></div></th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {orders.loading && !orders.data && <tr><td colSpan={9} className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary me-2" />Loading orders…</td></tr>}
                  {rows.map((o) => (
                    <tr key={o.id} className="order-row">
                      <td className="select-col"><input type="checkbox" aria-label={`Select ${o.orderNo}`} checked={selO.has(o.id)} onChange={() => toggle(setSelO, o.id)} /></td>
                      <td>{dmy(o.confirmedAt)}</td>
                      <td>{o.orderNo}<div className="text-muted text-xs">{o.paymentMode}</div></td>
                      <td>{o.retailerName}</td>
                      <td>{o.locality}</td>
                      <td title={left(o).map((l) => `${l.name} × ${l.acceptedQty - l.deliveredQty}`).join('\n')}>{products(left(o), (l) => l.acceptedQty - l.deliveredQty)}</td>
                      <td className="text-center">{money(o.orderValue)}</td>
                      <td className="text-center">{kg(weight(o))}</td>
                      <td className="text-center"><Badge meta={ORDER_STATUS[o.status]} /></td>
                    </tr>
                  ))}
                  {orders.data && rows.length === 0 && <tr><td className="text-center py-4" colSpan={9}> No orders available </td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {allReturns.length > 0 && (
            <div className="section">
              <div className="orders-title-row"><h2 className="mb-0">Returns to Collect <small className="text-muted fw-normal">({allReturns.length} initiated by retailers)</small></h2></div>
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th className="mat-mdc-header-cell select-col" />
                      {['fa-hashtag|Return Number', 'fa-receipt|Order Number', 'fa-store|Retailer Name', 'fa-boxes-stacked|Products', 'fa-comment|Return Reason'].map((h) => {
                        const [icon, label] = h.split('|');
                        return <th key={label} className="mat-mdc-header-cell"><div className="th-wrap"><div className="th-content"><i className={`fas ${icon}`} /> {label}</div></div></th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {allReturns.map((r) => (
                      <tr key={r.id} className="order-row">
                        <td className="select-col"><input type="checkbox" aria-label={`Select ${r.returnNo}`} checked={selR.has(r.id)} onChange={() => toggle(setSelR, r.id)} /></td>
                        <td>{r.returnNo}</td><td>{r.orderNo}</td><td>{r.retailerName}</td>
                        <td>{products(r.lines, (l) => l.qty)}</td><td>{Array.from(new Set(r.lines.map((l) => l.reason))).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="summary-row">
            <div><span className="text-primary"><i className="fas fa-list-ol" /> Selected Orders:</span> <span className="fw-bold">{chosenO.length}</span></div>
            <div><span className="text-primary"><i className="fas fa-rotate-left" /> Returns to Collect:</span> <span className="fw-bold">{chosenR.length}</span></div>
            <div><span className="text-primary"><i className="fas fa-store" /> Retailers:</span> <span className="fw-bold">{new Set([...chosenO.map((o) => o.retailerId), ...chosenR.map((r) => r.retailerId)]).size}</span></div>
            <div><span className="text-primary"><i className="fas fa-indian-rupee-sign" /> Total Order Value:</span> <span className="fw-bold">{money(sumOf(chosenO, (o) => o.orderValue))}</span></div>
            <div><span className="text-primary"><i className="fas fa-weight-hanging" /> Total Weight:</span> <span className="fw-bold">{kg(sumOf(chosenO, weight))}</span></div>
          </div>

          <div className="action-buttons">
            <button className="cancel-btn" onClick={() => navigate('/cds/delivery-planning')}>Cancel</button>
            <button className="confirm-btn" onClick={plan}><i className="fas fa-route me-1" /> Plan Delivery Route</button>
          </div>
        </div>
      </div>

      {planning && meta.data && (
        <DeliveryRouteModal orders={chosenO} returns={chosenR} known={allOrders} plannedDate={ymd(day)} weightOf={weight} onClose={() => setPlanning(false)} onDone={() => navigate('/cds/trips?tab=RETAILER_DELIVERY')} />
      )}
    </div>
  );
}

/** Delivery cost of an own-fleet route for the Optimized Delivery Routes figures (demo rate per km). */
const COST_PER_KM = 12;

/** Optimized Delivery Routes — the same dialog as LBNP: summary, one card per route (vehicle and load, invoice value
 *  and delivery cost, delivery points), Map View, Back / Confirm Routes. The route engine picks the vehicle and driver. */
function DeliveryRouteModal({ orders, returns, known, plannedDate, weightOf, onClose, onDone }: { orders: OrderRow[]; returns: ReturnRow[]; known: OrderRow[]; plannedDate: string; weightOf: (o: OrderRow) => number; onClose: () => void; onDone: () => void }) {
  const { store } = useCdsSession();
  const meta = useMeta();
  const { busy, run } = useAction();
  const [view, setView] = useState<'routes' | 'map'>('routes');
  const [open, setOpen] = useState(true);
  const st = meta.data?.stores.find((s) => s.id === store);
  const origin = { lat: st?.lat ?? 17.385, lng: st?.lng ?? 78.4867 };
  const loadKg = sumOf(orders, weightOf);
  const assign = useLoad(() => cdsApi.autoAssign(plannedDate, Math.ceil(loadKg)), [plannedDate, loadKg]);
  const route = useMemo(() => {
    // one delivery point per retailer: its orders and the returns to collect there
    const m = new Map<string, Omit<DeliveryStop, 'seq'>>();
    const place = (id: string) => known.find((o) => o.retailerId === id);
    orders.forEach((o) => {
      const s = m.get(o.retailerId) ?? { id: o.retailerId, name: o.retailerName, address: `${o.locality}, ${o.city}`, lat: o.retailerLat, lng: o.retailerLng, orders: 0, returns: 0, kg: 0, value: 0 };
      s.orders += 1; s.kg += weightOf(o); s.value += o.orderValue;
      m.set(o.retailerId, s);
    });
    returns.forEach((r) => {
      if (!r.retailerId) return;
      const p = place(r.retailerId);
      const s = m.get(r.retailerId) ?? { id: r.retailerId, name: r.retailerName, address: p ? `${p.locality}, ${p.city}` : '', lat: p?.retailerLat ?? NaN, lng: p?.retailerLng ?? NaN, orders: 0, returns: 0, kg: 0, value: 0 };
      s.returns += 1;
      m.set(r.retailerId, s);
    });
    const list = Array.from(m.values());
    const located = list.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng));
    const order = sequenceStops(origin, located).map((i) => located[i]);
    const stops: DeliveryStop[] = [...order, ...list.filter((s) => !located.includes(s))].map((s, i) => ({ ...s, seq: i + 1 }));
    const mt = routeMetrics([origin, ...order], order.length);
    return { stops, km: mt.distanceKm, minutes: mt.etaMinutes };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, returns, known, origin.lat, origin.lng]);
  const v = assign.data?.vehicle;
  const util = v ? Math.round((loadKg / v.capacityKg) * 10000) / 100 : 0;
  const invoice = sumOf(orders, (o) => o.orderValue);
  const cost = Math.round(route.km * COST_PER_KM);
  const costPct = invoice ? Math.round((cost / invoice) * 10000) / 100 : 0;
  const fmt2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt0 = (n: number) => Math.round(n).toLocaleString('en-IN');
  const confirmRoutes = async () => {
    if (!assign.data) return;
    const r = await run(() => cdsApi.createDeliveryPlan({ orderIds: orders.map((o) => o.id), returnIds: returns.map((x) => x.id), plannedDate, slot: '09:00 – 13:00', vehicleId: assign.data!.vehicle.id, deliveryPersonId: assign.data!.deliveryPerson.id }), 'Routes confirmed. See the trip in Trips › Deliveries.');
    if (r) onDone();
  };
  const csv = () => downloadCsv(`optimized-routes-${plannedDate}`, [{ key: 'route', label: 'Route' }, { key: 'vehicle', label: 'Vehicle' }, { key: 'seq', label: 'Stop' }, { key: 'name', label: 'Customer' }, { key: 'orders', label: 'Orders' }, { key: 'kg', label: 'Weight (kg)' }],
    route.stops.map((s) => ({ route: 'Route 1', vehicle: v?.type ?? '', seq: s.seq, name: s.name, orders: s.orders, kg: Math.round(s.kg * 10) / 10 })));
  return createPortal(
    <div className="optimized-routes-modal modal-overlay">
      <div className={`modal-container${view === 'map' ? ' modal-container-wide' : ''}`} role="dialog" aria-modal="true" aria-label="Optimized Delivery Routes">
        <div className="modal-header">
          <h2>Optimized Delivery Routes</h2>
          <button className="close-button" aria-label="Close" onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        {assign.loading && !assign.data && !assign.error ? <DataLoading message="Loading optimized routes..." showTip /> : (
          <>
            <div className="modal-body">
              <div className="sub-tabs">
                <div className="sub-tab-list">
                  <div className={`sub-tab${view === 'routes' ? ' active' : ''}`} role="tab" onClick={() => setView('routes')}> Routes </div>
                  <div className={`sub-tab${view === 'map' ? ' active' : ''}`} role="tab" onClick={() => setView('map')}><i className="fas fa-map-marked-alt" style={{ marginRight: 4 }} /> Map View </div>
                </div>
                <button style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 13 }} onClick={csv}> Download CSV </button>
              </div>
              {assign.error && <div className="cds-note warn mt-3"><i className="fas fa-triangle-exclamation mt-1" /><div>{assign.error}</div></div>}
              {view === 'routes' && (
                <div className="routes-tab">
                  <div className="summary-section">
                    <div className="summary-item">
                      <div className="summary-label">Total Vehicle Types ({v ? 1 : 0} vehicles)</div>
                      <div className="summary-value">{v && <div>{v.type} <strong>(1)</strong></div>}</div>
                    </div>
                    <div className="summary-item"><div className="summary-label">Total Delivery Points</div><div className="summary-value">{route.stops.length}</div></div>
                    <div className="summary-item"><div className="summary-label">Total Weight</div><div className="summary-value">{Math.round(loadKg * 10) / 10} kgs</div></div>
                    <div className="summary-item"><div className="summary-label">Total Vehicle Utilization</div><div className="summary-value">{fmt2(util)}%</div></div>
                    <div className="summary-item"><div className="summary-label">Total Invoice Value</div><div className="summary-value">₹ {fmt0(invoice)}</div></div>
                    <div className="summary-item"><div className="summary-label">Total Delivery Cost</div><div className="summary-value">₹ {fmt0(cost)}</div></div>
                    <div className="summary-item"><div className="summary-label">Total Delivery Cost %</div><div className="summary-value">{fmt2(costPct)}%</div></div>
                  </div>
                  <div className="route-card">
                    <div className="route-header">
                      <div className="route-title"><i className="fas fa-route" /> Route 1</div>
                      <div className="route-meta"><span className="meta-date">{dmy(`${plannedDate}T00:00:00`)}</span></div>
                    </div>
                    <div className="route-stats">
                      <div className="stat">
                        <div className="stat-label">Vehicle Wt / Actual Wt / Vehicle Utilization</div>
                        <div className="stat-value">{v?.type ?? 'N/A'} /<span>{fmt0(loadKg)} kgs</span> /<span>{fmt2(util)}%</span></div>
                      </div>
                      <div className="stat">
                        <div className="stat-label">Invoice Value / Delivery Cost / Delivery Cost %</div>
                        <div className="stat-value"> ₹ {fmt0(invoice)} /<span>₹ {fmt0(cost)} </span> /<span> {fmt2(costPct)}%</span></div>
                      </div>
                    </div>
                    <div className="orders-section">
                      <div className="orders-header" role="button" onClick={() => setOpen((x) => !x)}>Delivery Points ({route.stops.length}) <i className={`fas ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} /></div>
                      {open && (
                        <div className="customer-list">
                          {route.stops.map((s) => (
                            <div key={s.id} className="customer-row">
                              <div><i className="fas fa-map-marker-alt" /> {s.name}</div>
                              <span className="order-pill">{s.orders + s.returns} orders</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {view === 'map' && (
                <div className="pt-3">
                  <RouteMap height={520} stops={[{ seq: 0, name: st?.name ?? 'CDS Store', detail: 'Start', lat: origin.lat, lng: origin.lng }, ...route.stops.map((s) => ({ seq: s.seq, name: s.name, detail: s.address, lat: s.lat, lng: s.lng, orders: [`${s.orders} order(s) · ${money(s.value)}${s.returns ? ` · ${s.returns} return(s) to collect` : ''}`] }))]} />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-back" onClick={onClose}>Back</button>
              <button className="btn-confirm-routes" disabled={!assign.data || busy} onClick={() => void confirmRoutes()}> Confirm Routes </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------- Customers (LBNP Customers)

type CustomerRow = Awaited<ReturnType<typeof cdsApi.retailers>>[number];
/** LBNP "dd/mm/yy" date. */
const ddmmyy = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
};
/** The LBNP Update Location dialog works on a customer-master row. */
const asMasterRow = (c: CustomerRow): CustomerMasterRow => ({
  id: c.id, customer_unique_id: c.code, buyer_id: '', mobile_number: c.phone, business_name: c.name, customer_name: c.ownerName,
  latitude: String(c.lat), longitude: String(c.lng), address: c.address, status: 'active', created_at: '', updated_at: c.updatedAt,
  created_by: 'system', updated_by: c.source, is_bulk_order: c.isBulk,
});

/** Customers — same screen as LBNP Customers: search and Source filter, table (UID, Business Name, Mobile, Latitude,
 *  Longitude, Bulk, Last Updated, Source), Edit (Update Location) and Delete, paginator. Retailers of this CDS store. */
export function RetailersPage() {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [pageNumber, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [snack, setSnack] = useState<{ key: number; message: string; duration: number } | null>(null);
  const { data, error, loading, reload } = useLoad(() => cdsApi.retailers(), []);
  const all = (data ?? [])
    .filter((r) => !search.trim() || `${r.name} ${r.phone} ${r.code}`.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((r) => !source || r.source === source);
  const rows = all.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  const showSnack = (message: string, duration: number) => setSnack({ key: Date.now(), message, duration });
  const onDialogClosed = async (c: CustomerRow, result?: CustomerLocationUpdate) => {
    setEditing(null);
    if (!result) return;
    try {
      const r = await cdsApi.updateRetailerLocation(c.id, result);
      reload();
      if (r.ordersUpdated > 0) showSnack(`Updated. ${r.ordersUpdated} order(s) synced.`, 4000);
      else if (r.skippedOrderStatuses.length > 0) showSnack(`Updated. No orders synced — orders in: ${r.skippedOrderStatuses.join(', ')}.`, 6000);
      else showSnack('Customer updated successfully.', 3000);
    } catch (e) {
      showSnack(e instanceof Error ? e.message : 'An error occurred while updating.', 3000);
    }
  };
  const deleteCustomer = async (c: CustomerRow) => {
    const ok = await Swal.fire({
      title: 'Delete Customer?', text: `Are you sure you want to delete "${c.name || c.code}"? This cannot be undone.`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, Delete', cancelButtonText: 'Cancel',
    });
    if (!ok.isConfirmed) return;
    try {
      await cdsApi.deleteRetailer(c.id);
      await Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Customer record has been deleted.', confirmButtonColor: '#3085d6' });
      reload();
    } catch {
      void Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete customer. Please try again.', confirmButtonColor: '#3085d6' });
    }
  };
  const thLeft = 'text-left bg-white text-uppercase fw-bold py-2 px-2 small';
  const thCenter = 'text-center bg-white text-uppercase fw-bold py-2 px-2 small';
  return (
    <div className="cds-page customer-master-page container-fluid p-3 bg-light h-100">
      <div className="row px-3">
        <div className="col-md-6">
          <div className="d-flex align-items-center mb-1">
            <i className="fas fa-users text-primary me-2 fs-5" />
            <h1 className="fs-3 mb-0 fw-bold">Customers</h1>
          </div>
          <p className="text-muted small mb-0">Manage customer location data and sync with orders.</p>
        </div>
        <div className="col-md-6">
          <div className="d-flex justify-content-md-end justify-content-start align-items-end gap-2 pt-3">
            <div className="position-relative" style={{ minWidth: 320 }}>
              <input type="text" className="form-control pe-4" autoComplete="off" placeholder="Search by name, mobile, UID..." aria-label="Search customers" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              {search && <button type="button" className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 p-0 border-0 bg-transparent text-muted" title="Clear search" onClick={() => { setSearch(''); setPage(1); }}><i className="fas fa-times" /></button>}
            </div>
            <select className="form-select form-select-sm" style={{ width: 'auto' }} aria-label="Source" value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }}>
              <option value="">All Sources</option>
              <option value="system">System</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="mat-card mat-elevation-z3">
          <div className="mat-card-content p-0">
            {error && <ErrorBox text={error} onRetry={reload} />}
            <div className="table-responsive">
              {loading && !data ? <DataLoading overlay={false} message="Loading customers..." showTip /> : (
                <table className="mat-mdc-table w-100">
                  <thead>
                    <tr className="mat-mdc-header-row bg-white small">
                      <th className={thLeft}><i className="fas fa-fingerprint me-1 text-primary" />UID</th>
                      <th className={thLeft}><i className="fas fa-building me-1 text-primary" />Business Name</th>
                      <th className={thLeft}><i className="fas fa-phone me-1 text-primary" />Mobile</th>
                      <th className={thCenter}><i className="fas fa-crosshairs me-1 text-primary" />Latitude</th>
                      <th className={thCenter}><i className="fas fa-crosshairs me-1 text-primary" />Longitude</th>
                      <th className={thCenter}><i className="fas fa-box me-1 text-primary" />Bulk</th>
                      <th className={thCenter}><i className="fas fa-clock me-1 text-primary" />Last Updated</th>
                      <th className={thCenter}><i className="fas fa-tag me-1 text-primary" />Source</th>
                      <th className={thCenter}><i className="fas fa-cogs me-1 text-primary" />Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr className="mat-mdc-row small" key={c.id}>
                        <td className="text-left py-2 px-2">{c.code}</td>
                        <td className="text-left py-2 px-2">{c.name || '—'}</td>
                        <td className="text-left py-2 px-2">{c.phone || '—'}</td>
                        <td className="text-center py-2 px-2">{c.lat ?? '—'}</td>
                        <td className="text-center py-2 px-2">{c.lng ?? '—'}</td>
                        <td className="text-center py-2 px-2">{c.isBulk ? <span className="badge bg-warning text-dark">Yes</span> : <span className="badge bg-light text-muted">No</span>}</td>
                        <td className="text-center py-2 px-2">{ddmmyy(c.updatedAt)}</td>
                        <td className="text-center py-2 px-2"><span className={`badge ${c.source === 'system' ? 'bg-secondary' : 'bg-info text-dark'}`}>{c.source}</span></td>
                        <td className="text-center py-2 px-2">
                          <div className="d-inline-flex gap-1">
                            <button type="button" className="btn btn-sm" title="Edit" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)}><i className="fas fa-pen" /></button>
                            <button type="button" className="btn btn-sm" title="Delete" aria-label={`Delete ${c.name}`} onClick={() => void deleteCustomer(c)}><i className="fas fa-trash text-danger" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr className="mat-row"><td colSpan={10} className="py-4"><div className="text-center text-muted small"><i className="fas fa-users fs-3 mb-2" /><p className="mb-0 mt-2 small">No customers found</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {all.length > 0 && (
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-1 bg-white">
                <div className="text-muted small" />
                <div className="bg-transparent shadow-none" aria-label="Select page of customers">
                  <Paginator length={all.length} pageIndex={pageNumber - 1} pageSize={pageSize} pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS} onPage={(e) => { setPage(e.pageIndex + 1); setPageSize(e.pageSize); }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <UpdateLocationDialog key={editing?.id ?? 'none'} open={!!editing} customer={editing ? asMasterRow(editing) : null} onClose={(result) => editing && void onDialogClosed(editing, result)} />
      <Snackbar
        key={snack?.key}
        open={!!snack}
        autoHideDuration={snack?.duration}
        onClose={(_e, reason) => reason !== 'clickaway' && setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={snack?.message}
        className="customer-master-snackbar"
        action={<Button size="small" onClick={() => setSnack(null)} sx={{ color: '#abc7ff' }}>Close</Button>}
      />
    </div>
  );
}
