// Trips. Service Centre: three separate tabs — Distributor Pickup, CDS Delivery, CDS Return. CDS User: retailer-wise
// delivery trips only. Trip details run each stop with an OTP (on behalf of the delivery person / Delivery Partner App).
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import { cdsApi, type StopView, type TripView } from '../../api/services/cds.service';
import { COLLECTION_STATUS, ORDER_STATUS, OTP_STATUS, RETURN_STATUS, STOP_ACTION, TRIP_STATUS, TRIP_TYPE } from '../../cds/status';
import type { TripStatus, TripType } from '../../cds/types';
import { alertError, askText, Badge, Card, confirm, Empty, ErrorBox, fmtDate, fmtDateTime, kg, Loading, money, PageHead, Pager, Table, Tabs, toast, useAction, useCdsSession, useLoad, useMeta } from './ui';

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
  const { data, error, loading, reload } = useLoad(() => cdsApi.searchTrips({ types: [tab], statuses: FILTERS[filter], search, date: date || undefined, pageNumber, pageSize: 12 }), [tab, filter, search, date, pageNumber]);
  return (
    <div className="cds-page">
      <PageHead icon="fa-paper-plane" title="Trips" subtitle={sc ? 'Distributor pickup, CDS delivery and CDS return trips run by the Service Centre.' : 'Retailer-wise delivery trips of your CDS — order pickup at the CDS, retailer deliveries, returns.'} />
      {sc && <Tabs value={tab} onChange={(t) => { setParams({ tab: t }); setPage(1); }} tabs={SC_TABS.map((t) => ({ id: t, label: `${TRIP_TYPE[t].label}s`, icon: TRIP_TYPE[t].icon }))} />}
      <div className="cds-filters">
        <select aria-label="Trip status" className="form-select form-select-sm" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="active">Active</option><option value="done">Completed</option><option value="cancelled">Cancelled</option><option value="all">All</option>
        </select>
        <input type="date" aria-label="Planned date" className="form-control form-control-sm" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
        <input className="form-control form-control-sm search" placeholder="Search trip, delivery person, vehicle, stop…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      <Card>
        {error && <ErrorBox text={error} onRetry={reload} />}
        {loading && !data ? <Loading /> : (
          <>
            <Table head={['Trip ID', 'Planned', 'Delivery person', 'Vehicle', 'Stops', 'OTP verified', 'Load', 'Status', 'Created', 'Completed']} empty={!data?.rows.length && <Empty text="No trips" />}>
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
                </tr>
              ))}
            </Table>
            {data && <Pager total={data.total} pageNumber={data.pageNumber} pageSize={data.pageSize} onPage={setPage} />}
          </>
        )}
      </Card>
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
  const t = data?.trip;
  useEffect(() => {
    if (t && !openStop) setOpenStop(t.stops.find((s) => s.status === 'PENDING')?.id ?? null);
  }, [t, openStop]);
  if (error) return <div className="cds-page"><ErrorBox text={error} onRetry={reload} /></div>;
  if (loading && !data) return <div className="cds-page"><Loading /></div>;
  if (!t || !data) return null;
  const running = ['STARTED', 'IN_PROGRESS'].includes(t.status);
  const start = async () => {
    const early = t.plannedDate > new Date().toISOString().slice(0, 10);
    if (!(await confirm(`Start ${t.tripNo}?`, early ? `This trip is planned for ${fmtDate(t.plannedDate)}. Start it now?` : `${t.deliveryPersonName} starts the trip in the Delivery Partner App.`, 'Start trip'))) return;
    if (await run(() => cdsApi.startTrip(t.id), 'Trip started')) reload();
  };
  const cancel = async () => {
    const r = await askText(`Cancel ${t.tripNo}?`, 'Cancellation reason', 'Cancel trip', true);
    if (r && (await run(() => cdsApi.cancelTrip(t.id, r), 'Trip cancelled'))) reload();
  };
  const back = sc ? { label: 'Trips', to: `/cds/trips?tab=${t.type}` } : { label: 'Trips', to: '/cds/trips' };
  return (
    <div className="cds-page">
      <PageHead icon={TRIP_TYPE[t.type].icon} title={t.tripNo} crumb={data.canRun ? back : { label: 'GRN', to: '/cds/grn' }}
        subtitle={<>{TRIP_TYPE[t.type].label} · {TRIP_TYPE[t.type].direction} · <Badge meta={TRIP_STATUS[t.status]} /></>}>
        <button className="btn btn-sm btn-outline-secondary" onClick={reload}><i className="fas fa-rotate me-1" />Refresh</button>
        {data.canRun && t.status === 'ASSIGNED' && <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => void start()}><i className="fas fa-play me-1" />Start Trip</button>}
        {data.canRun && ['ASSIGNED', 'STARTED'].includes(t.status) && t.stops.every((s) => s.status === 'PENDING') && <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => void cancel()}>Cancel Trip</button>}
      </PageHead>
      {t.status === 'CANCELLED' && <div className="cds-note warn mb-3"><i className="fas fa-ban mt-1" />Cancelled: {t.cancelReason}</div>}
      {data.canRun && t.status === 'ASSIGNED' && <div className="cds-note mb-3"><i className="fas fa-circle-info mt-1" />The delivery person starts the trip in the Delivery Partner App. You can start it here on their behalf to record the handovers.</div>}
      {!data.canRun && <div className="cds-note mb-3"><i className="fas fa-eye mt-1" />View only — this trip is run by the CDS Service Centre. Handover OTPs for your store are shown on your GRN and Returns pages.</div>}
      <div className="cds-grid-2">
        <div>
          <Card title={<><i className="fas fa-map-signs text-primary me-2" />Stops</>} extra={<small>{t.distanceKm} km · ~{t.etaMinutes} min · {kg(t.loadKg)}</small>}>
            {t.stops.map((s) => (
              <div key={s.id}>
                <div className="cds-stop" role="button" onClick={() => setOpenStop(openStop === s.id ? null : s.id)}>
                  <div className={`num ${stopTone(s)}`}>{s.seq}</div>
                  <div className="flex-grow-1 small">
                    <div className="fw-semibold">{STOP_ACTION[s.action].label} · {s.name}</div>
                    <div className="text-muted">{s.address}{s.phone ? ` · ${s.phone}` : ''}</div>
                    <div className="text-xs mt-1"><i className="fas fa-key me-1 text-muted" />OTP between {STOP_ACTION[s.action].otpBetween}
                      {s.verifiedAt && <span className="text-success ms-2"><i className="fas fa-shield-halved me-1" />verified {fmtDateTime(s.verifiedAt)} by {s.verifiedBy}</span>}
                      {!s.verifiedAt && s.otp && s.status === 'PENDING' && <span className="ms-2"><Badge meta={OTP_STATUS[s.otp.status]} /> to {s.otp.sentToName}</span>}
                    </div>
                    {s.failReason && <div className="text-danger text-xs">{s.status === 'FAILED' ? 'Failed' : 'Note'}: {s.failReason}</div>}
                  </div>
                  <div className="text-end small">
                    <span className={`cds-badge ${s.status === 'DONE' ? 'green' : s.status === 'FAILED' ? 'red' : s.status === 'PARTIAL' ? 'amber' : 'grey'}`}>{STOP_LABEL[s.status]}</span>
                    <div className="text-muted text-xs mt-1">{s.lines.reduce((a, l) => a + (l.actualQty ?? 0), 0)}/{s.lines.reduce((a, l) => a + l.plannedQty, 0)} units</div>
                  </div>
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
          </Card>
          <Card title={<><i className="fas fa-key text-primary me-2" />OTP verification history</>}>
            <Table head={['Checkpoint', 'Sent to', 'Sent', 'Attempts', 'Status', 'Verified']} empty={!data.otps.length && <Empty text="No OTPs yet" />}>
              {data.otps.map((o) => (
                <tr key={o.id} className="mat-mdc-row">
                  <td className="small">{STOP_ACTION[o.purpose].label}</td>
                  <td className="small">{o.sentToName}<div className="text-muted text-xs">+91 {o.sentToPhone}</div></td>
                  <td className="small">{fmtDateTime(o.createdAt)}<div className="text-muted text-xs">expires {fmtDateTime(o.expiresAt)}</div></td>
                  <td>{o.attempts}</td><td><Badge meta={OTP_STATUS[o.status]} /></td>
                  <td className="small">{o.verifiedAt ? <>{fmtDateTime(o.verifiedAt)}<div className="text-muted text-xs">{o.verifiedBy}</div></> : '—'}</td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
        <div>
          <Card title={<><i className="fas fa-circle-info text-primary me-2" />Trip</>}>
            <dl className="cds-dl">
              <dt>Trip type</dt><dd>{TRIP_TYPE[t.type].label}</dd>
              <dt>Run by</dt><dd>{t.ownerName}</dd>
              <dt>Planned</dt><dd>{fmtDate(t.plannedDate)} · {t.slot}</dd>
              <dt>Delivery person</dt><dd>{t.deliveryPersonName} · {t.deliveryPersonPhone}</dd>
              <dt>Vehicle</dt><dd>{t.vehicleRegNo} · {t.vehicleType} · {t.capacityKg} kg</dd>
              <dt>Created</dt><dd>{fmtDateTime(t.createdAt)} · {t.createdBy}</dd>
              {t.startedAt && <><dt>Started</dt><dd>{fmtDateTime(t.startedAt)}</dd></>}
              {t.completedAt && <><dt>Closed</dt><dd>{fmtDateTime(t.completedAt)}</dd></>}
            </dl>
          </Card>
          {data.orders.length > 0 && (
            <Card title={<><i className="fas fa-box text-primary me-2" />Orders ({data.orders.length})</>}>
              <div className="p-2 small">
                {data.orders.map((o) => (
                  <div key={o.id} className="d-flex justify-content-between align-items-center py-1 border-bottom">
                    <span><a role="button" className="text-primary fw-semibold" onClick={() => navigate(`/cds/orders/${o.id}`)}>{o.orderNo}</a> · {t.type === 'RETAILER_DELIVERY' ? o.retailerName : `${o.distributorName} → ${o.storeName}`}</span>
                    <Badge meta={ORDER_STATUS[o.status]} />
                  </div>
                ))}
              </div>
            </Card>
          )}
          {data.returns.length > 0 && (
            <Card title={<><i className="fas fa-rotate-left text-primary me-2" />Returns ({data.returns.length})</>}>
              <div className="p-2 small">{data.returns.map((r) => <div key={r.id} className="d-flex justify-content-between py-1 border-bottom"><span>{r.returnNo} · {r.orderNo}</span><Badge meta={RETURN_STATUS[r.status]} /></div>)}</div>
            </Card>
          )}
          {data.collections.length > 0 && (
            <Card title={<><i className="fas fa-indian-rupee-sign text-primary me-2" />Collections</>}>
              <div className="p-2 small">{data.collections.map((c) => <div key={c.id} className="d-flex justify-content-between py-1 border-bottom"><span>{c.orderNo} · {money(c.amount)} {c.mode}</span><Badge meta={COLLECTION_STATUS[c.status]} /></div>)}</div>
            </Card>
          )}
          <Card title={<><i className="fas fa-clock-rotate-left text-primary me-2" />Status history</>}>
            <ul className="cds-timeline">
              {[...t.history].reverse().map((h, k) => <li key={k}><div className="fw-semibold">{TRIP_STATUS[h.to as TripStatus]?.label ?? h.to}</div><div className="when">{fmtDateTime(h.at)} · {h.by}</div>{h.note && <div className="text-muted">{h.note}</div>}</li>)}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StopLines({ stop }: { stop: StopView }) {
  const handover = stop.action === 'RETURN_HANDOVER_CDS';
  return (
    <Table head={['Order / return', 'Item', 'Planned', 'Actual', ...(handover ? ['Accepted', 'Rejected'] : [])]}>
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
      <Table head={['Item', 'Planned', handover ? 'Received' : 'Actual', ...(handover ? ['Accepted', 'Rejected'] : [])]}>
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
