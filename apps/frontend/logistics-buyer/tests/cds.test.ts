// Unit tests for the CDS business rules (src/cds/engine.ts). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CdsEngine, CdsError, localDay, type SkuLine } from '../src/cds/engine.ts';
import { buildCdsMasters, buildCdsState } from '../src/cds/seed.ts';
import { pointInPolygon, ringAreaKm2, serviceStoreFor } from '../src/cds/planning.ts';
import { buildReport } from '../src/cds/reports.ts';
import type { CdsState } from '../src/cds/types.ts';
import { products, retailers } from './fixtures.ts';

const SC = 'Service Centre Admin';
const DP = 'Delivery Partner App';
const today = localDay(new Date());
const tomorrow = localDay(new Date(Date.now() + 86400000));
const sku = (i: number, qty: number): SkuLine => ({ sku: `SKU${1001 + i}`, name: products[i].name, unitPrice: products[i].price, unitWeightKg: products[i].weightKg, qty });
const throwsCds = (fn: () => unknown, re: RegExp) => assert.throws(fn, (e: unknown) => e instanceof CdsError && re.test(e.message), re.source);
// fixture retailers: index 0–11 Uppal/Boduppal/Tarnaka/Secunderabad (CDS Uppal), 12–23 Dilsukhnagar… (CDS Dilsukhnagar), 24+ Kukatpally… , 42+ Vanasthalipuram (no CDS)
const RT = { upl: 'rt-0-0', upl2: 'rt-1-1', dsn: 'rt-4-0', kkp: 'rt-8-0', none: 'rt-14-0' };

function setup() {
  const s: CdsState = buildCdsMasters(retailers);
  const e = new CdsEngine(s);
  let code = 111111;
  e.otpCode = () => String(++code);
  let n = 0;
  const order = (dist: string, retailerId: string, lines: SkuLine[], paymentMode: 'COD' | 'PREPAID' = 'COD') =>
    e.allocateCdsOrder({ sellerOrderRef: `T-${++n}`, distributorId: dist, retailerId, lines, paymentMode });
  const free = (owner: string, date = today, i = 0) => {
    const r = e.resources(owner, date);
    return { vehicleId: r.vehicles.filter((v) => v.available).sort((a, b) => b.capacityKg - a.capacityKg)[i].id, deliveryPersonId: r.deliveryPersons.filter((p) => p.available)[i].id };
  };
  /** OTP + complete (as the delivery person). */
  const done = (tripId: string, stopIdx: number, input: Record<string, unknown> = {}) => {
    const st = e.trip(tripId).stops[stopIdx];
    const otp = e.sendOtp(tripId, st.id, DP);
    const r = e.completeStop(tripId, st.id, { ...input, otp: otp.code }, DP);
    if (r.error) throw r.error;
    return e.trip(tripId);
  };
  return { s, e, order, free, done };
}

test('seed replays the full workflow without errors', () => {
  const s = buildCdsState(retailers, products);
  assert.ok(s.otps.every((o) => o.status === 'VERIFIED'));
  assert.ok(s.trips.every((t) => ['DISTRIBUTOR_PICKUP', 'CDS_DELIVERY', 'RETAILER_DELIVERY'].includes(t.type)), 'no return trips');
  assert.ok(s.orders.some((o) => o.status === 'READY_FOR_DELIVERY'));
  assert.ok(s.orders.some((o) => o.lines.some((l) => l.acceptedQty > 0 && l.acceptedQty < l.pickedQty)), 'one order is short at handover');
  assert.ok(s.plans.some((p) => p.kind === 'RETAILER_DELIVERY' && p.route && !p.tripIds.length), 'a confirmed route waits for its trip');
  assert.ok(s.collections.some((c) => c.mode === 'CASH') && s.collections.some((c) => c.mode === 'UPI'));
  assert.ok(!('grns' in s) && !('returns' in s), 'no GRN or return records');
});

test('1. allocation: CDS orders go to the store serving the retailer; unserved areas are refused; idempotent', () => {
  const { e, order } = setup();
  const o = order('dst-01', RT.upl, [sku(0, 2)]);
  assert.equal(o.cdsStoreId, 'cds-upl');
  assert.equal(o.status, 'CONFIRMED');
  assert.equal(e.allocateCdsOrder({ sellerOrderRef: 'T-1', distributorId: 'dst-01', retailerId: RT.upl, lines: [sku(0, 9)] }).id, o.id);
  throwsCds(() => order('dst-01', RT.none, [sku(0, 1)]), /not served by any CDS/);
});

test('1b. allocation by service area polygon: inside → that CDS; outside every area → 3PL; an edited polygon changes new allocations; overlap → nearest', () => {
  const { s, order } = setup();
  assert.equal(serviceStoreFor(s.stores, { lat: 17.4058, lng: 78.5591 })?.id, 'cds-upl'); // Uppal
  assert.equal(serviceStoreFor(s.stores, { lat: 17.4948, lng: 78.3996 })?.id, 'cds-kkp'); // Kukatpally
  assert.equal(serviceStoreFor(s.stores, { lat: 17.3457, lng: 78.5522 })?.id, 'cds-dsn'); // LB Nagar
  assert.equal(serviceStoreFor(s.stores, { lat: 17.3258, lng: 78.56 }), null); // Vanasthalipuram — no CDS
  assert.ok(pointInPolygon({ lat: 17.42, lng: 78.482 }, s.stores[0].polygon), 'a point on the edge is inside');
  // The Service Centre widens CDS Dilsukhnagar to cover Vanasthalipuram → new orders there are allocated to it.
  const dsn = s.stores.find((x) => x.id === 'cds-dsn')!;
  dsn.polygon = [[17.386, 78.505], [17.386, 78.575], [17.31, 78.575], [17.31, 78.505]];
  assert.equal(order('dst-01', RT.none, [sku(0, 1)]).cdsStoreId, 'cds-dsn');
  // Overlapping areas: the nearest CDS store wins.
  const upl = s.stores.find((x) => x.id === 'cds-upl')!;
  upl.polygon = [[17.46, 78.48], [17.46, 78.61], [17.30, 78.61], [17.30, 78.48]];
  assert.equal(serviceStoreFor(s.stores, { lat: 17.37, lng: 78.52 })?.id, 'cds-dsn');
  assert.equal(serviceStoreFor(s.stores, { lat: 17.41, lng: 78.56 })?.id, 'cds-upl');
  // An inactive store serves nobody.
  dsn.active = false;
  assert.equal(serviceStoreFor(s.stores, { lat: 17.37, lng: 78.52 })?.id, 'cds-upl');
  assert.ok(ringAreaKm2(s.stores[1].polygon) > 10);
});

test('2–3. pickup planning: multi-distributor + multi-CDS trips, OTP at every pickup and handover; the handover makes orders Ready for Delivery', () => {
  const { e, order, free, done } = setup();
  const o1 = order('dst-01', RT.upl, [sku(0, 2), sku(3, 10)]);
  const o2 = order('dst-02', RT.kkp, [sku(4, 6)]);
  const o3 = order('dst-02', RT.dsn, [sku(4, 4)]);
  const a = free('SC');
  const { pickupTrip: pt, cdsDeliveryTrip: ct } = e.createPickupPlan({ orders: [{ orderId: o1.id }, { orderId: o2.id }, { orderId: o3.id, cdsStoreId: 'cds-upl' }], plannedDate: today, pickup: a, cdsDelivery: a }, SC);
  assert.equal(pt.stops.length, 2, 'one pickup stop per distributor');
  assert.equal(ct!.stops.length, 2, 'one handover stop per destination CDS (o3 redirected to Uppal)');
  assert.equal(e.order(o1.id).status, 'PICKUP_PLANNED');
  throwsCds(() => e.createPickupPlan({ orders: [{ orderId: o1.id }], plannedDate: today, pickup: free('SC', today, 0) }, SC), /only Confirmed/);
  throwsCds(() => e.sendOtp(pt.id, pt.stops[0].id, DP), /Start/);
  e.startTrip(pt.id, DP);
  e.startTrip(ct!.id, DP);
  throwsCds(() => e.sendOtp(ct!.id, ct!.stops[0].id, DP), /from the distributor first/);
  // OTP rules on the first pickup
  const st = pt.stops[0];
  const otp = e.sendOtp(pt.id, st.id, DP);
  assert.equal(otp.sentToType, 'DISTRIBUTOR');
  const wrong1 = e.completeStop(pt.id, st.id, { otp: '000000' }, DP);
  assert.match(wrong1.error!.message, /2 attempt/);
  e.completeStop(pt.id, st.id, { otp: '000000' }, DP);
  e.completeStop(pt.id, st.id, { otp: '000000' }, DP);
  const locked = e.completeStop(pt.id, st.id, { otp: otp.code }, DP);
  assert.match(locked.error!.message, /Too many/, 'locked after 3 wrong attempts');
  const otp2 = e.sendOtp(pt.id, st.id, DP);
  assert.equal(e.s.otps.find((x) => x.id === otp.id)!.status, 'LOCKED');
  const dIdx = e.trip(pt.id).stops.findIndex((x) => x.id === st.id);
  e.completeStop(pt.id, st.id, { otp: otp2.code, lines: st.lines.map((l, i) => ({ idx: i, actualQty: i === 0 ? l.plannedQty - 1 : l.plannedQty })) }, DP);
  assert.equal(e.trip(pt.id).stops[dIdx].status, 'PARTIAL');
  throwsCds(() => e.completeStop(pt.id, st.id, { otp: otp2.code }, DP), /already/);
  done(pt.id, 1);
  assert.equal(e.trip(pt.id).status, 'PARTIALLY_COMPLETED');
  const first = e.trip(pt.id).stops[0];
  const shortOrder = e.order(first.lines[0].orderId!);
  assert.equal(shortOrder.status, 'IN_TRANSIT_TO_CDS', 'CDS leg already running');
  // the CDS leg carries what was collected
  const leg = e.trip(ct!.id).stops.flatMap((x) => x.lines).find((l) => l.orderId === shortOrder.id && l.sku === first.lines[0].sku)!;
  assert.equal(leg.plannedQty, first.lines[0].plannedQty - 1);
  // handovers: OTP goes to the CDS user of that store; no GRN — the orders are Ready for Delivery at once
  const h = e.sendOtp(ct!.id, ct!.stops[0].id, DP);
  assert.equal(h.sentToType, 'CDS');
  assert.ok(['9100000002', '9100000003'].includes(h.sentToPhone));
  e.completeStop(ct!.id, ct!.stops[0].id, { otp: h.code }, DP);
  done(ct!.id, 1);
  assert.equal(e.trip(ct!.id).status, 'COMPLETED');
  [o1, o2, o3].forEach((o) => assert.equal(e.order(o.id).status, 'READY_FOR_DELIVERY'));
  assert.deepEqual(e.order(o1.id).lines.map((l) => l.acceptedQty), e.order(o1.id).lines.map((l) => l.pickedQty));
});

test('4. handover at the CDS: accepted units are deliverable, short units recorded, nothing handed over goes back to Picked Up', () => {
  const { e, order, free, done } = setup();
  const o = order('dst-01', RT.upl, [sku(3, 10)]);
  const z = order('dst-01', RT.dsn, [sku(3, 5)]);
  const a = free('SC');
  const { pickupTrip: pt, cdsDeliveryTrip: ct } = e.createPickupPlan({ orders: [{ orderId: o.id }, { orderId: z.id }], plannedDate: today, pickup: a, cdsDelivery: a }, SC);
  e.startTrip(pt.id, DP);
  done(pt.id, 0);
  e.startTrip(ct!.id, DP);
  const up = e.trip(ct!.id).stops.findIndex((s) => s.partyId === 'cds-upl');
  const dn = e.trip(ct!.id).stops.findIndex((s) => s.partyId === 'cds-dsn');
  const st = e.trip(ct!.id).stops[up];
  const h = e.sendOtp(ct!.id, st.id, DP);
  throwsCds(() => e.completeStop(ct!.id, st.id, { otp: h.code, lines: [{ idx: 0, actualQty: 11 }] }, DP), /cannot be more than 10/);
  e.completeStop(ct!.id, st.id, { otp: h.code, lines: [{ idx: 0, actualQty: 9 }] }, DP); // 1 short at handover
  const ready = e.order(o.id);
  assert.equal(ready.status, 'READY_FOR_DELIVERY');
  assert.equal(ready.lines[0].pickedQty - ready.lines[0].acceptedQty, 1, 'short at handover');
  assert.match(ready.history.at(-1)!.note ?? '', /short at handover/);
  done(ct!.id, dn, { lines: [{ idx: 0, actualQty: 0 }] });
  const back = e.order(z.id);
  assert.equal(back.status, 'PICKED_UP', 'nothing handed over → back to Picked Up');
  assert.equal(back.cdsTripId, null);
  assert.match(back.note ?? '', /Nothing handed over/);
  // the Service Centre can send it to the CDS again
  const { trip } = e.createCdsDeliveryPlan({ orderIds: [z.id], plannedDate: today, ...free('SC') }, SC);
  assert.equal(trip.type, 'CDS_DELIVERY');
});

function readyOrders() {
  const x = setup();
  const { e, order, done } = x;
  const o1 = order('dst-01', RT.upl, [sku(3, 10), sku(2, 4)]);
  const o2 = order('dst-01', RT.upl2, [sku(3, 6)], 'PREPAID');
  const o3 = order('dst-01', 'rt-2-0', [sku(3, 3)]);
  const a = x.free('SC');
  const { pickupTrip: pt, cdsDeliveryTrip: ct } = e.createPickupPlan({ orders: [o1, o2, o3].map((o) => ({ orderId: o.id })), plannedDate: today, pickup: a, cdsDelivery: a }, SC);
  e.startTrip(pt.id, DP);
  done(pt.id, 0);
  e.startTrip(ct!.id, DP);
  done(ct!.id, 0);
  return { ...x, o1, o2, o3 };
}

test('6. delivery planning (LBNP style): Plan Routes by locality on own vehicles → Confirm Routes → Generate Trip', () => {
  const { e, o1, o2, o3 } = readyOrders();
  const ids = [o1.id, o2.id, o3.id];
  throwsCds(() => e.proposeRoutes('cds-upl', ids, today), /next day/);
  throwsCds(() => e.proposeRoutes('cds-kkp', ids, tomorrow), /another CDS/);
  const p = e.proposeRoutes('cds-upl', ids, tomorrow);
  assert.deepEqual([...p.routes.flatMap((r) => r.orderIds), ...p.unplannedOrderIds].sort(), [...ids].sort(), 'every order is on a route or reported');
  assert.ok(p.routes.every((r) => r.loadKg <= r.capacityKg && r.localities.length > 0 && e.s.vehicles.find((v) => v.id === r.vehicleId)!.owner === 'cds-upl'));
  assert.equal(e.order(o1.id).status, 'READY_FOR_DELIVERY', 'Plan Routes saves nothing');
  const plans = e.confirmRoutes({ cdsStoreId: 'cds-upl', plannedDate: tomorrow, routes: p.routes.map((r) => ({ vehicleId: r.vehicleId, orderIds: r.orderIds })) }, 'u');
  assert.equal(plans.length, p.routes.length);
  assert.ok(plans.every((x) => x.planNo.startsWith('RT-') && x.route && !x.tripIds.length));
  p.routes.flatMap((r) => r.orderIds).forEach((id) => assert.equal(e.order(id).status, 'DELIVERY_PLANNED'));
  const vehicle = e.resources('cds-upl', tomorrow).vehicles.find((v) => v.id === plans[0].route!.vehicleId)!;
  assert.equal(vehicle.available, false, 'a confirmed route reserves its vehicle');
  assert.equal(vehicle.busyTripNo, plans[0].planNo);
  throwsCds(() => e.confirmRoutes({ cdsStoreId: 'cds-upl', plannedDate: tomorrow, routes: [{ vehicleId: plans[0].route!.vehicleId, orderIds: [o1.id] }] }, 'u'), /only Ready|already on/);
  const person = e.resources('cds-upl', tomorrow).deliveryPersons.find((x) => x.available)!;
  const trip = e.generateRouteTrip(plans[0].id, { deliveryPersonId: person.id }, 'u');
  assert.equal(trip.type, 'RETAILER_DELIVERY');
  assert.equal(trip.vehicleId, plans[0].route!.vehicleId);
  assert.equal(trip.deliveryPersonId, person.id);
  assert.equal(trip.stops[0].action, 'CDS_ORDER_PICKUP');
  assert.deepEqual(trip.stops.slice(1).map((s) => s.partyId), plans[0].route!.retailerIds, 'stops follow the route order');
  throwsCds(() => e.generateRouteTrip(plans[0].id, { deliveryPersonId: person.id }, 'u'), /already has a trip/);
  e.cancelTrip(trip.id, 'Vehicle breakdown', 'u');
  plans[0].orderIds.forEach((id) => assert.equal(e.order(id).status, 'READY_FOR_DELIVERY', 'cancelled trip → orders back to planning'));
});

test('7–8. retailer delivery: OTP at CDS pickup and retailer, partial / failed, cash and UPI collections', () => {
  const { e, o1, o2, o3, free, done } = readyOrders();
  throwsCds(() => e.createDeliveryPlan({ cdsStoreId: 'cds-upl', orderIds: [o1.id], plannedDate: today, ...free('cds-upl') }, 'u'), /next day/);
  throwsCds(() => e.createDeliveryPlan({ cdsStoreId: 'cds-kkp', orderIds: [o1.id], plannedDate: tomorrow, ...free('cds-kkp', tomorrow) }, 'u'), /another CDS/);
  const { trip } = e.createDeliveryPlan({ cdsStoreId: 'cds-upl', orderIds: [o1.id, o2.id, o3.id], plannedDate: tomorrow, ...free('cds-upl', tomorrow) }, 'u');
  assert.equal(trip.stops[0].action, 'CDS_ORDER_PICKUP');
  assert.equal(trip.stops.filter((s) => s.action === 'RETAILER_DELIVERY').length, 3);
  throwsCds(() => e.createDeliveryPlan({ cdsStoreId: 'cds-upl', orderIds: [o1.id], plannedDate: tomorrow, ...free('cds-upl', tomorrow) }, 'u'), /only Ready/);
  e.startTrip(trip.id, DP);
  const r1 = trip.stops.findIndex((s) => s.partyId === e.order(o1.id).retailerId);
  throwsCds(() => e.sendOtp(trip.id, trip.stops[r1].id, DP), /Load the orders/);
  const otp = e.sendOtp(trip.id, trip.stops[0].id, DP);
  assert.equal(otp.purpose, 'CDS_ORDER_PICKUP');
  e.completeStop(trip.id, trip.stops[0].id, { otp: otp.code }, DP);
  assert.equal(e.order(o1.id).status, 'OUT_FOR_DELIVERY');
  // o1 partial with ₹ collected by UPI; o2 prepaid full; o3 retailer closed
  done(trip.id, r1, { lines: [{ idx: 0, actualQty: 8 }], collections: [{ orderId: o1.id, amount: 500, mode: 'UPI' }] });
  assert.equal(e.order(o1.id).status, 'PARTIALLY_DELIVERED');
  const col = e.s.collections.find((c) => c.orderId === o1.id)!;
  assert.equal(col.amount, 500);
  assert.equal(col.mode, 'UPI');
  const r2 = e.trip(trip.id).stops.findIndex((s) => s.partyId === e.order(o2.id).retailerId);
  done(trip.id, r2);
  assert.equal(e.order(o2.id).status, 'DELIVERED');
  assert.ok(!e.s.collections.some((c) => c.orderId === o2.id), 'prepaid order: nothing to collect');
  const r3 = e.trip(trip.id).stops.findIndex((s) => s.partyId === e.order(o3.id).retailerId && s.action === 'RETAILER_DELIVERY');
  e.failStop(trip.id, e.trip(trip.id).stops[r3].id, 'Shop closed', DP);
  assert.equal(e.order(o3.id).status, 'READY_FOR_DELIVERY', 'failed delivery goes back to planning');
  assert.equal(e.trip(trip.id).status, 'PARTIALLY_COMPLETED');
});

test('reports: the CDS User Performance Report has one row per day for the store, with totals', () => {
  const s = buildCdsState(retailers, products);
  const r = buildReport(s, 'performance', ['cds-upl'], {});
  assert.deepEqual(r.columns.map((c) => c.label), ['Date', 'Orders received', 'Orders delivered', 'Orders not delivered', 'Delivery success rate', 'Trips', 'Total km']);
  assert.ok(r.rows.length >= 4, 'one row per day from the first to the last activity');
  const trips = s.trips.filter((t) => t.type === 'RETAILER_DELIVERY' && t.owner === 'cds-upl' && t.status !== 'CANCELLED');
  assert.equal(r.totals?.trips, trips.length);
  assert.ok(Number(r.totals?.delivered) > 0 && Number(r.totals?.received) > 0);
  const day = r.rows.find((x) => Number(x.delivered) + Number(x.notDelivered) > 0)!;
  assert.match(String(day.rate), /^\d+%$/);
  const one = buildReport(s, 'performance', ['cds-upl'], { from: String(r.rows[0].date), to: String(r.rows[0].date) });
  assert.equal(one.rows.length, 1);
});

test('OTP: expiry and no reuse; trips cancel cleanly; failed pickup returns orders to planning', () => {
  const { e, order, free } = setup();
  let now = Date.now();
  const e2 = new CdsEngine(e.s, () => new Date(now));
  const o = order('dst-03', RT.dsn, [sku(6, 5)]);
  const a = free('SC');
  const { pickupTrip: pt, cdsDeliveryTrip: ct } = e2.createPickupPlan({ orders: [{ orderId: o.id }], plannedDate: today, pickup: a, cdsDelivery: a }, SC);
  e2.startTrip(pt.id, DP);
  const otp = e2.sendOtp(pt.id, pt.stops[0].id, DP);
  now += 16 * 60000;
  assert.match(e2.completeStop(pt.id, pt.stops[0].id, { otp: otp.code }, DP).error!.message, /expired/);
  e2.failStop(pt.id, pt.stops[0].id, 'Stock not ready', DP);
  assert.equal(e2.order(o.id).status, 'CONFIRMED');
  assert.equal(e2.trip(ct!.id).status, 'CANCELLED', 'nothing left for the CDS leg');
  const b = free('SC');
  const again = e2.createPickupPlan({ orders: [{ orderId: o.id }], plannedDate: today, pickup: b }, SC);
  e2.cancelTrip(again.pickupTrip.id, 'Vehicle breakdown', SC);
  assert.equal(e2.order(o.id).status, 'CONFIRMED');
});
