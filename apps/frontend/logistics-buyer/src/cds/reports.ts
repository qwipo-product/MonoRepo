// Operational reports and dashboard figures, computed from live CDS records. Pure (Node-testable).
import { ACTIVE_TRIP, COLLECTION_STATUS, ORDER_STATUS, RETURN_STATUS, TRIP_STATUS, TRIP_STATUS_GROUPS, TRIP_TYPE } from './status.ts';
import type { CdsRole, CdsState, TripType } from './types.ts';

export interface ReportFilters { from?: string; to?: string; cdsStoreId?: string; distributorId?: string; retailerId?: string; status?: string }
export interface Column { key: string; label: string; align?: 'end' }
export interface Report { id: string; title: string; columns: Column[]; rows: Record<string, string | number>[]; totals?: Record<string, number> }

export const REPORTS: Record<CdsRole, { id: string; title: string; filters: (keyof ReportFilters)[] }[]> = {
  SERVICE_CENTRE: [
    { id: 'distributor-pickups', title: 'Distributor-wise pickups', filters: ['from', 'to', 'distributorId'] },
    { id: 'cds-incoming', title: 'CDS-wise incoming orders', filters: ['from', 'to', 'cdsStoreId'] },
    { id: 'trips-DISTRIBUTOR_PICKUP', title: 'Distributor Pickup Trips (CDS Service Centre to Sellers)', filters: ['from', 'to', 'status'] },
    { id: 'trips-CDS_DELIVERY', title: 'CDS Delivery Trips (Sellers to CDS Stores)', filters: ['from', 'to', 'status'] },
    { id: 'trips-CDS_RETURN', title: 'CDS Return Trips (CDS Stores to Sellers)', filters: ['from', 'to', 'status'] },
    { id: 'pending-ops', title: 'Pending pickup & delivery operations', filters: ['cdsStoreId'] },
    { id: 'return-quantities', title: 'Return quantities', filters: ['from', 'to', 'cdsStoreId', 'distributorId'] },
    { id: 'trip-completion', title: 'Trip completion', filters: ['from', 'to'] },
  ],
  CDS_USER: [
    { id: 'grn', title: 'GRN report', filters: ['from', 'to', 'distributorId', 'status'] },
    { id: 'distributor-received', title: 'Distributor-wise received goods', filters: ['from', 'to', 'distributorId'] },
    { id: 'retailer-orders', title: 'Retailer-wise orders', filters: ['from', 'to', 'retailerId'] },
    { id: 'delivery-plans', title: 'Delivery planning', filters: ['from', 'to'] },
    { id: 'trips-RETAILER_DELIVERY', title: 'Retailer-wise trips', filters: ['from', 'to', 'status'] },
    { id: 'delivery-status', title: 'Delivered and pending orders', filters: ['from', 'to', 'retailerId', 'status'] },
    { id: 'returns', title: 'Retailer returns', filters: ['from', 'to', 'retailerId', 'status'] },
    { id: 'collections', title: 'Collections & payments', filters: ['from', 'to', 'status'] },
  ],
};

const sum = <T>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);
const r2 = (n: number) => Math.round(n * 100) / 100;
const day = (iso: string) => iso.slice(0, 10);
const inRange = (iso: string, f: ReportFilters) => (!f.from || day(iso) >= f.from) && (!f.to || day(iso) <= f.to);

export function buildReport(s: CdsState, id: string, stores: string[], f: ReportFilters): Report {
  const storeOk = (x: string) => stores.includes(x) && (!f.cdsStoreId || x === f.cdsStoreId);
  const dName = (x: string) => s.distributors.find((d) => d.id === x)?.name ?? x;
  const sName = (x: string) => s.stores.find((d) => d.id === x)?.name ?? x;
  const rName = (x: string | null) => (x ? s.retailers.find((d) => d.id === x)?.name ?? x : '—');
  const orders = s.orders.filter((o) => storeOk(o.cdsStoreId) && inRange(o.confirmedAt, f) && (!f.distributorId || o.distributorId === f.distributorId) && (!f.retailerId || o.retailerId === f.retailerId));
  const C = (key: string, label: string, align?: 'end'): Column => ({ key, label, align });

  if (id.startsWith('trips-')) {
    const type = id.slice(6) as TripType;
    const trips = s.trips.filter((t) => t.type === type && inRange(t.plannedDate, f) && (!f.status || (TRIP_STATUS_GROUPS[f.status]?.statuses ?? [f.status]).includes(t.status)))
      .filter((t) => (t.owner === 'SC' ? t.stops.some((x) => x.partyType !== 'CDS' || storeOk(x.partyId)) || type === 'DISTRIBUTOR_PICKUP' : storeOk(t.owner)));
    return {
      id, title: `${TRIP_TYPE[type].label}s (${TRIP_TYPE[type].direction})`,
      columns: [C('tripNo', 'Trip ID'), C('date', 'Planned date'), C('status', 'Status'), C('dp', 'Delivery person'), C('vehicle', 'Vehicle'), C('stops', 'Stops', 'end'), C('done', 'Stops done', 'end'), ...(type === 'RETAILER_DELIVERY' ? [C('otps', 'OTP verified', 'end')] : []), C('units', 'Units planned', 'end'), C('handed', 'Units handed over', 'end'), C('completed', 'Completed at')],
      rows: trips.map((t) => ({
        tripNo: t.tripNo, date: t.plannedDate, status: TRIP_STATUS[t.status].label, dp: t.deliveryPersonName, vehicle: t.vehicleRegNo, stops: t.stops.length,
        done: t.stops.filter((x) => x.status !== 'PENDING').length, otps: t.stops.filter((x) => x.verifiedAt).length,
        units: sum(t.stops.filter((x) => ['DISTRIBUTOR_PICKUP', 'CDS_ORDER_PICKUP', 'CDS_RETURN_PICKUP'].includes(x.action)), (x) => sum(x.lines, (l) => l.plannedQty)) || sum(t.stops, (x) => sum(x.lines, (l) => l.plannedQty)),
        handed: sum(t.stops.filter((x) => ['CDS_HANDOVER', 'RETAILER_DELIVERY', 'SELLER_RETURN_HANDOVER', 'RETURN_HANDOVER_CDS'].includes(x.action)), (x) => sum(x.lines, (l) => l.actualQty ?? 0)),
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
      const st: (keyof typeof ORDER_STATUS)[] = ['CONFIRMED', 'PICKUP_PLANNED', 'PICKED_UP', 'IN_TRANSIT_TO_CDS', 'RECEIVED_AT_CDS', 'READY_FOR_DELIVERY'];
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
          inTransit: os.filter((o) => o.status === 'IN_TRANSIT_TO_CDS').length, grnPending: s.grns.filter((g) => g.cdsStoreId === x.id && g.status === 'PENDING').length,
          readyRetail: os.filter((o) => o.status === 'READY_FOR_DELIVERY').length, returnsToPlan: s.returns.filter((r) => r.cdsStoreId === x.id && r.status === 'RECEIVED_AT_CDS' && !r.returnTripId).length,
        };
      });
      return { id, title: 'Pending pickup & delivery operations', columns: [C('store', 'CDS store'), C('toPlan', 'Orders to plan', 'end'), C('toPick', 'Awaiting pickup', 'end'), C('toDeliverCds', 'Picked, no CDS trip', 'end'), C('inTransit', 'In transit to CDS', 'end'), C('grnPending', 'GRNs pending', 'end'), C('readyRetail', 'Ready for retailer delivery', 'end'), C('returnsToPlan', 'Returns to plan', 'end')], rows };
    }
    case 'return-quantities': {
      const rets = s.returns.filter((r) => storeOk(r.cdsStoreId) && inRange(r.createdAt, f) && (!f.distributorId || r.distributorId === f.distributorId));
      const keys = Array.from(new Set(rets.map((r) => `${r.cdsStoreId}|${r.distributorId}`)));
      const rows = keys.map((k) => {
        const [c, d] = k.split('|');
        const rs = rets.filter((r) => r.cdsStoreId === c && r.distributorId === d);
        return {
          store: sName(c), distributor: dName(d), returns: rs.length, requested: sum(rs, (r) => sum(r.lines, (l) => l.qty)), picked: sum(rs, (r) => sum(r.lines, (l) => l.pickedQty ?? 0)),
          accepted: sum(rs, (r) => sum(r.lines, (l) => l.acceptedQty ?? 0)), rejected: sum(rs, (r) => sum(r.lines, (l) => l.rejectedQty ?? 0)), toSeller: sum(rs, (r) => sum(r.lines, (l) => l.handedToSellerQty ?? 0)),
          open: rs.filter((r) => !['COMPLETED', 'CANCELLED'].includes(r.status)).length,
        };
      });
      return { id, title: 'Return quantities', columns: [C('store', 'CDS store'), C('distributor', 'Distributor'), C('returns', 'Returns', 'end'), C('requested', 'Units requested', 'end'), C('picked', 'Picked from retailer', 'end'), C('accepted', 'Accepted at CDS', 'end'), C('rejected', 'Rejected', 'end'), C('toSeller', 'Delivered to seller', 'end'), C('open', 'Open', 'end')], rows };
    }
    case 'trip-completion': {
      const types: TripType[] = ['DISTRIBUTOR_PICKUP', 'CDS_DELIVERY', 'CDS_RETURN'];
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
    case 'grn': {
      const gs = s.grns.filter((g) => storeOk(g.cdsStoreId) && inRange(g.createdAt, f) && (!f.distributorId || g.distributorId === f.distributorId) && (!f.status || g.status === f.status));
      return {
        id, title: 'GRN report',
        columns: [C('grnNo', 'GRN'), C('date', 'Received'), C('distributor', 'Distributor'), C('trip', 'CDS trip'), C('orders', 'Orders', 'end'), C('dispatched', 'Dispatched', 'end'), C('received', 'Received', 'end'), C('accepted', 'Accepted', 'end'), C('damaged', 'Damaged', 'end'), C('short', 'Short', 'end'), C('excess', 'Excess', 'end'), C('status', 'Status')],
        rows: gs.map((g) => ({
          grnNo: g.grnNo, date: day(g.createdAt), distributor: dName(g.distributorId), trip: s.trips.find((t) => t.id === g.cdsTripId)?.tripNo ?? '', orders: g.orderIds.length,
          dispatched: sum(g.lines, (l) => l.dispatchedQty), received: sum(g.lines, (l) => l.receivedQty), accepted: sum(g.lines, (l) => l.acceptedQty ?? 0), damaged: sum(g.lines, (l) => l.damagedQty ?? 0),
          short: sum(g.lines, (l) => l.shortQty), excess: sum(g.lines, (l) => l.excessQty), status: g.status === 'PENDING' ? 'Pending Verification' : 'GRN Generated',
        })),
      };
    }
    case 'distributor-received': {
      const gs = s.grns.filter((g) => storeOk(g.cdsStoreId) && inRange(g.createdAt, f) && (!f.distributorId || g.distributorId === f.distributorId));
      const rows = Array.from(new Set(gs.map((g) => g.distributorId))).map((d) => {
        const ls = gs.filter((g) => g.distributorId === d).flatMap((g) => g.lines);
        return { distributor: dName(d), grns: gs.filter((g) => g.distributorId === d).length, received: sum(ls, (l) => l.receivedQty), accepted: sum(ls, (l) => l.acceptedQty ?? 0), damaged: sum(ls, (l) => l.damagedQty ?? 0), short: sum(ls, (l) => l.shortQty), excess: sum(ls, (l) => l.excessQty) };
      });
      return { id, title: 'Distributor-wise received goods', columns: [C('distributor', 'Distributor'), C('grns', 'GRNs', 'end'), C('received', 'Received', 'end'), C('accepted', 'Accepted', 'end'), C('damaged', 'Damaged', 'end'), C('short', 'Short', 'end'), C('excess', 'Excess', 'end')], rows };
    }
    case 'retailer-orders': {
      const rows = Array.from(new Set(orders.map((o) => o.retailerId))).map((rid) => {
        const os = orders.filter((o) => o.retailerId === rid);
        return {
          retailer: rName(rid), orders: os.length, value: r2(sum(os, (o) => o.orderValue)), delivered: os.filter((o) => ['DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED'].includes(o.status)).length,
          pending: os.filter((o) => !['DELIVERED', 'PARTIALLY_DELIVERED', 'RETURNED', 'CANCELLED'].includes(o.status)).length,
          deliveredValue: r2(sum(os, (o) => sum(o.lines, (l) => l.deliveredQty * l.unitPrice))),
        };
      }).sort((a, b) => b.value - a.value);
      return { id, title: 'Retailer-wise orders', columns: [C('retailer', 'Retailer'), C('orders', 'Orders', 'end'), C('value', 'Order value ₹', 'end'), C('delivered', 'Delivered', 'end'), C('pending', 'Pending', 'end'), C('deliveredValue', 'Delivered value ₹', 'end')], rows };
    }
    case 'delivery-plans': {
      const ps = s.plans.filter((p) => p.kind === 'RETAILER_DELIVERY' && storeOk(p.owner) && inRange(p.plannedDate, f));
      return {
        id, title: 'Delivery planning',
        columns: [C('planNo', 'Plan'), C('date', 'Delivery date'), C('created', 'Planned on'), C('orders', 'Orders', 'end'), C('returns', 'Returns to collect', 'end'), C('trip', 'Trip'), C('status', 'Trip status')],
        rows: ps.map((p) => {
          const t = s.trips.find((x) => x.id === p.tripIds[0]);
          return { planNo: p.planNo, date: p.plannedDate, created: day(p.createdAt), orders: p.orderIds.length, returns: p.returnIds.length, trip: t?.tripNo ?? '', status: t ? TRIP_STATUS[t.status].label : '' };
        }),
      };
    }
    case 'delivery-status': {
      const os = orders.filter((o) => !f.status || o.status === f.status);
      return {
        id, title: 'Delivered and pending orders',
        columns: [C('orderNo', 'Order'), C('date', 'Confirmed'), C('retailer', 'Retailer'), C('distributor', 'Distributor'), C('status', 'Status'), C('ordered', 'Ordered', 'end'), C('delivered', 'Delivered', 'end'), C('value', 'Value ₹', 'end')],
        rows: os.map((o) => ({ orderNo: o.orderNo, date: day(o.confirmedAt), retailer: rName(o.retailerId), distributor: dName(o.distributorId), status: ORDER_STATUS[o.status].label, ordered: sum(o.lines, (l) => l.qty), delivered: sum(o.lines, (l) => l.deliveredQty), value: o.orderValue })),
      };
    }
    case 'returns': {
      const rs = s.returns.filter((r) => storeOk(r.cdsStoreId) && inRange(r.createdAt, f) && (!f.retailerId || r.retailerId === f.retailerId) && (!f.status || r.status === f.status));
      return {
        id, title: 'Retailer returns',
        columns: [C('returnNo', 'Return'), C('date', 'Initiated'), C('order', 'Order'), C('retailer', 'Retailer'), C('reason', 'Reason'), C('qty', 'Units', 'end'), C('picked', 'Picked', 'end'), C('accepted', 'Accepted', 'end'), C('rejected', 'Rejected', 'end'), C('status', 'Status')],
        rows: rs.map((r) => ({ returnNo: r.returnNo, date: day(r.createdAt), order: r.orderNo, retailer: r.source === 'GRN' ? 'Damaged at GRN' : rName(r.retailerId), reason: r.lines.map((l) => l.reason).join(', '), qty: sum(r.lines, (l) => l.qty), picked: sum(r.lines, (l) => l.pickedQty ?? 0), accepted: sum(r.lines, (l) => l.acceptedQty ?? 0), rejected: sum(r.lines, (l) => l.rejectedQty ?? 0), status: RETURN_STATUS[r.status].label })),
      };
    }
    case 'collections': {
      const cs = s.collections.filter((c) => storeOk(c.cdsStoreId) && inRange(c.collectedAt, f) && (!f.status || c.status === f.status));
      return {
        id, title: 'Collections & payments',
        columns: [C('collectionNo', 'Collection'), C('date', 'Collected'), C('order', 'Order'), C('retailer', 'Retailer'), C('dp', 'Delivery person'), C('mode', 'Mode'), C('expected', 'Due ₹', 'end'), C('amount', 'Collected ₹', 'end'), C('received', 'Received by CDS ₹', 'end'), C('status', 'Status'), C('ref', 'Handover / settlement ref')],
        rows: cs.map((c) => ({ collectionNo: c.collectionNo, date: day(c.collectedAt), order: c.orderNo, retailer: rName(c.retailerId), dp: c.deliveryPersonName, mode: c.mode, expected: c.expectedAmount, amount: c.amount, received: c.cdsReceivedAmount ?? 0, status: COLLECTION_STATUS[c.status].label, ref: [c.qwipoHandoverRef, c.settlementRef].filter(Boolean).join(' / ') || '—' })),
        totals: { expected: r2(sum(cs, (c) => c.expectedAmount)), amount: r2(sum(cs, (c) => c.amount)), received: r2(sum(cs, (c) => c.cdsReceivedAmount ?? 0)) },
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
      { key: 'returnTrips', label: 'Active CDS return trips', value: tr('CDS_RETURN'), tone: 'blue', to: '/cds/trips?tab=CDS_RETURN' },
      { key: 'returns', label: 'Returns to plan', value: s.returns.filter((r) => stores.includes(r.cdsStoreId) && r.status === 'RECEIVED_AT_CDS' && !r.returnTripId).length, tone: 'red', to: '/cds/return-planning' },
    ];
  }
  const st = stores[0];
  return [
    { key: 'grn', label: 'GRNs to verify', value: s.grns.filter((g) => g.cdsStoreId === st && g.status === 'PENDING').length, tone: 'amber', to: '/cds/grn' },
    { key: 'ready', label: 'Ready for delivery', value: n(['READY_FOR_DELIVERY']), tone: 'teal', to: '/cds/delivery-planning' },
    { key: 'planned', label: 'Delivery planned', value: n(['DELIVERY_PLANNED']), tone: 'blue', to: '/cds/trips' },
    { key: 'out', label: 'Out for delivery', value: n(['OUT_FOR_DELIVERY']), tone: 'purple', to: '/cds/trips' },
    { key: 'delivered', label: 'Delivered', value: n(['DELIVERED', 'PARTIALLY_DELIVERED']), tone: 'green', to: '/cds/orders' },
    { key: 'returns', label: 'Returns open', value: s.returns.filter((r) => r.cdsStoreId === st && ['RETURN_INITIATED', 'PICKED_UP_FROM_RETAILER'].includes(r.status)).length, tone: 'red', to: '/cds/returns' },
    { key: 'cash', label: 'Cash with delivery persons ₹', value: r2(sum(s.collections.filter((c) => c.cdsStoreId === st && c.status === 'WITH_DELIVERY_PERSON'), (c) => c.amount)), tone: 'amber', to: '/cds/collections' },
  ];
}
