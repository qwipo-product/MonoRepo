// Mock endpoints for Delivery Planning (spec 03) — also used by Order Details "Search Vehicles" (spec 01 §2.4) and
// Trip Order Details (spec 05 §4.6, /orders/customer-order-details).
//
// Route-plan combos live in db.ext.routePlans (see src/mock/extensions/deliveryRoutes.ts). Lifecycle simulated here:
//   POST /route_planning/create          → combos CREATED, orders 1 → 2 (In Planning), expiry now + 15 min
//   POST /fulfillment/req_for_quotation   → overflow: QUOTATION_REQUESTED (+ provider quotes)
//                                          planned (own vehicle): AUTO_CONFIRMING → ~12 s later a trip is created,
//                                          the combo disappears and SSE "tripCreated" is pushed on delivery-plan:{requestId}
//   POST /fulfillment/req_for_confirm     → trip created with the chosen provider, orders 2 → 3, combo removed
//   POST /route_planning/expire_route     → combo removed, orders back to 1
//   Expired combos stay visible for 15 min after expiry (so "Expired"/"Failed" can be seen) and are then released.
import { db, persist, uuid } from '../db';
import { MockError, route } from '../server';
import { publishSse } from '../sseHub';
import type { MockDatabase } from '../seed';
import type { DbAddress, DbOrder, DbProvider, DbStop, DbTrip } from '../types';
import {
  type OptimizedRoute, type ProviderQuote, type RoutePlanCombo,
  depotOf, displayRouteId, formatDuration, localYmd, planRoutes, round2, routePlanningConfig, sequenceCustomers, travelSeconds,
} from '../extensions/deliveryRoutes';

const BUYER = 'logistics-buyer-svc';
const GRACE_MS = 15 * 60 * 1000;
const COMBO_TTL_MS = 15 * 60 * 1000;
const QUICK_TTL_MS = 5 * 60 * 1000;
const AUTO_CONFIRM_DELAY_MS = 12 * 1000;
/** Synthetic 3PL partner not in the core seed (adds a fourth enabled quote). */
const EXTRA_PROVIDER: DbProvider = { id: '5c0f7d1e-3a2b-4c8d-9e6f-0a1b2c3d4e99', name: 'Charminar Cargo Movers', basePrice: 1599 };

// ---------------------------------------------------------------- helpers
function plans(): RoutePlanCombo[] {
  const d = db();
  if (!Array.isArray(d.ext.routePlans)) d.ext.routePlans = [];
  return d.ext.routePlans as RoutePlanCombo[];
}

const randDigits = (n: number) => Array.from({ length: n }, () => String(Math.floor(Math.random() * 10))).join('');
const randLetters = (n: number) => Array.from({ length: n }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]).join('');
const pad = (n: number) => String(n).padStart(2, '0');
const ms = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : NaN);

function defaultAddress(d: MockDatabase): DbAddress | undefined {
  return d.addresses.find((a) => a.is_default) || d.addresses[0];
}

function ownFleetProvider(d: MockDatabase): DbProvider {
  return d.providers.find((p) => d.vehicles.some((v) => v.sellerId === p.id)) || d.providers[0] || EXTRA_PROVIDER;
}

function findOrders(d: MockDatabase, ids: string[]): DbOrder[] {
  return ids.map((id) => d.orders.find((o) => o.orderId === id)).filter((o): o is DbOrder => !!o);
}

/** Order ids carried by a route body (batch: customers[].orders[].orderId; quick: customerId is the orderId). */
function routeOrderIds(r: any): string[] {
  const ids: string[] = [];
  (r?.customers || []).forEach((c: any) => {
    const os = Array.isArray(c?.orders) ? c.orders : [];
    if (os.length) os.forEach((o: any) => ids.push(String(o?.orderId ?? c.customerId)));
    else if (c?.customerId) ids.push(String(c.customerId));
  });
  return Array.from(new Set(ids));
}

function removeCombo(id: string) {
  const list = plans();
  const i = list.findIndex((p) => p.routePlanComboId === id);
  if (i >= 0) list.splice(i, 1);
}

/** Releases a combo: its In-Planning orders go back to Ready for Planning. */
function releaseCombo(p: RoutePlanCombo) {
  const d = db();
  findOrders(d, p.orderIds).forEach((o) => {
    if (o.orderStatusId === 2 && (o.routePlanComboId === p.routePlanComboId || !o.routePlanComboId)) {
      o.orderStatusId = 1;
      o.routePlanComboId = null;
    }
  });
  removeCombo(p.routePlanComboId);
  persist();
}

function tripNumber(d: Date) {
  return `Q-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${randLetters(4)}`;
}

function categoryForSla(sla: string, isQuick: boolean) {
  if (isQuick) return 'Standard Delivery';
  if (sla === 'SAME_DAY') return 'Same Day Delivery';
  if (sla === 'NEXT_DAY') return 'Next Day Delivery';
  return 'Standard Delivery';
}

function pickupSlotFor(p: RoutePlanCombo, offsetMin = 0): Date {
  const [y, m, dd] = (p.deliveryDate || localYmd(new Date())).split('-').map(Number);
  const slot = new Date(y, (m || 1) - 1, dd || 1, 6, 0, 0, 0);
  slot.setMinutes(slot.getMinutes() + offsetMin);
  const soon = Date.now() + 60 * 60 * 1000;
  if (slot.getTime() < soon) {
    const s = new Date(soon);
    s.setMinutes(Math.ceil(s.getMinutes() / 30) * 30 + offsetMin, 0, 0);
    return s;
  }
  return slot;
}

/** Creates a Planned trip (logistics order) for a combo: Batch stop (warehouse) + one Delivery stop per customer. */
function createTripFromCombo(p: RoutePlanCombo, provider: { id: string; name: string }, price: number): DbTrip {
  const d = db();
  const now = new Date();
  const wh = d.addresses.find((a) => a.id === p.buyerAddressId) || defaultAddress(d);
  const vehicle = p.vehicleId ? d.vehicles.find((v) => v.id === p.vehicleId) || null : null;
  const pickup = pickupSlotFor(p);
  const logisticsOrderId = uuid();
  const pickupOtp = randDigits(4);
  const rtoOtp = randDigits(4);
  const cfg = routePlanningConfig(d);

  // orders in route sequence, grouped by the real customer
  const seqCustomers = [...(p.route?.customers || [])].sort((a, b) => Number(a.seq) - Number(b.seq));
  const orderedIds: string[] = [];
  seqCustomers.forEach((c) => routeOrderIds({ customers: [c] }).forEach((id) => p.orderIds.includes(id) && !orderedIds.includes(id) && orderedIds.push(id)));
  p.orderIds.forEach((id) => !orderedIds.includes(id) && orderedIds.push(id));
  const orders = findOrders(d, orderedIds);
  const byCustomer = new Map<string, DbOrder[]>();
  orders.forEach((o) => {
    if (!byCustomer.has(o.customerId)) byCustomer.set(o.customerId, []);
    byCustomer.get(o.customerId)!.push(o);
  });

  const stops: DbStop[] = [{
    id: uuid(), fulfillmentId: uuid(), deliveryType: 'Batch', sequenceOrder: 0, customerId: null, orderIds: [],
    status: 'Pending', displayStatus: 'Pending', stateTimestamp: pickup.toISOString(), pickupOtp, deliveryOtp: null, rtoOtp: null,
    gps: `${wh?.latitude ?? ''},${wh?.longitude ?? ''}`,
    address: { name: d.buyer.businessName, building: 'warehouse', locality: wh?.address_line1 || '', city: wh?.city || 'Hyderabad', state: wh?.state || 'Telangana', country: wh?.country || 'India', areaCode: wh?.address_line1 || '', pincode: wh?.pincode || '' },
    contact: { name: d.buyer.businessName, phone: d.buyer.mobileNumber },
  }];
  let seq = 1;
  byCustomer.forEach((os, customerId) => {
    const o = os[0];
    const c = d.customers.find((x) => x.id === customerId);
    stops.push({
      id: uuid(), fulfillmentId: uuid(), deliveryType: 'Delivery', sequenceOrder: seq++, customerId, orderIds: os.map((x) => x.orderId),
      status: 'Pending', displayStatus: 'Pending', stateTimestamp: pickup.toISOString(), pickupOtp, deliveryOtp: randDigits(4), rtoOtp,
      gps: c ? `${c.latitude},${c.longitude}` : `${o.lat},${o.lng}`,
      address: {
        name: o.customerBusinessName, building: o.customerBusinessName,
        locality: c ? c.address.split(', ').slice(1).join(', ') : [o.address.line, o.address.locality].filter(Boolean).join(', '),
        city: o.address.city || 'Hyderabad', state: o.address.state || 'Telangana', country: o.address.country || 'INDIA', areaCode: o.address.pincode, pincode: o.address.pincode,
      },
      contact: { name: '', phone: o.customerMobileNumber, email: 'info@example.com' },
    });
  });

  const distance = Number(p.route?.distanceKm) || 0;
  const minutes = Math.round((Number(p.route?.estimatedTimeHours) || 0) * 60) || Math.round(distance * 3 + byCustomer.size * 12);
  const capacity = vehicle ? vehicle.volumetricCapacityKg : String(Number(p.route?.vehicleCapacity || 0).toFixed(2));
  const trip: DbTrip = {
    logisticsOrderId, orderId: tripNumber(now), buyerId: d.buyer.id, providerId: provider.id, providerName: provider.name,
    transactionId: `txn_${uuid()}`, categoryId: categoryForSla(p.sla, p.isQuick), status: 1, createdAt: now.toISOString(), startTime: null,
    pickupSlotStart: pickup.toISOString(), pickupSlotEnd: 'PT2H', deliveryTatDuration: p.sla === 'SAME_DAY' || p.isQuick ? 'PT12H' : 'P1D', endTime: null,
    deliveryPrice: (Number(price) || 0).toFixed(2), rtoPrice: '0.00',
    vehicleId: vehicle?.id ?? null, vehicleRegNumber: vehicle?.registrationNumber ?? null,
    vehicleType: vehicle?.vehicleType ?? (p.route?.vehicleType || 'truck'), vehicleVolumetricCapacityKg: capacity,
    agentId: null, agentName: null, agentMobileNumber: null, helperId: null, helperName: null, helperMobileNumber: null,
    estimatedTimeToDelivery: String(minutes), totalDistance: distance.toFixed(2), maxStopCount: String(cfg.maxStops),
    suggestedVehicleRegNumber: vehicle?.registrationNumber ?? '', suggestedVehicleCapacityKg: capacity,
    stops, orderIds: orders.map((o) => o.orderId), routePlanComboId: p.routePlanComboId, cancelReason: null,
  };
  d.trips.unshift(trip);
  const deliveryIso = new Date(pickup.getFullYear(), pickup.getMonth(), pickup.getDate()).toISOString();
  orders.forEach((o) => {
    o.orderStatusId = 3;
    o.tripId = logisticsOrderId;
    o.tripHistory = [...(o.tripHistory || []), logisticsOrderId];
    o.routePlanComboId = null;
    o.deliveryDate = deliveryIso;
  });
  persist();
  return trip;
}

/** Provider quotes for a combo (3PL partners for overflow / quick routes, the own-fleet partner for planned routes). */
function generateQuotes(p: RoutePlanCombo): ProviderQuote[] {
  const d = db();
  const own = ownFleetProvider(d);
  const resultTimestamp = new Date().toISOString();
  const dist = Number(p.route?.distanceKm) || 0;
  const cap = Number(p.route?.vehicleCapacity) || 750;
  const mk = (pr: DbProvider, i: number, price: number, enabled: boolean): ProviderQuote => {
    const pickup = p.isQuick ? new Date(Date.now() + (30 + i * 15) * 60000) : pickupSlotFor(p, i * 30);
    return {
      ondcSearchId: uuid(), providerId: pr.id, providerName: pr.name, routeId: p.routeId, routeName: p.route?.routeName || p.routeId,
      deliveryPrice: price.toFixed(2), pickupTime: pickup.toISOString(), isEnabled: enabled, categoryId: categoryForSla(p.sla, p.isQuick),
      deliveryDate: p.isQuick ? localYmd(new Date()) : p.deliveryDate, deliveryTatDuration: p.isQuick ? ['PT2H30M', 'PT3H', 'PT1H45M', 'PT4H'][i % 4] : p.sla === 'SAME_DAY' ? 'PT8H' : 'P1D',
      resultTimestamp,
    };
  };
  if (p.relationshipType) {
    return [mk(own, 0, Number(p.route?.vehicleCost) || own.basePrice, true)];
  }
  const partners = [...d.providers.filter((x) => x.id !== own.id), EXTRA_PROVIDER];
  const capFactor = cap <= 750 ? 0.6 : cap <= 1500 ? 0.85 : 1.25;
  const quotes = partners.map((pr, i) => {
    const price = p.isQuick ? [49, 79, 99, 149][i % 4] + (Number(p.route?.totalVolWeightKg) > 10 ? 40 : 0) : Math.round(pr.basePrice * capFactor + dist * (14 + i * 2));
    return mk(pr, i, price, true);
  });
  quotes.push(mk(own, partners.length, p.isQuick ? 199 : Math.round(own.basePrice * capFactor + dist * 16), false));
  return quotes;
}

// ---------------------------------------------------------------- time-based simulation
const scheduled = new Set<string>();

function applyOutcome(p: RoutePlanCombo, publish: boolean) {
  if (!p.outcome) return;
  const kind = p.outcome.kind;
  if (kind === 'trip') {
    const own = ownFleetProvider(db());
    const quote = p.quotes.find((q) => q.isEnabled);
    createTripFromCombo(p, quote ? { id: quote.providerId, name: quote.providerName } : own, quote ? Number(quote.deliveryPrice) : Number(p.route?.vehicleCost) || own.basePrice);
    removeCombo(p.routePlanComboId);
    persist();
    if (publish) publishSse('delivery-plan', p.routePlanRequestId, { messageType: 'TRIP_STATUS', message: 'tripCreated' });
  } else {
    releaseCombo(p);
  }
}

function scheduleOutcomes() {
  const now = Date.now();
  plans().forEach((p) => {
    if (!p.outcome) return;
    const at = ms(p.outcome.at);
    const key = `${p.routePlanComboId}@${p.outcome.at}`;
    if (!(at > now) || scheduled.has(key)) return;
    scheduled.add(key);
    window.setTimeout(() => {
      const cur = plans().find((x) => x.routePlanComboId === p.routePlanComboId && x.outcome?.at === p.outcome?.at);
      if (cur) applyOutcome(cur, true);
    }, at - now);
  });
}

/** Seeded combos carry offsets; anchor them to "now" on the first search so the demo countdowns are fresh. */
function anchorPendingCombos(now: number) {
  let changed = false;
  plans().forEach((p) => {
    const a = p.pendingAnchor;
    if (!a) return;
    p.createdDate = new Date(now + a.createdOffsetMs).toISOString();
    p.routePlanComboExpireTime = a.expiryOffsetMs === null ? null : new Date(now + a.expiryOffsetMs).toISOString();
    p.routePlanRequestExpireTime = p.routePlanComboExpireTime;
    p.outcome = a.outcome ? { kind: a.outcome.kind, at: new Date(now + a.outcome.offsetMs).toISOString() } : null;
    p.pendingAnchor = null;
    changed = true;
  });
  if (changed) persist();
}

/** Applies overdue outcomes (e.g. after a page reload) and releases combos that expired more than GRACE_MS ago. */
function housekeeping(anchor = false) {
  const now = Date.now();
  if (anchor) anchorPendingCombos(now);
  [...plans()].forEach((p) => {
    if (p.pendingAnchor) return;
    if (p.outcome && ms(p.outcome.at) <= now) {
      applyOutcome(p, false);
      return;
    }
    const exp = ms(p.routePlanComboExpireTime);
    if (!isNaN(exp) && now > exp + GRACE_MS) releaseCombo(p);
  });
  scheduleOutcomes();
}

function findCombo(id: unknown): RoutePlanCombo | undefined {
  return plans().find((p) => p.routePlanComboId === String(id ?? ''));
}

// ---------------------------------------------------------------- delivery planning
route('POST', BUYER, '/delivery_planning/search', (req) => {
  housekeeping(true);
  const b = req.body || {};
  const now = Date.now();
  let rows = plans().filter((p) => !b.buyerId || p.buyerId === b.buyerId);
  if (b.startDate) rows = rows.filter((p) => ms(p.createdDate) >= ms(b.startDate));
  if (b.endDate) rows = rows.filter((p) => ms(p.createdDate) <= ms(b.endDate) + 86399999);
  rows = [...rows].sort((a, c) => c.createdDate.localeCompare(a.createdDate));
  const pageNumber = Math.max(1, Number(b.pageNumber) || 1);
  const pageSize = Math.max(1, Number(b.pageSize) || 10);
  const page = rows.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
  return {
    rows: page.map((p) => ({
      createdDate: p.createdDate,
      routeId: p.routeId,
      logisticsOrderRowId: p.logisticsOrderRowId,
      routePlanComboId: p.routePlanComboId,
      dropsPoints: p.route?.customers?.length ?? 0,
      sla: p.sla,
      weightValue: round2(Number(p.route?.totalWeightKg) || 0),
      volumetricWeightValue: round2(Number(p.route?.totalVolWeightKg) || 0),
      routePlanComboExpireTime: p.routePlanComboExpireTime,
      routePlanRequestExpireTime: p.routePlanRequestExpireTime,
      routePlanRequestStatus: p.routePlanRequestStatus,
      routePlanComboStatus: p.routePlanComboStatus,
      relationshipType: p.relationshipType,
      routePlanRequestId: p.routePlanRequestId,
    })),
    count: rows.length,
    currentTime: new Date(now).toISOString(),
  };
});

route('GET', BUYER, '/delivery_planning/:id', (req) => {
  housekeeping();
  const p = findCombo(req.params.id);
  if (!p) throw new MockError(404, 'Delivery plan not found');
  const d = db();
  const seqCustomers = [...(p.route?.customers || [])].sort((a, b) => Number(a.seq) - Number(b.seq));
  const orderedIds: string[] = [];
  seqCustomers.forEach((c) => routeOrderIds({ customers: [c] }).forEach((id) => !orderedIds.includes(id) && orderedIds.push(id)));
  p.orderIds.forEach((id) => !orderedIds.includes(id) && orderedIds.push(id));
  const byCustomer = new Map<string, DbOrder[]>();
  findOrders(d, orderedIds).forEach((o) => {
    if (!byCustomer.has(o.customerId)) byCustomer.set(o.customerId, []);
    byCustomer.get(o.customerId)!.push(o);
  });
  const orders = Array.from(byCustomer.values()).map((os) => ({
    customerId: os[0].customerId,
    customerName: os[0].customerName,
    customerBusinessName: os[0].customerBusinessName,
    customerMobileNumber: os[0].customerMobileNumber,
    ordersCount: os.length,
    orderNumbers: os.map((o) => o.orderId).join(','),
    totalAmount: round2(os.reduce((s, o) => s + (Number(o.amount) || 0), 0)),
    totalWeight: round2(os.reduce((s, o) => s + (Number(o.volumetricWeight) || 0), 0)),
    items: os.flatMap((o) => o.items.map((it) => {
      const upc = Number(it.upc) || 0;
      return {
        orderId: o.orderId, productName: it.itemName, weightUnit: it.uom, upc: it.upc,
        cases: upc > 0 ? Math.floor(it.quantity / upc) : 0, pieces: upc > 0 ? it.quantity % upc : it.quantity,
        mrp: it.mrp, quantity: it.quantity, totalAmount: it.totalAmount,
      };
    })),
  }));
  return {
    deliveryPlan: {
      routePlanComboId: p.routePlanComboId, routeId: p.routeId, routeName: p.route?.routeName,
      distance: `${(Number(p.route?.distanceKm) || 0).toFixed(1)} km`, estimatedTime: p.route?.estimatedTimeFormatted || '',
      vehicleType: p.route?.vehicleType || '', status: p.routePlanComboStatus,
    },
    orders,
  };
});

// ---------------------------------------------------------------- route planning
route('POST', BUYER, '/route_planning', (req) => {
  const b = req.body || {};
  const ids: string[] = (Array.isArray(b.orderIds) ? b.orderIds : []).map(String);
  if (!ids.length) throw new MockError(400, 'orderIds must be a non-empty array');
  const d = db();
  const orders = findOrders(d, ids);
  if (!orders.length) throw new MockError(404, 'No orders found for the given orderIds');
  const bad = orders.filter((o) => !o.lat || !o.lng || isNaN(Number(o.lat)) || isNaN(Number(o.lng)));
  if (bad.length) {
    throw new MockError(422, `Invalid latitude/longitude for ${bad.length} order(s): ${bad.map((o) => o.refOrderId).join(', ')}`);
  }
  const addr = defaultAddress(d);
  if (!addr) throw new MockError(400, 'Default warehouse address not found');
  const cfg = routePlanningConfig(d);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const routes = planRoutes(d, orders, {
    deliveryDate: b.deliveryDate || localYmd(tomorrow),
    logisticsMode: b.logisticsMode || cfg.logisticsMode,
    depot: depotOf(addr),
    engine: cfg.engine,
    maxStops: cfg.maxStops,
    maxDistanceKm: cfg.maxDistanceKm,
    maxTravelTimeMinutes: cfg.maxTravelTimeMinutes,
    serviceTimeMinutes: cfg.serviceTimeMinutes,
  });
  return { routes, engine: cfg.engine, totalOrders: orders.length, totalRoutes: routes.length };
});

/** Batch body {routes, buyerId, buyerAddressId, sla} (Confirm Routes) and the single-order quick body (spec 01 §2.4). */
route('POST', BUYER, '/route_planning/create', (req) => {
  housekeeping();
  const b = req.body || {};
  const routes: any[] = Array.isArray(b.routes) ? b.routes : [];
  if (!routes.length) throw new MockError(400, 'routes must be a non-empty array');
  const d = db();
  const perRoute = routes.map((r) => routeOrderIds(r));
  const all = perRoute.flat();
  if (!all.length) throw new MockError(400, 'Routes contain no orders');
  const missing = all.filter((id) => !d.orders.some((o) => o.orderId === id));
  if (missing.length) throw new MockError(404, `Orders not found: ${missing.join(', ')}`);
  const notReady = findOrders(d, all).filter((o) => o.orderStatusId !== 1);
  if (notReady.length) throw new MockError(409, `Orders are not Ready for Planning: ${notReady.map((o) => o.refOrderId).join(', ')}`);

  const now = Date.now();
  const createdIso = new Date(now).toISOString();
  const routePlanRequestId = uuid();
  const addressId = b.buyerAddressId || defaultAddress(d)?.id || '';
  const sla = String(b.sla || 'NEXT_DAY');
  const ids: string[] = [];
  routes.forEach((r, i) => {
    const orderIds = perRoute[i];
    if (!orderIds.length) return;
    const isQuick = String(r.routeId || '').startsWith('QS-') || r.vehicleType === '2 Wheeler';
    const route: OptimizedRoute = JSON.parse(JSON.stringify(r));
    const vehicleId: string | null = route.vehicleId ?? null;
    const relationshipType = route.relationshipType ?? (vehicleId ? 'preferred' : null);
    let deliveryDate: string;
    if (route.expectedDeliveryDate && /^\d{4}-\d{2}-\d{2}$/.test(route.expectedDeliveryDate)) deliveryDate = route.expectedDeliveryDate;
    else if (route.expectedDeliveryDate && !isNaN(ms(route.expectedDeliveryDate))) deliveryDate = localYmd(new Date(route.expectedDeliveryDate));
    else {
      const dd = new Date();
      dd.setDate(dd.getDate() + (sla === 'SAME_DAY' ? 0 : sla === 'NEXT_DAY' ? 1 : 2));
      deliveryDate = localYmd(dd);
    }
    const comboId = uuid();
    const expiry = new Date(now + (isQuick ? QUICK_TTL_MS : COMBO_TTL_MS)).toISOString();
    plans().push({
      routePlanComboId: comboId,
      routePlanRequestId,
      routeId: isQuick ? String(r.routeId || displayRouteId(d, createdIso)) : displayRouteId(d, createdIso),
      logisticsOrderRowId: `LOR-${randDigits(5)}`,
      buyerId: String(b.buyerId || d.buyer.id),
      buyerAddressId: addressId,
      createdDate: createdIso,
      sla,
      deliveryDate,
      routePlanRequestStatus: 'CREATED',
      routePlanComboStatus: 'CREATED',
      relationshipType,
      vehicleId,
      routePlanComboExpireTime: expiry,
      routePlanRequestExpireTime: expiry,
      orderIds,
      route,
      quotes: [],
      isQuick,
      outcome: null,
      pendingAnchor: null,
    });
    const [y, m, dd] = deliveryDate.split('-').map(Number);
    const deliveryIso = new Date(y, m - 1, dd).toISOString();
    findOrders(d, orderIds).forEach((o) => {
      o.orderStatusId = 2;
      o.routePlanComboId = comboId;
      o.deliveryDate = deliveryIso;
    });
    ids.push(comboId);
  });
  persist();
  return { routeCombinationIds: ids, routePlanRequestId, count: ids.length };
});

route('POST', BUYER, '/route_planning/unassigned-beats', (req) => {
  const d = db();
  const ids: string[] = (Array.isArray(req.body?.orderIds) ? req.body.orderIds : []).map(String);
  const orders = findOrders(d, ids);
  const clusters = (d.clusters || []) as { id: string; beatIds?: string[] }[];
  const names: string[] = [];
  let count = 0;
  orders.forEach((o) => {
    const beat = d.beats.find((b) => (o.beatId && b.id === o.beatId) || (!!o.salesBeatName && b.name === o.salesBeatName));
    const assigned = !!beat && (!!beat.clusterId || clusters.some((c) => (c.beatIds || []).includes(beat.id)));
    if (!assigned) {
      count += 1;
      const n = o.salesBeatName || 'N/A';
      if (!names.includes(n)) names.push(n);
    }
  });
  return { unassignedOrderCount: count, totalOrders: orders.length, unassignedBeatNames: names };
});

route('POST', BUYER, '/route_planning/resequence', (req) => {
  const b = req.body || {};
  const routes: any[] = Array.isArray(b.routes) ? b.routes : [];
  if (!routes.length) throw new MockError(400, 'routes must be a non-empty array');
  const d = db();
  const cfg = routePlanningConfig(d);
  let depot = { lat: Number(b.depot?.lat) || 0, long: Number(b.depot?.long) || 0 };
  if (!depot.lat || !depot.long) depot = depotOf(defaultAddress(d));
  return routes.map((r) => {
    const customers: any[] = (Array.isArray(r.customers) ? r.customers : []).map((c: any) => ({
      ...c,
      lat: c?.lat != null && c.lat !== '' ? Number(c.lat) : null,
      long: c?.long != null && c.long !== '' ? Number(c.long) : null,
    }));
    const { ordered, distanceKm } = sequenceCustomers(depot, customers);
    const durationSecs = ordered.length ? travelSeconds(distanceKm, ordered.length, cfg.serviceTimeMinutes) : 0;
    return {
      routeId: r.routeId,
      distanceMeters: Math.round(distanceKm * 1000),
      durationSecs,
      estimatedTimeFormatted: formatDuration(durationSecs),
      customers: ordered.map((c, i) => ({ customerId: c.customerId, seq: i + 1 })),
    };
  });
});

route('POST', BUYER, '/route_planning/expire_route', (req) => {
  housekeeping();
  const id = req.body?.combinationId;
  const p = findCombo(id);
  if (!p) throw new MockError(404, 'Route combination not found');
  releaseCombo(p);
  return { combinationId: p.routePlanComboId, status: 'EXPIRED', type: req.body?.type ?? null };
});

// ---------------------------------------------------------------- fulfillment (quotation / confirmation)
route('POST', BUYER, '/fulfillment/req_for_quotation', (req) => {
  housekeeping();
  const b = req.body || {};
  const p = findCombo(b.routeId);
  if (!p) throw new MockError(404, 'Route combination not found');
  const now = Date.now();
  const exp = ms(p.routePlanComboExpireTime);
  if (!isNaN(exp) && now > exp) throw new MockError(400, 'Route combination has expired. Please create a new route.');
  if (b.isBatchRequest === false) p.isQuick = true;
  if (p.routePlanComboStatus === 'CREATED') {
    if (p.relationshipType) {
      // self-fleet: the backend auto-confirms with the own-fleet partner, then pushes "tripCreated"
      p.routePlanComboStatus = 'AUTO_CONFIRMING';
      p.outcome = { kind: 'trip', at: new Date(now + AUTO_CONFIRM_DELAY_MS).toISOString() };
    } else {
      p.routePlanComboStatus = 'QUOTATION_REQUESTED';
    }
  }
  p.routePlanRequestStatus = 'QUOTATION_REQUESTED';
  if (p.isQuick) {
    p.routePlanComboExpireTime = new Date(now + QUICK_TTL_MS).toISOString();
    p.routePlanRequestExpireTime = p.routePlanComboExpireTime;
  }
  if (!p.quotes.length) p.quotes = generateQuotes(p);
  persist();
  scheduleOutcomes();
  return { routePlanComboId: p.routePlanComboId, status: p.routePlanComboStatus, transactionId: `txn_${uuid()}`, messageId: uuid() };
});

route('POST', BUYER, '/fulfillment/get-available-providers', (req) => {
  housekeeping();
  const p = findCombo(req.body?.combinationId);
  if (!p || p.routePlanComboStatus === 'CREATED') return [];
  return p.quotes.map((q) => ({ ...q }));
});

route('POST', BUYER, '/fulfillment/req_for_confirm', (req) => {
  housekeeping();
  const id = String(req.body?.ondcSearchResultId ?? '');
  const p = plans().find((x) => x.quotes.some((q) => q.ondcSearchId === id));
  if (!p) throw new MockError(404, 'Search result not found or the route is no longer available');
  const q = p.quotes.find((x) => x.ondcSearchId === id)!;
  if (!q.isEnabled) throw new MockError(400, 'Selected provider is not available');
  const exp = ms(p.routePlanComboExpireTime);
  if (!isNaN(exp) && Date.now() > exp) throw new MockError(400, 'Quotation has expired. Please request a new quotation.');
  const trip = createTripFromCombo(p, { id: q.providerId, name: q.providerName }, Number(q.deliveryPrice));
  removeCombo(p.routePlanComboId);
  persist();
  return { logisticsOrderId: trip.logisticsOrderId, orderId: trip.orderId, providerName: q.providerName, status: 'CONFIRMED' };
});

// ---------------------------------------------------------------- orders used by planning
route('POST', BUYER, '/orders/get_by_filters', (req) => {
  const b = req.body || {};
  const d = db();
  const statuses: number[] = (Array.isArray(b.orderStatus) ? b.orderStatus : b.orderStatus != null ? [b.orderStatus] : []).map(Number);
  return d.orders
    .filter((o) => (!b.buyerId || o.buyerId === b.buyerId) && (!statuses.length || statuses.includes(o.orderStatusId)))
    .map((o) => ({
      orderId: o.orderId,
      refOrderId: o.refOrderId,
      customerId: o.customerId,
      customerName: o.customerName,
      customerBusinessName: o.customerBusinessName,
      customerMobileNumber: o.customerMobileNumber,
      orderWeight: o.orderWeight,
      volumetricWeight: o.volumetricWeight,
      orderDate: o.orderDate ? o.orderDate.replace(' ', 'T') : null,
      amount: o.amount,
      orderType: o.orderType,
      salesPersonName: o.salesPersonName,
      salesBeatName: o.salesBeatName,
      orderStatusId: o.orderStatusId,
      latitude: o.lat,
      longitude: o.lng,
      createdAt: o.createdAt,
    }));
});

function invoiceIdFor(o: DbOrder): string {
  if (o.refOrderId.startsWith('INV/')) return o.refOrderId;
  let h = 0;
  for (const ch of o.orderId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `INV/26-27/${String(h % 1000000).padStart(6, '0')}`;
}

route('POST', BUYER, '/orders/customer-order-details', (req) => {
  const b = req.body || {};
  const ids: string[] = (Array.isArray(b.orderIds) ? b.orderIds : b.orderIds ? [b.orderIds] : []).map((x: unknown) => String(x).trim());
  const d = db();
  const orders = findOrders(d, ids);
  if (!orders.length) throw new MockError(404, 'No orders found for the given orderIds');
  const first = orders[0];
  const cust = d.customers.find((c) => c.id === first.customerId);
  const lat = cust ? Number(cust.latitude) : first.lat;
  const lng = cust ? Number(cust.longitude) : first.lng;
  const mapped = orders.map((o) => ({
    orderNumber: o.refOrderId,
    orderId: o.orderId,
    referenceInvoiceId: invoiceIdFor(o),
    statusId: String(o.orderStatusId),
    orderDate: o.orderDate ? new Date(o.orderDate.replace(' ', 'T')).toISOString() : o.createdAt,
    reason: o.returnReason || null,
    orderTotal: o.amount,
    products: o.items.map((it) => {
      const upc = Number(it.upc) || 0;
      const returnQuantity = Number(it.returnedQuantity) || 0;
      const gst = Number(it.gstPercentage) || 0;
      return {
        name: it.itemName,
        hsnCode: it.hsnCode,
        css: String(upc > 0 ? Math.floor(it.quantity / upc) : 0),
        upc: String(it.upc ?? ''),
        pcs: String(upc > 0 ? it.quantity % upc : it.quantity),
        mrp: it.mrp,
        packageType: it.packageType,
        orderedQuantity: it.quantity,
        returnQuantity,
        netQuantity: it.quantity - returnQuantity,
        weight: Number(it.weightKg) || 0,
        rate: it.sellingPrice,
        taxableAmount: round2(it.totalAmount / (1 + gst / 100)),
        gstPercentage: gst,
        totalAmount: it.totalAmount,
      };
    }),
  }));
  const products = mapped.flatMap((o) => o.products);
  return {
    customerName: first.customerBusinessName || first.customerName,
    customerBusinessName: first.customerBusinessName,
    customerMobileNumber: first.customerMobileNumber,
    address: [first.address.line, first.address.locality, first.address.city].filter(Boolean).join(', ') + (first.address.pincode ? ` ${first.address.pincode}` : ''),
    city: first.address.city,
    state: first.address.state,
    pincode: first.address.pincode,
    coordinates: { lat, lng },
    logisticOrderId: b.logisticOrderId ?? null,
    totalOrders: mapped.length,
    totalProducts: products.length,
    totalReturnProducts: products.filter((p) => p.returnQuantity > 0).length,
    totalAmount: round2(orders.reduce((s, o) => s + (Number(o.amount) || 0), 0)),
    orders: mapped,
  };
});
