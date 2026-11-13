// In-app end-to-end check of the CDS workflow through its HTTP API (the same calls the screens make): Seller Store
// allocation → pickup planning → distributor pickup trip → CDS delivery trip → GRN → next-day retailer delivery →
// collections → returns → return planning → CDS return trip, with OTPs at all 8 checkpoints, role-based access,
// CDS-store isolation, the Delivery Partner App endpoints, and the existing LBNP data untouched.
// Run in the browser console on the dev server, from a /cds page (restores your CDS session afterwards):
//   window.__cdsE2e = null; (await import('/tests/e2e/cdsFlow.e2e.ts')).run().then(r => window.__cdsE2e = r, e => window.__cdsE2e = { error: String(e) })
import { http, HttpError } from '../../src/api/http';
import { cdsApi, cdsAuth, type CdsSessionUser } from '../../src/api/services/cds.service';
import { db, persist } from '../../src/mock/db';
import { CDS_INTEGRATION_KEY } from '../../src/mock/routes/cds';
import type { CdsState, StopAction, Trip } from '../../src/cds/types';

const BASE = 'mock://cds-svc/api/v1';
type Check = { name: string; ok: boolean; detail?: string };

export async function run() {
  const checks: Check[] = [];
  const ok = (name: string, cond: boolean, detail?: unknown) => checks.push({ name, ok: !!cond, detail: detail === undefined ? undefined : String(detail) });
  const fails = async (name: string, fn: () => Promise<unknown>, status: number, re?: RegExp) => {
    try {
      await fn();
      ok(name, false, 'did not fail');
    } catch (e) {
      const st = e instanceof HttpError ? e.status : 0;
      const msg = e instanceof HttpError ? e.error?.message ?? e.message : String(e);
      ok(name, st === status && (!re || re.test(msg)), `${st} ${msg}`);
    }
  };
  const saved = { token: cdsAuth.token, user: cdsAuth.user };
  const st = () => db().ext.cds as CdsState;
  const tripSim = (window as unknown as { __lbnpTrips?: { simulator: { pause(): void; resume(): void } } }).__lbnpTrips?.simulator;
  tripSim?.pause();
  const coreSnap = () => { const d = db(); return { trips: JSON.stringify(d.trips), vehicles: JSON.stringify(d.vehicles), drivers: JSON.stringify(d.drivers), permissions: JSON.stringify(d.permissions) }; };
  const coreBefore = coreSnap();
  // one session per demo user for the whole run (users keep only their 5 latest sessions), signed out at the end
  const sessions = new Map<string, { token: string; user: CdsSessionUser }>();
  const as = async (mobile: string) => {
    let x = sessions.get(mobile);
    if (!x) {
      const r = await cdsApi.verifyOtp(mobile, '123456');
      x = { token: r.token, user: r.user as CdsSessionUser };
      sessions.set(mobile, x);
    }
    cdsAuth.set(x.token, x.user);
    return x.user;
  };
  const integ = { headers: { 'X-Integration-Key': CDS_INTEGRATION_KEY }, skipAuth: true };
  const post = <T,>(path: string, body: unknown) => http.post<{ data: T }>(`${BASE}${path}`, body, integ).then((r) => r.data);
  const otpCode = (r: { demoSms: string }) => (r.demoSms.match(/OTP (\d{6})/) ?? [])[1];
  const tag = Date.now().toString(36);
  /** Sends the stop OTP and completes the stop with it. */
  const doStop = async (trip: Trip, action: StopAction, pick: (s: Trip['stops'][number]) => boolean = () => true, extra: Record<string, unknown> = {}) => {
    const t = (await cdsApi.trip(trip.id)).trip;
    const s = t.stops.find((x) => x.action === action && x.status === 'PENDING' && pick(x as never))!;
    const r = await cdsApi.sendStopOtp(t.id, s.id);
    await cdsApi.completeStop(t.id, s.id, { otp: otpCode(r), ...extra });
    return r;
  };

  try {
    // ---------------------------------------------------------------- roles & access
    await fails('API refuses a missing / forged CDS session', () => http.get(`${BASE}/cds/meta`, { skipAuth: true, headers: { 'X-Cds-Token': 'forged' } }), 401);
    await fails('Unregistered mobile cannot sign in to CDS', () => cdsApi.sendOtp('9876543210'), 404);
    await fails('Integration endpoints need the integration key', () => http.post(`${BASE}/cds/inbound/seller-orders`, {}, { skipAuth: true }), 401);
    const sc = await as('9100000001');
    ok('Service Centre menu: Orders, Pickup Planning, Deliver to CDS, Return Planning, Trips, Reports, Settings, CDS Stores', sc.pages.join() === 'sc-orders,sc-pickup,sc-deliver,sc-returns,sc-trips,sc-reports,sc-settings,sc-stores', sc.pages.join());
    await fails('Service Centre cannot open GRN', () => cdsApi.searchGrns({}), 403);
    await fails('Service Centre cannot open Collections', () => cdsApi.searchCollections({}), 403);
    await fails('Service Centre Trips never include retailer trips', () => cdsApi.searchTrips({ types: ['RETAILER_DELIVERY'] }), 403);
    const cu = await as('9100000002');
    ok('CDS User menu: GRN, Orders, Delivery Planning, Trips, Collections & Payments, Returns, Reports & Settings, Retailers', cu.pages.join() === 'cu-grn,cu-orders,cu-delivery,cu-trips,cu-collections,cu-returns,cu-reports,cu-retailers', cu.pages.join());
    await fails('CDS User cannot open Pickup Planning', () => cdsApi.createPickupPlan({ orders: [], plannedDate: '', pickup: { vehicleId: '', deliveryPersonId: '' } }), 403);
    await fails('CDS User Trips show only retailer trips', () => cdsApi.searchTrips({ types: ['DISTRIBUTOR_PICKUP'] }), 403);
    await fails('CDS User cannot read another store’s orders', () => cdsApi.searchOrders({ cdsStoreId: 'cds-kkp' }), 403);
    const otherOrder = st().orders.find((o) => o.cdsStoreId === 'cds-kkp')!;
    await fails('CDS User cannot open another store’s order', () => cdsApi.order(otherOrder.id), 403);
    const mine = await cdsApi.searchOrders({ pageSize: 0 });
    ok('CDS User sees only its own store’s orders', mine.rows.length > 0 && mine.rows.every((o) => o.cdsStoreId === 'cds-upl'));

    // ---------------------------------------------------------------- 1. Seller Store allocation
    const servedBy = (id: string) => st().stores.find((x) => x.id === id)!.localities;
    const retU = st().retailers.find((r) => servedBy('cds-upl').includes(r.locality))!;
    const retU2 = st().retailers.find((r) => servedBy('cds-upl').includes(r.locality) && r.id !== retU.id)!;
    const retK = st().retailers.find((r) => servedBy('cds-kkp').includes(r.locality))!;
    const retNone = st().retailers.find((r) => !st().stores.some((x) => x.localities.includes(r.locality)))!;
    const line = (name: string, qty: number, price = 50, w = 1) => ({ sku: `E2E-${tag}-${name}`, name: `E2E ${name}`, unitPrice: price, unitWeightKg: w, qty });
    const alloc = (ref: string, dist: string, retailerId: string, lines: ReturnType<typeof line>[], paymentMode: 'COD' | 'PREPAID' = 'COD') =>
      post<{ routedTo: string; order: { id: string; cdsStoreId: string; status: string } }>('/cds/inbound/seller-orders', { deliveryType: 'CDS', sellerOrderRef: `E2E-${tag}-${ref}`, distributorId: dist, retailerId, paymentMode, lines });
    const a1 = await alloc('1', 'dst-01', retU.id, [line('Rice', 10, 100, 2), line('Dal', 6)]);
    const a2 = await alloc('2', 'dst-02', retU2.id, [line('Oil', 8, 150)], 'PREPAID');
    const a3 = await alloc('3', 'dst-02', retK.id, [line('Oil', 5, 150)]);
    ok('CDS Store Delivery order → CDS Service Centre, to the store serving the retailer', a1.routedTo === 'CDS' && a1.order.cdsStoreId === 'cds-upl' && a3.order.cdsStoreId === 'cds-kkp' && a1.order.status === 'CONFIRMED');
    const again = await alloc('1', 'dst-01', retU.id, [line('Rice', 99)]);
    ok('Allocation is idempotent by seller order reference', again.order.id === a1.order.id);
    await fails('Retailer outside every CDS area is refused (use 3PL)', () => alloc('x', 'dst-01', retNone.id, [line('Rice', 1)]), 400, /not served/);
    const lbnpOrdersBefore = db().orders.length;
    try {
      const r3 = await post<{ routedTo: string }>('/cds/inbound/seller-orders', { deliveryType: '3PL', lbnpOrder: { buyerId: db().buyer.id, customerName: 'E2E Test Retailer', customerMobileNumber: '9123456780', customerAddress: '1 Main Road, Vanasthalipuram', customerPincode: '500070', amount: 500, items: [{ itemName: 'Test', qty: 1, sellingPrice: 500 }] } });
      ok('3PL order → forwarded to LBNP’s existing order intake', r3.routedTo === 'LBNP' && db().orders.length === lbnpOrdersBefore + 1);
      // remove the test order (and the customer the intake created) from the LBNP demo data
      const d = db();
      d.orders = d.orders.filter((o) => o.customerName !== 'E2E Test Retailer');
      d.customers = d.customers.filter((c) => c.mobile_number !== '9123456780');
      persist();
    } catch (e) {
      ok('3PL order → forwarded to LBNP’s existing order intake (LBNP session needed)', e instanceof HttpError && e.status === 503, e instanceof HttpError ? `${e.status} ${e.error?.message}` : e);
    }

    // ---------------------------------------------------------------- 2–3. pickup planning → pickup trip + CDS delivery trip
    await as('9100000001');
    const meta = await cdsApi.meta();
    const res = await cdsApi.resources(meta.today);
    const v = res.vehicles.find((x) => x.available && x.capacityKg >= 100)!;
    const p = res.deliveryPersons.find((x) => x.available)!;
    const plan = await cdsApi.createPickupPlan({ orders: [{ orderId: a1.order.id }, { orderId: a2.order.id }, { orderId: a3.order.id }], plannedDate: meta.today, pickup: { vehicleId: v.id, deliveryPersonId: p.id }, cdsDelivery: { vehicleId: v.id, deliveryPersonId: p.id } });
    const pt = plan.pickupTrip;
    const ct = plan.cdsDeliveryTrip!;
    ok('One pickup plan: multiple distributors (pickup trip) and multiple CDS stores (CDS delivery trip)', pt.stops.length === 2 && ct.stops.length === 2 && pt.type === 'DISTRIBUTOR_PICKUP' && ct.type === 'CDS_DELIVERY');
    await fails('Duplicate trip prevented: order already planned', () => cdsApi.createPickupPlan({ orders: [{ orderId: a1.order.id }], plannedDate: meta.today, pickup: { vehicleId: v.id, deliveryPersonId: p.id } }), 409);
    await fails('A stop cannot be worked before the trip starts', () => cdsApi.sendStopOtp(pt.id, pt.stops[0].id), 409, /Start/);
    await cdsApi.startTrip(pt.id);
    await cdsApi.startTrip(ct.id);
    const s1 = (await cdsApi.trip(pt.id)).trip.stops.find((x) => x.partyId === 'dst-01')!;
    const o1 = await cdsApi.sendStopOtp(pt.id, s1.id);
    ok('Distributor pickup OTP goes to the seller / distributor', o1.sentToPhone === '9848011101');
    await fails('Wrong OTP is refused with attempts left', () => cdsApi.completeStop(pt.id, s1.id, { otp: '000000' }), 400, /attempt/);
    await cdsApi.completeStop(pt.id, s1.id, { otp: otpCode(o1), lines: s1.lines.map((l, i) => ({ idx: i, actualQty: i === 0 ? l.plannedQty - 1 : l.plannedQty })) });
    await fails('A completed handover cannot be redone (OTP not reusable)', () => cdsApi.completeStop(pt.id, s1.id, { otp: otpCode(o1) }), 409);
    await fails('CDS handover needs the orders collected first', () => doStop(ct, 'CDS_HANDOVER', (x) => x.partyId === 'cds-kkp'), 409, /from the distributor first/);
    await doStop(pt, 'DISTRIBUTOR_PICKUP');
    const ap = await cdsApi.order(a1.order.id);
    ok('Partial pickup recorded; order In Transit to CDS', ap.order.status === 'IN_TRANSIT_TO_CDS' && ap.order.lines[0].pickedQty === 9);
    ok('Pickup trip Partially Completed (short pickup)', (await cdsApi.trip(pt.id)).trip.status === 'PARTIALLY_COMPLETED');
    const cdsStopU = (await cdsApi.trip(ct.id)).trip.stops.find((x) => x.partyId === 'cds-upl')!;
    const ho = await cdsApi.sendStopOtp(ct.id, cdsStopU.id);
    await as('9100000002');
    const myOtps = await cdsApi.myOtps();
    ok('CDS User sees the handover OTP sent to their store', myOtps.some((x) => x.stopId === cdsStopU.id && x.code === otpCode(ho)));
    await fails('CDS User cannot run Service Centre trips', () => cdsApi.completeStop(ct.id, cdsStopU.id, { otp: otpCode(ho) }), 403);
    await as('9100000001');
    await cdsApi.completeStop(ct.id, cdsStopU.id, { otp: otpCode(ho), lines: cdsStopU.lines.map((l, i) => ({ idx: i, actualQty: i === 0 ? l.plannedQty - 1 : l.plannedQty })) });
    await doStop(ct, 'CDS_HANDOVER');
    ok('CDS delivery trip finished (partially — one unit short at handover); orders Received at CDS', (await cdsApi.trip(ct.id)).trip.status === 'PARTIALLY_COMPLETED' && (await cdsApi.order(a1.order.id)).order.status === 'RECEIVED_AT_CDS');

    // ---------------------------------------------------------------- 4. GRN distributor-wise
    await as('9100000002');
    const grns = (await cdsApi.searchGrns({ status: 'PENDING', pageSize: 0 })).rows.filter((g) => g.cdsTripNo === ct.tripNo);
    ok('Uppal received from two distributors → two GRNs, linked to CDS trip and pickup trip', grns.length === 2 && grns.every((g) => g.pickupTripNos.includes(pt.tripNo)));
    const gRice = grns.find((g) => g.distributorId === 'dst-01')!;
    const riceLine = gRice.lines.findIndex((l) => l.name === 'E2E Rice');
    ok('GRN carries the handover shortage', gRice.lines[riceLine].shortQty === 1 && gRice.lines[riceLine].receivedQty === 8);
    await fails('Shortage / damage needs a remark', () => cdsApi.completeGrn(gRice.id, { lines: gRice.lines.map((l, i) => ({ idx: i, acceptedQty: l.receivedQty, damagedQty: 0 })) }), 400, /remark/);
    await cdsApi.completeGrn(gRice.id, { lines: gRice.lines.map((l, i) => ({ idx: i, acceptedQty: i === riceLine ? l.receivedQty - 1 : l.receivedQty, damagedQty: i === riceLine ? 1 : 0, remarks: i === riceLine ? '1 short, 1 torn' : '' })) });
    const gOil = grns.find((g) => g.distributorId === 'dst-02')!;
    await cdsApi.completeGrn(gOil.id, { lines: gOil.lines.map((l, i) => ({ idx: i, acceptedQty: l.receivedQty, damagedQty: 0 })) });
    const od1 = await cdsApi.order(a1.order.id);
    ok('GRN generated → order Ready for Delivery with accepted quantities', od1.order.status === 'READY_FOR_DELIVERY' && od1.order.lines[0].acceptedQty === 7);
    ok('Damaged at GRN becomes a return to the distributor', (await cdsApi.searchReturns({ statuses: ['RECEIVED_AT_CDS'], pageSize: 0 })).rows.some((r) => r.orderId === a1.order.id && r.source === 'GRN'));

    // ---------------------------------------------------------------- 6–8. next-day retailer delivery, OTPs, collections, returns
    const m2 = await cdsApi.meta();
    const r2 = await cdsApi.resources(m2.tomorrow);
    const cv = r2.vehicles.find((x) => x.available)!;
    const cp = r2.deliveryPersons.find((x) => x.available)!;
    await fails('Retailer delivery must be planned for the next day', () => cdsApi.createDeliveryPlan({ orderIds: [a1.order.id], returnIds: [], plannedDate: m2.today, vehicleId: cv.id, deliveryPersonId: cp.id }), 400, /next day/);
    const dp = await cdsApi.createDeliveryPlan({ orderIds: [a1.order.id, a2.order.id], returnIds: [], plannedDate: m2.tomorrow, vehicleId: cv.id, deliveryPersonId: cp.id });
    const rt = dp.trip;
    ok('Delivery plan → retailer trip: CDS order pickup, then the retailer stop', rt.type === 'RETAILER_DELIVERY' && rt.stops[0].action === 'CDS_ORDER_PICKUP' && rt.stops.some((s) => s.action === 'RETAILER_DELIVERY'));
    ok('Retailer trip shows in the CDS User’s Trips', (await cdsApi.searchTrips({ types: ['RETAILER_DELIVERY'], pageSize: 0 })).rows.some((t) => t.id === rt.id));
    await cdsApi.startTrip(rt.id);
    const lo = await doStop(rt, 'CDS_ORDER_PICKUP');
    ok('Order pickup at CDS: OTP to the CDS User', /\(CDS Uppal\)/.test(lo.sentToName), lo.sentToName);
    ok('Orders Out for Delivery after the CDS pickup OTP', (await cdsApi.order(a1.order.id)).order.status === 'OUT_FOR_DELIVERY');
    // prepaid order at the second retailer; the retailer hands back 2 units during the visit (ad-hoc return)
    await doStop(rt, 'RETAILER_DELIVERY', (s) => s.partyId === retU2.id);
    ok('Prepaid order delivered (no collection)', (await cdsApi.order(a2.order.id)).order.status === 'DELIVERED');
    const delStop = (await cdsApi.trip(rt.id)).trip.stops.find((s) => s.action === 'RETAILER_DELIVERY' && s.partyId === retU2.id)!;
    await cdsApi.addReturnAtStop(rt.id, delStop.id, { orderId: a2.order.id, lines: [{ sku: `E2E-${tag}-Oil`, qty: 2, reason: 'Quality issue', condition: 'DAMAGED' }] });
    ok('Return collected during the visit adds a return-collection stop and a return handover at the CDS', (await cdsApi.trip(rt.id)).trip.stops.some((s) => s.action === 'RETAILER_RETURN' && s.partyId === retU2.id) && (await cdsApi.trip(rt.id)).trip.stops.at(-1)!.action === 'RETURN_HANDOVER_CDS');
    const dl = await doStop(rt, 'RETAILER_DELIVERY', (s) => s.partyId === retU.id, { collections: [{ orderId: a1.order.id, amount: 1000, mode: 'CASH' }] });
    ok('Retailer delivery: OTP to the retailer', dl.sentToPhone === retU.phone);
    ok('COD order partially delivered (short at GRN)', (await cdsApi.order(a1.order.id)).order.status === 'PARTIALLY_DELIVERED');
    const rr = await doStop(rt, 'RETAILER_RETURN');
    ok('Return collection: OTP to the retailer', rr.sentToPhone === retU2.phone);
    const hs = (await cdsApi.trip(rt.id)).trip.stops.find((s) => s.action === 'RETURN_HANDOVER_CDS')!;
    const hsOtp = await cdsApi.sendStopOtp(rt.id, hs.id);
    await fails('Return handover: accepted + rejected must equal received', () => cdsApi.completeStop(rt.id, hs.id, { otp: otpCode(hsOtp), lines: [{ idx: 0, actualQty: 2, acceptedQty: 2, rejectedQty: 1 }] }), 400, /accepted \+ rejected/);
    await cdsApi.completeStop(rt.id, hs.id, { otp: otpCode(hsOtp), lines: [{ idx: 0, actualQty: 2, acceptedQty: 1, rejectedQty: 1 }] });
    const ret = (await cdsApi.searchReturns({ pageSize: 0 })).rows.find((r) => r.orderId === a2.order.id)!;
    ok('Return Received at CDS with accepted / rejected quantities', ret.status === 'RECEIVED_AT_CDS' && ret.lines[0].acceptedQty === 1 && ret.lines[0].rejectedQty === 1);
    ok('Retailer trip finished', ['COMPLETED', 'PARTIALLY_COMPLETED'].includes((await cdsApi.trip(rt.id)).trip.status));

    // ---------------------------------------------------------------- collections (manual)
    const col = (await cdsApi.searchCollections({ status: 'WITH_DELIVERY_PERSON', pageSize: 0 })).rows.find((c) => c.orderId === a1.order.id)!;
    ok('Collection recorded with retailer, order, delivery person and amount', !!col && col.amount === 1000 && col.deliveryPersonName === cp.name);
    await fails('Hand over to Qwipo needs the CDS receipt first', () => cdsApi.handToQwipo([col.id], 'DEP-X'), 409);
    await cdsApi.receiveCollections([{ id: col.id, amount: 1000 }]);
    await cdsApi.handToQwipo([col.id], `DEP-${tag}`);
    await cdsApi.recordSettlement([col.id], `STL-${tag}`);
    const colDone = (await cdsApi.searchCollections({ status: 'SETTLED', pageSize: 0 })).rows.find((c) => c.id === col.id);
    ok('Collection: delivery person → CDS → Qwipo (SNP) → settled, with references', !!colDone && colDone.qwipoHandoverRef === `DEP-${tag}` && colDone.settlementRef === `STL-${tag}`);

    // ---------------------------------------------------------------- 10. return planning → CDS return trip
    await as('9100000001');
    const m3 = await cdsApi.meta();
    const r3 = await cdsApi.resources(m3.tomorrow);
    const rv = r3.vehicles.find((x) => x.available)!;
    const rp = r3.deliveryPersons.find((x) => x.available)!;
    const toPlan = (await cdsApi.searchReturns({ statuses: ['RECEIVED_AT_CDS'], unplanned: true, pageSize: 0 })).rows.filter((r) => r.orderId === a1.order.id || r.orderId === a2.order.id);
    ok('Returns across CDS stores, grouped distributor-wise for planning', toPlan.length === 2 && new Set(toPlan.map((r) => r.distributorId)).size === 2);
    const crt = (await cdsApi.createReturnPlan({ returnIds: toPlan.map((r) => r.id), plannedDate: m3.tomorrow, vehicleId: rv.id, deliveryPersonId: rp.id })).trip;
    ok('CDS return trip: CDS pickup then distributor handovers', crt.type === 'CDS_RETURN' && crt.stops[0].action === 'CDS_RETURN_PICKUP' && crt.stops.filter((s) => s.action === 'SELLER_RETURN_HANDOVER').length === 2);
    await cdsApi.startTrip(crt.id);
    const pu = await doStop(crt, 'CDS_RETURN_PICKUP');
    ok('Return pickup at CDS: OTP to the CDS User', /CDS Uppal/.test(pu.sentToName));
    const h1 = await doStop(crt, 'SELLER_RETURN_HANDOVER');
    ok('Return handover to seller: OTP to the seller', ['9848011101', '9848011102'].includes(h1.sentToPhone));
    const last = (await cdsApi.trip(crt.id)).trip.stops.find((s) => s.status === 'PENDING')!;
    const ev = (type: string, extra: Record<string, unknown> = {}) => post<{ duplicate: boolean }>(`/cds/dp/trips/${crt.id}/events`, { eventId: `e2e-${tag}-${type}`, deliveryPersonId: rp.id, type, stopId: last.id, ...extra });
    await fails('Delivery Partner App: only the assigned delivery person', () => post(`/cds/dp/trips/${crt.id}/events`, { eventId: `e2e-${tag}-x`, deliveryPersonId: 'dp-SC-99', type: 'SEND_OTP', stopId: last.id }), 403);
    await ev('SEND_OTP');
    const code = st().otps.filter((o) => o.stopId === last.id && o.status === 'ACTIVE')[0].code;
    const c1 = await ev('COMPLETE', { otp: code });
    const c2 = await ev('COMPLETE', { otp: code });
    ok('Delivery Partner App events are processed once (duplicate ignored)', !c1.duplicate && c2.duplicate);
    const rets = (await cdsApi.searchReturns({ pageSize: 0 })).rows.filter((r) => toPlan.some((x) => x.id === r.id));
    ok('CDS return trip completed; returns Completed (Retailer → CDS → Seller)', (await cdsApi.trip(crt.id)).trip.status === 'COMPLETED' && rets.every((r) => r.status === 'COMPLETED'));

    // ---------------------------------------------------------------- reports, OTP history, LBNP data
    const rep = await cdsApi.report('trips-CDS_RETURN', {});
    ok('Reports: CDS return trips report includes the trip', rep.rows.some((r) => r.tripNo === crt.tripNo));
    const sum = await cdsApi.summary();
    ok('Service Centre dashboard figures from live data', sum.length === 7 && sum.every((k) => typeof k.value === 'number'));
    const otps = (await cdsApi.trip(pt.id)).otps;
    ok('OTP history kept with verification time and user; codes never exposed in trip views', otps.some((o) => o.status === 'VERIFIED' && o.verifiedAt && o.verifiedBy) && otps.every((o) => !('code' in o)));
    const purposes = new Set(st().otps.filter((o) => o.status === 'VERIFIED' && [pt.id, ct.id, rt.id, crt.id].includes(o.tripId)).map((o) => o.purpose));
    ok('All 8 OTP checkpoints verified in this run', purposes.size === 8, [...purposes].join());
    const after = coreSnap();
    const changed = (Object.keys(coreBefore) as (keyof typeof coreBefore)[]).filter((k) => coreBefore[k] !== after[k]);
    ok('Existing LBNP trips, vehicles, drivers, permissions untouched', !changed.length, changed.join());
  } catch (e) {
    ok('unexpected error', false, e instanceof HttpError ? `${e.status} ${e.error?.message ?? e.message}` : (e as Error).stack ?? String(e));
  } finally {
    for (const x of sessions.values()) {
      cdsAuth.set(x.token, x.user);
      await cdsApi.logout().catch(() => undefined);
    }
    if (saved.token && saved.user) cdsAuth.set(saved.token, saved.user);
    else cdsAuth.clear();
    tripSim?.resume();
  }
  const failed = checks.filter((c) => !c.ok);
  return { total: checks.length, passed: checks.length - failed.length, failed, checks: checks.map((c) => `${c.ok ? '✔' : '✖'} ${c.name}${c.detail && !c.ok ? ` — ${c.detail}` : ''}`) };
}
