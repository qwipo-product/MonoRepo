// CDS Service Centre planning: Pickup Planning (distributors → CDS stores), Deliver to CDS, Return Planning
// (CDS stores → distributors). Each plan generates its trips (see Trips). Screens follow Delivery Planning:
// section cards with a count, short item lists, and a plan panel on the right.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import dayjs, { type Dayjs } from 'dayjs';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { cdsApi, type OrderRow, type PlanRow, type ReturnRow } from '../../api/services/cds.service';
import { TRIP_STATUS, TRIP_TYPE } from '../../cds/status';
import { SC_HUB } from '../../cds/engine';
import { routeMetrics, sequenceStops } from '../../cds/planning';
import { DEFAULT_ROUTE_CONFIG, type Plan, type RouteConfig } from '../../cds/types';
import { RouteMap } from './RouteMap';
import { AssignFields, Badge, ModuleIntro, downloadCsv, Empty, ErrorBox, fmtDate, fmtDateTime, kg, Loading, money, SectionCard, sumOf, Table, Tabs, useAction, useLoad, useMeta, type Assign } from './ui';
import '../delivery-routes/DeliveryRoutesPage.css';
import '../delivery-routes/CreateDeliveryRoutePage.css';
import '../delivery-routes/OptimizedRoutesModal.css';

/** "Sunflower Oil 1 L × 4, +2 more" — the first product and how many more. */
const products = <L extends { name: string }>(lines: L[], qty: (l: L) => number) => {
  const shown = lines.filter((l) => qty(l) > 0);
  if (!shown.length) return '—';
  return `${shown[0].name} × ${qty(shown[0])}${shown.length > 1 ? `, +${shown.length - 1} more` : ''}`;
};

/** Planning direction wording — the same wording as the Trips tabs. */
export const PLAN_DIRECTION = {
  pickups: 'Seller to CDS Stores',
  returns: 'CDS Stores to Sellers',
};

/** Planning — same screen as LBNP Delivery Planning: header with the create buttons, then the planning table.
 *  Two tabs: Pickups (Seller to CDS Stores) and Returns (CDS Stores to Sellers). Created plans go to Trips. */
export function PlanningPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as 'pickups' | 'returns') ?? 'pickups';
  const pickups = tab === 'pickups';
  const create = pickups ? '/cds/planning/pickup/create' : '/cds/planning/return/create';
  return (
    <div className="cds-page delivery-routes-page cds-planning-lbnp container-fluid p-3 bg-light h-100">
      <div className="row px-3">
        <div className="col-md-6">
          <div className="d-flex align-items-center">
            <i className="fas fa-shopping-bag text-primary me-2 fs-5" />
            <h1 className="fs-3 mb-0 fw-bold">Planning</h1><ModuleIntro text="Plan pickups from sellers and returns to sellers. Each plan becomes a trip in Trips." />
          </div>
          <p className="text-muted small">Manage and track your pickup and return routes</p>
        </div>
        <div className="col-md-6 d-flex justify-content-md-end justify-content-start align-items-end gap-2 pt-3">
          <button className="btn btn-sm btn-outline-success d-flex align-items-center text-nowrap" title="Select every waiting item and build the route automatically" onClick={() => navigate(`${create}?auto=1`)}>
            <i className="fas fa-wand-magic-sparkles me-1 fs-6" />
            <span className="fs-6">Auto Plan Route</span>
          </button>
          <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" onClick={() => navigate(create)}>
            <i className="fas fa-upload me-1 fs-6" />
            <span className="fs-6">{pickups ? 'Create Manual Pickup Plan' : 'Create Manual Return Plan'}</span>
          </button>
        </div>
      </div>
      <div className="px-3">
        <Tabs value={tab} onChange={(v) => setParams({ tab: v })} tabs={[
          { id: 'pickups', label: 'Pickups', sub: PLAN_DIRECTION.pickups, icon: 'fa-truck-ramp-box' },
          { id: 'returns', label: 'Returns', sub: PLAN_DIRECTION.returns, icon: 'fa-rotate-left' },
        ]} />
      </div>
      <div className="p-3 pt-0">
        <div className="mat-card mat-elevation-z3 mb-4">
          <div className="mat-card-content p-0">
            <table className="mat-mdc-table w-100">
              <thead>
                <tr className="mat-mdc-header-row">
                  <Th icon="fa-calendar" label="Created Date" />
                  <Th icon="fa-hashtag" label="Route ID" />
                  <Th icon="fa-map-marker-alt" label={pickups ? 'Pickup Points' : 'Drop Points'} align="center" />
                  <Th icon="fa-calendar-check" label={pickups ? 'Pickup Date' : 'Return Date'} align="center" />
                  <Th icon="fa-weight-hanging" label="Weight / Vol" align="right" />
                  <Th icon="fa-info-circle" label="Status" align="center" />
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-center py-4" colSpan={6}>
                    <i className="fas fa-inbox mb-3 text-muted" style={{ fontSize: '2rem' }} />
                    <p className="mb-0">{pickups ? 'No pickup plannings found' : 'No return plannings found'}</p>
                    <p className="mb-0 small text-muted mt-1">
                      Created plans move to <a role="button" className="text-primary" onClick={() => navigate(`/cds/trips?tab=${pickups ? 'DISTRIBUTOR_PICKUP' : 'CDS_RETURN'}`)}>Trips › {pickups ? 'Pickups' : 'Returns'}</a>.
                    </p>
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

/** LBNP Delivery Planning table header cell (icon + upper-case label). */
const Th = ({ icon, label, align = 'left' }: { icon: string; label: string; align?: 'left' | 'center' | 'right' }) => (
  <th className={`mat-mdc-header-cell text-uppercase py-2 small ${align === 'center' ? 'px-2 text-center' : 'px-3'} ${align === 'right' ? 'text-end' : ''}`}><i className={`fas ${icon} me-1 text-primary`} /> {label}</th>
);

/** Recently created plans with the trips they generated. */
export function RecentPlans({ kind, title }: { kind: Plan['kind']; title: string }) {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useLoad(() => cdsApi.plans(kind), [kind]);
  return (
    <SectionCard icon="fa-clipboard-list" tone="green" title={title} subtitle="Plans and the trips they generated" count={data?.length} countLabel="plans">
      {error && <ErrorBox text={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : (
        <Table head={['Plan', 'Planned date', 'Orders / returns', 'Trips', 'Created']} empty={!data?.length && <Empty text="No plans yet" />}>
          {data?.slice(0, 12).map((p: PlanRow) => (
            <tr key={p.id} className="mat-mdc-row">
              <td className="fw-semibold">{p.planNo}</td>
              <td className="small">{fmtDate(p.plannedDate)}</td>
              <td className="small">{[p.orderIds.length && `${p.orderIds.length} order(s)`, p.returnIds.length && `${p.returnIds.length} return(s)`].filter(Boolean).join(' · ')}</td>
              <td className="small">{p.trips.map((t) => (
                <div key={t.id} className="d-flex align-items-center justify-content-center gap-2 py-1">
                  <a role="button" className="text-primary fw-semibold" onClick={() => navigate(`/cds/trips/${t.id}`)}>{t.tripNo}</a><Badge meta={TRIP_STATUS[t.status]} />
                </div>
              ))}</td>
              <td className="small">{fmtDateTime(p.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </SectionCard>
  );
}


// ---------------------------------------------------------------- Pickup Planning (like Delivery Planning)

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-CA');

type Place = { id: string; name: string; address: string; lat: number; lng: number };
/** The pickup route the plan creates (same rules as the engine): one trip from the Service Centre hub to the
 *  sellers (distributors) in the shortest order, then on to the CDS stores of the orders. */
function autoRoute(orders: OrderRow[], distributors: Place[], stores: Place[]) {
  const leg = (start: { lat: number; lng: number }, places: Place[], key: (o: OrderRow) => string, from: number) =>
    sequenceStops(start, places).map((i, k) => {
      const p = places[i];
      const os = orders.filter((o) => key(o) === p.id);
      return { ...p, seq: from + k + 1, orders: os.length, kg: sumOf(os, (o) => o.weightKg) };
    });
  const dists = distributors.filter((d) => orders.some((o) => o.distributorId === d.id));
  const sts = stores.filter((s) => orders.some((o) => o.cdsStoreId === s.id));
  const pickups = leg(SC_HUB, dists, (o) => o.distributorId, 0);
  const drops = leg(pickups[pickups.length - 1] ?? SC_HUB, sts, (o) => o.cdsStoreId, pickups.length);
  const m = routeMetrics([SC_HUB, ...pickups, ...drops], pickups.length + drops.length);
  return { pickups, drops, km: m.distanceKm, minutes: m.etaMinutes };
}

/** Where a route goes past the Settings › Pick up / Return limits. */
function routeLimitWarnings(cfg: RouteConfig | undefined, stops: { cds: number; distributor: number }, km: number, minutes: number, loadKg: number) {
  const c = { ...DEFAULT_ROUTE_CONFIG, ...cfg };
  return [
    stops.cds > c.maxCdsStops && `${stops.cds} CDS stops (limit ${c.maxCdsStops})`,
    stops.distributor > c.maxDistributorStops && `${stops.distributor} distributor stops (limit ${c.maxDistributorStops})`,
    km > c.maxDistanceKm && `~${km} km (limit ${c.maxDistanceKm} km)`,
    loadKg > c.maxWeightKg && `${Math.round(loadKg * 10) / 10} kg (limit ${c.maxWeightKg} kg)`,
    minutes > c.maxTravelHours * 60 && `~${Math.round((minutes / 60) * 10) / 10} h (limit ${c.maxTravelHours} h)`,
  ].filter((x): x is string => !!x);
}
function RouteLimitNote({ warnings, kind }: { warnings: string[]; kind: 'pickup' | 'return' }) {
  if (!warnings.length) return null;
  return (
    <div className="cds-note warn mt-3">
      <i className="fas fa-triangle-exclamation mt-1" />
      <div>This route is over the {kind === 'pickup' ? 'Pick up' : 'Return'} route limits in Settings: {warnings.join(' · ')}. You can still confirm it, or select fewer {kind === 'pickup' ? 'orders' : 'returns'}.</div>
    </div>
  );
}

type SortKey = 'confirmedAt' | 'retailerName' | 'city' | 'distributorName' | 'orderNo' | 'storeName' | 'orderValue' | 'weightKg';
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const ORD = (n: number) => (n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th');
/** "November 15th, 2026" — the LBNP date field text. */
const longDate = (d: Date) => `${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getDate()}${ORD(d.getDate())}, ${d.getFullYear()}`;
const dmy = (iso: string) => { const d = new Date(iso); return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`; };

/** Create Manual Pickup Plan — same layout as LBNP Create Delivery Route: Pickup Date, State / City / Distributor, Order
 *  Dates, Available Orders, then "Plan Pickup Route" opens the Auto Pickup Route (like Optimized Delivery Routes). */
export function CreatePickupPlanPage() {
  const navigate = useNavigate();
  const meta = useMeta();
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [distributorId, setDist] = useState('');
  const [days, setDays] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [date, setDate] = useState<Date | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'confirmedAt', dir: 'desc' });
  const [planning, setPlanning] = useState(false);
  const [params] = useSearchParams();
  const autoDone = useRef(false);
  const today = meta.data?.today ? new Date(`${meta.data.today}T00:00:00`) : startOfDay(new Date());
  const day = date ?? today;
  const { data, error, loading, reload } = useLoad(() => cdsApi.searchOrders({ statuses: ['CONFIRMED'], pageSize: 0 }), []);
  const all = useMemo(() => data?.rows ?? [], [data]);
  const orderDays = useMemo(() => Array.from(new Set(all.map((o) => dayKey(o.confirmedAt)))).sort(), [all]);
  const states = useMemo(() => Array.from(new Set(all.map((o) => o.state).filter(Boolean))).sort(), [all]);
  const cities = useMemo(() => Array.from(new Set(all.filter((o) => !state || o.state === state).map((o) => o.city).filter(Boolean))).sort(), [all, state]);
  const rows = useMemo(() => {
    const list = all.filter((o) => (!state || o.state === state) && (!city || o.city === city) && (!distributorId || o.distributorId === distributorId) && (!days.size || days.has(dayKey(o.confirmedAt))));
    const k = sort.key;
    const num = k === 'orderValue' || k === 'weightKg';
    return [...list].sort((a, b) => {
      const r = num ? (a[k] as number) - (b[k] as number) : String(a[k]).localeCompare(String(b[k]));
      return sort.dir === 'asc' ? r : -r;
    });
  }, [all, state, city, distributorId, days, sort]);
  // Filters change the list; selected orders that drop out of it are unselected.
  const chosen = rows.filter((o) => sel.has(o.id));
  const allOn = rows.length > 0 && rows.every((o) => sel.has(o.id));
  // Auto Plan Route (?auto=1): select every waiting order and open the Auto Pickup Route.
  useEffect(() => {
    if (params.get('auto') !== '1' || !data || autoDone.current) return;
    autoDone.current = true;
    setSel(new Set(all.map((o) => o.id)));
    if (all.length) setPlanning(true);
  }, [params, data, all]);
  const toggleDay = (d: string) => setDays((s) => { const n = new Set(s); if (n.has(d)) n.delete(d); else n.add(d); return n; });
  const onSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : s.key === key ? 'desc' : 'asc' }));
  const header = (key: SortKey, icon: string, label: string, centered = false) => (
    <th className="mat-mdc-header-cell">
      <div className={`th-wrap${centered ? ' centered' : ''}`}>
        <div className="th-content sortable" role="button" onClick={() => onSort(key)}>
          <i className={`fas ${icon}`} /> {label}
          {sort.key === key && <i className={`fas fa-arrow-${sort.dir === 'asc' ? 'up' : 'down'} sort-arrow`} />}
        </div>
      </div>
    </th>
  );
  const plan = () => {
    if (!chosen.length) { void Swal.fire({ icon: 'warning', text: 'Select at least one order to plan the pickup route', confirmButtonColor: '#1e3a8a' }); return; }
    setPlanning(true);
  };
  const filterChips = [state && ['State', state, () => { setState(''); setCity(''); }], city && ['City', city, () => setCity('')], distributorId && ['Distributor', meta.data?.distributors.find((d) => d.id === distributorId)?.name ?? '', () => setDist('')]]
    .filter(Boolean) as [string, string, () => void][];
  const maxDate = dayjs(today).add(7, 'day');
  return (
    <div className="cds-page create-delivery-route-page create-route-container">
      <header className="orders-header">
        <button className="back-btn" aria-label="Back" onClick={() => navigate('/cds/planning?tab=pickups')}><i className="fas fa-arrow-left" /></button>
        <h1><i className="fas fa-route" /> Create Manual Pickup Plan</h1>
      </header>

      <div className="route-card">
        <div className="card-content w-100 p-3">
          <div className="route-config-bar">
            <div className="config-item">
              <label className="config-label">Pickup Date</label>
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
                <DateCalendar value={dayjs(day)} minDate={dayjs(today)} maxDate={maxDate} onChange={(v: Dayjs | null) => { if (v) setDate(startOfDay(v.toDate())); setAnchor(null); }} />
              </Popover>
            </div>
            <div className="config-item">
              <label className="config-label" htmlFor="pp-state">State</label>
              <select id="pp-state" className="form-select cds-config-select" value={state} onChange={(e) => { setState(e.target.value); setCity(''); }}>
                <option value="">All States</option>{states.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="config-item">
              <label className="config-label" htmlFor="pp-city">City</label>
              <select id="pp-city" className="form-select cds-config-select" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">{state ? `All cities in ${state}` : 'All Cities'}</option>{cities.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="config-item">
              <label className="config-label" htmlFor="pp-dist">Distributor</label>
              <select id="pp-dist" className="form-select cds-config-select" value={distributorId} onChange={(e) => setDist(e.target.value)}>
                <option value="">All Distributors</option>{meta.data?.distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
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
              {!orderDays.length && <span className="text-muted small">No confirmed orders</span>}
            </div>
            {days.size > 0 && (
              <div className="selected-dates">
                <span className="selected-dates-label">Selected Dates:</span>
                {days.size === orderDays.length ? (
                  <span className="date-tag">All dates selected <button aria-label="Clear dates" onClick={() => setDays(new Set())}><i className="fas fa-times" /></button></span>
                ) : (
                  orderDays.filter((d) => days.has(d)).map((d) => <span key={d} className="date-tag">{dmy(`${d}T00:00:00`)} <button aria-label={`Remove ${d}`} onClick={() => toggleDay(d)}><i className="fas fa-times" /></button></span>)
                )}
              </div>
            )}
          </div>

          {filterChips.length > 0 && (
            <div className="applied-filters">
              <span className="applied-label"><i className="fas fa-filter" style={{ color: '#4b5563' }} /> Filters </span>
              {filterChips.map(([label, value, clear]) => <span key={label} className="filter-chip">{label}: {value} <i className="fas fa-times" role="button" aria-label={`Remove ${label}`} onClick={clear} /></span>)}
              <span className="clear-all-link" role="button" onClick={() => { setState(''); setCity(''); setDist(''); }}>Clear all</span>
            </div>
          )}

          <div className="section">
            <div className="orders-title-row">
              <h2 className="mb-0">Available Orders <small className="text-muted fw-normal">({rows.length} confirmed Seller Store orders)</small></h2>
              <label className="select-all-checkbox">
                <input type="checkbox" checked={allOn} onChange={(e) => setSel((s) => { const n = new Set(s); rows.forEach((o) => (e.target.checked ? n.add(o.id) : n.delete(o.id))); return n; })} /> Select All
              </label>
            </div>
            {error && <ErrorBox text={error} onRetry={reload} />}
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th className="mat-mdc-header-cell select-col" />
                    {header('confirmedAt', 'fa-calendar', 'Order Date')}
                    {header('retailerName', 'fa-store', 'Retailer Name')}
                    {header('city', 'fa-location-dot', 'City')}
                    {header('distributorName', 'fa-industry', 'Pickup From')}
                    {header('orderNo', 'fa-hashtag', 'Order Number')}
                    {header('storeName', 'fa-warehouse', 'CDS Store')}
                    {header('orderValue', 'fa-indian-rupee-sign', 'Order Value', true)}
                    {header('weightKg', 'fa-weight-hanging', 'Weight (kg)', true)}
                    <th className="mat-mdc-header-cell"><div className="th-wrap centered"><div className="th-content"><i className="fas fa-circle-info" /> Status</div></div></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !data && <tr><td colSpan={10} className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary me-2" />Loading orders…</td></tr>}
                  {rows.map((o) => (
                    <tr key={o.id} className="order-row">
                      <td className="select-col"><input type="checkbox" aria-label={`Select ${o.orderNo}`} checked={sel.has(o.id)} onChange={() => setSel((s) => { const n = new Set(s); if (n.has(o.id)) n.delete(o.id); else n.add(o.id); return n; })} /></td>
                      <td>{dmy(o.confirmedAt)}</td>
                      <td>{o.retailerName}<div className="text-muted text-xs">{o.locality}</div></td>
                      <td>{o.city}<div className="text-muted text-xs">{o.state}</div></td>
                      <td>{o.distributorName}</td>
                      <td>{o.orderNo}<div className="text-muted text-xs">{o.sellerOrderRef}</div></td>
                      <td>{o.storeName}</td>
                      <td className="text-center">{money(o.orderValue)}</td>
                      <td className="text-center">{kg(o.weightKg)}</td>
                      <td className="text-center"><span className="cds-wait-badge">Confirmed</span><div className="cds-trip-note">Waiting for pickup</div></td>
                    </tr>
                  ))}
                  {data && rows.length === 0 && <tr><td className="text-center py-4" colSpan={10}> No orders available </td></tr>}
                </tbody>
              </table>
            </div>
            <div className="summary-row">
              <div><span className="text-primary"><i className="fas fa-list-ol" /> Selected Orders:</span> <span className="fw-bold">{chosen.length}</span></div>
              <div><span className="text-primary"><i className="fas fa-industry" /> Pickup Points:</span> <span className="fw-bold">{new Set(chosen.map((o) => o.distributorId)).size}</span></div>
              <div><span className="text-primary"><i className="fas fa-warehouse" /> CDS Stores:</span> <span className="fw-bold">{new Set(chosen.map((o) => o.cdsStoreId)).size}</span></div>
              <div><span className="text-primary"><i className="fas fa-indian-rupee-sign" /> Total Order Value:</span> <span className="fw-bold">{money(sumOf(chosen, (o) => o.orderValue))}</span></div>
              <div><span className="text-primary"><i className="fas fa-weight-hanging" /> Total Weight:</span> <span className="fw-bold">{kg(sumOf(chosen, (o) => o.weightKg))}</span></div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="cancel-btn" onClick={() => navigate('/cds/planning?tab=pickups')}>Cancel</button>
            <button className="confirm-btn" onClick={plan}><i className="fas fa-route me-1" /> Plan Pickup Route</button>
          </div>
        </div>
      </div>

      {planning && meta.data && (
        <AutoPickupRouteModal
          orders={chosen}
          plannedDate={ymd(day)}
          distributors={meta.data.distributors}
          stores={meta.data.allStores ?? meta.data.stores}
          onClose={() => setPlanning(false)}
          onDone={() => navigate('/cds/trips?tab=DISTRIBUTOR_PICKUP')}
        />
      )}
    </div>
  );
}

/** Auto Pickup Route — the one Pickup Trip the plan creates (LBNP "Optimized Delivery Routes" look): summary, the trip
 *  card with its seller pickups and CDS store drops, vehicle and delivery person, Map View, then Confirm Routes. */
function AutoPickupRouteModal({ orders, plannedDate, distributors, stores, onClose, onDone }: { orders: OrderRow[]; plannedDate: string; distributors: Place[]; stores: Place[]; onClose: () => void; onDone: () => void }) {
  const { busy, run } = useAction();
  const [view, setView] = useState<'routes' | 'map'>('routes');
  const [open, setOpen] = useState(true);
  const [a, setA] = useState<Assign>({ vehicleId: '', deliveryPersonId: '' });
  const res = useLoad(() => cdsApi.resources(plannedDate), [plannedDate]);
  const route = useMemo(() => autoRoute(orders, distributors, stores), [orders, distributors, stores]);
  const loadKg = sumOf(orders, (o) => o.weightKg);
  const v = res.data?.vehicles.find((x) => x.id === a.vehicleId);
  const util = v ? Math.round((loadKg / v.capacityKg) * 1000) / 10 : 0;
  const stops = [...route.pickups.map((s) => ({ ...s, kind: 'Pickup from seller' })), ...route.drops.map((s) => ({ ...s, kind: 'Drop at CDS store' }))];
  const meta = useMeta();
  const limits = routeLimitWarnings(meta.data?.settings.pickupRoute, { cds: route.drops.length, distributor: route.pickups.length }, route.km, route.minutes, loadKg);
  const confirmRoutes = async () => {
    const r = await run(() => cdsApi.createPickupPlan({ orders: orders.map((o) => ({ orderId: o.id })), plannedDate, pickup: a }), 'Pickup plan created. See it in Trips › Pickups.');
    if (r) onDone();
  };
  const csv = () => downloadCsv(`pickup-route-${plannedDate}`, [{ key: 'seq', label: 'Stop' }, { key: 'kind', label: 'Action' }, { key: 'name', label: 'Name' }, { key: 'address', label: 'Address' }, { key: 'orders', label: 'Orders' }, { key: 'kg', label: 'Weight (kg)' }],
    stops.map((s) => ({ seq: s.seq, kind: s.kind, name: s.name, address: s.address, orders: s.orders, kg: Math.round(s.kg * 10) / 10 })));
  return createPortal(
    <div className="optimized-routes-modal modal-overlay">
      <div className={`modal-container${view === 'map' ? ' modal-container-wide' : ''}`} role="dialog" aria-modal="true" aria-label="Auto Pickup Route">
        <div className="modal-header">
          <h2><i className="fas fa-route text-primary me-2" />Auto Pickup Route</h2>
          <button className="close-button" aria-label="Close" onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body">
          <div className="sub-tabs">
            <div className="sub-tab-list">
              <div className={`sub-tab${view === 'routes' ? ' active' : ''}`} role="tab" onClick={() => setView('routes')}> Routes </div>
              <div className={`sub-tab${view === 'map' ? ' active' : ''}`} role="tab" onClick={() => setView('map')}><i className="fas fa-map-marked-alt" style={{ marginRight: 4 }} /> Map View </div>
            </div>
            <button className="cds-csv-btn" onClick={csv}> Download CSV </button>
          </div>

          {view === 'routes' && (
            <div className="routes-tab">
              <RouteLimitNote warnings={limits} kind="pickup" />
              <div className="summary-section">
                <div className="summary-item"><div className="summary-label">Pickup Date</div><div className="summary-value">{fmtDate(plannedDate)}</div></div>
                <div className="summary-item"><div className="summary-label">Pickup Points (Distributors)</div><div className="summary-value">{route.pickups.length}</div></div>
                <div className="summary-item"><div className="summary-label">CDS Stores</div><div className="summary-value">{route.drops.length}</div></div>
                <div className="summary-item"><div className="summary-label">Total Orders</div><div className="summary-value">{orders.length}</div></div>
                <div className="summary-item"><div className="summary-label">Total Weight</div><div className="summary-value">{kg(loadKg)}</div></div>
                <div className="summary-item"><div className="summary-label">Total Order Value</div><div className="summary-value">{money(sumOf(orders, (o) => o.orderValue))}</div></div>
                <div className="summary-item"><div className="summary-label">Total Distance / Time</div><div className="summary-value">~{route.km} km / ~{route.minutes} min</div></div>
              </div>
              <div className="route-card">
                <div className="route-header">
                  <div className="route-title"><i className={`fas ${TRIP_TYPE.DISTRIBUTOR_PICKUP.icon}`} /> {TRIP_TYPE.DISTRIBUTOR_PICKUP.label} <span className="cds-route-chip ms-2">{TRIP_TYPE.DISTRIBUTOR_PICKUP.direction}</span></div>
                  <div className="route-meta"><span className="meta-date">{fmtDate(plannedDate)}</span></div>
                </div>
                <div className="route-stats">
                  <div className="stat">
                    <div className="stat-label">Vehicle / Load / Vehicle Utilization</div>
                    <div className="stat-value">{v?.type ?? 'Not selected'} /<span>{kg(loadKg)}</span> /<span>{util}%</span></div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Stops / Distance / Time</div>
                    <div className="stat-value">{stops.length} /<span>~{route.km} km</span> /<span>~{route.minutes} min</span></div>
                  </div>
                </div>
                <div className="cds-route-assign"><AssignFields label="Vehicle & Driver" date={plannedDate} loadKg={loadKg} value={a} onChange={setA} /></div>
                <div className="orders-section">
                  <div className="orders-header" role="button" onClick={() => setOpen((x) => !x)}>Stops ({stops.length}) <i className={`fas ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} /></div>
                  {open && (
                    <div className="customer-list">
                      {stops.map((s) => (
                        <div key={`${s.kind}-${s.id}`} className="customer-row">
                          <div><i className="fas fa-map-marker-alt" /> <b>{s.seq}.</b> {s.name} <span className="text-muted small">· {s.kind}</span><div className="text-muted text-xs ms-4">{s.address}</div></div>
                          <span className="order-pill">{s.orders} order{s.orders === 1 ? '' : 's'} · {kg(s.kg)}</span>
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
              <RouteMap height={520} stops={[{ seq: 0, name: SC_HUB.name, detail: 'Start', lat: SC_HUB.lat, lng: SC_HUB.lng }, ...stops.map((s) => ({ seq: s.seq, name: s.name, detail: `${s.kind} · ${s.address}`, lat: s.lat, lng: s.lng }))]} />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-back" onClick={onClose}>Back</button>
          <button className="btn-confirm-routes" disabled={!a.vehicleId || !a.deliveryPersonId || busy} onClick={() => void confirmRoutes()}>{busy ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : ' Confirm Routes '}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------- Return Planning

const returnValue = (r: ReturnRow) => sumOf(r.lines, (l) => (l.acceptedQty ?? 0) * l.unitPrice);
/** When the return reached the CDS (accepted there), else when it was last updated. */
const receivedAt = (r: ReturnRow) => [...r.history].reverse().find((h) => h.to === 'RECEIVED_AT_CDS')?.at ?? r.updatedAt;

/** The return route the plan creates (same rules as the engine): from the Service Centre to the CDS stores of the
 *  returns in the shortest order, then from the last CDS store to the sellers (distributors). */
function autoReturnRoute(rets: ReturnRow[], stores: Place[], distributors: Place[]) {
  const leg = (start: { lat: number; lng: number }, places: Place[], key: (r: ReturnRow) => string, from: number) =>
    sequenceStops(start, places).map((i, k) => {
      const p = places[i];
      const rs = rets.filter((r) => key(r) === p.id);
      return { ...p, seq: from + k + 1, returns: rs.length, kg: sumOf(rs, (r) => r.weightKg), value: sumOf(rs, returnValue) };
    });
  const sts = stores.filter((s) => rets.some((r) => r.cdsStoreId === s.id));
  const dists = distributors.filter((d) => rets.some((r) => r.distributorId === d.id));
  const pickups = leg(SC_HUB, sts, (r) => r.cdsStoreId, 0);
  const last = pickups[pickups.length - 1] ?? SC_HUB;
  const handovers = leg(last, dists, (r) => r.distributorId, pickups.length);
  const m = routeMetrics([SC_HUB, ...pickups, ...handovers], pickups.length + handovers.length);
  return { pickups, handovers, km: m.distanceKm, minutes: m.etaMinutes };
}

type RetSortKey = 'received' | 'returnNo' | 'storeName' | 'distributorName' | 'retailerName' | 'value' | 'weightKg';

/** Create Return Plan — same layout as LBNP Create Delivery Route: Return Date, CDS Store / Seller, Received Dates,
 *  Available Returns, then "Plan Return Route" opens the Auto Return Route. `?auto=1` selects all and opens it. */
export function CreateReturnPlanPage() {
  const navigate = useNavigate();
  const meta = useMeta();
  const [params] = useSearchParams();
  const [store, setStore] = useState('');
  const [seller, setSeller] = useState('');
  const [days, setDays] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [date, setDate] = useState<Date | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<{ key: RetSortKey; dir: 'asc' | 'desc' }>({ key: 'received', dir: 'desc' });
  const [planning, setPlanning] = useState(false);
  const autoDone = useRef(false);
  const min = meta.data ? new Date(`${meta.data.settings.nextDayPlanning ? meta.data.tomorrow : meta.data.today}T00:00:00`) : startOfDay(new Date());
  const day = date ?? min;
  const { data, error, loading, reload } = useLoad(() => cdsApi.searchReturns({ statuses: ['RECEIVED_AT_CDS'], unplanned: true, pageSize: 0 }), []);
  const all = useMemo(() => (data?.rows ?? []).filter((r) => r.accepted > 0), [data]);
  const receivedDays = useMemo(() => Array.from(new Set(all.map((r) => dayKey(receivedAt(r))))).sort(), [all]);
  const rows = useMemo(() => {
    const list = all.filter((r) => (!store || r.cdsStoreId === store) && (!seller || r.distributorId === seller) && (!days.size || days.has(dayKey(receivedAt(r)))));
    const val = (r: ReturnRow): string | number => (sort.key === 'received' ? receivedAt(r) : sort.key === 'value' ? returnValue(r) : r[sort.key]);
    return [...list].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      return sort.dir === 'asc' ? c : -c;
    });
  }, [all, store, seller, days, sort]);
  const chosen = rows.filter((r) => sel.has(r.id));
  const allOn = rows.length > 0 && rows.every((r) => sel.has(r.id));
  useEffect(() => {
    if (params.get('auto') !== '1' || !data || autoDone.current) return;
    autoDone.current = true;
    setSel(new Set(all.map((r) => r.id)));
    if (all.length) setPlanning(true);
  }, [params, data, all]);
  const toggleDay = (d: string) => setDays((s) => { const n = new Set(s); if (n.has(d)) n.delete(d); else n.add(d); return n; });
  const onSort = (key: RetSortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : s.key === key ? 'desc' : 'asc' }));
  const header = (key: RetSortKey, icon: string, label: string, centered = false) => (
    <th className="mat-mdc-header-cell">
      <div className={`th-wrap${centered ? ' centered' : ''}`}>
        <div className="th-content sortable" role="button" onClick={() => onSort(key)}>
          <i className={`fas ${icon}`} /> {label}
          {sort.key === key && <i className={`fas fa-arrow-${sort.dir === 'asc' ? 'up' : 'down'} sort-arrow`} />}
        </div>
      </div>
    </th>
  );
  const plan = () => {
    if (!chosen.length) { void Swal.fire({ icon: 'warning', text: 'Select at least one return to plan the return route', confirmButtonColor: '#1e3a8a' }); return; }
    setPlanning(true);
  };
  const chips = [store && ['CDS Store', meta.data?.stores.find((s) => s.id === store)?.name ?? '', () => setStore('')], seller && ['Seller', meta.data?.distributors.find((d) => d.id === seller)?.name ?? '', () => setSeller('')]]
    .filter(Boolean) as [string, string, () => void][];
  return (
    <div className="cds-page create-delivery-route-page create-route-container">
      <header className="orders-header">
        <button className="back-btn" aria-label="Back" onClick={() => navigate('/cds/planning?tab=returns')}><i className="fas fa-arrow-left" /></button>
        <h1><i className="fas fa-route" /> Create Manual Return Plan <small className="cds-route-chip ms-2">{TRIP_TYPE.CDS_RETURN.direction}</small></h1>
      </header>

      <div className="route-card">
        <div className="card-content w-100 p-3">
          <div className="route-config-bar">
            <div className="config-item">
              <label className="config-label">Return Date</label>
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
              {meta.data?.settings.nextDayPlanning && <span className="text-muted small">Return plans are for the next day or later.</span>}
            </div>
            <div className="config-item">
              <label className="config-label" htmlFor="rp-store">CDS Store</label>
              <select id="rp-store" className="form-select cds-config-select" value={store} onChange={(e) => setStore(e.target.value)}>
                <option value="">All CDS Stores</option>{meta.data?.stores.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </div>
            <div className="config-item">
              <label className="config-label" htmlFor="rp-seller">Seller</label>
              <select id="rp-seller" className="form-select cds-config-select" value={seller} onChange={(e) => setSeller(e.target.value)}>
                <option value="">All Sellers</option>{meta.data?.distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="section">
            <h2>Received Dates</h2>
            <div className="date-options">
              {receivedDays.map((d) => (
                <label key={d} className={`date-checkbox${days.has(d) ? ' checked' : ''}`}>
                  <input type="checkbox" checked={days.has(d)} onChange={() => toggleDay(d)} />
                  <span>{dmy(`${d}T00:00:00`)}</span>
                </label>
              ))}
              {!receivedDays.length && <span className="text-muted small">No accepted returns at the CDS stores</span>}
            </div>
            {days.size > 0 && (
              <div className="selected-dates">
                <span className="selected-dates-label">Selected Dates:</span>
                {days.size === receivedDays.length ? (
                  <span className="date-tag">All dates selected <button aria-label="Clear dates" onClick={() => setDays(new Set())}><i className="fas fa-times" /></button></span>
                ) : (
                  receivedDays.filter((d) => days.has(d)).map((d) => <span key={d} className="date-tag">{dmy(`${d}T00:00:00`)} <button aria-label={`Remove ${d}`} onClick={() => toggleDay(d)}><i className="fas fa-times" /></button></span>)
                )}
              </div>
            )}
          </div>

          {chips.length > 0 && (
            <div className="applied-filters">
              <span className="applied-label"><i className="fas fa-filter" style={{ color: '#4b5563' }} /> Filters </span>
              {chips.map(([label, value, clear]) => <span key={label} className="filter-chip">{label}: {value} <i className="fas fa-times" role="button" aria-label={`Remove ${label}`} onClick={clear} /></span>)}
              <span className="clear-all-link" role="button" onClick={() => { setStore(''); setSeller(''); }}>Clear all</span>
            </div>
          )}

          <div className="section">
            <div className="orders-title-row">
              <h2 className="mb-0">Available Returns <small className="text-muted fw-normal">({rows.length} accepted at the CDS stores)</small></h2>
              <label className="select-all-checkbox">
                <input type="checkbox" checked={allOn} onChange={(e) => setSel((s) => { const n = new Set(s); rows.forEach((r) => (e.target.checked ? n.add(r.id) : n.delete(r.id))); return n; })} /> Select All
              </label>
            </div>
            {error && <ErrorBox text={error} onRetry={reload} />}
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th className="mat-mdc-header-cell select-col" />
                    {header('received', 'fa-calendar', 'Received Date')}
                    {header('returnNo', 'fa-hashtag', 'Return Number')}
                    {header('storeName', 'fa-warehouse', 'Pickup From (CDS)')}
                    {header('distributorName', 'fa-industry', 'Return To (Seller)')}
                    {header('retailerName', 'fa-store', 'Retailer')}
                    <th className="mat-mdc-header-cell"><div className="th-wrap"><div className="th-content"><i className="fas fa-boxes-stacked" /> Products</div></div></th>
                    {header('value', 'fa-indian-rupee-sign', 'Return Value', true)}
                    {header('weightKg', 'fa-weight-hanging', 'Weight (kg)', true)}
                    <th className="mat-mdc-header-cell"><div className="th-wrap centered"><div className="th-content"><i className="fas fa-circle-info" /> Status</div></div></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !data && <tr><td colSpan={10} className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary me-2" />Loading returns…</td></tr>}
                  {rows.map((r) => (
                    <tr key={r.id} className="order-row">
                      <td className="select-col"><input type="checkbox" aria-label={`Select ${r.returnNo}`} checked={sel.has(r.id)} onChange={() => setSel((s) => { const n = new Set(s); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} /></td>
                      <td>{dmy(receivedAt(r))}</td>
                      <td>{r.returnNo}<div className="text-muted text-xs">{r.orderNo}</div></td>
                      <td>{r.storeName}</td>
                      <td>{r.distributorName}</td>
                      <td>{r.retailerName}</td>
                      <td title={r.lines.filter((l) => (l.acceptedQty ?? 0) > 0).map((l) => `${l.name} × ${l.acceptedQty} · ${money(l.unitPrice)}`).join('\n')}>{products(r.lines, (l) => l.acceptedQty ?? 0)}<div className="text-muted text-xs">{r.lines[0]?.reason}</div></td>
                      <td className="text-center">{money(returnValue(r))}</td>
                      <td className="text-center">{kg(r.weightKg)}</td>
                      <td className="text-center"><span className="cds-wait-badge">Received at CDS</span><div className="cds-trip-note">Waiting for return pickup</div></td>
                    </tr>
                  ))}
                  {data && rows.length === 0 && <tr><td className="text-center py-4" colSpan={10}> No returns available </td></tr>}
                </tbody>
              </table>
            </div>
            <div className="summary-row">
              <div><span className="text-primary"><i className="fas fa-list-ol" /> Selected Returns:</span> <span className="fw-bold">{chosen.length}</span></div>
              <div><span className="text-primary"><i className="fas fa-warehouse" /> CDS Pickups:</span> <span className="fw-bold">{new Set(chosen.map((r) => r.cdsStoreId)).size}</span></div>
              <div><span className="text-primary"><i className="fas fa-industry" /> Sellers:</span> <span className="fw-bold">{new Set(chosen.map((r) => r.distributorId)).size}</span></div>
              <div><span className="text-primary"><i className="fas fa-indian-rupee-sign" /> Total Return Value:</span> <span className="fw-bold">{money(sumOf(chosen, returnValue))}</span></div>
              <div><span className="text-primary"><i className="fas fa-weight-hanging" /> Total Weight:</span> <span className="fw-bold">{kg(sumOf(chosen, (r) => r.weightKg))}</span></div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="cancel-btn" onClick={() => navigate('/cds/planning?tab=returns')}>Cancel</button>
            <button className="confirm-btn" onClick={plan}><i className="fas fa-route me-1" /> Plan Return Route</button>
          </div>
        </div>
      </div>

      {planning && meta.data && (
        <AutoReturnRouteModal
          returns={chosen}
          plannedDate={ymd(day)}
          stores={meta.data.allStores ?? meta.data.stores}
          distributors={meta.data.distributors}
          onClose={() => setPlanning(false)}
          onDone={() => navigate('/cds/trips?tab=CDS_RETURN')}
        />
      )}
    </div>
  );
}

/** Auto Return Route — the CDS Return Trip the plan creates (LBNP "Optimized Delivery Routes" look): summary, the trip
 *  card with its CDS pickups and seller handovers, vehicle and delivery person, Map View, then Confirm Routes. */
function AutoReturnRouteModal({ returns, plannedDate, stores, distributors, onClose, onDone }: { returns: ReturnRow[]; plannedDate: string; stores: Place[]; distributors: Place[]; onClose: () => void; onDone: () => void }) {
  const { busy, run } = useAction();
  const [view, setView] = useState<'routes' | 'map'>('routes');
  const [open, setOpen] = useState(true);
  const [a, setA] = useState<Assign>({ vehicleId: '', deliveryPersonId: '' });
  const res = useLoad(() => cdsApi.resources(plannedDate), [plannedDate]);
  const route = useMemo(() => autoReturnRoute(returns, stores, distributors), [returns, stores, distributors]);
  const loadKg = sumOf(returns, (r) => r.weightKg);
  const v = res.data?.vehicles.find((x) => x.id === a.vehicleId);
  const util = v ? Math.round((loadKg / v.capacityKg) * 1000) / 10 : 0;
  const stops = [...route.pickups.map((s) => ({ ...s, kind: 'Pickup at CDS' })), ...route.handovers.map((s) => ({ ...s, kind: 'Handover to seller' }))];
  const meta = useMeta();
  const limits = routeLimitWarnings(meta.data?.settings.returnRoute, { cds: route.pickups.length, distributor: route.handovers.length }, route.km, route.minutes, loadKg);
  const confirmRoutes = async () => {
    const r = await run(() => cdsApi.createReturnPlan({ returnIds: returns.map((x) => x.id), plannedDate, ...a }), 'Return plan created. See it in Trips › Returns.');
    if (r) onDone();
  };
  const csv = () => downloadCsv(`return-route-${plannedDate}`, [{ key: 'seq', label: 'Stop' }, { key: 'kind', label: 'Action' }, { key: 'name', label: 'Name' }, { key: 'address', label: 'Address' }, { key: 'returns', label: 'Returns' }, { key: 'kg', label: 'Weight (kg)' }],
    stops.map((s) => ({ seq: s.seq, kind: s.kind, name: s.name, address: s.address, returns: s.returns, kg: Math.round(s.kg * 10) / 10 })));
  return createPortal(
    <div className="optimized-routes-modal modal-overlay">
      <div className={`modal-container${view === 'map' ? ' modal-container-wide' : ''}`} role="dialog" aria-modal="true" aria-label="Auto Return Route">
        <div className="modal-header">
          <h2><i className="fas fa-route text-primary me-2" />Auto Return Route</h2>
          <button className="close-button" aria-label="Close" onClick={onClose}><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body">
          <div className="sub-tabs">
            <div className="sub-tab-list">
              <div className={`sub-tab${view === 'routes' ? ' active' : ''}`} role="tab" onClick={() => setView('routes')}> Routes </div>
              <div className={`sub-tab${view === 'map' ? ' active' : ''}`} role="tab" onClick={() => setView('map')}><i className="fas fa-map-marked-alt" style={{ marginRight: 4 }} /> Map View </div>
            </div>
            <button className="cds-csv-btn" onClick={csv}> Download CSV </button>
          </div>

          {view === 'routes' && (
            <div className="routes-tab">
              <RouteLimitNote warnings={limits} kind="return" />
              <div className="summary-section">
                <div className="summary-item"><div className="summary-label">Return Date</div><div className="summary-value">{fmtDate(plannedDate)}</div></div>
                <div className="summary-item"><div className="summary-label">CDS Pickups</div><div className="summary-value">{route.pickups.length}</div></div>
                <div className="summary-item"><div className="summary-label">Sellers</div><div className="summary-value">{route.handovers.length}</div></div>
                <div className="summary-item"><div className="summary-label">Total Returns</div><div className="summary-value">{returns.length}</div></div>
                <div className="summary-item"><div className="summary-label">Total Weight</div><div className="summary-value">{kg(loadKg)}</div></div>
                <div className="summary-item"><div className="summary-label">Total Return Value</div><div className="summary-value">{money(sumOf(returns, returnValue))}</div></div>
                <div className="summary-item"><div className="summary-label">Total Distance / Time</div><div className="summary-value">~{route.km} km / ~{route.minutes} min</div></div>
              </div>
              <div className="route-card">
                <div className="route-header">
                  <div className="route-title"><i className={`fas ${TRIP_TYPE.CDS_RETURN.icon}`} /> {TRIP_TYPE.CDS_RETURN.label} <span className="cds-route-chip ms-2">{TRIP_TYPE.CDS_RETURN.direction}</span></div>
                  <div className="route-meta"><span className="meta-date">{fmtDate(plannedDate)}</span></div>
                </div>
                <div className="route-stats">
                  <div className="stat">
                    <div className="stat-label">Vehicle / Load / Vehicle Utilization</div>
                    <div className="stat-value">{v?.type ?? 'Not selected'} /<span>{kg(loadKg)}</span> /<span>{util}%</span></div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Stops / Distance / Time</div>
                    <div className="stat-value">{stops.length} /<span>~{route.km} km</span> /<span>~{route.minutes} min</span></div>
                  </div>
                </div>
                <div className="cds-route-assign"><AssignFields label="Vehicle & Driver" date={plannedDate} loadKg={loadKg} value={a} onChange={setA} /></div>
                <div className="orders-section">
                  <div className="orders-header" role="button" onClick={() => setOpen((x) => !x)}>Stops ({stops.length}) <i className={`fas ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} /></div>
                  {open && (
                    <div className="customer-list">
                      {stops.map((s) => (
                        <div key={`${s.kind}-${s.id}`} className="customer-row">
                          <div><i className="fas fa-map-marker-alt" /> <b>{s.seq}.</b> {s.name} <span className="text-muted small">· {s.kind}</span><div className="text-muted text-xs ms-4">{s.address}</div></div>
                          <span className="order-pill">{s.returns} return{s.returns === 1 ? '' : 's'} · {kg(s.kg)}</span>
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
              <RouteMap height={520} stops={[{ seq: 0, name: SC_HUB.name, detail: 'Start', lat: SC_HUB.lat, lng: SC_HUB.lng }, ...stops.map((s) => ({ seq: s.seq, name: s.name, detail: `${s.kind} · ${s.address}`, lat: s.lat, lng: s.lng }))]} />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-back" onClick={onClose}>Back</button>
          <button className="btn-confirm-routes" disabled={!a.vehicleId || !a.deliveryPersonId || busy} onClick={() => void confirmRoutes()}>{busy ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : ' Confirm Routes '}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
