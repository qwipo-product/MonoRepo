// KPI maths for the DigiDukaan · Buyer dashboards. Everything aggregates the
// one order ledger in buyer.ts, so a number on a card, in a chart and in a
// drill-down dashboard always agree for the same scope.
import {
  FIRST_DAY, TODAY, bas, customerStatus, distributorsIn, launch, ordersByCustomer,
  scopedCustomers, scopedOrders,
  type BA, type BuyerCustomer, type BuyerDistributor, type BuyerOrder, type BuyerScope, type CustomerStatus,
} from './buyer';

const DAY = 86400000;
export const PACE_OK = 90;
export const PACE_LOW = 70;

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const rangeDays = (s: BuyerScope) => Math.round((dayStart(s.to).getTime() - dayStart(s.from).getTime()) / DAY) + 1;
export const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** The equal-length period just before the range — null when the ledger doesn't reach back that far. */
export function previousScope(s: BuyerScope): BuyerScope | null {
  const n = rangeDays(s);
  const from = addDays(s.from, -n);
  if (from < FIRST_DAY) return null;
  return { ...s, preset: 'Custom', from, to: addDays(s.from, -1) };
}

/* --------------------------------- summary -------------------------------- */

export interface Summary {
  orders: number; value: number; aov: number;
  beat: number; beatShare: number;
  active: number; transit: number; delivered: number; cancelled: number; cancelRate: number;
  cBA: number; cDist: number; cRet: number;
  customers: number;
}

export function summarize(orders: BuyerOrder[]): Summary {
  let value = 0, beat = 0, active = 0, transit = 0, delivered = 0, cancelled = 0, cBA = 0, cDist = 0, cRet = 0;
  const custs = new Set<string>();
  for (const o of orders) {
    value += o.value;
    if (o.beat) beat++;
    if (o.status === 'Active') active++;
    else if (o.status === 'In Transit') transit++;
    else if (o.status === 'Delivered') delivered++;
    else cancelled++;
    if (o.cancelledBy === 'BA') cBA++;
    else if (o.cancelledBy === 'Distributor') cDist++;
    else if (o.cancelledBy === 'Retailer') cRet++;
    custs.add(o.customerId);
  }
  const n = orders.length;
  return {
    orders: n, value, aov: n ? value / n : 0,
    beat, beatShare: n ? (beat / n) * 100 : 0,
    active, transit, delivered, cancelled, cancelRate: n ? (cancelled / n) * 100 : 0,
    cBA, cDist, cRet, customers: custs.size,
  };
}

/* ------------------------------ time buckets ------------------------------ */

export interface Bucket { label: string; title: string; from: Date; to: Date; beat: number; nonBeat: number; orders: number }

/** One range → bars: hourly for a single day, weekly past 45 days, daily otherwise. */
export function buckets(orders: BuyerOrder[], s: BuyerScope): Bucket[] {
  const days = rangeDays(s);
  const start = dayStart(s.from);
  const fill = (b: Bucket[], idx: (o: BuyerOrder) => number) => {
    for (const o of orders) {
      const i = idx(o);
      if (i < 0 || i >= b.length) continue;
      b[i].orders++;
      if (o.beat) b[i].beat += o.value; else b[i].nonBeat += o.value;
    }
    return b;
  };
  const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`;
  if (days === 1) {
    const hours = Array.from({ length: 11 }, (_, i) => 8 + i);
    return fill(hours.map((h) => ({
      label: `${h > 12 ? h - 12 : h}${h >= 12 ? 'p' : 'a'}`, title: `${fmt(start)} · ${h}:00 – ${h + 1}:00`,
      from: new Date(start.getTime() + h * 3600000), to: new Date(start.getTime() + (h + 1) * 3600000),
      beat: 0, nonBeat: 0, orders: 0,
    })), (o) => o.at.getHours() - 8);
  }
  const step = days > 45 ? 7 : 1;
  const n = Math.ceil(days / step);
  return fill(Array.from({ length: n }, (_, i) => {
    const from = addDays(start, i * step);
    const last = addDays(start, Math.min(days, (i + 1) * step) - 1);
    return {
      label: fmt(from), title: step === 1 ? fmt(from) : `${fmt(from)} – ${fmt(last)}`,
      from, to: addDays(last, 1), beat: 0, nonBeat: 0, orders: 0,
    };
  }), (o) => Math.floor((dayStart(o.at).getTime() - start.getTime()) / DAY / step));
}

/* ------------------------------- distributors ------------------------------ */

export interface DistStat {
  d: BuyerDistributor; name: string;
  s: Summary; prev: Summary | null;
  /** value growth vs the previous period, % — null when there is nothing to compare */
  growth: number | null;
  last?: Date; active: boolean;
  /** latest order up to the range end, however long ago — for "gone quiet" */
  lastEver?: Date;
  /** outlets mapped to this distributor in scope */
  mapped: number;
}

export function distributorStats(scope: BuyerScope): DistStat[] {
  const orders = scopedOrders(scope);
  const p = previousScope(scope);
  const prevOrders = p ? scopedOrders(p) : null;
  const customers = scopedCustomers(scope);
  const lastEver = new Map<string, Date>();
  for (const o of scopedOrders({ ...scope, from: FIRST_DAY })) lastEver.set(o.distributor, o.at);
  return distributorsIn(scope)
    .filter((d) => scope.distributor === 'All' || d.name === scope.distributor)
    // A team only sees the distributors its outlets are mapped to or order from.
    .filter((d) => scope.team === 'All' || lastEver.has(d.name) || customers.some((c) => c.distributor === d.name))
    .map((d) => {
      const mine = orders.filter((o) => o.distributor === d.name);
      const s = summarize(mine);
      const prev = prevOrders ? summarize(prevOrders.filter((o) => o.distributor === d.name)) : null;
      return {
        d, name: d.name, s, prev,
        growth: prev && prev.value ? ((s.value - prev.value) / prev.value) * 100 : null,
        last: mine.length ? mine[mine.length - 1].at : undefined,
        active: mine.length > 0,
        lastEver: lastEver.get(d.name),
        mapped: customers.filter((c) => c.distributor === d.name).length,
      };
    });
}

/* ----------------------------------- BAs ----------------------------------- */

export interface BaStat {
  ba: BA; name: string; lead: string; city: string; state: string;
  customers: number; ordering: number; coverage: number;
  s: Summary; prevValue: number | null; target: number; achievement: number;
  today: number; todayValue: number;
  newCustomers: number; kycPending: number; dormant: number; never: number; activeCustomers: number;
  /** share of the BA's customers that ordered in the last 30 days */
  retention: number;
  last?: Date;
}

/** What is due for the range: the monthly target spread over each day's own month (from the state's launch at the earliest). */
export const rangeTarget = (ba: BA, s: BuyerScope) => {
  let due = 0;
  for (let t = Math.max(dayStart(s.from).getTime(), launch[ba.state].getTime()); t <= s.to.getTime(); t += DAY) {
    const d = new Date(t);
    due += ba.target / new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }
  return due;
};

export function baStats(scope: BuyerScope): BaStat[] {
  const orders = scopedOrders(scope);
  const p = previousScope(scope);
  const prevOrders = p ? scopedOrders(p) : null;
  const customers = scopedCustomers(scope);
  const inScope = new Set(customers.map((c) => c.ba));
  const start = dayStart(scope.from);
  const todayAll = scopedOrders({ ...scope, from: TODAY, to: TODAY });
  return bas.filter((b) => inScope.has(b.name)).map((ba) => {
    const mine = orders.filter((o) => o.ba === ba.name);
    const custs = customers.filter((c) => c.ba === ba.name && c.onboarded <= scope.to);
    const s = summarize(mine);
    const target = rangeTarget(ba, scope);
    const todays = todayAll.filter((o) => o.ba === ba.name);
    const statuses = custs.map((c) => customerStatus(c, scope.to).status);
    const activeCustomers = statuses.filter((x) => x === 'Active').length;
    return {
      ba, name: ba.name, lead: ba.lead, city: ba.city, state: ba.state,
      customers: custs.length, ordering: s.customers, coverage: custs.length ? (s.customers / custs.length) * 100 : 0,
      s, prevValue: prevOrders ? prevOrders.filter((o) => o.ba === ba.name).reduce((a, o) => a + o.value, 0) : null,
      target, achievement: target ? (s.value / target) * 100 : 0,
      today: todays.length, todayValue: todays.reduce((a, o) => a + o.value, 0),
      newCustomers: custs.filter((c) => c.onboarded >= start).length,
      kycPending: custs.filter((c) => c.kyc === 'Pending').length,
      dormant: statuses.filter((x) => x === 'Dormant').length,
      never: statuses.filter((x) => x === 'Never ordered').length,
      activeCustomers,
      retention: custs.length ? (activeCustomers / custs.length) * 100 : 0,
      last: mine.length ? mine[mine.length - 1].at : undefined,
    };
  });
}

/* -------------------------------- customers -------------------------------- */

export interface CustStat {
  c: BuyerCustomer; id: string; name: string;
  status: CustomerStatus; last?: Date;
  /** in range */
  orders: number; value: number;
  /** every order up to the range end */
  lifetime: number;
  isNew: boolean;
}

/** Customers onboarded by the range end, with in-range and lifetime order counts. */
export function customerStats(scope: BuyerScope): CustStat[] {
  const agg = new Map<string, { n: number; v: number }>();
  for (const o of scopedOrders(scope)) {
    const a = agg.get(o.customerId) ?? { n: 0, v: 0 };
    a.n++; a.v += o.value;
    agg.set(o.customerId, a);
  }
  const start = dayStart(scope.from);
  const end = addDays(scope.to, 1);
  return scopedCustomers(scope).filter((c) => c.onboarded <= scope.to).map((c) => {
    const st = customerStatus(c, scope.to);
    const a = agg.get(c.id);
    return {
      c, id: c.id, name: c.name, status: st.status, last: st.last,
      orders: a?.n ?? 0, value: a?.v ?? 0,
      lifetime: (ordersByCustomer.get(c.id) ?? []).filter((o) => o.at < end).length,
      isNew: c.onboarded >= start,
    };
  });
}

/* ------------------------- the numbers a sales team chases ------------------------- */

const MONTH_START = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
const DAYS_IN_MONTH = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate();
/** Monday of the current week. */
const WEEK_START = addDays(TODAY, -((TODAY.getDay() + 6) % 7));

export interface Pulse { key: 'today' | 'week' | 'month'; label: string; sub: string; from: Date; s: Summary; newShops: number }

/** Today / This week / This month — fixed periods, whatever the date filter says; geography, seller and team still apply. */
export function pulse(scope: BuyerScope, onlyBa?: string): Pulse[] {
  const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`;
  const periods: [Pulse['key'], string, Date][] = [
    ['today', 'Today', TODAY], ['week', 'This week', WEEK_START], ['month', 'This month', MONTH_START],
  ];
  const customers = scopedCustomers(scope).filter((c) => !onlyBa || c.ba === onlyBa);
  return periods.map(([key, label, from]) => ({
    key, label, from,
    sub: key === 'today' ? fmt(TODAY) : `${fmt(from)} – ${fmt(TODAY)}`,
    s: summarize(scopedOrders({ ...scope, preset: 'Custom', from, to: TODAY }).filter((o) => !onlyBa || o.ba === onlyBa)),
    newShops: customers.filter((c) => c.onboarded >= from && c.onboarded <= TODAY).length,
  }));
}

export interface MonthPlan {
  month: string; target: number; achieved: number; pct: number;
  /** where the team should be by today if the month were evenly paced */
  expected: number;
  toGo: number; daysGone: number; daysLeft: number;
  /** ₹ per day so far, and ₹ per day needed for the rest of the month */
  perDay: number; needPerDay: number;
}

/** This month's target for the salespersons in scope, against sales so far. */
export function monthPlan(scope: BuyerScope, onlyBa?: string): MonthPlan {
  const inScope = new Set(scopedCustomers(scope).map((c) => c.ba));
  const people = bas.filter((b) => (onlyBa ? b.name === onlyBa : inScope.has(b.name)));
  const target = people.reduce((a, b) => a + b.target, 0);
  const names = new Set(people.map((b) => b.name));
  const achieved = scopedOrders({ ...scope, preset: 'Custom', from: MONTH_START, to: TODAY })
    .filter((o) => names.has(o.ba)).reduce((a, o) => a + o.value, 0);
  const daysGone = TODAY.getDate();
  const daysLeft = DAYS_IN_MONTH - daysGone;
  return {
    month: TODAY.toLocaleString('en-IN', { month: 'long' }),
    target, achieved, pct: target ? (achieved / target) * 100 : 0,
    expected: (target * daysGone) / DAYS_IN_MONTH,
    toGo: Math.max(0, target - achieved), daysGone, daysLeft,
    perDay: achieved / daysGone,
    needPerDay: daysLeft ? Math.max(0, target - achieved) / daysLeft : 0,
  };
}

/* ---------------------------------- search --------------------------------- */

export type SearchHit =
  | { kind: 'distributor'; key: string; title: string; sub: string }
  | { kind: 'ba'; key: string; title: string; sub: string }
  | { kind: 'customer'; key: string; title: string; sub: string };

/** Universal search across distributors, BAs and customers inside the geography and team. */
export function searchBuyer(q: string, scope: BuyerScope): SearchHit[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  const has = (...xs: string[]) => xs.join(' ').toLowerCase().includes(needle);
  const dists = distributorsIn(scope)
    .filter((d) => has(d.name, d.locality, d.city))
    .slice(0, 4)
    .map((d): SearchHit => ({ kind: 'distributor', key: d.name, title: d.name, sub: `${d.type} · ${d.locality}, ${d.city}` }));
  const customers = scopedCustomers(scope);
  const baNames = new Set(customers.map((c) => c.ba));
  const people = bas
    .filter((b) => baNames.has(b.name) && has(b.name, b.mobile, b.city, b.lead))
    .slice(0, 4)
    .map((b): SearchHit => ({ kind: 'ba', key: b.name, title: b.name, sub: `BA · ${b.city} · Team ${b.lead}` }));
  const outlets = customers
    .filter((c) => has(c.name, c.id, c.mobile, c.owner, c.pincode))
    .slice(0, 6)
    .map((c): SearchHit => ({ kind: 'customer', key: c.id, title: c.name, sub: `${c.id} · ${c.locality}, ${c.city} · ${c.ba}` }));
  return [...dists, ...people, ...outlets];
}
