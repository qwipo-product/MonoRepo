// Cross Dock Store → Trip details (a rider's run), in the LBNP Trip details layout. Each retailer has a delivery OTP;
// the rider's update (delivered / returned, cash and UPI, OTP) is recorded here on the Field Agent App's behalf.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Dialog from '@mui/material/Dialog';
import Swal from 'sweetalert2';
import DataLoading from '../../components/DataLoading';
import { errorMessage } from '../../api/services/crossDock.service';
import { amountDue, type XdOrderRow, type XdRunStopView } from '../../types/crossDock';
import { addCurrency } from '../../utils/pipes';
import { dateTime, day, plural, RIDER_RETURN_REASONS, rupees, time } from '../service-centre/labels';
import OrderDrawer from '../service-centre/OrderDrawer';
import { LoadError, RefreshError } from '../service-centre/ScUi';
import { useLoad } from '../service-centre/useLoad';
import LbTripDetails, { LbInfoCard, LbProgressCard, LbSummaryRow, LbTable } from '../cross-dock/lbnp/LbTripDetails';
import { RUN_BADGE, runStops } from './runView';
import { useStoreApi } from './useStoreApi';

export default function RunDetailsPage() {
  const { id = '' } = useParams();
  const api = useStoreApi();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoad(() => Promise.all([api.overview(), api.run(id)]), [api, id]);
  const [busy, setBusy] = useState<string | null>(null);
  const [recording, setRecording] = useState<XdRunStopView | null>(null);
  const [order, setOrder] = useState<XdOrderRow | null>(null);

  if (loading && !data) return <DataLoading message="Loading trip details..." showTip />;
  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  if (!data) return null;
  const [overview, { run, products }] = data;
  const b = RUN_BADGE[run.status];
  const cash = run.stops.reduce((s, x) => s + x.cash, 0);
  const upi = run.stops.reduce((s, x) => s + x.upi, 0);
  const returnedOrders = run.stops.flatMap((s) => s.orders.filter((o) => s.returnedOrderIds.includes(o.id)));

  const act = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      await reload();
      Swal.fire({ icon: 'success', title: ok, showConfirmButton: false, timer: 1400 });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Could not update the trip', text: errorMessage(e), confirmButtonText: 'OK' });
    } finally {
      setBusy(null);
    }
  };
  const cancel = async () => {
    const r = await Swal.fire({ icon: 'warning', title: 'Cancel Trip', text: `Are you sure? Its ${plural(run.orderCount, 'order')} go back to Delivery Planning.`, showCancelButton: true, confirmButtonText: 'Confirm Cancellation', cancelButtonText: 'Cancel', confirmButtonColor: '#dc2626' });
    if (r.isConfirmed) await act('cancel', () => api.cancelRun(run.id), `${run.runNo} cancelled`);
  };

  const recordBtn = (s: XdRunStopView) =>
    run.status === 'OUT' && s.status !== 'DONE' ? (
      <button className="btn btn-sm btn-primary" onClick={() => setRecording(s)}>
        <i className="fas fa-hand-holding-dollar me-1" /> Record delivery
      </button>
    ) : undefined;

  const stops = runStops(overview.store, run).map((s, i) => ({ ...s, status: s.status ?? (run.startedAt ? 'Left' : 'Planned'), statusClass: s.statusClass ?? 'none', action: i === 0 ? undefined : recordBtn(run.stops[i - 1]) }));

  return (
    <>
      <LbTripDetails
        title={run.runNo}
        subtitle={`Provider: ${overview.store.name} riders · ${day(run.date)}`}
        onBack={() => navigate('/cross-dock/trips')}
        actions={
          <>
            <span className={`badge rounded-pill ${b.cls === 'completed' ? 'text-bg-success' : b.cls === 'cancelled' ? 'text-bg-secondary' : b.cls === 'in-progress' ? 'text-bg-warning' : 'text-bg-info'}`}>{b.label}</span>
            {run.status === 'PLANNED' && (
              <>
                <button className="btn btn-sm btn-outline-danger" onClick={cancel} disabled={!!busy}><i className="fas fa-ban me-1" /> Cancel trip</button>
                <button className="btn btn-sm btn-primary" onClick={() => act('start', () => api.startRun(run.id), `${run.riderName} is out`)} disabled={!!busy}>
                  <i className="fas fa-play me-1" /> Rider leaves the store
                </button>
              </>
            )}
          </>
        }
        banner={<RefreshError error={error} />}
        tabs={[
          {
            key: 'summary',
            label: 'Summary',
            render: () => (
              <LbSummaryRow>
                <LbInfoCard
                  cls="route-overview"
                  title="Route Overview"
                  rows={[
                    ['two_wheeler', 'Vehicle', run.vehicleRegNo],
                    ['person', 'Rider Name', run.riderName],
                    ['phone', 'Contact Number', run.riderPhone],
                    ['play_circle_outline', 'Start Time', run.startedAt ? dateTime(run.startedAt) : 'N/A'],
                    ['flag', 'Back At Store', run.completedAt ? dateTime(run.completedAt) : 'N/A'],
                    ['route', 'Planned Kms', `${run.distanceKm} km`],
                  ]}
                />
                <LbInfoCard
                  cls="trip-summary"
                  title="Trip Summary"
                  rows={[
                    ['monetization_on', 'Total Sale Value', addCurrency(run.stops.reduce((s, x) => s + x.orders.reduce((a, o) => a + o.value, 0), 0))],
                    ['monetization_on', 'To Collect', addCurrency(run.amountDue)],
                    ['monetization_on', 'Total Return Value', addCurrency(returnedOrders.reduce((s, o) => s + amountDue(o), 0))],
                    ['location_on', 'Total Delivery Points', String(run.stops.length)],
                    ['payments', 'COD Collection', rupees(cash)],
                    ['smartphone', 'Digital Collection', rupees(upi)],
                    ['account_balance_wallet', 'Net Collection', rupees(cash + upi)],
                  ]}
                />
                <LbProgressCard title="Delivery Progress" stops={stops} />
              </LbSummaryRow>
            ),
          },
          {
            key: 'customer',
            label: 'Customer Wise Orders',
            render: () => (
              <LbTable
                columns={[
                  { icon: 'fa-hashtag', label: 'Stop No.' },
                  { icon: 'fa-store', label: 'Customer Business Name', align: 'start' },
                  { icon: 'fa-map-marker-alt', label: 'Address', align: 'start' },
                  { icon: 'fa-map-marker-alt', label: 'OTP', align: 'start' },
                  { icon: 'fa-info-circle', label: 'Status' },
                  { icon: 'fa-clock', label: 'Delivered Time' },
                  { icon: 'fa-rupee-sign', label: 'Orders/Amount' },
                  { icon: 'fa-cogs', label: 'Actions' },
                ]}
                rows={run.stops.map((s, i) => {
                  const st = stops[i + 1];
                  return [
                    s.seq,
                    s.retailerName,
                    `${s.locality} · ${s.ownerName}, ${s.retailerPhone}`,
                    s.otp,
                    <span className={`status-badge ${st.statusClass}`} style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 4, background: st.statusClass === 'returned' || st.statusClass === 'partialdelivered' ? '#ffb6c1' : '#dcfce7', color: st.statusClass === 'returned' || st.statusClass === 'partialdelivered' ? '#e3342f' : '#16a34a', fontSize: 12 }}>{st.status}</span>,
                    s.doneAt ? time(s.doneAt) : '-',
                    `${s.orders.length}/₹ ${s.amountDue.toLocaleString('en-IN')}`,
                    <div className="d-flex justify-content-center gap-1">
                      <button className="btn btn-sm text-primary" title="View order" onClick={() => setOrder(s.orders[0])}><i className="fas fa-eye" /></button>
                      {recordBtn(s)}
                    </div>,
                  ];
                })}
                empty="No customer orders found"
              />
            ),
          },
          {
            key: 'product',
            label: 'Ordered Products',
            render: () => (
              <LbTable
                columns={[
                  { icon: 'fa-box', label: 'Product Name', align: 'start' },
                  { icon: 'fa-ruler', label: 'UOM' },
                  { icon: 'fa-barcode', label: 'UPC' },
                  { icon: 'fa-box', label: 'Cases' },
                  { icon: 'fa-cubes', label: 'PCS' },
                  { icon: 'fa-tag', label: 'MRP' },
                  { icon: 'fa-layer-group', label: 'Total Qty' },
                  { icon: 'fa-rupee-sign', label: 'Amount' },
                ]}
                rows={products.map((p) => [p.name, p.uom, p.caseSize, Math.floor(p.qty / p.caseSize), p.qty % p.caseSize, addCurrency(p.mrp), p.qty, addCurrency(p.amount)])}
                footer={['', '', '', '', '', 'Total:', products.reduce((s, p) => s + p.qty, 0), addCurrency(products.reduce((s, p) => s + p.amount, 0))]}
                empty="No product orders found"
              />
            ),
          },
          {
            key: 'return',
            label: 'Return Products',
            render: () => (
              <LbTable
                columns={[
                  { icon: 'fa-hashtag', label: 'Order', align: 'start' },
                  { icon: 'fa-store', label: 'Customer', align: 'start' },
                  { icon: 'fa-industry', label: 'Distributor', align: 'start' },
                  { icon: 'fa-undo', label: 'Return Qty' },
                  { icon: 'fa-comment', label: 'Reason', align: 'start' },
                  { icon: 'fa-rupee-sign', label: 'Amount' },
                ]}
                rows={returnedOrders.map((o) => [o.orderNo, o.retailerName, o.distributorName, o.quantity, o.returnReason ?? '-', addCurrency(amountDue(o))])}
                empty="No return products found"
              />
            ),
          },
        ]}
      />

      {recording && (
        <RecordDelivery
          stop={recording}
          onClose={() => setRecording(null)}
          onSave={async (body) => {
            await api.completeStop(run.id, recording.seq, body);
            setRecording(null);
            await reload();
            Swal.fire({ icon: 'success', title: `${recording.retailerName} done`, showConfirmButton: false, timer: 1400 });
          }}
        />
      )}
      <OrderDrawer order={order} settings={overview.settings} audience="store" onClose={() => setOrder(null)} />
    </>
  );
}

/** The Field Agent App's delivery update, recorded on the rider's behalf. */
function RecordDelivery({ stop, onClose, onSave }: { stop: XdRunStopView; onClose: () => void; onSave: (b: { cash: number; upi: number; returned: { orderId: string; reason: string }[]; otp: string }) => Promise<void> }) {
  const [returned, setReturned] = useState<Record<string, string>>({});
  const delivered = stop.orders.filter((o) => !(o.id in returned));
  const due = delivered.reduce((s, o) => s + amountDue(o), 0);
  const [cash, setCash] = useState(String(due));
  const [upi, setUpi] = useState('0');
  const [otp, setOtp] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const setReturn = (id: string, reason: string | null) => {
    const next = { ...returned };
    if (reason === null) delete next[id];
    else next[id] = reason;
    setReturned(next);
    setCash(String(stop.orders.filter((o) => !(o.id in next)).reduce((s, o) => s + amountDue(o), 0)));
    setUpi('0');
    setErr(null);
  };
  const total = (Number(cash) || 0) + (Number(upi) || 0);

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      await onSave({ cash: Number(cash) || 0, upi: Number(upi) || 0, returned: Object.entries(returned).map(([orderId, reason]) => ({ orderId, reason })), otp });
    } catch (e) {
      setErr(errorMessage(e, 'Could not record the delivery.'));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="rd-title">
      <div className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h2 id="rd-title" className="fs-5 fw-bold mb-0">{stop.retailerName}</h2>
            <div className="small text-muted">{stop.locality} · {stop.ownerName}</div>
          </div>
          <button type="button" className="btn btn-sm btn-light" onClick={onClose} aria-label="Close"><i className="fas fa-times" /></button>
        </div>
        <div className="alert alert-light border small py-2">
          <i className="fas fa-mobile-screen me-1" aria-hidden="true" />
          In real use the rider records this in the Field Agent App: the retailer gives the delivery OTP, the update goes to the Seller Store and on to the retailer.
        </div>

        <div className="fw-semibold small mb-2">Orders</div>
        <ul className="list-unstyled mb-3">
          {stop.orders.map((o) => {
            const isReturned = o.id in returned;
            return (
              <li key={o.id} className="border rounded p-2 mb-2">
                <div className="d-flex justify-content-between gap-2 flex-wrap align-items-center">
                  <div>
                    <div className="small fw-semibold">{o.orderNo}</div>
                    <div className="small text-muted">{o.distributorName} · {o.quantity} units · {rupees(amountDue(o))}{o.discrepancy ? ' (after short/damaged units)' : ''}</div>
                  </div>
                  <div className="btn-group btn-group-sm" role="group" aria-label={`Outcome for ${o.orderNo}`}>
                    <button type="button" className={`btn ${!isReturned ? 'btn-success' : 'btn-outline-secondary'}`} onClick={() => setReturn(o.id, null)}>Delivered</button>
                    <button type="button" className={`btn ${isReturned ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={() => setReturn(o.id, returned[o.id] ?? RIDER_RETURN_REASONS[0])}>Returned</button>
                  </div>
                </div>
                {isReturned && (
                  <select className="form-select form-select-sm mt-2" value={returned[o.id]} onChange={(e) => setReturn(o.id, e.target.value)} aria-label="Return reason">
                    {RIDER_RETURN_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </li>
            );
          })}
        </ul>

        {delivered.length > 0 && (
          <div className="mb-3">
            <label className="form-label small fw-semibold" htmlFor="rd-otp">Retailer’s delivery OTP</label>
            <input id="rd-otp" className="form-control form-control-sm" style={{ maxWidth: 140 }} inputMode="numeric" maxLength={4} value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setErr(null); }} />
            <div className="form-text">Demo: the OTP is shown on this stop in the Delivery Progress ({stop.otp}).</div>
          </div>
        )}

        <div className="fw-semibold small mb-2">Payment collected · {rupees(due)} due</div>
        <div className="row g-2 mb-2">
          <div className="col-6">
            <label className="form-label small" htmlFor="rd-cash">Cash (₹)</label>
            <input id="rd-cash" type="number" min={0} className="form-control form-control-sm" value={cash} onChange={(e) => { setCash(e.target.value); setErr(null); }} />
          </div>
          <div className="col-6">
            <label className="form-label small" htmlFor="rd-upi">UPI (₹)</label>
            <input id="rd-upi" type="number" min={0} className="form-control form-control-sm" value={upi} onChange={(e) => { setUpi(e.target.value); setErr(null); }} />
          </div>
        </div>
        <div className="d-flex gap-2 mb-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setCash(String(due)); setUpi('0'); }}>All cash</button>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setCash('0'); setUpi(String(due)); }}>All UPI</button>
        </div>
        <div className={`small mb-3 ${total === due ? 'text-success' : 'text-danger'}`}>
          {total === due ? `Adds up to ${rupees(due)}.` : `Cash and UPI add up to ${rupees(total)}; ${rupees(due)} is due.`}
        </div>

        {err && <div className="alert alert-danger py-2 small" role="alert">{err}</div>}
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={save} disabled={saving}>
            {saving ? <i className="fas fa-spinner fa-spin me-1" /> : <i className="fas fa-check me-1" />}
            Save drop
          </button>
        </div>
      </div>
    </Dialog>
  );
}
