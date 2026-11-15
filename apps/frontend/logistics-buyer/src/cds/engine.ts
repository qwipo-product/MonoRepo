// CDS business rules. Pure: works on a CdsState object and a clock (no app / mock-server imports), so the same
// code runs behind the API (src/mock/routes/cds.ts), in the demo seed and in Node unit tests.
// Every status change goes through the flow tables in ./status.ts; every pickup / handover goes through an OTP.
import { routeMetrics, round2, sequenceStops, serviceStoreFor } from './planning.ts';
import { ACTIVE_TRIP, ORDER_FLOW, STOP_ACTION, TRIP_FLOW, TRIP_TYPE } from './status.ts';
import type {
  CdsOrder, CdsState, CdsStore, Collection, DeliveryPerson, DeliveryRoute, Distributor, OrderStatus, OtpTxn, PartyType, Plan,
  Retailer, StopAction, StopLine, Trip, TripStatus, TripStop, TripType, Vehicle,
} from './types.ts';

/** Bump when the demo data changes: stored CDS data of an older version is rebuilt on next use. */
export const CDS_STATE_VERSION = 7;

export class CdsError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
const bad = (m: string) => new CdsError(400, m);
const conflict = (m: string) => new CdsError(409, m);
const notFound = (m: string) => new CdsError(404, m);

const pad = (n: number) => String(n).padStart(2, '0');
export const localDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isQty = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0;
const sum = <T>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0);
const uniq = <T>(xs: T[]) => Array.from(new Set(xs));

export interface SkuLine { sku: string; name: string; unitPrice: number; unitWeightKg: number; qty: number }
export interface SellerOrderInput {
  sellerOrderRef: string;
  distributorId: string;
  retailerId: string;
  paymentMode?: 'COD' | 'PREPAID';
  lines: SkuLine[];
}
export interface Assignment { vehicleId: string; deliveryPersonId: string }
export interface StopInput {
  otp: string;
  /** Per stop line (by index): actual quantity (at a CDS handover: the units the store accepts). */
  lines?: { idx: number; actualQty: number }[];
  /** RETAILER_DELIVERY: money collected per COD order. */
  collections?: { orderId: string; amount: number; mode: 'CASH' | 'UPI' }[];
  note?: string;
}

/** The Service Centre's dispatch point (start of pickup / return trips). */
export const SC_HUB = { name: 'CDS Service Centre', address: 'Plot 9, Cherlapally Industrial Area, Hyderabad 500051', lat: 17.4504, lng: 78.5987 };

export class CdsEngine {
  s: CdsState;
  clock: () => Date;
  /** OTP code generator (replaceable in tests). */
  otpCode: () => string = () => String(100000 + Math.floor(Math.random() * 900000));
  constructor(s: CdsState, clock: () => Date = () => new Date()) {
    this.s = s;
    this.clock = clock;
  }

  now() {
    return this.clock().toISOString();
  }
  today() {
    return localDay(this.clock());
  }
  tomorrow() {
    const d = this.clock();
    return localDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12));
  }
  private seq() {
    return ++this.s.seq;
  }
  private stamp(by: string) {
    const at = this.now();
    return { createdAt: at, createdBy: by, updatedAt: at, updatedBy: by };
  }
  private touch(x: { updatedAt: string; updatedBy: string }, by: string) {
    x.updatedAt = this.now();
    x.updatedBy = by;
  }
  audit(entity: CdsState['audit'][number]['entity'], entityId: string, by: string, action: string, detail = '') {
    this.s.audit.push({ id: `aud-${this.seq()}`, at: this.now(), by, entity, entityId, action, detail });
  }

  // ---------------------------------------------------------------- lookups

  store(id: string): CdsStore {
    const x = this.s.stores.find((v) => v.id === id);
    if (!x) throw notFound(`CDS store ${id} not found`);
    return x;
  }
  distributor(id: string): Distributor {
    const x = this.s.distributors.find((v) => v.id === id);
    if (!x) throw notFound(`Distributor ${id} not found`);
    return x;
  }
  retailer(id: string): Retailer {
    const x = this.s.retailers.find((v) => v.id === id);
    if (!x) throw notFound(`Retailer ${id} not found`);
    return x;
  }
  order(id: string): CdsOrder {
    const x = this.s.orders.find((v) => v.id === id || v.orderNo === id);
    if (!x) throw notFound(`Order ${id} not found`);
    return x;
  }
  trip(id: string): Trip {
    const x = this.s.trips.find((v) => v.id === id || v.tripNo === id);
    if (!x) throw notFound(`Trip ${id} not found`);
    return x;
  }
  plan(id: string): Plan {
    const x = this.s.plans.find((v) => v.id === id || v.planNo === id);
    if (!x) throw notFound(`Route ${id} not found`);
    return x;
  }
  /** CDS store whose service area polygon holds the retailer's location (nearest when areas overlap). */
  storeFor(r: { lat: number; lng: number; locality?: string }): CdsStore | null {
    return serviceStoreFor(this.s.stores, r);
  }
  cdsUserOf(storeId: string) {
    return this.s.users.find((u) => u.role === 'CDS_USER' && u.active && u.cdsStoreIds.includes(storeId)) ?? null;
  }

  // ---------------------------------------------------------------- status changes

  private setOrder(o: CdsOrder, to: OrderStatus, by: string, note?: string) {
    if (o.status === to) return;
    if (!ORDER_FLOW[o.status].includes(to)) throw conflict(`Order ${o.orderNo}: cannot change ${o.status} → ${to}`);
    o.history.push({ from: o.status, to, at: this.now(), by, note });
    o.status = to;
    this.touch(o, by);
  }
  private setTrip(t: Trip, to: TripStatus, by: string, note?: string) {
    if (t.status === to) return;
    if (!TRIP_FLOW[t.status].includes(to)) throw conflict(`${t.tripNo}: cannot change ${t.status} → ${to}`);
    t.history.push({ from: t.status, to, at: this.now(), by, note });
    t.status = to;
    if (to === 'COMPLETED' || to === 'PARTIALLY_COMPLETED' || to === 'CANCELLED') t.completedAt = this.now();
    this.touch(t, by);
  }

  // ---------------------------------------------------------------- 1. Seller order allocation (CDS Store Delivery)

  /** Order confirmed in the Seller Store with delivery type CDS Store Delivery → CDS Service Centre. Idempotent. */
  allocateCdsOrder(input: SellerOrderInput, by = 'Seller Store'): CdsOrder {
    const dup = this.s.orders.find((o) => o.sellerOrderRef === input.sellerOrderRef);
    if (dup) return dup;
    this.distributor(input.distributorId);
    const r = this.retailer(input.retailerId);
    const store = this.storeFor(r);
    if (!store) throw bad(`${r.name} (${r.locality}) is not served by any CDS store: the location is outside every CDS service area — use 3PL delivery`);
    if (!input.lines?.length || input.lines.some((l) => !isQty(l.qty) || l.qty === 0)) throw bad('Every order line needs a quantity of at least 1');
    const lines = input.lines.map((l) => ({
      sku: l.sku, name: l.name, qty: l.qty, unitPrice: l.unitPrice, unitWeightKg: l.unitWeightKg,
      pickedQty: 0, acceptedQty: 0, deliveredQty: 0,
    }));
    const o: CdsOrder = {
      id: `ord-${this.seq()}`, orderNo: `CDS-${this.seq()}`, sellerOrderRef: input.sellerOrderRef, confirmedAt: this.now(),
      distributorId: input.distributorId, cdsStoreId: store.id, retailerId: r.id, lines,
      orderValue: round2(sum(lines, (l) => l.qty * l.unitPrice)), weightKg: round2(sum(lines, (l) => l.qty * l.unitWeightKg)),
      paymentMode: input.paymentMode ?? 'COD', status: 'CONFIRMED', pickupTripId: null, cdsTripId: null, deliveryTripId: null,
      deliveredAt: null, note: null, history: [{ from: null, to: 'CONFIRMED', at: this.now(), by, note: `Seller order ${input.sellerOrderRef}` }], ...this.stamp(by),
    };
    this.s.orders.push(o);
    this.audit('ORDER', o.id, by, 'ALLOCATED_TO_CDS', `${o.orderNo} → ${store.name}`);
    return o;
  }

  cancelOrder(id: string, reason: string, by: string) {
    const o = this.order(id);
    if (!reason?.trim()) throw bad('A cancellation reason is required');
    this.setOrder(o, 'CANCELLED', by, reason);
    this.audit('ORDER', o.id, by, 'CANCELLED', reason);
    return o;
  }

  // ---------------------------------------------------------------- vehicles & delivery persons

  /** A confirmed delivery route that still waits for its trip reserves its vehicle for that day. */
  private waitingRoutes(date: string) {
    return this.s.plans.filter((p) => p.kind === 'RETAILER_DELIVERY' && p.route && p.plannedDate === date && !p.tripIds.length);
  }
  private busyOn(kind: 'vehicleId' | 'deliveryPersonId', id: string, date: string, exceptPlanId?: string): { tripNo: string } | null {
    const t = this.s.trips.find((x) => x[kind] === id && x.plannedDate === date && ACTIVE_TRIP.includes(x.status));
    if (t) return t;
    if (kind === 'vehicleId') {
      const r = this.waitingRoutes(date).find((p) => p.route!.vehicleId === id && p.id !== exceptPlanId);
      if (r) return { tripNo: r.planNo };
    }
    return null;
  }
  resources(owner: string, date: string) {
    return {
      vehicles: this.s.vehicles.filter((v) => v.owner === owner).map((v) => {
        const b = this.busyOn('vehicleId', v.id, date);
        return { ...v, available: v.active && !b, busyTripNo: b?.tripNo ?? null };
      }),
      deliveryPersons: this.s.deliveryPersons.filter((p) => p.owner === owner).map((p) => {
        const b = this.busyOn('deliveryPersonId', p.id, date);
        return { ...p, available: p.active && !b, busyTripNo: b?.tripNo ?? null };
      }),
    };
  }
  private assign(owner: string, date: string, a: Assignment, loadKg: number, exceptPlanId?: string): { v: Vehicle; p: DeliveryPerson } {
    const v = this.s.vehicles.find((x) => x.id === a?.vehicleId);
    if (!v || v.owner !== owner) throw bad('Select a vehicle');
    if (!v.active) throw conflict(`Vehicle ${v.regNo} is inactive`);
    const p = this.s.deliveryPersons.find((x) => x.id === a?.deliveryPersonId);
    if (!p || p.owner !== owner) throw bad('Select a delivery person');
    if (!p.active) throw conflict(`${p.name} is inactive`);
    const vb = this.busyOn('vehicleId', v.id, date, exceptPlanId);
    if (vb) throw conflict(`Vehicle ${v.regNo} is already on ${vb.tripNo} on ${date}`);
    const pb = this.busyOn('deliveryPersonId', p.id, date);
    if (pb) throw conflict(`${p.name} is already on ${pb.tripNo} on ${date}`);
    if (v.capacityKg < loadKg) throw conflict(`Vehicle ${v.regNo} carries ${v.capacityKg} kg; this trip weighs ${Math.ceil(loadKg)} kg`);
    return { v, p };
  }
  private checkDate(date: string, nextDay: boolean) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) throw bad('Select a planned date');
    if (date < this.today()) throw bad('The planned date cannot be in the past');
    if (nextDay && this.s.settings.nextDayPlanning && date < this.tomorrow()) throw bad('Plan for the next day or later');
  }

  private newStop(seq: number, action: StopAction, partyType: PartyType, p: { id: string; name: string; address: string; phone: string; lat: number; lng: number }, lines: StopLine[]): TripStop {
    return {
      id: `stp-${this.seq()}`, seq, action, partyType, partyId: p.id, name: p.name, address: p.address, phone: p.phone, lat: p.lat, lng: p.lng,
      lines, status: 'PENDING', otpId: null, verifiedAt: null, verifiedBy: null, completedAt: null, failReason: null, note: null, collectionId: null,
    };
  }
  private storeParty(st: CdsStore) {
    const u = this.cdsUserOf(st.id);
    return { id: st.id, name: st.name, address: st.address, phone: u?.mobile ?? st.managerPhone, lat: st.lat, lng: st.lng };
  }
  private newTrip(type: TripType, owner: string, plan: Plan, date: string, slot: string, a: { v: Vehicle; p: DeliveryPerson }, stops: TripStop[], by: string, origin: { lat: number; lng: number }): Trip {
    const loading: StopAction[] = ['DISTRIBUTOR_PICKUP', 'CDS_ORDER_PICKUP'];
    const loadKg = round2(sum(stops.filter((s) => loading.includes(s.action)), (s) => sum(s.lines, (l) => l.plannedQty * l.unitWeightKg)))
      || round2(sum(stops, (s) => sum(s.lines, (l) => l.plannedQty * l.unitWeightKg)));
    const m = routeMetrics([origin, ...stops], stops.length);
    const t: Trip = {
      id: `trp-${this.seq()}`, tripNo: `${TRIP_TYPE[type].prefix}-${this.seq()}`, type, owner, planId: plan.id, plannedDate: date, slot,
      vehicleId: a.v.id, vehicleRegNo: a.v.regNo, vehicleType: a.v.type, capacityKg: a.v.capacityKg,
      deliveryPersonId: a.p.id, deliveryPersonName: a.p.name, deliveryPersonPhone: a.p.phone, status: 'ASSIGNED', stops,
      orderIds: uniq(stops.flatMap((s) => s.lines.map((l) => l.orderId).filter((x): x is string => !!x))),
      loadKg, distanceKm: m.distanceKm, etaMinutes: m.etaMinutes, startedAt: null, completedAt: null, cancelReason: null,
      history: [{ from: null, to: 'PLANNED', at: this.now(), by }, { from: 'PLANNED', to: 'ASSIGNED', at: this.now(), by, note: `${a.v.regNo} · ${a.p.name}` }],
      ...this.stamp(by),
    };
    this.s.trips.push(t);
    plan.tripIds.push(t.id);
    this.audit('TRIP', t.id, by, 'TRIP_GENERATED', `${t.tripNo} (${TRIP_TYPE[type].label}) · ${a.v.regNo} · ${a.p.name}`);
    return t;
  }
  private newPlan(kind: Plan['kind'], owner: string, date: string, orderIds: string[], remarks: string, by: string, route?: DeliveryRoute): Plan {
    const seq = this.seq();
    const planNo = kind === 'RETAILER_DELIVERY' ? `RT-${seq}` : `PLN-${seq}`;
    const p: Plan = { id: `pln-${this.seq()}`, planNo, kind, owner, plannedDate: date, orderIds, tripIds: [], remarks: remarks ?? '', ...(route ? { route } : {}), ...this.stamp(by) };
    this.s.plans.push(p);
    return p;
  }
  private orderLines(o: CdsOrder, qty: (l: CdsOrder['lines'][number]) => number): StopLine[] {
    return o.lines.map((l) => ({ orderId: o.id, sku: l.sku, name: l.name, unitPrice: l.unitPrice, unitWeightKg: l.unitWeightKg, plannedQty: qty(l), actualQty: null })).filter((l) => l.plannedQty > 0);
  }
  private sequence<T extends { lat: number; lng: number }>(origin: { lat: number; lng: number }, xs: T[], end?: { lat: number; lng: number }) {
    return sequenceStops(origin, xs, end).map((i) => xs[i]);
  }

  // ---------------------------------------------------------------- 2–3. Pickup Planning → Distributor Pickup Trip (+ CDS Delivery Trip)

  /**
   * Plans pickups from one or more distributors (each order to its destination CDS) and generates the Distributor
   * Pickup Trip; with `cdsDelivery`, also the CDS Delivery Trip that takes the collected orders to their CDS stores.
   * The delivery leg may use the same vehicle and delivery person (milk run).
   */
  createPickupPlan(b: { orders: { orderId: string; cdsStoreId?: string }[]; plannedDate: string; slot?: string; pickup: Assignment; cdsDelivery?: Assignment | null; remarks?: string }, by: string) {
    this.checkDate(b.plannedDate, false);
    if (!b.orders?.length) throw bad('Select at least one confirmed order');
    const orders = uniq(b.orders.map((x) => x.orderId)).map((id) => this.order(id));
    orders.forEach((o) => {
      if (o.status !== 'CONFIRMED') throw conflict(`${o.orderNo} is ${o.status}; only Confirmed orders can be planned for pickup`);
    });
    b.orders.forEach((x) => {
      if (!x.cdsStoreId) return;
      const st = this.store(x.cdsStoreId);
      if (!st.active) throw conflict(`${st.name} is inactive`);
      this.order(x.orderId).cdsStoreId = st.id;
    });
    const loadKg = sum(orders, (o) => o.weightKg);
    const pickupA = this.assign('SC', b.plannedDate, b.pickup, loadKg);
    let deliveryA: { v: Vehicle; p: DeliveryPerson } | null = null;
    if (b.cdsDelivery) {
      const sameV = b.cdsDelivery.vehicleId === b.pickup.vehicleId;
      const sameP = b.cdsDelivery.deliveryPersonId === b.pickup.deliveryPersonId;
      deliveryA = sameV && sameP ? pickupA : this.assignLeg(b.plannedDate, b.cdsDelivery, loadKg, sameV ? pickupA.v : null, sameP ? pickupA.p : null);
    }
    const plan = this.newPlan('PICKUP', 'SC', b.plannedDate, orders.map((o) => o.id), b.remarks ?? '', by);
    const dists = uniq(orders.map((o) => o.distributorId)).map((id) => this.distributor(id));
    const stops = this.sequence(SC_HUB, dists).map((d, i) =>
      this.newStop(i + 1, 'DISTRIBUTOR_PICKUP', 'DISTRIBUTOR', d, orders.filter((o) => o.distributorId === d.id).flatMap((o) => this.orderLines(o, (l) => l.qty))));
    const pickup = this.newTrip('DISTRIBUTOR_PICKUP', 'SC', plan, b.plannedDate, b.slot ?? '08:00 – 12:00', pickupA, stops, by, SC_HUB);
    orders.forEach((o) => {
      o.pickupTripId = pickup.id;
      this.setOrder(o, 'PICKUP_PLANNED', by, pickup.tripNo);
    });
    const delivery = deliveryA ? this.buildCdsDeliveryTrip(plan, orders, b.plannedDate, '12:00 – 17:00', deliveryA, by, (l) => l.qty) : null;
    return { plan, pickupTrip: pickup, cdsDeliveryTrip: delivery };
  }
  private assignLeg(date: string, a: Assignment, loadKg: number, v: Vehicle | null, p: DeliveryPerson | null) {
    if (v && !p) {
      const x = this.s.deliveryPersons.find((d) => d.id === a.deliveryPersonId && d.owner === 'SC' && d.active);
      if (!x) throw bad('Select a delivery person for the CDS delivery trip');
      const pb = this.busyOn('deliveryPersonId', x.id, date);
      if (pb) throw conflict(`${x.name} is already on ${pb.tripNo} on ${date}`);
      return { v, p: x };
    }
    if (p && !v) {
      const x = this.s.vehicles.find((d) => d.id === a.vehicleId && d.owner === 'SC' && d.active);
      if (!x) throw bad('Select a vehicle for the CDS delivery trip');
      const vb = this.busyOn('vehicleId', x.id, date);
      if (vb) throw conflict(`Vehicle ${x.regNo} is already on ${vb.tripNo} on ${date}`);
      if (x.capacityKg < loadKg) throw conflict(`Vehicle ${x.regNo} carries ${x.capacityKg} kg; this trip weighs ${Math.ceil(loadKg)} kg`);
      return { v: x, p };
    }
    return this.assign('SC', date, a, loadKg);
  }
  private buildCdsDeliveryTrip(plan: Plan, orders: CdsOrder[], date: string, slot: string, a: { v: Vehicle; p: DeliveryPerson }, by: string, qty: (l: CdsOrder['lines'][number]) => number) {
    const stores = uniq(orders.map((o) => o.cdsStoreId)).map((id) => this.store(id));
    const start = this.s.distributors.find((d) => d.id === orders[0].distributorId) ?? SC_HUB;
    const stops = this.sequence(start, stores).map((st, i) =>
      this.newStop(i + 1, 'CDS_HANDOVER', 'CDS', this.storeParty(st), orders.filter((o) => o.cdsStoreId === st.id).flatMap((o) => this.orderLines(o, qty))));
    const t = this.newTrip('CDS_DELIVERY', 'SC', plan, date, slot, a, stops, by, start);
    orders.forEach((o) => (o.cdsTripId = t.id));
    return t;
  }

  /** Deliver to CDS: picked-up orders that are not on an active CDS Delivery Trip. */
  createCdsDeliveryPlan(b: { orderIds: string[]; plannedDate: string; slot?: string; vehicleId: string; deliveryPersonId: string; remarks?: string }, by: string) {
    this.checkDate(b.plannedDate, false);
    if (!b.orderIds?.length) throw bad('Select at least one picked-up order');
    const orders = uniq(b.orderIds).map((id) => this.order(id));
    orders.forEach((o) => {
      if (o.status !== 'PICKED_UP') throw conflict(`${o.orderNo} is ${o.status}; only Picked Up orders can be sent to a CDS`);
      const t = o.cdsTripId ? this.trip(o.cdsTripId) : null;
      if (t && ACTIVE_TRIP.includes(t.status)) throw conflict(`${o.orderNo} is already on ${t.tripNo}`);
    });
    const a = this.assign('SC', b.plannedDate, b, sum(orders, (o) => sum(o.lines, (l) => l.pickedQty * l.unitWeightKg)));
    const plan = this.newPlan('CDS_DELIVERY', 'SC', b.plannedDate, orders.map((o) => o.id), b.remarks ?? '', by);
    return { plan, trip: this.buildCdsDeliveryTrip(plan, orders, b.plannedDate, b.slot ?? '12:00 – 17:00', a, by, (l) => l.pickedQty) };
  }

  // ---------------------------------------------------------------- 6. CDS User Delivery Planning (LBNP-style routes, next day) → Retailer Delivery Trip

  /** Weight still to deliver (accepted at the CDS, not yet delivered). */
  private deliverableKg(o: CdsOrder) {
    return round2(sum(o.lines, (l) => (l.acceptedQty - l.deliveredQty) * l.unitWeightKg));
  }
  private readyOrders(storeId: string, ids: string[]) {
    const orders = uniq(ids ?? []).map((id) => this.order(id));
    orders.forEach((o) => {
      if (o.cdsStoreId !== storeId) throw new CdsError(403, `${o.orderNo} belongs to another CDS`);
      if (o.status !== 'READY_FOR_DELIVERY') throw conflict(`${o.orderNo} is ${o.status}; only Ready for Delivery orders can be planned`);
    });
    return orders;
  }
  /** A route for one vehicle: the orders' retailers in visiting order from the store, with load, value, distance and time. */
  routeFor(st: CdsStore, v: Vehicle, orders: CdsOrder[]): DeliveryRoute {
    const retailers = this.sequence(st, uniq(orders.map((o) => o.retailerId)).map((id) => this.retailer(id)));
    const m = routeMetrics([st, st, ...retailers], retailers.length + 1);
    return {
      vehicleId: v.id, vehicleRegNo: v.regNo, vehicleType: v.type, capacityKg: v.capacityKg,
      localities: uniq(retailers.map((r) => r.locality)), retailerIds: retailers.map((r) => r.id),
      loadKg: round2(sum(orders, (o) => this.deliverableKg(o))),
      orderValue: round2(sum(orders, (o) => sum(o.lines, (l) => (l.acceptedQty - l.deliveredQty) * l.unitPrice))),
      distanceKm: m.distanceKm, etaMinutes: m.etaMinutes,
    };
  }

  /**
   * Plan Routes: groups the selected Ready for Delivery orders by retailer locality (CDS has no beats) and packs the
   * groups onto the store's own free vehicles — largest groups first, into a route that already serves the locality,
   * else any route with room, else a new vehicle. A locality heavier than the largest vehicle is split by retailer.
   * Each route then gets the smallest free vehicle that carries it. Nothing is saved: the CDS User reviews, moves
   * retailers between routes and confirms.
   */
  proposeRoutes(storeId: string, orderIds: string[], date: string) {
    const st = this.store(storeId);
    this.checkDate(date, true);
    const orders = this.readyOrders(st.id, orderIds);
    if (!orders.length) throw bad('Select at least one order');
    const free = this.resources(st.id, date).vehicles.filter((v) => v.available).sort((a, b) => b.capacityKg - a.capacityKg);
    if (!free.length) throw conflict(`No vehicle of ${st.name} is free on ${date}`);
    const loc = (o: CdsOrder) => this.retailer(o.retailerId).locality;
    const maxCap = free[0].capacityKg;
    type Group = { locality: string; orders: CdsOrder[]; kg: number };
    const groups: Group[] = [];
    uniq(orders.map(loc)).forEach((l) => {
      const os = orders.filter((o) => loc(o) === l);
      let cur: Group = { locality: l, orders: [], kg: 0 };
      uniq(os.map((o) => o.retailerId)).forEach((rid) => {
        const ro = os.filter((o) => o.retailerId === rid);
        const kg = sum(ro, (o) => this.deliverableKg(o));
        if (cur.orders.length && cur.kg + kg > maxCap) {
          groups.push(cur);
          cur = { locality: l, orders: [], kg: 0 };
        }
        cur.orders.push(...ro);
        cur.kg += kg;
      });
      if (cur.orders.length) groups.push(cur);
    });
    groups.sort((a, b) => b.kg - a.kg);
    const bins: { v: (typeof free)[number]; orders: CdsOrder[]; kg: number }[] = [];
    const unplanned: string[] = [];
    groups.forEach((g) => {
      const fit = bins.filter((b) => b.kg + g.kg <= b.v.capacityKg);
      const bin = fit.find((b) => b.orders.some((o) => loc(o) === g.locality)) ?? fit[0];
      if (bin) {
        bin.orders.push(...g.orders);
        bin.kg += g.kg;
        return;
      }
      const v = free.find((x) => !bins.some((b) => b.v.id === x.id) && x.capacityKg >= g.kg);
      if (!v) {
        unplanned.push(...g.orders.map((o) => o.id));
        return;
      }
      bins.push({ v, orders: [...g.orders], kg: g.kg });
    });
    // right-size: each route gets the smallest free vehicle that carries it
    bins.sort((a, b) => a.kg - b.kg).forEach((b) => {
      const v = free.filter((x) => x.capacityKg >= b.kg && !bins.some((o) => o !== b && o.v.id === x.id)).sort((x, y) => x.capacityKg - y.capacityKg)[0];
      if (v) b.v = v;
    });
    return {
      plannedDate: date,
      routes: bins.sort((a, b) => b.kg - a.kg).map((b) => ({ ...this.routeFor(st, b.v, b.orders), orderIds: b.orders.map((o) => o.id) })),
      unplannedOrderIds: unplanned,
    };
  }

  /** Confirm Routes: saves each route (its vehicle is reserved for the day); the orders become Delivery Planned. */
  confirmRoutes(b: { cdsStoreId: string; plannedDate: string; routes: { vehicleId: string; orderIds: string[] }[]; remarks?: string }, by: string) {
    const st = this.store(b.cdsStoreId);
    this.checkDate(b.plannedDate, true);
    const routes = (b.routes ?? []).filter((r) => r.orderIds?.length);
    if (!routes.length) throw bad('Plan at least one route');
    const all = routes.flatMap((r) => r.orderIds);
    if (uniq(all).length !== all.length) throw bad('An order can be on one route only');
    if (uniq(routes.map((r) => r.vehicleId)).length !== routes.length) throw bad('Each route needs its own vehicle');
    const checked = routes.map((r) => {
      const orders = this.readyOrders(st.id, r.orderIds);
      const v = this.s.vehicles.find((x) => x.id === r.vehicleId);
      if (!v || v.owner !== st.id) throw bad('Select a vehicle for every route');
      if (!v.active) throw conflict(`Vehicle ${v.regNo} is inactive`);
      const busy = this.busyOn('vehicleId', v.id, b.plannedDate);
      if (busy) throw conflict(`Vehicle ${v.regNo} is already on ${busy.tripNo} on ${b.plannedDate}`);
      const route = this.routeFor(st, v, orders);
      if (route.loadKg > v.capacityKg) throw conflict(`Vehicle ${v.regNo} carries ${v.capacityKg} kg; this route weighs ${Math.ceil(route.loadKg)} kg`);
      return { orders, route, v };
    });
    return checked.map(({ orders, route, v }) => {
      const plan = this.newPlan('RETAILER_DELIVERY', st.id, b.plannedDate, orders.map((o) => o.id), b.remarks ?? '', by, route);
      orders.forEach((o) => this.setOrder(o, 'DELIVERY_PLANNED', by, `Route ${plan.planNo}`));
      this.audit('PLAN', plan.id, by, 'ROUTE_CONFIRMED', `${plan.planNo} · ${v.regNo} · ${orders.length} orders`);
      return plan;
    });
  }

  /** Generate Trip: a confirmed route becomes a Retailer Delivery Trip with the chosen delivery person. */
  generateRouteTrip(planId: string, b: { deliveryPersonId: string; slot?: string }, by: string) {
    const plan = this.plan(planId);
    if (plan.kind !== 'RETAILER_DELIVERY' || !plan.route) throw bad('Only delivery routes generate retailer trips');
    if (plan.tripIds.length) throw conflict(`${plan.planNo} already has a trip`);
    const st = this.store(plan.owner);
    const orders = plan.orderIds.map((id) => this.order(id));
    orders.forEach((o) => {
      if (o.status !== 'DELIVERY_PLANNED' || o.deliveryTripId) throw conflict(`${o.orderNo} is ${o.status}`);
    });
    const a = this.assign(st.id, plan.plannedDate, { vehicleId: plan.route.vehicleId, deliveryPersonId: b?.deliveryPersonId }, plan.route.loadKg, plan.id);
    const left = (l: CdsOrder['lines'][number]) => l.acceptedQty - l.deliveredQty;
    const stops: TripStop[] = [this.newStop(1, 'CDS_ORDER_PICKUP', 'CDS', this.storeParty(st), orders.flatMap((o) => this.orderLines(o, left)))];
    plan.route.retailerIds.forEach((rid) => {
      const os = orders.filter((o) => o.retailerId === rid);
      if (os.length) stops.push(this.newStop(stops.length + 1, 'RETAILER_DELIVERY', 'RETAILER', this.retailer(rid), os.flatMap((o) => this.orderLines(o, left))));
    });
    const t = this.newTrip('RETAILER_DELIVERY', st.id, plan, plan.plannedDate, b?.slot || '09:00 – 13:00', a, stops, by, st);
    orders.forEach((o) => (o.deliveryTripId = t.id));
    return t;
  }

  /** One route on one vehicle, confirmed and turned into a trip in one step (demo seed and tests). */
  createDeliveryPlan(b: { cdsStoreId: string; orderIds: string[]; plannedDate: string; slot?: string; vehicleId: string; deliveryPersonId: string; remarks?: string }, by: string) {
    const st = this.store(b.cdsStoreId);
    this.checkDate(b.plannedDate, true);
    if (!b.orderIds?.length) throw bad('Select at least one order');
    const orders = this.readyOrders(st.id, b.orderIds);
    this.assign(st.id, b.plannedDate, b, sum(orders, (o) => this.deliverableKg(o)));
    const [plan] = this.confirmRoutes({ cdsStoreId: st.id, plannedDate: b.plannedDate, routes: [{ vehicleId: b.vehicleId, orderIds: b.orderIds }], remarks: b.remarks }, by);
    return { plan, trip: this.generateRouteTrip(plan.id, { deliveryPersonId: b.deliveryPersonId, slot: b.slot }, by) };
  }

  // ---------------------------------------------------------------- trip execution (Delivery Partner App / on its behalf)

  startTrip(id: string, by: string) {
    const t = this.trip(id);
    if (t.status !== 'ASSIGNED') throw conflict(`${t.tripNo} is ${t.status}`);
    this.setTrip(t, 'STARTED', by);
    t.startedAt = this.now();
    if (t.type === 'CDS_DELIVERY') t.orderIds.map((x) => this.order(x)).filter((o) => o.status === 'PICKED_UP').forEach((o) => this.setOrder(o, 'IN_TRANSIT_TO_CDS', by, t.tripNo));
    this.audit('TRIP', t.id, by, 'STARTED');
    return t;
  }

  cancelTrip(id: string, reason: string, by: string) {
    const t = this.trip(id);
    if (!reason?.trim()) throw bad('A cancellation reason is required');
    if (!['ASSIGNED', 'STARTED'].includes(t.status) || t.stops.some((s) => s.status !== 'PENDING')) throw conflict(`${t.tripNo} has progressed and cannot be cancelled`);
    this.setTrip(t, 'CANCELLED', by, reason);
    t.cancelReason = reason;
    this.s.otps.filter((o) => o.tripId === t.id && o.status === 'ACTIVE').forEach((o) => (o.status = 'SUPERSEDED'));
    if (t.type === 'DISTRIBUTOR_PICKUP') {
      t.orderIds.map((x) => this.order(x)).forEach((o) => {
        o.pickupTripId = null;
        this.setOrder(o, 'CONFIRMED', by, `${t.tripNo} cancelled`);
        if (o.cdsTripId) this.dropFromCdsTrip(o, by);
      });
    }
    if (t.type === 'CDS_DELIVERY') t.orderIds.map((x) => this.order(x)).forEach((o) => {
      o.cdsTripId = null;
      if (o.status === 'IN_TRANSIT_TO_CDS') this.setOrder(o, 'PICKED_UP', by, `${t.tripNo} cancelled`);
    });
    if (t.type === 'RETAILER_DELIVERY') {
      t.orderIds.map((x) => this.order(x)).forEach((o) => {
        o.deliveryTripId = null;
        this.setOrder(o, 'READY_FOR_DELIVERY', by, `${t.tripNo} cancelled`);
      });
    }
    this.audit('TRIP', t.id, by, 'CANCELLED', reason);
    return t;
  }

  /** Removes an order from its (not yet handed-over) CDS Delivery Trip; cancels the trip if nothing is left. */
  private dropFromCdsTrip(o: CdsOrder, by: string) {
    const t = this.trip(o.cdsTripId!);
    o.cdsTripId = null;
    if (!ACTIVE_TRIP.includes(t.status)) return;
    t.stops.forEach((s) => { if (s.status === 'PENDING') s.lines = s.lines.filter((l) => l.orderId !== o.id); });
    t.orderIds = t.orderIds.filter((x) => x !== o.id);
    t.stops = t.stops.filter((s) => s.lines.length || s.status !== 'PENDING');
    t.stops.forEach((s, i) => (s.seq = i + 1));
    if (!t.stops.length && ['ASSIGNED', 'STARTED'].includes(t.status)) {
      this.setTrip(t, 'CANCELLED', by, 'No orders left to deliver');
      t.cancelReason = 'No orders left to deliver';
    } else this.finishIfDone(t, by);
  }

  private stopOf(t: Trip, stopId: string) {
    const st = t.stops.find((x) => x.id === stopId);
    if (!st) throw notFound(`Stop ${stopId} is not on ${t.tripNo}`);
    return st;
  }

  /** Checks a stop can be worked now (trip running, stop pending, earlier legs done). */
  private ready(t: Trip, st: TripStop) {
    if (!['STARTED', 'IN_PROGRESS'].includes(t.status)) throw conflict(t.status === 'ASSIGNED' ? `Start ${t.tripNo} first` : `${t.tripNo} is ${t.status}`);
    if (st.status !== 'PENDING') throw conflict(`This stop is already ${st.status.toLowerCase()}`);
    const pending = (a: StopAction) => t.stops.some((x) => x.action === a && x.status === 'PENDING');
    if (st.action === 'CDS_HANDOVER') {
      const notPicked = st.lines.map((l) => this.order(l.orderId!)).filter((o) => ['CONFIRMED', 'PICKUP_PLANNED'].includes(o.status));
      if (notPicked.length) throw conflict(`Collect ${uniq(notPicked.map((o) => o.orderNo)).join(', ')} from the distributor first`);
    }
    if (st.action === 'RETAILER_DELIVERY' && pending('CDS_ORDER_PICKUP')) throw conflict('Load the orders at the CDS first');
  }

  /** Who receives the OTP for a stop (the party other than the delivery person). */
  otpRecipient(st: TripStop) {
    if (st.partyType === 'CDS') {
      const u = this.cdsUserOf(st.partyId);
      return { type: st.partyType, id: st.partyId, name: u ? `${u.name} (${st.name})` : st.name, phone: u?.mobile ?? st.phone };
    }
    if (st.partyType === 'DISTRIBUTOR') {
      const d = this.distributor(st.partyId);
      return { type: st.partyType, id: d.id, name: `${d.contactName} (${d.name})`, phone: d.phone };
    }
    const r = this.retailer(st.partyId);
    return { type: st.partyType, id: r.id, name: `${r.ownerName} (${r.name})`, phone: r.phone };
  }

  /** Generates (or regenerates) the OTP for a stop and sends it to the counter-party. */
  sendOtp(tripId: string, stopId: string, by: string): OtpTxn {
    const t = this.trip(tripId);
    const st = this.stopOf(t, stopId);
    this.ready(t, st);
    if (!st.lines.length) throw conflict('Nothing to hand over at this stop');
    this.s.otps.filter((o) => o.stopId === st.id && o.status === 'ACTIVE').forEach((o) => (o.status = 'SUPERSEDED'));
    const to = this.otpRecipient(st);
    const at = this.clock();
    const otp: OtpTxn = {
      id: `otp-${this.seq()}`, purpose: st.action, tripId: t.id, tripNo: t.tripNo, stopId: st.id, sentToType: to.type, sentToId: to.id,
      sentToName: to.name, sentToPhone: to.phone, code: this.otpCode(), createdAt: at.toISOString(), createdBy: by,
      expiresAt: new Date(at.getTime() + this.s.settings.otpExpiryMinutes * 60000).toISOString(), attempts: 0, status: 'ACTIVE', verifiedAt: null, verifiedBy: null,
    };
    this.s.otps.push(otp);
    st.otpId = otp.id;
    this.audit('OTP', otp.id, by, 'OTP_SENT', `${STOP_ACTION[st.action].label} · ${t.tripNo} · to ${to.name} ${to.phone}`);
    return otp;
  }

  /** Marks expired OTPs (lazy). */
  expireOtps() {
    const now = this.now();
    this.s.otps.filter((o) => o.status === 'ACTIVE' && o.expiresAt <= now).forEach((o) => (o.status = 'EXPIRED'));
  }

  /** Verifies and consumes the stop's OTP. A wrong code is counted (the caller saves the count before reporting). */
  private verifyOtp(t: Trip, st: TripStop, code: string, by: string): CdsError | null {
    const otp = st.otpId ? this.s.otps.find((o) => o.id === st.otpId) : null;
    if (!otp || otp.status === 'SUPERSEDED') return bad('Send the OTP first');
    if (otp.status === 'VERIFIED') return conflict('This OTP has already been used');
    if (otp.status === 'LOCKED') return conflict('Too many wrong attempts — send a new OTP');
    if (otp.status === 'EXPIRED' || otp.expiresAt <= this.now()) {
      otp.status = 'EXPIRED';
      return bad('The OTP has expired — send a new OTP');
    }
    if (!/^\d{4,6}$/.test(String(code ?? '').trim())) return bad('Enter the OTP');
    if (String(code).trim() !== otp.code) {
      otp.attempts += 1;
      if (otp.attempts >= this.s.settings.otpMaxAttempts) otp.status = 'LOCKED';
      this.audit('OTP', otp.id, by, 'OTP_FAILED', `attempt ${otp.attempts} · ${t.tripNo}`);
      const left = this.s.settings.otpMaxAttempts - otp.attempts;
      return bad(left > 0 ? `Incorrect OTP — ${left} attempt(s) left` : 'Incorrect OTP — too many attempts, send a new OTP');
    }
    otp.status = 'VERIFIED';
    otp.verifiedAt = this.now();
    otp.verifiedBy = by;
    st.verifiedAt = otp.verifiedAt;
    st.verifiedBy = by;
    this.audit('OTP', otp.id, by, 'OTP_VERIFIED', `${STOP_ACTION[st.action].label} · ${t.tripNo}`);
    return null;
  }


  /**
   * Completes a stop after OTP verification. OTP failures are returned as { error } (not thrown) so that the
   * attempt count is saved; the API persists the state and then reports the error.
   */
  completeStop(tripId: string, stopId: string, input: StopInput, by: string): { trip: Trip; error?: CdsError } {
    const t = this.trip(tripId);
    const st = this.stopOf(t, stopId);
    this.ready(t, st);
    // validate quantities before consuming the OTP; at a CDS handover this is the count the store accepts
    const qtys = st.lines.map((l, i) => {
      const x = input.lines?.find((y) => y.idx === i);
      const q = x ? x.actualQty : l.plannedQty;
      if (!isQty(q)) throw bad(`${l.name}: enter a valid quantity`);
      if (q > l.plannedQty) throw bad(`${l.name}: quantity cannot be more than ${l.plannedQty}`);
      return q;
    });
    (input.collections ?? []).forEach((c) => {
      if (!(Number(c.amount) >= 0)) throw bad('Enter a valid collected amount');
      if (!['CASH', 'UPI'].includes(c.mode)) throw bad('Collection mode must be Cash or UPI');
    });
    const err = this.verifyOtp(t, st, input.otp, by);
    if (err) return { trip: t, error: err };
    st.lines.forEach((l, i) => (l.actualQty = qtys[i]));
    st.completedAt = this.now();
    st.note = input.note ?? null;
    const got = sum(st.lines, (l) => l.actualQty ?? 0);
    const want = sum(st.lines, (l) => l.plannedQty);
    st.status = got === 0 ? 'FAILED' : got < want ? 'PARTIAL' : 'DONE';
    if (got === 0) st.failReason = input.note || 'Nothing handed over';
    this.apply(t, st, input, by);
    if (t.status === 'STARTED') this.setTrip(t, 'IN_PROGRESS', by);
    this.audit('TRIP', t.id, by, 'STOP_COMPLETED', `${t.tripNo} · ${STOP_ACTION[st.action].label} · ${st.name} · ${got}/${want}`);
    this.finishIfDone(t, by);
    return { trip: t };
  }

  /** Stop could not be done (shop closed, stock not ready…). No OTP — nothing changes hands. */
  failStop(tripId: string, stopId: string, reason: string, by: string) {
    const t = this.trip(tripId);
    const st = this.stopOf(t, stopId);
    this.ready(t, st);
    if (!STOP_ACTION[st.action].canFail) throw conflict(`${STOP_ACTION[st.action].label} cannot be marked failed`);
    if (!reason?.trim()) throw bad('A reason is required');
    st.lines.forEach((l) => (l.actualQty = 0));
    st.status = 'FAILED';
    st.failReason = reason;
    st.completedAt = this.now();
    this.s.otps.filter((o) => o.stopId === st.id && o.status === 'ACTIVE').forEach((o) => (o.status = 'SUPERSEDED'));
    this.apply(t, st, { otp: '' }, by);
    if (t.status === 'STARTED') this.setTrip(t, 'IN_PROGRESS', by);
    this.audit('TRIP', t.id, by, 'STOP_FAILED', `${t.tripNo} · ${st.name} · ${reason}`);
    this.finishIfDone(t, by);
    return t;
  }

  private apply(t: Trip, st: TripStop, input: StopInput, by: string) {
    const ordersAt = uniq(st.lines.map((l) => l.orderId).filter((x): x is string => !!x)).map((id) => this.order(id));
    const line = (o: CdsOrder, sku: string) => o.lines.find((x) => x.sku === sku)!;
    const renumber = () => t.stops.forEach((s, i) => (s.seq = i + 1));
    switch (st.action) {
      case 'DISTRIBUTOR_PICKUP':
        ordersAt.forEach((o) => {
          st.lines.filter((l) => l.orderId === o.id).forEach((l) => (line(o, l.sku).pickedQty = l.actualQty ?? 0));
          const picked = sum(o.lines, (l) => l.pickedQty);
          if (!picked) {
            o.pickupTripId = null;
            o.note = st.failReason ? `Pickup failed: ${st.failReason}` : 'Nothing collected at pickup';
            this.setOrder(o, 'CONFIRMED', by, `${o.note} — ready to plan again`);
            if (o.cdsTripId) this.dropFromCdsTrip(o, by);
            return;
          }
          this.setOrder(o, 'PICKED_UP', by, `${t.tripNo} · OTP verified${picked < sum(o.lines, (l) => l.qty) ? ' (short pickup)' : ''}`);
          const ct = o.cdsTripId ? this.trip(o.cdsTripId) : null;
          if (ct) {
            // the CDS leg carries what was actually collected
            ct.stops.forEach((s) => {
              if (s.status !== 'PENDING') return;
              s.lines.filter((l) => l.orderId === o.id).forEach((l) => (l.plannedQty = line(o, l.sku).pickedQty));
              s.lines = s.lines.filter((l) => l.plannedQty > 0);
            });
            if (['STARTED', 'IN_PROGRESS'].includes(ct.status)) this.setOrder(o, 'IN_TRANSIT_TO_CDS', by, ct.tripNo);
          }
        });
        break;
      case 'CDS_HANDOVER':
        // no GRN: the OTP-verified count the store accepts is deliverable at once; picked − accepted is short at handover
        ordersAt.forEach((o) => {
          st.lines.filter((l) => l.orderId === o.id).forEach((l) => (line(o, l.sku).acceptedQty = l.actualQty ?? 0));
          const accepted = sum(o.lines, (l) => l.acceptedQty);
          if (!accepted) {
            o.cdsTripId = null;
            o.note = `Nothing handed over at ${st.name}`;
            this.setOrder(o, 'PICKED_UP', by, `${o.note} — send to the CDS again`);
            return;
          }
          const short = accepted < sum(o.lines, (l) => l.pickedQty);
          this.setOrder(o, 'READY_FOR_DELIVERY', by, `${t.tripNo} · handover OTP verified${short ? ' (short at handover)' : ''}`);
        });
        break;
      case 'CDS_ORDER_PICKUP':
        ordersAt.forEach((o) => {
          const ls = st.lines.filter((l) => l.orderId === o.id);
          // the retailer stop carries what was loaded
          t.stops.filter((s) => s.action === 'RETAILER_DELIVERY').forEach((s) => s.lines.filter((l) => l.orderId === o.id).forEach((l) => (l.plannedQty = ls.find((x) => x.sku === l.sku)?.actualQty ?? 0)));
          t.stops.forEach((s) => { if (s.action === 'RETAILER_DELIVERY') s.lines = s.lines.filter((l) => l.plannedQty > 0); });
          if (!sum(ls, (l) => l.actualQty ?? 0)) {
            o.deliveryTripId = null;
            this.setOrder(o, 'READY_FOR_DELIVERY', by, `Not loaded on ${t.tripNo}`);
            return;
          }
          this.setOrder(o, 'OUT_FOR_DELIVERY', by, `${t.tripNo} · OTP verified`);
        });
        t.stops = t.stops.filter((s) => s.action !== 'RETAILER_DELIVERY' || s.lines.length || s.status !== 'PENDING');
        renumber();
        break;
      case 'RETAILER_DELIVERY':
        ordersAt.forEach((o) => {
          st.lines.filter((l) => l.orderId === o.id).forEach((l) => (line(o, l.sku).deliveredQty += l.actualQty ?? 0));
          const delivered = sum(o.lines, (l) => l.deliveredQty);
          if (!delivered) {
            o.deliveryTripId = null;
            o.note = `Delivery failed: ${st.failReason ?? 'not delivered'}`;
            this.setOrder(o, 'READY_FOR_DELIVERY', by, `${o.note} — back at CDS, ready to plan again`);
            return;
          }
          o.deliveredAt = this.now();
          const full = o.lines.every((l) => l.deliveredQty >= l.qty);
          this.setOrder(o, full ? 'DELIVERED' : 'PARTIALLY_DELIVERED', by, `${t.tripNo} · OTP verified`);
          if (o.paymentMode === 'COD') {
            const due = round2(sum(st.lines.filter((l) => l.orderId === o.id), (l) => (l.actualQty ?? 0) * l.unitPrice));
            const c = input.collections?.find((x) => x.orderId === o.id);
            const col: Collection = {
              id: `col-${this.seq()}`, collectionNo: `COL-${this.seq()}`, cdsStoreId: t.owner, tripId: t.id, tripNo: t.tripNo, orderId: o.id, orderNo: o.orderNo,
              retailerId: o.retailerId, deliveryPersonId: t.deliveryPersonId, deliveryPersonName: t.deliveryPersonName, expectedAmount: due,
              amount: round2(c ? Number(c.amount) : due), mode: c?.mode ?? 'CASH', collectedAt: this.now(), ...this.stamp(by),
            };
            this.s.collections.push(col);
            st.collectionId = col.id;
          }
        });
        break;
    }
  }

  private finishIfDone(t: Trip, by: string) {
    if (!['STARTED', 'IN_PROGRESS'].includes(t.status) || t.stops.some((s) => s.status === 'PENDING')) return;
    if (t.status === 'STARTED') this.setTrip(t, 'IN_PROGRESS', by);
    const clean = t.stops.every((s) => s.status === 'DONE');
    this.setTrip(t, clean ? 'COMPLETED' : 'PARTIALLY_COMPLETED', by);
    this.audit('TRIP', t.id, by, clean ? 'COMPLETED' : 'PARTIALLY_COMPLETED');
  }
}
