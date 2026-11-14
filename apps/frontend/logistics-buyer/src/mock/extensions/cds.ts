// CDS seed extension: trips the CDS (cross-dock) service center created for this distributor's orders that were
// already confirmed as 3PL + CDS. They carry `channel: 'cds'`, so they appear only on the CDS tab
// (Pickup Indents / Credit Notes) and never on the Trips page, which lists 3PL trips.
//
// Five trips: Planned (pickup tomorrow), In Progress, Completed (all delivered), and two Completed trips where
// retailers returned goods (one full return + one partial return, and one partial return). The two trips with
// returns are the ones listed under Credit Notes.
//
// This file exports no `seed`: buildSeed() calls `ensureCdsTrips()` after every other extension has run, so no
// other demo (issues, orders, trip tweaks) picks a CDS trip or order. Browsers that seeded the mock DB before this
// file existed get the trips on first use: the trips list route calls `ensureCdsTrips()` too, which adds them once
// (flag `db.ext.cdsSeeded`) without resetting any other demo data.
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

const CDS_CENTERS = ['CDS Service Center - Kukatpally', 'CDS Service Center - Uppal'];

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

type StopPlan = 'assigned' | 'pending' | 'out' | 'at' | 'delivered' | 'returned' | 'partial';

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

const PLANS: CdsTripPlan[] = [
  { center: 0, status: 1, dayOffset: 1, customers: [2, 6, 9, 14], stops: ['assigned', 'assigned', 'assigned', 'assigned'], charges: 980, distanceKm: '21.40' },
  { center: 1, status: 2, dayOffset: 0, customers: [4, 12, 19], stops: ['delivered', 'at', 'out'], charges: 860, distanceKm: '17.80' },
  { center: 0, status: 3, dayOffset: -1, customers: [7, 15, 21, 27], stops: ['delivered', 'delivered', 'delivered', 'delivered'], charges: 1040, distanceKm: '24.10' },
  { center: 1, status: 3, dayOffset: -2, customers: [5, 10, 18, 23], stops: ['returned', 'partial', 'delivered', 'delivered'], charges: 990, distanceKm: '22.70' },
  { center: 0, status: 3, dayOffset: -3, customers: [8, 16, 24], stops: ['delivered', 'partial', 'delivered'], charges: 870, distanceKm: '19.30' },
];

const STOP_STATUS: Record<StopPlan, { status: string; displayStatus: string; order: number }> = {
  assigned: { status: 'Agent-assigned', displayStatus: 'Agent Assigned', order: 3 },
  pending: { status: 'Pending', displayStatus: 'Pending', order: 3 },
  out: { status: 'Out-for-delivery', displayStatus: 'Out For Delivery', order: 4 },
  at: { status: 'At-delivery', displayStatus: 'At Delivery', order: 4 },
  delivered: { status: 'Order-delivered', displayStatus: 'Order Delivered', order: 5 },
  returned: { status: 'RTO', displayStatus: 'Returned', order: 8 },
  partial: { status: 'Order-delivered', displayStatus: 'Partial Delivered', order: 6 },
};

/** Adds the CDS trips once. Returns true when it changed the database (the caller then persists it). */
export function ensureCdsTrips(db: MockDatabase): boolean {
  if (db.ext.cdsSeeded) return false;
  if (!db.customers.length || !db.products.length || !db.drivers.length) return false;
  const rng = cdsRng(20261114);
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

  PLANS.forEach((plan, ti) => {
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
        if (st.order === 8) it.returnedQuantity = it.quantity;
        if (st.order === 6) {
          it.returnedQuantity = Math.max(1, Math.floor(it.quantity / 4));
          it.deliveredQuantity = it.quantity - it.returnedQuantity;
        }
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
        rtoReasonId: st.order === 8 ? 103 : null,
        returnReason: st.order === 8 ? FULL_RETURN_REASON : st.order === 6 ? PARTIAL_RETURN_REASON : null,
        routePlanComboId: null, statusBeforeOffline: null, source: 'connector',
      };
      orders.push(order);
      const ts =
        plan.status === 1 ? pickupSlotStart
        : st.status === 'Order-delivered' || st.status === 'RTO' ? isoAt(today, plan.dayOffset, 9 + si, 10 + si * 5)
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
  });

  db.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  db.trips.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  db.ext.cdsSeeded = true;
  return true;
}
