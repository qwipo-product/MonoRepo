// One planned route in the LBNP Delivery Route Details layout: summary cards, stops, customer- and product-wise orders,
// and Generate Trip / Cancel.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Swal from 'sweetalert2';
import { errorMessage } from '../../../api/services/crossDock.service';
import { addCurrency, addWeight } from '../../../utils/pipes';
import { day, plural } from '../../service-centre/labels';
import { LoadError } from '../../service-centre/ScUi';
import { useLoad } from '../../service-centre/useLoad';
import { useStoreApi } from '../../cross-dock-store/useStoreApi';
import { LbRouteDetails, LbRouteTable } from '../lbnp/LbPlanning';
import { MODE, planApi, resourceLabel, type PlanMode } from './planMode';

const SLOT: Record<string, string> = { R1: 'Round 1', R2: 'Round 2', EARLY_AM: 'Early-morning top-up', RETURNS: 'Returns window', DELIVERY: 'Delivery' };

export default function RouteDetailsPage({ mode }: { mode: PlanMode }) {
  const m = MODE[mode];
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const store = useStoreApi();
  const api = planApi(mode, store);
  const { data: p, loading, error, reload } = useLoad(() => api.get(id), [mode, id, store]);
  const [busy, setBusy] = useState(false);

  if (error && !p) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;

  const generate = async () => {
    if (!p) return;
    setBusy(true);
    try {
      const res = await api.generate(p.id);
      navigate(`${m.tripsBase}/${res.tripId}`);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Could not generate the trip', text: errorMessage(e), confirmButtonText: 'OK' });
      setBusy(false);
    }
  };
  const cancel = async () => {
    if (!p) return;
    const r = await Swal.fire({ icon: 'warning', title: `Cancel ${p.routeId}?`, text: `Its ${plural(p.orderCount || p.returnCount, m.unit)} go back to planning.`, showCancelButton: true, confirmButtonText: 'Cancel route', cancelButtonText: 'Keep', confirmButtonColor: '#dc2626' });
    if (!r.isConfirmed) return;
    try {
      await api.cancel(p.id);
      navigate(m.base);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Could not cancel', text: errorMessage(e), confirmButtonText: 'OK' });
    }
  };

  const count = p ? p.orderCount || p.returnCount : 0;
  const isReturn = mode === 'return';

  return (
    <LbRouteDetails
      title={m.detailsTitle}
      subtitle={p ? `Route ID: ${p.routeId} · ${SLOT[p.slot]}, ${day(p.date)} · ${resourceLabel(p)}${p.status === 'CANCELLED' ? ' · Cancelled' : ''}` : 'Route ID: …'}
      onBack={() => navigate(m.base)}
      loading={loading && !p}
      actions={
        p?.status === 'CREATED' ? (
          <>
            <button className="btn btn-sm btn-outline-danger" onClick={cancel} disabled={busy}><i className="fas fa-times me-1" /> Cancel Route</button>
            <button className="btn btn-sm btn-success" onClick={generate} disabled={busy}>
              {busy ? <i className="fas fa-spinner fa-spin me-1" /> : <i className="fas fa-play me-1" />} Generate Trip
            </button>
          </>
        ) : p?.status === 'TRIP_CREATED' ? (
          <button className="btn btn-sm btn-primary" onClick={() => navigate(`${m.tripsBase}/${p.tripId}`)}><i className="fas fa-external-link-alt me-1" /> View Trip {p.tripNo}</button>
        ) : null
      }
      cards={
        p
          ? [
              { bg: 'bg-primary-subtle', icon: 'fa-shopping-cart text-primary', label: isReturn ? 'Total Returns' : 'Total Orders', value: count, footIcon: 'fa-chart-line text-success', foot: isReturn ? ' Items to hand back' : ' Orders on this route' },
              { bg: 'bg-success-subtle', icon: 'fa-rupee-sign text-success', label: mode === 'delivery' ? 'Total To Collect' : 'Total Sale Value', value: addCurrency(p.value), footIcon: 'fa-arrow-up text-success', foot: mode === 'delivery' ? ' Cash + UPI on delivery' : ' Goods value' },
              { bg: 'bg-warning-subtle', icon: 'fa-weight text-warning', label: 'Total Weight', value: addWeight(p.weightKg), footIcon: 'fa-truck-loading text-warning', foot: p.capacityKg ? ` of ${p.capacityKg} kg capacity` : ' On a two-wheeler' },
              { bg: 'bg-info-subtle', icon: 'fa-route text-info', label: 'Total Distance', value: `${p.distanceKm} km`, footIcon: 'fa-map-marker-alt text-info', foot: ` ${p.stops.length} stops, back to base` },
            ]
          : []
      }
      tabs={
        !p
          ? []
          : [
              {
                key: 'stops',
                icon: 'fa-map-signs',
                label: 'Stops',
                render: () => (
                  <LbRouteTable
                    columns={[
                      { icon: 'fa-hashtag', label: 'Stop No.' },
                      { icon: 'fa-exchange-alt', label: 'Action' },
                      { icon: 'fa-store', label: 'Place', start: true },
                      { icon: 'fa-map-marker-alt', label: 'Area', start: true },
                      { icon: 'fa-shopping-cart', label: isReturn ? 'Returns' : 'Orders' },
                      { icon: 'fa-weight', label: 'Weight' },
                      { icon: 'fa-rupee-sign', label: 'Value' },
                    ]}
                    rows={p.stops.map((s) => [s.seq, mode === 'delivery' ? 'Deliver' : s.action === 'PICKUP' ? (isReturn ? 'Collect' : 'Pick up') : isReturn ? 'Hand back' : 'Drop', s.name, s.locality, s.orders, addWeight(s.weightKg), addCurrency(s.value)])}
                    empty="No stops"
                  />
                ),
              },
              ...(isReturn
                ? []
                : [
                    {
                      key: 'customer',
                      icon: 'fa-users',
                      label: 'Customer Wise Orders',
                      render: () => (
                        <LbRouteTable
                          columns={[
                            { icon: 'fa-hashtag', label: 'No.' },
                            { icon: 'fa-store', label: 'Retailer Name', start: true },
                            { icon: 'fa-industry', label: 'Distributors', start: true },
                            { icon: 'fa-shopping-cart', label: 'Orders Count' },
                            { icon: 'fa-rupee-sign', label: 'Total Amount' },
                            { icon: 'fa-weight', label: 'Total Weight' },
                          ]}
                          rows={p.customers.map((c, i) => [i + 1, `${c.retailerName} · ${c.locality}`, c.distributors.join(', '), c.orders, addCurrency(c.amount), addWeight(c.weightKg)])}
                          empty="No customer orders found"
                        />
                      ),
                    },
                    {
                      key: 'product',
                      icon: 'fa-box',
                      label: 'Product Wise Orders',
                      render: () => (
                        <LbRouteTable
                          columns={[
                            { icon: 'fa-box', label: 'Product Name', start: true },
                            { icon: 'fa-ruler', label: 'UOM' },
                            { icon: 'fa-barcode', label: 'UPC' },
                            { icon: 'fa-boxes', label: 'CS' },
                            { icon: 'fa-cubes', label: 'PCS' },
                            { icon: 'fa-tag', label: 'MRP' },
                            { icon: 'fa-layer-group', label: 'Total Qty (PCS)' },
                            { icon: 'fa-rupee-sign', label: 'Amount' },
                          ]}
                          rows={p.products.map((x) => [x.name, x.uom, x.caseSize, Math.floor(x.qty / x.caseSize), x.qty % x.caseSize, addCurrency(x.mrp), x.qty, addCurrency(x.amount)])}
                          footer={['', '', '', '', '', 'TOTAL:', p.products.reduce((s, x) => s + x.qty, 0), addCurrency(p.products.reduce((s, x) => s + x.amount, 0))]}
                          empty="No product orders found"
                        />
                      ),
                    },
                  ]),
            ]
      }
    />
  );
}
