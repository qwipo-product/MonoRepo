// Cross Dock Store → Inward: Service Centre trucks coming to the store, in the LBNP Trips layout. Each truck carries
// several distributors' goods for many retailers; open it to do the GRN and hand the driver the OTP.
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import type { XdInboundTruck } from '../../types/crossDock';
import { dateTime, day, kg, plural, rupees, slotLabel, time } from '../service-centre/labels';
import { LoadError, RefreshError } from '../service-centre/ScUi';
import { useLoad } from '../service-centre/useLoad';
import LbTripList, { type LbTripListRow } from '../cross-dock/lbnp/LbTripList';
import { INBOUND_STATUS } from './inbound';
import { localDay, useStoreApi } from './useStoreApi';

export default function InwardPage() {
  const api = useStoreApi();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useLoad(() => Promise.all([api.overview(), api.inbound()]), [api]);
  const [overview, trucks] = data ?? [null, [] as XdInboundTruck[]];

  const rows = useMemo<LbTripListRow[]>(() => {
    if (!overview) return [];
    return trucks.map((t) => {
      const st = INBOUND_STATUS[t.state];
      const open = () => navigate(`/cross-dock/inward/${t.tripId}`);
      const lines = t.grn?.lines ?? [];
      const counted = lines.reduce((s, l) => s + l.received, 0);
      const short = lines.reduce((s, l) => s + Math.max(0, l.expected - l.received), 0);
      const damaged = lines.reduce((s, l) => s + l.damaged, 0);
      return {
        id: t.tripId,
        cells: [
          <button type="button" className="btn btn-link p-0 fw-semibold text-decoration-none" onClick={open}>{t.tripNo}</button>,
          'Qwipo CDS Service Centre',
          <span className={`status-badge ${st.cls}`} style={{ width: 'auto' }}>{st.label}</span>,
          <span title={t.distributors.join(', ')}>{t.distributors.length}</span>,
          t.retailerCount,
          `${t.units} / ${kg(t.weightKg)}`,
          t.driverName || 'N/A',
          t.vehicleRegNo,
          `${day(t.date)}, ${slotLabel(overview.settings, t.slot, false)}`,
          t.receivedAt ? time(t.receivedAt) : t.state === 'SCHEDULED' ? 'Not started' : '-',
          rupees(t.value),
        ],
        route: [
          ['directions_car', 'Vehicle', `${t.vehicleRegNo} · ${t.vehicleModel}`],
          ['person', 'Driver Name', t.driverName || 'Not Assigned'],
          ['phone', 'Contact Number', t.driverPhone || 'Not Available'],
          ['schedule', 'Round', slotLabel(overview.settings, t.slot)],
          ['play_circle_outline', 'Start Time', t.startedAt ? dateTime(t.startedAt) : 'Not started'],
          ['local_shipping', 'Pickups Done', `${t.pickupsDone} of ${t.pickups}`],
          ['vpn_key', 'Handover OTP', t.otp ?? 'Shown after the GRN'],
        ],
        summaryTitle: 'Load Summary',
        summary: [
          { cls: 'total', icon: 'receipt_long', label: 'Orders', value: t.orderCount },
          { cls: 'delivered', icon: 'check_circle', label: 'Received', value: t.state === 'RECEIVED' ? t.orderCount : 0 },
          { cls: 'partial', icon: 'storefront', label: 'Customers', value: t.retailerCount },
          { cls: 'returned', icon: 'factory', label: 'Distributors', value: t.distributors.length },
          { cls: 'pending', icon: 'schedule', label: 'Pending', value: t.state === 'RECEIVED' ? 0 : t.orderCount },
        ],
        collectionTitle: 'GRN Summary',
        collection: [
          { label: 'Expected Units', value: String(t.units) },
          { label: 'Counted Units', value: t.grn ? String(counted) : 'Not counted' },
          { label: 'Short Units', value: t.grn ? String(short) : '-' },
          { label: 'Damaged Units', value: t.grn ? String(damaged) : '-' },
          { label: 'Goods Value', value: rupees(t.value), icon: 'payments' },
          { label: 'Distributors', value: t.distributors.join(', '), icon: 'factory' },
        ],
        routeTitle: 'Truck Route',
        stops: [
          { name: 'Service Centre yard', address: 'Yard 3, IDA Balanagar', time: t.startedAt ? `Left ${time(t.startedAt)}` : 'Not left yet', otp: '-' },
          ...t.pickupStops.map((p) => ({ name: p.name, address: p.address, time: p.doneAt ? `Picked up ${time(p.doneAt)}` : 'Pickup pending', otp: '••••', status: p.done ? 'Picked up' : 'Pending', statusClass: p.done ? 'orderpickedup' : 'pending' })),
          { name: overview.store.name, address: overview.store.address, time: t.receivedAt ? `Received ${time(t.receivedAt)}` : 'Arriving', otp: t.otp ?? 'After GRN', status: st.label, statusClass: t.state === 'RECEIVED' ? 'delivered' : 'pending' },
        ],
        menu: [
          { icon: 'fact_check', color: '#3b82f6', label: t.state === 'RECEIVED' ? 'View GRN' : 'Open GRN', onClick: open },
        ],
      };
    });
  }, [trucks, overview, navigate]);

  if (error && !data) return <div className="sc-page"><LoadError message={error} onRetry={reload} /></div>;

  const today = overview?.operatingDate ?? '';
  const atStore = trucks.filter((t) => t.state === 'AT_STORE' || t.state === 'GRN_DONE');
  const coming = trucks.filter((t) => t.state === 'SCHEDULED' || t.state === 'ON_THE_WAY');
  const received = trucks.filter((t) => t.state === 'RECEIVED' && localDay(t.receivedAt) === today);

  return (
    <LbTripList
      icon="move_to_inbox"
      title="Inward"
      description="Service Centre trucks bringing several distributors’ goods to the store. Count each truck (GRN), then give the driver the OTP."
      actions={
        <button className="filter-btn" onClick={reload} disabled={loading}>
          <i className="material-icons">refresh</i> Refresh
        </button>
      }
      stats={[
        { title: 'At the Store', value: atStore.length, sub: 'GRN or OTP pending', line: atStore.length ? atStore.map((t) => t.tripNo).join(', ') : 'No truck waiting', icon: 'fas fa-truck-ramp-box', cls: 'delivery' },
        { title: 'On the Way', value: coming.length, sub: 'From the Service Centre', line: `${plural(coming.reduce((s, t) => s + t.orderCount, 0), 'order')} coming`, icon: 'fas fa-route', cls: 'orders' },
        { title: 'Received Today', value: received.length, sub: 'Trucks checked in', line: `${plural(received.reduce((s, t) => s + t.orderCount, 0), 'order')} to plan`, icon: 'fas fa-check-circle', cls: 'customers' },
        { title: 'All Trucks', value: trucks.length, sub: 'Last two days', line: 'Service Centre deliveries', icon: 'fas fa-truck-loading', cls: 'trips' },
      ]}
      columns={['Trip Number', 'Provider', 'Status', 'Distributors', 'Customers', 'Units / Weight', 'Driver Name', 'Vehicle', 'Round', 'Received', 'Goods Value']}
      rows={rows}
      loading={loading}
      emptyText="No trucks for this store"
    >
      <RefreshError error={data ? error : null} />
    </LbTripList>
  );
}
