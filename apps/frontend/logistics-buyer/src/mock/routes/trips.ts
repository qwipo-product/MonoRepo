// Trips mock endpoints (spec 04 §6/§8, spec 05 §4): everything under /logistics-orders/*, plus
// /fulfillment/req_for_cancel, /fulfillment/req_for_track and /route_planning/trip-route-details/bulk.
//
// Every money / weight / summary field is computed from db().orders and the trip's stops (DbStop):
//   - totalSaleValue      = Σ amount of every order on the trip (incl. cancelled stops, like the live sample)
//   - totalDeliveryValue  = delivered value (Order Delivered stops in full + delivered part of Partial Delivered stops)
//   - totalPartialValue   = delivered part of Partial Delivered stops
//   - totalReturnValue    = returned stops in full + returned part of Partial Delivered stops
//   - orderSummary        = counts of Order Delivered / Partial Delivered / Returned stops
//   - volumetricWeight    = Σ order volumetricWeight
// Returns are derived from the *stop* status (not the order's current status) so a returned order that was later
// moved back to RFP / re-planned still shows on its old trip.
//
// Trip simulator: every 45 s each In Progress trip that is already on the road (pickup collected) moves one stop
// Out-for-delivery → At-delivery → Order-delivered; when every stop is done the trip becomes Completed. Each step
// pushes an SSE frame on ("trip", tripNumber) so an open Trip Details page refreshes. Control from the console:
// window.__lbnpTrips.simulator.pause() / resume() / tick(), window.__lbnpTrips.setDarkStore(true|false).
import { db, nowIso, paginate, persist } from '../db';
import { cdsPointForLocality, ensureCdsTrips, type CdsPoint } from '../extensions/cds';
import { makePdf, makeXlsx } from '../fileFactory';
import { MockError, RawResponse, route } from '../server';
import { publishSse } from '../sseHub';
import type { DbCustomer, DbOrder, DbOrderItem, DbStop, DbTrip } from '../types';

const BUYER = 'logistics-buyer-svc';

// ---------------------------------------------------------------- small helpers
const round2 = (n: number) => Math.round(n * 100) / 100;
const FINAL_STOP = new Set(['Order-delivered', 'RTO', 'RTO-Initiated', 'RTO-Delivered', 'RTO-Disposed', 'Cancelled']);
const RETURNED_STATUSES = new Set(['RTO', 'RTO-Initiated', 'RTO-Delivered', 'RTO-Disposed']);

interface TripsDemo {
  noTrackingTrips: string[];
  noRouteDetailsTrips: string[];
  darkStore: boolean;
}
function demo(): TripsDemo {
  const d = db();
  if (!d.ext.tripsDemo) d.ext.tripsDemo = { noTrackingTrips: [], noRouteDetailsTrips: [], darkStore: false };
  return d.ext.tripsDemo as TripsDemo;
}

/** IST calendar date (YYYY-MM-DD) of an ISO timestamp. */
function istYmd(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}
function istStamp(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

function findTrip(id: string | undefined | null): DbTrip | undefined {
  if (!id) return undefined;
  const key = String(id).trim();
  return db().trips.find((t) => t.logisticsOrderId === key || t.orderId === key);
}
function requireTrip(id: string | undefined | null): DbTrip {
  const t = findTrip(id);
  if (!t) throw new MockError(404, 'Logistics order not found');
  return t;
}

function orderIndex(): Map<string, DbOrder> {
  return new Map(db().orders.map((o) => [o.orderId, o]));
}
function stopOrders(stop: DbStop, idx: Map<string, DbOrder>): DbOrder[] {
  return (stop.orderIds || []).map((id) => idx.get(id)).filter((o): o is DbOrder => !!o);
}
function tripOrders(t: DbTrip, idx: Map<string, DbOrder>): DbOrder[] {
  const ids = new Set<string>([...(t.orderIds || []), ...t.stops.flatMap((s) => s.orderIds || [])]);
  return Array.from(ids).map((id) => idx.get(id)).filter((o): o is DbOrder => !!o);
}
const deliveryStops = (t: DbTrip) => t.stops.filter((s) => s.deliveryType === 'Delivery');

const isReturnedStop = (s: DbStop) => RETURNED_STATUSES.has(s.status) || s.displayStatus === 'Returned';
const isPartialStop = (s: DbStop) => s.displayStatus === 'Partial Delivered' || s.displayStatus === 'Partial Return';

/** Returned quantity of an item on a given stop (full for returned stops, item.returnedQuantity for partial stops). */
function returnedQtyOnStop(s: DbStop, it: DbOrderItem): number {
  if (isReturnedStop(s)) return it.quantity;
  if (isPartialStop(s)) return Math.min(it.quantity, Number(it.returnedQuantity) || 0);
  return 0;
}

function stopMoney(s: DbStop, os: DbOrder[]) {
  const sale = os.reduce((a, o) => a + (Number(o.amount) || 0), 0);
  let delivered = 0;
  let partial = 0;
  let returned = 0;
  if (isReturnedStop(s)) returned = sale;
  else if (isPartialStop(s)) {
    returned = os.reduce((a, o) => a + o.items.reduce((b, it) => b + returnedQtyOnStop(s, it) * it.sellingPrice, 0), 0);
    partial = sale - returned;
    delivered = partial;
  } else if (s.status === 'Order-delivered') delivered = sale;
  return { sale, delivered, partial, returned };
}

function customerOf(s: DbStop, os: DbOrder[]): DbCustomer | undefined {
  const cid = s.customerId || os[0]?.customerId;
  return cid ? db().customers.find((c) => c.id === cid) : undefined;
}

function gpsOf(s: DbStop): [number, number] | null {
  const [a, b] = String(s.gps || '').split(',').map((x) => Number(x));
  return isFinite(a) && isFinite(b) && (a !== 0 || b !== 0) ? [a, b] : null;
}

/** Small deterministic offset (≈ ±80 m) so "live" delivery GPS differs a little from the planned point. */
function jitter(seed: string, k: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  h = Math.imul(h ^ k, 16777619);
  return (((h >>> 0) % 1600) - 800) / 1000000;
}

// ---------------------------------------------------------------- API mapping
function toFulfillment(s: DbStop) {
  const isBatch = s.deliveryType === 'Batch';
  return {
    deliveryContact: isBatch ? null : { name: s.contact?.name ?? '', phone: s.contact?.phone ?? '', email: s.contact?.email ?? 'info@example.com' },
    deliveryLocation: {
      gps: s.gps,
      address: { ...s.address },
      contact: { name: s.contact?.name ?? '', phone: s.contact?.phone ?? '' },
    },
    deliveryOtp: s.deliveryOtp,
    deliveryType: s.deliveryType,
    fulfillmentId: s.fulfillmentId,
    id: s.id,
    pickupCompletionTime: isBatch && s.status === 'Order-picked-up' ? s.stateTimestamp : null,
    pickupOtp: s.pickupOtp,
    rtoOtp: s.rtoOtp,
    sequenceOrder: s.sequenceOrder,
    stateTimestamp: s.stateTimestamp,
    status: s.status,
    displayStatus: s.displayStatus,
  };
}

function toApiTrip(t: DbTrip, idx: Map<string, DbOrder>) {
  const orders = tripOrders(t, idx);
  const ds = deliveryStops(t);
  let sale = 0;
  let delivered = 0;
  let partial = 0;
  let returned = 0;
  const covered = new Set<string>();
  ds.forEach((s) => {
    const os = stopOrders(s, idx);
    os.forEach((o) => covered.add(o.orderId));
    const m = stopMoney(s, os);
    sale += m.sale;
    delivered += m.delivered;
    partial += m.partial;
    returned += m.returned;
  });
  // orders attached to the trip but not to a stop still count towards the sale value
  orders.filter((o) => !covered.has(o.orderId)).forEach((o) => (sale += Number(o.amount) || 0));
  const orderSummary = {
    delivered: ds.filter((s) => s.displayStatus === 'Order Delivered').length,
    partialDelivered: ds.filter((s) => isPartialStop(s)).length,
    returned: ds.filter((s) => isReturnedStop(s)).length,
  };
  const volumetricWeight = round2(orders.reduce((a, o) => a + (Number(o.volumetricWeight) || 0), 0));
  return {
    logisticsOrderId: t.logisticsOrderId,
    orderId: t.orderId,
    providerId: t.providerId,
    transactionId: t.transactionId,
    providerName: t.providerName,
    categoryId: t.categoryId,
    status: t.status,
    totalStopCount: String(ds.length),
    // Live data sends null; completed trips report their collected (delivered) value so "Net Sale Collection" varies.
    totalOrderValue: t.status === 3 ? round2(delivered) : null,
    vehicleRegNumber: t.vehicleRegNumber,
    vehicleType: t.vehicleType,
    vehicleInfo: t.vehicleId ? { vehicleId: t.vehicleId } : null,
    agentId: t.agentId,
    agentName: t.agentName,
    agentMobileNumber: t.agentMobileNumber,
    helperName: t.helperName,
    helperMobileNumber: t.helperMobileNumber,
    startTime: t.startTime,
    endTime: t.endTime,
    createdAt: t.createdAt,
    deliveryPrice: t.deliveryPrice,
    rtoPrice: t.rtoPrice,
    pickupSlotStart: t.pickupSlotStart,
    pickupSlotEnd: t.pickupSlotEnd,
    deliveryTatDuration: t.deliveryTatDuration,
    estimatedTimeToDelivery: t.estimatedTimeToDelivery,
    totalDistance: t.totalDistance,
    volumetricWeight: volumetricWeight.toFixed(2),
    vehicleVolumetricCapacityKg: t.vehicleVolumetricCapacityKg,
    maxStopCount: t.maxStopCount,
    fulfillments: t.stops.map(toFulfillment),
    totalSaleValue: round2(sale),
    totalReturnValue: round2(returned),
    totalPartialValue: round2(partial),
    totalDeliveryValue: round2(delivered),
    suggestedVehicleRegNumber: t.suggestedVehicleRegNumber,
    suggestedVehicleCapacityKg: t.suggestedVehicleCapacityKg,
    orderSummary,
    channel: t.channel ?? null,
  };
}

/** isCancellable (spec 04 §5) — enforced server-side too. */
function isCancellable(t: DbTrip): boolean {
  if (t.status !== 1 && t.status !== 2) return false;
  const batch = t.stops.find((s) => s.deliveryType === 'Batch');
  if (!batch) return true;
  return !batch.status || ['Pending', 'Searching-for-Agent', 'Agent-assigned', 'At-pickup'].includes(batch.status);
}

function publishTrip(t: DbTrip, extra: Record<string, unknown> = {}) {
  publishSse('trip', t.orderId, {
    messageType: 'TRIP_UPDATED',
    message: JSON.stringify({ logisticsOrderId: t.logisticsOrderId, orderId: t.orderId, tripStatus: t.status, updatedAt: nowIso(), ...extra }),
  });
}

/** True when at least one item on the trip came back (full return or the returned part of a partial delivery). */
function tripHasReturns(t: DbTrip, idx: Map<string, DbOrder>): boolean {
  return deliveryStops(t).some((s) => stopOrders(s, idx).some((o) => o.items.some((it) => returnedQtyOnStop(s, it) > 0)));
}

/** CDS trips appear only when the caller asks for channel "cds" (CDS tab); every other list is 3PL trips only. */
const matchesChannel = (t: DbTrip, channel: unknown) => (channel === 'cds' ? t.channel === 'cds' : t.channel !== 'cds');

/** Adds the CDS trips to a mock DB that was seeded before they existed (once; see extensions/cds.ts). */
function ensureCds() {
  if (ensureCdsTrips(db())) persist();
}

// ---------------------------------------------------------------- list / details
route('POST', BUYER, '/logistics-orders/get_by_filters', (req) => {
  ensureCds();
  const b = req.body || {};
  const idx = orderIndex();
  // The channel split applies to the lists only. A lookup of one trip (Trip Details, Order Details) finds it on
  // either channel.
  let list = b.logisticsOrderId ? db().trips.slice() : db().trips.filter((t) => matchesChannel(t, b.channel));
  // Credit Notes (CDS tab): only trips where a retailer returned goods.
  if (b.withReturns) list = list.filter((t) => tripHasReturns(t, idx));
  if (b.buyerId) list = list.filter((t) => t.buyerId === b.buyerId);
  if (b.logisticsOrderId) list = list.filter((t) => t.logisticsOrderId === b.logisticsOrderId || t.orderId === b.logisticsOrderId);
  if (b.pickupDate) list = list.filter((t) => istYmd(t.pickupSlotStart) === String(b.pickupDate));
  if (Array.isArray(b.statuses) && b.statuses.length) {
    const st = b.statuses.map(Number);
    list = list.filter((t) => st.includes(Number(t.status)));
  }
  if (Array.isArray(b.providerNames) && b.providerNames.length) list = list.filter((t) => b.providerNames.includes(t.providerName));
  list.sort((a, c) => String(c.createdAt).localeCompare(String(a.createdAt)));
  // Stats honour the filters (spec 04 §3.2 recommendation) so the empty-page recovery can't loop.
  const stats = {
    totalLogisticOrders: list.length,
    inTransit: list.filter((t) => t.status === 2).length,
    delivered: list.filter((t) => t.status === 3).length,
    planned: list.filter((t) => t.status === 1).length,
  };
  const p = paginate(list, b.pageNumber ?? 1, b.pageSize ?? 10);
  return {
    orders: p.rows.map((t) => toApiTrip(t, idx)),
    stats,
    pagination: { totalCount: p.totalCount, pageSize: p.pageSize, pageNumber: p.pageNumber, totalPages: p.totalPages },
  };
});

route('GET', BUYER, '/logistics-orders/provider-names/:buyerId', (req) => {
  ensureCds();
  const names: string[] = [];
  db().trips.filter((t) => t.buyerId === req.params.buyerId && matchesChannel(t, req.query?.channel)).forEach((t) => {
    if (t.providerName && !names.includes(t.providerName)) names.push(t.providerName);
  });
  return names;
});

route('GET', BUYER, '/logistics-orders/products/:id', (req) => {
  const t = requireTrip(req.params.id);
  const d = db();
  const idx = orderIndex();
  const tripsOfOrder = (o: DbOrder) => {
    const ids = new Set<string>([...(o.tripHistory || [])]);
    d.trips.forEach((x) => {
      if (x.orderIds?.includes(o.orderId) || x.stops.some((s) => s.orderIds?.includes(o.orderId))) ids.add(x.logisticsOrderId);
    });
    return Array.from(ids)
      .map((id) => d.trips.find((x) => x.logisticsOrderId === id))
      .filter((x): x is DbTrip => !!x)
      .map((x) => ({ logisticsOrderId: x.logisticsOrderId, createdAt: x.createdAt }));
  };
  const logisticOrderSummary = deliveryStops(t).map((s) => {
    const os = stopOrders(s, idx);
    const first = os[0];
    const reasonOrder = os.find((o) => o.rtoReasonId != null);
    const returnedStop = isReturnedStop(s);
    return {
      customerDetails: {
        logisticsOrderId: t.logisticsOrderId,
        sequenceOrder: s.sequenceOrder,
        deliveryLocation: { address: { ...s.address }, gps: s.gps, id: '' },
        deliveryContact: { phone: s.contact?.phone ?? '', email: s.contact?.email ?? 'info@example.com', name: '' },
        status: s.status,
        displayStatus: s.displayStatus,
        customerMobileNumber: s.contact?.phone ?? first?.customerMobileNumber ?? '',
        totalOrderIds: os.map((o) => o.orderId),
        totalOrderCount: os.length,
        totalOrderAmount: round2(os.reduce((a, o) => a + (Number(o.amount) || 0), 0)),
        stateTimestamp: s.stateTimestamp,
        pickupOtp: s.pickupOtp,
        deliveryOtp: s.deliveryOtp,
        rtoOtp: s.rtoOtp,
        deliveryType: s.deliveryType,
        buyerOrderStatus: first ? String(first.orderStatusId) : null,
        orderLogisticsMap: os.map((o) => ({ orderId: o.orderId, logisticsOrders: tripsOfOrder(o) })),
        ...(returnedStop && reasonOrder ? { rtoReasonId: reasonOrder.rtoReasonId, returnReason: reasonOrder.returnReason } : {}),
        // CDS trips: the CDS point where the service center drops this retailer's goods (CDS Wise Orders tab).
        ...(t.channel === 'cds' ? { cdsPoint: cdsPointForLocality(customerOf(s, os)?.locality) } : {}),
      },
      items: os.flatMap((o) =>
        o.items.map((it) => {
          const upc = Number(it.upc) || 0;
          return {
            orderId: o.orderId, itemId: it.itemId, itemName: it.itemName, weightUnit: it.uom, upc: it.upc != null ? String(it.upc) : null,
            cases: upc > 0 ? Math.floor(it.quantity / upc) : 0, pieces: upc > 0 ? it.quantity % upc : it.quantity,
            quantity: it.quantity, mrp: it.mrp, sellingPrice: it.sellingPrice, status: s.status, totalAmount: it.totalAmount,
            gstPercentage: it.gstPercentage, cessPercentage: null,
          };
        }),
      ),
    };
  });
  const returnProducts: any[] = [];
  deliveryStops(t).forEach((s) => {
    stopOrders(s, idx).forEach((o) => {
      o.items.forEach((it) => {
        const q = returnedQtyOnStop(s, it);
        if (q <= 0) return;
        returnProducts.push({
          orderId: o.orderId, returnedItemId: it.itemId, returnedItemName: it.itemName, returnedQuantity: String(q),
          returnedTotalAmount: String(isReturnedStop(s) ? it.totalAmount : round2(q * it.sellingPrice)), orderedQuantity: String(it.quantity),
          orderedWeightUnit: it.uom, mrp: it.mrp, upc: it.upc != null ? String(it.upc) : null,
        });
      });
    });
  });
  return { logisticOrderSummary, returnProducts };
});

// ---------------------------------------------------------------- resources
const sameDayActive = (t: DbTrip, other: DbTrip) =>
  other.logisticsOrderId !== t.logisticsOrderId && (other.status === 1 || other.status === 2) && istYmd(other.pickupSlotStart) === istYmd(t.pickupSlotStart);

function resourceTrip(req: { query: Record<string, string> }) {
  return requireTrip(req.query.logisticsOrderId);
}

route('GET', BUYER, '/logistics-orders/available-drivers', (req) => {
  resourceTrip(req);
  const p = paginate(db().drivers, Number(req.query.pageNumber) || 1, Number(req.query.pageSize) || 1000);
  return { drivers: p.rows.map((x) => ({ id: x.id, name: x.name, phone: x.phone })), totalCount: p.totalCount };
});
route('GET', BUYER, '/logistics-orders/available-helpers', (req) => {
  resourceTrip(req);
  const p = paginate(db().helpers, Number(req.query.pageNumber) || 1, Number(req.query.pageSize) || 1000);
  return { helpers: p.rows.map((x) => ({ id: x.id, name: x.name, phone: x.phone })), totalCount: p.totalCount };
});
route('GET', BUYER, '/logistics-orders/available-vehicles', (req) => {
  resourceTrip(req);
  const p = paginate(db().vehicles.filter((v) => v.status === 'active'), Number(req.query.pageNumber) || 1, Number(req.query.pageSize) || 1000);
  return { vehicles: p.rows.map((v) => ({ ...v })), totalCount: p.totalCount };
});

const fail = (message: string) => new RawResponse({ success: false, error: { code: 'BAD_REQUEST', message } });

function assignDriverTo(t: DbTrip, agentId: string, agentName?: string, agentMobileNumber?: string): RawResponse | null {
  const driver = db().drivers.find((x) => x.id === agentId);
  if (!driver) throw new MockError(404, 'Driver not found');
  if (db().trips.some((o) => sameDayActive(t, o) && o.agentId === driver.id)) return fail('Driver already assigned to another active trip');
  t.agentId = driver.id;
  t.agentName = agentName || driver.name;
  t.agentMobileNumber = agentMobileNumber || driver.phone;
  t.stops.forEach((s) => {
    if (s.deliveryType === 'Delivery' && s.status === 'Pending') {
      s.status = 'Agent-assigned';
      s.displayStatus = 'Agent Assigned';
    }
  });
  return null;
}
function assignVehicleTo(t: DbTrip, vehicleId: string, reg?: string, cap?: string | number): RawResponse | null {
  const v = db().vehicles.find((x) => x.id === vehicleId);
  if (!v) throw new MockError(404, 'Vehicle not found');
  if (v.status !== 'active') return fail('Vehicle is not active');
  if (db().trips.some((o) => sameDayActive(t, o) && o.vehicleId === v.id)) return fail('Vehicle already assigned to another active trip');
  t.vehicleId = v.id;
  t.vehicleRegNumber = reg || v.registrationNumber;
  t.vehicleType = v.vehicleType;
  t.vehicleVolumetricCapacityKg = String(cap || v.volumetricCapacityKg || v.weightCapacityKg);
  return null;
}
function requirePlanned(t: DbTrip): RawResponse | null {
  return t.status === 1 ? null : fail('Resources can only be updated for trips in Planned state');
}

route('PUT', BUYER, '/logistics-orders/assign-helper', (req) => {
  const b = req.body || {};
  const t = requireTrip(b.logisticsOrderId);
  const notPlanned = requirePlanned(t);
  if (notPlanned) return notPlanned;
  const helper = db().helpers.find((h) => h.id === b.helperId);
  if (!helper) throw new MockError(404, 'Helper not found');
  if (db().trips.some((o) => sameDayActive(t, o) && o.helperId === helper.id)) return fail('Helper already assigned to another active trip');
  t.helperId = helper.id;
  t.helperName = b.helperName || helper.name;
  t.helperMobileNumber = b.helperMobileNumber || helper.phone;
  persist();
  publishTrip(t, { event: 'HELPER_ASSIGNED' });
  return { logisticsOrderId: t.orderId, helperId: helper.id, helperName: t.helperName, helperMobileNumber: t.helperMobileNumber };
});

route('PUT', BUYER, '/logistics-orders/assign-driver', (req) => {
  const b = req.body || {};
  const t = requireTrip(b.logisticsOrderId);
  const r = requirePlanned(t) || assignDriverTo(t, b.agentId, b.agentName, b.agentMobileNumber);
  if (r) return r;
  persist();
  publishTrip(t, { event: 'DRIVER_ASSIGNED' });
  return { logisticsOrderId: t.orderId, agentId: t.agentId, agentName: t.agentName, agentMobileNumber: t.agentMobileNumber };
});

route('PUT', BUYER, '/logistics-orders/assign-vehicle', (req) => {
  const b = req.body || {};
  const t = requireTrip(b.logisticsOrderId);
  const r = requirePlanned(t) || assignVehicleTo(t, b.vehicleId, b.vehicleRegNumber, b.vehicleVolumetricCapacityKg);
  if (r) return r;
  persist();
  publishTrip(t, { event: 'VEHICLE_ASSIGNED' });
  return { logisticsOrderId: t.orderId, vehicleId: t.vehicleId, vehicleRegNumber: t.vehicleRegNumber };
});

route('PUT', BUYER, '/logistics-orders/assign-resource', (req) => {
  const b = req.body || {};
  const t = requireTrip(b.logisticsOrderId);
  const notPlanned = requirePlanned(t);
  if (notPlanned) return notPlanned;
  if (!b.vehicleId || !b.agentId) throw new MockError(400, 'vehicleId and agentId are required');
  // validate both before mutating anything
  const v = db().vehicles.find((x) => x.id === b.vehicleId);
  if (!v) throw new MockError(404, 'Vehicle not found');
  const drv = db().drivers.find((x) => x.id === b.agentId);
  if (!drv) throw new MockError(404, 'Driver not found');
  if (db().trips.some((o) => sameDayActive(t, o) && o.vehicleId === v.id)) return fail('Vehicle already assigned to another active trip');
  if (db().trips.some((o) => sameDayActive(t, o) && o.agentId === drv.id)) return fail('Driver already assigned to another active trip');
  const r = assignVehicleTo(t, v.id, b.vehicleRegNumber, b.vehicleVolumetricCapacityKg) || assignDriverTo(t, drv.id, b.agentName, b.agentMobileNumber);
  if (r) return r;
  persist();
  publishTrip(t, { event: 'RESOURCE_ASSIGNED' });
  return {
    logisticsOrderId: t.orderId, vehicleId: t.vehicleId, vehicleRegNumber: t.vehicleRegNumber, vehicleVolumetricCapacityKg: t.vehicleVolumetricCapacityKg,
    agentId: t.agentId, agentName: t.agentName, agentMobileNumber: t.agentMobileNumber,
  };
});

// ---------------------------------------------------------------- fulfillment
route('POST', BUYER, '/fulfillment/req_for_cancel', (req) => {
  const b = req.body || {};
  const t = requireTrip(b.orderId);
  if (b.transactionId && t.transactionId !== b.transactionId) throw new MockError(400, 'Transaction id does not match the logistics order');
  if (t.status === 4) return fail('Trip is already cancelled');
  if (!isCancellable(t)) return fail('Trip cannot be cancelled once the pickup has been collected');
  const now = nowIso();
  const idx = orderIndex();
  t.status = 4;
  t.cancelReason = `ONDC cancellation reason ${b.reason ?? 152}`;
  t.stops.forEach((s) => {
    s.status = 'Cancelled';
    s.displayStatus = 'Cancelled';
    s.stateTimestamp = now;
  });
  // Orders of a cancelled trip become Cancelled (10), matching the core seed's cancelled trips.
  tripOrders(t, idx).forEach((o) => {
    if (o.tripId === t.logisticsOrderId || !o.tripId) o.orderStatusId = 10;
  });
  persist();
  publishTrip(t, { event: 'TRIP_CANCELLED' });
  return { orderId: t.logisticsOrderId, transactionId: t.transactionId, status: 'Cancelled', reason: b.reason ?? 152 };
});

route('POST', BUYER, '/fulfillment/req_for_track', (req) => {
  const b = req.body || {};
  const t = requireTrip(b.orderId);
  return {
    transactionId: t.transactionId,
    orderId: t.logisticsOrderId,
    message: 'Track request sent to the logistics provider',
    tracking: t.stops.map((s) => ({ fulfillmentId: s.fulfillmentId, status: s.status, gps: s.gps, updatedAt: s.stateTimestamp })),
  };
});

// ---------------------------------------------------------------- maps
function hopsFor(t: DbTrip, idx: Map<string, DbOrder>) {
  if (demo().noTrackingTrips.includes(t.orderId)) return [];
  const ds = deliveryStops(t).slice().sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const done = ds
    .filter((s) => FINAL_STOP.has(s.status) && s.status !== 'Cancelled' && s.stateTimestamp)
    .sort((a, b) => String(a.stateTimestamp).localeCompare(String(b.stateTimestamp)));
  return ds.map((s) => {
    const os = stopOrders(s, idx);
    const gps = gpsOf(s);
    const completed = done.includes(s);
    return {
      stopNumber: s.sequenceOrder,
      pointLat: gps ? String(gps[0]) : '',
      pointLng: gps ? String(gps[1]) : '',
      pointName: s.address?.name || os[0]?.customerBusinessName || '',
      invoicevalue: round2(os.reduce((a, o) => a + (Number(o.amount) || 0), 0)).toFixed(2),
      weight: round2(os.reduce((a, o) => a + (Number(o.volumetricWeight) || 0), 0)),
      isDigitalOnly: os.length > 0 && os.every((o) => o.orderType === 'Digital' || o.orderType === null),
      status: completed ? 'Completed' : 'Pending',
      deliveredAt: completed ? s.stateTimestamp : null,
      liveStopNumber: completed ? done.indexOf(s) + 1 : null,
      liveLat: completed && gps ? (gps[0] + jitter(s.id, 1)).toFixed(7) : null,
      liveLng: completed && gps ? (gps[1] + jitter(s.id, 2)).toFixed(7) : null,
    };
  });
}

route('POST', BUYER, '/logistics-orders/hop-path-tracking/bulk', (req) => {
  const ids: string[] = Array.isArray(req.body?.logisticsOrderIds) ? req.body.logisticsOrderIds : [];
  const idx = orderIndex();
  const out: Record<string, { hops: unknown[] }> = {};
  ids.forEach((id) => {
    const t = findTrip(id);
    if (t) out[id] = { hops: hopsFor(t, idx) };
  });
  return out;
});

const DIRECTIONS = ['East', 'Northeast', 'North', 'Northwest', 'West', 'Southwest', 'South', 'Southeast'];
function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function formatMinutes(min: number): string | null {
  if (!isFinite(min) || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function routeDetailsFor(t: DbTrip, idx: Map<string, DbOrder>) {
  if (demo().noRouteDetailsTrips.includes(t.orderId)) return null;
  const d = db();
  const ds = deliveryStops(t);
  if (!ds.length) return null;
  const orders = tripOrders(t, idx);
  const pts = ds.map(gpsOf).filter((p): p is [number, number] => !!p);
  const wh = d.addresses.find((a) => a.is_default) || d.addresses[0];
  const depot: [number, number] = [Number(wh?.latitude) || 17.3741026, Number(wh?.longitude) || 78.5012347];
  const centroid: [number, number] = pts.length ? [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length] : depot;
  const angle = (Math.atan2(centroid[0] - depot[0], centroid[1] - depot[1]) * 180) / Math.PI;
  const direction = DIRECTIONS[((Math.round(angle / 45) % 8) + 8) % 8];
  const depotKm = Math.round(haversineKm(depot, centroid) * 10) / 10;

  // beat coherence: customers of each beat in this route vs the beat's whole customer base
  const beatMap = new Map<string, Set<string>>();
  ds.forEach((s) => {
    const os = stopOrders(s, idx);
    const c = customerOf(s, os);
    const beatId = c?.beatId || os[0]?.beatId;
    if (!beatId) return;
    if (!beatMap.has(beatId)) beatMap.set(beatId, new Set());
    beatMap.get(beatId)!.add(c?.id || s.id);
  });
  const beats = Array.from(beatMap.entries()).map(([beatId, set]) => {
    const beat = d.beats.find((b) => b.id === beatId);
    const total = Math.max(set.size, d.customers.filter((c) => c.beatId === beatId).length);
    return { name: beat?.name || 'No Beat', inRoute: set.size, total, coherencePct: Math.round((set.size / total) * 100) };
  });
  const score = beats.length ? Math.round(beats.reduce((a, b) => a + b.coherencePct, 0) / beats.length) : null;
  const split = beats.filter((b) => b.inRoute < b.total);
  const reason = score === null
    ? null
    : split.length
      ? `${split.length} of ${beats.length} sales beats are split across routes. ` +
        split.map((b) => `${b.name} has ${b.inRoute} of its ${b.total} delivery points in this route (${b.total - b.inRoute} assigned to other routes due to vehicle capacity or distance constraints).`).join(' ') +
        ' Beats are split when a single vehicle cannot serve all customers in a territory due to weight capacity limits or maximum stop constraints.'
      : `All ${beats.length} sales beats are fully contained in this route.`;

  const totalAmount = round2(orders.reduce((a, o) => a + (Number(o.amount) || 0), 0));
  const totalWeightKg = round2(orders.reduce((a, o) => a + (Number(o.orderWeight) || 0), 0));
  const totalVolWeightKg = round2(orders.reduce((a, o) => a + (Number(o.volumetricWeight) || 0), 0));
  const cap = Number(t.vehicleVolumetricCapacityKg) || Number(t.suggestedVehicleCapacityKg) || 0;
  const utilized = cap > 0 ? round2((totalVolWeightKg / cap) * 100) : null;
  const distanceKm = Number(t.totalDistance);
  return {
    customerCount: ds.length,
    distanceKm: isFinite(distanceKm) ? distanceKm : null,
    totalAmount,
    estimatedTimeFormatted: formatMinutes(Number(t.estimatedTimeToDelivery)),
    registrationNumber: t.vehicleRegNumber || t.suggestedVehicleRegNumber || null,
    totalWeightKg,
    totalVolWeightKg,
    vehicleCapacityKg: cap > 0 ? cap : null,
    vehicleUtilized: utilized,
    routeDirection: direction,
    routeExplanation:
      `Serves ${direction} sector, ${depotKm}km from depot. ${beats.length - split.length}/${beats.length} beats fully contained.` +
      (utilized !== null ? ` Vehicle ${Math.round(utilized)}% utilized (${totalVolWeightKg}/${cap} kg).` : ''),
    beatCoherenceScore: score,
    beatCoherenceReason: reason,
    beats,
  };
}

route('POST', BUYER, '/route_planning/trip-route-details/bulk', (req) => {
  const ids: string[] = Array.isArray(req.body?.logisticsOrderIds) ? req.body.logisticsOrderIds : [];
  const idx = orderIndex();
  const out: Record<string, unknown> = {};
  ids.forEach((id) => {
    const t = findTrip(id);
    out[id] = t ? routeDetailsFor(t, idx) : null;
  });
  return out;
});

// ---------------------------------------------------------------- files
const withName = <T extends Blob>(blob: T, fileName: string) => Object.assign(blob, { contentDisposition: `attachment; filename="${fileName}"` });

/** Fixed-width text columns for the PDF tables. */
function cols(parts: [unknown, number, ('l' | 'r')?][]): string {
  return parts
    .map(([v, w, align]) => {
      const s = String(v ?? '');
      const cut = s.length > w ? s.slice(0, w - 1) + '.' : s;
      return align === 'r' ? cut.padStart(w) : cut.padEnd(w);
    })
    .join(' ');
}
const money = (n: number) => `Rs. ${round2(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const casesPcs = (upc: number, qty: number) => {
  const u = Math.round(Number(upc) || 0);
  return u > 0 ? { cases: Math.floor(qty / u), pcs: qty % u } : { cases: 0, pcs: qty };
};

function tripHeader(t: DbTrip): string[] {
  return [
    `Trip Number: ${t.orderId}`,
    `Provider: ${t.providerName}    Vehicle: ${t.vehicleRegNumber || 'N/A'}    Driver: ${t.agentName || 'N/A'} (${t.agentMobileNumber || 'N/A'})`,
    `Helper: ${t.helperName || 'N/A'}    Pickup slot: ${istStamp(t.pickupSlotStart)}    Trip created: ${istStamp(t.createdAt)}`,
    `Warehouse: ${t.stops.find((s) => s.deliveryType === 'Batch')?.address.locality || 'N/A'}`,
    '',
  ];
}

interface ProductTotal { name: string; upc: number; qty: number; amount: number; weight: number }
function productTotals(orders: DbOrder[]): ProductTotal[] {
  const m = new Map<string, ProductTotal>();
  orders.forEach((o) =>
    o.items.forEach((it) => {
      const p = m.get(it.itemName) || { name: it.itemName, upc: it.upc, qty: 0, amount: 0, weight: 0 };
      p.qty += it.quantity;
      p.amount += it.totalAmount;
      p.weight += it.quantity * it.weightKg;
      m.set(it.itemName, p);
    }),
  );
  return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name));
}
function productTable(rows: ProductTotal[]): string[] {
  const lines = [cols([['#', 3], ['Product', 46], ['UPC', 4, 'r'], ['Cases', 6, 'r'], ['Pcs', 5, 'r'], ['Qty', 6, 'r'], ['Amount', 16, 'r']]), '-'.repeat(92)];
  rows.forEach((p, i) => {
    const { cases, pcs } = casesPcs(p.upc, p.qty);
    lines.push(cols([[i + 1, 3], [p.name, 46], [p.upc, 4, 'r'], [cases, 6, 'r'], [pcs, 5, 'r'], [p.qty, 6, 'r'], [money(p.amount), 16, 'r']]));
  });
  const qty = rows.reduce((a, p) => a + p.qty, 0);
  const amt = rows.reduce((a, p) => a + p.amount, 0);
  lines.push('-'.repeat(92), cols([['', 3], ['Total', 46], ['', 4], ['', 6], ['', 5], [qty, 6, 'r'], [money(amt), 16, 'r']]));
  return lines;
}

route('POST', BUYER, '/logistics-orders/download_indent_sheet', (req) => {
  const t = requireTrip(req.body?.logisticsOrderId);
  const idx = orderIndex();
  const orders = tripOrders(t, idx);
  const beatwise = !!req.body?.isBeatwise;
  const lines = tripHeader(t);
  if (!beatwise) {
    lines.push(`Orders: ${orders.length}    Customers: ${deliveryStops(t).length}    Vol. weight: ${round2(orders.reduce((a, o) => a + o.volumetricWeight, 0))} kg`, '');
    lines.push(...productTable(productTotals(orders)));
  } else {
    const byBeat = new Map<string, DbOrder[]>();
    orders.forEach((o) => {
      const k = o.salesBeatName || 'No Beat';
      if (!byBeat.has(k)) byBeat.set(k, []);
      byBeat.get(k)!.push(o);
    });
    byBeat.forEach((os, beat) => {
      const customers = new Set(os.map((o) => o.customerId)).size;
      lines.push(`BEAT: ${beat}  (${customers} customers, ${os.length} orders)`, ...productTable(productTotals(os)), '');
    });
  }
  const title = beatwise ? `Beatwise Loading Sheet - ${t.orderId}` : `Consolidated Pickup List - ${t.orderId}`;
  return withName(makePdf(title, lines), beatwise ? `${t.orderId}_Beatwise_Loading_Sheet.pdf` : `${t.orderId}_Consolidated_Pickup_List.pdf`);
});

route('POST', BUYER, '/logistics-orders/split_pickup_list', (req) => {
  const t = requireTrip(req.body?.logisticsOrderId);
  const idx = orderIndex();
  const lines = tripHeader(t);
  deliveryStops(t).forEach((s) => {
    stopOrders(s, idx).forEach((o) => {
      lines.push(`Stop ${s.sequenceOrder} | Order ${o.refOrderId} | ${o.customerBusinessName} | ${o.customerMobileNumber}`);
      o.items.forEach((it) => {
        const { cases, pcs } = casesPcs(it.upc, it.quantity);
        lines.push('   ' + cols([[it.itemName, 46], [`${cases} cs`, 6, 'r'], [`${pcs} pc`, 6, 'r'], [`Qty ${it.quantity}`, 8, 'r'], [money(it.totalAmount), 16, 'r']]));
      });
      lines.push('   ' + cols([['Order total', 46], ['', 6], ['', 6], ['', 8], [money(o.amount), 16, 'r']]), '');
    });
  });
  return withName(makePdf(`Pickup List - ${t.orderId}`, lines), `${t.orderId}_Pickup_List.pdf`);
});

route('POST', BUYER, '/logistics-orders/consolidated_loading_sheet', (req) => {
  const t = requireTrip(req.body?.logisticsOrderId);
  const idx = orderIndex();
  const orders = tripOrders(t, idx);
  const lines = tripHeader(t);
  lines.push('LOADING SEQUENCE (last stop loaded first)', cols([['Load', 5], ['Stop', 5], ['Customer', 40], ['Orders', 7, 'r'], ['Cases', 6, 'r'], ['Vol. wt (kg)', 13, 'r']]), '-'.repeat(80));
  deliveryStops(t)
    .slice()
    .sort((a, b) => b.sequenceOrder - a.sequenceOrder)
    .forEach((s, i) => {
      const os = stopOrders(s, idx);
      const cases = os.reduce((a, o) => a + o.items.reduce((b, it) => b + casesPcs(it.upc, it.quantity).cases, 0), 0);
      lines.push(cols([[i + 1, 5], [s.sequenceOrder, 5], [s.address.name, 40], [os.length, 7, 'r'], [cases, 6, 'r'], [round2(os.reduce((a, o) => a + o.volumetricWeight, 0)), 13, 'r']]));
    });
  lines.push('', 'PRODUCT TOTALS', ...productTable(productTotals(orders)));
  lines.push('', `Vehicle capacity: ${t.vehicleVolumetricCapacityKg || 'N/A'} kg    Loaded vol. weight: ${round2(orders.reduce((a, o) => a + o.volumetricWeight, 0))} kg`);
  return withName(makePdf(`Consolidated Loading Sheet - ${t.orderId}`, lines), `${t.orderId}_Consolidated_Loading_Sheet.pdf`);
});

route('POST', BUYER, '/logistics-orders/customer_wise_indent_sheet', (req) => {
  const t = requireTrip(req.body?.logisticsOrderId);
  const idx = orderIndex();
  const lines = tripHeader(t);
  deliveryStops(t).forEach((s) => {
    const os = stopOrders(s, idx);
    lines.push(`STOP ${s.sequenceOrder}: ${s.address.name} (${s.contact?.phone || 'N/A'})`, `   ${[s.address.locality, s.address.city, s.address.areaCode].filter(Boolean).join(', ')}`);
    const totals = productTotals(os);
    totals.forEach((p) => {
      const { cases, pcs } = casesPcs(p.upc, p.qty);
      lines.push('   ' + cols([[p.name, 46], [`${cases} cs`, 6, 'r'], [`${pcs} pc`, 6, 'r'], [`Qty ${p.qty}`, 8, 'r'], [money(p.amount), 16, 'r']]));
    });
    lines.push('   ' + cols([[`Invoices: ${os.map((o) => o.refOrderId).join(', ')}`, 68], [money(os.reduce((a, o) => a + o.amount, 0)), 16, 'r']]), '');
  });
  return withName(makePdf(`Customer Wise Pickup List - ${t.orderId}`, lines), `${t.orderId}_Customer_Wise_Pickup_List.pdf`);
});

/** CDS Wise Pickup List (CDS tab → Pickup Indents): the trip's goods grouped by the CDS point where the service
 *  center drops them. Each CDS point lists its retailers and invoices, then the products to load for that point. */
route('POST', BUYER, '/logistics-orders/cds_wise_pickup_list', (req) => {
  const t = requireTrip(req.body?.logisticsOrderId);
  const idx = orderIndex();
  const lines = tripHeader(t);
  const groups = new Map<string, { point: CdsPoint; stops: DbStop[] }>();
  deliveryStops(t).forEach((s) => {
    const point = cdsPointForLocality(customerOf(s, stopOrders(s, idx))?.locality);
    if (!groups.has(point.id)) groups.set(point.id, { point, stops: [] });
    groups.get(point.id)!.stops.push(s);
  });
  const sorted = Array.from(groups.values()).sort((a, b) => a.point.name.localeCompare(b.point.name));
  sorted.forEach(({ point, stops }) => {
    const os = stops.flatMap((s) => stopOrders(s, idx));
    lines.push(
      `CDS POINT: ${point.name}`,
      `   ${point.address}`,
      `   Retailers: ${stops.length}    Orders: ${os.length}    Value: ${money(os.reduce((a, o) => a + o.amount, 0))}`,
      '',
    );
    stops.forEach((s) => {
      const sos = stopOrders(s, idx);
      lines.push('   ' + cols([[`Stop ${s.sequenceOrder}`, 8], [s.address.name, 30], [sos.map((o) => o.refOrderId).join(', '), 36], [money(sos.reduce((a, o) => a + o.amount, 0)), 16, 'r']]));
    });
    lines.push('', ...productTable(productTotals(os)), '', '');
  });
  if (!sorted.length) lines.push('No retailers on this trip.');
  else lines.push('='.repeat(92), `CDS points: ${sorted.length}    Retailers: ${deliveryStops(t).length}    Orders: ${tripOrders(t, idx).length}`);
  return withName(makePdf(`CDS Wise Pickup List - ${t.orderId}`, lines), `${t.orderId}_CDS_Wise_Pickup_List.pdf`);
});

route('POST', BUYER, '/logistics-orders/order_details_pdf', (req) => {
  const t = requireTrip(req.body?.logisticsOrderId);
  const idx = orderIndex();
  const lines = tripHeader(t);
  deliveryStops(t).forEach((s) => {
    stopOrders(s, idx).forEach((o) => {
      lines.push(`${o.refOrderId} | ${o.customerBusinessName} | Stop ${s.sequenceOrder} | ${s.displayStatus} | ${money(o.amount)}`);
      o.items.forEach((it) => lines.push(`     ${it.itemName} x ${it.quantity} @ ${money(it.sellingPrice)} = ${money(it.totalAmount)}`));
    });
  });
  // The client ignores the name "order_details.pdf" and falls back to "{id}_order_details.pdf" (as-built).
  return withName(makePdf(`Order Details - ${t.orderId}`, lines), 'order_details.pdf');
});

route('GET', BUYER, '/logistics-orders/return_report/:id', (req) => {
  const t = requireTrip(req.params.id);
  const idx = orderIndex();
  const rows: Record<string, unknown>[] = [];
  deliveryStops(t).forEach((s) => {
    stopOrders(s, idx).forEach((o) => {
      o.items.forEach((it) => {
        const q = returnedQtyOnStop(s, it);
        if (q <= 0) return;
        rows.push({
          'Trip Number': t.orderId, 'Stop No.': s.sequenceOrder, 'Customer Name': s.address.name, 'Customer Mobile': s.contact?.phone || '',
          'Order Number': o.refOrderId, 'Product Name': it.itemName, UOM: it.uom, UPC: it.upc, 'Ordered Qty': it.quantity,
          'Delivered Qty': it.quantity - q, 'Returned Qty': q, MRP: it.mrp, 'Selling Price': it.sellingPrice,
          'Return Value': isReturnedStop(s) ? it.totalAmount : round2(q * it.sellingPrice),
          'Return Type': isReturnedStop(s) ? 'Full Return' : 'Partial Return', 'Return Reason': o.returnReason || '-',
          'Returned At': istStamp(s.stateTimestamp),
        });
      });
    });
  });
  if (!rows.length) rows.push({ 'Trip Number': t.orderId, 'Stop No.': '', 'Customer Name': 'No returns on this trip' });
  return withName(makeXlsx([{ name: 'Return Report', rows }]), `${t.orderId}_Return_Report.xlsx`);
});

/** CDS Credit Note (replaces the Return Report on the CDS tab): every retailer's returned products, quantity,
 *  value and reason, a credit amount per retailer, and the total credit for the trip. */
route('POST', BUYER, '/logistics-orders/credit_note', (req) => {
  const t = requireTrip(req.body?.logisticsOrderId);
  const idx = orderIndex();
  const lines = tripHeader(t);
  const head = cols([['#', 3], ['Product', 40], ['Returned Qty', 12, 'r'], ['Rate', 14, 'r'], ['Value', 16, 'r']]);
  let total = 0;
  let retailers = 0;
  deliveryStops(t).forEach((s) => {
    const os = stopOrders(s, idx);
    const rows: { name: string; qty: number; rate: number; value: number }[] = [];
    os.forEach((o) =>
      o.items.forEach((it) => {
        const q = returnedQtyOnStop(s, it);
        if (q <= 0) return;
        rows.push({ name: it.itemName, qty: q, rate: it.sellingPrice, value: isReturnedStop(s) ? it.totalAmount : round2(q * it.sellingPrice) });
      }),
    );
    if (!rows.length) return;
    retailers += 1;
    const credit = rows.reduce((a, r) => a + r.value, 0);
    total += credit;
    // The PDF font has no long dashes ("Customer refused – shop closed"), so print them as "-".
    const reasons = Array.from(new Set(os.map((o) => o.returnReason).filter(Boolean))).map((r) => String(r).replace(/[–—]/g, '-'));
    lines.push(
      `RETAILER: ${s.address.name} (${s.contact?.phone || 'N/A'})`,
      `   Invoices: ${os.map((o) => o.refOrderId).join(', ')}    Return type: ${isReturnedStop(s) ? 'Full Return' : 'Partial Return'}`,
      `   Reason: ${reasons.join('; ') || '-'}`,
      '   ' + head,
      '   ' + '-'.repeat(89),
    );
    rows.forEach((r, i) => lines.push('   ' + cols([[i + 1, 3], [r.name, 40], [r.qty, 12, 'r'], [money(r.rate), 14, 'r'], [money(r.value), 16, 'r']])));
    lines.push('   ' + cols([['', 3], ['Credit for this retailer', 40], ['', 12], ['', 14], [money(credit), 16, 'r']]), '');
  });
  if (!retailers) lines.push('No returned goods on this trip.');
  else lines.push('-'.repeat(92), `Retailers with returns: ${retailers}    Total credit: ${money(total)}`);
  return withName(makePdf(`Credit Note - ${t.orderId}`, lines), `${t.orderId}_Credit_Note.pdf`);
});

/** Synthetic seller of a product (brand = first word of the product name). */
const sellerOf = (itemName: string) => `${itemName.split(/[\s,]+/)[0]} Consumer Products`;

function sellerRows(ids: string[]) {
  const idx = orderIndex();
  const trips = ids.map((id) => findTrip(id)).filter((t): t is DbTrip => !!t);
  if (!trips.length) throw new MockError(404, 'No logistics orders found');
  return { trips, idx };
}

route('POST', BUYER, '/logistics-orders/seller_pickup_list', (req) => {
  const ids: string[] = Array.isArray(req.body?.logisticsOrderIds) ? req.body.logisticsOrderIds : [];
  const { trips, idx } = sellerRows(ids);
  const bySeller = new Map<string, Map<string, { name: string; upc: number; qty: number; amount: number; trips: Set<string> }>>();
  trips.forEach((t) =>
    tripOrders(t, idx).forEach((o) =>
      o.items.forEach((it) => {
        const seller = sellerOf(it.itemName);
        if (!bySeller.has(seller)) bySeller.set(seller, new Map());
        const m = bySeller.get(seller)!;
        const p = m.get(it.itemName) || { name: it.itemName, upc: it.upc, qty: 0, amount: 0, trips: new Set<string>() };
        p.qty += it.quantity;
        p.amount += it.totalAmount;
        p.trips.add(t.orderId);
        m.set(it.itemName, p);
      }),
    ),
  );
  const sellers = Array.from(bySeller.keys()).sort();
  if (req.body?.format === 'excel') {
    const rows: Record<string, unknown>[] = [];
    sellers.forEach((s) =>
      bySeller.get(s)!.forEach((p) => {
        const { cases, pcs } = casesPcs(p.upc, p.qty);
        rows.push({ Seller: s, Product: p.name, UPC: p.upc, Cases: cases, Pieces: pcs, 'Total Qty': p.qty, Amount: round2(p.amount), 'Trip Numbers': Array.from(p.trips).join(', ') });
      }),
    );
    return withName(makeXlsx([{ name: 'Seller Pickup List', rows }]), 'Seller_Pickup_List.xlsx');
  }
  const lines = [`Trips: ${trips.map((t) => t.orderId).join(', ')}`, ''];
  sellers.forEach((s) => {
    lines.push(`SELLER: ${s}`);
    lines.push(...productTable(Array.from(bySeller.get(s)!.values()).map((p) => ({ name: p.name, upc: p.upc, qty: p.qty, amount: p.amount, weight: 0 }))), '');
  });
  return withName(makePdf('Seller Wise Pickup List', lines), 'Seller_Pickup_List.pdf');
});

route('POST', BUYER, '/logistics-orders/seller_wise_orders', (req) => {
  const ids: string[] = Array.isArray(req.body?.logisticsOrderIds) ? req.body.logisticsOrderIds : [];
  const { trips, idx } = sellerRows(ids);
  const bySeller = new Map<string, string[]>();
  trips.forEach((t) =>
    tripOrders(t, idx).forEach((o) => {
      const amountBySeller = new Map<string, number>();
      o.items.forEach((it) => amountBySeller.set(sellerOf(it.itemName), (amountBySeller.get(sellerOf(it.itemName)) || 0) + it.totalAmount));
      amountBySeller.forEach((amt, seller) => {
        if (!bySeller.has(seller)) bySeller.set(seller, []);
        bySeller.get(seller)!.push(cols([[t.orderId, 24], [o.refOrderId, 24], [o.customerBusinessName, 30], [money(amt), 16, 'r']]));
      });
    }),
  );
  const lines = [`Trips: ${trips.map((t) => t.orderId).join(', ')}`, ''];
  Array.from(bySeller.keys()).sort().forEach((s) => {
    lines.push(`SELLER: ${s}  (${bySeller.get(s)!.length} orders)`, cols([['Trip', 24], ['Order', 24], ['Customer', 30], ['Amount', 16, 'r']]), ...bySeller.get(s)!, '');
  });
  return withName(makePdf('Seller Wise Orders List', lines), 'Seller_Wise_Orders.pdf');
});

// ---------------------------------------------------------------- trip simulator
const SIM_INTERVAL_MS = 45_000;
let simPaused = false;

function setStop(s: DbStop, status: string, display: string, ts: string) {
  s.status = status;
  s.displayStatus = display;
  s.stateTimestamp = ts;
}

/** Advances one In Progress trip by one step. Returns true when something changed. */
function advanceTrip(t: DbTrip, idx: Map<string, DbOrder>): boolean {
  const batch = t.stops.find((s) => s.deliveryType === 'Batch');
  // only trips already on the road move (an "At Pickup" trip stays loading, so its cancellable state can be seen)
  if (batch && batch.status !== 'Order-picked-up') return false;
  const now = nowIso();
  const pending = deliveryStops(t)
    .slice()
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .filter((s) => !FINAL_STOP.has(s.status));
  let changed: DbStop | null = null;
  const at = pending.find((s) => s.status === 'At-delivery');
  if (at) {
    setStop(at, 'Order-delivered', 'Order Delivered', now);
    stopOrders(at, idx).forEach((o) => {
      o.orderStatusId = 5;
      o.items.forEach((it) => {
        it.deliveredQuantity = it.quantity;
        it.returnedQuantity = 0;
      });
    });
    changed = at;
  } else if (pending.length) {
    setStop(pending[0], 'At-delivery', 'At Delivery', now);
    changed = pending[0];
  }
  const remaining = deliveryStops(t).filter((s) => !FINAL_STOP.has(s.status));
  if (!remaining.length) {
    t.status = 3;
    t.endTime = now;
  }
  if (!changed && remaining.length) return false;
  publishTrip(t, changed ? { fulfillmentId: changed.fulfillmentId, status: changed.status, displayStatus: changed.displayStatus } : { event: 'TRIP_COMPLETED' });
  return true;
}

function simTick() {
  if (simPaused) return;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
  try {
    const d = db();
    const idx = orderIndex();
    let changed = false;
    d.trips.filter((t) => t.status === 2).forEach((t) => {
      if (advanceTrip(t, idx)) changed = true;
    });
    if (changed) persist();
  } catch (e) {
    console.warn('Trip simulator tick failed', e);
  }
}

export const tripSimulator = {
  pause: () => {
    simPaused = true;
  },
  resume: () => {
    simPaused = false;
  },
  tick: () => {
    const was = simPaused;
    simPaused = false;
    simTick();
    simPaused = was;
  },
  isPaused: () => simPaused,
};

/** Dark-store demo: flips the buyer's buyerType (Trips shows the seller bulk-actions bar for DARKSTORE). */
export function setDarkStoreDemo(on: boolean) {
  const d = db();
  d.buyer.buyerType = on ? 'DARKSTORE' : 'SELF_3PL';
  demo().darkStore = on;
  persist();
}
export const isDarkStoreDemo = () => db().buyer.buyerType === 'DARKSTORE';

if (typeof window !== 'undefined') {
  const w = window as any;
  if (w.__lbnpTripSimTimer) window.clearInterval(w.__lbnpTripSimTimer);
  w.__lbnpTripSimTimer = window.setInterval(simTick, SIM_INTERVAL_MS);
  w.__lbnpTrips = { simulator: tripSimulator, setDarkStore: setDarkStoreDemo, isDarkStore: isDarkStoreDemo };
}
