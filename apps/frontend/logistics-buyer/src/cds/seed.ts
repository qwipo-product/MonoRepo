// CDS demo data: master data (CDS stores, distributors, retailers from the existing customer master, logins,
// Service Centre and CDS fleets) plus four days of operations replayed through the real CdsEngine — including
// the OTP checkpoints — so every record obeys the same rules as live actions. Pure (no app imports).
import { CdsEngine, CDS_STATE_VERSION, localDay, type SkuLine, type StopInput } from './engine.ts';
import type { CdsState, Retailer, TripStop } from './types.ts';

export interface SeedRetailer { id: string; code: string; name: string; ownerName: string; phone: string; address: string; locality: string; lat: number; lng: number }
export interface SeedProduct { name: string; price: number; weightKg: number; category: string }

/** Demo logins for the CDS sign-in page (OTP from the mock panel, default 123456). */
export const CDS_DEMO_USERS = [
  { mobile: '9100000001', label: 'CDS Service Centre' },
  { mobile: '9100000002', label: 'CDS User · CDS Uppal' },
  { mobile: '9100000003', label: 'CDS User · CDS Kukatpally' },
  { mobile: '9100000004', label: 'CDS User · CDS Dilsukhnagar' },
];

function rngOf(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));
  return { int, pick: <T>(xs: T[]) => xs[int(0, xs.length - 1)] };
}

const fleet = (owner: string, prefix: string, defs: [string, number][], people: string[], phoneBase: number) => ({
  vehicles: defs.map(([type, capacityKg], i) => ({ id: `veh-${owner}-${i + 1}`, regNo: `${prefix}${String(11 + i).padStart(2, '0')}`, type, capacityKg, owner, active: true })),
  deliveryPersons: people.map((name, i) => ({ id: `dp-${owner}-${i + 1}`, name, phone: String(phoneBase + i), owner, active: true })),
});

export function buildCdsMasters(retailers: SeedRetailer[]): CdsState {
  const sc = fleet('SC', 'TS08SC00', [['Mini Truck', 1500], ['Mini Truck', 1500], ['Truck', 2500], ['Truck', 2500], ['Pickup', 750], ['Pickup', 750], ['Mini Truck', 1500]],
    ['Kiran Kumar', 'Venu Gopal', 'Mohan Babu', 'Naresh Goud', 'Srikanth Reddy', 'Ramesh Yadav', 'Bhaskar Naidu'], 7702011201);
  const upl = fleet('cds-upl', 'TS08UP00', [['Three Wheeler', 400], ['Pickup', 750], ['Mini Truck', 1500]], ['Prasad Varma', 'Anil Kumar', 'Suresh Babu'], 7702012201);
  const kkp = fleet('cds-kkp', 'TS09KK00', [['Three Wheeler', 400], ['Pickup', 750], ['Mini Truck', 1500]], ['Shiva Prasad', 'Arjun Rao', 'Sandeep Yadav'], 7702013201);
  const dsn = fleet('cds-dsn', 'TS10DS00', [['Three Wheeler', 400], ['Pickup', 750], ['Mini Truck', 1500]], ['Mahesh Babu', 'Ravi Shankar', 'Sai Teja'], 7702014201);
  const stores = [
    { id: 'cds-upl', code: 'CDS-UPL', name: 'CDS Uppal', address: 'Survey 41, IDA Uppal Phase 2, Hyderabad 500039', lat: 17.3995, lng: 78.5548, localities: ['Uppal', 'Boduppal', 'Tarnaka', 'Secunderabad'], managerName: 'Rajesh Kumar', managerPhone: '9100000002', active: true },
    { id: 'cds-kkp', code: 'CDS-KKP', name: 'CDS Kukatpally', address: 'Plot 7, Balanagar Industrial Area, Hyderabad 500037', lat: 17.4762, lng: 78.4321, localities: ['Kukatpally', 'Moosapet', 'Ameerpet', 'Begumpet', 'Mehdipatnam', 'Tolichowki'], managerName: 'Lakshmi Prasanna', managerPhone: '9100000003', active: true },
    { id: 'cds-dsn', code: 'CDS-DSN', name: 'CDS Dilsukhnagar', address: '16-11-740, Moosarambagh, Dilsukhnagar, Hyderabad 500036', lat: 17.3721, lng: 78.5103, localities: ['Dilsukhnagar', 'Kothapet', 'LB Nagar', 'Saroornagar'], managerName: 'Venkat Rao', managerPhone: '9100000004', active: true },
  ];
  return {
    version: CDS_STATE_VERSION,
    seq: 1000,
    settings: { otpExpiryMinutes: 15, otpMaxAttempts: 3, nextDayPlanning: true },
    stores,
    // Synthetic businesses — no real companies.
    distributors: [
      { id: 'dst-01', code: 'DST-01', name: 'Annapurna Agro Foods', contactName: 'Prakash Rao', phone: '9848011101', address: 'Plot 12, Industrial Estate, Uppal, Hyderabad', lat: 17.4012, lng: 78.5621 },
      { id: 'dst-02', code: 'DST-02', name: 'Godavari Edible Oils', contactName: 'Sunitha K', phone: '9848011102', address: 'Plot 33, Kothapet Main Road, Hyderabad', lat: 17.3702, lng: 78.5401 },
      { id: 'dst-03', code: 'DST-03', name: 'Deccan Home Care', contactName: 'Imran Ali', phone: '9848011103', address: '5-2-17, SD Road, Secunderabad', lat: 17.4421, lng: 78.5012 },
      { id: 'dst-04', code: 'DST-04', name: 'Krishna Spices & Masala', contactName: 'Lakshmi Devi', phone: '9848011104', address: 'Plot 8, IDA Kukatpally, Hyderabad', lat: 17.4911, lng: 78.4032 },
      { id: 'dst-05', code: 'DST-05', name: 'Charminar Beverages', contactName: 'Abdul Kareem', phone: '9848011105', address: '12-1-44, Mehdipatnam, Hyderabad', lat: 17.3962, lng: 78.4381 },
      { id: 'dst-06', code: 'DST-06', name: 'Telangana Staples Co.', contactName: 'Ravi Teja', phone: '9848011106', address: 'Plot 21, LB Nagar Ring Road, Hyderabad', lat: 17.3481, lng: 78.5498 },
    ],
    // all retailers of the customer master; CDS stores serve the ones in their localities
    retailers: retailers as Retailer[],
    users: [
      { id: 'usr-sc', name: 'Service Centre Admin', mobile: '9100000001', email: 'service.centre@cds.example', role: 'SERVICE_CENTRE', cdsStoreIds: stores.map((s) => s.id), active: true },
      { id: 'usr-upl', name: 'Rajesh Kumar', mobile: '9100000002', email: 'uppal@cds.example', role: 'CDS_USER', cdsStoreIds: ['cds-upl'], active: true },
      { id: 'usr-kkp', name: 'Lakshmi Prasanna', mobile: '9100000003', email: 'kukatpally@cds.example', role: 'CDS_USER', cdsStoreIds: ['cds-kkp'], active: true },
      { id: 'usr-dsn', name: 'Venkat Rao', mobile: '9100000004', email: 'dilsukhnagar@cds.example', role: 'CDS_USER', cdsStoreIds: ['cds-dsn'], active: true },
    ],
    sessions: [],
    vehicles: [...sc.vehicles, ...upl.vehicles, ...kkp.vehicles, ...dsn.vehicles],
    deliveryPersons: [...sc.deliveryPersons, ...upl.deliveryPersons, ...kkp.deliveryPersons, ...dsn.deliveryPersons],
    orders: [], plans: [], trips: [], otps: [], grns: [], returns: [], collections: [], dpEventIds: [], audit: [],
  };
}

/** Distributor assortments by product category. */
const ASSORTMENT: Record<string, string[]> = {
  'dst-01': ['Rice', 'Atta', 'Pulses', 'Sugar'],
  'dst-02': ['Edible Oil', 'Pooja'],
  'dst-03': ['Home Care', 'Personal Care'],
  'dst-04': ['Spices', 'Salt'],
  'dst-05': ['Beverages', 'Biscuits'],
  'dst-06': ['Rice', 'Atta', 'Sugar', 'Salt', 'Pulses'],
};

/**
 * Four days of operations so every module and status has records: completed / short pickups, CDS handovers,
 * GRNs pending and generated, deliveries full / partial / failed, retailer returns at every step, a completed and
 * a running CDS Return Trip, collections at every stage, and today's live trips and planning queues.
 */
export function buildCdsState(retailers: SeedRetailer[], products: SeedProduct[], now = new Date()): CdsState {
  const s = buildCdsMasters(retailers);
  const rng = rngOf(20261113);
  const at = (offset: number, hour: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour).getTime();
  let t = at(-3, 7);
  const e = new CdsEngine(s, () => new Date(t));
  const tick = (min: number) => (t += min * 60000);
  const day = (offset: number) => localDay(new Date(at(offset, 12)));
  const SC = 'Service Centre Admin';
  const DP = 'Delivery Partner App';
  const USER: Record<string, string> = { 'cds-upl': 'Rajesh Kumar', 'cds-kkp': 'Lakshmi Prasanna', 'cds-dsn': 'Venkat Rao' };
  const STORES = ['cds-upl', 'cds-kkp', 'cds-dsn'];
  const skus = products.map((p, i) => ({ sku: `SKU${1001 + i}`, name: p.name, unitPrice: p.price, unitWeightKg: p.weightKg, category: p.category }));

  // ---------------------------------------------------------------- helpers
  let ref = 51000;
  const pool = (store: string) => s.retailers.filter((r) => s.stores.find((x) => x.id === store)!.localities.includes(r.locality));
  const place = (dist: string, store: string) => {
    const range = skus.filter((k) => ASSORTMENT[dist].includes(k.category));
    const m = new Map<string, number>();
    const n = rng.int(1, Math.min(3, range.length));
    while (m.size < n) {
      const k = rng.pick(range);
      m.set(k.sku, k.unitWeightKg >= 10 ? rng.int(1, 3) : rng.int(4, 14));
    }
    tick(rng.int(2, 6));
    const lines: SkuLine[] = Array.from(m.entries()).map(([sku, qty]) => {
      const k = skus.find((x) => x.sku === sku)!;
      return { sku, name: k.name, unitPrice: k.unitPrice, unitWeightKg: k.unitWeightKg, qty };
    });
    return e.allocateCdsOrder({ sellerOrderRef: `SS-${++ref}`, distributorId: dist, retailerId: rng.pick(pool(store)).id, paymentMode: rng.int(0, 3) ? 'COD' : 'PREPAID', lines }, 'Seller Store');
  };
  const res = (owner: string, date: string, loadKg: number) => {
    const r = e.resources(owner, date);
    const v = r.vehicles.filter((x) => x.available && x.capacityKg >= loadKg).sort((a, b) => a.capacityKg - b.capacityKg)[0];
    const p = r.deliveryPersons.find((x) => x.available);
    if (!v || !p) throw new Error(`CDS seed: no free vehicle / delivery person for ${owner} on ${date}`);
    return { vehicleId: v.id, deliveryPersonId: p.id };
  };
  /** Sends the OTP for a stop and completes it with that OTP (as the delivery person would). */
  const stop = (tripId: string, idx: number, input: Omit<StopInput, 'otp'> = {}) => {
    tick(rng.int(6, 18));
    const st = e.trip(tripId).stops[idx];
    const otp = e.sendOtp(tripId, st.id, DP);
    tick(1);
    const r = e.completeStop(tripId, st.id, { ...input, otp: otp.code }, DP);
    if (r.error) throw r.error;
  };
  const fail = (tripId: string, idx: number, reason: string) => {
    tick(10);
    e.failStop(tripId, e.trip(tripId).stops[idx].id, reason, DP);
  };
  const short = (st: TripStop, by: number) => ({ lines: st.lines.map((l, i) => ({ idx: i, actualQty: i === 0 ? Math.max(1, l.plannedQty - by) : l.plannedQty })) });
  const pickupPlan = (orderIds: string[], date: string, withDelivery: boolean) => {
    const kg = orderIds.reduce((a, id) => a + e.order(id).weightKg, 0);
    const a = res('SC', date, kg);
    tick(15);
    return e.createPickupPlan({ orders: orderIds.map((orderId) => ({ orderId })), plannedDate: date, slot: '08:00 – 12:00', pickup: a, cdsDelivery: withDelivery ? a : null }, SC);
  };
  const runAll = (tripId: string, shortAt = -1, by = 2) => {
    e.startTrip(tripId, DP);
    e.trip(tripId).stops.forEach((st, i) => stop(tripId, i, i === shortAt ? short(st, by) : {}));
  };
  const completeGrns = (damage: boolean) => {
    s.grns.filter((g) => g.status === 'PENDING').forEach((g, gi) => {
      tick(20);
      e.completeGrn(g.id, {
        lines: g.lines.map((l, i) => {
          const dmg = damage && gi === 0 && i === 0 && l.receivedQty >= 3 ? 1 : 0;
          return { idx: i, acceptedQty: l.receivedQty - dmg, damagedQty: dmg, remarks: dmg ? 'Pack torn during unloading' : l.shortQty ? 'Short received from vehicle' : l.excessQty ? 'Extra unit received' : '' };
        }),
      }, USER[g.cdsStoreId]);
    });
  };
  const ready = (store: string) => s.orders.filter((o) => o.cdsStoreId === store && o.status === 'READY_FOR_DELIVERY').map((o) => o.id);
  const deliveryPlan = (store: string, date: string, orderIds: string[], returnIds: string[] = []) => {
    if (!orderIds.length && !returnIds.length) return null;
    const kg = orderIds.reduce((a, id) => a + e.order(id).lines.reduce((x, l) => x + (l.acceptedQty - l.deliveredQty) * l.unitWeightKg, 0), 0);
    tick(10);
    return e.createDeliveryPlan({ cdsStoreId: store, orderIds, returnIds, plannedDate: date, slot: '09:00 – 13:00', ...res(store, date, kg) }, USER[store]).trip;
  };
  /** Runs a retailer trip: load at the CDS, then each retailer stop by `plan`, returns collected and handed over. */
  const runRetailerTrip = (tripId: string, plan: ('full' | 'partial' | 'fail')[], adHocReturn = false, upTo = Infinity) => {
    e.startTrip(tripId, DP);
    let k = 0;
    let n = 0;
    for (let i = 0; i < e.trip(tripId).stops.length && n < upTo; i++) {
      const st = e.trip(tripId).stops[i];
      if (st.status !== 'PENDING') continue;
      n++;
      if (st.action === 'RETAILER_DELIVERY') {
        const mode = plan[k++] ?? 'full';
        if (mode === 'fail') {
          fail(tripId, i, rng.pick(['Shop closed', 'Retailer not available', 'Payment not ready']));
          continue;
        }
        const qty = (j: number, q: number) => (mode === 'partial' && j === 0 ? Math.max(1, q - 2) : q);
        const orders = Array.from(new Set(st.lines.map((l) => l.orderId!)));
        const collections = orders.filter((oid) => e.order(oid).paymentMode === 'COD').map((oid) => ({
          orderId: oid, mode: (rng.int(0, 2) ? 'CASH' : 'UPI') as 'CASH' | 'UPI',
          amount: Math.round(st.lines.reduce((a, l, j) => a + (l.orderId === oid ? qty(j, l.plannedQty) * l.unitPrice : 0), 0) * 100) / 100,
        }));
        stop(tripId, i, { ...(mode === 'partial' ? short(st, 2) : {}), collections });
        if (adHocReturn && k === 1) {
          // the retailer hands back a damaged unit during the visit
          const o = e.order(orders[0]);
          const l = o.lines.find((x) => x.deliveredQty >= 2);
          if (l) e.addReturnAtStop(tripId, st.id, { orderId: o.id, lines: [{ sku: l.sku, qty: 1, reason: 'Damaged in transit', condition: 'DAMAGED' }] }, DP);
        }
      } else if (st.action === 'RETURN_HANDOVER_CDS') {
        stop(tripId, i, { lines: st.lines.map((l, j) => ({ idx: j, actualQty: l.plannedQty, acceptedQty: j === 0 && l.plannedQty > 1 ? l.plannedQty - 1 : l.plannedQty, rejectedQty: j === 0 && l.plannedQty > 1 ? 1 : 0 })) });
      } else stop(tripId, i);
    }
  };
  const initiate = (store: string, n: number) => {
    const out: string[] = [];
    for (const o of s.orders.filter((x) => x.cdsStoreId === store && ['DELIVERED', 'PARTIALLY_DELIVERED'].includes(x.status))) {
      if (out.length >= n) break;
      const l = o.lines.find((x) => e.returnableQty(o, x.sku) >= 2);
      if (!l) continue;
      tick(15);
      out.push(e.initiateReturn({ orderId: o.id, lines: [{ sku: l.sku, qty: rng.int(1, 2), reason: rng.pick(['Expired / near expiry', 'Wrong item', 'Quality issue', 'Excess quantity']), condition: 'GOOD' }] }, USER[store]).id);
    }
    return out;
  };
  const collectionsOf = (store: string, status: string) => s.collections.filter((c) => c.cdsStoreId === store && c.status === status);
  const received = () => s.returns.filter((r) => r.status === 'RECEIVED_AT_CDS' && !r.returnTripId && r.lines.some((l) => (l.acceptedQty ?? 0) > 0)).map((r) => r.id);
  const returnPlan = (ids: string[], date: string) => {
    const kg = ids.reduce((a, id) => a + e.ret(id).lines.reduce((x, l) => x + (l.acceptedQty ?? 0) * l.unitWeightKg, 0), 0);
    tick(10);
    return e.createReturnPlan({ returnIds: ids, plannedDate: date, slot: '14:00 – 18:00', ...res('SC', date, kg) }, SC).trip;
  };

  // ---------------------------------------------------------------- day -3: multi-distributor pickup → 3 CDS stores; GRNs; delivery plans for day -2
  t = at(-3, 7);
  const a1 = ['dst-01', 'dst-02', 'dst-03'].flatMap((d) => STORES.map((st) => place(d, st)));
  const p1 = pickupPlan(a1.map((o) => o.id), day(-3), true);
  runAll(p1.pickupTrip.id, 0); // first distributor short by 2 on one line
  runAll(p1.cdsDeliveryTrip!.id, 1, 1); // one unit short at the second CDS
  completeGrns(true); // one torn pack → GRN return to the distributor
  t = at(-3, 18);
  STORES.forEach((st) => deliveryPlan(st, day(-2), ready(st)));

  // ---------------------------------------------------------------- day -2: deliveries (partial, failed, ad-hoc return), collections, second pickup plan
  t = at(-2, 7);
  STORES.forEach((st, i) => {
    const tr = s.trips.find((x) => x.type === 'RETAILER_DELIVERY' && x.owner === st && x.plannedDate === day(-2));
    if (tr) runRetailerTrip(tr.id, i === 0 ? ['full', 'partial', 'fail'] : i === 1 ? ['full', 'full', 'partial'] : ['full', 'fail', 'full'], true);
  });
  STORES.forEach((st) => {
    tick(30);
    const cs = collectionsOf(st, 'WITH_DELIVERY_PERSON');
    if (cs.length) e.receiveCollections(st, { items: cs.map((c) => ({ id: c.id, amount: c.amount })) }, USER[st]);
  });
  const a2 = ['dst-04', 'dst-05', 'dst-06'].flatMap((d) => STORES.map((st) => place(d, st)));
  const p2 = pickupPlan(a2.map((o) => o.id), day(-2), true);
  runAll(p2.pickupTrip.id);
  runAll(p2.cdsDeliveryTrip!.id);
  completeGrns(false);
  t = at(-2, 18);
  STORES.forEach((st) => deliveryPlan(st, day(-1), ready(st), initiate(st, 2)));
  const rp1 = received().length ? returnPlan(received(), day(-1)) : null;

  // ---------------------------------------------------------------- day -1: deliveries with returns, return trip completed, collections to Qwipo, GRNs pending
  t = at(-1, 7);
  STORES.forEach((st) => {
    const tr = s.trips.find((x) => x.type === 'RETAILER_DELIVERY' && x.owner === st && x.plannedDate === day(-1));
    if (tr) runRetailerTrip(tr.id, st === 'cds-kkp' ? ['full', 'full', 'full', 'full'] : ['full', 'full', 'partial']);
  });
  if (rp1) runAll(rp1.id);
  STORES.forEach((st) => {
    tick(20);
    const rec = collectionsOf(st, 'RECEIVED_BY_CDS');
    if (rec.length) e.handToQwipo(st, rec.map((c) => c.id), `DEP-${st.slice(-3).toUpperCase()}-${day(-1).replace(/-/g, '')}`, USER[st]);
    const cs = collectionsOf(st, 'WITH_DELIVERY_PERSON');
    if (cs.length) e.receiveCollections(st, { items: cs.map((c, j) => ({ id: c.id, amount: j === 0 && st === 'cds-kkp' ? Math.max(0, c.amount - 50) : c.amount })), note: st === 'cds-kkp' ? '₹50 short — delivery person to pay tomorrow' : undefined }, USER[st]);
  });
  const a3 = ['dst-01', 'dst-01', 'dst-01', 'dst-06'].flatMap((d) => STORES.map((st) => place(d, st)));
  const p3 = pickupPlan(a3.map((o) => o.id), day(-1), true);
  runAll(p3.pickupTrip.id);
  runAll(p3.cdsDeliveryTrip!.id);
  // Annapurna GRNs verified; Telangana Staples GRNs stay Pending Verification
  s.grns.filter((g) => g.status === 'PENDING' && g.distributorId === 'dst-01').forEach((g) => {
    tick(20);
    e.completeGrn(g.id, { lines: g.lines.map((l, i) => ({ idx: i, acceptedQty: l.receivedQty, damagedQty: 0 })) }, USER[g.cdsStoreId]);
  });
  // planning for today, done yesterday evening (next-day rule)
  t = at(-1, 18);
  const todayTrips = STORES.map((st) => deliveryPlan(st, day(0), ready(st).slice(0, 2), initiate(st, 1))); // the rest stay Ready for Delivery
  const rp2 = received().length ? returnPlan(received().slice(0, 3), day(0)) : null;

  // ---------------------------------------------------------------- today: live trips and planning queues
  t = Math.min(at(0, 7), Math.max(at(0, 0) + 60000, now.getTime() - 3 * 3600000));
  if (todayTrips[0]) runRetailerTrip(todayTrips[0].id, ['full'], false, 2); // loaded at the CDS, first retailer delivered
  if (rp2) {
    e.startTrip(rp2.id, DP);
    stop(rp2.id, 0); // returns loaded at the first CDS
  }
  const fresh = ['dst-02', 'dst-03', 'dst-04', 'dst-05'].flatMap((d) => STORES.map((st) => place(d, st)));
  // today's pickup is running: first distributor collected; the CDS delivery leg waits
  const p4 = pickupPlan(fresh.filter((o) => ['dst-02', 'dst-03'].includes(o.distributorId)).slice(0, 4).map((o) => o.id), day(0), true);
  e.startTrip(p4.pickupTrip.id, DP);
  stop(p4.pickupTrip.id, 0);
  // a pickup done without a CDS leg → waits in Deliver to CDS
  const p5 = pickupPlan(fresh.filter((o) => o.distributorId === 'dst-05').slice(0, 2).map((o) => o.id), day(0), false);
  runAll(p5.pickupTrip.id);
  // Qwipo (SNP) settled the earliest handovers
  STORES.slice(0, 2).forEach((st) => {
    const h = collectionsOf(st, 'HANDED_TO_QWIPO');
    if (h.length) e.recordSettlement(st, h.map((c) => c.id), `QWP-STL-${day(0).replace(/-/g, '')}-${st.slice(-3).toUpperCase()}`, USER[st]);
  });
  return s;
}
