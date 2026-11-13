// Service Centre → Trip details, in the LBNP Trip details layout. Pickups close with the distributor's pickup OTP; a
// drop at a store waits for that store's GRN and closes when the driver enters the OTP the store gives him.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Swal from 'sweetalert2';
import DataLoading from '../../components/DataLoading';
import { crossDockService, errorMessage } from '../../api/services/crossDock.service';
import { amountDue, type XdOrderRow } from '../../types/crossDock';
import { addCurrency } from '../../utils/pipes';
import LbTripDetails, { LbInfoCard, LbProgressCard, LbSummaryRow, LbTable } from '../cross-dock/lbnp/LbTripDetails';
import { dateTime, hm, kg, ORDER_STATUS, RETURN_STATUS, slotLabel } from './labels';
import OrderDrawer from './OrderDrawer';
import { LoadError, RefreshError, StatusPill } from './ScUi';
import { covered, TRIP_BADGE, tripStops } from './tripView';
import { useLoad } from './useLoad';

export default function ScTripDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoad(() => Promise.all([crossDockService.overview(), crossDockService.trip(id)]), [id]);
  const [busy, setBusy] = useState<string | null>(null);
  const [otps, setOtps] = useState<Record<number, string>>({});
  const [order, setOrder] = useState<XdOrderRow | null>(null);

  if (loading && !data) return <DataLoading message="Loading trip details..." showTip />;
  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  if (!data) return null;
  const [overview, { trip, orders, returns, products }] = data;
  const isReturn = trip.kind === 'RETURN';
  const b = TRIP_BADGE[trip.status];
  const pickupsDone = trip.stops.filter((s) => s.action === 'PICKUP').every((s) => s.status === 'DONE');
  const nextPickup = trip.stops.find((s) => s.action === 'PICKUP' && s.status === 'PENDING');
  const win = overview.settings.windows.find((w) => w.key === trip.slot);

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try {
      await fn();
      await reload();
      if (ok) Swal.fire({ icon: 'success', title: ok, showConfirmButton: false, timer: 1400 });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Could not update the trip', text: errorMessage(e), confirmButtonText: 'OK' });
    } finally {
      setBusy(null);
    }
  };
  const cancel = async () => {
    const r = await Swal.fire({ icon: 'warning', title: 'Cancel Trip', text: 'Are you sure you want to cancel this trip? Its orders go back to planning.', showCancelButton: true, confirmButtonText: 'Confirm Cancellation', cancelButtonText: 'Cancel', confirmButtonColor: '#dc2626' });
    if (r.isConfirmed) await run('cancel', () => crossDockService.cancelTrip(trip.id), `${trip.tripNo} cancelled`);
  };

  const stopAction = (seq: number) => {
    const s = trip.stops.find((x) => x.seq === seq)!;
    if (trip.status !== 'IN_PROGRESS' || s.status === 'DONE') return undefined;
    const storeDrop = !isReturn && s.action === 'DROP';
    if (s.action === 'PICKUP') {
      if (nextPickup?.seq !== seq) return <span className="small text-muted">After the earlier pickups</span>;
      return (
        <button className="btn btn-sm btn-primary" disabled={!!busy} onClick={() => run(`s${seq}`, () => crossDockService.completeStop(trip.id, seq), isReturn ? 'Collected' : 'Picked up')}>
          {busy === `s${seq}` ? <i className="fas fa-spinner fa-spin me-1" /> : <i className="fas fa-check me-1" />}
          {isReturn ? 'Mark collected' : `Mark picked up (OTP ${s.otp})`}
        </button>
      );
    }
    if (!pickupsDone) return <span className="small text-muted">After every pickup</span>;
    if (!storeDrop) {
      return (
        <button className="btn btn-sm btn-primary" disabled={!!busy} onClick={() => run(`s${seq}`, () => crossDockService.completeStop(trip.id, seq), 'Handed back')}>
          <i className="fas fa-check me-1" /> Mark handed back
        </button>
      );
    }
    if (!s.grn) return <span className="small text-warning"><i className="fas fa-clipboard-list me-1" />Waiting for the store’s GRN</span>;
    return (
      <>
        <span className="small text-muted">Driver enters the store’s OTP:</span>
        <input className="form-control form-control-sm" inputMode="numeric" maxLength={4} placeholder="OTP" value={otps[seq] ?? ''} onChange={(e) => setOtps({ ...otps, [seq]: e.target.value.replace(/\D/g, '') })} aria-label={`Store OTP for ${s.placeName}`} />
        <button className="btn btn-sm btn-primary" disabled={(otps[seq] ?? '').length !== 4 || !!busy} onClick={() => run(`s${seq}`, () => crossDockService.completeStop(trip.id, seq, otps[seq]), 'Drop closed')}>
          {busy === `s${seq}` ? <i className="fas fa-spinner fa-spin me-1" /> : <i className="fas fa-key me-1" />} Verify OTP
        </button>
      </>
    );
  };

  const stops = tripStops(trip).map((s, i) => ({ ...s, status: s.status ?? (trip.startedAt ? 'Left' : 'Planned'), statusClass: s.statusClass ?? 'none', action: i === 0 ? undefined : stopAction(trip.stops[i - 1].seq) }));

  const byRetailer = [...new Set(orders.map((o) => o.retailerId))].map((rid) => {
    const os = orders.filter((o) => o.retailerId === rid);
    return { rid, os, first: os[0] };
  });

  return (
    <>
      <LbTripDetails
        title={trip.tripNo}
        subtitle={`Provider: Qwipo CDS Service Centre · ${isReturn ? 'Return trip' : 'Pickup trip'}`}
        onBack={() => navigate('/service-centre/trips')}
        actions={
          <>
            <span className={`badge rounded-pill ${b.cls === 'completed' ? 'text-bg-success' : b.cls === 'cancelled' ? 'text-bg-secondary' : b.cls === 'in-progress' ? 'text-bg-warning' : 'text-bg-info'}`}>{b.label}</span>
            {trip.status === 'PLANNED' && (
              <>
                <button className="btn btn-sm btn-outline-danger" onClick={cancel} disabled={!!busy}><i className="fas fa-ban me-1" /> Cancel trip</button>
                <button className="btn btn-sm btn-primary" onClick={() => run('start', () => crossDockService.startTrip(trip.id), `${trip.tripNo} started`)} disabled={!!busy}>
                  <i className="fas fa-play me-1" /> Start trip
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
                    ['directions_car', 'Vehicle', `${trip.vehicleRegNo} (${trip.capacityKg} kgs)`],
                    ['person', 'Driver Name', trip.driverName],
                    ['phone', 'Contact Number', trip.driverPhone],
                    ['schedule', 'Round', slotLabel(overview.settings, trip.slot)],
                    ['play_circle_outline', 'Start Time', trip.startedAt ? dateTime(trip.startedAt) : 'N/A'],
                    ['access_time', 'Estimated Completion', win ? hm(win.end) : 'N/A'],
                    ['vpn_key', isReturn ? 'Collect OTP' : 'Pickup OTP', trip.stops.filter((s) => s.action === 'PICKUP').map((s) => s.otp).join(', ')],
                    ['vpn_key', isReturn ? 'Return OTP' : 'Drop OTP', isReturn ? trip.stops.filter((s) => s.action === 'DROP').map((s) => s.otp).join(', ') : 'Each store gives it after its GRN'],
                  ]}
                />
                <LbInfoCard
                  cls="trip-summary"
                  title="Trip Summary"
                  rows={[
                    ['monetization_on', 'Total Sale Value', addCurrency(isReturn ? returns.reduce((s, x) => s + x.value, 0) : orders.reduce((s, o) => s + o.value, 0))],
                    ['receipt_long', isReturn ? 'Returns' : 'Orders', String(isReturn ? trip.returnCount : trip.orderCount)],
                    ['factory', isReturn ? 'Collect Points' : 'Pickup Points', String(trip.stops.filter((s) => s.action === 'PICKUP').length)],
                    ['location_on', isReturn ? 'Hand-back Points' : 'Drop Points', String(trip.stops.filter((s) => s.action === 'DROP').length)],
                    ['scale', 'Total Weight', `${kg(trip.weightKg)} of ${trip.capacityKg} kg`],
                    ['route', 'Planned Kms', `${trip.distanceKm} km`],
                    ['timer', 'Time Covered', covered(trip)],
                  ]}
                />
                <LbProgressCard title="Delivery Progress" stops={stops} />
              </LbSummaryRow>
            ),
          },
          ...(isReturn
            ? [
                {
                  key: 'return',
                  label: 'Return Products',
                  render: () => (
                    <LbTable
                      columns={[
                        { icon: 'fa-hashtag', label: 'Return No.', align: 'start' },
                        { icon: 'fa-store', label: 'Retailer', align: 'start' },
                        { icon: 'fa-warehouse', label: 'From Store' },
                        { icon: 'fa-industry', label: 'Back To', align: 'start' },
                        { icon: 'fa-cubes', label: 'Units' },
                        { icon: 'fa-comment', label: 'Reason', align: 'start' },
                        { icon: 'fa-rupee-sign', label: 'Amount' },
                        { icon: 'fa-info-circle', label: 'Status' },
                      ]}
                      rows={returns.map((x) => [x.returnNo, x.retailerName, x.cdsCode, x.distributorName, x.items, x.reason, addCurrency(x.value), <StatusPill {...RETURN_STATUS[x.status]} />])}
                      footer={['', '', '', 'Total:', returns.reduce((s, x) => s + x.items, 0), '', addCurrency(returns.reduce((s, x) => s + x.value, 0)), '']}
                      empty="No return products found"
                    />
                  ),
                },
              ]
            : [
                {
                  key: 'customer',
                  label: 'Customer Wise Orders',
                  render: () => (
                    <LbTable
                      columns={[
                        { icon: 'fa-hashtag', label: 'No.' },
                        { icon: 'fa-store', label: 'Customer Business Name', align: 'start' },
                        { icon: 'fa-map-marker-alt', label: 'Area', align: 'start' },
                        { icon: 'fa-warehouse', label: 'Drop At' },
                        { icon: 'fa-industry', label: 'Distributors', align: 'start' },
                        { icon: 'fa-info-circle', label: 'Status' },
                        { icon: 'fa-rupee-sign', label: 'Orders/Amount' },
                      ]}
                      rows={byRetailer.map(({ os, first }, i) => [
                        i + 1,
                        first.retailerName,
                        first.retailerLocality,
                        first.cdsCode,
                        [...new Set(os.map((o) => o.distributorName))].join(', '),
                        <StatusPill {...ORDER_STATUS[first.status]} />,
                        `${os.length}/${addCurrency(os.reduce((s, o) => s + amountDue(o), 0))}`,
                      ])}
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
                  key: 'orders',
                  label: 'Orders',
                  render: () => (
                    <LbTable
                      columns={[
                        { icon: 'fa-hashtag', label: 'Order', align: 'start' },
                        { icon: 'fa-store', label: 'Customer', align: 'start' },
                        { icon: 'fa-industry', label: 'Distributor', align: 'start' },
                        { icon: 'fa-warehouse', label: 'Drop At' },
                        { icon: 'fa-weight', label: 'Weight' },
                        { icon: 'fa-info-circle', label: 'Status' },
                      ]}
                      rows={orders.map((o) => [
                        <button type="button" className="sc-link" onClick={() => setOrder(o)}>{o.orderNo}</button>,
                        o.retailerName,
                        o.distributorName,
                        o.cdsCode,
                        kg(o.weightKg),
                        <StatusPill {...ORDER_STATUS[o.status]} />,
                      ])}
                      empty="No orders on this trip"
                    />
                  ),
                },
              ]),
        ]}
      />
      <OrderDrawer order={order} settings={overview.settings} onClose={() => setOrder(null)} />
    </>
  );
}
