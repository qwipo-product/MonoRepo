// In-app end-to-end check of the CDS workflow through its HTTP API (the same calls the screens make): Seller Store
// allocation → pickup planning → distributor pickup trip → CDS delivery trip → handover OTP at the CDS (no GRN; orders
// Ready for Delivery) → LBNP-style Delivery Planning (Plan Routes → Confirm Routes → Generate Trip) → retailer delivery
// with cash collection, with OTPs at all 4 checkpoints, role-based access, CDS-store isolation, the Delivery Partner
// App endpoints, the Performance Report, and the existing LBNP data untouched. There are no returns.
// Note: it adds orders and trips to the CDS demo data in this browser (use "Reset demo data" afterwards if needed).
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
    ok('Service Centre menu: Orders, Pickup Planning, Deliver to CDS, Trips, Reports, Settings, CDS Stores', sc.pages.join() === 'sc-orders,sc-pickup,sc-deliver,sc-trips,sc-reports,sc-settings,sc-stores', sc.pages.join());
    await fails('Service Centre cannot open the CDS User delivery routes', () => cdsApi.deliveryRoutes(), 403);
    await fails('Service Centre cannot open the CDS User customers', () => cdsApi.customers(), 403);
    await fails('Service Centre Trips never include retailer trips', () => cdsApi.searchTrips({ types: ['RETAILER_DELIVERY'] }), 403);
    const cu = await as('9100000002');
    ok('CDS User menu (as LBNP): Orders, Delivery Planning, Trips, Reports, Customers, Settings', cu.pages.join() === 'cu-orders,cu-delivery,cu-trips,cu-reports,cu-customers,cu-settings', cu.pages.join());
    await fails('CDS User cannot open Pickup Planning', () => cdsApi.createPickupPlan({ orders: [], plannedDate: '', pickup: { vehicleId: '', deliveryPersonId: '' } }), 403);
    await fails('CDS User Trips show only retailer trips', () => cdsApi.searchTrips({ types: ['DISTRIBUTOR_PICKUP'] }), 403);
    await fails('CDS User cannot read another store’s orders', () => cdsApi.searchOrders({ cdsStoreId: 'cds-kkp' }), 403);
    const otherOrder = st().orders.find((o) => o.cdsStoreId === 'cds-kkp')!;
    await fails('CDS User cannot open another store’s order', () => cdsApi.order(otherOrder.id), 403);
    const mine = await cdsApi.searchOrders({ pageSize: 0 });
    ok('CDS User sees only its own store’s orders', mine.rows.length > 0 && mine.rows.every((o) => o.cdsStoreId === 'cds-upl'));
    const custs = await cdsApi.customers();
    ok('Customers: the retailers in the store’s service area (view only)', custs.length > 0 && custs.every((c) => c.code && c.name && typeof c.lat === 'number'));

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
    await fails('The store cannot accept more than was dispatched', () => cdsApi.completeStop(ct.id, cdsStopU.id, { otp: otpCode(ho), lines: cdsStopU.lines.map((l, i) => ({ idx: i, actualQty: l.plannedQty + 1 })) }), 400, /cannot be more/);
    await cdsApi.completeStop(ct.id, cdsStopU.id, { otp: otpCode(ho), lines: cdsStopU.lines.map((l, i) => ({ idx: i, actualQty: i === 0 ? l.plannedQty - 1 : l.plannedQty })) });
    await doStop(ct, 'CDS_HANDOVER');
    const h1 = await cdsApi.order(a1.order.id);
    ok('No GRN: the handover OTP makes the order Ready for Delivery with the accepted units', (await cdsApi.trip(ct.id)).trip.status === 'PARTIALLY_COMPLETED' && h1.order.status === 'READY_FOR_DELIVERY' && h1.order.lines[0].acceptedQty === 8);
    ok('Short at handover = picked − accepted', h1.order.lines[0].pickedQty - h1.order.lines[0].acceptedQty === 1);

    // ---------------------------------------------------------------- 6. Delivery Planning (LBNP routes) → retailer trip
    await as('9100000002');
    const m2 = await cdsApi.meta();
    await fails('Delivery routes are planned for the next day', () => cdsApi.planRoutes({ orderIds: [a1.order.id], plannedDate: m2.today }), 400, /next day/);
    const proposal = await cdsApi.planRoutes({ orderIds: [a1.order.id, a2.order.id], plannedDate: m2.tomorrow });
    ok('Plan Routes: routes by locality on the store’s own vehicles, within capacity', proposal.routes.some((r) => r.orderIds.includes(a1.order.id)) && proposal.routes.every((r) => r.loadKg <= r.capacityKg && r.localities.length > 0));
    ok('Plan Routes saves nothing', (await cdsApi.order(a1.order.id)).order.status === 'READY_FOR_DELIVERY');
    const veh = proposal.routes[0].vehicleId;
    const [route] = await cdsApi.confirmRoutes({ plannedDate: m2.tomorrow, routes: [{ vehicleId: veh, orderIds: [a1.order.id, a2.order.id] }] });
    ok('Confirm Routes: orders Delivery Planned; the route waits for its trip', (await cdsApi.order(a1.order.id)).order.status === 'DELIVERY_PLANNED' && (await cdsApi.deliveryRoutes()).some((x) => x.id === route.id && !x.trip));
    await fails('Planned orders cannot be put on a second route', () => cdsApi.confirmRoutes({ plannedDate: m2.tomorrow, routes: [{ vehicleId: veh, orderIds: [a1.order.id] }] }), 409);
    const cres = await cdsApi.resources(m2.tomorrow);
    ok('A confirmed route reserves its vehicle for the day', cres.vehicles.find((x) => x.id === veh)?.available === false);
    const cp = cres.deliveryPersons.find((x) => x.available)!;
    const rt = await cdsApi.generateRouteTrip(route.id, { deliveryPersonId: cp.id });
    ok('Generate Trip: retailer trip with the chosen delivery person, loading at the CDS first', rt.type === 'RETAILER_DELIVERY' && rt.deliveryPersonId === cp.id && rt.vehicleId === veh && rt.stops[0].action === 'CDS_ORDER_PICKUP');
    await fails('A route generates one trip only', () => cdsApi.generateRouteTrip(route.id, { deliveryPersonId: cp.id }), 409);
    await cdsApi.startTrip(rt.id);
    const lo = await doStop(rt, 'CDS_ORDER_PICKUP');
    ok('Order pickup at CDS: OTP to the CDS User', /CDS Uppal/.test(lo.sentToName));
    await doStop(rt, 'RETAILER_DELIVERY', (s) => s.partyId === retU2.id);
    ok('Prepaid order delivered (no collection)', (await cdsApi.order(a2.order.id)).order.status === 'DELIVERED');
    const dl = await doStop(rt, 'RETAILER_DELIVERY', (s) => s.partyId === retU.id, { collections: [{ orderId: a1.order.id, amount: 1000, mode: 'CASH' }] });
    ok('Retailer delivery: OTP to the retailer', dl.sentToPhone === retU.phone);
    ok('COD order partially delivered (short at handover)', (await cdsApi.order(a1.order.id)).order.status === 'PARTIALLY_DELIVERED');
    const tv = await cdsApi.trip(rt.id);
    ok('Cash collected is recorded on the trip', tv.collections.some((c) => c.orderId === a1.order.id && c.amount === 1000 && c.mode === 'CASH' && c.deliveryPersonName === cp.name));
    ok('Retailer trip completed', tv.trip.status === 'COMPLETED');

    // ---------------------------------------------------------------- Delivery Partner App
    await as('9100000003');
    const m3 = await cdsApi.meta();
    const pk = await cdsApi.planRoutes({ orderIds: [a3.order.id], plannedDate: m3.tomorrow });
    const [rk] = await cdsApi.confirmRoutes({ plannedDate: m3.tomorrow, routes: pk.routes.map((r) => ({ vehicleId: r.vehicleId, orderIds: r.orderIds })) });
    const kp = (await cdsApi.resources(m3.tomorrow)).deliveryPersons.find((x) => x.available)!;
    const kt = await cdsApi.generateRouteTrip(rk.id, { deliveryPersonId: kp.id });
    const first = kt.stops[0];
    const ev = (type: string, extra: Record<string, unknown> = {}) => post<{ duplicate: boolean }>(`/cds/dp/trips/${kt.id}/events`, { eventId: `e2e-${tag}-${type}`, deliveryPersonId: kp.id, type, stopId: first.id, ...extra });
    await fails('Delivery Partner App: only the assigned delivery person', () => post(`/cds/dp/trips/${kt.id}/events`, { eventId: `e2e-${tag}-x`, deliveryPersonId: 'dp-SC-99', type: 'SEND_OTP', stopId: first.id }), 403);
    await ev('START');
    await ev('SEND_OTP');
    const code = st().otps.filter((o) => o.stopId === first.id && o.status === 'ACTIVE')[0].code;
    const c1 = await ev('COMPLETE', { otp: code });
    const c2 = await ev('COMPLETE', { otp: code });
    ok('Delivery Partner App events are processed once (duplicate ignored)', !c1.duplicate && c2.duplicate);
    ok('Loaded through the Delivery Partner App: order Out for Delivery', (await cdsApi.order(a3.order.id)).order.status === 'OUT_FOR_DELIVERY');

    // ---------------------------------------------------------------- reports, OTP history, LBNP data
    await as('9100000002');
    const perf = await cdsApi.report('performance', { from: m2.today, to: m2.tomorrow });
    ok('CDS User Performance Report: one row per day with totals', perf.rows.length === 2 && perf.columns[0].label === 'Date' && !!perf.totals);
    await fails('CDS User has only the Performance Report', () => cdsApi.report('trips-RETAILER_DELIVERY', {}), 404);
    await as('9100000001');
    const rep = await cdsApi.report('trips-CDS_DELIVERY', {});
    ok('Reports: CDS delivery trips report includes the trip', rep.rows.some((r) => r.tripNo === ct.tripNo));
    const sum = await cdsApi.summary();
    ok('Service Centre dashboard figures from live data', sum.length === 5 && sum.every((k) => typeof k.value === 'number'));
    const otps = (await cdsApi.trip(pt.id)).otps;
    ok('OTP history kept with verification time and user; codes never exposed in trip views', otps.some((o) => o.status === 'VERIFIED' && o.verifiedAt && o.verifiedBy) && otps.every((o) => !('code' in o)));
    const purposes = new Set(st().otps.filter((o) => o.status === 'VERIFIED' && [pt.id, ct.id, rt.id].includes(o.tripId)).map((o) => o.purpose));
    ok('All 4 OTP checkpoints verified in this run', purposes.size === 4, [...purposes].join());
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
