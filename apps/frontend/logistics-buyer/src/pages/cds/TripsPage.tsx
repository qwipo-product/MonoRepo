// Trips. Service Centre: two tabs — Pickups (Seller to CDS Stores) and Returns (CDS Stores to Sellers). CDS User: retailer-wise
// delivery trips only. Trip details run each stop with an OTP (on behalf of the delivery person / Delivery Partner App).
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import { cdsApi, type StopView, type TripView } from '../../api/services/cds.service';
import { ORDER_STATUS, RETURN_STATUS, STOP_ACTION, TRIP_SHOWN, TRIP_STATUS_GROUPS, TRIP_TYPE, type TripShown } from '../../cds/status';
import type { TripType } from '../../cds/types';
import { RouteMapDialog, mapStops } from './RouteMap';
import { alertError, askText, Badge, ModuleIntro, confirm, downloadCsv, ErrorBox, FiltersDialog, fmtDate, fmtDateTime, kg, Loading, money, Pager, sumOf, Table, Tabs, toast, useAction, useCdsSession, useLoad, useMeta, type FilterField } from './ui';
import { PLAN_DIRECTION } from './ScPlanningPages';
import DataLoading from '../../components/DataLoading';
import '../trips/TripsPage.css';
import '../trips/TripDetailsPage.css';
import '../trips/dialogs/TripDialogs.css';

const SC_TABS: { id: TripType; label: string; sub: string; icon: string }[] = [
  { id: 'DISTRIBUTOR_PICKUP', label: 'Pickups', sub: PLAN_DIRECTION.pickups, icon: 'fa-truck-ramp-box' },
  { id: 'CDS_RETURN', label: 'Returns', sub: PLAN_DIRECTION.returns, icon: 'fa-rotate-left' },
];
const BADGE: Record<TripShown, string> = { ASSIGNED: 'planned', IN_PROGRESS: 'in-progress', COMPLETED: 'completed', CANCELLED: 'cancelled' };
const PILL: Record<StopView['status'], string> = { PENDING: 'pending', DONE: 'delivered', PARTIAL: 'pending', FAILED: 'returned' };
const duration = (a?: string | null, b?: string | null) => {
  if (!a) return 'N/A';
  const m = Math.max(0, Math.round(((b ? new Date(b) : new Date()).getTime() - new Date(a).getTime()) / 60000));
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

/** Trips — same layout as the LBNP Trips screen: header (Map View, Filter), stat cards, applied filters, trips table
 *  with expandable details (Route Overview, Stop Summary, Route). Service Centre: one tab per trip type. */
export default function TripsPage() {
  const { sc } = useCdsSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TripType) ?? (sc ? 'DISTRIBUTOR_PICKUP' : 'RETAILER_DELIVERY');
  const [f, setF] = useState({ status: '', date: '' });
  const [search, setSearch] = useState('');
  const [pageNumber, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Map<string, TripView>>(new Map());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<{ trip: TripView; top: number; right: number } | null>(null);
  const [map, setMap] = useState<TripView[] | null>(null);
  const { busy, run } = useAction();
  const meta = useMeta();
  /** Drop Points limit: Settings › Pick up / Return (Max Distributor Stops + Max CDS Stops). */
  const maxStops = (t: TripView) => {
    const c = t.type === 'CDS_RETURN' ? meta.data?.settings.returnRoute : t.type === 'DISTRIBUTOR_PICKUP' ? meta.data?.settings.pickupRoute : undefined;
    return c ? c.maxCdsStops + c.maxDistributorStops : 'N/A';
  };
  const { data, error, loading, reload } = useLoad(() => cdsApi.searchTrips({ types: [tab], statuses: f.status ? TRIP_STATUS_GROUPS[f.status]?.statuses ?? [] : [], search, date: f.date || undefined, pageNumber, pageSize }), [tab, f, search, pageNumber, pageSize]);
  const all = useLoad(() => cdsApi.searchTrips({ types: [tab], pageSize: 0 }), [tab]);
  const trips = data?.rows ?? [];
  const count = (st: TripShown) => (all.data?.rows ?? []).filter((t) => t.shown.status === st).length;
  const fields: FilterField[] = [
    { key: 'status', label: 'Status', type: 'select', allLabel: 'All', options: Object.entries(TRIP_STATUS_GROUPS).map(([k, g]) => ({ value: k, label: g.label })) },
    { key: 'date', label: 'Planned Date', type: 'date' },
  ];
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    document.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => { document.removeEventListener('click', close); window.removeEventListener('scroll', close, true); };
  }, [menu]);
  const switchTab = (t: TripType) => { setParams({ tab: t }); setPage(1); setSelected(new Map()); setExpanded(null); };
  const toggle = (t: TripView) => setSelected((m) => { const n = new Map(m); if (n.has(t.id)) n.delete(t.id); else n.set(t.id, t); return n; });
  const allOn = trips.length > 0 && trips.every((t) => selected.has(t.id));
  const toggleAll = () => setSelected((m) => { const n = new Map(m); trips.forEach((t) => (allOn ? n.delete(t.id) : n.set(t.id, t))); return n; });
  // Planned trips can be cancelled (Service Centre and CDS User); once started, the delivery agent handles the trip.
  const canCancel = (t: TripView) => ['PLANNED', 'ASSIGNED'].includes(t.status) || (!sc && t.status === 'STARTED' && t.stops.every((s) => s.status === 'PENDING'));
  const cancel = async (t: TripView) => {
    const r = await askText(`Cancel ${t.tripNo}?`, 'Cancellation reason', 'Cancel trip', true);
    if (r && (await run(() => cdsApi.cancelTrip(t.id, r), 'Trip cancelled'))) { reload(); all.reload(); }
  };
  const download = (t: TripView) => downloadCsv(t.tripNo, [{ key: 'seq', label: 'Stop' }, { key: 'action', label: 'Action' }, { key: 'name', label: 'Name' }, { key: 'address', label: 'Address' }, { key: 'status', label: 'Status' }, { key: 'otp', label: 'OTP' }, { key: 'verifiedAt', label: 'OTP verified at' }],
    t.stops.map((s, i) => ({ seq: i + 1, action: STOP_ACTION[s.action].label, name: s.name, address: s.address, status: STOP_LABEL[s.status], otp: otpOf(s), verifiedAt: s.verifiedAt ? fmtDateTime(s.verifiedAt) : '' })));
  const openMenu = (t: TripView, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setMenu((m) => (m?.trip.id === t.id ? null : { trip: t, top: Math.min(r.bottom + 4, window.innerHeight - 240), right: window.innerWidth - r.right }));
  };
  const chips = [
    f.status && { k: 'status' as const, text: `Status: ${TRIP_STATUS_GROUPS[f.status]?.label ?? f.status}` },
    f.date && { k: 'date' as const, text: `Planned Date: ${fmtDate(f.date)}` },
  ].filter(Boolean) as { k: 'status' | 'date'; text: string }[];
  const tripMapStops = (ts: TripView[]) => ts.flatMap((t) => t.stops.map((s, i) => ({ seq: i + 1, name: s.name, detail: `${t.tripNo} · ${STOP_ACTION[s.action].label}`, lat: s.lat, lng: s.lng, status: s.status })));

  // Drill-down: same as the LBNP Trips row details — Route Overview, Order Summary + Collection Summary, Delivery Route.
  const details = (t: TripView) => {
    const f = tripFigures(t);
    const seg = (x: number) => `max(2px, ${(x / (f.total || 1)) * 100}%)`;
    const rows: [string, string, string][] = [
      ['directions_car', 'Vehicle', t.vehicleRegNo ? `${t.vehicleRegNo} · ${t.vehicleType}` : 'Not Assigned'],
      ['person', 'Driver Name', t.deliveryPersonName || 'Not Assigned'],
      ['phone', 'Contact Number', t.deliveryPersonPhone || 'Not Available'],
      ['person_outline', 'Helper', t.helperName || 'Not Assigned'],
      ['play_circle_outline', 'Start Time', t.startedAt ? fmtDateTime(t.startedAt) : 'N/A'],
      ['access_time', 'Estimated Completion', estCompletion(t)],
      ...OTP_ROWS[t.type].map(([label, actions]) => ['vpn_key', label, lastOtp(t.stops, actions)] as [string, string, string]),
    ];
    const stops = showAll.has(t.id) ? t.stops : t.stops.slice(0, 3);
    return (
      <tr className="trip-details-row">
        <td colSpan={14}>
          <div className="trip-details">
            <div className="details-container">
              <div className="detail-card route-overview">
                <h3>Route Overview</h3>
                <div className="info-card">
                  {rows.map(([icon, label, value]) => (
                    <div className="info-row" key={label}><i className="material-icons">{icon}</i><span className="label">{label}</span><span className="value" title={value}>{value}</span></div>
                  ))}
                </div>
              </div>
              <div className="detail-card trip-summary">
                <h3>Order Summary</h3>
                <div className="order-summary-grid">
                  {([['total', 'receipt_long', 'Total', f.total], ['delivered', 'check_circle', 'Delivered', f.delivered], ['partial', 'rule', 'Partial', f.partial], ['returned', 'undo', 'Return', f.returned], ['pending', 'schedule', 'Pending', f.pending]] as [string, string, string, number][]).map(([cls, icon, label, value]) => (
                    <div className={`os-item ${cls}`} key={cls}><div className="os-icon"><i className="material-icons">{icon}</i></div><div className="os-count">{value}</div><div className="os-label">{label}</div></div>
                  ))}
                </div>
                {f.total > 0 && (
                  <div className="os-progress">
                    <div className="seg delivered" style={{ width: seg(f.delivered) }} title={`Delivered: ${f.delivered}`} />
                    <div className="seg partial" style={{ width: seg(f.partial) }} title={`Partial: ${f.partial}`} />
                    <div className="seg returned" style={{ width: seg(f.returned) }} title={`Return: ${f.returned}`} />
                    <div className="seg pending" style={{ width: seg(f.pending) }} title={`Pending: ${f.pending}`} />
                  </div>
                )}
                <h3 className="collection-title">Collection Summary</h3>
                <div className="info-card collection-card">
                  <div className="info-row no-icon"><span className="label">Total Sale Value</span><span className="value">{money(f.saleValue)}</span></div>
                  <div className="info-row no-icon dashed"><span className="label">Total Delivered Value</span><span className="value">{money(f.deliveredValue)}</span></div>
                  <div className="info-row no-icon"><span className="label">Total Partial Value</span><span className="value">{money(f.partialValue)}</span></div>
                  <div className="info-row no-icon"><span className="label">Total Return Value</span><span className="value">{money(f.returnValue)}</span></div>
                  <div className="info-row"><i className="material-icons">location_on</i><span className="label">Total Delivery Points</span><span className="value">{t.stops.length}</span></div>
                  <div className="info-row"><i className="material-icons">payments</i><span className="label">COD Collection</span><span className="value">{money(t.collected.cod)}</span></div>
                  <div className="info-row"><i className="material-icons">smartphone</i><span className="label">Digital Collection</span><span className="value">{money(t.collected.digital)}</span></div>
                  <div className="info-row"><i className="material-icons">account_balance_wallet</i><span className="label">Net Sale Collection</span><span className="value">{money(t.collected.cod + t.collected.digital)}</span></div>
                </div>
              </div>
              <div className="detail-card delivery-route">
                <h3>Delivery Route</h3>
                <div className="delivery-stops">
                  {stops.map((s, i) => (
                    <div key={s.id} className={`delivery-stop${i === 0 ? ' first-stop' : ''}${!showAll.has(t.id) && i === stops.length - 1 ? ' last-visible-stop' : ''}`}>
                      {i > 0 && <div className="connector" />}
                      {i === 0 ? <div className="stop-icon"><i className="material-icons">store</i></div> : <div className="stop-number">{i}</div>}
                      <div className="stop-details">
                        <div className="stop-info">
                          <div className="stop-name">{s.name}</div>
                          <div className="stop-address">{s.address}</div>
                          <div className="stop-time">{s.completedAt ? fmtDateTime(s.completedAt) : 'Time not available'}</div>
                          <div className="stop-otp"><span className="otp-label">OTP:</span><span className="otp-badge">{otpOf(s)}</span></div>
                        </div>
                        <div className="stop-status"><span className={`status-pill ${PILL[s.status]}`}>{STOP_LABEL[s.status]}</span></div>
                      </div>
                    </div>
                  ))}
                  {t.stops.length > 3 && (
                    <div className="show-more-container">
                      <button className="show-more-btn" onClick={() => setShowAll((x) => { const m = new Set(x); if (m.has(t.id)) m.delete(t.id); else m.add(t.id); return m; })}>
                        <i className="material-icons">{showAll.has(t.id) ? 'expand_less' : 'expand_more'}</i>{showAll.has(t.id) ? 'Show Less' : 'Show More Stops'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="cds-page trips-container cds-trips-lbnp">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon"><i className="material-icons">local_shipping</i></div>
          <div>
            <div className="cds-title-row"><h1>Trips</h1><ModuleIntro text={sc ? "Track the trips from your plans: pickups from sellers to CDS stores, and returns to sellers." : "Your delivery trips from the CDS store to retailers."} /></div>
            <p className="header-description">{sc ? 'Track and manage pickup trips and return trips.' : 'Track and manage your retailer delivery trips (CDS to Retailer).'}</p>
          </div>
        </div>
        <div className="actions">
          <button className="filter-btn map-view-btn" disabled={selected.size === 0} title={selected.size === 0 ? 'Select one or more trips to view on map' : ''} onClick={() => setMap(Array.from(selected.values()))}>
            <i className="material-icons">map</i> Map View{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
          <button className="filter-btn" onClick={() => setShowFilters(true)}><i className="material-icons">filter_list</i> Filter</button>
        </div>
      </div>

      {sc && <Tabs value={tab} onChange={switchTab} tabs={SC_TABS} />}

      <div className="stats-grid">
        {([
          ['Total Trips', all.data?.total ?? 0, 'All Time', `${TRIP_TYPE[tab].label}s`, 'fas fa-truck-loading', 'trips'],
          ['In Progress', count('IN_PROGRESS'), 'Active Trips', 'On the road', 'fas fa-route', 'delivery'],
          ['Completed', count('COMPLETED'), 'Completed Trips', 'Successfully delivered', 'fas fa-check-circle', 'customers'],
          ['Planned', count('ASSIGNED'), 'Upcoming Trips', 'Scheduled for delivery', 'fas fa-calendar-alt', 'orders'],
        ] as [string, number, string, string, string, string][]).map(([title, value, sub, line, icon, cls]) => (
          <div className="stat-card" key={title}>
            <div className="stat-content">
              <div className="stat-title">{title}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-subtitle">{sub}</div>
              <div className="stat-line">{line}</div>
            </div>
            <div className={`stat-icon ${cls}`}><i className={icon} /></div>
          </div>
        ))}
      </div>

      <div className="cds-trips-search">
        <i className="fas fa-search" />
        <input className="form-control form-control-sm" placeholder="Search trip number, driver, vehicle or stop" aria-label="Search trips" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {chips.length > 0 && (
        <div className="applied-filters-bar">
          <span className="applied-label">Applied filters:</span>
          {chips.map((c) => (
            <span className="filter-chip" key={c.k}>{c.text}<button className="chip-remove" aria-label={`Remove ${c.text}`} onClick={() => { setF((x) => ({ ...x, [c.k]: '' })); setPage(1); }}><i className="fas fa-times" /></button></span>
          ))}
          <button className="clear-all-btn" onClick={() => { setF({ status: '', date: '' }); setPage(1); }}>Clear all</button>
        </div>
      )}

      <div className="trips-table-container">
        {error && <ErrorBox text={error} onRetry={reload} />}
        {loading && !data && <Loading text="Loading trips..." />}
        {data && trips.length > 0 && (
          <table className="trips-table">
            <thead>
              <tr>
                <th className="checkbox-cell"><input type="checkbox" aria-label="Select all trips" checked={allOn} onChange={toggleAll} /></th>
                <th className="expand-cell" />
                <th>Trip Number</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Drop Points</th>
                <th>Vol Weight</th>
                <th>Driver Name</th>
                <th>Planned Kms</th>
                <th>Created Date</th>
                <th>Arrival Time</th>
                <th>Time Covered</th>
                <th>Trip Charges</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => {
                const open = expanded === t.id;
                return (
                  <Fragment key={t.id}>
                    <tr className={`trip-row${open ? ' expanded' : ''}`}>
                      <td className="checkbox-cell"><input type="checkbox" aria-label={`Select ${t.tripNo}`} checked={selected.has(t.id)} onChange={() => toggle(t)} /></td>
                      <td className="expand-cell" onClick={() => setExpanded(open ? null : t.id)}><i className={`material-icons expand-icon${open ? ' rotated' : ''}`}>chevron_right</i></td>
                      <td className="trip-number"><a role="button" className="text-primary text-decoration-none" onClick={() => navigate(`/cds/trips/${t.id}`)}>{t.tripNo}</a></td>
                      <td>{t.providerName}</td>
                      <td><span className={`status-badge ${BADGE[t.shown.status]}`}>{TRIP_SHOWN[t.shown.status].label}</span>{t.shown.note && <div className="cds-trip-note">{t.shown.note}</div>}</td>
                      <td>{`${t.stops.length} / ${maxStops(t)}`}</td>
                      <td>{`${Math.round(t.loadKg * 10) / 10} / ${t.capacityKg || 'N/A'}`}</td>
                      <td>{t.deliveryPersonName || 'N/A'}</td>
                      <td>{t.distanceKm ? `${t.distanceKm} km` : 'N/A'}</td>
                      <td>{fmtDateTime(t.createdAt)}</td>
                      <td>{t.completedAt && t.status !== 'CANCELLED' ? fmtDateTime(t.completedAt) : 'N/A'}</td>
                      <td>{t.startedAt ? duration(t.startedAt, t.completedAt) : 'N/A'}</td>
                      <td>N/A</td>
                      <td><button className="kebab-btn" title="Actions" aria-label={`Actions for ${t.tripNo}`} onClick={(e) => openMenu(t, e)}><i className="material-icons">more_vert</i></button></td>
                    </tr>
                    {open && details(t)}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        {data && trips.length === 0 && <div className="no-trips-message"><i className="fas fa-inbox" /><p>No trips found</p></div>}
        {data && trips.length > 0 && (
          <div className="d-flex justify-content-center p-1 bg-white mt-2 trips-paginator">
            <Pager total={data.total} pageNumber={data.pageNumber} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
          </div>
        )}
      </div>

      {menu && (
        <div className="kebab-dropdown" role="menu" style={{ top: menu.top, right: menu.right }} onClick={(e) => e.stopPropagation()}>
          {canCancel(menu.trip) && !busy && (
            <div className="kebab-item" role="menuitem" onClick={() => { const t = menu.trip; setMenu(null); void cancel(t); }}><i className="material-icons" style={{ color: '#ef4444' }}>cancel</i><span>Cancel</span></div>
          )}
          <div className={`kebab-item${menu.trip.status === 'CANCELLED' ? ' disabled' : ''}`} role="menuitem" onClick={() => { if (menu.trip.status !== 'CANCELLED') setMap([menu.trip]); setMenu(null); }}><i className="material-icons" style={{ color: '#3b82f6' }}>place</i><span>Map view</span></div>
          <div className="kebab-item" role="menuitem" onClick={() => { const id = menu.trip.id; setMenu(null); navigate(`/cds/trips/${id}`); }}><i className="material-icons" style={{ color: '#3b82f6' }}>visibility</i><span>View details</span></div>
          <div className="kebab-item" role="menuitem" onClick={() => { download(menu.trip); setMenu(null); }}><i className="material-icons" style={{ color: '#22c55e' }}>download</i><span>Download stops</span></div>
        </div>
      )}

      {showFilters && <FiltersDialog title="Trip Filters" fields={fields} values={f} onClose={() => setShowFilters(false)} onApply={(v) => { setF({ status: v.status, date: v.date }); setPage(1); setShowFilters(false); }} />}
      {map && (
        <RouteMapDialog
          title={map.length === 1 ? `${map[0].tripNo} · Map View` : `${map.length} trips · Map View`}
          subtitle={map.length === 1 ? `${TRIP_TYPE[map[0].type].label} (${TRIP_TYPE[map[0].type].direction}) · ${fmtDate(map[0].plannedDate)} · ${map[0].deliveryPersonName}` : map.map((t) => t.tripNo).join(' · ')}
          stops={map.length === 1 ? mapStops(map[0].stops) : tripMapStops(map)}
          groups={map.length > 1 ? map.map((t) => mapStops(t.stops)) : undefined}
          onClose={() => setMap(null)}
        />
      )}
    </div>
  );
}

const stopTone = (s: StopView) => (s.status === 'DONE' ? 'done' : s.status === 'FAILED' ? 'fail' : s.status === 'PARTIAL' ? 'partial' : '');
const STOP_LABEL = { PENDING: 'Pending', DONE: 'Done', PARTIAL: 'Partial', FAILED: 'Failed' };

/** OTP code of a stop (like the LBNP stop OTP badge); 'N/A' until the OTP is sent at the stop. */
const otpOf = (s?: StopView) => s?.otp?.code ?? 'N/A';
/** The latest OTP of the stops with these actions (LBNP "Pickup OTP" / "Return OTP"). */
const lastOtp = (stops: StopView[], actions: StopView['action'][]) => otpOf([...stops].reverse().find((s) => actions.includes(s.action) && s.otp));
const STOP_CLASS: Record<StopView['status'], string> = { PENDING: 'pending', DONE: 'delivered', PARTIAL: 'partialdelivered', FAILED: 'returned' };
/** Trip OTP rows per trip type: [label, stop actions]. */
const OTP_ROWS: Record<TripType, [string, StopView['action'][]][]> = {
  DISTRIBUTOR_PICKUP: [['Pickup OTP', ['DISTRIBUTOR_PICKUP']], ['Drop OTP', ['CDS_HANDOVER']]],
  CDS_DELIVERY: [['Pickup OTP', ['DISTRIBUTOR_PICKUP']], ['Drop OTP', ['CDS_HANDOVER']]],
  CDS_RETURN: [['Pickup OTP', ['CDS_RETURN_PICKUP']], ['Return OTP', ['SELLER_RETURN_HANDOVER']]],
  RETAILER_DELIVERY: [['Pickup OTP', ['CDS_ORDER_PICKUP']], ['Return OTP', ['RETURN_HANDOVER_CDS']]],
};
/** The stop where each trip type drops its orders (Delivered / Pending in Ordered Products). */
const DROP_ACTION: Record<TripType, StopView['action']> = { DISTRIBUTOR_PICKUP: 'CDS_HANDOVER', CDS_DELIVERY: 'CDS_HANDOVER', CDS_RETURN: 'SELLER_RETURN_HANDOVER', RETAILER_DELIVERY: 'RETAILER_DELIVERY' };
const th = (icon: string, label: string, align = 'text-center') => <th className={`text-uppercase py-2 px-3 small ${align}`}><i className={`fas ${icon} me-1 text-primary`} />{label}</th>;
const estCompletion = (t: TripView) => (t.startedAt ? fmtDateTime(new Date(new Date(t.startedAt).getTime() + t.etaMinutes * 60000).toISOString()) : 'N/A');

/** Each order / return on the trip and its last stop (where it is dropped). */
function lastStops(t: TripView) {
  const m = new Map<string, { ref: StopView['refs'][number]; stop: StopView; planned: number }>();
  t.stops.forEach((s) => s.refs.forEach((r) => {
    const planned = sumOf(s.lines.filter((l) => (l.returnId ?? l.orderId) === r.id), (l) => l.plannedQty * l.unitPrice);
    m.set(r.id, { ref: r, stop: s, planned: m.get(r.id)?.planned ?? planned });
  }));
  return m;
}
/** LBNP Order Summary and Collection Summary figures for a trip. */
function tripFigures(t: TripView) {
  const docs = Array.from(lastStops(t).values());
  const n = (st: StopView['status']) => docs.filter((d) => d.stop.status === st);
  return {
    total: docs.length, delivered: n('DONE').length, partial: n('PARTIAL').length, returned: n('FAILED').length, pending: n('PENDING').length,
    saleValue: sumOf(docs, (d) => d.planned),
    deliveredValue: sumOf(n('DONE'), (d) => d.ref.value),
    partialValue: sumOf(n('PARTIAL'), (d) => d.ref.value),
    returnValue: sumOf(n('FAILED'), (d) => d.planned) + sumOf(n('PARTIAL'), (d) => d.planned - d.ref.value),
  };
}

type DetailTab = 'summary' | 'stops' | 'customer' | 'distributor' | 'cds' | 'product' | 'return';

/** Edit Resource — same dialog as LBNP: vehicle and driver, with the capacity acknowledgement. Planned trips only. */
function EditResourceDialog({ trip, onClose }: { trip: TripView; onClose: (saved?: boolean) => void }) {
  const res = useLoad(() => cdsApi.resources(trip.plannedDate), [trip.plannedDate]);
  const { busy, run } = useAction();
  const [vehicleId, setVehicleId] = useState(trip.vehicleId);
  const [driverId, setDriverId] = useState(trip.deliveryPersonId);
  const [ack, setAck] = useState(false);
  const free = <X extends { id: string; available: boolean; active: boolean; busyTripNo: string | null }>(x: X, current: string) => x.id === current || (x.active && (x.available || x.busyTripNo === trip.tripNo));
  const vehicles = (res.data?.vehicles ?? []).filter((v) => free(v, trip.vehicleId));
  const drivers = (res.data?.deliveryPersons ?? []).filter((p) => free(p, trip.deliveryPersonId));
  const v = vehicles.find((x) => x.id === vehicleId);
  const over = !!v && trip.loadKg > v.capacityKg;
  const can = !!vehicleId && !!driverId && !busy && !res.loading && (!over || ack);
  const submit = async () => {
    if (await run(() => cdsApi.updateTripResources(trip.id, { vehicleId, deliveryPersonId: driverId }), 'Resources updated successfully.')) onClose(true);
  };
  return (
    <Dialog open onClose={() => onClose()} className="resource-dialog-container trip-dialog" disableEnforceFocus PaperProps={{ className: 'trip-dialog-paper', style: { width: 500, maxWidth: '95vw' } }}>
      <div className="dialog-header">
        <h2 className="dialog-title">Edit Resource</h2>
        <button className="close-btn" aria-label="Close" onClick={() => onClose()}><i className="fas fa-times" /></button>
      </div>
      <div className="dialog-body">
        <p className="dialog-subtitle">Update the vehicle and driver details for this trip.</p>
        {res.loading && !res.data ? [0, 1].map((k) => <div className="skeleton-group" key={k}><div className="skeleton skeleton-label" /><div className="skeleton skeleton-select" /></div>) : (
          <>
            <div className="form-group">
              <label htmlFor="vehicle">Select Vehicle <span className="required">*</span></label>
              <select id="vehicle" value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setAck(false); }}>
                <option value="" disabled>Select a vehicle</option>
                {vehicles.map((x) => <option key={x.id} value={x.id}>{`${x.regNo} - ${x.type} (${x.capacityKg} kg)`}</option>)}
              </select>
              {vehicles.length === 0 && <div className="no-data-text">No vehicles available for this trip.</div>}
            </div>
            <div className="form-group">
              <label htmlFor="driver">Select Driver <span className="required">*</span></label>
              <select id="driver" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="" disabled>Select a driver</option>
                {drivers.map((x) => <option key={x.id} value={x.id}>{`${x.name} (${x.phone})`}</option>)}
              </select>
              {drivers.length === 0 && <div className="no-data-text">No drivers available for this trip.</div>}
            </div>
          </>
        )}
      </div>
      {over && (
        <div className="capacity-warning">
          <label>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span>I acknowledge that the trip weight exceeds the selected vehicle's capacity and accept the risks associated with this assignment.</span>
          </label>
        </div>
      )}
      <div className="dialog-footer">
        <button className="cancel-btn" onClick={() => onClose()}>Cancel</button>
        <button className="primary-btn" disabled={!can} onClick={() => void submit()}>{busy ? <><i className="fas fa-spinner fa-spin" /> Updating...</> : <><i className="fas fa-save" /> Update Resource</>}</button>
      </div>
    </Dialog>
  );
}

/** Update Helper — same dialog as LBNP. Planned trips only. */
function UpdateHelperDialog({ trip, onClose }: { trip: TripView; onClose: (saved?: boolean) => void }) {
  const res = useLoad(() => cdsApi.resources(trip.plannedDate), [trip.plannedDate]);
  const { busy, run } = useAction();
  const [helperId, setHelperId] = useState('');
  const helpers = (res.data?.deliveryPersons ?? []).filter((p) => p.active && p.id !== trip.deliveryPersonId);
  const picked = helpers.find((h) => h.id === helperId);
  const submit = async () => {
    if (picked && (await run(() => cdsApi.updateTripHelper(trip.id, picked.id), `Helper Updated to ${picked.name} successfully!`))) onClose(true);
  };
  return (
    <Dialog open onClose={() => onClose()} className="helper-dialog-container trip-dialog" disableEnforceFocus PaperProps={{ className: 'trip-dialog-paper', style: { width: 500, maxWidth: '95vw' } }}>
      <div className="dialog-header">
        <h2 className="dialog-title">Update Helper</h2>
        <button className="close-btn" aria-label="Close" onClick={() => onClose()}><i className="fas fa-times" /></button>
      </div>
      <div className="dialog-body">
        {res.loading && !res.data ? <div className="loading-text">Loading available helpers...</div> : (
          <div className="form-group">
            <label htmlFor="helper">Select Helper <span className="required">*</span></label>
            <select id="helper" value={helperId} onChange={(e) => setHelperId(e.target.value)}>
              <option value="" disabled>Select a helper</option>
              {helpers.map((h) => <option key={h.id} value={h.id}>{`${h.name} (${h.phone})`}</option>)}
            </select>
            {helpers.length === 0 && <div className="no-data-text">No helpers available for this trip.</div>}
          </div>
        )}
      </div>
      <div className="dialog-footer">
        <button className="cancel-btn" onClick={() => onClose()}>Cancel</button>
        <button className="primary-btn" disabled={!picked || busy} onClick={() => void submit()}>{busy ? <><i className="fas fa-spinner fa-spin" /> Updating...</> : <><i className="fas fa-user-check" /> Update</>}</button>
      </div>
    </Dialog>
  );
}

/** LBNP table card (mat-card + table) used by every Trip details tab. */
function TabTable({ head, children, foot, empty, cols }: { head: ReactNode; children: ReactNode; foot?: ReactNode; empty: string | false; cols: number }) {
  return (
    <div className="trip-details-content">
      <div className="mat-card mat-elevation-z3">
        <div className="mat-card-content p-0">
          <div className="table-responsive">
            <table className="mat-mdc-table w-100">
              <thead><tr className="mat-mdc-header-row small bg-light">{head}</tr></thead>
              <tbody>
                {children}
                {empty && <tr className="mat-mdc-row"><td colSpan={cols} className="text-center py-4"><i className="fas fa-inbox me-2 text-muted" /> {empty} </td></tr>}
              </tbody>
              {foot && <tfoot><tr className="mat-mdc-footer-row small bg-light">{foot}</tr></tfoot>}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Trip details — same screen as the LBNP Trip Details: header (trip number, provider), then the tabs Summary,
 *  Customer Wise Orders, Distributor Wise Orders, CDS Wise Orders and Ordered Products (pickup) or Return Products
 *  (return). Summary has Edit Resource and Update Helper for planned trips. CDS User trips also have Stops. */
export function TripDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { sc } = useCdsSession();
  const { busy, run } = useAction();
  const { data, error, reload } = useLoad(() => cdsApi.trip(id), [id]);
  const [openStop, setOpenStop] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab | ''>('');
  const [showAll, setShowAll] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'resource' | 'helper' | null>(null);
  const t = data?.trip;
  useEffect(() => {
    if (t && !openStop) setOpenStop(t.stops.find((s) => s.status === 'PENDING')?.id ?? null);
  }, [t, openStop]);
  if (error) return <div className="cds-page"><ErrorBox text={error} onRetry={reload} /></div>;
  if (!t || !data) return <div className="trip-details-container"><div className="loading-container"><DataLoading overlay={false} message="Loading trip details..." showTip /></div></div>;
  const running = ['STARTED', 'IN_PROGRESS'].includes(t.status);
  const retailerTrip = t.type === 'RETAILER_DELIVERY';
  const returnTrip = t.type === 'CDS_RETURN';
  const isPlanned = ['PLANNED', 'ASSIGNED'].includes(t.status);
  // A running trip of the CDS User opens on its stops (that is where the work is); others open on the summary.
  const view: DetailTab = tab || (running && data.canRun ? 'stops' : 'summary');
  const start = async () => {
    const early = t.plannedDate > new Date().toISOString().slice(0, 10);
    if (!(await confirm(`Start ${t.tripNo}?`, early ? `This trip is planned for ${fmtDate(t.plannedDate)}. Start it now?` : `${t.deliveryPersonName} starts the trip in the Delivery Partner App.`, 'Start trip'))) return;
    if (await run(() => cdsApi.startTrip(t.id), 'Trip started')) { reload(); setTab('stops'); }
  };
  const back = sc ? `/cds/trips?tab=${t.type}` : !data.canRun ? '/cds/grn' : '/cds/trips';
  const f = tripFigures(t);
  const last = lastStops(t);
  const qtyOf = (l: StopView['lines'][number]) => l.actualQty ?? l.plannedQty;
  const valueOf = (s: StopView) => sumOf(s.lines, (l) => qtyOf(l) * l.unitPrice);
  const tabs: [DetailTab, string][] = [
    ['summary', 'Summary'],
    ...(retailerTrip && data.canRun ? [['stops', 'Stops'] as [DetailTab, string]] : []),
    ['customer', 'Customer Wise Orders'],
    ...(retailerTrip ? [] : [['distributor', 'Distributor Wise Orders'], ['cds', 'CDS Wise Orders']] as [DetailTab, string][]),
    ...(returnTrip ? [] : [['product', 'Ordered Products'] as [DetailTab, string]]),
    ...(returnTrip || retailerTrip ? [['return', 'Return Products'] as [DetailTab, string]] : []),
  ];
  const visible = showAll ? t.stops : t.stops.slice(0, 3);
  const info = (icon: string, label: string, value: ReactNode, key = label) => (
    <div className="info-row" key={key}><div className="info-item full-width"><i className="material-icons">{icon}</i><div className="label">{label}</div><div className="value">{value}</div></div></div>
  );

  // Customer Wise Orders: one row per retailer (customer) with its orders / returns on this trip.
  const docs = [
    ...data.orders.map((o) => ({ id: o.id, orderId: o.id, retailerId: o.retailerId, name: o.retailerName, address: o.retailerAddress })),
    ...data.returns.map((r) => ({ id: r.id, orderId: r.orderId, retailerId: r.retailerId ?? `grn-${r.id}`, name: r.retailerName, address: r.retailerAddress })),
  ];
  const customers = Array.from(docs.reduce((m, d) => m.set(d.retailerId, [...(m.get(d.retailerId) ?? []), d]), new Map<string, typeof docs>()).values()).map((ds) => {
    const stops = ds.map((d) => last.get(d.id)).filter((x): x is NonNullable<typeof x> => !!x);
    const stop = stops.reduce<StopView | undefined>((a, x) => (!a || x.stop.seq > a.seq ? x.stop : a), undefined);
    return { key: ds[0].retailerId, name: ds[0].name, address: ds[0].address, docs: ds, stop, amount: sumOf(stops, (x) => x.ref.value) };
  }).sort((a, z) => (a.stop?.seq ?? 0) - (z.stop?.seq ?? 0) || a.name.localeCompare(z.name));

  // Ordered Products (orders) and Return Products (returns), product-wise like LBNP.
  const drops = t.stops.filter((s) => s.action === DROP_ACTION[t.type]);
  const dropQty = (sku: string, done: boolean) => sumOf(drops.filter((s) => (s.status !== 'PENDING') === done), (s) => sumOf(s.lines.filter((l) => l.sku === sku && l.orderId), (l) => (done ? l.actualQty ?? 0 : l.plannedQty)));
  const products = Array.from(data.orders.flatMap((o) => o.lines).reduce((m, l) => {
    const p = m.get(l.sku) ?? { sku: l.sku, name: l.name, mrp: l.unitPrice, qty: 0 };
    p.qty += l.qty;
    return m.set(l.sku, p);
  }, new Map<string, { sku: string; name: string; mrp: number; qty: number }>()).values()).map((p) => ({ ...p, delivered: dropQty(p.sku, true), pending: dropQty(p.sku, false) }));
  const returnProducts = Array.from(data.returns.flatMap((r) => r.lines).reduce((m, l) => {
    const p = m.get(l.sku) ?? { sku: l.sku, name: l.name, mrp: l.unitPrice, ordered: 0, returned: 0 };
    p.ordered += l.orderedQty;
    p.returned += l.qty;
    return m.set(l.sku, p);
  }, new Map<string, { sku: string; name: string; mrp: number; ordered: number; returned: number }>()).values());

  const partyTable = (kind: 'DISTRIBUTOR' | 'CDS') => {
    const rows = t.stops.filter((s) => s.partyType === kind);
    const timeLabel = kind === 'DISTRIBUTOR' ? (returnTrip ? 'Delivered Time' : 'Picked Up Time') : returnTrip ? 'Picked Up Time' : 'Delivered Time';
    return (
      <TabTable cols={8} empty={!rows.length && `No ${kind === 'DISTRIBUTOR' ? 'distributor' : 'CDS store'} orders found`}
        head={<>{th('fa-hashtag', 'Stop No.')}{th(kind === 'DISTRIBUTOR' ? 'fa-industry' : 'fa-warehouse', kind === 'DISTRIBUTOR' ? 'Distributor Name' : 'CDS Store Name', 'text-start')}{th('fa-map-marker-alt', 'Address', 'text-start')}{th('fa-map-marker-alt', 'OTP', 'text-start')}{th('fa-info-circle', 'Status')}{th('fa-clock', timeLabel)}{th('fa-rupee-sign', 'Orders/Amount')}{th('fa-cogs', 'Actions')}</>}
        foot={rows.length > 0 && <><td /><td /><td /><td /><td /><td className="text-center fw-bold"> Total: </td><td className="text-center fw-bold">{`${new Set(rows.flatMap((s) => s.refs.map((r) => r.id))).size}/${money(sumOf(rows, valueOf))}`}</td><td /></>}>
        {rows.flatMap((s) => [
          <tr className="mat-mdc-row small" key={s.id}>
            <td className="text-center">{s.seq}</td>
            <td className="text-start">{s.name}</td>
            <td className="text-start">{s.address}</td>
            <td className="text-start">{otpOf(s)}</td>
            <td className="text-center"><span className={`cds-badge ${s.status === 'DONE' ? 'green' : s.status === 'FAILED' ? 'red' : s.status === 'PARTIAL' ? 'amber' : 'grey'}`}>{STOP_LABEL[s.status]}</span></td>
            <td className="text-center">{s.completedAt ? fmtDateTime(s.completedAt) : 'N/A'}</td>
            <td className="text-center">{`${s.refs.length}/${money(valueOf(s))}`}</td>
            <td className="text-center"><button className="btn btn-sm text-primary cds-icon-btn" title={openRow === s.id ? 'Hide orders' : 'View orders'} aria-label={`View orders at ${s.name}`} onClick={() => setOpenRow(openRow === s.id ? null : s.id)}><i className={`fas ${openRow === s.id ? 'fa-eye-slash' : 'fa-eye'}`} /></button></td>
          </tr>,
          ...(openRow === s.id ? s.refs.map((r) => {
            const o = data.orders.find((x) => x.id === r.id);
            const ret = data.returns.find((x) => x.id === r.id);
            return (
              <tr key={`${s.id}-${r.id}`} className="mat-mdc-row small cds-sub-row">
                <td />
                <td className="text-start" colSpan={2}>{o ? <a role="button" className="text-primary" onClick={() => navigate(`/cds/orders/${o.id}`)}>{r.no}</a> : <>{r.no}{ret && <span className="text-muted"> · {ret.orderNo}</span>}</>}</td>
                <td className="text-start" colSpan={2}>{r.retailer}</td>
                <td className="text-center">{o ? <Badge meta={ORDER_STATUS[o.status]} /> : ret ? <Badge meta={RETURN_STATUS[ret.status]} /> : null}</td>
                <td className="text-center">{`${r.units} units / ${money(r.value)}`}</td>
                <td />
              </tr>
            );
          }) : []),
        ])}
      </TabTable>
    );
  };

  return (
    <div className="trip-details-container cds-trip-details">
      <div className="trip-details-header">
        <div className="header-left">
          <button className="back-btn" aria-label="Back" onClick={() => navigate(back)}><i className="fas fa-arrow-left" /></button>
          <h1>{t.tripNo}</h1>
          <div className="provider">{'Provider: ' + (t.providerName || 'N/A')}</div>
        </div>
        <div className="header-right">
          {data.canRun && t.status === 'ASSIGNED' && <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" disabled={busy} onClick={() => void start()}><i className="fas fa-play me-2" />Start Trip</button>}
        </div>
      </div>
      {t.status === 'CANCELLED' && <div className="cds-note warn mb-3"><i className="fas fa-ban mt-1" />Cancelled: {t.cancelReason}</div>}

      <div className="content-container">
        <div className="tabs-container">
          <div className="tabs">
            {tabs.map(([key, label]) => <div key={key} role="tab" className={`tab${view === key ? ' active' : ''}`} onClick={() => setTab(key)}>{label}</div>)}
          </div>
        </div>
        {view === 'summary' && (
          <div className="trip-details-content">
            <div className="details-container">
              <div className="information-card route-overview">
                <h3>Route Overview</h3>
                <div className="suggested-vehicle"><i className="material-icons">local_shipping</i>{` Suggested: ${t.vehicleRegNo} (${t.capacityKg} kgs)`}</div>
                <div className="resource-details-box">
                  <div className="resource-header">
                    <span>RESOURCE DETAILS</span>
                    <i className={`fas fa-pencil-alt edit-resource-icon${!isPlanned ? ' disabled' : ''}`} title="Edit Resource" role="button" aria-label="Edit Resource" onClick={() => isPlanned && setDialog('resource')} />
                  </div>
                  {([['directions_car', 'Vehicle', t.vehicleRegNo ? `${t.vehicleRegNo} · ${t.vehicleType}` : 'N/A'], ['person', 'Driver Name', t.deliveryPersonName || 'N/A'], ['phone', 'Contact Number', t.deliveryPersonPhone || 'N/A']] as [string, string, string][]).map(([icon, label, value]) => (
                    <div className="resource-row" key={label}><div className="info-item full-width"><i className="material-icons">{icon}</i><div className="label">{label}</div><div className="value">{value}</div></div></div>
                  ))}
                </div>
                {info('person_outline', 'Helper', <>{' ' + (t.helperName || 'N/A') + ' '}<i className={`fas fa-pencil-alt edit-helper-icon${!isPlanned ? ' disabled' : ''}`} title="Update Helper" role="button" aria-label="Update Helper" onClick={() => isPlanned && setDialog('helper')} /></>)}
                {info('play_circle_outline', 'Start Time', t.startedAt ? fmtDateTime(t.startedAt) : 'N/A')}
                {info('access_time', 'Estimated Completion', estCompletion(t))}
                {OTP_ROWS[t.type].map(([label, actions]) => info('vpn_key', label, lastOtp(t.stops, actions)))}
              </div>

              <div className="information-card trip-summary">
                <h3>Trip Summary</h3>
                {info('monetization_on', 'Total Sale Value', money(f.saleValue))}
                {info('monetization_on', 'Total Delivered Value', money(f.deliveredValue))}
                {info('monetization_on', 'Total Return Value', money(f.returnValue))}
                {info('location_on', 'Total Delivery Points', String(t.stops.length))}
                {info('payments', 'COD Collection', money(t.collected.cod))}
                {info('smartphone', 'Digital Collection', money(t.collected.digital))}
                {info('account_balance_wallet', 'Net Collection', money(t.collected.cod + t.collected.digital))}
              </div>

              <div className="information-card delivery-progress">
                <h3>Delivery Progress</h3>
                <div className="info-card delivery-progress-container">
                  <div className="delivery-route">
                    <div className="delivery-stops">
                      {visible.map((s, i) => (
                        <div key={s.id} className={`delivery-stop${i === 0 ? ' first-stop' : ''}${i === visible.length - 1 && !showAll ? ' last-visible-stop' : ''}`}>
                          {i > 0 && <div className="connector" />}
                          {i === 0 ? <div className="stop-icon"><i className="material-icons">store</i></div> : <div className="stop-number">{i}</div>}
                          <div className="stop-details">
                            <div className="stop-info">
                              <div className="stop-name">{s.name}</div>
                              <div className="stop-address">{s.address}</div>
                              <div className="stop-time">{s.completedAt ? fmtDateTime(s.completedAt) : 'Time not available'}</div>
                            </div>
                            <div className="stop-status"><span className={STOP_CLASS[s.status]}>{STOP_LABEL[s.status]}</span></div>
                            <div className="stop-otp"><span className="otp-label">OTP : </span><span className="otp-badge">{otpOf(s)}</span></div>
                          </div>
                        </div>
                      ))}
                      {t.stops.length > 3 && (
                        <div className="show-more-container">
                          <button className="show-more-btn" onClick={() => setShowAll((x) => !x)}><i className="material-icons">{showAll ? 'expand_less' : 'expand_more'}</i>{showAll ? ' Show Less ' : ' Show More Stops '}</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {view === 'customer' && (
        <TabTable cols={8} empty={!customers.length && 'No customer orders found'}
          head={<>{th('fa-hashtag', 'Stop No.')}{th('fa-store', 'Customer Business Name', 'text-start')}{th('fa-map-marker-alt', 'Address', 'text-start')}{th('fa-map-marker-alt', 'OTP', 'text-start')}{th('fa-info-circle', 'Status')}{th('fa-clock', 'Delivered Time')}{th('fa-rupee-sign', 'Orders/Amount')}{th('fa-cogs', 'Actions')}</>}>
          {customers.map((c) => (
            <tr className="mat-mdc-row small" key={c.key}>
              <td className="text-center">{c.stop?.seq ?? 'N/A'}</td>
              <td className="text-start">{c.name}</td>
              <td className="text-start">{c.address || 'N/A'}</td>
              <td className="text-start">{c.stop?.partyType === 'RETAILER' ? otpOf(c.stop) : 'N/A'}</td>
              <td className="text-center">{c.stop ? <span className={`cds-badge ${c.stop.status === 'DONE' ? 'green' : c.stop.status === 'FAILED' ? 'red' : c.stop.status === 'PARTIAL' ? 'amber' : 'grey'}`}>{STOP_LABEL[c.stop.status]}</span> : 'N/A'}</td>
              <td className="text-center">{c.stop?.completedAt ? fmtDateTime(c.stop.completedAt) : 'N/A'}</td>
              <td className="text-center">{`${c.docs.length}/${money(c.amount)}`}</td>
              <td className="text-center">
                <button className="btn btn-sm text-primary cds-icon-btn" title="View Order" aria-label={`View orders of ${c.name}`} onClick={() => navigate(c.docs.length === 1 || c.key.startsWith('grn-') ? `/cds/orders/${c.docs[0].orderId}` : `/cds/orders?retailer=${c.key}`)}><i className="fas fa-eye" /></button>
              </td>
            </tr>
          ))}
        </TabTable>
      )}
      {view === 'distributor' && partyTable('DISTRIBUTOR')}
      {view === 'cds' && partyTable('CDS')}
      {view === 'product' && (
        <TabTable cols={10} empty={!products.length && 'No product orders found'}
          head={<>{th('fa-box', 'Product Name', 'text-start')}{th('fa-ruler', 'UOM')}{th('fa-barcode', 'UPC')}{th('fa-box', 'Cases')}{th('fa-cubes', 'PCS')}{th('fa-tag', 'MRP')}{th('fa-check-circle', 'Delivered')}{th('fa-clock', 'Pending')}{th('fa-layer-group', 'Total Qty')}{th('fa-rupee-sign', 'Amount')}</>}
          foot={products.length > 0 && <><td /><td /><td /><td /><td /><td /><td /><td className="text-center fw-bold"> Total: </td><td className="text-center fw-bold">{sumOf(products, (p) => p.qty)}</td><td className="text-center fw-bold">{money(sumOf(products, (p) => p.qty * p.mrp))}</td></>}>
          {products.map((p) => (
            <tr className="mat-mdc-row small" key={p.sku}>
              <td className="text-start">{p.name}</td>
              <td className="text-center">PCS</td>
              <td className="text-center">{p.sku}</td>
              <td className="text-center">0</td>
              <td className="text-center">{p.qty}</td>
              <td className="text-center">{money(p.mrp)}</td>
              <td className="text-center">{p.delivered}</td>
              <td className="text-center">{p.pending}</td>
              <td className="text-center">{p.qty}</td>
              <td className="text-center">{money(p.qty * p.mrp)}</td>
            </tr>
          ))}
        </TabTable>
      )}
      {view === 'return' && (
        <TabTable cols={9} empty={!returnProducts.length && 'No return products found'}
          head={<>{th('fa-box', 'Product Name', 'text-start')}{th('fa-ruler', 'UOM')}{th('fa-barcode', 'UPC')}{th('fa-box', 'Cases')}{th('fa-cubes', 'PCS')}{th('fa-tag', 'MRP')}{th('fa-layer-group', 'Ordered Qty')}{th('fa-undo', 'Return Qty')}{th('fa-rupee-sign', 'Amount')}</>}
          foot={returnProducts.length > 0 && <><td /><td /><td /><td /><td /><td className="text-center fw-bold"> Total: </td><td className="text-center fw-bold">{sumOf(returnProducts, (p) => p.ordered)}</td><td className="text-center fw-bold">{sumOf(returnProducts, (p) => p.returned)}</td><td className="text-center fw-bold">{money(sumOf(returnProducts, (p) => p.returned * p.mrp))}</td></>}>
          {returnProducts.map((p) => (
            <tr className="mat-mdc-row small" key={p.sku}>
              <td className="text-start">{p.name}</td>
              <td className="text-center">PCS</td>
              <td className="text-center">{p.sku}</td>
              <td className="text-center">0</td>
              <td className="text-center">{p.returned}</td>
              <td className="text-center">{money(p.mrp)}</td>
              <td className="text-center">{p.ordered}</td>
              <td className="text-center">{p.returned}</td>
              <td className="text-center">{money(p.returned * p.mrp)}</td>
            </tr>
          ))}
        </TabTable>
      )}
      {view === 'stops' && (
        <div className="trip-details-content cds-plain">
          {data.canRun && t.status === 'ASSIGNED' && <div className="cds-note m-3"><i className="fas fa-circle-info mt-1" />Start the trip to record the stops.</div>}
          {t.stops.map((s) => (
            <div key={s.id}>
              <div className="cds-stop" role="button" onClick={() => setOpenStop(openStop === s.id ? null : s.id)}>
                <div className={`num ${stopTone(s)}`}>{s.seq}</div>
                <div className="flex-grow-1 small">
                  <div className="fw-semibold">{STOP_ACTION[s.action].label} · {s.name}</div>
                  <div className="text-muted">{s.address}</div>
                  {s.verifiedAt && <div className="text-success text-xs mt-1"><i className="fas fa-shield-halved me-1" />OTP verified {fmtDateTime(s.verifiedAt)}</div>}
                  {s.failReason && <div className="text-danger text-xs">{s.status === 'FAILED' ? 'Failed' : 'Note'}: {s.failReason}</div>}
                </div>
                <div className="text-end small">
                  <span className={`cds-badge ${s.status === 'DONE' ? 'green' : s.status === 'FAILED' ? 'red' : s.status === 'PARTIAL' ? 'amber' : 'grey'}`}>{STOP_LABEL[s.status]}</span>
                  <div className="text-muted text-xs mt-1">{s.lines.reduce((a, l) => a + (l.actualQty ?? 0), 0)}/{s.lines.reduce((a, l) => a + l.plannedQty, 0)} units</div>
                </div>
                <i className={`fas fa-chevron-${openStop === s.id ? 'up' : 'down'} text-muted small ms-2 mt-1`} />
              </div>
              {openStop === s.id && (
                <div className="px-3 pb-3">
                  {s.status === 'PENDING' && running && data.canRun
                    ? <StopAction key={s.id} tripId={t.id} stop={s} orders={data.orders} onDone={() => { setOpenStop(null); reload(); }} />
                    : <StopLines stop={s} />}
                  {s.action === 'RETAILER_DELIVERY' && s.status !== 'FAILED' && running && data.canRun && <AdHocReturn tripId={t.id} stop={s} onDone={reload} />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {dialog === 'resource' && <EditResourceDialog trip={t} onClose={(saved) => { setDialog(null); if (saved) reload(); }} />}
      {dialog === 'helper' && <UpdateHelperDialog trip={t} onClose={(saved) => { setDialog(null); if (saved) reload(); }} />}
    </div>
  );
}

/** The stop's items with price, value and weight. Value and weight use the actual quantity once the stop is done. */
function StopLines({ stop }: { stop: StopView }) {
  const handover = stop.action === 'RETURN_HANDOVER_CDS';
  const qty = (l: StopView['lines'][number]) => l.actualQty ?? l.plannedQty;
  const value = (l: StopView['lines'][number]) => qty(l) * l.unitPrice;
  const weight = (l: StopView['lines'][number]) => qty(l) * l.unitWeightKg;
  const cols = 4 + (handover ? 2 : 0);
  return (
    <Table head={['Order / return', 'Item', 'Planned Qty', 'Actual Qty', ...(handover ? ['Accepted', 'Rejected'] : []), 'Unit Price', 'Total Value', 'Total Weight']}>
      {stop.lines.map((l, i) => (
        <tr key={i} className="mat-mdc-row">
          <td className="small">{l.returnId ? 'Return' : 'Order'}</td><td className="small">{l.name}</td><td>{l.plannedQty}</td>
          <td className={l.actualQty !== null && l.actualQty < l.plannedQty ? 'text-danger fw-bold' : ''}>{l.actualQty ?? '—'}</td>
          {handover && <><td>{l.acceptedQty ?? '—'}</td><td>{l.rejectedQty ?? '—'}</td></>}
          <td className="small">{money(l.unitPrice)}</td>
          <td className="small">{money(value(l))}</td>
          <td className="small">{kg(weight(l))}</td>
        </tr>
      ))}
      <tr className="mat-mdc-row cds-retailer-row">
        <td colSpan={cols} className="text-end">Total · {stop.lines.length} item{stop.lines.length === 1 ? '' : 's'} · {stop.lines.reduce((a, l) => a + qty(l), 0)} units</td>
        <td />
        <td>{money(stop.lines.reduce((a, l) => a + value(l), 0))}</td>
        <td>{kg(stop.lines.reduce((a, l) => a + weight(l), 0))}</td>
      </tr>
    </Table>
  );
}

type TripOrders = Awaited<ReturnType<typeof cdsApi.trip>>['orders'];

/** One stop: send the OTP, record quantities (and money / accepted-rejected), verify the OTP, or mark it failed. */
function StopAction({ tripId, stop, orders, onDone }: { tripId: string; stop: StopView; orders: TripOrders; onDone: () => void }) {
  const { busy, run } = useAction();
  const [qty, setQty] = useState<number[]>(stop.lines.map((l) => l.plannedQty));
  const [acc, setAcc] = useState<number[]>(stop.lines.map((l) => l.plannedQty));
  const [otp, setOtp] = useState('');
  const [sms, setSms] = useState<{ to: string; text: string; expires: string } | null>(null);
  const handover = stop.action === 'RETURN_HANDOVER_CDS';
  const delivery = stop.action === 'RETAILER_DELIVERY';
  const codOrders = delivery ? Array.from(new Set(stop.lines.map((l) => l.orderId!))).filter((oid) => orders.find((o) => o.id === oid)?.paymentMode === 'COD') : [];
  const due = (oid: string) => Math.round(stop.lines.reduce((a, l, i) => a + (l.orderId === oid ? qty[i] * l.unitPrice : 0), 0) * 100) / 100;
  const [cash, setCash] = useState<Record<string, { amount: string; mode: 'CASH' | 'UPI' }>>({});
  const send = async () => {
    const r = await run(() => cdsApi.sendStopOtp(tripId, stop.id));
    if (r) setSms({ to: `${r.sentToName} · +91 ${r.sentToPhone}`, text: r.demoSms, expires: r.expiresAt });
  };
  const complete = async () => {
    const r = await run(() => cdsApi.completeStop(tripId, stop.id, {
      otp: otp.trim(),
      lines: stop.lines.map((_, i) => ({ idx: i, actualQty: qty[i], ...(handover ? { acceptedQty: acc[i], rejectedQty: qty[i] - acc[i] } : {}) })),
      collections: codOrders.map((oid) => ({ orderId: oid, amount: Number(cash[oid]?.amount ?? due(oid)), mode: cash[oid]?.mode ?? 'CASH' })),
    }), 'OTP verified — stop completed');
    if (r) onDone();
  };
  const markFailed = async () => {
    const reason = await askText(`${STOP_ACTION[stop.action].label} not done`, 'Reason (e.g. shop closed, stock not ready)', 'Mark failed', true);
    if (reason && (await run(() => cdsApi.failStop(tripId, stop.id, reason), 'Stop marked failed'))) onDone();
  };
  const invalid = qty.some((q, i) => !(q >= 0 && Number.isInteger(q))) || (handover && acc.some((a, i) => a < 0 || a > qty[i])) || !/^\d{4,6}$/.test(otp.trim());
  return (
    <div className="border rounded p-3 bg-light">
      <div className="small fw-semibold mb-2">{STOP_ACTION[stop.action].verb} — confirm quantities, then verify the OTP from {stop.partyType === 'CDS' ? 'the CDS User' : stop.partyType === 'RETAILER' ? 'the retailer' : 'the seller / distributor'}</div>
      <Table head={['Item', 'Planned Qty', handover ? 'Received' : 'Actual Qty', ...(handover ? ['Accepted', 'Rejected'] : [])]}>
        {stop.lines.map((l, i) => (
          <tr key={i} className="mat-mdc-row">
            <td className="small">{l.name}<div className="text-muted text-xs">{l.returnId ? 'Return' : orders.find((o) => o.id === l.orderId)?.orderNo}</div></td>
            <td>{l.plannedQty}</td>
            <td><input type="number" min={0} className="form-control form-control-sm cds-qty" aria-label={`Quantity ${l.name}`} value={qty[i]} onChange={(e) => setQty((q) => q.map((x, j) => (j === i ? Math.floor(Number(e.target.value)) : x)))} /></td>
            {handover && <>
              <td><input type="number" min={0} className="form-control form-control-sm cds-qty" aria-label={`Accepted ${l.name}`} value={acc[i]} onChange={(e) => setAcc((q) => q.map((x, j) => (j === i ? Math.floor(Number(e.target.value)) : x)))} /></td>
              <td>{Math.max(0, qty[i] - acc[i])}</td>
            </>}
          </tr>
        ))}
      </Table>
      {codOrders.length > 0 && (
        <div className="mt-2 small">
          <div className="fw-semibold mb-1"><i className="fas fa-indian-rupee-sign me-1" />Payment collected (COD)</div>
          {codOrders.map((oid) => (
            <div key={oid} className="d-flex gap-2 align-items-center mb-1">
              <span style={{ minWidth: 110 }}>{orders.find((o) => o.id === oid)?.orderNo}</span>
              <span className="text-muted">due {money(due(oid))}</span>
              <input type="number" min={0} className="form-control form-control-sm" style={{ width: 110 }} aria-label="Amount collected" value={cash[oid]?.amount ?? String(due(oid))} onChange={(e) => setCash((c) => ({ ...c, [oid]: { mode: c[oid]?.mode ?? 'CASH', amount: e.target.value } }))} />
              <select className="form-select form-select-sm" style={{ width: 90 }} aria-label="Mode" value={cash[oid]?.mode ?? 'CASH'} onChange={(e) => setCash((c) => ({ ...c, [oid]: { amount: c[oid]?.amount ?? String(due(oid)), mode: e.target.value as 'CASH' } }))}><option value="CASH">Cash</option><option value="UPI">UPI</option></select>
            </div>
          ))}
        </div>
      )}
      <div className="d-flex flex-wrap gap-2 align-items-end mt-3">
        <button className="btn btn-sm btn-outline-primary" disabled={busy} onClick={() => void send()}><i className="fas fa-paper-plane me-1" />{stop.otp?.status === 'ACTIVE' || sms ? 'Resend OTP' : 'Send OTP'}</button>
        <div>
          <label className="form-label mb-1 small fw-medium">OTP</label>
          <input className="form-control form-control-sm" style={{ width: 120 }} inputMode="numeric" maxLength={6} placeholder="6 digits" aria-label="OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
        </div>
        <button className="btn btn-sm btn-success" disabled={busy || invalid} onClick={() => void complete()}><i className="fas fa-shield-halved me-1" />Verify OTP &amp; Complete</button>
        {STOP_ACTION[stop.action].canFail && <button className="btn btn-sm btn-outline-danger ms-auto" disabled={busy} onClick={() => void markFailed()}>Mark Failed</button>}
      </div>
      {sms && (
        <div className="cds-note mt-2"><i className="fas fa-comment-sms mt-1" /><div>OTP sent to {sms.to} (valid until {fmtDateTime(sms.expires)}).<div className="text-muted text-xs mt-1">Demo SMS: “{sms.text}”</div></div></div>
      )}
    </div>
  );
}

/** Delivery person takes back items during the visit — creates the return and a return-collection stop. */
function AdHocReturn({ tripId, stop, onDone }: { tripId: string; stop: StopView; onDone: () => void }) {
  const meta = useMeta();
  const open = async () => {
    const reasons = meta.data?.returnReasons ?? [];
    // any order already delivered to this retailer
    const delivered = (await cdsApi.searchOrders({ retailerId: stop.partyId, statuses: ['DELIVERED', 'PARTIALLY_DELIVERED'], pageSize: 0 })).rows;
    const lines = delivered.flatMap((o) => o.lines.filter((l) => l.deliveredQty - l.returnedQty > 0).map((l) => ({ o, l })));
    if (!lines.length) return void alertError(new Error('No delivered orders of this retailer to return yet'));
    const res = await Swal.fire({
      title: `Collect return at ${stop.name}`, width: 640,
      html: `<div class="text-start small">${lines.map(({ o, l }, i) => `<div class="border rounded p-2 mb-2"><div class="fw-semibold mb-1">${o.orderNo} · ${l.name} <span class="text-muted">(delivered ${l.deliveredQty})</span></div>
        <div class="d-flex gap-2"><input id="aq-${i}" type="number" min="0" max="${l.deliveredQty}" value="0" class="form-control form-control-sm" style="width:80px" aria-label="Quantity">
        <select id="ar-${i}" class="form-select form-select-sm">${reasons.map((x) => `<option>${x}</option>`).join('')}</select>
        <select id="ac-${i}" class="form-select form-select-sm" style="width:120px"><option value="GOOD">Good</option><option value="DAMAGED">Damaged</option><option value="EXPIRED">Expired</option></select></div></div>`).join('')}
        <div class="text-muted">A return-collection stop is added; confirm it with the retailer's OTP.</div></div>`,
      showCancelButton: true, confirmButtonText: 'Add return', confirmButtonColor: '#1e3a8a', reverseButtons: true,
      preConfirm: () => {
        const v = (k: string) => (document.getElementById(k) as HTMLInputElement).value;
        const picked = lines.map(({ o, l }, i) => ({ orderId: o.id, sku: l.sku, qty: Math.floor(Number(v(`aq-${i}`))), reason: v(`ar-${i}`), condition: v(`ac-${i}`) as 'GOOD' })).filter((x) => x.qty > 0);
        if (!picked.length) return Swal.showValidationMessage('Enter a quantity');
        if (new Set(picked.map((x) => x.orderId)).size > 1) return Swal.showValidationMessage('Add one order at a time');
        return picked;
      },
    });
    if (!res.isConfirmed) return;
    try {
      await cdsApi.addReturnAtStop(tripId, stop.id, { orderId: res.value[0].orderId, lines: res.value.map(({ sku, qty, reason, condition }: { sku: string; qty: number; reason: string; condition: 'GOOD' }) => ({ sku, qty, reason, condition })) });
      void toast('Return added to the trip');
      onDone();
    } catch (e) {
      void alertError(e);
    }
  };
  return <button className="btn btn-sm btn-outline-primary mt-2" onClick={() => void open()}><i className="fas fa-rotate-left me-1" />Collect a return from this retailer</button>;
}
