// CDS seed extension: the trips of the CDS (consolidated delivery) flow, shown on the Trips page tabs.
//
// - Consolidated Delivery (`channel: 'cds'`): the CDS service center collects this distributor's goods for
//   orders confirmed as 3PL + CDS. The trip completes when the goods are handed over to the service center, so it
//   carries no returns. Recent trips: Planned (pickup tomorrow), In Progress and three Completed; plus ten
//   completed trips over the past four weeks (history, so a monthly Performance Report has data).
// - Consolidated Returns (`channel: 'cds-returns'`): the service center brings retailers' returns back to the
//   distributor in a separate trip (the vehicle can differ, for example the next day). The trip closes with the
//   return OTP. Recent trips: Planned, In Progress and two Completed; plus six completed trips in the history. Each
//   carries full and/or partial returns of orders delivered by a completed Consolidated Delivery trip.
// Neither channel appears on the Direct Delivery tab, which lists 3PL trips.
// - CDS orders (`deliveryMode: 'cds'`): the seller confirmed them as CDS in Seller Store. LBNP sends them to the CDS
//   service admin while CDS Order Routing is on (Settings → Delivery), and the Orders page then skips them. Every
//   order on a CDS trip is one, plus four sent today that wait for a trip.
//
// This file exports no `seed`: buildSeed() calls `ensureCdsTrips()` after every other extension has run, so no
// other demo (issues, orders, trip tweaks) picks a CDS trip or order. Browsers that seeded the mock DB earlier get
// the trips on first use: the trips list and Performance Report routes call `ensureCdsTrips()` too. It replaces CDS
// data from an earlier version of this demo (flag `db.ext.cdsSeeded` = CDS_SEED_VERSION) without resetting any
// other demo data.
import type { MockDatabase } from '../seed';
import type { DbOrder, DbOrderItem, DbStop, DbTrip } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');
const round2 = (n: number) => Math.round(n * 100) / 100;
const isoAt = (base: Date, dayOffset: number, hour: number, minute = 0) => {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const localYmdHms = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** Small deterministic generator (mulberry32) so the CDS trips are the same on every seed. */
function cdsRng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const hex = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[int(0, 15)]).join('');
  return {
    int,
    uuid: () => `${hex(8)}-${hex(4)}-4${hex(3)}-${'89ab'[int(0, 3)]}${hex(3)}-${hex(12)}`,
    digits: (n: number) => Array.from({ length: n }, () => String(int(0, 9))).join(''),
    letters: (n: number) => Array.from({ length: n }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[int(0, 25)]).join(''),
  };
}

/** The CDS service centers (CDS service admins) this distributor can send CDS orders to. */
export const CDS_SERVICE_CENTERS = [
  { id: 'cds-center-1', name: 'CDS Service Center - Kukatpally' },
  { id: 'cds-center-2', name: 'CDS Service Center - Uppal' },
];
const CDS_CENTERS = CDS_SERVICE_CENTERS.map((c) => c.name);

// ---------------------------------------------------------------- CDS Order Routing (Settings → Delivery)
/**
 * When the seller confirms an order as CDS in Seller Store, the order lands in LBNP. While routing is on, LBNP sends
 * it at once to the selected CDS service admin, and the Orders page does not show it (the service center plans it
 * into a Consolidated Delivery trip). While routing is off, it stays on the Orders page as Ready for Planning, with
 * a "CDS" label, and the distributor plans it like a 3PL order. Kept in `db.ext`, not in buyer_config, because the
 * Delivery settings page saves buyer_config as one whole object.
 */
export interface CdsRoutingConfig {
  enabled: boolean;
  serviceCenterId: string;
}
export function cdsRoutingConfig(db: MockDatabase): CdsRoutingConfig {
  const c = db.ext.cdsRouting as Partial<CdsRoutingConfig> | undefined;
  return { enabled: c?.enabled ?? true, serviceCenterId: c?.serviceCenterId || CDS_SERVICE_CENTERS[0].id };
}
export function setCdsRoutingConfig(db: MockDatabase, config: CdsRoutingConfig) {
  db.ext.cdsRouting = { ...config };
}
/** A CDS order LBNP already sent to the CDS service admin: not shown on the Orders page or in Delivery Planning. */
export const isSentToCds = (o: DbOrder) => o.deliveryMode === 'cds' && !!o.cdsSentAt;

/** Sends every CDS order still waiting in LBNP (Ready for Planning, on no trip) to the configured service center.
 *  Used when routing is switched on. Returns how many orders were sent. */
export function sendWaitingCdsOrders(db: MockDatabase): number {
  const { serviceCenterId } = cdsRoutingConfig(db);
  const now = new Date().toISOString();
  let sent = 0;
  db.orders.forEach((o) => {
    if (o.deliveryMode !== 'cds' || o.cdsSentAt || o.orderStatusId !== 1 || o.tripId) return;
    o.cdsSentAt = now;
    o.cdsServiceCenterId = serviceCenterId;
    sent += 1;
  });
  return sent;
}

/** Mock only: the seller confirms one more order as CDS in Seller Store (Mock controls panel). The order lands in
 *  LBNP and follows the routing rule. */
export function addSellerCdsOrder(db: MockDatabase): DbOrder {
  const rng = cdsRng(Date.now() % 2147483647);
  const c = db.customers[rng.int(0, db.customers.length - 1)];
  const order = buildCdsOrder(db, rng, c, new Date(), 1, null);
  const { enabled, serviceCenterId } = cdsRoutingConfig(db);
  if (enabled) {
    order.cdsSentAt = new Date().toISOString();
    order.cdsServiceCenterId = serviceCenterId;
  }
  db.orders.unshift(order);
  return order;
}

/** A new order the seller confirmed as CDS (2–3 products), as the connector would deliver it to LBNP. */
function buildCdsOrder(db: MockDatabase, rng: ReturnType<typeof cdsRng>, c: MockDatabase['customers'][number], created: Date, statusId: number, tripId: string | null): DbOrder {
  const chosen = new Set<number>();
  while (chosen.size < Math.min(rng.int(2, 3), db.products.length)) chosen.add(rng.int(0, db.products.length - 1));
  const items: DbOrderItem[] = Array.from(chosen).map((pi) => {
    const p = db.products[pi];
    const qty = p.weightKg >= 10 ? rng.int(2, 4) : rng.int(8, 30);
    return {
      itemId: rng.uuid(), productId: p.id, itemName: p.name, quantity: qty, mrp: p.mrp, sellingPrice: p.sellingPrice,
      totalAmount: round2(qty * p.sellingPrice), weightKg: p.weightKg, upc: p.upc, gstPercentage: p.gstPercentage, hsnCode: p.hsnCode,
      imageUrl: p.imageUrl, uom: p.uom, packageType: p.packageType, deliveredQuantity: 0, returnedQuantity: 0,
    };
  });
  const weight = round2(items.reduce((s, it) => s + it.weightKg * it.quantity, 0));
  const beat = db.beats.find((b) => b.id === c.beatId) || null;
  const createdIso = created.toISOString();
  const deliveryDay = new Date(created);
  deliveryDay.setDate(deliveryDay.getDate() + 1);
  deliveryDay.setHours(0, 0, 0, 0);
  return {
    orderId: rng.uuid(),
    refOrderId: `QWI-ONDC-${pad(created.getDate())}${pad(created.getMonth() + 1)}${String(created.getFullYear()).slice(2)}-C${rng.digits(1)}${rng.letters(3)}${rng.digits(1)}`,
    buyerId: db.buyer.id, customerId: c.id, customerName: c.customer_name, customerBusinessName: c.business_name, customerMobileNumber: c.mobile_number,
    address: { line: c.address.split(', ').slice(1, -1).join(', ') || c.address, locality: c.locality, city: 'Hyderabad', state: 'Telangana', country: 'INDIA', pincode: c.pincode },
    lat: Number(c.latitude), lng: Number(c.longitude), amount: round2(items.reduce((s, it) => s + it.totalAmount, 0)), orderWeight: weight,
    volumetricWeight: round2(weight * 1.08), orderType: 'Digital', salesPersonName: null, salesBeatName: beat?.name ?? null, beatId: beat?.id ?? null,
    createdAt: createdIso, orderDate: localYmdHms(createdIso), deliveryDate: deliveryDay.toISOString(), orderStatusId: statusId, validationErrors: [],
    isDeliveryAddressUpdated: false, tripId, tripHistory: tripId ? [tripId] : [], items, rtoReasonId: null, returnReason: null,
    routePlanComboId: null, statusBeforeOffline: null, source: 'connector', deliveryMode: 'cds', cdsSentAt: null, cdsServiceCenterId: null,
  };
}

/** A CDS drop point: the CDS service center drops each retailer's goods at the CDS point for the retailer's area.
 *  Sample data only (names and addresses are illustrative). */
export interface CdsPoint {
  id: string;
  name: string;
  address: string;
}
export const CDS_POINTS: CdsPoint[] = [
  { id: 'cds-point-1', name: 'CDS Point - Dilsukhnagar', address: 'Plot 21, Chaitanyapuri Main Road, Dilsukhnagar, Hyderabad 500060' },
  { id: 'cds-point-2', name: 'CDS Point - Uppal', address: 'H.No 2-4-118, Ramanthapur Road, Uppal, Hyderabad 500039' },
  { id: 'cds-point-3', name: 'CDS Point - Ameerpet', address: 'Shop 7, Mythrivanam Lane, Ameerpet, Hyderabad 500016' },
];
/** Retailer locality → CDS point (index in CDS_POINTS): south-east, north-east and west Hyderabad. */
const CDS_POINT_BY_LOCALITY: Record<string, number> = {
  Dilsukhnagar: 0, Kothapet: 0, Vanasthalipuram: 0, Hayathnagar: 0, 'LB Nagar': 0, Saroornagar: 0,
  Uppal: 1, Boduppal: 1, Secunderabad: 1, Tarnaka: 1,
  Kukatpally: 2, Moosapet: 2, Ameerpet: 2, Begumpet: 2, Mehdipatnam: 2, Tolichowki: 2,
};
/** CDS point of a retailer, from the retailer's locality. Derived on every request, so mock databases seeded before
 *  CDS points existed get them too. An unknown locality uses the first point. */
export function cdsPointForLocality(locality: string | null | undefined): CdsPoint {
  return CDS_POINTS[CDS_POINT_BY_LOCALITY[String(locality ?? '')] ?? 0];
}
const FULL_RETURN_REASON = 'Customer refused – shop closed';
const PARTIAL_RETURN_REASON = 'Damaged product';

/** Bumped when the CDS demo data changes shape; an older version is replaced on the next request. */
const CDS_SEED_VERSION = 4;

type StopPlan = 'assigned' | 'pending' | 'out' | 'at' | 'delivered';

interface CdsTripPlan {
  center: number;
  /** 1 Planned · 2 In Progress · 3 Completed */
  status: 1 | 2 | 3;
  dayOffset: number;
  customers: number[];
  stops: StopPlan[];
  charges: number;
  distanceKm: string;
}

/** Consolidated Delivery trips. No returns: the trip ends when the goods reach the CDS service center. */
const PLANS: CdsTripPlan[] = [
  { center: 0, status: 1, dayOffset: 1, customers: [2, 6, 9, 14], stops: ['assigned', 'assigned', 'assigned', 'assigned'], charges: 980, distanceKm: '21.40' },
  { center: 1, status: 2, dayOffset: 0, customers: [4, 12, 19], stops: ['delivered', 'at', 'out'], charges: 860, distanceKm: '17.80' },
  { center: 0, status: 3, dayOffset: -1, customers: [7, 15, 21, 27], stops: ['delivered', 'delivered', 'delivered', 'delivered'], charges: 1040, distanceKm: '24.10' },
  { center: 1, status: 3, dayOffset: -2, customers: [5, 10, 18, 23], stops: ['delivered', 'delivered', 'delivered', 'delivered'], charges: 990, distanceKm: '22.70' },
  { center: 0, status: 3, dayOffset: -3, customers: [8, 16, 24], stops: ['delivered', 'delivered', 'delivered'], charges: 870, distanceKm: '19.30' },
];

const STOP_STATUS: Record<StopPlan, { status: string; displayStatus: string; order: number }> = {
  assigned: { status: 'Agent-assigned', displayStatus: 'Agent Assigned', order: 3 },
  pending: { status: 'Pending', displayStatus: 'Pending', order: 3 },
  out: { status: 'Out-for-delivery', displayStatus: 'Out For Delivery', order: 4 },
  at: { status: 'At-delivery', displayStatus: 'At Delivery', order: 4 },
  delivered: { status: 'Order-delivered', displayStatus: 'Order Delivered', order: 5 },
};

interface ReturnPlan {
  center: number;
  /** 1 Planned · 2 In Progress · 3 Completed (return OTP confirmed) */
  status: 1 | 2 | 3;
  dayOffset: number;
  /** Returned orders: [index in PLANS then HISTORY_PLANS, stop index in that trip, full or partial return].
   *  Only completed delivery trips. */
  returns: [number, number, 'full' | 'partial'][];
  charges: number;
  distanceKm: string;
}

/** Consolidated Returns trips: the CDS service center brings the retailers' returns back to the distributor. */
const RETURN_PLANS: ReturnPlan[] = [
  { center: 0, status: 1, dayOffset: 1, returns: [[2, 0, 'full'], [2, 2, 'partial'], [2, 3, 'partial']], charges: 720, distanceKm: '18.60' },
  { center: 1, status: 2, dayOffset: 0, returns: [[4, 2, 'full']], charges: 540, distanceKm: '15.20' },
  { center: 1, status: 3, dayOffset: -1, returns: [[3, 0, 'full'], [3, 1, 'partial']], charges: 640, distanceKm: '16.90' },
  { center: 0, status: 3, dayOffset: -2, returns: [[4, 1, 'partial']], charges: 520, distanceKm: '14.30' },
];

/** History: completed Consolidated Delivery trips over the past four weeks, so the Performance Report for a month
 *  has data (PLANS cover only the last few days). They follow PLANS, so their indexes start at PLANS.length. */
const HISTORY_DAYS = [-5, -7, -9, -12, -14, -16, -19, -21, -23, -26];
const HISTORY_PLANS: CdsTripPlan[] = HISTORY_DAYS.map((dayOffset, k) => {
  const stops = 3 + (k % 2);
  return {
    center: k % 2,
    status: 3,
    dayOffset,
    customers: Array.from({ length: stops }, (_, j) => (k * 5 + j * 9 + 3) % 40),
    stops: Array.from({ length: stops }, () => 'delivered' as const),
    charges: 820 + ((k * 37) % 260),
    distanceKm: (16.4 + ((k * 13) % 10)).toFixed(2),
  };
});
/** Completed Consolidated Returns trips for the history above (indexes as in PLANS + HISTORY_PLANS). */
const HISTORY_RETURN_PLANS: ReturnPlan[] = [
  { center: 0, status: 3, dayOffset: -4, returns: [[5, 0, 'partial']], charges: 480, distanceKm: '12.40' },
  { center: 1, status: 3, dayOffset: -6, returns: [[6, 1, 'full'], [6, 2, 'partial']], charges: 610, distanceKm: '15.80' },
  { center: 0, status: 3, dayOffset: -8, returns: [[7, 0, 'partial']], charges: 500, distanceKm: '13.10' },
  { center: 1, status: 3, dayOffset: -13, returns: [[9, 2, 'full']], charges: 560, distanceKm: '14.70' },
  { center: 0, status: 3, dayOffset: -18, returns: [[11, 0, 'partial'], [11, 1, 'partial']], charges: 590, distanceKm: '15.20' },
  { center: 1, status: 3, dayOffset: -22, returns: [[13, 2, 'full']], charges: 530, distanceKm: '13.90' },
];

/** Adds the CDS trips once per CDS_SEED_VERSION. Returns true when it changed the database (the caller persists). */
export function ensureCdsTrips(db: MockDatabase): boolean {
  if (db.ext.cdsSeeded === CDS_SEED_VERSION) return false;
  if (!db.customers.length || !db.products.length || !db.drivers.length) return false;
  // Remove the CDS trips and orders of an earlier version of this demo (orders on a CDS trip, and CDS orders that
  // wait for one).
  const oldTrips = new Set(db.trips.filter((t) => t.channel).map((t) => t.logisticsOrderId));
  if (oldTrips.size) db.trips = db.trips.filter((t) => !oldTrips.has(t.logisticsOrderId));
  db.orders = db.orders.filter((o) => !(o.tripId && oldTrips.has(o.tripId)) && o.deliveryMode !== 'cds');
  // The recent trips keep their own sequence, so their trip numbers do not change when the history is added.
  let rng = cdsRng(20261114);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warehouse = db.addresses.find((a) => a.is_default) || db.addresses[0];
  const vehicle = db.vehicles[1] || db.vehicles[0];

  const makeItems = (count: number): DbOrderItem[] => {
    const chosen = new Set<number>();
    while (chosen.size < Math.min(count, db.products.length)) chosen.add(rng.int(0, db.products.length - 1));
    return Array.from(chosen).map((pi) => {
      const p = db.products[pi];
      const qty = p.weightKg >= 10 ? rng.int(2, 4) : rng.int(8, 30);
      return {
        itemId: rng.uuid(), productId: p.id, itemName: p.name, quantity: qty, mrp: p.mrp, sellingPrice: p.sellingPrice,
        totalAmount: round2(qty * p.sellingPrice), weightKg: p.weightKg, upc: p.upc, gstPercentage: p.gstPercentage, hsnCode: p.hsnCode,
        imageUrl: p.imageUrl, uom: p.uom, packageType: p.packageType, deliveredQuantity: 0, returnedQuantity: 0,
      };
    });
  };

  const deliveryTrips: { trip: DbTrip; orders: DbOrder[] }[] = [];
  const addDeliveryTrip = (plan: CdsTripPlan, ti: number) => {
    const createdAt = isoAt(today, plan.dayOffset - 1, 17, 10 + ti * 7);
    const pickupSlotStart = isoAt(today, plan.dayOffset, 7, 0);
    const startTime = plan.status >= 2 ? isoAt(today, plan.dayOffset, 7, 20) : null;
    const logisticsOrderId = rng.uuid();
    const tripNo = (() => {
      const d = new Date(createdAt);
      return `CDS-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}-${rng.letters(4)}`;
    })();
    const pickupOtp = rng.digits(4);
    const rtoOtp = rng.digits(4);
    const driver = db.drivers[(ti + 2) % db.drivers.length];
    const helper = db.helpers.length ? db.helpers[(ti + 1) % db.helpers.length] : null;

    const orders: DbOrder[] = [];
    const stops: DbStop[] = [
      {
        id: rng.uuid(), fulfillmentId: rng.uuid(), deliveryType: 'Batch', sequenceOrder: 0, customerId: null, orderIds: [],
        status: plan.status === 1 ? 'Pending' : 'Order-picked-up', displayStatus: plan.status === 1 ? 'Pending' : 'Order Picked Up',
        stateTimestamp: plan.status === 1 ? pickupSlotStart : startTime, pickupOtp, deliveryOtp: null, rtoOtp: null,
        gps: `${warehouse.latitude},${warehouse.longitude}`,
        address: { name: db.buyer.businessName, building: 'warehouse', locality: warehouse.address_line1, city: warehouse.city, state: 'Telangana', country: 'India', areaCode: warehouse.address_line1, pincode: warehouse.pincode },
        contact: { name: db.buyer.businessName, phone: db.buyer.mobileNumber },
      },
    ];

    plan.customers.forEach((ci, si) => {
      const c = db.customers[ci % db.customers.length];
      const beat = db.beats.find((b) => b.id === c.beatId) || null;
      const st = STOP_STATUS[plan.stops[si]];
      const items = makeItems(rng.int(2, 3));
      items.forEach((it) => {
        if (st.order === 5) it.deliveredQuantity = it.quantity;
      });
      const amount = round2(items.reduce((s, it) => s + it.totalAmount, 0));
      const weight = round2(items.reduce((s, it) => s + it.weightKg * it.quantity, 0));
      const orderDateIso = isoAt(today, plan.dayOffset - 2, 9, 15 + si * 6);
      const od = new Date(orderDateIso);
      const order: DbOrder = {
        orderId: rng.uuid(),
        refOrderId: `QWI-ONDC-${pad(od.getDate())}${pad(od.getMonth() + 1)}${String(od.getFullYear()).slice(2)}-C${rng.digits(1)}${rng.letters(3)}${rng.digits(1)}`,
        buyerId: db.buyer.id, customerId: c.id, customerName: c.customer_name, customerBusinessName: c.business_name, customerMobileNumber: c.mobile_number,
        address: { line: c.address.split(', ').slice(1, -1).join(', ') || c.address, locality: c.locality, city: 'Hyderabad', state: 'Telangana', country: 'INDIA', pincode: c.pincode },
        lat: Number(c.latitude), lng: Number(c.longitude), amount, orderWeight: weight, volumetricWeight: round2(weight * 1.08),
        orderType: 'Digital', salesPersonName: null, salesBeatName: beat?.name ?? null, beatId: beat?.id ?? null,
        createdAt: isoAt(today, plan.dayOffset - 2, 10, 5 + si * 6),
        orderDate: localYmdHms(orderDateIso), deliveryDate: isoAt(today, plan.dayOffset, 0, 0), orderStatusId: st.order, validationErrors: [],
        isDeliveryAddressUpdated: false, tripId: logisticsOrderId, tripHistory: [logisticsOrderId], items,
        rtoReasonId: null, returnReason: null,
        routePlanComboId: null, statusBeforeOffline: null, source: 'connector',
        // Confirmed as CDS in Seller Store; LBNP sent it to the service center 40 minutes after it arrived.
        deliveryMode: 'cds', cdsSentAt: isoAt(today, plan.dayOffset - 2, 10, 45 + si * 6), cdsServiceCenterId: `cds-center-${plan.center + 1}`,
      };
      orders.push(order);
      const ts =
        plan.status === 1 ? pickupSlotStart
        : st.status === 'Order-delivered' ? isoAt(today, plan.dayOffset, 9 + si, 10 + si * 5)
        : startTime;
      stops.push({
        id: rng.uuid(), fulfillmentId: rng.uuid(), deliveryType: 'Delivery', sequenceOrder: si + 1, customerId: c.id, orderIds: [order.orderId],
        status: st.status, displayStatus: st.displayStatus, stateTimestamp: ts, pickupOtp, deliveryOtp: rng.digits(4), rtoOtp,
        gps: `${c.latitude},${c.longitude}`,
        address: { name: c.business_name, building: c.business_name, locality: c.address.split(', ').slice(1).join(', '), city: 'Hyderabad', state: 'Telangana', country: 'INDIA', areaCode: c.pincode, pincode: c.pincode },
        contact: { name: '', phone: c.mobile_number, email: 'info@example.com' },
      });
    });

    const centerName = CDS_CENTERS[plan.center];
    const trip: DbTrip = {
      logisticsOrderId, orderId: tripNo, buyerId: db.buyer.id, providerId: `cds-center-${plan.center + 1}`, providerName: centerName,
      transactionId: `txn_${rng.uuid()}`, categoryId: 'Next Day Delivery', status: plan.status, createdAt, startTime,
      pickupSlotStart, pickupSlotEnd: 'PT2H', deliveryTatDuration: 'P1D',
      endTime: plan.status === 3 ? isoAt(today, plan.dayOffset, 14, 30) : null,
      deliveryPrice: plan.charges.toFixed(2), rtoPrice: '0.00',
      vehicleId: vehicle?.id ?? null, vehicleRegNumber: vehicle?.registrationNumber ?? null, vehicleType: vehicle?.vehicleType ?? 'truck',
      vehicleVolumetricCapacityKg: vehicle?.volumetricCapacityKg ?? '',
      agentId: driver.id, agentName: driver.name, agentMobileNumber: driver.phone,
      helperId: helper?.id ?? null, helperName: helper?.name ?? null, helperMobileNumber: helper?.phone ?? null,
      estimatedTimeToDelivery: '110', totalDistance: plan.distanceKm, maxStopCount: '35',
      suggestedVehicleRegNumber: vehicle?.registrationNumber ?? '', suggestedVehicleCapacityKg: vehicle?.volumetricCapacityKg ?? '',
      stops, orderIds: orders.map((o) => o.orderId), routePlanComboId: null, cancelReason: null,
      channel: 'cds',
    };
    db.orders.push(...orders);
    db.trips.push(trip);
    deliveryTrips.push({ trip, orders });
  };

  // Consolidated Returns: each returned order comes from a completed Consolidated Delivery trip above.
  const addReturnTrip = (plan: ReturnPlan, ri: number) => {
    const createdAt = isoAt(today, plan.dayOffset - 1, 18, 5 + ri * 7);
    const pickupSlotStart = isoAt(today, plan.dayOffset, 8, 0);
    const startTime = plan.status >= 2 ? isoAt(today, plan.dayOffset, 8, 15) : null;
    const logisticsOrderId = rng.uuid();
    const tripNo = (() => {
      const d = new Date(createdAt);
      return `CDSR-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}-${rng.letters(4)}`;
    })();
    const pickupOtp = rng.digits(4);
    const rtoOtp = rng.digits(4);
    const driver = db.drivers[(ri + 4) % db.drivers.length];
    const helper = db.helpers.length ? db.helpers[(ri + 2) % db.helpers.length] : null;
    const done = plan.status === 3;

    const returned = plan.returns.map(([ti, si, kind]) => ({ order: deliveryTrips[ti].orders[si], kind }));
    // The goods are collected at the CDS point of the first retailer and handed over at the distributor's warehouse.
    const firstCustomer = db.customers.find((c) => c.id === returned[0].order.customerId);
    const point = cdsPointForLocality(firstCustomer?.locality);
    const stops: DbStop[] = [
      {
        id: rng.uuid(), fulfillmentId: rng.uuid(), deliveryType: 'Batch', sequenceOrder: 0, customerId: null, orderIds: [],
        status: plan.status === 1 ? 'Pending' : 'Order-picked-up', displayStatus: plan.status === 1 ? 'Pending' : 'Order Picked Up',
        stateTimestamp: plan.status === 1 ? pickupSlotStart : startTime, pickupOtp, deliveryOtp: null, rtoOtp: null,
        gps: `${warehouse.latitude},${warehouse.longitude}`,
        address: { name: point.name, building: point.name, locality: point.address, city: 'Hyderabad', state: 'Telangana', country: 'India', areaCode: point.address, pincode: warehouse.pincode },
        contact: { name: CDS_CENTERS[plan.center], phone: db.buyer.mobileNumber },
      },
    ];
    returned.forEach(({ order, kind }, si) => {
      order.items.forEach((it) => {
        it.returnedQuantity = kind === 'full' ? it.quantity : Math.max(1, Math.floor(it.quantity / 4));
        it.deliveredQuantity = it.quantity - it.returnedQuantity;
      });
      order.orderStatusId = kind === 'full' ? 8 : 6;
      order.rtoReasonId = kind === 'full' ? 103 : null;
      order.returnReason = kind === 'full' ? FULL_RETURN_REASON : PARTIAL_RETURN_REASON;
      order.tripHistory = [...(order.tripHistory || []), logisticsOrderId];
      const c = db.customers.find((x) => x.id === order.customerId)!;
      stops.push({
        id: rng.uuid(), fulfillmentId: rng.uuid(), deliveryType: 'Delivery', sequenceOrder: si + 1, customerId: c.id, orderIds: [order.orderId],
        // A full return reads as returned; a partial one keeps its status out of the RTO set so only the returned
        // quantity counts (see returnedQtyOnStop in routes/trips.ts).
        status: kind === 'full' ? (done ? 'RTO-Delivered' : 'RTO-Initiated') : done ? 'Order-delivered' : 'Pending',
        displayStatus: kind === 'full' ? 'Returned' : 'Partial Return',
        stateTimestamp: done ? isoAt(today, plan.dayOffset, 11 + si, 5 + si * 7) : plan.status === 2 ? startTime : pickupSlotStart,
        pickupOtp, deliveryOtp: rng.digits(4), rtoOtp,
        gps: `${c.latitude},${c.longitude}`,
        address: { name: c.business_name, building: c.business_name, locality: c.address.split(', ').slice(1).join(', '), city: 'Hyderabad', state: 'Telangana', country: 'INDIA', areaCode: c.pincode, pincode: c.pincode },
        contact: { name: '', phone: c.mobile_number, email: 'info@example.com' },
      });
    });

    db.trips.push({
      logisticsOrderId, orderId: tripNo, buyerId: db.buyer.id, providerId: `cds-center-${plan.center + 1}`, providerName: CDS_CENTERS[plan.center],
      transactionId: `txn_${rng.uuid()}`, categoryId: 'Next Day Delivery', status: plan.status, createdAt, startTime,
      pickupSlotStart, pickupSlotEnd: 'PT2H', deliveryTatDuration: 'P1D',
      endTime: done ? isoAt(today, plan.dayOffset, 13, 40) : null,
      deliveryPrice: plan.charges.toFixed(2), rtoPrice: '0.00',
      vehicleId: vehicle?.id ?? null, vehicleRegNumber: vehicle?.registrationNumber ?? null, vehicleType: vehicle?.vehicleType ?? 'truck',
      vehicleVolumetricCapacityKg: vehicle?.volumetricCapacityKg ?? '',
      agentId: driver.id, agentName: driver.name, agentMobileNumber: driver.phone,
      helperId: helper?.id ?? null, helperName: helper?.name ?? null, helperMobileNumber: helper?.phone ?? null,
      estimatedTimeToDelivery: '90', totalDistance: plan.distanceKm, maxStopCount: '35',
      suggestedVehicleRegNumber: vehicle?.registrationNumber ?? '', suggestedVehicleCapacityKg: vehicle?.volumetricCapacityKg ?? '',
      stops, orderIds: returned.map((r) => r.order.orderId), routePlanComboId: null, cancelReason: null,
      channel: 'cds-returns',
    });
  };

  PLANS.forEach(addDeliveryTrip);
  RETURN_PLANS.forEach(addReturnTrip);
  // The four weeks of history use a second sequence (see above).
  rng = cdsRng(20261115);
  HISTORY_PLANS.forEach((plan, k) => addDeliveryTrip(plan, PLANS.length + k));
  HISTORY_RETURN_PLANS.forEach((plan, k) => addReturnTrip(plan, RETURN_PLANS.length + k));

  // CDS orders confirmed today that the service center has not put on a trip yet. With routing on (the default)
  // LBNP has already sent them, so they show only in Settings → Delivery → CDS Order Routing, as "Sent".
  rng = cdsRng(20261116);
  const routing = cdsRoutingConfig(db);
  [1, 11, 17, 33].forEach((ci, k) => {
    const created = new Date(Date.now() - (k + 1) * 47 * 60000);
    const order = buildCdsOrder(db, rng, db.customers[ci % db.customers.length], created, 1, null);
    if (routing.enabled) {
      order.cdsSentAt = new Date(created.getTime() + 5 * 60000).toISOString();
      order.cdsServiceCenterId = routing.serviceCenterId;
    }
    db.orders.push(order);
  });

  db.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  db.trips.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  db.ext.cdsSeeded = CDS_SEED_VERSION;
  return true;
}
