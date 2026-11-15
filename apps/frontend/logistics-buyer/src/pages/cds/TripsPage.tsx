// Trips. Service Centre: two tabs — Pickups (Seller to CDS Stores) and Returns (CDS Stores to Sellers). CDS User: retailer-wise
// delivery trips only. Trip details run each stop with an OTP (on behalf of the delivery person / Delivery Partner App).
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { cdsApi, type GrnRow, type StopView, type TripView } from '../../api/services/cds.service';
import { ORDER_STATUS, RETURN_STATUS, STOP_ACTION, TRIP_SHOWN, TRIP_STATUS_GROUPS, TRIP_TYPE, type TripShown } from '../../cds/status';
import type { TripType } from '../../cds/types';
import { RouteMapDialog, mapStops } from './RouteMap';
import { askText, Badge, confirm, downloadCsv, ErrorBox, FiltersDialog, fmtDate, fmtDateTime, kg, Loading, money, Pager, sumOf, Tabs, useAction, useCdsSession, useLoad, useMeta, type FilterField } from './ui';
import { PLAN_DIRECTION } from './ScPlanningPages';
import DataLoading from '../../components/DataLoading';
import '../trips/TripsPage.css';
import '../trips/TripDetailsPage.css';
import '../trips/dialogs/TripDialogs.css';
import '../trips/TripOrderDetailsPage.css';

/** CDS User: GRN (Service Centre pickups that drop at the store), its own retailer deliveries, and the Service Centre
 *  return trips that pick up from the store. */
const CU_TABS: { id: TripType; label: string; sub: string; icon: string }[] = [
  { id: 'DISTRIBUTOR_PICKUP', label: 'GRN', sub: 'Seller to CDS Store', icon: 'fa-clipboard-check' },
  { id: 'RETAILER_DELIVERY', label: 'Deliveries', sub: 'CDS Store to Retailers', icon: 'fa-truck' },
  { id: 'CDS_RETURN', label: 'Returns', sub: 'CDS Stores to Distributors', icon: 'fa-rotate-left' },
];
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
  const { sc, store } = useCdsSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tabsOf = sc ? SC_TABS : CU_TABS;
  const tab = tabsOf.find((x) => x.id === params.get('tab'))?.id ?? tabsOf[0].id;
  // CDS User: GRN has no Drop Points; Deliveries and Returns have no Trip Charges.
  const cuGrn = !sc && tab === 'DISTRIBUTOR_PICKUP';
  const showDrop = !cuGrn;
  const showCharges = sc || cuGrn;
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
  // Only the owner cancels: the Service Centre its trips, the CDS User its delivery trips.
  const canCancel = (t: TripView) => (sc || t.owner !== 'SC') && (['PLANNED', 'ASSIGNED'].includes(t.status) || (!sc && t.status === 'STARTED' && t.stops.every((s) => s.status === 'PENDING')));
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
      ...otpRows(t, sc, store).map(([label, value]) => ['vpn_key', label, value] as [string, string, string]),
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
            <div className="cds-title-row"><h1>Trips</h1></div>
            <p className="header-description">{sc ? 'Track and manage pickup trips and return trips.' : 'Track and manage GRN, delivery and return trips of your CDS store.'}</p>
          </div>
        </div>
        <div className="actions">
          <button className="filter-btn map-view-btn" disabled={selected.size === 0} title={selected.size === 0 ? 'Select one or more trips to view on map' : ''} onClick={() => setMap(Array.from(selected.values()))}>
            <i className="material-icons">map</i> Map View{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
          <button className="filter-btn" onClick={() => setShowFilters(true)}><i className="material-icons">filter_list</i> Filter</button>
        </div>
      </div>

      <Tabs value={tab} onChange={switchTab} tabs={tabsOf} />

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
                {showDrop && <th>Drop Points</th>}
                <th>Vol Weight</th>
                <th>Driver Name</th>
                <th>Planned Kms</th>
                <th>Created Date</th>
                <th>Arrival Time</th>
                <th>Time Covered</th>
                {showCharges && <th>Trip Charges</th>}
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
                      {showDrop && <td>{`${t.stops.length} / ${maxStops(t)}`}</td>}
                      <td>{`${Math.round(t.loadKg * 10) / 10} / ${t.capacityKg || 'N/A'}`}</td>
                      <td>{t.deliveryPersonName || 'N/A'}</td>
                      <td>{t.distanceKm ? `${t.distanceKm} km` : 'N/A'}</td>
                      <td>{fmtDateTime(t.createdAt)}</td>
                      <td>{t.completedAt && t.status !== 'CANCELLED' ? fmtDateTime(t.completedAt) : 'N/A'}</td>
                      <td>{t.startedAt ? duration(t.startedAt, t.completedAt) : 'N/A'}</td>
                      {showCharges && <td>{t.charges ? money(t.charges) : 'N/A'}</td>}
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
          {!cuGrn && <div className={`kebab-item${menu.trip.status === 'CANCELLED' ? ' disabled' : ''}`} role="menuitem" onClick={() => { if (menu.trip.status !== 'CANCELLED') setMap([menu.trip]); setMenu(null); }}><i className="material-icons" style={{ color: '#3b82f6' }}>place</i><span>Map view</span></div>}
          <div className="kebab-item" role="menuitem" onClick={() => { const id = menu.trip.id; setMenu(null); navigate(`/cds/trips/${id}`); }}><i className="material-icons" style={{ color: '#3b82f6' }}>visibility</i><span>View details</span></div>
          {!cuGrn && <div className="kebab-item" role="menuitem" onClick={() => { download(menu.trip); setMenu(null); }}><i className="material-icons" style={{ color: '#22c55e' }}>download</i><span>Download stops</span></div>}
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
/** Route Overview OTP rows. A CDS User's GRN trip only drops at its store: Pickup OTP N/A, Drop OTP of its stop. */
const otpRows = (t: TripView, sc: boolean, store: string | null | undefined): [string, string][] => (!sc && t.type === 'DISTRIBUTOR_PICKUP'
  ? [['Pickup OTP', 'N/A'], ['Drop OTP', otpOf(t.stops.find((s) => s.partyType === 'CDS' && s.partyId === store))]]
  : OTP_ROWS[t.type].map(([label, actions]) => [label, lastOtp(t.stops, actions)]));
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

type DetailTab = 'summary' | 'customer' | 'distributor' | 'cds' | 'product' | 'return';

/** Ordered Products › Edit (CDS User, Planned GRN trip): the quantity of one product on this store's orders, before the
 *  pickup starts. Same dialog look as LBNP Edit Resource. */
function PlannedQtyDialog({ tripId, sku, name, orders, onClose }: { tripId: string; sku: string; name: string; orders: { id: string; orderNo: string; retailerName: string; qty: number }[]; onClose: (saved?: boolean) => void }) {
  const { busy, run } = useAction();
  const [qty, setQty] = useState(() => orders.map((o) => o.qty));
  const [remarks, setRemarks] = useState('');
  const changed = qty.some((q, i) => q !== orders[i].qty);
  const bad = qty.some((q, i) => !Number.isInteger(q) || q < 0 || q > orders[i].qty);
  const save = async () => {
    if (await run(() => cdsApi.updatePlannedQty(tripId, { sku, items: orders.map((o, i) => ({ orderId: o.id, qty: qty[i] })), remarks }), 'Product updated successfully.')) onClose(true);
  };
  return (
    <Dialog open onClose={() => onClose()} className="resource-dialog-container trip-dialog" disableEnforceFocus PaperProps={{ className: 'trip-dialog-paper', style: { width: 640, maxWidth: '95vw' } }}>
      <div className="dialog-header">
        <h2 className="dialog-title">Edit Product</h2>
        <button className="close-btn" aria-label="Close" onClick={() => onClose()}><i className="fas fa-times" /></button>
      </div>
      <div className="dialog-body">
        <p className="dialog-subtitle">{name}: update the quantity to pick up for your CDS store. The trip has not started yet.</p>
        <table className="mat-mdc-table w-100">
          <thead><tr className="mat-mdc-header-row small bg-light">{th('fa-hashtag', 'Order ID', 'text-start')}{th('fa-store', 'Customer Business Name', 'text-start')}{th('fa-layer-group', 'Ordered Qty')}{th('fa-pen', 'New Qty')}</tr></thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={o.id} className="mat-mdc-row small">
                <td className="text-start">{o.orderNo}</td>
                <td className="text-start">{o.retailerName}</td>
                <td className="text-center">{o.qty}</td>
                <td className="text-center"><input type="number" min={0} max={o.qty} className={`form-control form-control-sm cds-qty mx-auto${qty[i] < 0 || qty[i] > o.qty ? ' is-invalid' : ''}`} aria-label={`New quantity ${o.orderNo}`} value={qty[i]} onChange={(e) => setQty((q) => q.map((x, j) => (j === i ? Math.floor(Number(e.target.value)) : x)))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="form-group mt-3">
          <label htmlFor="pq-remarks">Remarks <span className="required">*</span></label>
          <input id="pq-remarks" className="form-control form-control-sm" placeholder="Why the quantity changes (e.g. retailer reduced the order)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
        {bad && <div className="text-danger small mt-2">Enter a quantity from 0 to the ordered quantity.</div>}
      </div>
      <div className="dialog-footer">
        <button className="cancel-btn" onClick={() => onClose()}>Cancel</button>
        <button className="primary-btn" disabled={!changed || bad || !remarks.trim() || busy} onClick={() => void save()}>{busy ? <><i className="fas fa-spinner fa-spin" /> Updating...</> : <><i className="fas fa-save" /> Update</>}</button>
      </div>
    </Dialog>
  );
}

/** Ordered Products › Edit (CDS User, GRN trip): the verified quantities of one product, order-wise, from the GRN lines
 *  of this trip at the store. Saved as a draft until Generate GRN. Same dialog look as LBNP Edit Resource. */
function EditProductDialog({ name, items, onClose }: { name: string; items: { grn: GrnRow; idx: number }[]; onClose: (saved?: boolean) => void }) {
  const { busy, run } = useAction();
  const [vals, setVals] = useState(() => items.map(({ grn, idx }) => { const l = grn.lines[idx]; return { accepted: l.acceptedQty ?? l.receivedQty, damaged: l.damagedQty ?? 0, remarks: l.remarks }; }));
  const set = (i: number, p: Partial<(typeof vals)[number]>) => setVals((vs) => vs.map((x, j) => {
    if (j !== i) return x;
    const n = { ...x, ...p };
    if (p.damaged !== undefined) n.accepted = Math.max(0, items[i].grn.lines[items[i].idx].receivedQty - p.damaged);
    return n;
  }));
  const bad = vals.some((x, i) => { const l = items[i].grn.lines[items[i].idx]; return x.accepted < 0 || x.damaged < 0 || x.accepted + x.damaged !== l.receivedQty || ((l.shortQty || l.excessQty || x.damaged) > 0 && !x.remarks.trim()); });
  const save = async () => {
    const byGrn = new Map<string, { idx: number; acceptedQty: number; damagedQty: number; remarks: string }[]>();
    items.forEach(({ grn, idx }, i) => byGrn.set(grn.id, [...(byGrn.get(grn.id) ?? []), { idx, acceptedQty: vals[i].accepted, damagedQty: vals[i].damaged, remarks: vals[i].remarks }]));
    const ok = await run(async () => { for (const [gid, lines] of byGrn) await cdsApi.saveGrnLines(gid, lines); return true; }, 'Product updated successfully.');
    if (ok) onClose(true);
  };
  return (
    <Dialog open onClose={() => onClose()} className="resource-dialog-container trip-dialog" disableEnforceFocus PaperProps={{ className: 'trip-dialog-paper', style: { width: 640, maxWidth: '95vw' } }}>
      <div className="dialog-header">
        <h2 className="dialog-title">Edit Product</h2>
        <button className="close-btn" aria-label="Close" onClick={() => onClose()}><i className="fas fa-times" /></button>
      </div>
      <div className="dialog-body">
        <p className="dialog-subtitle">{name}: update the accepted and damaged quantity received at your CDS store.</p>
        <table className="mat-mdc-table w-100">
          <thead><tr className="mat-mdc-header-row small bg-light">{th('fa-hashtag', 'Order ID', 'text-start')}{th('fa-cubes', 'Received Qty')}{th('fa-check', 'Accepted')}{th('fa-triangle-exclamation', 'Damaged')}{th('fa-comment', 'Remarks', 'text-start')}</tr></thead>
          <tbody>
            {items.map(({ grn, idx }, i) => {
              const l = grn.lines[idx];
              const x = vals[i];
              const needRemark = !!(l.shortQty || l.excessQty || x.damaged);
              return (
                <tr key={`${grn.id}-${idx}`} className="mat-mdc-row small">
                  <td className="text-start">{l.orderNo}{(l.shortQty || l.excessQty) ? <div className="text-danger text-xs">{l.shortQty ? `Short ${l.shortQty}` : `Excess ${l.excessQty}`}</div> : null}</td>
                  <td className="text-center">{l.receivedQty}</td>
                  <td className="text-center"><input type="number" min={0} className={`form-control form-control-sm cds-qty mx-auto${x.accepted + x.damaged !== l.receivedQty ? ' is-invalid' : ''}`} aria-label={`Accepted ${l.orderNo}`} value={x.accepted} onChange={(e) => set(i, { accepted: Math.floor(Number(e.target.value)) })} /></td>
                  <td className="text-center"><input type="number" min={0} className="form-control form-control-sm cds-qty mx-auto" aria-label={`Damaged ${l.orderNo}`} value={x.damaged} onChange={(e) => set(i, { damaged: Math.floor(Number(e.target.value)) })} /></td>
                  <td className="text-start"><input className={`form-control form-control-sm${needRemark && !x.remarks.trim() ? ' is-invalid' : ''}`} placeholder={needRemark ? 'Remark required' : 'Remarks'} aria-label={`Remarks ${l.orderNo}`} value={x.remarks} onChange={(e) => set(i, { remarks: e.target.value })} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {bad && <div className="text-danger small mt-2">Accepted + damaged must equal the received quantity, and a short / excess / damaged line needs a remark.</div>}
      </div>
      <div className="dialog-footer">
        <button className="cancel-btn" onClick={() => onClose()}>Cancel</button>
        <button className="primary-btn" disabled={bad || busy} onClick={() => void save()}>{busy ? <><i className="fas fa-spinner fa-spin" /> Updating...</> : <><i className="fas fa-save" /> Update</>}</button>
      </div>
    </Dialog>
  );
}

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
  const { sc, store } = useCdsSession();
  const { busy, run } = useAction();
  const { data, error, reload } = useLoad(() => cdsApi.trip(id), [id]);
  // CDS User: the GRNs of its store (GRN trips: Ordered Products › Edit and Generate GRN)
  const grns = useLoad(async () => (sc ? [] : (await cdsApi.searchGrns({ pageSize: 0 })).rows), [sc, id]);
  const [tab, setTab] = useState<DetailTab>('summary');
  const [showAll, setShowAll] = useState(false);
  const [dialog, setDialog] = useState<'resource' | 'helper' | null>(null);
  const [editSku, setEditSku] = useState<string | null>(null);
  const t = data?.trip;
  if (error) return <div className="cds-page"><ErrorBox text={error} onRetry={reload} /></div>;
  if (!t || !data) return <div className="trip-details-container"><div className="loading-container"><DataLoading overlay={false} message="Loading trip details..." showTip /></div></div>;
  const returnTrip = t.type === 'CDS_RETURN';
  // Edit Resource / Update Helper: planned trips, by the owner (Service Centre trips by the Service Centre).
  const isPlanned = ['PLANNED', 'ASSIGNED'].includes(t.status) && (sc ? t.owner === 'SC' : data.canRun);
  const grnTrip = !sc && t.type === 'DISTRIBUTOR_PICKUP';
  const plannedTrip = grnTrip && ['PLANNED', 'ASSIGNED'].includes(t.status);
  const view: DetailTab = tab;
  const tripGrns = (grns.data ?? []).filter((g) => g.cdsTripId === t.id);
  const pendingGrns = tripGrns.filter((g) => g.status === 'PENDING');
  const generateGrn = async () => {
    if (!(await confirm('Generate GRN?', 'Accepted quantities become ready for planning; damaged items go back to the distributor through a return trip.', 'Generate GRN'))) return;
    const ok = await run(async () => {
      for (const g of pendingGrns) await cdsApi.completeGrn(g.id, { lines: g.lines.map((l, i) => ({ idx: i, acceptedQty: l.acceptedQty ?? l.receivedQty, damagedQty: l.damagedQty ?? 0, remarks: l.remarks })) });
      return true;
    }, 'GRN generated. The orders are ready for planning.');
    if (ok) { grns.reload(); reload(); }
  };
  const back = `/cds/trips?tab=${t.type}`;
  const f = tripFigures(t);
  const last = lastStops(t);
  const qtyOf = (l: StopView['lines'][number]) => l.actualQty ?? l.plannedQty;
  const valueOf = (s: StopView) => sumOf(s.lines, (l) => qtyOf(l) * l.unitPrice);
  // Tabs. Service Centre: Summary, Customer / Distributor / CDS Wise Orders, Ordered or Return Products.
  // CDS User (LBNP Trips view): GRN trips Summary + Ordered Products; deliveries Summary, Customer Wise Orders,
  // Ordered Products, Return Products; returns Summary, Customer Wise Orders, Return Products.
  const tabs: [DetailTab, string][] = sc
    ? [
      ['summary', 'Summary'], ['customer', 'Customer Wise Orders'], ['distributor', 'Distributor Wise Orders'], ['cds', 'CDS Wise Orders'],
      ...(returnTrip ? [['return', 'Return Products'] as [DetailTab, string]] : [['product', 'Ordered Products'] as [DetailTab, string]]),
    ]
    : grnTrip ? [['summary', 'Summary'], ['product', 'Ordered Products']]
      : returnTrip ? [['summary', 'Summary'], ['customer', 'Customer Wise Orders'], ['return', 'Return Products']]
        : [['summary', 'Summary'], ['customer', 'Customer Wise Orders'], ['product', 'Ordered Products'], ['return', 'Return Products']];
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
  const drops = t.stops.filter((s) => s.action === DROP_ACTION[t.type] && (!grnTrip || s.partyId === store));
  const productOrders = grnTrip ? data.orders.filter((o) => o.cdsStoreId === store) : data.orders;
  const dropQty = (sku: string, done: boolean) => sumOf(drops.filter((s) => (s.status !== 'PENDING') === done), (s) => sumOf(s.lines.filter((l) => l.sku === sku && l.orderId), (l) => (done ? l.actualQty ?? 0 : l.plannedQty)));
  const products = Array.from(productOrders.flatMap((o) => o.lines).reduce((m, l) => {
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
        {rows.map((s) => (
          <tr className="mat-mdc-row small" key={s.id}>
            <td className="text-center">{s.seq}</td>
            <td className="text-start">{s.name}</td>
            <td className="text-start">{s.address}</td>
            <td className="text-start">{otpOf(s)}</td>
            <td className="text-center"><span className={`cds-badge ${s.status === 'DONE' ? 'green' : s.status === 'FAILED' ? 'red' : s.status === 'PARTIAL' ? 'amber' : 'grey'}`}>{STOP_LABEL[s.status]}</span></td>
            <td className="text-center">{s.completedAt ? fmtDateTime(s.completedAt) : 'N/A'}</td>
            <td className="text-center">{`${s.refs.length}/${money(valueOf(s))}`}</td>
            <td className="text-center"><button className="btn btn-sm text-primary cds-icon-btn" title="View Order" aria-label={`View orders at ${s.name}`} onClick={() => navigate(`/cds/trip-order-details/${t.id}?party=${kind === 'DISTRIBUTOR' ? 'distributor' : 'cds'}&key=${s.id}`)}><i className="fas fa-eye" /></button></td>
          </tr>
        ))}
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
          {grnTrip && pendingGrns.length > 0 && <button className="btn btn-sm btn-primary d-flex align-items-center text-nowrap" disabled={busy} onClick={() => void generateGrn()}><i className="fas fa-check me-2" />Generate GRN</button>}
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
                {otpRows(t, sc, store).map(([label, value]) => info('vpn_key', label, value))}
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
                <button className="btn btn-sm text-primary cds-icon-btn" title="View Order" aria-label={`View orders of ${c.name}`} onClick={() => navigate(`/cds/trip-order-details/${t.id}?party=customer&key=${encodeURIComponent(c.key)}`)}><i className="fas fa-eye" /></button>
              </td>
            </tr>
          ))}
        </TabTable>
      )}
      {view === 'distributor' && partyTable('DISTRIBUTOR')}
      {view === 'cds' && partyTable('CDS')}
      {view === 'product' && (
        <TabTable cols={10} empty={!products.length && 'No product orders found'}
          head={<>{th('fa-box', 'Product Name', 'text-start')}{th('fa-ruler', 'UOM')}{th('fa-barcode', 'UPC')}{th('fa-box', 'Cases')}{th('fa-cubes', 'PCS')}{th('fa-tag', 'MRP')}{th('fa-check-circle', 'Delivered')}{th('fa-clock', 'Pending')}{th('fa-layer-group', 'Total Qty')}{th('fa-rupee-sign', 'Amount')}{grnTrip && th('fa-cogs', 'Actions')}</>}
          foot={products.length > 0 && <><td /><td /><td /><td /><td /><td /><td /><td className="text-center fw-bold"> Total: </td><td className="text-center fw-bold">{sumOf(products, (p) => p.qty)}</td><td className="text-center fw-bold">{money(sumOf(products, (p) => p.qty * p.mrp))}</td>{grnTrip && <td />}</>}>
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
              {grnTrip && (() => {
                // Planned trip: edit the quantity to pick up. After the handover: edit the GRN (accepted / damaged).
                const lines = tripGrns.flatMap((g) => g.lines.map((l, idx) => ({ grn: g, idx, l })).filter((x) => x.l.sku === p.sku));
                const done = lines.length > 0 && lines.every((x) => x.grn.status !== 'PENDING');
                const can = plannedTrip || (lines.length > 0 && !done);
                const title = plannedTrip ? 'Edit' : !lines.length ? 'Available after the handover at your CDS store' : done ? 'GRN generated' : 'Edit';
                return <td className="text-center"><button className="btn btn-sm text-primary cds-icon-btn" title={title} aria-label={`Edit ${p.name}`} disabled={!can} onClick={() => setEditSku(p.sku)}><i className="fas fa-pen" /></button></td>;
              })()}
            </tr>
          ))}
        </TabTable>
      )}
      {editSku && plannedTrip && (() => {
        const p = products.find((x) => x.sku === editSku);
        const orders = productOrders.filter((o) => o.lines.some((l) => l.sku === editSku)).map((o) => ({ id: o.id, orderNo: o.orderNo, retailerName: o.retailerName, qty: o.lines.find((l) => l.sku === editSku)!.qty }));
        return <PlannedQtyDialog tripId={t.id} sku={editSku} name={p?.name ?? editSku} orders={orders} onClose={(saved) => { setEditSku(null); if (saved) reload(); }} />;
      })()}
      {editSku && !plannedTrip && (() => {
        const items = tripGrns.filter((g) => g.status === 'PENDING').flatMap((g) => g.lines.map((l, idx) => ({ grn: g, idx, l })).filter((x) => x.l.sku === editSku)).map(({ grn, idx }) => ({ grn, idx }));
        const p = products.find((x) => x.sku === editSku);
        return <EditProductDialog name={p?.name ?? editSku} items={items} onClose={(saved) => { setEditSku(null); if (saved) grns.reload(); }} />;
      })()}
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
      {dialog === 'resource' && <EditResourceDialog trip={t} onClose={(saved) => { setDialog(null); if (saved) reload(); }} />}
      {dialog === 'helper' && <UpdateHelperDialog trip={t} onClose={(saved) => { setDialog(null); if (saved) reload(); }} />}
    </div>
  );
}

/** Customer Order Details — same page as the LBNP Trip › Customer Wise Orders › View: KPI cards, the customer card,
 *  Order Details and Order Products. Opened from Customer / Distributor / CDS Wise Orders of a trip.
 *  Query: party = customer | distributor | cds, key = retailer id (or grn-<return id>) / stop id. */
export function TripOrderDetailsPage() {
  const { tripId = '' } = useParams();
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const party = (query.get('party') ?? 'customer') as 'customer' | 'distributor' | 'cds';
  const key = query.get('key') ?? '';
  const { data, error, reload } = useLoad(() => cdsApi.trip(tripId), [tripId]);
  const back = () => navigate(`/cds/trips/${tripId}`);
  if (error) return <div className="cds-page"><ErrorBox text={error} onRetry={reload} /></div>;
  if (!data) return <div className="order-details-container trip-order-details"><DataLoading overlay={false} message="Loading order details..." showTip /></div>;
  const t = data.trip;
  const last = lastStops(t);
  const stop = party === 'customer' ? undefined : t.stops.find((s) => s.id === key);
  const ids = stop ? stop.refs.map((r) => r.id) : null;
  const orders = data.orders.filter((o) => (ids ? ids.includes(o.id) : o.retailerId === key));
  const returns = data.returns.filter((r) => (ids ? ids.includes(r.id) : key.startsWith('grn-') ? r.id === key.slice(4) : r.retailerId === key));
  const retailer = data.retailers.find((r) => r.id === key);
  const who = stop
    ? { name: stop.name, phone: stop.phone, address: stop.address, coords: `${stop.lat}, ${stop.lng}` }
    : retailer
      ? { name: retailer.name, phone: retailer.phone, address: retailer.address, coords: `${retailer.lat}, ${retailer.lng}` }
      : { name: returns[0]?.retailerName ?? 'N/A', phone: 'N/A', address: returns[0]?.storeName ?? 'N/A', coords: 'N/A' };
  const title = party === 'distributor' ? 'Distributor Order Details' : party === 'cds' ? 'CDS Store Order Details' : 'Customer Order Details';
  const nameLabel = party === 'distributor' ? 'Distributor Name' : party === 'cds' ? 'CDS Store Name' : 'Customer Business Name';
  const timeOf = (id: string, fallback: string | null) => {
    const s = last.get(id)?.stop;
    return s?.completedAt ? fmtDateTime(s.completedAt) : fallback ? fmtDateTime(fallback) : 'N/A';
  };
  type Item = { name: string; sku: string; mrp: number; weight: number; ordered: number; returned: number; net: number; total: number };
  type View = { id: string; orderId: string; invoice: string; status: ReactNode; statusText: string; time: string; total: number; reason: string; items: Item[] };
  const views: View[] = [
    ...orders.map((o) => {
      const items = o.lines.map((l) => ({ name: l.name, sku: l.sku, mrp: l.unitPrice, weight: l.unitWeightKg, ordered: l.qty, returned: l.returnedQty, net: l.qty - l.returnedQty, total: l.qty * l.unitPrice }));
      return { id: o.id, orderId: o.orderNo, invoice: o.sellerOrderRef, status: <Badge meta={ORDER_STATUS[o.status]} />, statusText: ORDER_STATUS[o.status].label, time: timeOf(o.id, o.deliveredAt ?? o.confirmedAt), total: sumOf(items, (i) => i.total), reason: '-', items };
    }),
    ...returns.map((r) => {
      const items = r.lines.map((l) => ({ name: l.name, sku: l.sku, mrp: l.unitPrice, weight: l.unitWeightKg, ordered: l.orderedQty, returned: l.qty, net: l.orderedQty - l.qty, total: l.qty * l.unitPrice }));
      return { id: r.id, orderId: r.returnNo, invoice: r.orderNo, status: <Badge meta={RETURN_STATUS[r.status]} />, statusText: RETURN_STATUS[r.status].label, time: timeOf(r.id, null), total: sumOf(items, (i) => i.total), reason: Array.from(new Set(r.lines.map((l) => l.reason))).join(', ') || '-', items };
    }),
  ];
  const products = new Set(views.flatMap((v) => v.items.map((i) => i.sku))).size;
  const returnProducts = new Set(views.flatMap((v) => v.items.filter((i) => i.returned > 0).map((i) => i.sku))).size;
  const kpis: { label: string; icon: string; bg: string; value: string | number; footIcon: string; foot: string }[] = [
    { label: 'Total Orders', icon: 'fa-shopping-cart text-primary', bg: 'bg-primary-subtle', value: views.length, footIcon: 'fa-calendar-check text-primary', foot: party === 'customer' ? ' Customer Orders' : party === 'distributor' ? ' Distributor Orders' : ' CDS Store Orders' },
    { label: 'Total Amount', icon: 'fa-rupee-sign text-success', bg: 'bg-success-subtle', value: money(sumOf(views, (v) => v.total)), footIcon: 'fa-arrow-up text-success', foot: ' Order Value' },
    { label: 'Total Products', icon: 'fa-box text-info', bg: 'bg-info-subtle', value: products, footIcon: 'fa-box-open text-info', foot: ' Product Count' },
    ...(returnProducts > 0 ? [{ label: 'Return Products', icon: 'fa-undo text-warning', bg: 'bg-warning-subtle', value: returnProducts, footIcon: 'fa-exchange-alt text-warning', foot: ' Return Count' }] : []),
  ];
  const h = (icon: string, label: string, align = 'text-start') => <th className={`text-uppercase py-2 px-3 small ${align}`}><i className={`fas ${icon} me-1 text-primary`} />{label}</th>;
  return (
    <div className="order-details-container trip-order-details">
      <header className="orders-header">
        <div className="d-flex align-items-center gap-3">
          <button className="back-btn" aria-label="Back" onClick={back}><i className="fas fa-arrow-left" /></button>
          <div>
            <h1><i className="fas fa-shopping-bag me-2" /> {title}</h1>
            <p className="text-muted small mb-0">{party === 'customer' ? 'Customer' : party === 'distributor' ? 'Distributor' : 'CDS Store'}: {who.name} · Trip {t.tripNo}</p>
          </div>
        </div>
      </header>

      <div className="row mb-4 g-3">
        {kpis.map((k) => (
          <div className="col-md-3" key={k.label}>
            <div className="card h-100 border-0 shadow-sm rounded-3 summary-card">
              <div className="card-body d-flex align-items-center p-3">
                <div className={`icon-container ${k.bg}`}><i className={`fas ${k.icon}`} /></div>
                <div className="ms-3"><h6 className="text-muted small mb-1">{k.label}</h6><h3 className="fw-bold mb-0">{k.value}</h3></div>
              </div>
              <div className="card-footer bg-light border-0 py-2 px-3"><span className="small"><i className={`fas ${k.footIcon}`} />{k.foot}</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mat-card mat-elevation-z3">
        <div className="mat-card-title py-2"><i className="fas fa-user me-2 text-primary" /> {party === 'customer' ? 'Customer' : party === 'distributor' ? 'Distributor' : 'CDS Store'} Information </div>
        <div className="mat-card-content">
          <div className="row g-3 p-3">
            <div className="col-md-6">
              <label className="text-muted small">{nameLabel}</label><p className="mb-1 fw-medium">{who.name}</p>
              <label className="text-muted small">Mobile Number</label><p className="mb-1 fw-medium">{who.phone || 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <label className="text-muted small">Address</label><p className="mb-1 fw-medium">{who.address || 'N/A'}</p>
              <label className="text-muted small">Coordinates</label><p className="mb-1 fw-medium">{who.coords}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mat-card mat-elevation-z3">
        <div className="mat-card-title py-2"><i className="fas fa-clipboard-list me-2 text-primary" /> Order Details </div>
        <div className="mat-card-content p-0">
          <div className="table-responsive">
            <table className="mat-mdc-table w-100">
              <thead><tr className="mat-mdc-header-row small bg-light">{h('fa-hashtag', 'Order ID')}{h('fa-file-invoice', 'Reference Invoice')}{h('fa-info-circle', 'Status', 'text-center')}{h('fa-clock', 'Time', 'text-center')}{h('fa-rupee-sign', 'Order Total', 'text-center')}{h('fa-comment-alt', 'Return Reason', 'text-center')}</tr></thead>
              <tbody>
                {views.map((v) => (
                  <tr className="mat-mdc-row small" key={v.id}>
                    <td className="text-start">{v.orderId}</td>
                    <td className="text-start">{v.invoice}</td>
                    <td className="text-center">{v.status}</td>
                    <td className="text-center">{v.time}</td>
                    <td className="text-center">{money(v.total)}</td>
                    <td className="text-center">{v.reason}</td>
                  </tr>
                ))}
                {views.length === 0 && <tr className="mat-mdc-row"><td colSpan={6} className="text-center py-4"><i className="fas fa-info-circle me-2 text-muted" /> No orders found </td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mat-card mat-elevation-z3">
        <div className="mat-card-title py-2"><i className="fas fa-boxes me-2 text-primary" /> Order Products </div>
        <div className="mat-card-content p-3">
          {views.map((v) => (
            <div className="mat-card mat-elevation-z1 mb-3" key={v.id}>
              <div className="mat-card-header bg-light py-2 px-3">
                <div className="d-flex justify-content-between align-items-center w-100">
                  <span className="small">Order #{v.invoice}</span>
                  <div className="text-end"><span className="me-2 mx-2">{v.status}</span><span className="small text-muted">{v.time}</span></div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="mat-mdc-table w-100 products-table">
                  <thead>
                    <tr className="mat-mdc-header-row small bg-light">
                      {h('fa-box', 'Product')}{h('fa-hashtag', 'HSN Code')}{h('fa-hashtag', 'Cases')}{h('fa-hashtag', 'UPC')}{h('fa-hashtag', 'pcs')}{h('fa-hashtag', 'MRP')}{h('fa-box-open', 'Packaging')}
                      {h('fa-shopping-cart', 'Ordered Qty', 'text-center')}{h('fa-undo', 'Return Qty', 'text-center')}{h('fa-balance-scale', 'Net Qty', 'text-center')}{h('fa-balance-scale', 'Unit Weight', 'text-center')}{h('fa-tag', 'Taxable', 'text-center')}{h('fa-tag', 'GST', 'text-center')}{h('fa-rupee-sign', 'Total', 'text-center')}
                    </tr>
                  </thead>
                  <tbody>
                    {v.items.map((it) => (
                      <tr className="mat-mdc-row small" key={it.sku}>
                        <td className="text-start">{it.name}</td>
                        <td className="text-start">-</td>
                        <td className="text-start">0</td>
                        <td className="text-start">{it.sku}</td>
                        <td className="text-start">{it.ordered}</td>
                        <td className="text-start">{money(it.mrp)}</td>
                        <td className="text-start">PCS</td>
                        <td className="text-center">{it.ordered}</td>
                        <td className="text-center">{it.returned || 0}</td>
                        <td className="text-center">{it.net}</td>
                        <td className="text-center">{kg(it.weight)}</td>
                        <td className="text-center">{money(it.total)}</td>
                        <td className="text-center">-</td>
                        <td className="text-center">{money(it.total)}</td>
                      </tr>
                    ))}
                    {v.items.length === 0 && <tr className="mat-mdc-row"><td colSpan={14} className="text-center py-4"> No products found for this order </td></tr>}
                  </tbody>
                  <tfoot>
                    <tr className="mat-mdc-footer-row bg-light">
                      <td className="py-2 px-3 fw-bold">Total:</td>
                      <td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td />
                      <td className="text-center fw-bold">{money(v.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
