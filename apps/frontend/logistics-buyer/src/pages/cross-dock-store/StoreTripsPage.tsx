// Cross Dock Store → Trips: riders' runs in the LBNP Trips layout, with each retailer's delivery OTP and the collection.
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import { errorMessage } from '../../api/services/crossDock.service';
import type { RunStatus, XdRunRow } from '../../types/crossDock';
import { addCurrency } from '../../utils/pipes';
import { dateTime, day, rupees, time } from '../service-centre/labels';
import { LoadError, RefreshError } from '../service-centre/ScUi';
import { useLoad } from '../service-centre/useLoad';
import LbTripList, { type LbTripListRow } from '../cross-dock/lbnp/LbTripList';
import { RUN_BADGE, runCovered, runStops } from './runView';
import { useStoreApi } from './useStoreApi';

export default function StoreTripsPage() {
  const api = useStoreApi();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoad(() => Promise.all([api.overview(), api.runs()]), [api]);
  const [overview, runs] = data ?? [null, [] as XdRunRow[]];

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      await reload();
      Swal.fire({ icon: 'success', title: ok, showConfirmButton: false, timer: 1300 });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Could not update the trip', text: errorMessage(e), confirmButtonText: 'OK' });
    }
  };

  const rows = useMemo<LbTripListRow[]>(() => {
    if (!overview) return [];
    return runs.map((x) => {
      const b = RUN_BADGE[x.status];
      const delivered = x.stops.flatMap((s) => s.orders.filter((o) => o.status === 'DELIVERED')).length;
      const returned = x.stops.reduce((n, s) => n + s.returnedOrderIds.length, 0);
      const cash = x.stops.reduce((n, s) => n + s.cash, 0);
      const upi = x.stops.reduce((n, s) => n + s.upi, 0);
      return {
        id: x.id,
        cells: [
          <button type="button" className="btn btn-link p-0 fw-semibold text-decoration-none" onClick={() => navigate(`/cross-dock/trips/${x.id}`)}>{x.runNo}</button>,
          'Store riders',
          <span className={`status-badge ${b.cls}`}>{b.label}</span>,
          `${x.stopsDone} / ${x.stops.length}`,
          x.orderCount,
          x.riderName,
          x.distanceKm,
          dateTime(x.createdAt),
          day(x.date),
          runCovered(x),
          addCurrency(x.amountDue),
        ],
        route: [
          ['two_wheeler', 'Vehicle', x.vehicleRegNo],
          ['person', 'Rider Name', x.riderName],
          ['phone', 'Contact Number', x.riderPhone],
          ['play_circle_outline', 'Start Time', x.startedAt ? dateTime(x.startedAt) : 'Not left yet'],
          ['flag', 'Back At Store', x.completedAt ? time(x.completedAt) : '-'],
          ['vpn_key', 'Delivery OTP', 'One per retailer (see route)'],
        ],
        summaryTitle: 'Order Summary',
        summary: [
          { cls: 'total', icon: 'receipt_long', label: 'Total', value: x.orderCount },
          { cls: 'delivered', icon: 'check_circle', label: 'Delivered', value: delivered },
          { cls: 'partial', icon: 'rule', label: 'Partial', value: 0 },
          { cls: 'returned', icon: 'undo', label: 'Return', value: returned },
          { cls: 'pending', icon: 'schedule', label: 'Pending', value: x.orderCount - delivered - returned },
        ],
        collectionTitle: 'Collection Summary',
        collection: [
          { label: 'Total Sale Value', value: addCurrency(x.stops.reduce((n, s) => n + s.orders.reduce((a, o) => a + o.value, 0), 0)) },
          { label: 'To Collect', value: addCurrency(x.amountDue) },
          { label: 'Total Delivery Points', value: String(x.stops.length), icon: 'location_on' },
          { label: 'COD Collection', value: rupees(cash), icon: 'payments' },
          { label: 'Digital Collection', value: rupees(upi), icon: 'smartphone' },
          { label: 'Net Sale Collection', value: rupees(cash + upi), icon: 'account_balance_wallet' },
        ],
        routeTitle: 'Delivery Route',
        stops: runStops(overview.store, x),
        menu: [
          { icon: 'visibility', color: '#3b82f6', label: 'View details', onClick: () => navigate(`/cross-dock/trips/${x.id}`) },
          ...(x.status === 'PLANNED'
            ? [
                { icon: 'play_circle', color: '#22c55e', label: 'Rider leaves the store', onClick: () => act(() => api.startRun(x.id), `${x.riderName} is out`) },
                { icon: 'cancel', color: '#ef4444', label: 'Cancel', onClick: () => act(() => api.cancelRun(x.id), `${x.runNo} cancelled`) },
              ]
            : []),
        ],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs, overview, navigate]);

  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  const n = (s: RunStatus) => runs.filter((x) => x.status === s).length;
  const today = overview?.operatingDate;
  const collected = runs.filter((x) => x.date === today).reduce((s, x) => s + x.collected, 0);

  return (
    <LbTripList
      icon="two_wheeler"
      title="Trips"
      description="Riders’ delivery trips from the store. Riders collect the retailer’s OTP and the payment in the Field Agent App."
      actions={
        <button className="filter-btn" onClick={() => navigate('/cross-dock/delivery-planning')}>
          <i className="material-icons">route</i> Delivery Planning
        </button>
      }
      stats={[
        { title: 'Total Trips', value: runs.length, sub: 'All Time', line: 'Store riders', icon: 'fas fa-truck-loading', cls: 'trips' },
        { title: 'In Progress', value: n('OUT'), sub: 'Active Trips', line: 'On the road', icon: 'fas fa-route', cls: 'delivery' },
        { title: 'Completed', value: n('COMPLETED'), sub: 'Completed Trips', line: `${rupees(collected)} collected today`, icon: 'fas fa-check-circle', cls: 'customers' },
        { title: 'Planned', value: n('PLANNED'), sub: 'Upcoming Trips', line: 'Waiting for the rider', icon: 'fas fa-calendar-alt', cls: 'orders' },
      ]}
      columns={['Trip Number', 'Provider', 'Status', 'Drop Points', 'Orders', 'Rider Name', 'Planned Kms', 'Created Date', 'Delivery Date', 'Time Covered', 'To Collect']}
      rows={rows}
      loading={loading}
      emptyText="No trips found"
    >
      <RefreshError error={data ? error : null} />
    </LbTripList>
  );
}
