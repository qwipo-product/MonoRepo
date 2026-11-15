// Operational reports and dashboard figures, computed from live CDS records. Pure (Node-testable).
import { ACTIVE_TRIP, ORDER_STATUS, TRIP_STATUS, TRIP_TYPE } from './status.ts';
import type { CdsRole, CdsState, TripType } from './types.ts';

export interface ReportFilters { from?: string; to?: string; cdsStoreId?: string; distributorId?: string; retailerId?: string; status?: string }
export interface Column { key: string; label: string; align?: 'end' }
export interface Report { id: string; title: string; columns: Column[]; rows: Record<string, string | number>[]; totals?: Record<string, number | string> }

export const REPORTS: Record<CdsRole, { id: string; title: string; filters: (keyof ReportFilters)[] }[]> = {
  SERVICE_CENTRE: [
    { id: 'distributor-pickups', title: 'Distributor-wise pickups', filters: ['from', 'to', 'distributorId'] },
    { id: 'cds-incoming', title: 'CDS-wise incoming orders', filters: ['from', 'to', 'cdsStoreId'] },
    { id: 'trips-DISTRIBUTOR_PICKUP', title: 'Distributor Pickup Trips (CDS to Distributor)', filters: ['from', 'to', 'status'] },
    { id: 'trips-CDS_DELIVERY', title: 'CDS Delivery Trips (Distributor to CDS)', filters: ['from', 'to', 'status'] },
    { id: 'pending-ops', title: 'Pending pickup & delivery operations', filters: ['cdsStoreId'] },
    { id: 'trip-completion', title: 'Trip completion', filters: ['from', 'to'] },
  ],
  /** LBNP-style: one Performance Report (From / To dates, Excel download). */
  CDS_USER: [
    { id: 'performance', title: 'Performance Report', filters: ['from', 'to'] },
  ],
};

const sum = <T>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);
const r2 = (n: number) => Math.round(n * 100) / 100;
const day = (iso: string) => iso.slice(0, 10);
const inRange = (iso: string, f: ReportFilters) => (!f.from || day(iso) >= f.from) && (!f.to || day(iso) <= f.to);

export function buildReport(s: CdsState, id: string, stores: string[], f: ReportFilters): Report {
  const storeOk = (x: string) => stores.includes(x) && (!f.cdsStoreId || x === f.cdsStoreId);
  const orders = s.orders.filter((o) => storeOk(o.cdsStoreId) && inRange(o.confirmedAt, f) && (!f.distributorId || o.distributorId === f.distributorId) && (!f.retailerId || o.retailerId === f.retailerId));
  const C = (key: string, label: string, align?: 'end'): Column => ({ key, label, align });

  if (id.startsWith('trips-')) {
    const type = id.slice(6) as TripType;
    const trips = s.trips.filter((t) => t.type === type && inRange(t.plannedDate, f) && (!f.status || t.status === f.status))
      .filter((t) => (t.owner === 'SC' ? t.stops.some((x) => x.partyType !== 'CDS' || storeOk(x.partyId)) || type === 'DISTRIBUTOR_PICKUP' : storeOk(t.owner)));
    return {
      id, title: `${TRIP_TYPE[type].label}s (${TRIP_TYPE[type].direction})`,
      columns: [C('tripNo', 'Trip ID'), C('date', 'Planned date'), C('status', 'Status'), C('dp', 'Delivery person'), C('vehicle', 'Vehicle'), C('stops', 'Stops', 'end'), C('done', 'Stops done', 'end'), C('otps', 'OTP verified', 'end'), C('units', 'Units planned', 'end'), C('handed', 'Units handed over', 'end'), C('completed', 'Completed at')],
      rows: trips.map((t) => ({
        tripNo: t.tripNo, date: t.plannedDate, status: TRIP_STATUS[t.status].label, dp: t.deliveryPersonName, vehicle: t.vehicleRegNo, stops: t.stops.length,
        done: t.stops.filter((x) => x.status !== 'PENDING').length, otps: t.stops.filter((x) => x.verifiedAt).length,
        units: sum(t.stops.filter((x) => ['DISTRIBUTOR_PICKUP', 'CDS_ORDER_PICKUP'].includes(x.action)), (x) => sum(x.lines, (l) => l.plannedQty)) || sum(t.stops, (x) => sum(x.lines, (l) => l.plannedQty)),
        handed: sum(t.stops.filter((x) => ['CDS_HANDOVER', 'RETAILER_DELIVERY'].includes(x.action)), (x) => sum(x.lines, (l) => l.actualQty ?? 0)),
        completed: t.completedAt ? t.completedAt.slice(0, 16).replace('T', ' ') : '—',
      })),
    };
  }

  switch (id) {
    case 'distributor-pickups': {
      const rows = s.distributors.filter((d) => !f.distributorId || d.id === f.distributorId).map((d) => {
        const os = orders.filter((o) => o.distributorId === d.id);
        const trips = s.trips.filter((t) => t.type === 'DISTRIBUTOR_PICKUP' && t.stops.some((x) => x.partyId === d.id) && inRange(t.plannedDate, f));
        const stops = trips.flatMap((t) => t.stops.filter((x) => x.partyId === d.id));
        return {
          distributor: d.name, orders: os.length, awaiting: os.filter((o) => ['CONFIRMED', 'PICKUP_PLANNED'].includes(o.status)).length, trips: trips.length,
          planned: sum(stops, (x) => sum(x.lines, (l) => l.plannedQty)), picked: sum(stops, (x) => sum(x.lines, (l) => l.actualQty ?? 0)),
          short: sum(stops.filter((x) => x.status !== 'PENDING'), (x) => sum(x.lines, (l) => l.plannedQty - (l.actualQty ?? 0))), failed: stops.filter((x) => x.status === 'FAILED').length,
        };
      });
      return { id, title: 'Distributor-wise pickups', columns: [C('distributor', 'Distributor'), C('orders', 'Orders', 'end'), C('awaiting', 'Awaiting pickup', 'end'), C('trips', 'Pickup trips', 'end'), C('planned', 'Units planned', 'end'), C('picked', 'Units picked', 'end'), C('short', 'Short', 'end'), C('failed', 'Failed stops', 'end')], rows };
    }
    case 'cds-incoming': {
      const st: (keyof typeof ORDER_STATUS)[] = ['CONFIRMED', 'PICKUP_PLANNED', 'PICKED_UP', 'IN_TRANSIT_TO_CDS', 'READY_FOR_DELIVERY'];
      const rows = s.stores.filter((x) => storeOk(x.id)).map((x) => {
        const os = orders.filter((o) => o.cdsStoreId === x.id);
        return { store: x.name, total: os.length, ...Object.fromEntries(st.map((k) => [k, os.filter((o) => o.status === k).length])), value: r2(sum(os, (o) => o.orderValue)) };
      });
      return { id, title: 'CDS-wise incoming orders', columns: [C('store', 'CDS store'), C('total', 'Orders', 'end'), ...st.map((k) => C(k, ORDER_STATUS[k].label, 'end')), C('value', 'Order value ₹', 'end')], rows };
    }
    case 'pending-ops': {
      const rows = s.stores.filter((x) => storeOk(x.id)).map((x) => {
        const os = s.orders.filter((o) => o.cdsStoreId === x.id);
        return {
          store: x.name, toPlan: os.filter((o) => o.status === 'CONFIRMED').length, toPick: os.filter((o) => o.status === 'PICKUP_PLANNED').length,
          toDeliverCds: os.filter((o) => o.status === 'PICKED_UP' && !s.trips.some((t) => t.id === o.cdsTripId && ACTIVE_TRIP.includes(t.status))).length,
          inTransit: os.filter((o) => o.status === 'IN_TRANSIT_TO_CDS').length,
          readyRetail: os.filter((o) => o.status === 'READY_FOR_DELIVERY').length,
        };
      });
      return { id, title: 'Pending pickup & delivery operations', columns: [C('store', 'CDS store'), C('toPlan', 'Orders to plan', 'end'), C('toPick', 'Awaiting pickup', 'end'), C('toDeliverCds', 'Picked, no CDS trip', 'end'), C('inTransit', 'In transit to CDS', 'end'), C('readyRetail', 'Ready for retailer delivery', 'end')], rows };
    }
    case 'trip-completion': {
      const types: TripType[] = ['DISTRIBUTOR_PICKUP', 'CDS_DELIVERY'];
      const rows = types.map((ty) => {
        const ts = s.trips.filter((t) => t.type === ty && inRange(t.plannedDate, f));
        const fin = ts.filter((t) => ['COMPLETED', 'PARTIALLY_COMPLETED'].includes(t.status)).length;
        return {
          type: TRIP_TYPE[ty].label, total: ts.length, active: ts.filter((t) => ACTIVE_TRIP.includes(t.status)).length, completed: ts.filter((t) => t.status === 'COMPLETED').length,
          partial: ts.filter((t) => t.status === 'PARTIALLY_COMPLETED').length, cancelled: ts.filter((t) => t.status === 'CANCELLED').length,
          rate: ts.length ? `${Math.round((ts.filter((t) => t.status === 'COMPLETED').length / Math.max(1, fin)) * 100)}%` : '—',
        };
      });
      return { id, title: 'Trip completion', columns: [C('type', 'Trip type'), C('total', 'Trips', 'end'), C('active', 'Active', 'end'), C('completed', 'Completed', 'end'), C('partial', 'Partially completed', 'end'), C('cancelled', 'Cancelled', 'end'), C('rate', 'Fully completed (of finished)', 'end')], rows };
    }
    case 'performance': {
      // CDS User: one row per day for the store — orders received (handover OTP verified), delivery outcome of that
      // day's retailer trips, success rate, trips and planned km.
      const handovers = s.trips.filter((t) => t.type === 'CDS_DELIVERY' && t.status !== 'CANCELLED')
        .flatMap((t) => t.stops.filter((x) => x.action === 'CDS_HANDOVER' && storeOk(x.partyId) && x.verifiedAt));
      const rtrips = s.trips.filter((t) => t.type === 'RETAILER_DELIVERY' && t.status !== 'CANCELLED' && storeOk(t.owner));
      const known = [...handovers.map((x) => day(x.verifiedAt!)), ...rtrips.map((t) => t.plannedDate)].sort();
      const from = f.from || known[0];
      const to = f.to || known[known.length - 1];
      const days: string[] = [];
      if (from && to) {
        const d = new Date(`${from}T12:00:00`);
        while (days.length < 92) {
          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (iso > to) break;
          days.push(iso);
          d.setDate(d.getDate() + 1);
        }
      }
      const ordersAt = (stops: { lines: { orderId: string | null; actualQty: number | null }[] }[], got: boolean) =>
        new Set(stops.flatMap((x) => x.lines.filter((l) => !got || (l.actualQty ?? 0) > 0).map((l) => l.orderId))).size;
      const rows = days.map((d) => {
        const ts = rtrips.filter((t) => t.plannedDate === d);
        const stops = ts.flatMap((t) => t.stops.filter((x) => x.action === 'RETAILER_DELIVERY'));
        const delivered = ordersAt(stops.filter((x) => x.status === 'DONE' || x.status === 'PARTIAL'), true);
        const notDelivered = ordersAt(stops.filter((x) => x.status === 'FAILED'), false);
        return {
          date: d, received: ordersAt(handovers.filter((x) => day(x.verifiedAt!) === d), true), delivered, notDelivered,
          rate: delivered + notDelivered ? `${Math.round((delivered / (delivered + notDelivered)) * 100)}%` : '—',
          trips: ts.length, km: Math.round(sum(ts, (t) => t.distanceKm) * 10) / 10,
        };
      });
      const tot = { received: sum(rows, (r) => r.received), delivered: sum(rows, (r) => r.delivered), notDelivered: sum(rows, (r) => r.notDelivered), trips: sum(rows, (r) => r.trips), km: Math.round(sum(rows, (r) => r.km) * 10) / 10 };
      return {
        id, title: 'Performance Report',
        columns: [C('date', 'Date'), C('received', 'Orders received', 'end'), C('delivered', 'Orders delivered', 'end'), C('notDelivered', 'Orders not delivered', 'end'), C('rate', 'Delivery success rate', 'end'), C('trips', 'Trips', 'end'), C('km', 'Total km', 'end')],
        rows,
        totals: { ...tot, rate: tot.delivered + tot.notDelivered ? `${Math.round((tot.delivered / (tot.delivered + tot.notDelivered)) * 100)}%` : '—' },
      };
    }
    default:
      return { id, title: 'Unknown report', columns: [], rows: [] };
  }
}

/** KPI figures for the role's dashboard strip. */
export function summary(s: CdsState, role: CdsRole, stores: string[]) {
  const os = s.orders.filter((o) => stores.includes(o.cdsStoreId));
  const n = (st: string[]) => os.filter((o) => st.includes(o.status)).length;
  if (role === 'SERVICE_CENTRE') {
    const tr = (ty: TripType) => s.trips.filter((t) => t.type === ty && ACTIVE_TRIP.includes(t.status)).length;
    return [
      { key: 'confirmed', label: 'Orders to plan for pickup', value: n(['CONFIRMED']), tone: 'amber', to: '/cds/pickup-planning' },
      { key: 'picked', label: 'Picked up, awaiting CDS delivery', value: os.filter((o) => o.status === 'PICKED_UP' && !s.trips.some((t) => t.id === o.cdsTripId && ACTIVE_TRIP.includes(t.status))).length, tone: 'purple', to: '/cds/trips?tab=CDS_DELIVERY' },
      { key: 'transit', label: 'In transit to CDS', value: n(['IN_TRANSIT_TO_CDS']), tone: 'purple', to: '/cds/trips?tab=CDS_DELIVERY' },
      { key: 'pickupTrips', label: 'Active pickup trips', value: tr('DISTRIBUTOR_PICKUP'), tone: 'blue', to: '/cds/trips?tab=DISTRIBUTOR_PICKUP' },
      { key: 'cdsTrips', label: 'Active CDS delivery trips', value: tr('CDS_DELIVERY'), tone: 'blue', to: '/cds/trips?tab=CDS_DELIVERY' },
    ];
  }
  return [
    { key: 'incoming', label: 'Coming to the store', value: n(['PICKED_UP', 'IN_TRANSIT_TO_CDS']), tone: 'purple', to: '/cds/orders' },
    { key: 'ready', label: 'Ready for delivery', value: n(['READY_FOR_DELIVERY']), tone: 'teal', to: '/cds/delivery-planning' },
    { key: 'planned', label: 'Delivery planned', value: n(['DELIVERY_PLANNED']), tone: 'blue', to: '/cds/delivery-planning' },
    { key: 'out', label: 'Out for delivery', value: n(['OUT_FOR_DELIVERY']), tone: 'purple', to: '/cds/trips' },
    { key: 'delivered', label: 'Delivered', value: n(['DELIVERED', 'PARTIALLY_DELIVERED']), tone: 'green', to: '/cds/orders' },
  ];
}
