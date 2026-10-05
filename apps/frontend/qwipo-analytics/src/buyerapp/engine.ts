export type Range = '7d' | '30d' | '90d';

export interface Filters {
  range: Range;
  /** selected cities; every city means "All locations" */
  cities: string[];
  platform: string;
  buyer: string;
  version: string;
}

export const STATES: { name: string; cities: string[] }[] = [
  { name: 'Telangana', cities: ['Hyderabad', 'Warangal'] },
  { name: 'Andhra Pradesh', cities: ['Vijayawada', 'Visakhapatnam', 'Guntur'] },
];
export const ALL_CITIES = STATES.flatMap((s) => s.cities);

export const DEFAULT_FILTERS: Filters = {
  range: '7d',
  cities: ALL_CITIES,
  platform: 'All',
  buyer: 'All',
  version: 'All',
};

export const RANGES: { id: Range; label: string }[] = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
];
export const PLATFORMS = ['Qwipo - Paytm', 'Qwipo - PhonePe', 'Qwipo - Existing'];
export const VERSIONS = ['4.2', '4.1', '4.0'];

const RANGE_MODEL = {
  '7d': { u: 1, e: 1, d: 1, n: 7, step: 1, prev: 'prev. 7 days' },
  '30d': { u: 1.72, e: 4.3, d: 1.6, n: 30, step: 1, prev: 'prev. 30 days' },
  '90d': { u: 2.6, e: 12.9, d: 2.3, n: 13, step: 7, prev: 'prev. 90 days' },
} as const;

const CITY_SHARE: Record<string, number> = { Hyderabad: 0.46, Vijayawada: 0.16, Visakhapatnam: 0.14, Guntur: 0.12, Warangal: 0.12 };
const CITY_QUALITY: Record<string, number> = { Hyderabad: 1.04, Vijayawada: 0.97, Visakhapatnam: 0.95, Guntur: 0.99, Warangal: 0.93 };
/** quality of "all locations", so the default view is the neutral baseline (q = 1) */
const ALL_CITY_Q = ALL_CITIES.reduce((a, c) => a + CITY_SHARE[c] * CITY_QUALITY[c], 0);
const SHARE: Record<string, Record<string, number>> = {
  platform: { All: 1, 'Qwipo - Paytm': 0.14, 'Qwipo - PhonePe': 0.08, 'Qwipo - Existing': 0.78 },
  buyer: { All: 1, New: 0.18, Returning: 0.82 },
  version: { All: 1, '4.2': 0.62, '4.1': 0.28, '4.0': 0.1 },
};
const QUALITY: Record<string, Record<string, number>> = {
  platform: { All: 1, 'Qwipo - Paytm': 0.97, 'Qwipo - PhonePe': 0.95, 'Qwipo - Existing': 1.01 },
  buyer: { All: 1, New: 0.8, Returning: 1.04 },
  version: { All: 1, '4.2': 1.03, '4.1': 0.99, '4.0': 0.88 },
};

export interface Model {
  R: (typeof RANGE_MODEL)[Range];
  /** volume share of the current filters */
  k: number;
  /** quality multiplier: above 1 is healthier than average */
  q: number;
  daily: boolean;
  /** deterministic 0..1 wobble so every filter combination looks a little different */
  jit: number;
}

export function model(f: Filters): Model {
  const R = RANGE_MODEL[f.range];
  const cityShare = f.cities.reduce((a, c) => a + CITY_SHARE[c], 0);
  const cityQ = cityShare ? f.cities.reduce((a, c) => a + CITY_SHARE[c] * CITY_QUALITY[c], 0) / cityShare / ALL_CITY_Q : 1;
  const k = cityShare * SHARE.platform[f.platform] * SHARE.buyer[f.buyer] * SHARE.version[f.version];
  const q = cityQ * QUALITY.platform[f.platform] * QUALITY.buyer[f.buyer] * QUALITY.version[f.version];
  const key = f.range + [...f.cities].sort().join() + f.platform + f.buyer + f.version;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 997;
  return { R, k, q, daily: R.step === 1, jit: h / 997 };
}

/* ── formatting ─────────────────────────────────────────────────────── */

export const int = (v: number) => Math.round(v).toLocaleString('en-IN');
export const pct = (v: number, dp = 1) => v.toFixed(dp) + '%';
export function inr(v: number) {
  if (v >= 1e7) return '₹' + (v / 1e7).toFixed(2) + ' Cr';
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(1) + ' L';
  return '₹' + Math.round(v).toLocaleString('en-IN');
}
export function inrTick(v: number) {
  if (v === 0) return '₹0';
  if (v >= 1e7) return '₹' + parseFloat((v / 1e7).toFixed(1)) + ' Cr';
  if (v >= 1e5) return '₹' + parseFloat((v / 1e5).toFixed(1)) + ' L';
  return '₹' + Math.round(v).toLocaleString('en-IN');
}
export function dur(sec: number) {
  const t = Math.round(sec);
  const mn = Math.floor(t / 60);
  const sc = t % 60;
  return mn ? mn + 'm ' + (sc < 10 ? '0' : '') + sc + 's' : sc + 's';
}

/* ── series ─────────────────────────────────────────────────────────── */

export interface DatePoint {
  label: string;
  sun: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function dates(n: number, step: number): DatePoint[] {
  const out: DatePoint[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(2026, 7, 22 - (n - 1 - i) * step);
    out.push({ label: d.getDate() + ' ' + MONTHS[d.getMonth()], sun: step === 1 && d.getDay() === 0 });
  }
  return out;
}

export function series(end: number, seed: number, vol: number, drift: number, ds: DatePoint[], sunK: number) {
  const n = ds.length;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 1 : i / (n - 1);
    const w = i === n - 1 ? 0 : Math.sin(i * 1.3 + seed) * 0.6 + Math.sin(i * 0.47 + seed * 1.9) * 0.4;
    let v = end * (1 - drift * (1 - t)) * (1 + vol * w);
    if (ds[i].sun) v *= sunK;
    out.push(v);
  }
  return out;
}

/* ── metrics ────────────────────────────────────────────────────────── */

export type Good = 'up' | 'down';

/** A stable pseudo-change for a named metric, so each row moves its own way. */
function change(m: Model, name: string) {
  let h = 7;
  for (let i = 0; i < name.length; i++) h = (h * 33 + name.charCodeAt(i)) % 10007;
  return (((h % 160) / 10 - 5) + (m.jit - 0.5) * 2) * m.R.d;
}

export interface Change {
  text: string;
  good: boolean;
  /** signed size of the change, for ranking movers */
  value: number;
  /** 12 points ending at 1 (today), shaped by the change */
  trend: number[];
  /** where the shape starts, relative to today */
  start: number;
}

function delta(m: Model, name: string, good: Good, unit: '%' | ' pts' | ''): Change {
  const d = change(m, name);
  let seed = 0;
  for (let i = 0; i < name.length; i++) seed = (seed * 17 + name.charCodeAt(i)) % 101;
  const start = 1 / (1 + d / 100);
  const amp = Math.max(0.004, Math.abs(1 - start) * 0.3);
  const trend = Array.from({ length: 12 }, (_, i) => {
    const t = i / 11;
    const wobble = i === 11 ? 0 : Math.sin(i * 0.9 + seed + m.jit * 5) * amp;
    return start + (1 - start) * t + wobble;
  });
  return {
    text: (d >= 0 ? '↑ ' : '↓ ') + Math.abs(d).toFixed(1) + unit,
    good: good === 'up' ? d >= 0 : d < 0,
    value: d,
    trend,
    start,
  };
}

/** The trend shape as real values running from `before` to `now`. */
function history(c: Change, before: number, now: number) {
  const span = 1 - c.start;
  if (Math.abs(span) < 1e-9) return c.trend.map((r) => now * r);
  return c.trend.map((r) => before + ((r - c.start) / span) * (now - before));
}

/** Date labels for the 12 sparkline points: days, or weeks on the 90-day view. */
export function trendLabels(m: Model) {
  return dates(12, m.daily ? 1 : 7).map((d) => (m.daily ? d.label : 'Week of ' + d.label));
}

export interface KpiSpec {
  label: string;
  kind: 'users' | 'count' | 'pct' | 'time' | 'secs' | 'ratio' | 'inr';
  base: number;
  good: Good;
  hint: string;
}

export interface KpiValue {
  label: string;
  value: string;
  before: string;
  hint: string;
  /** lower is better for this number */
  lowerIsBetter: boolean;
  change: Change;
  points: number[];
  fmt: (v: number) => string;
}

export function kpi(m: Model, s: KpiSpec): KpiValue {
  const better = s.good === 'up' ? m.q : 1 / m.q;
  let now = 0;
  let fmt: (v: number) => string = int;
  let unit: '%' | ' pts' | '' = '%';
  switch (s.kind) {
    case 'users':
      now = s.base * m.k * m.R.u * (s.good === 'down' ? 1 / m.q : 1);
      break;
    case 'count':
      now = s.base * m.k * m.R.e * (s.good === 'down' ? 1 / m.q : 1);
      break;
    case 'inr':
      now = s.base * m.k * m.R.e * m.q;
      fmt = inr;
      break;
    case 'pct':
      now = Math.min(99.5, s.good === 'up' ? s.base * m.q : s.base / Math.pow(m.q, 1.6));
      fmt = (v) => pct(v);
      unit = ' pts';
      break;
    case 'time':
      now = s.base / better;
      fmt = dur;
      break;
    case 'secs':
      now = s.base / better;
      fmt = (v) => v.toFixed(1) + ' s';
      break;
    case 'ratio':
      now = s.base * better;
      fmt = (v) => v.toFixed(1);
      break;
  }
  const c = delta(m, (s.kind === 'count' ? 'users' : s.kind) + s.base, s.good, unit);
  const before = s.kind === 'pct' ? now - c.value : now / (1 + c.value / 100);
  return {
    label: s.label,
    value: fmt(now),
    before: fmt(before),
    hint: s.hint,
    lowerIsBetter: s.good === 'down',
    change: c,
    points: history(c, before, now),
    fmt,
  };
}

/** One tracked action: how many buyers did it, how many times, and the change. */
export interface EventSpec {
  name: string;
  /** the row as a plain sentence, e.g. "Tapped a trending search" */
  say?: string;
  users: number;
  /** times per buyer */
  per: number;
  good?: Good;
  /** what buyers did straight after, e.g. "opened a product" */
  next?: string;
  /** share (0–1) of buyers who did `next` */
  cont?: number;
  /** what everyone else did; defaults to "left" */
  rest?: string;
}

export interface EventValue {
  name: string;
  say: string;
  users: number;
  before: number;
  times: number;
  change: Change;
  good: Good;
  points: number[];
  next?: string;
  /** buyers who went on to `next` */
  went: number;
  /** buyers who didn't */
  left: number;
  rest: string;
}

export function event(m: Model, e: EventSpec): EventValue {
  const good = e.good ?? 'up';
  const users = e.users * m.k * m.R.u * (good === 'down' ? 1 / m.q : m.q);
  const c = delta(m, 'users' + e.users, good, '%');
  const before = users / (1 + c.value / 100);
  // Healthier filters (q > 1) carry slightly more buyers on to the next step.
  const cont = Math.min(0.99, (e.cont ?? 0) * Math.pow(m.q, 0.5));
  const went = users * cont;
  return {
    name: e.name,
    say: e.say ?? e.name,
    users,
    before,
    times: users * e.per * (m.R.e / m.R.u),
    change: c,
    good,
    points: history(c, before, users),
    next: e.next,
    went,
    left: users - went,
    rest: e.rest ?? 'left',
  };
}

/** The one-line story at the top of a board: came → did something → left. */
export function entry(m: Model, e: { users: number; left: number }) {
  const came = e.users * m.k * m.R.u * m.q;
  const left = Math.min(came * 0.6, e.left * m.k * m.R.u / m.q);
  return { came, acted: came - left, left };
}

/** A change as words: "6% more" / "2% fewer", and whether that is good. */
export function changeWords(c: Change) {
  const n = Math.abs(c.value);
  return { text: n < 0.5 ? 'about the same' : `${n.toFixed(0)}% ${c.value >= 0 ? 'more' : 'fewer'}`, good: c.good, flat: n < 0.5 };
}

/* ── funnels ────────────────────────────────────────────────────────── */

export interface FunnelStepSpec {
  label: string;
  users: number;
  /** median seconds from the previous step */
  secs: number;
}

export interface FunnelStep {
  label: string;
  users: number;
  events: number;
  ofStart: number;
  drop: number;
  time: string;
  worst: boolean;
}

export function funnel(m: Model, steps: FunnelStepSpec[]): FunnelStep[] {
  const n = steps.length;
  const vals = steps.map((s, i) => s.users * m.k * m.R.u * Math.pow(m.q, i / Math.max(1, n - 1)));
  let wi = -1;
  let worst = -1;
  vals.forEach((v, i) => {
    if (i && 1 - v / vals[i - 1] > worst) {
      worst = 1 - v / vals[i - 1];
      wi = i;
    }
  });
  return steps.map((s, i) => ({
    label: s.label,
    users: vals[i],
    events: vals[i] * (1.15 + ((i * 7) % 5) / 10) * (m.R.e / m.R.u),
    ofStart: (vals[i] / vals[0]) * 100,
    drop: i ? (1 - vals[i] / vals[i - 1]) * 100 : 0,
    time: i ? dur(s.secs / m.q) : '—',
    worst: i === wi,
  }));
}
