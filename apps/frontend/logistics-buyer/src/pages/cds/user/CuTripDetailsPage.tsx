// CDS User › Trip details (/cds/trips/:id): a replica of the LBNP Trip Details (src/pages/trips/TripDetailsPage.tsx)
// for one Retailer Delivery Trip — header, tabs Summary / Customer Wise Orders / Ordered Products and a route map.
// Removed by decision: Return Products tab, Edit Resource, Update Helper, Return to RFP, Move All Returned to RFP.
//
// The delivery person's app is not part of this project, so the CDS User runs the trip on the delivery person's
// behalf: Start Trip → for each stop Send OTP → quantities (and the cash / UPI collected for COD orders) → OTP →
// complete, or Mark failed. Stop 1 is the order pickup (loading) at the CDS; retailer stops wait for it.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Swal from 'sweetalert2';
import DataLoading from '../../../components/DataLoading';
import { cdsApi, type StopCompleteInput, type StopView, type TripView } from '../../../api/services/cds.service';
import { ACTIVE_TRIP, OTP_STATUS, STOP_ACTION, TRIP_STATUS } from '../../../cds/status';
import type { Collection } from '../../../cds/types';
import { addCurrency } from '../../../utils/pipes';
import { RouteMap, mapStops } from '../RouteMap';
import { askText, Badge, fmtDate, fmtDateTime, sumOf, useAction, useLoad } from '../ui';
import { CuCancelTripDialog, CuTripStatusBadge } from './CuTripsPage';
import '../../../components/FiltersModal.css';
import '../../trips/TripDetailsPage.css';
import '../../trips/TripOrderDetailsPage.css';
import './CuTrips.css';

type TabKey = 'summary' | 'customer' | 'product';
type TripDetails = Awaited<ReturnType<typeof cdsApi.trip>>;
type TripOrder = TripDetails['orders'][number];
type OtpSent = Awaited<ReturnType<typeof cdsApi.sendStopOtp>>;

const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (n: number) => (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: string) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const orderIdsOf = (s: StopView) => Array.from(new Set(s.lines.map((l) => l.orderId).filter((x): x is string => !!x)));

/** Stop label and tone: loading at the CDS reads Loaded, a retailer stop Delivered. */
function stopLabel(s: StopView): string {
  const pickup = s.action === 'CDS_ORDER_PICKUP';
  if (s.status === 'DONE') return pickup ? 'Loaded' : 'Delivered';
  if (s.status === 'PARTIAL') return pickup ? 'Partially Loaded' : 'Partially Delivered';
  if (s.status === 'FAILED') return 'Failed';
  return 'Pending';
}
const stopTone = (s: StopView) => `cu-stop-${s.status.toLowerCase()}`;

/** Trip Summary figures (orders by outcome on this trip, values, collections). */
function tripFigures(d: TripDetails) {
  const t = d.trip;
  const pickup = t.stops.find((s) => s.action === 'CDS_ORDER_PICKUP');
  const loaded = !!pickup && pickup.status !== 'PENDING';
  const drops = t.stops.filter((s) => s.action === 'RETAILER_DELIVERY');
  const counts = { total: d.orders.length, delivered: 0, partial: 0, failed: 0, pending: 0 };
  d.orders.forEach((o) => {
    const st = drops.find((s) => s.lines.some((l) => l.orderId === o.id));
    if (!st) counts[loaded ? 'failed' : 'pending'] += 1; // not loaded at the CDS
    else if (st.status === 'PENDING') counts.pending += 1;
    else if (st.status === 'FAILED') counts.failed += 1;
    else {
      const got = sumOf(st.lines.filter((l) => l.orderId === o.id), (l) => l.actualQty ?? 0);
      const want = sumOf(o.lines, (l) => l.qty);
      counts[got <= 0 ? 'failed' : got >= want ? 'delivered' : 'partial'] += 1;
    }
  });
  const cash = sumOf(d.collections.filter((c) => c.mode === 'CASH'), (c) => c.amount);
  const upi = sumOf(d.collections.filter((c) => c.mode === 'UPI'), (c) => c.amount);
  return {
    ...counts,
    saleValue: sumOf(d.orders.flatMap((o) => o.lines), (l) => l.qty * l.unitPrice),
    deliveredValue: sumOf(drops.flatMap((s) => s.lines), (l) => (l.actualQty ?? 0) * l.unitPrice),
    dropPoints: drops.length,
    cash,
    upi,
    collected: cash + upi,
  };
}

/** Ordered Products: per SKU — total on the trip (loaded at the CDS), delivered, failed (not loaded / not delivered), pending. */
function productRows(t: TripView) {
  const pickup = t.stops.find((s) => s.action === 'CDS_ORDER_PICKUP');
  const drops = t.stops.filter((s) => s.action === 'RETAILER_DELIVERY');
  const m = new Map<string, { sku: string; name: string; unitWeightKg: number; unitPrice: number; total: number; delivered: number; failed: number }>();
  const row = (l: StopView['lines'][number]) => {
    const x = m.get(l.sku) ?? { sku: l.sku, name: l.name, unitWeightKg: l.unitWeightKg, unitPrice: l.unitPrice, total: 0, delivered: 0, failed: 0 };
    m.set(l.sku, x);
    return x;
  };
  (pickup ? pickup.lines : drops.flatMap((s) => s.lines)).forEach((l) => (row(l).total += l.plannedQty));
  if (pickup && pickup.status !== 'PENDING') pickup.lines.forEach((l) => (row(l).failed += Math.max(0, l.plannedQty - (l.actualQty ?? 0))));
  drops.forEach((s) =>
    s.lines.forEach((l) => {
      const x = row(l);
      if (s.status === 'PENDING') return;
      x.delivered += l.actualQty ?? 0;
      x.failed += Math.max(0, l.plannedQty - (l.actualQty ?? 0));
    }),
  );
  return Array.from(m.values())
    .map((x) => ({ ...x, pending: Math.max(0, x.total - x.delivered - x.failed), amount: round2(x.total * x.unitPrice) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const th = (icon: string, label: string, align = 'text-center') => (
  <th className={`text-uppercase py-2 px-3 small ${align}`}>
    <i className={`fas ${icon} me-1 text-primary`} />
    {label}
  </th>
);

export function CuTripDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useLoad(() => cdsApi.trip(id), [id]);
  const { busy, run } = useAction();
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [stopId, setStopId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (loading && !data) {
    return (
      <div className="trip-details-container cu-trip-details">
        <div className="loading-container">
          <DataLoading overlay={false} message="Loading trip details..." showTip />
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="trip-details-container cu-trip-details">
        <div className="trip-details-header">
          <div className="header-left">
            <button className="back-btn" aria-label="Back to trips" onClick={() => navigate('/cds/trips')}><i className="fas fa-arrow-left" /></button>
            <h1>Trip details</h1>
          </div>
        </div>
        <div className="cu-note warn">
          <i className="fas fa-triangle-exclamation" />
          <div>{error || 'Trip not found'} <button className="btn btn-link btn-sm p-0 ms-2" onClick={reload}>Retry</button></div>
        </div>
      </div>
    );
  }

  const t = data.trip;
  const f = tripFigures(data);
  const products = productRows(t);
  const running = t.status === 'STARTED' || t.status === 'IN_PROGRESS';
  const pickupStop = t.stops.find((s) => s.action === 'CDS_ORDER_PICKUP');
  const pickupPending = pickupStop?.status === 'PENDING';
  /** Stop actions are offered on pending stops of an open trip the CDS User runs. */
  const canAct = (s: StopView) => data.canRun && s.status === 'PENDING' && ACTIVE_TRIP.includes(t.status);
  /** Why a pending stop cannot be worked yet ('' = it can). */
  const blockReason = (s: StopView): string => {
    if (t.status === 'PLANNED' || t.status === 'ASSIGNED') return 'Start the trip first';
    if (!running) return `${t.tripNo} is ${TRIP_STATUS[t.status].label}`;
    if (s.action === 'RETAILER_DELIVERY' && pickupPending) return 'Load the orders at the CDS first';
    return '';
  };
  const dialogStop = stopId ? t.stops.find((s) => s.id === stopId) : undefined;

  // ------------------------------------------------------------ actions
  const startTrip = async () => {
    const r = await Swal.fire({
      title: 'Start Trip',
      text: `Start ${t.tripNo} for ${t.deliveryPersonName}? Then record each stop with its OTP on the Customer Wise Orders tab.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    });
    if (!r.isConfirmed) return;
    if (await run(() => cdsApi.startTrip(t.id), 'Trip started successfully')) {
      reload();
      setActiveTab('customer');
    }
  };
  const sendOtp = async (s: StopView): Promise<OtpSent | null> => {
    const r = await run(() => cdsApi.sendStopOtp(t.id, s.id));
    if (!r) return null;
    reload();
    void Swal.fire({
      icon: 'success',
      title: 'OTP sent successfully',
      html:
        `<div style="text-align:left">OTP sent to <b>${esc(r.sentToName)}</b> (+91 ${esc(r.sentToPhone)}), valid until ${esc(fmtDateTime(r.expiresAt))}.` +
        `<div style="margin-top:12px;padding:10px 12px;border-radius:8px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;font-size:14px">Demo SMS: “${esc(r.demoSms)}”</div></div>`,
      confirmButtonColor: '#2563eb',
    });
    return r;
  };
  const markFailed = async (s: StopView): Promise<boolean> => {
    const reason = await askText(`Mark ${s.name} as failed?`, 'Reason (e.g. shop closed, retailer not available)', 'Mark Failed', true);
    if (!reason) return false;
    const ok = await run(() => cdsApi.failStop(t.id, s.id, reason), 'Stop marked as failed');
    reload();
    return !!ok;
  };
  const completeStop = async (s: StopView, input: StopCompleteInput): Promise<boolean> => {
    const ok = await run(() => cdsApi.completeStop(t.id, s.id, input), 'OTP verified, stop completed');
    reload(); // a wrong OTP is counted too
    return !!ok;
  };

  // ------------------------------------------------------------ render
  const locations = t.stops;
  const visible = showAllLocations ? locations : locations.slice(0, 3);
  const info = (rows: [string, string, string][]) =>
    rows.map(([icon, label, value]) => (
      <div className="info-row" key={label}>
        <div className="info-item full-width">
          <i className="material-icons">{icon}</i>
          <div className="label">{label}</div>
          <div className="value">{value}</div>
        </div>
      </div>
    ));

  return (
    <div className="trip-details-container cu-trip-details">
      <div className="trip-details-header">
        <div className="header-left">
          <button className="back-btn" aria-label="Back to trips" onClick={() => navigate('/cds/trips')}><i className="fas fa-arrow-left" /></button>
          <h1>{t.tripNo}</h1>
          <CuTripStatusBadge status={t.status} />
          <div className="provider">{`Planned: ${fmtDate(t.plannedDate)} · ${t.slot}`}</div>
        </div>
        <div className="header-right">
          {data.canRun && t.status === 'ASSIGNED' && (
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => void startTrip()}><i className="fas fa-play" />Start Trip</button>
          )}
          {data.canRun && ACTIVE_TRIP.includes(t.status) && (
            <button className="btn btn-outline-danger btn-sm" disabled={busy} onClick={() => setCancelOpen(true)}><i className="fas fa-times-circle" />Cancel Trip</button>
          )}
        </div>
      </div>

      {t.status === 'CANCELLED' && (
        <div className="cu-note warn"><i className="fas fa-ban" /><div>This trip was cancelled{t.cancelReason ? `: ${t.cancelReason}` : '.'}</div></div>
      )}
      {!data.canRun && <div className="cu-note"><i className="fas fa-eye" /><div>View only. This trip is run by another CDS.</div></div>}

      <div className="content-container">
        <div className="tabs-container">
          <div className="tabs" role="tablist">
            {([['summary', 'Summary'], ['customer', 'Customer Wise Orders'], ['product', 'Ordered Products']] as [TabKey, string][]).map(([key, label]) => (
              <div key={key} role="tab" aria-selected={activeTab === key} className={`tab${activeTab === key ? ' active' : ''}`} onClick={() => setActiveTab(key)}>{label}</div>
            ))}
          </div>
        </div>

        {activeTab === 'summary' && (
          <div className="trip-details-content">
            <div className="details-container">
              <div className="information-card route-overview">
                <h3>Route Overview</h3>
                <div className="suggested-vehicle">
                  <i className="material-icons">local_shipping</i>
                  {` Load: ${Math.round(t.loadKg * 10) / 10} / ${t.capacityKg || 'N/A'} kgs`}
                </div>
                <div className="resource-details-box">
                  <div className="resource-header"><span>RESOURCE DETAILS</span></div>
                  {([
                    ['directions_car', 'Vehicle', t.vehicleRegNo ? `${t.vehicleRegNo}${t.vehicleType ? ` · ${t.vehicleType}` : ''}` : 'N/A'],
                    ['person', 'Delivery Person', t.deliveryPersonName || 'N/A'],
                    ['phone', 'Contact Number', t.deliveryPersonPhone || 'N/A'],
                  ] as [string, string, string][]).map(([icon, label, value]) => (
                    <div className="resource-row" key={label}>
                      <div className="info-item full-width">
                        <i className="material-icons">{icon}</i>
                        <div className="label">{label}</div>
                        <div className="value">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {info([
                  ['event', 'Planned Date', `${fmtDate(t.plannedDate)} · ${t.slot}`],
                  ['play_circle_outline', 'Start Time', t.startedAt ? fmtDateTime(t.startedAt) : 'N/A'],
                  ['access_time', 'Estimated Completion', t.startedAt ? fmtDateTime(new Date(new Date(t.startedAt).getTime() + t.etaMinutes * 60000).toISOString()) : `~${t.etaMinutes} min`],
                  ['flag', 'Completed Time', t.completedAt ? fmtDateTime(t.completedAt) : 'N/A'],
                  ['vpn_key', 'Pickup OTP', pickupStop?.otp ? OTP_STATUS[pickupStop.otp.status].label : 'N/A'],
                  ['route', 'Planned Kms', t.distanceKm ? `${t.distanceKm} km` : 'N/A'],
                ])}
              </div>

              <div className="information-card trip-summary">
                <h3>Trip Summary</h3>
                {info([
                  ['monetization_on', 'Total Sale Value', addCurrency(f.saleValue)],
                  ['monetization_on', 'Total Delivered Value', addCurrency(f.deliveredValue)],
                  ['location_on', 'Total Delivery Points', String(f.dropPoints)],
                  ['receipt_long', 'Total Orders', String(f.total)],
                  ['check_circle', 'Delivered Orders', f.partial ? `${f.delivered} (+${f.partial} partial)` : String(f.delivered)],
                  ['cancel', 'Failed Orders', String(f.failed)],
                  ['payments', 'Cash Collection', addCurrency(f.cash)],
                  ['smartphone', 'UPI Collection', addCurrency(f.upi)],
                  ['account_balance_wallet', 'Total Collection', addCurrency(f.collected)],
                ])}
              </div>

              <div className="information-card delivery-progress">
                <h3>Delivery Progress</h3>
                <div className="info-card delivery-progress-container">
                  <div className="delivery-route">
                    <div className="delivery-stops">
                      {visible.map((s, i) => (
                        <div key={s.id} className={`delivery-stop${i === 0 ? ' first-stop' : ''}${i === visible.length - 1 && !showAllLocations ? ' last-visible-stop' : ''}`}>
                          {i > 0 && <div className="connector" />}
                          {s.action === 'CDS_ORDER_PICKUP' ? <div className="stop-icon"><i className="material-icons">store</i></div> : <div className="stop-number">{s.seq}</div>}
                          <div className="stop-details">
                            <div className="stop-info">
                              <div className="stop-name">{s.name || 'Unnamed Location'}</div>
                              <div className="stop-address">{s.action === 'CDS_ORDER_PICKUP' ? 'Order pickup at CDS' : s.address || 'Address not available'}</div>
                              <div className="stop-time">{s.completedAt ? fmtDateTime(s.completedAt) : 'Time not available'}</div>
                            </div>
                            <div className="stop-status">
                              <span className={stopTone(s)}>{stopLabel(s)}</span>
                            </div>
                            {s.failReason && <div className="cu-stop-reason">{s.failReason}</div>}
                            <div className="stop-otp">
                              <span className="otp-label">OTP : </span>
                              <span className="otp-badge">{s.otp ? OTP_STATUS[s.otp.status].label : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {locations.length > 3 && (
                        <div className="show-more-container">
                          <button className="show-more-btn" onClick={() => setShowAllLocations((v) => !v)}>
                            <i className="material-icons">{showAllLocations ? 'expand_less' : 'expand_more'}</i>
                            {showAllLocations ? ' Show Less ' : ' Show More Stops '}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="information-card cu-map-card">
                <h3>Route Map</h3>
                <div className="cu-map-wrap">
                  <RouteMap stops={mapStops(t.stops)} height={380} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customer' && (
          <div className="trip-details-content">
            {data.canRun && (t.status === 'PLANNED' || t.status === 'ASSIGNED') && (
              <div className="cu-note"><i className="fas fa-circle-info" /><div>Start the trip to record the stops.</div></div>
            )}
            {data.canRun && running && pickupPending && (
              <div className="cu-note">
                <i className="fas fa-circle-info" />
                <div>Load the orders at the CDS first (stop {pickupStop?.seq}): Send OTP, confirm the quantities and enter the OTP. The retailer deliveries open after loading.</div>
              </div>
            )}
            {data.canRun && running && !pickupPending && (
              <div className="cu-note">
                <i className="fas fa-circle-info" />
                <div>Record each retailer delivery for {t.deliveryPersonName}: Send OTP to the retailer, then Complete with the delivered quantities, the amount collected (COD) and the OTP. Use Mark Failed if the delivery could not be done.</div>
              </div>
            )}
            <div className="mat-card mat-elevation-z3">
              <div className="mat-card-content p-0">
                <div className="table-responsive">
                  <table className="mat-mdc-table w-100">
                    <thead>
                      <tr className="mat-mdc-header-row small bg-light">
                        {th('fa-hashtag', 'Stop No.')}
                        {th('fa-store', 'Customer Business Name', 'text-start')}
                        {th('fa-map-marker-alt', 'Address', 'text-start')}
                        {th('fa-key', 'OTP Status')}
                        {th('fa-info-circle', 'Status')}
                        {th('fa-clock', 'Delivered Time')}
                        {th('fa-rupee-sign', 'Orders/Amount')}
                        {th('fa-cogs', 'Actions')}
                      </tr>
                    </thead>
                    <tbody>
                      {t.stops.map((s) => {
                        const block = blockReason(s);
                        const amount = sumOf(s.lines, (l) => l.plannedQty * l.unitPrice);
                        return (
                          <tr className="mat-mdc-row small" key={s.id}>
                            <td className="text-center">{s.seq}</td>
                            <td className="text-start">
                              {s.name}
                              <span className="cu-sub">{STOP_ACTION[s.action].label}</span>
                            </td>
                            <td className="text-start">{s.address}</td>
                            <td className="text-center">
                              {s.otp ? <Badge meta={OTP_STATUS[s.otp.status]} /> : 'N/A'}
                              {s.verifiedAt && <span className="cu-sub">{fmtDateTime(s.verifiedAt)}</span>}
                            </td>
                            <td className="text-center">
                              <span className={`status-badge ${stopTone(s)}`}>{stopLabel(s)}</span>
                              {s.failReason && <div className="cu-stop-reason">{s.failReason}</div>}
                            </td>
                            <td className="text-center">{(s.status === 'DONE' || s.status === 'PARTIAL') && s.completedAt ? fmtDateTime(s.completedAt) : '-'}</td>
                            <td className="text-center">{`${orderIdsOf(s).length}/₹ ${num(amount)}`}</td>
                            <td className="text-center">
                              <div className="cu-stop-actions">
                                <button className="btn btn-sm text-primary" title="View" aria-label={`View stop ${s.seq}`} onClick={() => setStopId(s.id)}><i className="fas fa-eye" /></button>
                                {canAct(s) && (
                                  <>
                                    <button className="btn btn-sm btn-outline-primary" disabled={busy || !!block} title={block || 'Send the OTP'} onClick={() => void sendOtp(s)}>
                                      <i className="fas fa-paper-plane me-1" />{s.otp?.status === 'ACTIVE' ? 'Resend OTP' : 'Send OTP'}
                                    </button>
                                    <button className="btn btn-sm btn-success" disabled={busy || !!block} title={block || 'Enter the quantities and the OTP'} onClick={() => setStopId(s.id)}>
                                      <i className="fas fa-check me-1" />Complete
                                    </button>
                                    {STOP_ACTION[s.action].canFail && (
                                      <button className="btn btn-sm btn-outline-danger" disabled={busy || !!block} title={block || 'Mark this stop as failed'} onClick={() => void markFailed(s)}>
                                        <i className="fas fa-ban me-1" />Mark Failed
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {t.stops.length === 0 && (
                        <tr className="mat-mdc-row">
                          <td colSpan={8} className="text-center py-4"><i className="fas fa-inbox me-2 text-muted" /> No customer orders found </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'product' && (
          <div className="trip-details-content">
            <div className="mat-card mat-elevation-z3">
              <div className="mat-card-content p-0">
                <div className="table-responsive">
                  <table className="mat-mdc-table w-100">
                    <thead>
                      <tr className="mat-mdc-header-row small bg-light">
                        {th('fa-box', 'Product Name', 'text-start')}
                        {th('fa-barcode', 'SKU')}
                        {th('fa-weight-hanging', 'Unit Weight')}
                        {th('fa-tag', 'Unit Price')}
                        {th('fa-check-circle', 'Delivered')}
                        {th('fa-times-circle', 'Failed')}
                        {th('fa-clock', 'Pending')}
                        {th('fa-layer-group', 'Total Qty')}
                        {th('fa-rupee-sign', 'Amount')}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr className="mat-mdc-row small" key={p.sku}>
                          <td className="text-start">{p.name}</td>
                          <td className="text-center">{p.sku}</td>
                          <td className="text-center">{`${p.unitWeightKg} kg`}</td>
                          <td className="text-center">{addCurrency(p.unitPrice)}</td>
                          <td className="text-center">{p.delivered}</td>
                          <td className="text-center">{p.failed}</td>
                          <td className="text-center">{p.pending}</td>
                          <td className="text-center">{p.total}</td>
                          <td className="text-center">{addCurrency(p.amount)}</td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr className="mat-mdc-row">
                          <td colSpan={9} className="text-center py-4"><i className="fas fa-inbox me-2 text-muted" /> No product orders found </td>
                        </tr>
                      )}
                    </tbody>
                    {products.length > 0 && (
                      <tfoot>
                        <tr className="mat-mdc-footer-row small bg-light">
                          <td /><td /><td /><td /><td /><td />
                          <td className="text-center fw-bold"> Total: </td>
                          <td className="text-center fw-bold">{sumOf(products, (p) => p.total)}</td>
                          <td className="text-center fw-bold">{addCurrency(sumOf(products, (p) => p.amount))}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {dialogStop && (
        <StopDialog
          key={dialogStop.id}
          stop={dialogStop}
          orders={data.orders}
          collections={data.collections}
          canWork={canAct(dialogStop) && !blockReason(dialogStop)}
          blockReason={canAct(dialogStop) ? blockReason(dialogStop) : ''}
          busy={busy}
          onClose={() => setStopId(null)}
          onSendOtp={() => sendOtp(dialogStop)}
          onComplete={(input) => completeStop(dialogStop, input)}
          onFail={() => markFailed(dialogStop)}
        />
      )}
      {cancelOpen && <CuCancelTripDialog trip={t} onClose={() => setCancelOpen(false)} onCancelled={reload} />}
    </div>
  );
}

// ---------------------------------------------------------------- stop dialog

/**
 * One stop, in the Customer Order Details layout. A workable stop has the quantity per line (≤ planned), the amount
 * collected and mode per COD order (retailer stops; defaults to the due amount for the entered quantities), Send OTP,
 * the OTP field, Verify OTP & Complete and — where allowed — Mark Failed. Otherwise it is read-only.
 */
function StopDialog({ stop, orders, collections, canWork, blockReason, busy, onClose, onSendOtp, onComplete, onFail }: {
  stop: StopView;
  orders: TripOrder[];
  collections: Collection[];
  canWork: boolean;
  blockReason: string;
  busy: boolean;
  onClose: () => void;
  onSendOtp: () => Promise<OtpSent | null>;
  onComplete: (input: StopCompleteInput) => Promise<boolean>;
  onFail: () => Promise<boolean>;
}) {
  const pickup = stop.action === 'CDS_ORDER_PICKUP';
  const [qty, setQty] = useState<string[]>(() => stop.lines.map((l) => String(l.plannedQty)));
  const [cash, setCash] = useState<Record<string, { amount?: string; mode: 'CASH' | 'UPI' }>>({});
  const [otp, setOtp] = useState('');
  const [sms, setSms] = useState<OtpSent | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !Swal.isVisible()) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const orderOf = (oid: string | null) => orders.find((o) => o.id === oid);
  const orderIds = orderIdsOf(stop);
  const qtyError = (i: number): string => {
    const v = (qty[i] ?? '').trim();
    const max = stop.lines[i].plannedQty;
    if (v === '') return 'Enter a quantity';
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0) return 'Enter a valid quantity';
    if (n > max) return `Cannot be more than ${max}`;
    return '';
  };
  const qtyOf = (i: number) => (qtyError(i) ? 0 : Number(qty[i]));
  const codOrders = stop.action === 'RETAILER_DELIVERY' ? orderIds.filter((oid) => orderOf(oid)?.paymentMode === 'COD') : [];
  const due = (oid: string) => round2(sumOf(stop.lines.map((l, i) => ({ l, i })).filter(({ l }) => l.orderId === oid), ({ l, i }) => qtyOf(i) * l.unitPrice));
  const amountOf = (oid: string) => cash[oid]?.amount ?? String(due(oid));
  const modeOf = (oid: string) => cash[oid]?.mode ?? 'CASH';
  const amountError = (oid: string) => {
    const v = amountOf(oid).trim();
    return v === '' || !(Number(v) >= 0) ? 'Enter a valid amount' : '';
  };
  const otpOk = /^\d{4,6}$/.test(otp.trim());
  const invalid = stop.lines.some((_, i) => !!qtyError(i)) || codOrders.some((oid) => !!amountError(oid)) || !otpOk;
  const stopCollections = collections.filter((c) => orderIds.includes(c.orderId));
  const lineTotal = (i: number) => (canWork ? qtyOf(i) : stop.lines[i].actualQty ?? stop.lines[i].plannedQty) * stop.lines[i].unitPrice;

  const send = async () => {
    const r = await onSendOtp();
    if (r) setSms(r);
  };
  const submit = async () => {
    const ok = await onComplete({
      otp: otp.trim(),
      lines: stop.lines.map((_, i) => ({ idx: i, actualQty: Number(qty[i]) })),
      collections: codOrders.map((oid) => ({ orderId: oid, amount: Number(amountOf(oid)), mode: modeOf(oid) })),
    });
    if (ok) onClose();
  };
  const fail = async () => {
    if (await onFail()) onClose();
  };

  const payment = Array.from(new Set(orderIds.map((oid) => (orderOf(oid)?.paymentMode === 'COD' ? 'COD' : 'Prepaid')))).join(' / ');
  const otpInfo = sms
    ? `OTP sent to ${sms.sentToName} (+91 ${sms.sentToPhone}), valid until ${fmtDateTime(sms.expiresAt)}.`
    : stop.otp
      ? `${OTP_STATUS[stop.otp.status].label} · ${stop.otp.sentToName}${stop.otp.status === 'ACTIVE' ? `, valid until ${fmtDateTime(stop.otp.expiresAt)}` : ''}`
      : 'Not sent yet';
  const tdh = (icon: string, label: string, align = 'text-start') => (
    <th className={`text-uppercase py-2 px-3 small ${align}`}><i className={`fas ${icon} me-1 text-primary`} />{label}</th>
  );

  return (
    <div className="modal-overlay fm-overlay" onClick={() => { if (!canWork) onClose(); }}>
      <div className="modal-content filters-modal cu-stop-dialog" role="dialog" aria-modal="true" aria-label={`Stop ${stop.seq} · ${stop.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {`Stop ${stop.seq} · ${stop.name}`}
            <small>{`${STOP_ACTION[stop.action].label} · ${stopLabel(stop)}`}</small>
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Close"><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body trip-order-details">
          {blockReason && <div className="cu-note"><i className="fas fa-circle-info" /><div>{blockReason}.</div></div>}

          <div className="mat-card mat-elevation-z3">
            <div className="mat-card-title py-2"><i className={`fas ${pickup ? 'fa-warehouse' : 'fa-user'} me-2 text-primary`} />{pickup ? ' CDS Store Information ' : ' Customer Information '}</div>
            <div className="mat-card-content">
              <div className="row g-3 p-3">
                <div className="col-md-6">
                  <label className="text-muted small">{pickup ? 'CDS Store' : 'Customer Business Name'}</label>
                  <p className="mb-1 fw-medium">{stop.name}</p>
                  <label className="text-muted small">Mobile Number</label>
                  <p className="mb-1 fw-medium">{stop.phone || 'N/A'}</p>
                  <label className="text-muted small">{pickup ? 'Orders' : 'Payment'}</label>
                  <p className="mb-1 fw-medium">{pickup ? orderIds.length : payment || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small">Address</label>
                  <p className="mb-1 fw-medium">{stop.address || 'N/A'}</p>
                  <label className="text-muted small">Coordinates</label>
                  <p className="mb-1 fw-medium">{`${stop.lat}, ${stop.lng}`}</p>
                  <label className="text-muted small">OTP</label>
                  <p className="mb-1 fw-medium">{otpInfo}</p>
                </div>
              </div>
              {stop.failReason && <div className="px-3 pb-3 cu-stop-reason">{stop.status === 'FAILED' ? 'Failed' : 'Note'}: {stop.failReason}</div>}
            </div>
          </div>

          <div className="mat-card mat-elevation-z3">
            <div className="mat-card-title py-2"><i className="fas fa-boxes me-2 text-primary" />{pickup ? ' Orders to Load ' : ' Order Products '}</div>
            <div className="mat-card-content p-0">
              <div className="table-responsive">
                <table className="mat-mdc-table w-100 products-table">
                  <thead>
                    <tr className="mat-mdc-header-row small bg-light">
                      {tdh('fa-hashtag', 'Order ID')}
                      {tdh('fa-box', 'Product')}
                      {tdh('fa-barcode', 'SKU')}
                      {tdh('fa-tag', 'Unit Price', 'text-center')}
                      {tdh('fa-shopping-cart', 'Planned Qty', 'text-center')}
                      {tdh('fa-balance-scale', pickup ? 'Loaded Qty' : 'Delivered Qty', 'text-center')}
                      {tdh('fa-rupee-sign', 'Total', 'text-center')}
                    </tr>
                  </thead>
                  <tbody>
                    {stop.lines.map((l, i) => {
                      const err = canWork ? qtyError(i) : '';
                      return (
                        <tr className="mat-mdc-row small" key={`${l.orderId}-${l.sku}-${i}`}>
                          <td className="text-start">{orderOf(l.orderId)?.orderNo ?? '-'}{!pickup ? null : <span className="cu-sub">{orderOf(l.orderId)?.retailerName}</span>}</td>
                          <td className="text-start">{l.name}</td>
                          <td className="text-start">{l.sku}</td>
                          <td className="text-center">{addCurrency(l.unitPrice)}</td>
                          <td className="text-center">{l.plannedQty}</td>
                          <td className="text-center">
                            {canWork ? (
                              <>
                                <input
                                  type="number"
                                  min={0}
                                  max={l.plannedQty}
                                  step={1}
                                  className={`form-control form-control-sm cu-qty${err ? ' is-invalid' : ''}`}
                                  aria-label={`Quantity ${l.name}`}
                                  value={qty[i]}
                                  onChange={(e) => setQty((q) => q.map((x, j) => (j === i ? e.target.value : x)))}
                                />
                                {err && <span className="cu-stop-reason d-block">{err}</span>}
                              </>
                            ) : (
                              <span className={l.actualQty !== null && l.actualQty < l.plannedQty ? 'text-danger fw-bold' : ''}>{l.actualQty ?? '-'}</span>
                            )}
                          </td>
                          <td className="text-center">{addCurrency(round2(lineTotal(i)))}</td>
                        </tr>
                      );
                    })}
                    {stop.lines.length === 0 && (
                      <tr className="mat-mdc-row">
                        <td colSpan={7} className="text-center py-4"> No products found for this stop </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="mat-mdc-footer-row bg-light">
                      <td className="py-2 px-3 fw-bold">Total:</td>
                      <td /><td /><td />
                      <td className="text-center fw-bold">{sumOf(stop.lines, (l) => l.plannedQty)}</td>
                      <td className="text-center fw-bold">{canWork ? stop.lines.reduce((acc, _l, i) => acc + qtyOf(i), 0) : sumOf(stop.lines, (l) => l.actualQty ?? 0)}</td>
                      <td className="text-center fw-bold">{addCurrency(round2(stop.lines.reduce((acc, _l, i) => acc + lineTotal(i), 0)))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {canWork && codOrders.length > 0 && (
            <div className="mat-card mat-elevation-z3">
              <div className="mat-card-title py-2"><i className="fas fa-indian-rupee-sign me-2 text-primary" /> Payment Collected (COD) </div>
              <div className="mat-card-content p-0">
                <div className="table-responsive">
                  <table className="mat-mdc-table w-100">
                    <thead>
                      <tr className="mat-mdc-header-row small bg-light">
                        {tdh('fa-hashtag', 'Order ID')}
                        {tdh('fa-rupee-sign', 'Due Amount', 'text-center')}
                        {tdh('fa-rupee-sign', 'Amount Collected', 'text-center')}
                        {tdh('fa-wallet', 'Mode', 'text-center')}
                      </tr>
                    </thead>
                    <tbody>
                      {codOrders.map((oid) => (
                        <tr className="mat-mdc-row small" key={oid}>
                          <td className="text-start">{orderOf(oid)?.orderNo}</td>
                          <td className="text-center">{addCurrency(due(oid))}</td>
                          <td className="text-center">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className={`form-control form-control-sm cu-amount${amountError(oid) ? ' is-invalid' : ''}`}
                              aria-label={`Amount collected ${orderOf(oid)?.orderNo ?? ''}`}
                              value={amountOf(oid)}
                              onChange={(e) => setCash((c) => ({ ...c, [oid]: { mode: modeOf(oid), amount: e.target.value } }))}
                            />
                          </td>
                          <td className="text-center">
                            <select
                              className="form-select form-select-sm cu-mode"
                              aria-label={`Mode ${orderOf(oid)?.orderNo ?? ''}`}
                              value={modeOf(oid)}
                              onChange={(e) => setCash((c) => ({ ...c, [oid]: { amount: c[oid]?.amount, mode: e.target.value as 'CASH' | 'UPI' } }))}
                            >
                              <option value="CASH">Cash</option>
                              <option value="UPI">UPI</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {stopCollections.length > 0 && (
            <div className="mat-card mat-elevation-z3">
              <div className="mat-card-title py-2"><i className="fas fa-indian-rupee-sign me-2 text-primary" /> Collection Summary </div>
              <div className="mat-card-content p-0">
                <div className="table-responsive">
                  <table className="mat-mdc-table w-100">
                    <thead>
                      <tr className="mat-mdc-header-row small bg-light">
                        {tdh('fa-hashtag', 'Order ID')}
                        {tdh('fa-rupee-sign', 'Due Amount', 'text-center')}
                        {tdh('fa-rupee-sign', 'Amount Collected', 'text-center')}
                        {tdh('fa-wallet', 'Mode', 'text-center')}
                        {tdh('fa-clock', 'Collected At', 'text-center')}
                      </tr>
                    </thead>
                    <tbody>
                      {stopCollections.map((c) => (
                        <tr className="mat-mdc-row small" key={c.id}>
                          <td className="text-start">{c.orderNo}</td>
                          <td className="text-center">{addCurrency(c.expectedAmount)}</td>
                          <td className="text-center">{addCurrency(c.amount)}</td>
                          <td className="text-center">{c.mode === 'UPI' ? 'UPI' : 'Cash'}</td>
                          <td className="text-center">{fmtDateTime(c.collectedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {canWork && (
            <div className="mat-card mat-elevation-z3">
              <div className="mat-card-title py-2"><i className="fas fa-shield-halved me-2 text-primary" /> OTP Verification </div>
              <div className="mat-card-content">
                <div className="cu-otp-row">
                  <button className="btn btn-outline-primary btn-sm" disabled={busy} onClick={() => void send()}>
                    <i className="fas fa-paper-plane me-1" />{sms || stop.otp?.status === 'ACTIVE' ? 'Resend OTP' : 'Send OTP'}
                  </button>
                  <div>
                    <label htmlFor="cu-stop-otp">OTP</label>
                    <input
                      id="cu-stop-otp"
                      className="form-control form-control-sm cu-otp-input"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div className="text-muted small">{`OTP between ${STOP_ACTION[stop.action].otpBetween}.`}</div>
                </div>
                {sms && (
                  <div className="cu-sms">
                    {`OTP sent to ${sms.sentToName} (+91 ${sms.sentToPhone}), valid until ${fmtDateTime(sms.expiresAt)}.`}
                    <small>{`Demo SMS: “${sms.demoSms}”`}</small>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {canWork && STOP_ACTION[stop.action].canFail && (
            <button className="cu-fail-btn" disabled={busy} onClick={() => void fail()}><i className="fas fa-ban me-1" />Mark Failed</button>
          )}
          <button className="cancel-btn" onClick={onClose}>Close</button>
          {canWork && (
            <button className="save-btn" disabled={busy || invalid} title={!otpOk ? 'Enter the OTP' : ''} onClick={() => void submit()}>
              <i className="fas fa-shield-halved me-1" />Verify OTP &amp; Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
