// Delivery Planning (route planning) — synthetic route-plan combos + pure planning helpers shared with
// src/mock/routes/deliveryRoutes.ts. Data lives in `db.ext.routePlans` (one record per route-plan combo).
//
// Seeded combos cover every list state of /delivery-routes (spec 03 §3–§11):
//   Overflow (relationshipType null): CREATED · QUOTATION_REQUESTED · CREATED about to expire
//   Planned  (relationshipType set) : CREATED · AUTO_CONFIRMING (→ trip + SSE "tripCreated" ~100 s after first view)
//                                     QUOTATION_REQUESTED without expiry (backend drops it ~50 s after first view →
//                                     "Trip Generation Failed" on the next 30 s poll) · CONFIRMATION_IN_PROGRESS expired ("Failed")
// Times of seeded combos are stored as offsets and anchored to the first /delivery_planning/search call, so the
// countdowns are fresh when the page is first opened (see `anchorPendingCombos`).
import type { MockDatabase, Rng } from '../seed';
import type { DbAddress, DbCustomer, DbOrder, DbOrderItem, DbVehicle } from '../types';

// ---------------------------------------------------------------- types
export interface RouteOrder {
  orderId: string;
  orderType: 'Digital' | 'Sales';
  orderAmount: number;
  orderDeadWeight: number;
  orderVolWeight: number;
  seq: string;
}

export interface RouteCustomer {
  customerId: string;
  customerName: string;
  customerBusinessName: string;
  customerMobileNumber: string;
  beatName: string | null;
  salesPersonName: string | null;
  lat: number | null;
  long: number | null;
  seq: string;
  totalAmount: number;
  orderCount: number;
  totalDeadWeight: number;
  totalVolWeight: number;
  orders: RouteOrder[];
}

export interface RouteBeat {
  name: string;
  inRoute: number;
  total: number;
  coherencePct: number;
}

export interface OptimizedRoute {
  routeId: string;
  routeName: string;
  routeDirection?: string;
  vehicleType: string;
  vehicleCapacity: number;
  vehicleCost: number;
  /** Extra round-trip fields (not read by the UI): own vehicle assigned during planning → "Planned" combo. */
  vehicleId: string | null;
  vehicleRegNumber: string | null;
  relationshipType: string | null;
  customerCount: number;
  orderCount: number;
  distanceKm: number;
  estimatedTimeHours: number;
  estimatedTimeFormatted: string;
  totalAmount: number;
  totalWeightKg: number;
  totalVolWeightKg: number;
  vehicleUtilized: number;
  deliveryCostPercentage: number;
  digitalOrderPercentage: number;
  saleOrderPercentage: number;
  beatCoherenceScore?: number;
  beatCoherenceReason?: string;
  routeExplanation?: string;
  expectedDeliveryDate: string;
  beats: RouteBeat[];
  customers: RouteCustomer[];
  clusterName?: string | null;
}

export interface ProviderQuote {
  ondcSearchId: string;
  providerId: string;
  providerName: string;
  routeId: string;
  routeName: string;
  deliveryPrice: string;
  pickupTime: string;
  isEnabled: boolean;
  categoryId: string;
  deliveryDate: string;
  deliveryTatDuration: string;
  resultTimestamp: string;
}

export interface RoutePlanCombo {
  routePlanComboId: string;
  routePlanRequestId: string;
  /** Display id, e.g. "RT-1104-0007" (or the QS-… id for a single-order quick booking). */
  routeId: string;
  logisticsOrderRowId: string;
  buyerId: string;
  buyerAddressId: string;
  createdDate: string;
  sla: string;
  /** YYYY-MM-DD */
  deliveryDate: string;
  routePlanRequestStatus: string;
  routePlanComboStatus: string;
  relationshipType: string | null;
  vehicleId: string | null;
  routePlanComboExpireTime: string | null;
  routePlanRequestExpireTime: string | null;
  orderIds: string[];
  route: OptimizedRoute;
  quotes: ProviderQuote[];
  isQuick: boolean;
  /** Server-side simulated outcome of an auto-confirming self-fleet combo. */
  outcome: { kind: 'trip' | 'fail'; at: string } | null;
  /** Seeded combos only: offsets in ms relative to the first search call. Cleared once anchored. */
  pendingAnchor?: { createdOffsetMs: number; expiryOffsetMs: number | null; outcome?: { kind: 'trip' | 'fail'; offsetMs: number } } | null;
}

export interface Depot {
  lat: number;
  long: number;
}

// ---------------------------------------------------------------- maths
export const round2 = (n: number) => Math.round(n * 100) / 100;
const round0 = (n: number) => Math.round(n);

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Road distance ≈ straight line × 1.35 (Hyderabad street network). */
const ROAD_FACTOR = 1.35;
const AVG_SPEED_KMPH = 22;

export const hasCoords = (c: { lat: number | null; long: number | null }) => !!c.lat && !!c.long;

/** Nearest-neighbour tour from the depot (no return leg). Customers without coordinates go last. */
export function sequenceCustomers<T extends { lat: number | null; long: number | null }>(depot: Depot, customers: T[]): { ordered: T[]; distanceKm: number } {
  const withC = customers.filter(hasCoords);
  const without = customers.filter((c) => !hasCoords(c));
  const ordered: T[] = [];
  let cur = { lat: depot.lat, long: depot.long };
  let dist = 0;
  const pool = [...withC];
  while (pool.length) {
    let best = 0;
    let bestD = Infinity;
    pool.forEach((c, i) => {
      const d = haversineKm(cur.lat, cur.long, c.lat as number, c.long as number);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const [c] = pool.splice(best, 1);
    dist += bestD;
    ordered.push(c);
    cur = { lat: c.lat as number, long: c.long as number };
  }
  return { ordered: [...ordered, ...without], distanceKm: dist * ROAD_FACTOR };
}

export function travelSeconds(distanceKm: number, stops: number, serviceTimeMinutes: number): number {
  return Math.round((distanceKm / AVG_SPEED_KMPH) * 3600 + stops * serviceTimeMinutes * 60);
}

export function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.round((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const DIRECTIONS = ['East', 'Northeast', 'North', 'Northwest', 'West', 'Southwest', 'South', 'Southeast'];
export function bearingDeg(depot: Depot, lat: number, long: number): number {
  return (Math.atan2(lat - depot.lat, long - depot.long) * 180) / Math.PI;
}

// ---------------------------------------------------------------- vehicles
/** Generic hired (3PL) vehicle classes used for overflow routes. */
export const HIRED_VEHICLES = [
  { vehicleType: 'Mini Truck 7ft', vehicleCapacity: 750, base: 1100, perKm: 14 },
  { vehicleType: 'Pickup 8ft', vehicleCapacity: 1500, base: 1650, perKm: 18 },
  { vehicleType: 'Truck 14ft', vehicleCapacity: 4000, base: 3200, perKm: 26 },
];
const OWN_VEHICLE_COST = { base: 450, perKm: 12 };

export const ownVehicleLabel = (v: DbVehicle) => `${v.registrationNumber} (${v.vehicleType})`;

// ---------------------------------------------------------------- building routes
export function orderTypeOf(o: DbOrder): 'Digital' | 'Sales' {
  return o.orderType === 'Sales' ? 'Sales' : 'Digital';
}

/** Groups orders per customer (first-seen order) into route customers. */
export function customersFromOrders(orders: DbOrder[]): RouteCustomer[] {
  const map = new Map<string, RouteCustomer>();
  orders.forEach((o) => {
    let c = map.get(o.customerId);
    if (!c) {
      c = {
        customerId: o.customerId,
        customerName: o.customerName || o.customerBusinessName,
        customerBusinessName: o.customerBusinessName,
        customerMobileNumber: o.customerMobileNumber,
        beatName: o.salesBeatName,
        salesPersonName: o.salesPersonName,
        lat: o.lat || null,
        long: o.lng || null,
        seq: '0',
        totalAmount: 0,
        orderCount: 0,
        totalDeadWeight: 0,
        totalVolWeight: 0,
        orders: [],
      };
      map.set(o.customerId, c);
    }
    if (!c.salesPersonName && o.salesPersonName) c.salesPersonName = o.salesPersonName;
    c.orders.push({
      orderId: o.orderId,
      orderType: orderTypeOf(o),
      orderAmount: Number(o.amount) || 0,
      orderDeadWeight: Number(o.orderWeight) || 0,
      orderVolWeight: Number(o.volumetricWeight) || 0,
      seq: '0',
    });
    c.orderCount = c.orders.length;
    c.totalAmount = round2(c.totalAmount + (Number(o.amount) || 0));
    c.totalDeadWeight = round2(c.totalDeadWeight + (Number(o.orderWeight) || 0));
    c.totalVolWeight = round2(c.totalVolWeight + (Number(o.volumetricWeight) || 0));
  });
  return Array.from(map.values());
}

/** Global customers-per-beat counts across all routes (beatName || "No Beat"). */
export function globalBeatCounts(routes: { customers: RouteCustomer[] }[]): Record<string, number> {
  const F: Record<string, number> = {};
  routes.forEach((r) => r.customers.forEach((c) => {
    const b = c.beatName || 'No Beat';
    F[b] = (F[b] || 0) + 1;
  }));
  return F;
}

/** Recomputes the aggregate/KPI fields of a route (same formulas the UI uses after a move, spec 03 §5.7). */
export function computeRouteMetrics(r: OptimizedRoute, F: Record<string, number>, depot: Depot) {
  r.customerCount = r.customers.length;
  r.orderCount = r.customers.reduce((s, c) => s + (c.orderCount || c.orders.length || 0), 0);
  r.totalAmount = round2(r.customers.reduce((s, c) => s + (Number(c.totalAmount) || 0), 0));
  r.totalWeightKg = round2(r.customers.reduce((s, c) => s + (Number(c.totalDeadWeight) || 0), 0));
  r.totalVolWeightKg = round2(r.customers.reduce((s, c) => s + (Number(c.totalVolWeight) || 0), 0));
  r.vehicleUtilized = r.vehicleCapacity > 0 ? round2((r.totalVolWeightKg / r.vehicleCapacity) * 100) : 0;
  r.deliveryCostPercentage = r.totalAmount > 0 ? round2((r.vehicleCost / r.totalAmount) * 100) : 0;
  const allOrders = r.customers.flatMap((c) => c.orders || []);
  const N = allOrders.length;
  r.digitalOrderPercentage = N ? round0((allOrders.filter((o) => o.orderType === 'Digital').length / N) * 100) : 0;
  r.saleOrderPercentage = N ? round0((allOrders.filter((o) => o.orderType === 'Sales').length / N) * 100) : 0;
  const inRoute: Record<string, number> = {};
  r.customers.forEach((c) => {
    const b = c.beatName || 'No Beat';
    inRoute[b] = (inRoute[b] || 0) + 1;
  });
  const beats: RouteBeat[] = Object.entries(inRoute)
    .map(([name, n]) => {
      const total = F[name] || n;
      return { name, inRoute: n, total, coherencePct: round0((n / total) * 100) };
    })
    .sort((a, b) => b.inRoute - a.inRoute);
  r.beats = beats;
  if (beats.length) r.beatCoherenceScore = round0(beats.reduce((s, b) => s + b.coherencePct, 0) / beats.length);
  const split = beats.filter((b) => b.coherencePct < 100);
  r.beatCoherenceReason = split.length
    ? `${split.length} of ${beats.length} sales beat${beats.length > 1 ? 's' : ''} are split across routes. ` +
      split.map((b) => `${b.name} has ${b.inRoute} of its ${b.total} delivery points in this route (${b.total - b.inRoute} assigned to other routes due to vehicle capacity or distance constraints)`).join('. ') +
      '. Beats are split when a single vehicle cannot serve all customers in a territory due to weight capacity limits or maximum stop constraints.'
    : undefined;
  const pts = r.customers.filter((c) => c.lat != null && c.long != null);
  if (pts.length && depot.lat !== 0 && depot.long !== 0) {
    const mLat = pts.reduce((s, c) => s + Number(c.lat), 0) / pts.length;
    const mLng = pts.reduce((s, c) => s + Number(c.long), 0) / pts.length;
    const angle = bearingDeg(depot, mLat, mLng);
    r.routeDirection = DIRECTIONS[Math.round(((angle + 360) % 360) / 45) % 8];
    const km = haversineKm(depot.lat, depot.long, mLat, mLng).toFixed(1);
    const full = beats.filter((b) => b.coherencePct === 100).length;
    r.routeExplanation = `Serves ${r.routeDirection} sector, ${km}km from depot. ${full}/${beats.length} beats fully contained. Vehicle ${r.vehicleUtilized}% utilized (${Math.round(r.totalWeightKg)}/${r.vehicleCapacity} kg).`;
  }
}

/** Applies sequence numbers, distance and travel time to a route from a nearest-neighbour tour. */
export function sequenceRoute(r: OptimizedRoute, depot: Depot, serviceTimeMinutes: number) {
  const { ordered, distanceKm } = sequenceCustomers(depot, r.customers);
  r.customers = ordered;
  r.customers.forEach((c, i) => {
    c.seq = String(i + 1);
    c.orders.forEach((o) => (o.seq = String(i + 1)));
  });
  r.distanceKm = round2(distanceKm);
  const secs = r.customers.length ? travelSeconds(distanceKm, r.customers.length, serviceTimeMinutes) : 0;
  r.estimatedTimeHours = +(secs / 3600).toFixed(2);
  r.estimatedTimeFormatted = formatDuration(secs);
}

interface VehicleSlot {
  vehicle: DbVehicle | null;
  vehicleType: string;
  vehicleCapacity: number;
  base: number;
  perKm: number;
}

function ownSlot(v: DbVehicle): VehicleSlot {
  return { vehicle: v, vehicleType: ownVehicleLabel(v), vehicleCapacity: Number(v.volumetricCapacityKg) || Number(v.weightCapacityKg) || 0, base: OWN_VEHICLE_COST.base, perKm: OWN_VEHICLE_COST.perKm };
}
function hiredSlotFor(load: number): VehicleSlot {
  const h = HIRED_VEHICLES.find((x) => x.vehicleCapacity >= load) || HIRED_VEHICLES[HIRED_VEHICLES.length - 1];
  return { vehicle: null, vehicleType: h.vehicleType, vehicleCapacity: h.vehicleCapacity, base: h.base, perKm: h.perKm };
}

export function emptyRoute(slot: VehicleSlot, deliveryDate: string): OptimizedRoute {
  return {
    routeId: '', routeName: '', vehicleType: slot.vehicleType, vehicleCapacity: slot.vehicleCapacity, vehicleCost: 0,
    vehicleId: slot.vehicle?.id ?? null, vehicleRegNumber: slot.vehicle?.registrationNumber ?? null,
    relationshipType: slot.vehicle ? slot.vehicle.relationshipType || 'preferred' : null,
    customerCount: 0, orderCount: 0, distanceKm: 0, estimatedTimeHours: 0, estimatedTimeFormatted: '0m', totalAmount: 0,
    totalWeightKg: 0, totalVolWeightKg: 0, vehicleUtilized: 0, deliveryCostPercentage: 0, digitalOrderPercentage: 0,
    saleOrderPercentage: 0, expectedDeliveryDate: deliveryDate, beats: [], customers: [],
  };
}

export interface PlanOptions {
  deliveryDate: string;
  logisticsMode: string;
  depot: Depot;
  engine: string;
  maxStops: number;
  maxDistanceKm: number;
  maxTravelTimeMinutes: number;
  serviceTimeMinutes: number;
}

/** Is a beat assigned to a cluster (either via beat.clusterId or a cluster's beatIds)? Returns the cluster name. */
export function clusterOfBeat(d: MockDatabase, beatId: string | null, beatName: string | null): { id: string; name: string; vehicleIds: string[] } | null {
  const beat = d.beats.find((b) => (beatId && b.id === beatId) || (!!beatName && b.name === beatName));
  if (!beat) return null;
  const clusters = (d.clusters || []) as { id: string; name: string; beatIds?: string[]; vehicleIds?: string[] }[];
  const c = clusters.find((x) => (beat.clusterId && x.id === beat.clusterId) || (x.beatIds || []).includes(beat.id));
  return c ? { id: c.id, name: c.name, vehicleIds: c.vehicleIds || [] } : null;
}

/**
 * Synthetic route optimiser for POST /route_planning.
 *  - route_optimize: angular sweep around the depot, packing by capacity / max stops / max distance / max time
 *  - beat_optimized: keeps each beat on one vehicle where possible (adjacent beats share a vehicle if they fit)
 *  - cluster_beat_optimized: one group per cluster (cluster vehicles first); beats without a cluster → "Unassigned Route N"
 * Self mode uses the buyer's active own vehicles first (→ "Planned" combos), then hired 3PL vehicles (→ "Overflow").
 */
export function planRoutes(d: MockDatabase, orders: DbOrder[], opt: PlanOptions): OptimizedRoute[] {
  const customers = customersFromOrders(orders);
  const depot = opt.depot;
  const angle = (c: RouteCustomer) => (hasCoords(c) ? (bearingDeg(depot, c.lat as number, c.long as number) + 360) % 360 : 999);
  const byAngle = (a: RouteCustomer, b: RouteCustomer) => angle(a) - angle(b);

  // groups of customers that the packer keeps together
  type Group = { key: string; customers: RouteCustomer[]; cluster?: { id: string; name: string; vehicleIds: string[] } | null; unassigned?: boolean };
  let groups: Group[] = [];
  if (opt.engine === 'beat_optimized' || opt.engine === 'cluster_beat_optimized') {
    const m = new Map<string, Group>();
    customers.forEach((c) => {
      const o = orders.find((x) => x.customerId === c.customerId);
      let key = c.beatName || 'No Beat';
      let cluster: Group['cluster'] = null;
      let unassigned = false;
      if (opt.engine === 'cluster_beat_optimized') {
        cluster = clusterOfBeat(d, o?.beatId ?? null, c.beatName);
        key = cluster ? `cluster:${cluster.id}` : '__unassigned__';
        unassigned = !cluster;
      }
      if (!m.has(key)) m.set(key, { key, customers: [], cluster, unassigned });
      m.get(key)!.customers.push(c);
    });
    groups = Array.from(m.values());
    groups.forEach((g) => g.customers.sort(byAngle));
    const centroidAngle = (g: Group) => g.customers.reduce((s, c) => s + Math.min(angle(c), 360), 0) / g.customers.length;
    groups.sort((a, b) => (a.unassigned ? 1 : 0) - (b.unassigned ? 1 : 0) || centroidAngle(a) - centroidAngle(b));
  } else {
    groups = [{ key: 'all', customers: [...customers].sort(byAngle) }];
  }

  const selfMode = opt.logisticsMode !== '3pl';
  const ownQueue: DbVehicle[] = selfMode ? d.vehicles.filter((v) => v.status === 'active').sort((a, b) => Number(b.volumetricCapacityKg) - Number(a.volumetricCapacityKg)) : [];
  const usedOwn = new Set<string>();
  const takeOwn = (preferIds?: string[]): DbVehicle | null => {
    if (!selfMode) return null;
    const pref = (preferIds || []).map((id) => ownQueue.find((v) => v.id === id && !usedOwn.has(v.id))).find(Boolean);
    const v = pref || ownQueue.find((x) => !usedOwn.has(x.id)) || null;
    if (v) usedOwn.add(v.id);
    return v;
  };

  const fits = (set: RouteCustomer[], cap: number) => {
    if (set.length > opt.maxStops) return false;
    const load = set.reduce((s, c) => s + c.totalVolWeight, 0);
    if (load > cap) return false;
    const { distanceKm } = sequenceCustomers(depot, set);
    if (distanceKm > opt.maxDistanceKm && set.length > 1) return false;
    if (travelSeconds(distanceKm, set.length, opt.serviceTimeMinutes) > opt.maxTravelTimeMinutes * 60 && set.length > 1) return false;
    return true;
  };

  const built: { slot: VehicleSlot; customers: RouteCustomer[]; clusterName: string | null; unassigned: boolean }[] = [];
  const packGroup = (g: Group, carry: { slot: VehicleSlot; customers: RouteCustomer[] } | null, keepOpen: boolean) => {
    let cur = carry;
    const newSlot = (): VehicleSlot => {
      const own = takeOwn(g.cluster?.vehicleIds);
      return own ? ownSlot(own) : { ...hiredSlotFor(HIRED_VEHICLES[1].vehicleCapacity), vehicleCapacity: HIRED_VEHICLES[HIRED_VEHICLES.length - 1].vehicleCapacity };
    };
    for (const c of g.customers) {
      if (!cur) cur = { slot: newSlot(), customers: [] };
      if (cur.customers.length && !fits([...cur.customers, c], cur.slot.vehicleCapacity)) {
        built.push({ ...cur, clusterName: g.cluster?.name ?? null, unassigned: !!g.unassigned });
        cur = { slot: newSlot(), customers: [] };
      }
      cur.customers.push(c);
    }
    if (cur && !keepOpen) {
      built.push({ ...cur, clusterName: g.cluster?.name ?? null, unassigned: !!g.unassigned });
      return null;
    }
    return cur;
  };

  if (opt.engine === 'beat_optimized') {
    // keep beats whole; let the next beat ride along only if the whole beat fits in the open vehicle
    let open: { slot: VehicleSlot; customers: RouteCustomer[] } | null = null;
    groups.forEach((g) => {
      if (open && fits([...open.customers, ...g.customers], open.slot.vehicleCapacity)) {
        open.customers.push(...g.customers);
        return;
      }
      if (open) built.push({ ...open, clusterName: null, unassigned: false });
      open = packGroup(g, null, true);
    });
    if (open) built.push({ ...(open as { slot: VehicleSlot; customers: RouteCustomer[] }), clusterName: null, unassigned: false });
  } else {
    groups.forEach((g) => packGroup(g, null, false));
  }

  // right-size own vehicles: heaviest routes first, each gets the smallest free own vehicle that fits
  // (cluster vehicles preferred for cluster routes); routes no own vehicle fits fall back to a hired class.
  const finalSlots = new Map<number, VehicleSlot>();
  const loadOf = (b: { customers: RouteCustomer[] }) => b.customers.reduce((s, c) => s + c.totalVolWeight, 0);
  const takenOwn = new Set<string>();
  built
    .map((b, i) => ({ b, i, load: loadOf(b) }))
    .filter((x) => x.b.slot.vehicle && x.b.customers.length)
    .sort((a, b) => b.load - a.load)
    .forEach(({ b, i, load }) => {
      const prefer = new Set(groups.find((g) => g.cluster?.name && g.cluster.name === b.clusterName)?.cluster?.vehicleIds || []);
      const cand = ownQueue
        .filter((v) => !takenOwn.has(v.id) && (Number(v.volumetricCapacityKg) || 0) >= load)
        .sort((x, y) => (prefer.has(y.id) ? 1 : 0) - (prefer.has(x.id) ? 1 : 0) || Number(x.volumetricCapacityKg) - Number(y.volumetricCapacityKg))[0];
      if (cand) takenOwn.add(cand.id);
      finalSlots.set(i, cand ? ownSlot(cand) : hiredSlotFor(load));
    });

  // finalise: pick the right hired class for the actual load, sequence, cost, metrics
  const routes: OptimizedRoute[] = built.map((b, i) => ({ b, i })).filter(({ b }) => b.customers.length).map(({ b, i }) => {
    const load = loadOf(b);
    const slot = finalSlots.get(i) || hiredSlotFor(load);
    const r = emptyRoute(slot, opt.deliveryDate);
    r.customers = b.customers.map((c) => ({ ...c, orders: c.orders.map((o) => ({ ...o })) }));
    r.clusterName = b.clusterName;
    sequenceRoute(r, depot, opt.serviceTimeMinutes);
    r.vehicleCost = Math.round(slot.base + slot.perKm * r.distanceKm);
    (r as any).__unassigned = b.unassigned;
    return r;
  });

  let n = 0;
  let u = 0;
  routes.forEach((r) => {
    n += 1;
    r.routeId = `R${n}`;
    if ((r as any).__unassigned) {
      u += 1;
      r.routeName = `Unassigned Route ${u}`;
    } else r.routeName = `Route ${n}`;
    delete (r as any).__unassigned;
  });
  const F = globalBeatCounts(routes);
  routes.forEach((r) => computeRouteMetrics(r, F, depot));
  return routes;
}

export function depotOf(a: DbAddress | undefined | null): Depot {
  return { lat: parseFloat(a?.latitude || '0') || 0, long: parseFloat(a?.longitude || '0') || 0 };
}

export function routePlanningConfig(d: MockDatabase) {
  const cfg = d.buyerSettings?.buyer_config?.routePlanningConfig || {};
  return {
    maxStops: Number(cfg.maxStops) || 35,
    maxDistanceKm: Number(cfg.maxDistanceKm) || 40,
    maxTravelTimeMinutes: Number(cfg.maxTravelTimeMinutes) || 510,
    serviceTimeMinutes: Number(cfg.serviceTimeMinutes) || 12,
    engine: (cfg.routeEngine?.selectedEngine as string) || 'route_optimize',
    logisticsMode: (cfg.logisticsMode as string) || 'self',
  };
}

const pad = (n: number) => String(n).padStart(2, '0');
export function displayRouteId(d: MockDatabase, createdIso: string): string {
  d.ext.routePlanSeq = (Number(d.ext.routePlanSeq) || 0) + 1;
  const c = new Date(createdIso);
  return `RT-${pad(c.getMonth() + 1)}${pad(c.getDate())}-${String(d.ext.routePlanSeq).padStart(4, '0')}`;
}
export const localYmd = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

// ---------------------------------------------------------------- seed
const RETAIL_HOURS = [6, 7, 8, 9, 10, 11, 12, 13];

function makeExtraOrder(db: MockDatabase, rng: Rng, customer: DbCustomer, src: DbOrder): DbOrder {
  const products = db.products;
  const chosen = new Set<number>();
  const count = rng.int(1, 4);
  while (chosen.size < count) chosen.add(rng.int(0, products.length - 1));
  const items: DbOrderItem[] = Array.from(chosen).map((pi) => {
    const p = products[pi];
    const qty = p.weightKg >= 10 ? rng.int(1, 4) : rng.int(4, 40);
    return {
      itemId: rng.uuid(), productId: p.id, itemName: p.name, quantity: qty, mrp: p.mrp, sellingPrice: p.sellingPrice,
      totalAmount: round2(qty * p.sellingPrice), weightKg: p.weightKg, upc: p.upc, gstPercentage: p.gstPercentage, hsnCode: p.hsnCode,
      imageUrl: p.imageUrl, uom: p.uom, packageType: p.packageType, deliveredQuantity: 0, returnedQuantity: 0,
    };
  });
  const amount = round2(items.reduce((s, it) => s + it.totalAmount, 0));
  const weight = round2(items.reduce((s, it) => s + it.weightKg * it.quantity, 0));
  const beat = db.beats.find((b) => b.id === customer.beatId);
  const isSales = rng.bool(0.3);
  const created = new Date(src.createdAt);
  created.setHours(RETAIL_HOURS[rng.int(0, RETAIL_HOURS.length - 1)], rng.int(0, 59), 0, 0);
  const od = src.orderDate.slice(0, 10);
  const [y, m, dd] = od.split('-');
  const ref = isSales
    ? `INV/26-27/${String(rng.int(1000, 9999)).padStart(6, '0')}`
    : `QWI-ONDC-${dd}${m}${y.slice(2)}-${rng.letters(1)}${rng.digits(1)}${rng.letters(3)}${rng.digits(1)}`;
  return {
    ...src,
    orderId: rng.uuid(), refOrderId: ref, customerId: customer.id, customerName: customer.customer_name, customerBusinessName: customer.business_name,
    customerMobileNumber: customer.mobile_number,
    address: { line: customer.address.split(', ').slice(1, -1).join(', ') || customer.address, locality: customer.locality, city: 'Hyderabad', state: 'Telangana', country: 'INDIA', pincode: customer.pincode },
    lat: Number(customer.latitude), lng: Number(customer.longitude), amount, orderWeight: weight, volumetricWeight: round2(weight * (1 + rng.next() * 0.15)),
    orderType: isSales ? 'Sales' : rng.bool(0.15) ? null : 'Digital',
    salesPersonName: isSales || rng.bool(0.4) ? rng.pick(db.salesPersons).name : null,
    salesBeatName: beat?.name ?? null, beatId: beat?.id ?? null, createdAt: created.toISOString(),
    orderStatusId: 2, validationErrors: [], isDeliveryAddressUpdated: false, tripId: null, tripHistory: [], items,
    rtoReasonId: null, returnReason: null, routePlanComboId: null, statusBeforeOffline: null, source: 'connector',
  };
}

interface SeedSpec {
  beatIdxs: number[];
  customers: number;
  status: string;
  vehicleReg: string | null;
  createdOffsetMin: number;
  expiryOffsetSec: number | null;
  sla: string;
  request: 'A' | 'B';
  outcome?: { kind: 'trip' | 'fail'; offsetSec: number };
}

const SEED_SPECS: SeedSpec[] = [
  // Overflow
  { beatIdxs: [3], customers: 4, status: 'CREATED', vehicleReg: null, createdOffsetMin: -6, expiryOffsetSec: 40 * 60, sla: 'NEXT_DAY', request: 'A' },
  { beatIdxs: [6], customers: 3, status: 'QUOTATION_REQUESTED', vehicleReg: null, createdOffsetMin: -22, expiryOffsetSec: 25 * 60, sla: 'NEXT_DAY', request: 'B' },
  { beatIdxs: [0], customers: 2, status: 'CREATED', vehicleReg: null, createdOffsetMin: -14, expiryOffsetSec: 80, sla: 'SAME_DAY', request: 'B' },
  // Planned (own vehicles)
  { beatIdxs: [4, 5], customers: 5, status: 'CREATED', vehicleReg: 'TS07UB1180', createdOffsetMin: -6, expiryOffsetSec: 50 * 60, sla: 'NEXT_DAY', request: 'A' },
  { beatIdxs: [2], customers: 3, status: 'AUTO_CONFIRMING', vehicleReg: 'TS10FA7731', createdOffsetMin: -6, expiryOffsetSec: 12 * 60, sla: 'NEXT_DAY', request: 'A', outcome: { kind: 'trip', offsetSec: 100 } },
  { beatIdxs: [7], customers: 3, status: 'QUOTATION_REQUESTED', vehicleReg: 'TS11UA4821', createdOffsetMin: -22, expiryOffsetSec: null, sla: 'DAY_AFTER_NEXT_DAY', request: 'B', outcome: { kind: 'fail', offsetSec: 50 } },
  { beatIdxs: [1], customers: 2, status: 'CONFIRMATION_IN_PROGRESS', vehicleReg: 'TS09EA4521', createdOffsetMin: -22, expiryOffsetSec: -60, sla: 'NEXT_DAY', request: 'B' },
];

export const seed = (db: MockDatabase, rng: Rng) => {
  const plans: RoutePlanCombo[] = [];
  db.ext.routePlanSeq = 0;
  const depotAddr = db.addresses.find((a) => a.is_default) || db.addresses[0];
  const depot = depotOf(depotAddr);
  const cfg = routePlanningConfig(db);
  const core = db.orders.filter((o) => o.orderStatusId === 2);
  const template = core[0] || db.orders[0];
  if (!template) {
    db.ext.routePlans = plans;
    return;
  }
  const usedCore = new Set<string>();
  const requestIds = { A: rng.uuid(), B: rng.uuid() };
  const extra: DbOrder[] = [];
  const now = Date.now();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  SEED_SPECS.forEach((spec, idx) => {
    // pick customers from the spec's beats; reuse matching core status-2 orders first, then synthesise more
    const pool = db.customers.filter((c) => spec.beatIdxs.some((bi) => db.beats[bi] && c.beatId === db.beats[bi].id));
    const chosenCustomers = pool.slice(0, spec.customers);
    const comboOrders: DbOrder[] = [];
    chosenCustomers.forEach((c, ci) => {
      const coreOrder = core.find((o) => o.customerId === c.id && !usedCore.has(o.orderId));
      if (coreOrder) {
        usedCore.add(coreOrder.orderId);
        comboOrders.push(coreOrder);
      } else {
        const o = makeExtraOrder(db, rng, c, template);
        extra.push(o);
        comboOrders.push(o);
      }
      if (ci === 0 && rng.bool(0.5)) {
        const o2 = makeExtraOrder(db, rng, c, template);
        extra.push(o2);
        comboOrders.push(o2);
      }
    });
    if (!comboOrders.length) return;
    const vehicle = spec.vehicleReg ? db.vehicles.find((v) => v.registrationNumber === spec.vehicleReg) || null : null;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (spec.sla === 'SAME_DAY' ? 0 : spec.sla === 'NEXT_DAY' ? 1 : 2));
    const routes = planRoutes(db, comboOrders, {
      deliveryDate: localYmd(deliveryDate), logisticsMode: '3pl', depot, engine: 'route_optimize',
      maxStops: 999, maxDistanceKm: 9999, maxTravelTimeMinutes: 99999, serviceTimeMinutes: cfg.serviceTimeMinutes,
    });
    const route = routes[0];
    route.routeId = `R${idx + 1}`;
    route.routeName = `Route ${idx + 1}`;
    if (vehicle) {
      route.vehicleId = vehicle.id;
      route.vehicleRegNumber = vehicle.registrationNumber;
      route.vehicleType = ownVehicleLabel(vehicle);
      route.vehicleCapacity = Number(vehicle.volumetricCapacityKg);
      route.relationshipType = vehicle.relationshipType || 'preferred';
      route.vehicleCost = Math.round(OWN_VEHICLE_COST.base + OWN_VEHICLE_COST.perKm * route.distanceKm);
    }
    computeRouteMetrics(route, globalBeatCounts([route]), depot);
    const createdIso = new Date(now + spec.createdOffsetMin * 60000).toISOString();
    const comboId = rng.uuid();
    comboOrders.forEach((o) => {
      o.orderStatusId = 2;
      o.routePlanComboId = comboId;
      o.deliveryDate = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate()).toISOString();
    });
    plans.push({
      routePlanComboId: comboId,
      routePlanRequestId: requestIds[spec.request],
      routeId: displayRouteId(db, createdIso),
      logisticsOrderRowId: `LOR-${rng.digits(5)}`,
      buyerId: db.buyer.id,
      buyerAddressId: depotAddr?.id || '',
      createdDate: createdIso,
      sla: spec.sla,
      deliveryDate: localYmd(deliveryDate),
      routePlanRequestStatus: 'IN_PROGRESS',
      routePlanComboStatus: spec.status,
      relationshipType: route.relationshipType,
      vehicleId: route.vehicleId,
      routePlanComboExpireTime: null,
      routePlanRequestExpireTime: null,
      orderIds: comboOrders.map((o) => o.orderId),
      route,
      quotes: [],
      isQuick: false,
      outcome: null,
      pendingAnchor: {
        createdOffsetMs: spec.createdOffsetMin * 60000,
        expiryOffsetMs: spec.expiryOffsetSec === null ? null : spec.expiryOffsetSec * 1000,
        outcome: spec.outcome ? { kind: spec.outcome.kind, offsetMs: spec.outcome.offsetSec * 1000 } : undefined,
      },
    });
  });

  // core status-2 orders not used by a seeded combo are put into one more overflow combo (keeps data consistent)
  const leftovers = core.filter((o) => !usedCore.has(o.orderId));
  if (leftovers.length) {
    const routes = planRoutes(db, leftovers, {
      deliveryDate: localYmd(tomorrow), logisticsMode: '3pl', depot, engine: 'route_optimize',
      maxStops: 999, maxDistanceKm: 9999, maxTravelTimeMinutes: 99999, serviceTimeMinutes: cfg.serviceTimeMinutes,
    });
    const route = routes[0];
    route.routeId = `R${plans.length + 1}`;
    route.routeName = `Route ${plans.length + 1}`;
    const createdIso = new Date(now - 6 * 60000).toISOString();
    const comboId = rng.uuid();
    leftovers.forEach((o) => {
      o.routePlanComboId = comboId;
      o.deliveryDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()).toISOString();
    });
    plans.push({
      routePlanComboId: comboId, routePlanRequestId: requestIds.A, routeId: displayRouteId(db, createdIso), logisticsOrderRowId: `LOR-${rng.digits(5)}`,
      buyerId: db.buyer.id, buyerAddressId: depotAddr?.id || '', createdDate: createdIso, sla: 'NEXT_DAY', deliveryDate: localYmd(tomorrow),
      routePlanRequestStatus: 'IN_PROGRESS', routePlanComboStatus: 'CREATED', relationshipType: null, vehicleId: null,
      routePlanComboExpireTime: null, routePlanRequestExpireTime: null, orderIds: leftovers.map((o) => o.orderId), route, quotes: [],
      isQuick: false, outcome: null, pendingAnchor: { createdOffsetMs: -6 * 60000, expiryOffsetMs: 35 * 60000 },
    });
  }

  db.orders.push(...extra);
  db.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  db.ext.routePlans = plans;
};
