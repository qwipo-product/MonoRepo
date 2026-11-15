// Trips. Service Centre: three separate tabs — Distributor Pickup, CDS Delivery, CDS Return. CDS User: retailer-wise
// delivery trips only. Trip details run each stop with an OTP (on behalf of the delivery person / Delivery Partner App).
import { Fragment, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import { cdsApi, type StopView, type TripView } from '../../api/services/cds.service';
import { COLLECTION_STATUS, ORDER_STATUS, OTP_STATUS, RETURN_STATUS, STOP_ACTION, TRIP_SHOWN, TRIP_STATUS, TRIP_STATUS_GROUPS, TRIP_TYPE, type TripShown } from '../../cds/status';
import type { TripStatus, TripType } from '../../cds/types';
import { RouteMap, RouteMapDialog, mapStops } from './RouteMap';
import { alertError, askText, Badge, ModuleIntro, Card, confirm, DetailHead, DetailTabs, downloadCsv, Empty, ErrorBox, FiltersDialog, fmtDate, fmtDateTime, InfoGrid, InfoSection, kg, Loading, money, Pager, RowActions, Table, Tabs, toast, useAction, useCdsSession, useLoad, useMeta, type FilterField } from './ui';
import '../trips/TripsPage.css';

const SC_TABS: TripType[] = ['DISTRIBUTOR_PICKUP', 'CDS_DELIVERY', 'CDS_RETURN'];
const BADGE: Record<TripShown, string> = { ASSIGNED: 'planned', IN_PROGRESS: 'in-progress', COMPLETED: 'completed', CANCELLED: 'cancelled' };
const PILL: Record<StopView['status'], string> = { PENDING: 'pending', DONE: 'delivered', PARTIAL: 'pending', FAILED: 'returned' };
const hm = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');
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
  // The Service Centre plans and assigns only; the delivery agent / CDS User run (and cancel) trips.
  const canCancel = (t: TripView) => !sc && ['ASSIGNED', 'STARTED'].includes(t.status) && t.stops.every((s) => s.status === 'PENDING');
  const cancel = async (t: TripView) => {
    const r = await askText(`Cancel ${t.tripNo}?`, 'Cancellation reason', 'Cancel trip', true);
    if (r && (await run(() => cdsApi.cancelTrip(t.id, r), 'Trip cancelled'))) { reload(); all.reload(); }
  };
  const download = (t: TripView) => downloadCsv(t.tripNo, [{ key: 'seq', label: 'Stop' }, { key: 'action', label: 'Action' }, { key: 'name', label: 'Name' }, { key: 'address', label: 'Address' }, { key: 'status', label: 'Status' }, ...(sc ? [] : [{ key: 'verifiedAt', label: 'OTP verified at' }])],
    t.stops.map((s, i) => ({ seq: i + 1, action: STOP_ACTION[s.action].label, name: s.name, address: s.address, status: STOP_LABEL[s.status], verifiedAt: s.verifiedAt ? fmtDateTime(s.verifiedAt) : '' })));
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

  const details = (t: TripView) => {
    const n = (st: StopView['status']) => t.stops.filter((s) => s.status === st).length;
    const total = t.stops.length || 1;
    const seg = (x: number) => `max(2px, ${(x / total) * 100}%)`;
    const eta = t.startedAt ? hm(new Date(new Date(t.startedAt).getTime() + t.etaMinutes * 60000).toISOString()) : `~${t.etaMinutes} min`;
    const verified = t.stops.filter((s) => s.verifiedAt).length;
    const rows: [string, string, string][] = [
      ['directions_car', 'Vehicle', `${t.vehicleRegNo} · ${t.vehicleType}`],
      ['person', 'Delivery Person', t.deliveryPersonName || 'Not Assigned'],
      ['phone', 'Contact Number', t.deliveryPersonPhone || 'Not Available'],
      ['event', 'Planned Date', `${fmtDate(t.plannedDate)}${t.slot ? ` · ${t.slot}` : ''}`],
      ['play_circle_outline', 'Start Time', t.startedAt ? fmtDateTime(t.startedAt) : 'Not started'],
      ['access_time', 'Estimated Completion', eta],
      ...(sc ? [] : [['vpn_key', 'OTP Verified', `${verified} of ${t.stops.length} stops`] as [string, string, string]]),
      ['route', 'Planned Kms', `${t.distanceKm} km`],
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
                <h3>Stop Summary</h3>
                <div className="order-summary-grid">
                  {([['total', 'receipt_long', 'Total', t.stops.length], ['delivered', 'check_circle', 'Done', n('DONE')], ['partial', 'rule', 'Partial', n('PARTIAL')], ['returned', 'cancel', 'Failed', n('FAILED')], ['pending', 'schedule', 'Pending', n('PENDING')]] as [string, string, string, number][]).map(([cls, icon, label, value]) => (
                    <div className={`os-item ${cls}`} key={cls}><div className="os-icon"><i className="material-icons">{icon}</i></div><div className="os-count">{value}</div><div className="os-label">{label}</div></div>
                  ))}
                </div>
                <div className="os-progress">
                  <div className="seg delivered" style={{ width: seg(n('DONE')) }} title={`Done: ${n('DONE')}`} />
                  <div className="seg partial" style={{ width: seg(n('PARTIAL')) }} title={`Partial: ${n('PARTIAL')}`} />
                  <div className="seg returned" style={{ width: seg(n('FAILED')) }} title={`Failed: ${n('FAILED')}`} />
                  <div className="seg pending" style={{ width: seg(n('PENDING')) }} title={`Pending: ${n('PENDING')}`} />
                </div>
                <h3 className="collection-title">Load Summary</h3>
                <div className="info-card collection-card">
                  <div className="info-row no-icon"><span className="label">Load / Capacity</span><span className="value">{kg(t.loadKg)} / {kg(t.capacityKg)}</span></div>
                  <div className="info-row no-icon dashed"><span className="label">Vehicle Utilization</span><span className="value">{t.capacityKg ? Math.round((t.loadKg / t.capacityKg) * 100) : 0}%</span></div>
                  <div className="info-row no-icon"><span className="label">Units</span><span className="value">{t.units}</span></div>
                  <div className="info-row"><i className="material-icons">inventory_2</i><span className="label">Orders</span><span className="value">{t.orderIds.length}</span></div>
                  <div className="info-row"><i className="material-icons">undo</i><span className="label">Returns</span><span className="value">{t.returnIds.length}</span></div>
                </div>
              </div>
              <div className="detail-card delivery-route">
                <h3>{TRIP_TYPE[t.type].label} Route <small className="text-muted fw-normal">({TRIP_TYPE[t.type].direction})</small></h3>
                <div className="delivery-stops">
                  {stops.map((s, i) => (
                    <div key={s.id} className={`delivery-stop${i === 0 ? ' first-stop' : ''}${!showAll.has(t.id) && i === stops.length - 1 ? ' last-visible-stop' : ''}`}>
                      {i > 0 && <div className="connector" />}
                      {i === 0 ? <div className="stop-icon"><i className="material-icons">{s.partyType === 'CDS' ? 'warehouse' : 'store'}</i></div> : <div className="stop-number">{i + 1}</div>}
                      <div className="stop-details">
                        <div className="stop-info">
                          <div className="stop-name">{s.name}</div>
                          <div className="stop-address">{STOP_ACTION[s.action].label} · {s.address}</div>
                          {!sc && <div className="stop-time">{s.completedAt ? `Completed ${fmtDateTime(s.completedAt)}` : 'Time not available'}</div>}
                          {!sc && <div className="stop-otp"><span className="otp-label">OTP:</span><span className="otp-badge">{s.verifiedAt ? `Verified ${hm(s.verifiedAt)}` : s.otp ? 'Sent' : 'Pending'}</span></div>}
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
            <div className="cds-title-row"><h1>Trips</h1><ModuleIntro text={sc ? "Track the trips from your plans: pickups, deliveries to CDS stores and returns to sellers." : "Your delivery trips from the CDS store to retailers."} /></div>
            <p className="header-description">{sc ? 'Track and manage distributor pickup, CDS delivery and CDS return trips.' : 'Track and manage your retailer delivery trips (CDS to Retailer).'}</p>
          </div>
        </div>
        <div className="actions">
          <button className="filter-btn map-view-btn" disabled={selected.size === 0} title={selected.size === 0 ? 'Select one or more trips to view on map' : ''} onClick={() => setMap(Array.from(selected.values()))}>
            <i className="material-icons">map</i> Map View{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
          <button className="filter-btn" onClick={() => setShowFilters(true)}><i className="material-icons">filter_list</i> Filter</button>
        </div>
      </div>

      {sc && <Tabs value={tab} onChange={switchTab} tabs={SC_TABS.map((t) => ({ id: t, label: `Consolidated ${TRIP_TYPE[t].label}s`, sub: `From ${TRIP_TYPE[t].direction}`, icon: TRIP_TYPE[t].icon }))} />}

      <div className="stats-grid">
        {([
          ['Total Trips', all.data?.total ?? 0, 'All Time', sc ? `Consolidated ${TRIP_TYPE[tab].label}s` : `${TRIP_TYPE[tab].label}s`, 'fas fa-truck-loading', 'trips'],
          ['In Progress', count('IN_PROGRESS'), 'Active Trips', 'On the road', 'fas fa-route', 'delivery'],
          ['Completed', count('COMPLETED'), 'Completed Trips', 'Successfully completed', 'fas fa-check-circle', 'customers'],
          ['Assigned', count('ASSIGNED'), 'Upcoming Trips', 'Assigned to the delivery agent', 'fas fa-calendar-alt', 'orders'],
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
        <input className="form-control form-control-sm" placeholder="Search trip number, delivery person, vehicle or stop" aria-label="Search trips" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
                <th>Route</th>
                <th>Status</th>
                <th>Stops</th>
                <th>Load / Capacity</th>
                <th>Delivery Person</th>
                <th>Vehicle</th>
                <th>Planned Kms</th>
                <th>Planned Date</th>
                <th>Created Date</th>
                <th>Time Covered</th>
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
                      <td>{TRIP_TYPE[t.type].direction}</td>
                      <td><span className={`status-badge ${BADGE[t.shown.status]}`}>{TRIP_SHOWN[t.shown.status].label}</span>{t.shown.note && <div className="cds-trip-note">{t.shown.note}</div>}</td>
                      <td>{t.stops.filter((x) => x.status !== 'PENDING').length} / {t.stops.length}</td>
                      <td>{kg(t.loadKg)} / {kg(t.capacityKg)}</td>
                      <td>{t.deliveryPersonName || 'N/A'}</td>
                      <td>{t.vehicleRegNo}</td>
                      <td>{t.distanceKm} km</td>
                      <td>{fmtDate(t.plannedDate)}</td>
                      <td>{fmtDateTime(t.createdAt)}</td>
                      <td>{t.startedAt ? duration(t.startedAt, t.completedAt) : 'N/A'}</td>
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

export function TripDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { sc } = useCdsSession();
  const { busy, run } = useAction();
  const { data, error, loading, reload } = useLoad(() => cdsApi.trip(id), [id]);
  const [openStop, setOpenStop] = useState<string | null>(null);
  const [tab, setTab] = useState<'summary' | 'stops' | 'orders' | 'history' | ''>('');
  const [showMap, setShowMap] = useState(false);
  const t = data?.trip;
  useEffect(() => {
    if (t && !openStop) setOpenStop(t.stops.find((s) => s.status === 'PENDING')?.id ?? null);
  }, [t, openStop]);
  if (error) return <div className="cds-page"><ErrorBox text={error} onRetry={reload} /></div>;
  if (loading && !data) return <div className="cds-page"><Loading /></div>;
  if (!t || !data) return null;
  const running = ['STARTED', 'IN_PROGRESS'].includes(t.status);
  // A running trip opens on its stops (that is where the work is); others open on the summary.
  const view = tab || (running && data.canRun ? 'stops' : 'summary');
  const done = t.stops.filter((s) => s.status !== 'PENDING').length;
  const verified = t.stops.filter((s) => s.verifiedAt).length;
  const start = async () => {
    const early = t.plannedDate > new Date().toISOString().slice(0, 10);
    if (!(await confirm(`Start ${t.tripNo}?`, early ? `This trip is planned for ${fmtDate(t.plannedDate)}. Start it now?` : `${t.deliveryPersonName} starts the trip in the Delivery Partner App.`, 'Start trip'))) return;
    if (await run(() => cdsApi.startTrip(t.id), 'Trip started')) { reload(); setTab('stops'); }
  };
  const cancel = async () => {
    const r = await askText(`Cancel ${t.tripNo}?`, 'Cancellation reason', 'Cancel trip', true);
    if (r && (await run(() => cdsApi.cancelTrip(t.id, r), 'Trip cancelled'))) reload();
  };
  const back = sc ? `/cds/trips?tab=${t.type}` : !data.canRun ? '/cds/grn' : '/cds/trips';
  return (
    <div className="cds-page">
      <DetailHead icon={TRIP_TYPE[t.type].icon} title={t.tripNo} back={back} subtitle={<>{TRIP_TYPE[t.type].label} <span className="cds-route-chip"><i className="fas fa-route me-1" />{TRIP_TYPE[t.type].direction}</span> <Badge meta={TRIP_SHOWN[t.shown.status]} />{t.shown.note && <span className="cds-trip-note ms-2">{t.shown.note}</span>}</>}>
        <button className="btn btn-outline-primary d-flex align-items-center text-nowrap" onClick={() => setShowMap(true)}><i className="fas fa-map-location-dot me-2" />Map View</button>
        {data.canRun && t.status === 'ASSIGNED' && <button className="btn btn-primary d-flex align-items-center text-nowrap" disabled={busy} onClick={() => void start()}><i className="fas fa-play me-2" />Start Trip</button>}
        {data.canRun && ['ASSIGNED', 'STARTED'].includes(t.status) && t.stops.every((s) => s.status === 'PENDING') && <button className="btn btn-outline-danger d-flex align-items-center text-nowrap" disabled={busy} onClick={() => void cancel()}><i className="fas fa-circle-xmark me-2" />Cancel Trip</button>}
      </DetailHead>
      {t.status === 'CANCELLED' && <div className="cds-note warn mb-3"><i className="fas fa-ban mt-1" />Cancelled: {t.cancelReason}</div>}
      {!sc && !data.canRun && <div className="cds-note mb-3"><i className="fas fa-eye mt-1" />View only. The delivery agent runs this trip.</div>}
      {showMap && <RouteMapDialog title={`${t.tripNo} · Map View`} subtitle={`${TRIP_TYPE[t.type].label} (${TRIP_TYPE[t.type].direction}) · ${t.distanceKm} km · ~${t.etaMinutes} min · ${done}/${t.stops.length} stops done`} stops={mapStops(t.stops)} onClose={() => setShowMap(false)} />}
      <DetailTabs value={view} onChange={setTab} tabs={[
        { id: 'summary', label: 'Summary', icon: 'fa-info-circle' },
        { id: 'stops', label: 'Stops', icon: 'fa-location-dot', count: t.stops.length },
        { id: 'orders', label: 'Orders', icon: 'fa-box', count: data.orders.length + data.returns.length },
        { id: 'history', label: 'History', icon: 'fa-clock-rotate-left' },
      ]}>
        {view === 'summary' && (
          <InfoGrid>
            <InfoSection icon="fa-route" title="Route Overview" rows={[
              ['fa-tag', 'Trip Type', TRIP_TYPE[t.type].label],
              ['fa-route', 'Route', TRIP_TYPE[t.type].direction],
              ['fa-calendar', 'Planned', `${fmtDate(t.plannedDate)} · ${t.slot}`],
              ['fa-road', 'Distance', `${t.distanceKm} km · ~${t.etaMinutes} min`],
              ['fa-weight-hanging', 'Load', `${kg(t.loadKg)} · ${t.units} units`],
            ]} />
            <InfoSection icon="fa-id-card" title="Resource Details" rows={[
              ['fa-user', 'Delivery Person', t.deliveryPersonName],
              ['fa-phone', 'Contact Number', t.deliveryPersonPhone],
              ['fa-truck', 'Vehicle', `${t.vehicleRegNo} · ${t.vehicleType}`],
            ]} />
            <InfoSection icon="fa-list-check" title="Trip Progress" rows={[
              ['fa-location-dot', 'Stops Done', `${done} / ${t.stops.length}`],
              ['fa-key', 'OTP Verified', sc ? '' : `${verified} / ${t.stops.length}`],
              ['fa-play', 'Started', t.startedAt ? fmtDateTime(t.startedAt) : '—'],
              ['fa-flag-checkered', 'Closed', t.completedAt ? fmtDateTime(t.completedAt) : ''],
            ]} />
            <div className="cds-info" style={{ gridColumn: '1 / -1' }}>
              <h3><i className="fas fa-map-location-dot" />Route Map</h3>
              <RouteMap stops={mapStops(t.stops)} height={320} />
            </div>
          </InfoGrid>
        )}
        {view === 'stops' && (
          <div className="cds-plain">
            {data.canRun && t.status === 'ASSIGNED' && <div className="cds-note m-3"><i className="fas fa-circle-info mt-1" />Start the trip to record the stops.</div>}
            {t.stops.map((s) => (
              <div key={s.id}>
                <div className="cds-stop" role="button" onClick={() => setOpenStop(openStop === s.id ? null : s.id)}>
                  <div className={`num ${stopTone(s)}`}>{s.seq}</div>
                  <div className="flex-grow-1 small">
                    <div className="fw-semibold">{STOP_ACTION[s.action].label} · {s.name}</div>
                    <div className="text-muted">{s.address}</div>
                    {!sc && s.verifiedAt && <div className="text-success text-xs mt-1"><i className="fas fa-shield-halved me-1" />OTP verified {fmtDateTime(s.verifiedAt)}</div>}
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
        {view === 'orders' && (
          <>
            <Table head={['Order', t.type === 'RETAILER_DELIVERY' ? 'Retailer' : 'Seller to CDS Store', 'Status', 'Actions']} empty={!data.orders.length && <Empty text="No orders on this trip" />}>
              {data.orders.map((o) => (
                <tr key={o.id} className="mat-mdc-row">
                  <td className="fw-semibold text-primary">{o.orderNo}</td>
                  <td className="small">{t.type === 'RETAILER_DELIVERY' ? o.retailerName : `${o.distributorName} to ${o.storeName}`}</td>
                  <td><Badge meta={ORDER_STATUS[o.status]} /></td>
                  <td><RowActions onView={() => navigate(`/cds/orders/${o.id}`)} /></td>
                </tr>
              ))}
            </Table>
            {data.returns.length > 0 && (
              <div className="mt-3">
                <Table head={['Return', 'Order', 'Status']}>
                  {data.returns.map((r) => <tr key={r.id} className="mat-mdc-row"><td className="fw-semibold">{r.returnNo}</td><td className="small">{r.orderNo}</td><td><Badge meta={RETURN_STATUS[r.status]} /></td></tr>)}
                </Table>
              </div>
            )}
            {data.collections.length > 0 && (
              <div className="mt-3">
                <Table head={['Order', 'Amount', 'Mode', 'Status']}>
                  {data.collections.map((c) => <tr key={c.id} className="mat-mdc-row"><td className="fw-semibold">{c.orderNo}</td><td>{money(c.amount)}</td><td className="small">{c.mode}</td><td><Badge meta={COLLECTION_STATUS[c.status]} /></td></tr>)}
                </Table>
              </div>
            )}
          </>
        )}
        {view === 'history' && (
          <div className="cds-info-grid">
            <div className="cds-info">
              <h3><i className="fas fa-clock-rotate-left" />Status History</h3>
              <ul className="cds-timeline">
                {[...t.history].reverse().map((h, k) => <li key={k}><div className="fw-semibold">{TRIP_STATUS[h.to as TripStatus]?.label ?? h.to}</div><div className="when">{fmtDateTime(h.at)} · {h.by}</div>{h.note && <div className="text-muted">{h.note}</div>}</li>)}
              </ul>
            </div>
            {!sc && (
              <div className="cds-info">
                <h3><i className="fas fa-key" />OTP Checks</h3>
                {!data.otps.length ? <div className="text-muted small py-2">No OTPs yet</div> : (
                  <ul className="cds-timeline">
                    {data.otps.map((o) => <li key={o.id}><div className="fw-semibold">{STOP_ACTION[o.purpose].label} <Badge meta={OTP_STATUS[o.status]} /></div><div className="when">{o.sentToName} · {fmtDateTime(o.verifiedAt ?? o.createdAt)}</div></li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </DetailTabs>
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
