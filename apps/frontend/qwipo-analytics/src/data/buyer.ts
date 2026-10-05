// DigiDukaan · Buyer side — the sales team's data (buyer-app database).
// One generated world: distributors, BAs (salespersons) with team leads,
// beats and targets, customers with KYC and discoverable distributors, and
// an order ledger. Every buyer dashboard and report aggregates from it, so
// the numbers agree across pages for any date range and geography.
//
// Operating footprint: Telangana, Maharashtra, Rajasthan.
// "Today" for the mockup is 22 Aug 2026, same as the rest of the app.

export type OrderStatus = 'Active' | 'In Transit' | 'Delivered' | 'Cancelled';
export type CancelSource = 'BA' | 'Distributor' | 'Retailer';
export type Kyc = 'Verified' | 'Pending' | 'Rejected';
/** Qwipo is a marketplace: brand distributors and wholesalers both list and sell. */
export type SellerType = 'Distributor' | 'Wholesaler';

export const TODAY = new Date(2026, 7, 22);
export const FIRST_DAY = new Date(2026, 4, 1); // order ledger starts 1 May 2026
const DAY = 86400000;

/* ---------------------------------- geo ----------------------------------- */

export const geo: Record<string, Record<string, { localities: string[]; pin: number }>> = {
  Telangana: {
    Hyderabad: { localities: ['Kukatpally', 'Ameerpet', 'LB Nagar', 'Miyapur', 'Dilsukhnagar', 'Mehdipatnam', 'Kondapur'], pin: 500072 },
    Secunderabad: { localities: ['Malkajgiri', 'Begumpet', 'Trimulgherry', 'Alwal'], pin: 500003 },
    Warangal: { localities: ['Hanamkonda', 'Kazipet', 'Subedari'], pin: 506001 },
    Nizamabad: { localities: ['Kanteshwar', 'Vinayak Nagar', 'Armoor Road'], pin: 503001 },
    Karimnagar: { localities: ['Mankammathota', 'Kothirampur', 'Jyothinagar'], pin: 505001 },
    Sangareddy: { localities: ['Kandi', 'Pothireddypally'], pin: 502001 },
  },
  Maharashtra: {
    Pune: { localities: ['Hadapsar', 'Pimpri', 'Kothrud', 'Wakad', 'Kharadi'], pin: 411028 },
    Mumbai: { localities: ['Andheri East', 'Ghatkopar', 'Kurla', 'Borivali'], pin: 400069 },
    Nagpur: { localities: ['Sitabuldi', 'Dharampeth', 'Manish Nagar'], pin: 440012 },
    Nashik: { localities: ['Panchavati', 'CIDCO', 'Nashik Road'], pin: 422003 },
  },
  Rajasthan: {
    Jaipur: { localities: ['Mansarovar', 'Vaishali Nagar', 'Malviya Nagar', 'Raja Park', 'Jhotwara'], pin: 302020 },
    Jodhpur: { localities: ['Sardarpura', 'Paota', 'Shastri Nagar'], pin: 342003 },
    Udaipur: { localities: ['Hiran Magri', 'Sukher', 'Fatehpura'], pin: 313002 },
    Kota: { localities: ['Talwandi', 'Vigyan Nagar', 'Kunhari'], pin: 324005 },
  },
};
export const states = Object.keys(geo);
export const citiesOf = (state: string) => (state === 'All' ? states.flatMap((s) => Object.keys(geo[s])) : Object.keys(geo[state] ?? {}));
export const stateOf = (city: string) => states.find((s) => city in geo[s])!;
export const stateCode: Record<string, string> = { Telangana: 'TG', Maharashtra: 'MH', Rajasthan: 'RJ' };

// Deterministic PRNG so the mock reads the same on every reload.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260822);
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const between = (a: Date, b: Date) => new Date(a.getTime() + Math.floor(rnd() * ((b.getTime() - a.getTime()) / DAY + 1)) * DAY);
const mobile = () => `${pick(['9', '8', '7'])}${Math.floor(1000 + rnd() * 8999)} ${Math.floor(10000 + rnd() * 89999)}`;

/* ------------------------------- distributors ------------------------------ */

export interface BuyerDistributor {
  name: string; state: string; city: string; locality: string;
  type: SellerType;
  /** stopped taking orders on this date → shows Inactive on later ranges */
  lastActive?: Date;
}

const WHOLESALERS = new Set(['Annapurna Traders', 'S R Enterprises', 'Mauli Traders', 'Godavari Enterprises', 'Pink City Enterprises', 'Marudhar Traders']);

export const buyerDistributors: BuyerDistributor[] = ([
  { name: 'Sri Balaji Agencies', state: 'Telangana', city: 'Hyderabad', locality: 'Kukatpally' },
  { name: 'Annapurna Traders', state: 'Telangana', city: 'Hyderabad', locality: 'Ameerpet' },
  { name: 'Sai Krishna Agencies', state: 'Telangana', city: 'Hyderabad', locality: 'LB Nagar' },
  { name: 'S R Enterprises', state: 'Telangana', city: 'Secunderabad', locality: 'Begumpet' },
  { name: 'Hanuman Agencies', state: 'Telangana', city: 'Secunderabad', locality: 'Malkajgiri' },
  { name: 'Vijaya Distributors', state: 'Telangana', city: 'Warangal', locality: 'Hanamkonda' },
  { name: 'Lakshmi Agencies', state: 'Telangana', city: 'Nizamabad', locality: 'Kanteshwar' },
  { name: 'Durga Agencies', state: 'Telangana', city: 'Nizamabad', locality: 'Armoor Road', lastActive: new Date(2026, 6, 2) },
  { name: 'Sri Venkateswara Agencies', state: 'Telangana', city: 'Karimnagar', locality: 'Mankammathota' },
  { name: 'Om Sri Distributors', state: 'Telangana', city: 'Sangareddy', locality: 'Kandi', lastActive: new Date(2026, 6, 18) },
  { name: 'Shree Samarth Distributors', state: 'Maharashtra', city: 'Pune', locality: 'Hadapsar' },
  { name: 'Mauli Traders', state: 'Maharashtra', city: 'Pune', locality: 'Pimpri' },
  { name: 'Siddhivinayak Agencies', state: 'Maharashtra', city: 'Mumbai', locality: 'Andheri East' },
  { name: 'Mahalaxmi Agencies', state: 'Maharashtra', city: 'Mumbai', locality: 'Ghatkopar', lastActive: new Date(2026, 6, 24) },
  { name: 'Vidarbha Distributors', state: 'Maharashtra', city: 'Nagpur', locality: 'Sitabuldi' },
  { name: 'Godavari Enterprises', state: 'Maharashtra', city: 'Nashik', locality: 'Panchavati' },
  { name: 'Shree Shyam Distributors', state: 'Rajasthan', city: 'Jaipur', locality: 'Mansarovar' },
  { name: 'Pink City Enterprises', state: 'Rajasthan', city: 'Jaipur', locality: 'Vaishali Nagar' },
  { name: 'Marudhar Traders', state: 'Rajasthan', city: 'Jodhpur', locality: 'Sardarpura' },
  { name: 'Mewar Agencies', state: 'Rajasthan', city: 'Udaipur', locality: 'Hiran Magri' },
  { name: 'Hadoti Traders', state: 'Rajasthan', city: 'Kota', locality: 'Talwandi', lastActive: new Date(2026, 6, 10) },
] as Omit<BuyerDistributor, 'type'>[]).map((d) => ({ ...d, type: WHOLESALERS.has(d.name) ? 'Wholesaler' : 'Distributor' }));
export const sellerTypeOf = new Map(buyerDistributors.map((d) => [d.name, d.type]));

/** Buyer-app launch per state — customers onboard (and order) only after it. */
export const launch: Record<string, Date> = {
  Telangana: new Date(2026, 0, 5), Maharashtra: new Date(2026, 5, 1), Rajasthan: new Date(2026, 5, 15),
};

/* ----------------------------------- BAs ----------------------------------- */

export interface Beat { name: string; locality: string; days: string }
export interface BA {
  name: string; mobile: string; state: string; city: string;
  lead: string;
  /** monthly order-value target, ₹ */
  target: number;
  beats: Beat[];
  /** how well this BA converts — drives order volume */
  pull: number;
  /** share of this BA's orders taken on a planned beat visit (vs retailer self-orders) */
  beatRate: number;
}

const baSeed: [string, string, string, number][] = [
  // name, city, team lead, monthly target
  ['Ravi Teja', 'Hyderabad', 'Venkat Rao', 600000],
  ['Suresh Goud', 'Hyderabad', 'Venkat Rao', 550000],
  ['Kiran Babu', 'Hyderabad', 'Venkat Rao', 500000],
  ['Mahesh Yadav', 'Secunderabad', 'Venkat Rao', 500000],
  ['Anjali Sharma', 'Secunderabad', 'Venkat Rao', 450000],
  ['Srinivas Rao', 'Warangal', 'Ramesh Chary', 400000],
  ['Praveen Kumar', 'Nizamabad', 'Ramesh Chary', 350000],
  ['Naveen Reddy', 'Karimnagar', 'Ramesh Chary', 350000],
  ['Amol Jadhav', 'Pune', 'Sachin Patil', 400000],
  ['Pooja Deshmukh', 'Pune', 'Sachin Patil', 350000],
  ['Rahul Shinde', 'Mumbai', 'Sachin Patil', 400000],
  ['Sagar Wankhede', 'Nagpur', 'Sachin Patil', 300000],
  ['Nikhil Pawar', 'Nashik', 'Sachin Patil', 250000],
  ['Manish Sharma', 'Jaipur', 'Vikram Rathore', 350000],
  ['Rohit Meena', 'Jaipur', 'Vikram Rathore', 300000],
  ['Deepak Choudhary', 'Jodhpur', 'Vikram Rathore', 250000],
  ['Lokesh Joshi', 'Udaipur', 'Vikram Rathore', 250000],
  ['Hemant Saini', 'Kota', 'Vikram Rathore', 200000],
];
const beatDays = ['Mon / Thu', 'Tue / Fri', 'Wed / Sat'];

export const bas: BA[] = baSeed.map(([name, city, lead, target], i) => {
  const state = stateOf(city);
  const locs = geo[state][city].localities;
  const n = Math.min(3, locs.length);
  const start = i % locs.length;
  return {
    name, mobile: mobile(), state, city, lead,
    // seed values are the plan; calibrated to what the network actually runs at
    target: Math.round((target * 0.62) / 10000) * 10000,
    pull: 0.55 + rnd() * 0.75,
    beatRate: 0.38 + rnd() * 0.48,
    beats: Array.from({ length: n }, (_, k) => {
      const locality = locs[(start + k) % locs.length];
      return { name: `${locality} Beat`, locality, days: beatDays[k] };
    }),
  };
});
export const leads = [...new Set(bas.map((b) => b.lead))];

/* -------------------------------- customers -------------------------------- */

export interface BuyerCustomer {
  id: string; name: string; owner: string; mobile: string;
  state: string; city: string; locality: string; pincode: string;
  ba: string; baMobile: string; lead: string; beat: string; beatDays: string;
  /** distributor the outlet is mapped to (orders go here by default) */
  distributor: string;
  /** every distributor this outlet can discover and order from in the app */
  discoverable: string[];
  onboarded: Date;
  kyc: Kyc;
  kycNote?: string;
  /** orders per week while active */
  rate: number;
  /** went quiet after this date */
  stoppedAt?: Date;
}

const namePrefix: Record<string, string[]> = {
  Telangana: ['Sri Lakshmi', 'Balaji', 'Venkata Sai', 'Durga', 'Sai Ram', 'Ganesh', 'Hanuman', 'Srinivasa', 'Raghavendra', 'Vijaya', 'Renuka', 'Tirumala', 'Kanaka Durga', 'Mahalakshmi', 'Vasavi', 'Gayatri', 'Sita Rama', 'Bhavani', 'Yadadri', 'Charminar', 'Jyothi', 'Kalyani', 'Swathi', 'Sri Datta', 'Rajeshwari', 'Surya', 'Padma', 'Ayyappa'],
  Maharashtra: ['Shree Ganesh', 'Mauli', 'Sai Samarth', 'Jai Bhavani', 'Vitthal', 'Siddhivinayak', 'Mahalaxmi', 'Shivneri', 'Gajanan', 'Khandoba', 'Tulja Bhavani', 'Om Sai', 'Navratna', 'Swami Samarth', 'Ekvira', 'Sahyadri'],
  Rajasthan: ['Shri Shyam', 'Marwar', 'Jain', 'Agarwal', 'Mahaveer', 'Shri Ram', 'Govind Dev', 'Karni', 'Rajputana', 'Khatu Shyam', 'Maheshwari', 'Gangaur', 'Shri Krishna', 'Ambe', 'Sanwariya', 'Laxmi'],
};
const nameSuffix = ['Kirana Store', 'General Store', 'Provisions', 'Super Mart', 'Traders', 'Daily Needs', 'Kirana', 'Mart'];
const owners: Record<string, [string[], string[]]> = {
  Telangana: [['Ramesh', 'Srinivas', 'Venkatesh', 'Lakshmi', 'Prasad', 'Anil', 'Sunitha', 'Rajesh', 'Madhavi', 'Nagaraju'], ['Reddy', 'Goud', 'Rao', 'Yadav', 'Naidu', 'Chary', 'Varma']],
  Maharashtra: [['Sachin', 'Prakash', 'Sunil', 'Vaishali', 'Ganesh', 'Mangesh', 'Rupali', 'Santosh'], ['Patil', 'Jadhav', 'Pawar', 'Shinde', 'Kulkarni', 'More', 'Gaikwad']],
  Rajasthan: [['Rakesh', 'Mahesh', 'Suresh', 'Kavita', 'Dinesh', 'Ramesh', 'Sunita', 'Gopal'], ['Sharma', 'Agarwal', 'Jain', 'Meena', 'Choudhary', 'Rathore', 'Saini']],
};
const kycReasons = ['GSTIN not uploaded', 'Shop photo missing', 'Owner PAN mismatch', 'Address proof pending'];

export const buyerCustomers: BuyerCustomer[] = (() => {
  const used = new Set<string>();
  const out: BuyerCustomer[] = [];
  let seq = 10231;
  for (const ba of bas) {
    const count = ba.state === 'Telangana' ? 12 + Math.floor(rnd() * 5) : 9 + Math.floor(rnd() * 5);
    const cityDists = buyerDistributors.filter((d) => d.city === ba.city);
    const primary = cityDists.filter((d) => !d.lastActive);
    for (let k = 0; k < count; k++) {
      const beat = ba.beats[k % ba.beats.length];
      let name = `${pick(namePrefix[ba.state])} ${pick(nameSuffix)}`;
      if (used.has(name)) name = `${name}, ${beat.locality}`;
      if (used.has(name)) continue;
      used.add(name);
      const mapped = (primary.length && rnd() > 0.08 ? pick(primary) : pick(cityDists)) ?? pick(buyerDistributors);
      // Discoverable: the mapped one + others serving the same city (+ twin city for Hyd/Sec).
      const twin = ba.city === 'Hyderabad' ? 'Secunderabad' : ba.city === 'Secunderabad' ? 'Hyderabad' : '';
      const discoverable = [mapped.name, ...buyerDistributors
        .filter((d) => d.name !== mapped.name && !d.lastActive && (d.city === ba.city || (d.city === twin && rnd() < 0.5)))
        .map((d) => d.name)];
      const onboarded = between(launch[ba.state], new Date(2026, 7, 20));
      const recent = (TODAY.getTime() - onboarded.getTime()) / DAY < 30;
      const k1 = rnd();
      const kyc: Kyc = k1 < (recent ? 0.45 : 0.14) ? 'Pending' : k1 > 0.95 ? 'Rejected' : 'Verified';
      const [firsts, lasts] = owners[ba.state];
      out.push({
        id: `QB-C${seq}`, name, owner: `${pick(firsts)} ${pick(lasts)}`, mobile: mobile(),
        state: ba.state, city: ba.city, locality: beat.locality,
        pincode: String(geo[ba.state][ba.city].pin + Math.floor(rnd() * 12)),
        ba: ba.name, baMobile: ba.mobile, lead: ba.lead, beat: beat.name, beatDays: beat.days,
        distributor: mapped.name, discoverable,
        onboarded, kyc,
        kycNote: kyc === 'Pending' ? pick(kycReasons) : kyc === 'Rejected' ? 'Documents did not match shop' : undefined,
        rate: rnd() < 0.09 ? 0 : (0.5 + rnd() * 1.7) * ba.pull,
        stoppedAt: rnd() < 0.14 ? between(new Date(2026, 5, 1), new Date(2026, 6, 20)) : undefined,
      });
      seq += 7;
    }
  }
  return out;
})();

/* ---------------------------------- orders --------------------------------- */

export interface BuyerOrder {
  id: string;
  at: Date;
  customerId: string; customer: string; mobile: string;
  state: string; city: string; locality: string;
  distributor: string;
  ba: string; baMobile: string; lead: string; beatName: string;
  value: number;
  /** placed by the BA on a planned beat visit (vs. retailer self-order / off-beat) */
  beat: boolean;
  status: OrderStatus;
  cancelledBy?: CancelSource;
}

function status(at: Date): { status: OrderStatus; cancelledBy?: CancelSource } {
  const age = (TODAY.getTime() - at.getTime()) / DAY;
  const r = rnd();
  if (r < 0.17) {
    const s = rnd();
    return { status: 'Cancelled', cancelledBy: s < 0.3 ? 'BA' : s < 0.72 ? 'Distributor' : 'Retailer' };
  }
  if (age < 1) return { status: r < 0.75 ? 'Active' : 'In Transit' };
  if (age < 4) return { status: r < 0.35 ? 'Active' : r < 0.75 ? 'In Transit' : 'Delivered' };
  if (age < 7) return { status: r < 0.28 ? 'In Transit' : 'Delivered' };
  return { status: 'Delivered' };
}

export const buyerOrders: BuyerOrder[] = (() => {
  const out: BuyerOrder[] = [];
  const dist = new Map(buyerDistributors.map((d) => [d.name, d]));
  const baBeat = new Map(bas.map((b) => [b.name, b.beatRate]));
  // Some distributors push retailers to self-order in the app; others rely on BA visits.
  const distBeat = new Map(buyerDistributors.map((d, i) => [d.name, 0.78 + ((i * 37) % 9) / 18]));
  const wholesale = new Set(buyerDistributors.filter((d) => d.type === 'Wholesaler').map((d) => d.name));
  let seq = 48100;
  for (let t = FIRST_DAY.getTime(); t <= TODAY.getTime(); t += DAY) {
    const day = new Date(t);
    const sunday = day.getDay() === 0;
    for (const c of buyerCustomers) {
      if (!c.rate || c.kyc === 'Rejected' || day < c.onboarded) continue;
      if (c.stoppedAt && day > c.stoppedAt) continue;
      const d = dist.get(c.distributor)!;
      if (d.lastActive && day > d.lastActive) continue;
      if (rnd() > (c.rate / 7) * (sunday ? 0.3 : 1) * (c.kyc === 'Pending' ? 0.6 : 1)) continue;
      const at = new Date(t + (8 + Math.floor(rnd() * 11)) * 3600000 + Math.floor(rnd() * 60) * 60000);
      // Most orders go to the mapped distributor; some to another discoverable one.
      const to = c.discoverable.length > 1 && rnd() < 0.12 ? pick(c.discoverable.slice(1)) : c.distributor;
      out.push({
        id: `QB-${seq++}`, at,
        customerId: c.id, customer: c.name, mobile: c.mobile,
        state: c.state, city: c.city, locality: c.locality,
        distributor: to, ba: c.ba, baMobile: c.baMobile, lead: c.lead, beatName: c.beat,
        value: Math.round(((1500 + rnd() * rnd() * 16000) * (wholesale.has(to) ? 1.5 : 1)) / 10) * 10,
        beat: rnd() < Math.min(0.94, baBeat.get(c.ba)! * distBeat.get(to)! * (wholesale.has(to) ? 0.6 : 1)),
        ...status(at),
      });
    }
  }
  return out;
})();

/* ---------------------------------- scope ---------------------------------- */

export type Preset = 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'Month to date' | 'All Time' | 'Custom';
export interface BuyerScope {
  preset: Preset; from: Date; to: Date;
  state: string; city: string; distributor: string; // 'All' = no filter
  /** Distributor or Wholesaler — 'All' = both */
  sellerType: 'All' | SellerType;
  /** sales team (team lead's name) — 'All' = every team */
  team: string;
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const presetRange = (p: Preset): [Date, Date] =>
  p === 'Today' ? [TODAY, TODAY]
    : p === 'Last 7 Days' ? [addDays(TODAY, -6), TODAY]
      : p === 'Last 30 Days' ? [addDays(TODAY, -29), TODAY]
        : p === 'Month to date' ? [new Date(2026, 7, 1), TODAY]
          : [FIRST_DAY, TODAY];

// Targets are monthly, so the sales pages open on the month so far.
export const DEFAULT_SCOPE: BuyerScope = {
  preset: 'Month to date', from: presetRange('Month to date')[0], to: TODAY,
  state: 'All', city: 'All', distributor: 'All', sellerType: 'All', team: 'All',
};

const geoMatch = (x: { state: string; city: string }, s: BuyerScope) =>
  (s.state === 'All' || x.state === s.state) && (s.city === 'All' || x.city === s.city);

export const distributorsIn = (s: Pick<BuyerScope, 'state' | 'city'> & { sellerType?: BuyerScope['sellerType'] }) =>
  buyerDistributors.filter((d) => geoMatch(d, s as BuyerScope) && (!s.sellerType || s.sellerType === 'All' || d.type === s.sellerType));

/** Orders inside the date range and geography. */
export function scopedOrders(s: BuyerScope) {
  const start = new Date(s.from.getFullYear(), s.from.getMonth(), s.from.getDate());
  const end = addDays(s.to, 1);
  return buyerOrders.filter((o) => o.at >= start && o.at < end && geoMatch(o, s)
    && (s.distributor === 'All' || o.distributor === s.distributor)
    && (s.sellerType === 'All' || sellerTypeOf.get(o.distributor) === s.sellerType)
    && (s.team === 'All' || o.lead === s.team));
}

/** Customers in the geography (the base — not date dependent). */
export function scopedCustomers(s: BuyerScope) {
  return buyerCustomers.filter((c) => geoMatch(c, s)
    && (s.distributor === 'All' || c.distributor === s.distributor)
    && (s.sellerType === 'All' || sellerTypeOf.get(c.distributor) === s.sellerType)
    && (s.team === 'All' || c.lead === s.team));
}

/** Customer's orders by id, over the whole ledger — for last-order / dormancy. */
export const ordersByCustomer = (() => {
  const m = new Map<string, BuyerOrder[]>();
  for (const o of buyerOrders) {
    const list = m.get(o.customerId) ?? [];
    list.push(o);
    m.set(o.customerId, list);
  }
  return m;
})();

export type CustomerStatus = 'Active' | 'Dormant' | 'Never ordered';
/** As of the range end: ordered in the 30 days before it → Active, earlier → Dormant. */
export function customerStatus(c: BuyerCustomer, asOf: Date): { status: CustomerStatus; last?: Date } {
  const end = addDays(asOf, 1);
  const list = (ordersByCustomer.get(c.id) ?? []).filter((o) => o.at < end);
  const last = list.length ? list[list.length - 1].at : undefined;
  if (!last) return { status: 'Never ordered' };
  return { status: (end.getTime() - last.getTime()) / DAY <= 30 ? 'Active' : 'Dormant', last };
}
