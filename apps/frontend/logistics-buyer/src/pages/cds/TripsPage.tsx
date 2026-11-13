// Trips. Service Centre: three separate tabs — Distributor Pickup, CDS Delivery, CDS Return. CDS User: retailer-wise
// delivery trips only. Trip details run each stop with an OTP (on behalf of the delivery person / Delivery Partner App).
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import { cdsApi, type StopView, type TripView } from '../../api/services/cds.service';
import { COLLECTION_STATUS, ORDER_STATUS, OTP_STATUS, RETURN_STATUS, STOP_ACTION, TRIP_STATUS, TRIP_TYPE } from '../../cds/status';
import type { TripStatus, TripType } from '../../cds/types';
import { RouteMap, RouteMapDialog, mapStops } from './RouteMap';
import { alertError, askText, Badge, Card, confirm, DetailHead, DetailTabs, downloadCsv, Empty, ErrorBox, FilterBar, fmtDate, fmtDateTime, InfoGrid, InfoSection, kg, Loading, money, PageHead, Pager, RowActions, Table, Tabs, toast, useAction, useCdsSession, useLoad, useMeta, type FilterField } from './ui';

const SC_TABS: TripType[] = ['DISTRIBUTOR_PICKUP', 'CDS_DELIVERY', 'CDS_RETURN'];
const FILTERS: Record<string, TripStatus[]> = { active: ['PLANNED', 'ASSIGNED', 'STARTED', 'IN_PROGRESS'], done: ['COMPLETED', 'PARTIALLY_COMPLETED'], cancelled: ['CANCELLED'], all: [] };

export default function TripsPage() {
  const { sc } = useCdsSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TripType) ?? (sc ? 'DISTRIBUTOR_PICKUP' : 'RETAILER_DELIVERY');
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [pageNumber, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const { busy, run } = useAction();
  const [map, setMap] = useState<TripView | null>(null);
  const { data, error, loading, reload } = useLoad(() => cdsApi.searchTrips({ types: [tab], statuses: FILTERS[filter], search, date: date || undefined, pageNumber, pageSize }), [tab, filter, search, date, pageNumber, pageSize]);
  const fields: FilterField[] = [
    { key: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'done', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'all', label: 'All' }] },
    { key: 'date', label: 'Planned Date', type: 'date' },
  ];
  const cancel = async (t: TripView) => {
    const r = await askText(`Cancel ${t.tripNo}?`, 'Cancellation reason', 'Cancel trip', true);
    if (r && (await run(() => cdsApi.cancelTrip(t.id, r), 'Trip cancelled'))) reload();
  };
  const download = (t: TripView) => downloadCsv(t.tripNo, [{ key: 'seq', label: 'Stop' }, { key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }, { key: 'verifiedAt', label: 'OTP verified at' }],
    t.stops.map((s, i) => ({ seq: i + 1, name: s.name, status: STOP_LABEL[s.status], verifiedAt: s.verifiedAt ? fmtDateTime(s.verifiedAt) : '' })));
  return (
    <div className="cds-page">
      <PageHead icon="fa-paper-plane" title="Trips" subtitle={sc ? 'Track distributor pickup, CDS delivery and CDS return trips.' : 'Track your Retailer Delivery Trips (CDS to Retailer).'} />
      {sc && <Tabs value={tab} onChange={(t) => { setParams({ tab: t }); setPage(1); }} tabs={SC_TABS.map((t) => ({ id: t, label: `${TRIP_TYPE[t].label}s`, sub: TRIP_TYPE[t].direction, icon: TRIP_TYPE[t].icon }))} />}
      <FilterBar
        title="Trip Filters"
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        placeholder="Search trip, delivery person, vehicle, stop…"
        fields={fields}
        values={{ status: filter, date }}
        defaults={{ status: 'active', date: '' }}
        onApply={(v) => { setFilter(v.status || 'active'); setDate(v.date); setPage(1); }}
      />
      <Card>
        {error && <ErrorBox text={error} onRetry={reload} />}
        {loading && !data ? <Loading /> : (
          <>
            <Table head={['Trip ID', 'Planned', 'Delivery person', 'Vehicle', 'Stops', 'OTP verified', 'Load', 'Status', 'Created', 'Completed', 'Actions']} empty={!data?.rows.length && <Empty text="No trips" />}>
              {data?.rows.map((t: TripView) => (
                <tr key={t.id} className="mat-mdc-row" role="link" style={{ cursor: 'pointer' }} onClick={() => navigate(`/cds/trips/${t.id}`)}>
                  <td className="fw-semibold text-primary">{t.tripNo}<div className="text-muted text-xs">{TRIP_TYPE[t.type].direction}</div></td>
                  <td className="small">{fmtDate(t.plannedDate)}<div className="text-muted text-xs">{t.slot}</div></td>
                  <td className="small">{t.deliveryPersonName}<div className="text-muted text-xs">{t.deliveryPersonPhone}</div></td>
                  <td className="small">{t.vehicleRegNo}<div className="text-muted text-xs">{t.vehicleType}</div></td>
                  <td className="small">{t.stops.filter((x) => x.status !== 'PENDING').length}/{t.stops.length}<div className="text-muted text-xs">{t.stops.map((x) => x.name).slice(0, 3).join(' · ')}{t.stops.length > 3 ? ' …' : ''}</div></td>
                  <td className="small">{t.stops.filter((x) => x.verifiedAt).length}/{t.stops.length}</td>
                  <td className="small">{kg(t.loadKg)}<div className="text-muted text-xs">{t.units} units</div></td>
                  <td><Badge meta={TRIP_STATUS[t.status]} /></td>
                  <td className="small">{fmtDateTime(t.createdAt)}</td>
                  <td className="small">{fmtDateTime(t.completedAt)}</td>
                  <td>
                    <RowActions
                      onView={() => navigate(`/cds/trips/${t.id}`)}
                      items={[
                        { label: 'View details', icon: 'fa-eye', onClick: () => navigate(`/cds/trips/${t.id}`) },
                        { label: 'Map view', icon: 'fa-map-location-dot', onClick: () => setMap(t) },
                        { label: 'Download stops', icon: 'fa-download', tone: 'success', onClick: () => download(t) },
                        { label: 'Cancel trip', icon: 'fa-circle-xmark', tone: 'danger', hidden: busy || !['ASSIGNED', 'STARTED'].includes(t.status) || !t.stops.every((s) => s.status === 'PENDING'), onClick: () => void cancel(t) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </Table>
            {data && <Pager total={data.total} pageNumber={data.pageNumber} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
          </>
        )}
      </Card>
      {map && <RouteMapDialog title={`${map.tripNo} · Map View`} subtitle={`${TRIP_TYPE[map.type].label} (${TRIP_TYPE[map.type].direction}) · ${fmtDate(map.plannedDate)} · ${map.deliveryPersonName}`} stops={mapStops(map.stops)} onClose={() => setMap(null)} />}
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
  const back = !data.canRun ? '/cds/grn' : sc ? `/cds/trips?tab=${t.type}` : '/cds/trips';
  return (
    <div className="cds-page">
      <DetailHead icon={TRIP_TYPE[t.type].icon} title={t.tripNo} back={back} subtitle={<>{TRIP_TYPE[t.type].label} <span className="cds-route-chip"><i className="fas fa-route me-1" />{TRIP_TYPE[t.type].direction}</span> <Badge meta={TRIP_STATUS[t.status]} /></>}>
        <button className="btn btn-outline-primary d-flex align-items-center text-nowrap" onClick={() => setShowMap(true)}><i className="fas fa-map-location-dot me-2" />Map View</button>
        {data.canRun && t.status === 'ASSIGNED' && <button className="btn btn-primary d-flex align-items-center text-nowrap" disabled={busy} onClick={() => void start()}><i className="fas fa-play me-2" />Start Trip</button>}
        {data.canRun && ['ASSIGNED', 'STARTED'].includes(t.status) && t.stops.every((s) => s.status === 'PENDING') && <button className="btn btn-outline-danger d-flex align-items-center text-nowrap" disabled={busy} onClick={() => void cancel()}><i className="fas fa-circle-xmark me-2" />Cancel Trip</button>}
      </DetailHead>
      {t.status === 'CANCELLED' && <div className="cds-note warn mb-3"><i className="fas fa-ban mt-1" />Cancelled: {t.cancelReason}</div>}
      {!data.canRun && <div className="cds-note mb-3"><i className="fas fa-eye mt-1" />View only. The CDS Service Centre runs this trip.</div>}
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
              ['fa-key', 'OTP Verified', `${verified} / ${t.stops.length}`],
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
        {view === 'orders' && (
          <>
            <Table head={['Order', t.type === 'RETAILER_DELIVERY' ? 'Retailer' : 'Distributor → CDS', 'Status', 'Actions']} empty={!data.orders.length && <Empty text="No orders on this trip" />}>
              {data.orders.map((o) => (
                <tr key={o.id} className="mat-mdc-row">
                  <td className="fw-semibold text-primary">{o.orderNo}</td>
                  <td className="small">{t.type === 'RETAILER_DELIVERY' ? o.retailerName : `${o.distributorName} → ${o.storeName}`}</td>
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
            <div className="cds-info">
              <h3><i className="fas fa-key" />OTP Checks</h3>
              {!data.otps.length ? <div className="text-muted small py-2">No OTPs yet</div> : (
                <ul className="cds-timeline">
                  {data.otps.map((o) => <li key={o.id}><div className="fw-semibold">{STOP_ACTION[o.purpose].label} <Badge meta={OTP_STATUS[o.status]} /></div><div className="when">{o.sentToName} · {fmtDateTime(o.verifiedAt ?? o.createdAt)}</div></li>)}
                </ul>
              )}
            </div>
          </div>
        )}
      </DetailTabs>
    </div>
  );
}

function StopLines({ stop }: { stop: StopView }) {
  const handover = stop.action === 'RETURN_HANDOVER_CDS';
  return (
    <Table head={['Order / return', 'Item', 'Planned Qty', 'Actual Qty', ...(handover ? ['Accepted', 'Rejected'] : [])]}>
      {stop.lines.map((l, i) => (
        <tr key={i} className="mat-mdc-row">
          <td className="small">{l.returnId ? 'Return' : 'Order'}</td><td className="small">{l.name}</td><td>{l.plannedQty}</td>
          <td className={l.actualQty !== null && l.actualQty < l.plannedQty ? 'text-danger fw-bold' : ''}>{l.actualQty ?? '—'}</td>
          {handover && <><td>{l.acceptedQty ?? '—'}</td><td>{l.rejectedQty ?? '—'}</td></>}
        </tr>
      ))}
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
