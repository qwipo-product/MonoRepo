// Service Centre → Trips, in the LBNP Trips layout: pickup trips (distributors → stores) and return trips.
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import { crossDockService, errorMessage } from '../../api/services/crossDock.service';
import type { TripStatus, XdTripRow } from '../../types/crossDock';
import { addCurrency } from '../../utils/pipes';
import LbTripList, { type LbTripListRow } from '../cross-dock/lbnp/LbTripList';
import { dateTime, kg, slotLabel } from './labels';
import { covered, TRIP_BADGE, tripStops } from './tripView';
import { LoadError, RefreshError } from './ScUi';
import { useLoad } from './useLoad';

export default function ScTripsPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoad(() => Promise.all([crossDockService.overview(), crossDockService.trips()]));
  const [overview, trips] = data ?? [null, [] as XdTripRow[]];

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
    return trips.map((t) => {
      const b = TRIP_BADGE[t.status];
      const isReturn = t.kind === 'RETURN';
      const drops = t.stops.filter((s) => s.action === 'DROP');
      const pickups = t.stops.filter((s) => s.action === 'PICKUP');
      const handed = drops.filter((s) => s.status === 'DONE').reduce((n, s) => n + (s.orderIds.length || s.returnIds.length), 0);
      const onBoard = pickups.filter((s) => s.status === 'DONE').reduce((n, s) => n + (s.orderIds.length || s.returnIds.length), 0) - handed;
      const total = isReturn ? t.returnCount : t.orderCount;
      return {
        id: t.id,
        cells: [
          <button type="button" className="btn btn-link p-0 fw-semibold text-decoration-none" onClick={() => navigate(`/service-centre/trips/${t.id}`)}>{t.tripNo}</button>,
          isReturn ? 'Return' : 'Pickup',
          <span className={`status-badge ${b.cls}`}>{b.label}</span>,
          `${drops.length} / ${pickups.length}`,
          `${t.weightKg} / ${t.capacityKg}`,
          t.driverName || 'N/A',
          t.distanceKm,
          dateTime(t.createdAt),
          slotLabel(overview.settings, t.slot, false),
          covered(t),
          t.vehicleRegNo,
        ],
        route: [
          ['directions_car', 'Vehicle', `${t.vehicleRegNo} · ${t.vehicleModel}`],
          ['person', 'Driver Name', t.driverName || 'Not Assigned'],
          ['phone', 'Contact Number', t.driverPhone || 'Not Available'],
          ['schedule', 'Round', slotLabel(overview.settings, t.slot)],
          ['play_circle_outline', 'Start Time', t.startedAt ? dateTime(t.startedAt) : 'Not started'],
          ['vpn_key', isReturn ? 'Collect OTP' : 'Pickup OTP', pickups.map((s) => s.otp).join(', ') || 'N/A'],
          ['vpn_key', isReturn ? 'Return OTP' : 'Drop OTP', isReturn ? drops.map((s) => s.otp).join(', ') : 'Given by each store after its GRN'],
        ],
        summaryTitle: isReturn ? 'Return Summary' : 'Order Summary',
        summary: [
          { cls: 'total', icon: 'receipt_long', label: 'Total', value: total },
          { cls: 'delivered', icon: 'check_circle', label: isReturn ? 'Handed Back' : 'At Store', value: handed },
          { cls: 'partial', icon: 'local_shipping', label: 'On Board', value: Math.max(0, onBoard) },
          { cls: 'returned', icon: 'undo', label: 'Short', value: drops.reduce((n, s) => n + (s.grn?.lines.reduce((a, l) => a + Math.max(0, l.expected - l.received) + l.damaged, 0) ?? 0), 0) },
          { cls: 'pending', icon: 'schedule', label: 'Pending', value: Math.max(0, total - handed - Math.max(0, onBoard)) },
        ],
        collectionTitle: 'Load Summary',
        collection: [
          { label: 'Total Weight', value: kg(t.weightKg) },
          { label: 'Vehicle Capacity', value: `${t.capacityKg} kg` },
          { label: 'Planned Kms', value: `${t.distanceKm} km` },
          { label: isReturn ? 'Collect Points' : 'Pickup Points', value: String(pickups.length), icon: 'factory' },
          { label: isReturn ? 'Hand-back Points' : 'Drop Points', value: String(drops.length), icon: 'location_on' },
          { label: 'Trip Charges', value: addCurrency(0), icon: 'payments' },
        ],
        routeTitle: isReturn ? 'Return Route' : 'Pickup Route',
        stops: tripStops(t),
        menu: [
          { icon: 'visibility', color: '#3b82f6', label: 'View details', onClick: () => navigate(`/service-centre/trips/${t.id}`) },
          ...(t.status === 'PLANNED'
            ? [
                { icon: 'play_circle', color: '#22c55e', label: 'Start trip', onClick: () => act(() => crossDockService.startTrip(t.id), `${t.tripNo} started`) },
                { icon: 'cancel', color: '#ef4444', label: 'Cancel', onClick: () => act(() => crossDockService.cancelTrip(t.id), `${t.tripNo} cancelled`) },
              ]
            : []),
        ],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips, overview, navigate]);

  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;
  const n = (s: TripStatus) => trips.filter((t) => t.status === s).length;

  return (
    <LbTripList
      icon="local_shipping"
      title="Trips"
      description="Pickup trips from distributors to Cross Dock Stores, and return trips back."
      actions={
        <>
          <button className="filter-btn" onClick={() => navigate('/service-centre/return-planning')}>
            <i className="material-icons">undo</i> Return Planning
          </button>
          <button className="filter-btn" onClick={() => navigate('/service-centre/pickup-planning')}>
            <i className="material-icons">route</i> Pickup Planning
          </button>
        </>
      }
      stats={[
        { title: 'Total Trips', value: trips.length, sub: 'Today and yesterday', line: 'Service Centre fleet', icon: 'fas fa-truck-loading', cls: 'trips' },
        { title: 'In Progress', value: n('IN_PROGRESS'), sub: 'Active Trips', line: 'On the road', icon: 'fas fa-route', cls: 'delivery' },
        { title: 'Completed', value: n('COMPLETED'), sub: 'Completed Trips', line: 'Every stop done', icon: 'fas fa-check-circle', cls: 'customers' },
        { title: 'Planned', value: n('PLANNED'), sub: 'Upcoming Trips', line: 'Waiting to start', icon: 'fas fa-calendar-alt', cls: 'orders' },
      ]}
      columns={['Trip Number', 'Type', 'Status', 'Drop / Pickup Points', 'Vol Weight', 'Driver Name', 'Planned Kms', 'Created Date', 'Round', 'Time Covered', 'Vehicle']}
      rows={rows}
      loading={loading}
      emptyText="No trips found"
    >
      <RefreshError error={data ? error : null} />
    </LbTripList>
  );
}
