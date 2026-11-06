// Trips seed extension: extra trips / tweaks so every Trips, Trip Details and map state can be seen.
//
// Adds (on top of the 13 core trips):
//  - one In Progress trip still "At Pickup" (cancellable In Progress case, ≤ 3 locations → no "Show More Stops",
//    no "Order Picked Up" stop → Estimated Completion "-"). It re-delivers the seed's returned-then-RFP order, so
//    that order's old Completed trip shows a Returned stop that is no longer the latest trip (no RFP button).
//  - one Delayed (status 5) trip with no vehicle / driver / helper, empty pickup slot (→ "NaN-NaN-NaN 12:NaN AM"),
//    maxStopCount 0 / distance 0 (→ "N/A"), no tracking hops (blank single map) and no route details.
//  - a small 300 kg vehicle so the Edit Resource capacity warning can be triggered.
// Tweaks: the first Planned trip gets a driver + helper and the second none (same pickup date → helper / driver
// conflict "already assigned to another active trip"), and one Completed trip is delivered out of the planned
// order (planned vs delivered paths differ on the map).
// Per-trip demo flags live in `db.ext.tripsDemo` (read by src/mock/routes/trips.ts).
import type { MockDatabase, Rng } from '../seed';
import type { DbOrder, DbOrderItem, DbStop, DbTrip, DbVehicle } from '../types';

export interface TripsDemoExt {
  /** Trip numbers whose hop-path tracking returns no hops. */
  noTrackingTrips: string[];
  /** Trip numbers whose route details are null ("not available" panel). */
  noRouteDetailsTrips: string[];
  /** Mirrors buyer.buyerType === 'DARKSTORE' (toggle with window.__lbnpTrips.setDarkStore(true)). */
  darkStore: boolean;
}

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
const tripNumber = (iso: string, rng: Rng) => {
  const d = new Date(iso);
  return `Q-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${rng.letters(4)}`;
};

/** Planned trip stops follow the driver: Agent-assigned when a driver is set, Pending otherwise. */
function syncPlannedStops(t: DbTrip) {
  t.stops.forEach((s) => {
    if (s.deliveryType !== 'Delivery') return;
    if (t.agentId) {
      s.status = 'Agent-assigned';
      s.displayStatus = 'Agent Assigned';
    } else {
      s.status = 'Pending';
      s.displayStatus = 'Pending';
    }
  });
}

export const seed = (db: MockDatabase, rng: Rng) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ext: TripsDemoExt = { noTrackingTrips: [], noRouteDetailsTrips: [], darkStore: false };
  db.ext.tripsDemo = ext;

  // ------------------------------------------------------------ small vehicle (capacity warning)
  const smallVehicle: DbVehicle = {
    ...db.vehicles[0],
    id: rng.uuid(),
    name: 'TS13EB6142',
    registrationNumber: 'TS13EB6142',
    weightCapacityKg: '300.00',
    volumetricCapacityKg: '300.00',
    length: '180.00',
    height: '120.00',
    breadth: '110.00',
    ownershipType: 'Leased',
    vehicleType: 'three wheeler',
  };
  if (!db.vehicles.some((v) => v.registrationNumber === smallVehicle.registrationNumber)) db.vehicles.push(smallVehicle);

  // ------------------------------------------------------------ planned trip resources (conflict demo)
  const planned = db.trips.filter((t) => t.status === 1).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (planned[0]) {
    const p = planned[0];
    const driver = db.drivers[0];
    const helper = db.helpers[0];
    p.agentId = driver.id;
    p.agentName = driver.name;
    p.agentMobileNumber = driver.phone;
    p.helperId = helper.id;
    p.helperName = helper.name;
    p.helperMobileNumber = helper.phone;
    syncPlannedStops(p);
  }
  if (planned[1]) {
    const p = planned[1];
    p.agentId = null;
    p.agentName = null;
    p.agentMobileNumber = null;
    p.helperId = null;
    p.helperName = null;
    p.helperMobileNumber = null;
    syncPlannedStops(p);
  }
  // other planned trips must not reuse helper[0] / driver[0] (keeps exactly one known conflict)
  planned.slice(2).forEach((p) => {
    if (p.helperId === db.helpers[0].id) {
      p.helperId = db.helpers[1].id;
      p.helperName = db.helpers[1].name;
      p.helperMobileNumber = db.helpers[1].phone;
    }
    if (p.agentId === db.drivers[0].id) {
      p.agentId = db.drivers[1].id;
      p.agentName = db.drivers[1].name;
      p.agentMobileNumber = db.drivers[1].phone;
    }
  });

  // ------------------------------------------------------------ out-of-order delivery on one completed trip
  const completed = db.trips.filter((t) => t.status === 3);
  const ooo = completed.find((t) => t.stops.filter((s) => s.deliveryType === 'Delivery').length >= 4);
  if (ooo) {
    const ds = ooo.stops.filter((s) => s.deliveryType === 'Delivery');
    const a = ds[1];
    const b = ds[2];
    const tmp = a.stateTimestamp;
    a.stateTimestamp = b.stateTimestamp;
    b.stateTimestamp = tmp;
  }

  // ------------------------------------------------------------ helpers to build extra trips
  const warehouse = db.addresses.find((a) => a.is_default) || db.addresses[0];
  const makeItems = (count: number): DbOrderItem[] => {
    const chosen = new Set<number>();
    while (chosen.size < count) chosen.add(rng.int(0, db.products.length - 1));
    return Array.from(chosen).map((pi) => {
      const p = db.products[pi];
      const qty = p.weightKg >= 10 ? rng.int(1, 3) : rng.int(6, 30);
      return {
        itemId: rng.uuid(), productId: p.id, itemName: p.name, quantity: qty, mrp: p.mrp, sellingPrice: p.sellingPrice,
        totalAmount: round2(qty * p.sellingPrice), weightKg: p.weightKg, upc: p.upc, gstPercentage: p.gstPercentage, hsnCode: p.hsnCode,
        imageUrl: p.imageUrl, uom: p.uom, packageType: p.packageType, deliveredQuantity: 0, returnedQuantity: 0,
      };
    });
  };
  const makeOrder = (customerIdx: number, status: number, dayOffset: number): DbOrder => {
    const c = db.customers[customerIdx % db.customers.length];
    const beat = db.beats.find((b) => b.id === c.beatId) || null;
    const items = makeItems(rng.int(1, 3));
    const amount = round2(items.reduce((s, it) => s + it.totalAmount, 0));
    const weight = round2(items.reduce((s, it) => s + it.weightKg * it.quantity, 0));
    const createdAt = isoAt(today, dayOffset, rng.int(7, 12), rng.int(0, 59));
    const orderDateIso = isoAt(today, dayOffset - 1, 5, 30);
    const d = new Date(orderDateIso);
    return {
      orderId: rng.uuid(),
      refOrderId: `QWI-ONDC-${pad(d.getDate())}${pad(d.getMonth() + 1)}${String(d.getFullYear()).slice(2)}-${rng.letters(1)}${rng.digits(1)}${rng.letters(3)}${rng.digits(1)}`,
      buyerId: db.buyer.id, customerId: c.id, customerName: c.customer_name, customerBusinessName: c.business_name, customerMobileNumber: c.mobile_number,
      address: { line: c.address.split(', ').slice(1, -1).join(', ') || c.address, locality: c.locality, city: 'Hyderabad', state: 'Telangana', country: 'INDIA', pincode: c.pincode },
      lat: Number(c.latitude), lng: Number(c.longitude), amount, orderWeight: weight, volumetricWeight: round2(weight * 1.08),
      orderType: 'Digital', salesPersonName: null, salesBeatName: beat?.name ?? null, beatId: beat?.id ?? null, createdAt,
      orderDate: localYmdHms(orderDateIso), deliveryDate: isoAt(today, dayOffset + 1, 0, 0), orderStatusId: status, validationErrors: [],
      isDeliveryAddressUpdated: false, tripId: null, tripHistory: [], items, rtoReasonId: null, returnReason: null, routePlanComboId: null,
      statusBeforeOffline: null, source: 'connector',
    };
  };
  const batchStop = (status: string, display: string, ts: string | null, pickupOtp: string): DbStop => ({
    id: rng.uuid(), fulfillmentId: rng.uuid(), deliveryType: 'Batch', sequenceOrder: 0, customerId: null, orderIds: [],
    status, displayStatus: display, stateTimestamp: ts, pickupOtp, deliveryOtp: null, rtoOtp: null,
    gps: `${warehouse.latitude},${warehouse.longitude}`,
    address: { name: db.buyer.businessName, building: 'warehouse', locality: warehouse.address_line1, city: warehouse.city, state: 'Telangana', country: 'India', areaCode: warehouse.address_line1, pincode: warehouse.pincode },
    contact: { name: db.buyer.businessName, phone: db.buyer.mobileNumber },
  });
  const deliveryStops = (orders: DbOrder[], status: string, display: string, ts: string | null, pickupOtp: string, rtoOtp: string): DbStop[] => {
    const byCustomer = new Map<string, DbOrder[]>();
    orders.forEach((o) => {
      if (!byCustomer.has(o.customerId)) byCustomer.set(o.customerId, []);
      byCustomer.get(o.customerId)!.push(o);
    });
    let seq = 1;
    return Array.from(byCustomer.entries()).map(([customerId, os]) => {
      const c = db.customers.find((x) => x.id === customerId)!;
      return {
        id: rng.uuid(), fulfillmentId: rng.uuid(), deliveryType: 'Delivery' as const, sequenceOrder: seq++, customerId, orderIds: os.map((o) => o.orderId),
        status, displayStatus: display, stateTimestamp: ts, pickupOtp, deliveryOtp: rng.digits(4), rtoOtp, gps: `${c.latitude},${c.longitude}`,
        address: { name: c.business_name, building: c.business_name, locality: c.address.split(', ').slice(1).join(', '), city: 'Hyderabad', state: 'Telangana', country: 'INDIA', areaCode: c.pincode, pincode: c.pincode },
        contact: { name: '', phone: c.mobile_number, email: 'info@example.com' },
      };
    });
  };
  const provider = db.providers[2] || db.providers[0];

  // ------------------------------------------------------------ A. In Progress, still at pickup
  {
    const createdAt = isoAt(today, -1, 16, 42);
    const startTime = isoAt(today, 0, 6, 30);
    const logisticsOrderId = rng.uuid();
    const orders: DbOrder[] = [makeOrder(17, 3, -1)];
    // re-deliver the seed's "returned → moved back to RFP" order on this newer trip
    const redelivery = db.orders.find((o) => o.orderStatusId === 1 && o.tripHistory.length > 0);
    if (redelivery) {
      redelivery.orderStatusId = 3;
      redelivery.items.forEach((it) => {
        it.deliveredQuantity = 0;
      });
      orders.push(redelivery);
    } else orders.push(makeOrder(25, 3, -1));
    orders.forEach((o) => {
      o.tripId = logisticsOrderId;
      if (!o.tripHistory.includes(logisticsOrderId)) o.tripHistory.push(logisticsOrderId);
    });
    const pickupOtp = rng.digits(4);
    const rtoOtp = rng.digits(4);
    const vehicle = db.vehicles.find((v) => v.registrationNumber === 'TS07UB1180') || db.vehicles[2];
    const driver = db.drivers[4];
    const helper = db.helpers[3];
    const stops = [batchStop('At-pickup', 'At Pickup', startTime, pickupOtp), ...deliveryStops(orders, 'Agent-assigned', 'Agent Assigned', startTime, pickupOtp, rtoOtp)];
    const vol = round2(orders.reduce((s, o) => s + o.volumetricWeight, 0));
    const trip: DbTrip = {
      logisticsOrderId, orderId: tripNumber(createdAt, rng), buyerId: db.buyer.id, providerId: provider.id, providerName: provider.name,
      transactionId: `txn_${rng.uuid()}`, categoryId: 'Next Day Delivery', status: 2, createdAt, startTime,
      pickupSlotStart: isoAt(today, 0, 6, 0), pickupSlotEnd: 'PT2H', deliveryTatDuration: 'P1D', endTime: null,
      deliveryPrice: provider.basePrice.toFixed(2), rtoPrice: '0.00',
      vehicleId: vehicle.id, vehicleRegNumber: vehicle.registrationNumber, vehicleType: vehicle.vehicleType, vehicleVolumetricCapacityKg: vehicle.volumetricCapacityKg,
      agentId: driver.id, agentName: driver.name, agentMobileNumber: driver.phone,
      helperId: helper.id, helperName: helper.name, helperMobileNumber: helper.phone,
      estimatedTimeToDelivery: '96', totalDistance: '18.40', maxStopCount: '35',
      suggestedVehicleRegNumber: vehicle.registrationNumber, suggestedVehicleCapacityKg: vehicle.volumetricCapacityKg,
      stops, orderIds: orders.map((o) => o.orderId), routePlanComboId: null, cancelReason: null,
    };
    if (vol > Number(vehicle.volumetricCapacityKg)) trip.vehicleVolumetricCapacityKg = db.vehicles[1].volumetricCapacityKg;
    orders.forEach((o) => {
      if (!db.orders.includes(o)) db.orders.push(o);
    });
    db.trips.push(trip);
  }

  // ------------------------------------------------------------ B. Delayed, nothing assigned, no tracking
  {
    const createdAt = isoAt(today, -2, 18, 5);
    const logisticsOrderId = rng.uuid();
    const orders: DbOrder[] = [makeOrder(3, 3, -2), makeOrder(11, 3, -2), makeOrder(29, 3, -2)];
    orders.forEach((o) => {
      o.tripId = logisticsOrderId;
      o.tripHistory = [logisticsOrderId];
    });
    const pickupOtp = rng.digits(4);
    const rtoOtp = rng.digits(4);
    const stops = [batchStop('Pending', 'Pending', null, pickupOtp), ...deliveryStops(orders, 'Pending', 'Pending', null, pickupOtp, rtoOtp)];
    const p = db.providers[3] || db.providers[0];
    const trip: DbTrip = {
      logisticsOrderId, orderId: tripNumber(createdAt, rng), buyerId: db.buyer.id, providerId: p.id, providerName: p.name,
      transactionId: `txn_${rng.uuid()}`, categoryId: 'Standard Delivery', status: 5, createdAt, startTime: null,
      // empty pickup slot → the mapper formats the literal "N/A" → "NaN-NaN-NaN 12:NaN AM" (as-built)
      pickupSlotStart: '', pickupSlotEnd: 'PT2H', deliveryTatDuration: 'P1D', endTime: null,
      deliveryPrice: '', rtoPrice: '0.00',
      vehicleId: null, vehicleRegNumber: null, vehicleType: 'truck', vehicleVolumetricCapacityKg: '',
      agentId: null, agentName: null, agentMobileNumber: null, helperId: null, helperName: null, helperMobileNumber: null,
      estimatedTimeToDelivery: 'PT5H', totalDistance: '0', maxStopCount: '0',
      suggestedVehicleRegNumber: '', suggestedVehicleCapacityKg: '',
      stops, orderIds: orders.map((o) => o.orderId), routePlanComboId: null, cancelReason: null,
    };
    orders.forEach((o) => db.orders.push(o));
    db.trips.push(trip);
    ext.noTrackingTrips.push(trip.orderId);
    ext.noRouteDetailsTrips.push(trip.orderId);
  }

  db.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  db.trips.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
