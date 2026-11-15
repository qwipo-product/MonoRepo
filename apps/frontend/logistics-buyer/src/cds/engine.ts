// CDS business rules. Pure: works on a CdsState object and a clock (no app / mock-server imports), so the same
// code runs behind the API (src/mock/routes/cds.ts), in the demo seed and in Node unit tests.
// Every status change goes through the flow tables in ./status.ts; every pickup / handover goes through an OTP.
import { routeMetrics, round2, sequenceStops, serviceStoreFor } from './planning.ts';
import { ACTIVE_TRIP, ORDER_FLOW, RETURN_FLOW, STOP_ACTION, TRIP_FLOW, TRIP_TYPE } from './status.ts';
import type {
  CdsOrder, CdsState, CdsStore, Collection, DeliveryPerson, Distributor, Grn, ItemCondition, OrderStatus, OtpTxn, PartyType, Plan,
  Retailer, ReturnRecord, ReturnStatus, StopAction, StopLine, Trip, TripStatus, TripStop, TripType, Vehicle,
} from './types.ts';

/** Bump when the demo data changes: stored CDS data of an older version is rebuilt on next use. */
export const CDS_STATE_VERSION = 11;

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
  /** Per stop line (by index): actual quantity, plus accepted / rejected for return handover at the CDS. */
  lines?: { idx: number; actualQty: number; acceptedQty?: number; rejectedQty?: number }[];
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
  grn(id: string): Grn {
    const x = this.s.grns.find((v) => v.id === id || v.grnNo === id);
    if (!x) throw notFound(`GRN ${id} not found`);
    return x;
  }
  ret(id: string): ReturnRecord {
    const x = this.s.returns.find((v) => v.id === id || v.returnNo === id);
    if (!x) throw notFound(`Return ${id} not found`);
    return x;
  }
  collection(id: string): Collection {
    const x = this.s.collections.find((v) => v.id === id || v.collectionNo === id);
    if (!x) throw notFound(`Collection ${id} not found`);
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
  private setReturn(r: ReturnRecord, to: ReturnStatus, by: string, note?: string) {
    if (r.status === to) return;
    if (!RETURN_FLOW[r.status].includes(to)) throw conflict(`Return ${r.returnNo}: cannot change ${r.status} → ${to}`);
    r.history.push({ from: r.status, to, at: this.now(), by, note });
    r.status = to;
    this.touch(r, by);
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
      pickedQty: 0, receivedQty: 0, acceptedQty: 0, damagedQty: 0, deliveredQty: 0, returnedQty: 0,
    }));
    const o: CdsOrder = {
      id: `ord-${this.seq()}`, orderNo: `CDS-${this.seq()}`, sellerOrderRef: input.sellerOrderRef, confirmedAt: this.now(),
      distributorId: input.distributorId, cdsStoreId: store.id, retailerId: r.id, lines,
      orderValue: round2(sum(lines, (l) => l.qty * l.unitPrice)), weightKg: round2(sum(lines, (l) => l.qty * l.unitWeightKg)),
      paymentMode: input.paymentMode ?? 'COD', status: 'CONFIRMED', pickupTripId: null, cdsTripId: null, grnId: null, deliveryTripId: null,
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

  private busyOn(kind: 'vehicleId' | 'deliveryPersonId', id: string, date: string, exceptTripId?: string) {
    return this.s.trips.find((t) => t.id !== exceptTripId && t[kind] === id && t.plannedDate === date && ACTIVE_TRIP.includes(t.status)) ?? null;
  }
  /** Edit Resource: change the vehicle and driver of a planned trip (not started yet). */
  updateTripResources(id: string, a: Assignment, by: string) {
    const t = this.trip(id);
    if (!['PLANNED', 'ASSIGNED'].includes(t.status)) throw conflict(`${t.tripNo} has started; the resources cannot change`);
    const v = this.s.vehicles.find((x) => x.id === a?.vehicleId);
    if (!v || v.owner !== t.owner) throw bad('Select a vehicle');
    if (!v.active) throw conflict(`Vehicle ${v.regNo} is inactive`);
    const p = this.s.deliveryPersons.find((x) => x.id === a?.deliveryPersonId);
    if (!p || p.owner !== t.owner) throw bad('Select a driver');
    if (!p.active) throw conflict(`${p.name} is inactive`);
    const vb = this.busyOn('vehicleId', v.id, t.plannedDate, t.id);
    if (vb) throw conflict(`Vehicle ${v.regNo} is already on ${vb.tripNo} on ${t.plannedDate}`);
    const pb = this.busyOn('deliveryPersonId', p.id, t.plannedDate, t.id);
    if (pb) throw conflict(`${p.name} is already on ${pb.tripNo} on ${t.plannedDate}`);
    Object.assign(t, { vehicleId: v.id, vehicleRegNo: v.regNo, vehicleType: v.type, capacityKg: v.capacityKg, deliveryPersonId: p.id, deliveryPersonName: p.name, deliveryPersonPhone: p.phone });
    if (t.helperName === p.name) Object.assign(t, { helperName: null, helperPhone: null });
    t.history.push({ from: t.status, to: t.status, at: this.now(), by, note: `Resources updated: ${v.regNo}, ${p.name}` });
    this.touch(t, by);
    return t;
  }
  /** Update Helper: a delivery person of the same owner (not the driver) helps on a planned trip. */
  updateTripHelper(id: string, personId: string, by: string) {
    const t = this.trip(id);
    if (!['PLANNED', 'ASSIGNED'].includes(t.status)) throw conflict(`${t.tripNo} has started; the helper cannot change`);
    const p = this.s.deliveryPersons.find((x) => x.id === personId);
    if (!p || p.owner !== t.owner || p.id === t.deliveryPersonId) throw bad('Select a helper');
    Object.assign(t, { helperName: p.name, helperPhone: p.phone });
    t.history.push({ from: t.status, to: t.status, at: this.now(), by, note: `Helper updated: ${p.name}` });
    this.touch(t, by);
    return t;
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
  private assign(owner: string, date: string, a: Assignment, loadKg: number): { v: Vehicle; p: DeliveryPerson } {
    const v = this.s.vehicles.find((x) => x.id === a?.vehicleId);
    if (!v || v.owner !== owner) throw bad('Select a vehicle');
    if (!v.active) throw conflict(`Vehicle ${v.regNo} is inactive`);
    const p = this.s.deliveryPersons.find((x) => x.id === a?.deliveryPersonId);
    if (!p || p.owner !== owner) throw bad('Select a delivery person');
    if (!p.active) throw conflict(`${p.name} is inactive`);
    const vb = this.busyOn('vehicleId', v.id, date);
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
    const loading: StopAction[] = ['DISTRIBUTOR_PICKUP', 'CDS_ORDER_PICKUP', 'CDS_RETURN_PICKUP', 'RETAILER_RETURN'];
    const loadKg = round2(sum(stops.filter((s) => loading.includes(s.action)), (s) => sum(s.lines, (l) => l.plannedQty * l.unitWeightKg)))
      || round2(sum(stops, (s) => sum(s.lines, (l) => l.plannedQty * l.unitWeightKg)));
    const m = routeMetrics([origin, ...stops], stops.length);
    const t: Trip = {
      id: `trp-${this.seq()}`, tripNo: `${TRIP_TYPE[type].prefix}-${this.seq()}`, type, owner, planId: plan.id, plannedDate: date, slot,
      vehicleId: a.v.id, vehicleRegNo: a.v.regNo, vehicleType: a.v.type, capacityKg: a.v.capacityKg,
      deliveryPersonId: a.p.id, deliveryPersonName: a.p.name, deliveryPersonPhone: a.p.phone, status: 'ASSIGNED', stops,
      orderIds: uniq(stops.flatMap((s) => s.lines.map((l) => l.orderId).filter((x): x is string => !!x))),
      returnIds: uniq(stops.flatMap((s) => s.lines.map((l) => l.returnId).filter((x): x is string => !!x))),
      loadKg, distanceKm: m.distanceKm, etaMinutes: m.etaMinutes, startedAt: null, completedAt: null, cancelReason: null,
      history: [{ from: null, to: 'PLANNED', at: this.now(), by }, { from: 'PLANNED', to: 'ASSIGNED', at: this.now(), by, note: `${a.v.regNo} · ${a.p.name}` }],
      ...this.stamp(by),
    };
    if (type === 'CDS_RETURN') t.orderIds = []; // return trips carry returns, not orders
    this.s.trips.push(t);
    plan.tripIds.push(t.id);
    this.audit('TRIP', t.id, by, 'TRIP_GENERATED', `${t.tripNo} (${TRIP_TYPE[type].label}) · ${a.v.regNo} · ${a.p.name}`);
    return t;
  }
  private newPlan(kind: Plan['kind'], owner: string, date: string, orderIds: string[], returnIds: string[], remarks: string, by: string): Plan {
    const p: Plan = { id: `pln-${this.seq()}`, planNo: `PLN-${this.seq()}`, kind, owner, plannedDate: date, orderIds, returnIds, tripIds: [], remarks: remarks ?? '', ...this.stamp(by) };
    this.s.plans.push(p);
    return p;
  }
  private orderLines(o: CdsOrder, qty: (l: CdsOrder['lines'][number]) => number): StopLine[] {
    return o.lines.map((l) => ({ orderId: o.id, returnId: null, sku: l.sku, name: l.name, unitPrice: l.unitPrice, unitWeightKg: l.unitWeightKg, plannedQty: qty(l), actualQty: null })).filter((l) => l.plannedQty > 0);
  }
  private returnLines(r: ReturnRecord, qty: (l: ReturnRecord['lines'][number]) => number): StopLine[] {
    return r.lines.map((l) => ({ orderId: r.orderId, returnId: r.id, sku: l.sku, name: l.name, unitPrice: l.unitPrice, unitWeightKg: l.unitWeightKg, plannedQty: qty(l), actualQty: null })).filter((l) => l.plannedQty > 0);
  }
  private sequence<T extends { lat: number; lng: number }>(origin: { lat: number; lng: number }, xs: T[], end?: { lat: number; lng: number }) {
    return sequenceStops(origin, xs, end).map((i) => xs[i]);
  }

  // ---------------------------------------------------------------- 2–3. Pickup Planning → Pickup Trip (sellers to CDS stores)

  /**
   * Plans pickups from one or more distributors (each order to its destination CDS) and generates one Pickup Trip:
   * the vehicle collects at the sellers, then hands the orders over at their CDS stores (milk run).
   */
  createPickupPlan(b: { orders: { orderId: string; cdsStoreId?: string }[]; plannedDate: string; slot?: string; pickup: Assignment; /** ignored: one vehicle runs the whole pickup */ cdsDelivery?: Assignment | null; remarks?: string }, by: string) {
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
    const plan = this.newPlan('PICKUP', 'SC', b.plannedDate, orders.map((o) => o.id), [], b.remarks ?? '', by);
    // One pickup trip: the sellers first (shortest order from the Service Centre), then the CDS stores (shortest
    // order from the last seller). Each order uses this trip for both its pickup and its CDS handover.
    const dists = this.sequence(SC_HUB, uniq(orders.map((o) => o.distributorId)).map((id) => this.distributor(id)));
    const stores = this.sequence(dists[dists.length - 1] ?? SC_HUB, uniq(orders.map((o) => o.cdsStoreId)).map((id) => this.store(id)));
    const stops = [
      ...dists.map((d) => this.newStop(0, 'DISTRIBUTOR_PICKUP', 'DISTRIBUTOR', d, orders.filter((o) => o.distributorId === d.id).flatMap((o) => this.orderLines(o, (l) => l.qty)))),
      ...stores.map((st) => this.newStop(0, 'CDS_HANDOVER', 'CDS', this.storeParty(st), orders.filter((o) => o.cdsStoreId === st.id).flatMap((o) => this.orderLines(o, (l) => l.qty)))),
    ];
    stops.forEach((s, i) => (s.seq = i + 1));
    const pickup = this.newTrip('DISTRIBUTOR_PICKUP', 'SC', plan, b.plannedDate, b.slot ?? '08:00 – 12:00', pickupA, stops, by, SC_HUB);
    orders.forEach((o) => {
      o.pickupTripId = pickup.id;
      o.cdsTripId = pickup.id;
      this.setOrder(o, 'PICKUP_PLANNED', by, pickup.tripNo);
    });
    return { plan, pickupTrip: pickup, cdsDeliveryTrip: null as Trip | null };
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
    const plan = this.newPlan('CDS_DELIVERY', 'SC', b.plannedDate, orders.map((o) => o.id), [], b.remarks ?? '', by);
    return { plan, trip: this.buildCdsDeliveryTrip(plan, orders, b.plannedDate, b.slot ?? '12:00 – 17:00', a, by, (l) => l.pickedQty) };
  }

  // ---------------------------------------------------------------- 6. CDS User Delivery Planning (next day) → Retailer Delivery Trip

  createDeliveryPlan(b: { cdsStoreId: string; orderIds: string[]; returnIds?: string[]; plannedDate: string; slot?: string; vehicleId: string; deliveryPersonId: string; remarks?: string }, by: string) {
    const st = this.store(b.cdsStoreId);
    this.checkDate(b.plannedDate, true);
    const orders = uniq(b.orderIds ?? []).map((id) => this.order(id));
    const rets = uniq(b.returnIds ?? []).map((id) => this.ret(id));
    if (!orders.length && !rets.length) throw bad('Select at least one order or return');
    orders.forEach((o) => {
      if (o.cdsStoreId !== st.id) throw new CdsError(403, `${o.orderNo} belongs to another CDS`);
      if (o.status !== 'READY_FOR_DELIVERY') throw conflict(`${o.orderNo} is ${o.status}; only Ready for Planning orders can be planned`);
    });
    rets.forEach((r) => {
      if (r.cdsStoreId !== st.id) throw new CdsError(403, `${r.returnNo} belongs to another CDS`);
      if (r.status !== 'RETURN_INITIATED' || r.retailerTripId) throw conflict(`${r.returnNo} is ${r.status}${r.retailerTripId ? ' and already on a trip' : ''}`);
    });
    const loadKg = sum(orders, (o) => sum(o.lines, (l) => (l.acceptedQty - l.deliveredQty) * l.unitWeightKg));
    const a = this.assign(st.id, b.plannedDate, b, loadKg);
    const plan = this.newPlan('RETAILER_DELIVERY', st.id, b.plannedDate, orders.map((o) => o.id), rets.map((r) => r.id), b.remarks ?? '', by);
    const stops: TripStop[] = [];
    if (orders.length) stops.push(this.newStop(1, 'CDS_ORDER_PICKUP', 'CDS', this.storeParty(st), orders.flatMap((o) => this.orderLines(o, (l) => l.acceptedQty - l.deliveredQty))));
    const retailerIds = uniq([...orders.map((o) => o.retailerId), ...rets.map((r) => r.retailerId!)]);
    this.sequence(st, retailerIds.map((id) => this.retailer(id))).forEach((rt) => {
      const os = orders.filter((o) => o.retailerId === rt.id);
      if (os.length) stops.push(this.newStop(stops.length + 1, 'RETAILER_DELIVERY', 'RETAILER', rt, os.flatMap((o) => this.orderLines(o, (l) => l.acceptedQty - l.deliveredQty))));
      const rs = rets.filter((r) => r.retailerId === rt.id);
      if (rs.length) stops.push(this.newStop(stops.length + 1, 'RETAILER_RETURN', 'RETAILER', rt, rs.flatMap((r) => this.returnLines(r, (l) => l.qty))));
    });
    if (rets.length) stops.push(this.newStop(stops.length + 1, 'RETURN_HANDOVER_CDS', 'CDS', this.storeParty(st), rets.flatMap((r) => this.returnLines(r, (l) => l.qty))));
    const t = this.newTrip('RETAILER_DELIVERY', st.id, plan, b.plannedDate, b.slot ?? '09:00 – 13:00', a, stops, by, st);
    orders.forEach((o) => {
      o.deliveryTripId = t.id;
      this.setOrder(o, 'DELIVERY_PLANNED', by, t.tripNo);
    });
    rets.forEach((r) => (r.retailerTripId = t.id));
    return { plan, trip: t };
  }

  // ---------------------------------------------------------------- 10. Return Planning (next day) → CDS Return Trip

  createReturnPlan(b: { returnIds: string[]; plannedDate: string; slot?: string; vehicleId: string; deliveryPersonId: string; remarks?: string }, by: string) {
    this.checkDate(b.plannedDate, true);
    if (!b.returnIds?.length) throw bad('Select at least one return');
    const rets = uniq(b.returnIds).map((id) => this.ret(id));
    rets.forEach((r) => {
      if (r.status !== 'RECEIVED_AT_CDS') throw conflict(`${r.returnNo} is ${r.status}; only returns Received at CDS can be planned`);
      if (!sum(r.lines, (l) => l.acceptedQty ?? 0)) throw conflict(`${r.returnNo} has no accepted quantity to return`);
    });
    const loadKg = sum(rets, (r) => sum(r.lines, (l) => (l.acceptedQty ?? 0) * l.unitWeightKg));
    const a = this.assign('SC', b.plannedDate, b, loadKg);
    const plan = this.newPlan('RETURN', 'SC', b.plannedDate, [], rets.map((r) => r.id), b.remarks ?? '', by);
    const stores = this.sequence(SC_HUB, uniq(rets.map((r) => r.cdsStoreId)).map((id) => this.store(id)));
    const stops = stores.map((st, i) => this.newStop(i + 1, 'CDS_RETURN_PICKUP', 'CDS', this.storeParty(st), rets.filter((r) => r.cdsStoreId === st.id).flatMap((r) => this.returnLines(r, (l) => l.acceptedQty ?? 0))));
    const last = stores[stores.length - 1];
    this.sequence(last, uniq(rets.map((r) => r.distributorId)).map((id) => this.distributor(id))).forEach((d) => {
      stops.push(this.newStop(stops.length + 1, 'SELLER_RETURN_HANDOVER', 'DISTRIBUTOR', d, rets.filter((r) => r.distributorId === d.id).flatMap((r) => this.returnLines(r, (l) => l.acceptedQty ?? 0))));
    });
    const t = this.newTrip('CDS_RETURN', 'SC', plan, b.plannedDate, b.slot ?? '09:00 – 14:00', a, stops, by, SC_HUB);
    rets.forEach((r) => {
      r.returnTripId = t.id;
      this.setReturn(r, 'RETURN_PLANNED', by, t.tripNo);
    });
    return { plan, trip: t };
  }

  // ---------------------------------------------------------------- returns raised by the CDS User / at the retailer

  returnableQty(o: CdsOrder, sku: string) {
    const l = o.lines.find((x) => x.sku === sku);
    if (!l) return 0;
    const open = sum(this.s.returns.filter((r) => r.source === 'RETAILER' && r.orderId === o.id && r.status !== 'CANCELLED'), (r) => {
      const x = r.lines.find((y) => y.sku === sku);
      if (!x) return 0;
      return r.status === 'RETURN_INITIATED' ? x.qty : x.pickedQty ?? 0;
    });
    return Math.max(0, l.deliveredQty - open);
  }

  initiateReturn(b: { orderId: string; lines: { sku: string; qty: number; reason: string; condition?: ItemCondition }[] }, by: string) {
    const o = this.order(b.orderId);
    if (!['DELIVERED', 'PARTIALLY_DELIVERED'].includes(o.status)) throw conflict(`${o.orderNo} is ${o.status}; returns can be raised only on delivered orders`);
    const lines = (b.lines ?? []).filter((x) => x.qty > 0).map((x) => {
      const l = o.lines.find((y) => y.sku === x.sku);
      if (!l) throw bad(`${o.orderNo} has no SKU ${x.sku}`);
      if (!isQty(x.qty)) throw bad(`Invalid quantity for ${l.name}`);
      const max = this.returnableQty(o, l.sku);
      if (x.qty > max) throw conflict(`${l.name}: only ${max} unit(s) can be returned on ${o.orderNo}`);
      if (!x.reason?.trim()) throw bad(`Select a return reason for ${l.name}`);
      return { sku: l.sku, name: l.name, unitPrice: l.unitPrice, unitWeightKg: l.unitWeightKg, qty: x.qty, reason: x.reason, condition: x.condition ?? 'GOOD', pickedQty: null, acceptedQty: null, rejectedQty: null, handedToSellerQty: null };
    });
    if (!lines.length) throw bad('Enter a return quantity for at least one SKU');
    const r: ReturnRecord = {
      id: `ret-${this.seq()}`, returnNo: `RET-${this.seq()}`, source: 'RETAILER', orderId: o.id, orderNo: o.orderNo, cdsStoreId: o.cdsStoreId,
      distributorId: o.distributorId, retailerId: o.retailerId, lines, status: 'RETURN_INITIATED', retailerTripId: null, returnTripId: null,
      history: [{ from: null, to: 'RETURN_INITIATED', at: this.now(), by }], ...this.stamp(by),
    };
    this.s.returns.push(r);
    this.audit('RETURN', r.id, by, 'RETURN_INITIATED', `${r.returnNo} on ${o.orderNo}`);
    return r;
  }

  cancelReturn(id: string, reason: string, by: string) {
    const r = this.ret(id);
    if (!reason?.trim()) throw bad('A reason is required');
    if (r.retailerTripId) throw conflict(`${r.returnNo} is on trip ${this.trip(r.retailerTripId).tripNo}`);
    this.setReturn(r, 'CANCELLED', by, reason);
    return r;
  }

  /**
   * Delivery person collects a return during a retailer visit (not planned in advance) — before or after confirming the
   * delivery at that stop, for any order already delivered to that retailer. Adds the return-collection stop and the
   * return handover at the CDS.
   */
  addReturnAtStop(tripId: string, stopId: string, b: { orderId: string; lines: { sku: string; qty: number; reason: string; condition?: ItemCondition }[] }, by: string) {
    const t = this.trip(tripId);
    const st = t.stops.find((x) => x.id === stopId);
    if (!st || st.action !== 'RETAILER_DELIVERY') throw bad('Returns are collected at a retailer delivery stop');
    if (!['STARTED', 'IN_PROGRESS'].includes(t.status)) throw conflict(`${t.tripNo} is ${t.status}`);
    if (st.status === 'FAILED') throw conflict(`The visit to ${st.name} failed`);
    const o = this.order(b.orderId);
    if (o.retailerId !== st.partyId) throw bad(`${o.orderNo} is not an order of ${st.name}`);
    const r = this.initiateReturn(b, by);
    r.retailerTripId = t.id;
    t.returnIds.push(r.id);
    let rs = t.stops.find((x) => x.action === 'RETAILER_RETURN' && x.partyId === st.partyId && x.status === 'PENDING');
    if (!rs) {
      rs = this.newStop(0, 'RETAILER_RETURN', 'RETAILER', this.retailer(st.partyId), []);
      t.stops.splice(t.stops.indexOf(st) + 1, 0, rs);
    }
    rs.lines.push(...this.returnLines(r, (l) => l.qty));
    let h = t.stops.find((x) => x.action === 'RETURN_HANDOVER_CDS' && x.status === 'PENDING');
    if (!h) {
      h = this.newStop(0, 'RETURN_HANDOVER_CDS', 'CDS', this.storeParty(this.store(t.owner)), []);
      t.stops.push(h);
    }
    h.lines.push(...this.returnLines(r, (l) => l.qty));
    t.stops.forEach((x, i) => (x.seq = i + 1));
    this.audit('TRIP', t.id, by, 'RETURN_ADDED', `${r.returnNo} at ${st.name}`);
    return r;
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
      t.returnIds.map((x) => this.ret(x)).forEach((r) => (r.retailerTripId = null));
    }
    if (t.type === 'CDS_RETURN') t.returnIds.map((x) => this.ret(x)).forEach((r) => {
      r.returnTripId = null;
      this.setReturn(r, 'RECEIVED_AT_CDS', by, `${t.tripNo} cancelled`);
    });
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
    if (st.action === 'RETURN_HANDOVER_CDS' && pending('RETAILER_RETURN')) throw conflict('Finish the return collection stops first');
    if (st.action === 'SELLER_RETURN_HANDOVER') {
      const waiting = t.stops.filter((x) => x.action === 'CDS_RETURN_PICKUP' && x.status === 'PENDING' && x.lines.some((l) => st.lines.some((m) => m.returnId === l.returnId)));
      if (waiting.length) throw conflict(`Collect the returns at ${waiting.map((x) => x.name).join(', ')} first`);
    }
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
    // validate quantities before consuming the OTP; excess at a CDS handover is allowed (the GRN records it)
    const qtys = st.lines.map((l, i) => {
      const x = input.lines?.find((y) => y.idx === i);
      const max = st.action === 'CDS_HANDOVER' ? l.plannedQty * 2 + 10 : l.plannedQty;
      const q = x ? x.actualQty : l.plannedQty;
      if (!isQty(q)) throw bad(`${l.name}: enter a valid quantity`);
      if (q > max) throw bad(`${l.name}: quantity cannot be more than ${l.plannedQty}`);
      return q;
    });
    if (st.action === 'RETURN_HANDOVER_CDS') {
      st.lines.forEach((l, i) => {
        const x = input.lines?.find((y) => y.idx === i);
        const acc = x?.acceptedQty ?? qtys[i];
        const rej = x?.rejectedQty ?? 0;
        if (!isQty(acc) || !isQty(rej) || acc + rej !== qtys[i]) throw bad(`${l.name}: accepted + rejected must equal received (${qtys[i]})`);
      });
    }
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
    const returnsAt = uniq(st.lines.map((l) => l.returnId).filter((x): x is string => !!x)).map((id) => this.ret(id));
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
            // two-trip data: the CDS leg is a separate trip that is already running
            if (ct.id !== t.id && ['STARTED', 'IN_PROGRESS'].includes(ct.status)) this.setOrder(o, 'IN_TRANSIT_TO_CDS', by, ct.tripNo);
          }
        });
        // One pickup trip: orders stay Picked Up while the vehicle collects from the sellers; after the last seller
        // pickup they are In Transit to CDS.
        if (!t.stops.some((s) => s.action === 'DISTRIBUTOR_PICKUP' && s.status === 'PENDING')) {
          t.orderIds.map((x) => this.order(x)).filter((o) => o.status === 'PICKED_UP' && o.cdsTripId === t.id).forEach((o) => this.setOrder(o, 'IN_TRANSIT_TO_CDS', by, t.tripNo));
        }
        break;
      case 'CDS_HANDOVER':
        ordersAt.forEach((o) => {
          st.lines.filter((l) => l.orderId === o.id).forEach((l) => (line(o, l.sku).receivedQty = l.actualQty ?? 0));
          this.setOrder(o, 'RECEIVED_AT_CDS', by, `${t.tripNo} · OTP verified`);
        });
        // one GRN per distributor at this CDS — GRN is maintained distributor-wise
        uniq(ordersAt.map((o) => o.distributorId)).forEach((dId) => {
          const os = ordersAt.filter((o) => o.distributorId === dId);
          const g: Grn = {
            id: `grn-${this.seq()}`, grnNo: `GRN-${this.seq()}`, cdsStoreId: st.partyId, distributorId: dId, cdsTripId: t.id,
            pickupTripIds: uniq(os.map((o) => o.pickupTripId).filter((x): x is string => !!x)), orderIds: os.map((o) => o.id), status: 'PENDING',
            lines: st.lines.filter((l) => os.some((o) => o.id === l.orderId)).map((l) => ({
              orderId: l.orderId!, orderNo: this.order(l.orderId!).orderNo, sku: l.sku, name: l.name, dispatchedQty: l.plannedQty, receivedQty: l.actualQty ?? 0,
              acceptedQty: null, damagedQty: null, shortQty: Math.max(0, l.plannedQty - (l.actualQty ?? 0)), excessQty: Math.max(0, (l.actualQty ?? 0) - l.plannedQty), remarks: '',
            })),
            remarks: '', completedAt: null, history: [{ from: null, to: 'PENDING', at: this.now(), by, note: `Handed over on ${t.tripNo}` }], ...this.stamp(by),
          };
          this.s.grns.push(g);
          os.forEach((o) => (o.grnId = g.id));
          this.audit('GRN', g.id, by, 'GRN_RAISED', `${g.grnNo} · ${this.distributor(dId).name} → ${this.store(st.partyId).name}`);
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
              amount: round2(c ? Number(c.amount) : due), mode: c?.mode ?? 'CASH', collectedAt: this.now(), status: 'WITH_DELIVERY_PERSON',
              cdsReceivedAmount: null, cdsReceivedAt: null, cdsReceivedBy: null, mismatchNote: null, qwipoHandoverRef: null, qwipoHandedAt: null, settlementRef: null, settledAt: null,
              history: [{ from: null, to: 'WITH_DELIVERY_PERSON', at: this.now(), by, note: `${t.tripNo} · ${st.name}` }], ...this.stamp(by),
            };
            this.s.collections.push(col);
            st.collectionId = col.id;
          }
        });
        break;
      case 'RETAILER_RETURN':
        returnsAt.forEach((r) => {
          st.lines.filter((l) => l.returnId === r.id).forEach((l) => (r.lines.find((x) => x.sku === l.sku)!.pickedQty = l.actualQty ?? 0));
          const picked = sum(r.lines, (l) => l.pickedQty ?? 0);
          // the CDS handover stop expects what was collected
          t.stops.filter((s) => s.action === 'RETURN_HANDOVER_CDS' && s.status === 'PENDING').forEach((s) => {
            s.lines.filter((l) => l.returnId === r.id).forEach((l) => (l.plannedQty = r.lines.find((x) => x.sku === l.sku)!.pickedQty ?? 0));
            s.lines = s.lines.filter((l) => l.plannedQty > 0);
          });
          if (!picked) {
            r.retailerTripId = null;
            r.lines.forEach((l) => (l.pickedQty = null));
            r.history.push({ from: r.status, to: r.status, at: this.now(), by, note: `Not collected on ${t.tripNo}: ${st.failReason ?? ''} — plan again` });
            return;
          }
          this.setReturn(r, 'PICKED_UP_FROM_RETAILER', by, `${t.tripNo} · OTP verified`);
        });
        t.stops = t.stops.filter((s) => s.action !== 'RETURN_HANDOVER_CDS' || s.lines.length || s.status !== 'PENDING');
        renumber();
        break;
      case 'RETURN_HANDOVER_CDS':
        st.lines.forEach((l, i) => {
          const x = input.lines?.find((y) => y.idx === i);
          l.acceptedQty = x?.acceptedQty ?? l.actualQty ?? 0;
          l.rejectedQty = x?.rejectedQty ?? 0;
        });
        returnsAt.forEach((r) => {
          st.lines.filter((l) => l.returnId === r.id).forEach((l) => {
            const rl = r.lines.find((x) => x.sku === l.sku)!;
            rl.acceptedQty = l.acceptedQty ?? 0;
            rl.rejectedQty = l.rejectedQty ?? 0;
            const ol = this.order(r.orderId).lines.find((x) => x.sku === l.sku);
            if (ol) ol.returnedQty += l.actualQty ?? 0;
          });
          this.setReturn(r, 'RECEIVED_AT_CDS', by, `${t.tripNo} · OTP verified`);
          if (!sum(r.lines, (l) => l.acceptedQty ?? 0)) this.setReturn(r, 'COMPLETED', by, 'Nothing accepted — closed at the CDS');
          const o = this.order(r.orderId);
          if (sum(o.lines, (l) => l.deliveredQty) > 0 && o.lines.every((l) => l.returnedQty >= l.deliveredQty)) this.setOrder(o, 'RETURNED', by, r.returnNo);
        });
        break;
      case 'CDS_RETURN_PICKUP':
        returnsAt.forEach((r) => {
          st.lines.filter((l) => l.returnId === r.id).forEach((l) => {
            t.stops.filter((s) => s.action === 'SELLER_RETURN_HANDOVER' && s.status === 'PENDING').forEach((s) => s.lines.filter((m) => m.returnId === r.id && m.sku === l.sku).forEach((m) => (m.plannedQty = l.actualQty ?? 0)));
          });
          t.stops.forEach((s) => { if (s.action === 'SELLER_RETURN_HANDOVER' && s.status === 'PENDING') s.lines = s.lines.filter((l) => l.plannedQty > 0); });
          if (!sum(st.lines.filter((l) => l.returnId === r.id), (l) => l.actualQty ?? 0)) {
            r.returnTripId = null;
            this.setReturn(r, 'RECEIVED_AT_CDS', by, `Not loaded on ${t.tripNo}`);
            return;
          }
          this.setReturn(r, 'PICKED_UP_FROM_CDS', by, `${t.tripNo} · OTP verified`);
        });
        t.stops = t.stops.filter((s) => s.action !== 'SELLER_RETURN_HANDOVER' || s.lines.length || s.status !== 'PENDING');
        renumber();
        break;
      case 'SELLER_RETURN_HANDOVER':
        returnsAt.forEach((r) => {
          st.lines.filter((l) => l.returnId === r.id).forEach((l) => (r.lines.find((x) => x.sku === l.sku)!.handedToSellerQty = l.actualQty ?? 0));
          if (st.status === 'FAILED') {
            // seller did not take the goods: they go back to the CDS and can be planned again
            r.returnTripId = null;
            r.history.push({ from: r.status, to: 'RECEIVED_AT_CDS', at: this.now(), by, note: `Seller did not accept on ${t.tripNo}: ${st.failReason} — back to the CDS` });
            r.status = 'RECEIVED_AT_CDS';
            return;
          }
          this.setReturn(r, 'DELIVERED_TO_SELLER', by, `${t.tripNo} · OTP verified`);
        });
        break;
    }
  }

  private finishIfDone(t: Trip, by: string) {
    if (!['STARTED', 'IN_PROGRESS'].includes(t.status) || t.stops.some((s) => s.status === 'PENDING')) return;
    if (t.status === 'STARTED') this.setTrip(t, 'IN_PROGRESS', by);
    const clean = t.stops.every((s) => s.status === 'DONE');
    this.setTrip(t, clean ? 'COMPLETED' : 'PARTIALLY_COMPLETED', by);
    if (t.type === 'CDS_RETURN') t.returnIds.map((x) => this.ret(x)).filter((r) => r.status === 'DELIVERED_TO_SELLER').forEach((r) => this.setReturn(r, 'COMPLETED', by, `${t.tripNo} completed`));
    this.audit('TRIP', t.id, by, clean ? 'COMPLETED' : 'PARTIALLY_COMPLETED');
  }

  // ---------------------------------------------------------------- 4. GRN (distributor-wise)

  /** Ordered Products › Edit on a planned pickup trip (CDS User): changes a product's quantity on its store's orders
   *  before the pickup starts. The order value and weight, the trip stops and the trip load follow the new quantity. */
  updatePlannedQty(tripId: string, cdsStoreId: string, sku: string, items: { orderId: string; qty: number }[], remarks: string, by: string) {
    const t = this.trip(tripId);
    if (t.type !== 'DISTRIBUTOR_PICKUP') throw bad('Only pickup trips can be edited here');
    if (!['PLANNED', 'ASSIGNED'].includes(t.status)) throw conflict(`${t.tripNo} has started; quantities cannot change now`);
    if (!items?.length) throw bad('Nothing to save');
    if (!remarks?.trim()) throw bad('Add a remark for the change');
    const changes = items.map((x) => {
      const o = this.order(x.orderId);
      if (o.cdsStoreId !== cdsStoreId || !t.orderIds.includes(o.id)) throw bad(`${o.orderNo} is not on this trip for your CDS store`);
      const l = o.lines.find((y) => y.sku === sku);
      if (!l) throw bad(`${o.orderNo} has no such product`);
      if (!isQty(x.qty) || x.qty > l.qty) throw bad(`${o.orderNo}: enter a quantity from 0 to ${l.qty}`);
      if (sum(o.lines, (y) => (y.sku === sku ? x.qty : y.qty)) === 0) throw bad(`${o.orderNo}: at least one unit must stay on the order (cancel the order instead)`);
      return { o, l, qty: x.qty };
    });
    changes.forEach(({ o, l, qty }) => {
      if (qty === l.qty) return;
      const was = l.qty;
      l.qty = qty;
      o.orderValue = round2(sum(o.lines, (y) => y.qty * y.unitPrice));
      o.weightKg = round2(sum(o.lines, (y) => y.qty * y.unitWeightKg));
      o.history.push({ from: o.status, to: o.status, at: this.now(), by, note: `${l.name}: ${was} → ${qty} on ${t.tripNo} (${remarks.trim()})` });
      this.touch(o, by);
      t.stops.forEach((s) => {
        s.lines.filter((x) => x.orderId === o.id && x.sku === sku).forEach((x) => (x.plannedQty = qty));
        s.lines = s.lines.filter((x) => x.plannedQty > 0);
      });
      this.audit('ORDER', o.id, by, 'QTY_UPDATED', `${o.orderNo} · ${l.name}: ${was} → ${qty} · ${remarks.trim()}`);
    });
    t.loadKg = round2(sum(t.stops.filter((s) => s.action === 'DISTRIBUTOR_PICKUP'), (s) => sum(s.lines, (x) => x.plannedQty * x.unitWeightKg)));
    this.touch(t, by);
    return t;
  }
  /** Ordered Products › Edit: saves the verified quantities of some GRN lines; the GRN stays pending until generated. */
  saveGrnLines(id: string, lines: { idx: number; acceptedQty: number; damagedQty: number; remarks?: string }[], by: string) {
    const g = this.grn(id);
    if (g.status !== 'PENDING') throw conflict(`${g.grnNo} is already generated`);
    if (!lines?.length) throw bad('Nothing to save');
    lines.forEach((x) => {
      const l = g.lines[x.idx];
      if (!l) throw bad('Unknown GRN line');
      if (!isQty(x.acceptedQty) || !isQty(x.damagedQty)) throw bad(`${l.name}: enter valid quantities`);
      if (x.acceptedQty + x.damagedQty !== l.receivedQty) throw bad(`${l.name} (${l.orderNo}): accepted + damaged must equal received (${l.receivedQty})`);
      if ((l.shortQty || l.excessQty || x.damagedQty) && !(x.remarks ?? '').trim()) throw bad(`${l.name} (${l.orderNo}): add a remark for the shortage / excess / damage`);
    });
    lines.forEach((x) => {
      const l = g.lines[x.idx];
      l.acceptedQty = x.acceptedQty;
      l.damagedQty = x.damagedQty;
      l.remarks = x.remarks ?? '';
    });
    this.touch(g, by);
    return g;
  }
  completeGrn(id: string, b: { lines: { idx: number; acceptedQty: number; damagedQty: number; remarks?: string }[]; remarks?: string }, by: string) {
    const g = this.grn(id);
    if (g.status !== 'PENDING') throw conflict(`${g.grnNo} is already generated`);
    g.lines.forEach((l, i) => {
      const x = b.lines?.find((y) => y.idx === i);
      if (!x) throw bad(`Enter the verified quantities for ${l.name} (${l.orderNo})`);
      if (!isQty(x.acceptedQty) || !isQty(x.damagedQty)) throw bad(`${l.name}: enter valid quantities`);
      if (x.acceptedQty + x.damagedQty !== l.receivedQty) throw bad(`${l.name} (${l.orderNo}): accepted + damaged must equal received (${l.receivedQty})`);
      if ((l.shortQty || l.excessQty || x.damagedQty) && !(x.remarks ?? '').trim()) throw bad(`${l.name} (${l.orderNo}): add a remark for the shortage / excess / damage`);
    });
    g.lines.forEach((l, i) => {
      const x = b.lines.find((y) => y.idx === i)!;
      l.acceptedQty = Math.min(x.acceptedQty, l.dispatchedQty); // excess units are recorded but are not deliverable
      l.damagedQty = x.damagedQty;
      l.remarks = x.remarks ?? '';
    });
    g.remarks = b.remarks ?? '';
    g.status = 'COMPLETED';
    g.completedAt = this.now();
    g.history.push({ from: 'PENDING', to: 'COMPLETED', at: this.now(), by });
    this.touch(g, by);
    g.orderIds.map((x) => this.order(x)).forEach((o) => {
      g.lines.filter((l) => l.orderId === o.id).forEach((l) => {
        const ol = o.lines.find((y) => y.sku === l.sku)!;
        ol.acceptedQty = l.acceptedQty ?? 0;
        ol.damagedQty = l.damagedQty ?? 0;
      });
      this.setOrder(o, 'GRN_COMPLETED', by, g.grnNo);
      if (sum(o.lines, (l) => l.acceptedQty) > 0) this.setOrder(o, 'READY_FOR_DELIVERY', by);
      else o.note = 'Nothing accepted at GRN';
      // damaged goods go back to the distributor through Return Planning
      const dmg = o.lines.filter((l) => g.lines.some((x) => x.orderId === o.id && x.sku === l.sku && (x.damagedQty ?? 0) > 0));
      if (dmg.length) {
        const r: ReturnRecord = {
          id: `ret-${this.seq()}`, returnNo: `RET-${this.seq()}`, source: 'GRN', orderId: o.id, orderNo: o.orderNo, cdsStoreId: o.cdsStoreId, distributorId: o.distributorId,
          retailerId: null, status: 'RECEIVED_AT_CDS', retailerTripId: null, returnTripId: null,
          lines: dmg.map((l) => ({ sku: l.sku, name: l.name, unitPrice: l.unitPrice, unitWeightKg: l.unitWeightKg, qty: l.damagedQty, reason: 'Damaged in transit', condition: 'DAMAGED' as const, pickedQty: l.damagedQty, acceptedQty: l.damagedQty, rejectedQty: 0, handedToSellerQty: null })),
          history: [{ from: null, to: 'RECEIVED_AT_CDS', at: this.now(), by, note: `Damaged at ${g.grnNo}` }], ...this.stamp(by),
        };
        this.s.returns.push(r);
      }
    });
    this.audit('GRN', g.id, by, 'GRN_GENERATED', g.lines.map((l) => `${l.orderNo}/${l.sku}: rcv ${l.receivedQty} ok ${l.acceptedQty} dmg ${l.damagedQty} short ${l.shortQty} excess ${l.excessQty}`).join('; '));
    return g;
  }

  // ---------------------------------------------------------------- collections & payments (manual)

  private collectionsAt(ids: string[] | undefined, storeId: string) {
    if (!ids?.length) throw bad('Select at least one collection');
    return uniq(ids).map((id) => {
      const c = this.collection(id);
      if (c.cdsStoreId !== storeId) throw new CdsError(403, `${c.collectionNo} belongs to another CDS`);
      return c;
    });
  }
  receiveCollections(storeId: string, b: { items: { id: string; amount: number }[]; note?: string }, by: string) {
    const cs = this.collectionsAt(b.items?.map((x) => x.id), storeId);
    cs.forEach((c) => {
      if (c.status !== 'WITH_DELIVERY_PERSON') throw conflict(`${c.collectionNo} is already received`);
      const amt = Number(b.items.find((x) => x.id === c.id)!.amount);
      if (!(amt >= 0)) throw bad(`${c.collectionNo}: enter the amount received`);
      if (round2(amt) !== c.amount && !b.note?.trim()) throw bad(`${c.collectionNo}: ₹${amt} received differs from ₹${c.amount} collected — add a note`);
    });
    cs.forEach((c) => {
      const amt = round2(Number(b.items.find((x) => x.id === c.id)!.amount));
      c.cdsReceivedAmount = amt;
      c.cdsReceivedAt = this.now();
      c.cdsReceivedBy = by;
      if (amt !== c.amount) c.mismatchNote = b.note ?? null;
      c.history.push({ from: c.status, to: 'RECEIVED_BY_CDS', at: this.now(), by, note: amt !== c.amount ? `₹${amt} received vs ₹${c.amount}: ${b.note}` : undefined });
      c.status = 'RECEIVED_BY_CDS';
      this.touch(c, by);
      this.audit('COLLECTION', c.id, by, 'RECEIVED_BY_CDS', `₹${amt}`);
    });
    return cs;
  }
  handToQwipo(storeId: string, ids: string[], ref: string, by: string) {
    if (!ref?.trim()) throw bad('Enter the handover reference (deposit slip / UTR)');
    const cs = this.collectionsAt(ids, storeId);
    cs.forEach((c) => { if (c.status !== 'RECEIVED_BY_CDS') throw conflict(`${c.collectionNo} must be received by the CDS first`); });
    cs.forEach((c) => {
      c.qwipoHandoverRef = ref.trim();
      c.qwipoHandedAt = this.now();
      c.history.push({ from: c.status, to: 'HANDED_TO_QWIPO', at: this.now(), by, note: ref });
      c.status = 'HANDED_TO_QWIPO';
      this.touch(c, by);
      this.audit('COLLECTION', c.id, by, 'HANDED_TO_QWIPO', ref);
    });
    return cs;
  }
  recordSettlement(storeId: string, ids: string[], ref: string, by: string) {
    if (!ref?.trim()) throw bad('Enter the settlement reference from Qwipo (SNP)');
    const cs = this.collectionsAt(ids, storeId);
    cs.forEach((c) => { if (c.status !== 'HANDED_TO_QWIPO') throw conflict(`${c.collectionNo} must be handed to Qwipo first`); });
    cs.forEach((c) => {
      c.settlementRef = ref.trim();
      c.settledAt = this.now();
      c.history.push({ from: c.status, to: 'SETTLED', at: this.now(), by, note: ref });
      c.status = 'SETTLED';
      this.touch(c, by);
      this.audit('COLLECTION', c.id, by, 'SETTLED', ref);
    });
    return cs;
  }
}
