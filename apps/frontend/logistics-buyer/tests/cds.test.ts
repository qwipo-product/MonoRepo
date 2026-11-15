// Unit tests for the CDS business rules (src/cds/engine.ts). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CdsEngine, CdsError, localDay, type SkuLine } from '../src/cds/engine.ts';
import { buildCdsMasters, buildCdsState } from '../src/cds/seed.ts';
import { pointInPolygon, ringAreaKm2, serviceStoreFor } from '../src/cds/planning.ts';
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
  assert.ok(s.trips.some((t) => t.type === 'CDS_RETURN' && t.status === 'COMPLETED'));
  assert.ok(s.grns.some((g) => g.status === 'PENDING') && s.grns.some((g) => g.status === 'COMPLETED'));
  assert.ok(s.otps.every((o) => o.status === 'VERIFIED'));
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

test('2–3. pickup planning: one pickup trip (sellers, then CDS stores), OTP at every pickup and handover, distributor-wise GRN', () => {
  const { e, order, free, done } = setup();
  const o1 = order('dst-01', RT.upl, [sku(0, 2), sku(3, 10)]);
  const o2 = order('dst-02', RT.kkp, [sku(4, 6)]);
  const o3 = order('dst-02', RT.dsn, [sku(4, 4)]);
  const a = free('SC');
  const { pickupTrip: pt, cdsDeliveryTrip } = e.createPickupPlan({ orders: [{ orderId: o1.id }, { orderId: o2.id }, { orderId: o3.id, cdsStoreId: 'cds-upl' }], plannedDate: today, pickup: a }, SC);
  assert.equal(cdsDeliveryTrip, null, 'one trip from pickup to drop');
  assert.deepEqual(pt.stops.map((s) => s.action), ['DISTRIBUTOR_PICKUP', 'DISTRIBUTOR_PICKUP', 'CDS_HANDOVER', 'CDS_HANDOVER'], 'one stop per distributor, then one per destination CDS (o3 redirected to Uppal)');
  assert.equal(e.order(o1.id).status, 'PICKUP_PLANNED');
  throwsCds(() => e.createPickupPlan({ orders: [{ orderId: o1.id }], plannedDate: today, pickup: free('SC', today, 0) }, SC), /only Confirmed/);
  throwsCds(() => e.sendOtp(pt.id, pt.stops[0].id, DP), /Start/);
  e.startTrip(pt.id, DP);
  const ct = pt; // the CDS drops are on the same trip
  throwsCds(() => e.sendOtp(pt.id, pt.stops[2].id, DP), /from the distributor first/);
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
  assert.equal(e.trip(pt.id).status, 'IN_PROGRESS', 'pickups done; the CDS drops are next on the same trip');
  const first = e.trip(pt.id).stops[0];
  const shortOrder = e.order(first.lines[0].orderId!);
  assert.equal(shortOrder.status, 'IN_TRANSIT_TO_CDS', 'on the way to the CDS on the same trip');
  // the CDS drops carry what was collected
  const leg = e.trip(ct.id).stops.filter((x) => x.action === 'CDS_HANDOVER').flatMap((x) => x.lines).find((l) => l.orderId === shortOrder.id && l.sku === first.lines[0].sku)!;
  assert.equal(leg.plannedQty, first.lines[0].plannedQty - 1);
  // handovers: OTP goes to the CDS user of that store
  const h = e.sendOtp(ct.id, ct.stops[2].id, DP);
  assert.equal(h.sentToType, 'CDS');
  assert.ok(['9100000002', '9100000003'].includes(h.sentToPhone));
  e.completeStop(ct.id, ct.stops[2].id, { otp: h.code }, DP);
  done(ct.id, 3);
  assert.equal(e.trip(ct.id).status, 'PARTIALLY_COMPLETED', 'one pickup was short');
  assert.equal(e.order(o1.id).status, 'RECEIVED_AT_CDS');
  const grnsUpl = e.s.grns.filter((g) => g.cdsStoreId === 'cds-upl');
  assert.equal(grnsUpl.length, 2, 'Uppal received from two distributors → two GRNs');
  assert.ok(grnsUpl.every((g) => g.pickupTripIds.includes(pt.id) && g.cdsTripId === pt.id));
});

test('4. GRN: verification rules, shortage / damage remarks, orders ready, damaged goods become a return', () => {
  const { e, order, free, done } = setup();
  const o = order('dst-01', RT.upl, [sku(3, 10)]);
  const a = free('SC');
  const { pickupTrip: pt } = e.createPickupPlan({ orders: [{ orderId: o.id }], plannedDate: today, pickup: a }, SC);
  e.startTrip(pt.id, DP);
  done(pt.id, 0);
  done(pt.id, 1, { lines: [{ idx: 0, actualQty: 9 }] }); // 1 short at handover
  const g = e.s.grns[0];
  assert.equal(g.lines[0].shortQty, 1);
  throwsCds(() => e.completeGrn(g.id, { lines: [{ idx: 0, acceptedQty: 9, damagedQty: 1 }] }, 'u'), /must equal received/);
  throwsCds(() => e.completeGrn(g.id, { lines: [{ idx: 0, acceptedQty: 8, damagedQty: 1 }] }, 'u'), /add a remark/);
  e.completeGrn(g.id, { lines: [{ idx: 0, acceptedQty: 8, damagedQty: 1, remarks: '1 short, 1 torn' }] }, 'u');
  assert.equal(e.order(o.id).status, 'READY_FOR_DELIVERY');
  assert.equal(e.order(o.id).lines[0].acceptedQty, 8);
  const r = e.s.returns.find((x) => x.source === 'GRN')!;
  assert.equal(r.status, 'RECEIVED_AT_CDS');
  assert.equal(r.lines[0].acceptedQty, 1);
  throwsCds(() => e.completeGrn(g.id, { lines: [] }, 'u'), /already generated/);
});

function readyOrders() {
  const x = setup();
  const { e, order, free, done } = x;
  const o1 = order('dst-01', RT.upl, [sku(3, 10), sku(2, 4)]);
  const o2 = order('dst-01', RT.upl2, [sku(3, 6)], 'PREPAID');
  const o3 = order('dst-01', 'rt-2-0', [sku(3, 3)]);
  const a = x.free('SC');
  const { pickupTrip: pt } = e.createPickupPlan({ orders: [o1, o2, o3].map((o) => ({ orderId: o.id })), plannedDate: today, pickup: a }, SC);
  e.startTrip(pt.id, DP);
  done(pt.id, 0);
  done(pt.id, 1);
  const g = e.s.grns[0];
  e.completeGrn(g.id, { lines: g.lines.map((l, i) => ({ idx: i, acceptedQty: l.receivedQty, damagedQty: 0 })) }, 'u');
  void free;
  return { ...x, o1, o2, o3 };
}

test('6–8. retailer delivery: next-day plan, OTP at CDS pickup and retailer, partial / failed, collections, ad-hoc return', () => {
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
  // o1 partial with ₹ collected; o2 prepaid full; o3 retailer closed
  const st1 = e.trip(trip.id).stops[r1];
  done(trip.id, r1, { lines: [{ idx: 0, actualQty: 8 }], collections: [{ orderId: o1.id, amount: 500, mode: 'UPI' }] });
  assert.equal(e.order(o1.id).status, 'PARTIALLY_DELIVERED');
  const col = e.s.collections.find((c) => c.orderId === o1.id)!;
  assert.equal(col.amount, 500);
  assert.equal(col.status, 'WITH_DELIVERY_PERSON');
  e.addReturnAtStop(trip.id, st1.id, { orderId: o1.id, lines: [{ sku: o1.lines[0].sku, qty: 2, reason: 'Quality issue', condition: 'DAMAGED' }] }, DP);
  assert.ok(e.trip(trip.id).stops.some((s) => s.action === 'RETAILER_RETURN') && e.trip(trip.id).stops.at(-1)!.action === 'RETURN_HANDOVER_CDS');
  const r2 = e.trip(trip.id).stops.findIndex((s) => s.partyId === e.order(o2.id).retailerId);
  done(trip.id, r2);
  assert.equal(e.order(o2.id).status, 'DELIVERED');
  assert.ok(!e.s.collections.some((c) => c.orderId === o2.id), 'prepaid order: nothing to collect');
  const r3 = e.trip(trip.id).stops.findIndex((s) => s.partyId === e.order(o3.id).retailerId && s.action === 'RETAILER_DELIVERY');
  e.failStop(trip.id, e.trip(trip.id).stops[r3].id, 'Shop closed', DP);
  assert.equal(e.order(o3.id).status, 'READY_FOR_DELIVERY', 'failed delivery goes back to planning');
  const rr = e.trip(trip.id).stops.findIndex((s) => s.action === 'RETAILER_RETURN');
  const ro = e.sendOtp(trip.id, e.trip(trip.id).stops[rr].id, DP);
  assert.equal(ro.sentToType, 'RETAILER');
  e.completeStop(trip.id, e.trip(trip.id).stops[rr].id, { otp: ro.code }, DP);
  const ret = e.s.returns.find((r) => r.orderId === o1.id)!;
  assert.equal(ret.status, 'PICKED_UP_FROM_RETAILER');
  const hi = e.trip(trip.id).stops.length - 1;
  throwsCds(() => done(trip.id, hi, { lines: [{ idx: 0, actualQty: 2, acceptedQty: 2, rejectedQty: 1 }] }), /must equal received/);
  done(trip.id, hi, { lines: [{ idx: 0, actualQty: 2, acceptedQty: 1, rejectedQty: 1 }] });
  assert.equal(e.ret(ret.id).status, 'RECEIVED_AT_CDS');
  assert.equal(e.trip(trip.id).status, 'PARTIALLY_COMPLETED');
});

test('9–10. returns: CDS return trip across stores to distributors, OTP at CDS pickup and seller handover', () => {
  const { e, o1, free, done } = readyOrders();
  const { trip } = e.createDeliveryPlan({ cdsStoreId: 'cds-upl', orderIds: [o1.id], plannedDate: tomorrow, ...free('cds-upl', tomorrow) }, 'u');
  e.startTrip(trip.id, DP);
  done(trip.id, 0);
  done(trip.id, 1, { collections: [{ orderId: o1.id, amount: 1, mode: 'CASH' }] });
  const r = e.initiateReturn({ orderId: o1.id, lines: [{ sku: o1.lines[0].sku, qty: 3, reason: 'Expired / near expiry' }] }, 'u');
  throwsCds(() => e.initiateReturn({ orderId: o1.id, lines: [{ sku: o1.lines[0].sku, qty: 8, reason: 'x' }] }, 'u'), /only 7/);
  const d2 = localDay(new Date(Date.now() + 2 * 86400000));
  const { trip: rt } = e.createDeliveryPlan({ cdsStoreId: 'cds-upl', orderIds: [], returnIds: [r.id], plannedDate: d2, ...free('cds-upl', d2) }, 'u');
  e.startTrip(rt.id, DP);
  done(rt.id, 0);
  done(rt.id, 1, { lines: [{ idx: 0, actualQty: 3, acceptedQty: 3, rejectedQty: 0 }] });
  assert.equal(e.ret(r.id).status, 'RECEIVED_AT_CDS');
  throwsCds(() => e.createReturnPlan({ returnIds: [r.id], plannedDate: today, ...free('SC') }, SC), /next day/);
  const { trip: ct } = e.createReturnPlan({ returnIds: [r.id], plannedDate: tomorrow, ...free('SC', tomorrow) }, SC);
  assert.deepEqual(ct.stops.map((s) => s.action), ['CDS_RETURN_PICKUP', 'SELLER_RETURN_HANDOVER']);
  assert.equal(e.ret(r.id).status, 'RETURN_PLANNED');
  e.startTrip(ct.id, DP);
  throwsCds(() => e.sendOtp(ct.id, ct.stops[1].id, DP), /Collect the returns/);
  done(ct.id, 0);
  assert.equal(e.ret(r.id).status, 'PICKED_UP_FROM_CDS');
  const so = e.sendOtp(ct.id, ct.stops[1].id, DP);
  assert.equal(so.sentToPhone, '9848011101', 'OTP to the seller');
  e.completeStop(ct.id, ct.stops[1].id, { otp: so.code }, DP);
  assert.equal(e.trip(ct.id).status, 'COMPLETED');
  assert.equal(e.ret(r.id).status, 'COMPLETED');
});

test('collections: delivery person → CDS → Qwipo (SNP) → settled, manual with references', () => {
  const { e, o1, free, done } = readyOrders();
  const { trip } = e.createDeliveryPlan({ cdsStoreId: 'cds-upl', orderIds: [o1.id], plannedDate: tomorrow, ...free('cds-upl', tomorrow) }, 'u');
  e.startTrip(trip.id, DP);
  done(trip.id, 0);
  done(trip.id, 1, { collections: [{ orderId: o1.id, amount: 1000, mode: 'CASH' }] });
  const c = e.s.collections[0];
  throwsCds(() => e.handToQwipo('cds-upl', [c.id], 'DEP-1', 'u'), /received by the CDS first/);
  throwsCds(() => e.receiveCollections('cds-upl', { items: [{ id: c.id, amount: 900 }] }, 'u'), /add a note/);
  throwsCds(() => e.receiveCollections('cds-kkp', { items: [{ id: c.id, amount: 1000 }] }, 'u'), /another CDS/);
  e.receiveCollections('cds-upl', { items: [{ id: c.id, amount: 900 }], note: '₹100 short' }, 'u');
  e.handToQwipo('cds-upl', [c.id], 'DEP-1', 'u');
  e.recordSettlement('cds-upl', [c.id], 'QWP-STL-1', 'u');
  assert.equal(e.collection(c.id).status, 'SETTLED');
  assert.equal(e.collection(c.id).cdsReceivedAmount, 900);
});

test('OTP: expiry and no reuse; trips cancel cleanly; failed pickup returns orders to planning', () => {
  const { e, order, free } = setup();
  let now = Date.now();
  const e2 = new CdsEngine(e.s, () => new Date(now));
  const o = order('dst-03', RT.dsn, [sku(6, 5)]);
  const a = free('SC');
  const { pickupTrip: pt } = e2.createPickupPlan({ orders: [{ orderId: o.id }], plannedDate: today, pickup: a }, SC);
  e2.startTrip(pt.id, DP);
  const otp = e2.sendOtp(pt.id, pt.stops[0].id, DP);
  now += 16 * 60000;
  assert.match(e2.completeStop(pt.id, pt.stops[0].id, { otp: otp.code }, DP).error!.message, /expired/);
  e2.failStop(pt.id, pt.stops[0].id, 'Stock not ready', DP);
  assert.equal(e2.order(o.id).status, 'CONFIRMED');
  assert.ok(!e2.trip(pt.id).stops.some((s) => s.action === 'CDS_HANDOVER'), 'nothing left to drop at the CDS');
  assert.equal(e2.trip(pt.id).status, 'PARTIALLY_COMPLETED');
  const b = free('SC');
  const again = e2.createPickupPlan({ orders: [{ orderId: o.id }], plannedDate: today, pickup: b }, SC);
  e2.cancelTrip(again.pickupTrip.id, 'Vehicle breakdown', SC);
  assert.equal(e2.order(o.id).status, 'CONFIRMED');
});

test('2b. planned pickup trip: the CDS User changes a product quantity before the pickup; not after it starts', () => {
  const { e, order, free, done } = setup();
  const o = order('dst-01', RT.upl, [sku(0, 5), sku(1, 2)]);
  const other = order('dst-01', RT.dsn, [sku(0, 3)]);
  const { pickupTrip: pt } = e.createPickupPlan({ orders: [{ orderId: o.id }, { orderId: other.id }], plannedDate: today, pickup: free('SC') }, SC);
  const load = e.trip(pt.id).loadKg;
  throwsCds(() => e.updatePlannedQty(pt.id, 'cds-upl', 'SKU1001', [{ orderId: o.id, qty: 3 }], '', 'Rajesh Kumar'), /remark/);
  throwsCds(() => e.updatePlannedQty(pt.id, 'cds-upl', 'SKU1001', [{ orderId: other.id, qty: 1 }], 'less', 'Rajesh Kumar'), /not on this trip for your CDS store/);
  throwsCds(() => e.updatePlannedQty(pt.id, 'cds-upl', 'SKU1001', [{ orderId: o.id, qty: 6 }], 'more', 'Rajesh Kumar'), /from 0 to 5/);
  e.updatePlannedQty(pt.id, 'cds-upl', 'SKU1001', [{ orderId: o.id, qty: 3 }], 'Retailer reduced the order', 'Rajesh Kumar');
  assert.equal(e.order(o.id).lines[0].qty, 3);
  assert.equal(e.order(o.id).orderValue, Math.round((3 * products[0].price + 2 * products[1].price) * 100) / 100);
  e.trip(pt.id).stops.forEach((s) => s.lines.filter((l) => l.orderId === o.id && l.sku === 'SKU1001').forEach((l) => assert.equal(l.plannedQty, 3)));
  assert.ok(e.trip(pt.id).loadKg < load);
  e.startTrip(pt.id, DP);
  done(pt.id, 0);
  throwsCds(() => e.updatePlannedQty(pt.id, 'cds-upl', 'SKU1002', [{ orderId: o.id, qty: 1 }], 'late', 'Rajesh Kumar'), /has started/);
});
