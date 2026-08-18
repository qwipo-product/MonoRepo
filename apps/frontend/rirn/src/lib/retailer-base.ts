/**
 * The Qwipo-populated retailer base.
 *
 * In the real product, Qwipo Admin seeds and verifies this — it is the
 * network's asset, and the reason a company bothers connecting at all. Every
 * other screen reads from here.
 *
 * The field split below is the whole privacy model, so it's worth reading
 * before you add anything (PRD §16 Privacy Architecture):
 *
 *   Level 1 — public/discoverable   businessName, category, locality, verification
 *   Level 2 — revealed on unlock    address, gstin, ownerName, the signals
 *   Controlled — never in this UI   phone
 *
 * `phone` is deliberately absent from the type. §15.4 marks it "Controlled"
 * even for companies, and a mockup that leaks it teaches the wrong thing.
 */

/** PRD §25 trust ladder. Companies filter on this — it's the thing they're buying. */
export type VerificationLevel =
  | 'unverified' // L0 — self-declared, nothing checked
  | 'registered' // L1 — on the network, no documents
  | 'business' // L2 — GSTIN verified against the registry
  | 'company' // L3 — at least one company confirmed the relationship
  | 'multi' // L4 — confirmed by two or more participants
  | 'trusted'; // L5 — long-standing, no disputes

export const VERIFICATION_LABEL: Record<VerificationLevel, string> = {
  unverified: 'Unverified',
  registered: 'Registered',
  business: 'Business verified',
  company: 'Company verified',
  multi: 'Multi-participant verified',
  trusted: 'Highly trusted',
};

/** Rank, for sorting and for "is this good enough to onboard" filters. */
export const VERIFICATION_RANK: Record<VerificationLevel, number> = {
  unverified: 0,
  registered: 1,
  business: 2,
  company: 3,
  multi: 4,
  trusted: 5,
};

export type FraudFlag = 'none' | 'watch' | 'flagged';

export type RetailerCategory =
  | 'Kirana'
  | 'Supermarket'
  | 'Wholesale'
  | 'Pharmacy'
  | 'Bakery'
  | 'General store';

export interface Retailer {
  /** Non-enumerable in production (§32); readable here so demos can be discussed. */
  nrid: string;

  // ── Level 1 · discoverable without spending anything ──────────────────
  businessName: string;
  category: RetailerCategory;
  locality: string;
  city: string;
  verification: VerificationLevel;

  // ── Level 2 · revealed only after the retailer is mapped ──────────────
  ownerName: string;
  address: string;
  pincode: string;
  gstin: string;
  activeSince: string;

  /** True coordinates. The map fuzzes these until the retailer is mapped. */
  lat: number;
  lng: number;

  // ── The signals that make an unlock worth paying for ──────────────────
  /**
   * This retailer already exists in the viewing company's DMS under a
   * *different* ID — i.e. they're about to create a duplicate. PRD §19
   * Benefit 2, and the single most useful thing the network can tell them.
   */
  duplicateInDms?: string;
  /** How many distributors already serve them. Count only — never names. */
  distributorCount: number;
  /** Rough monthly purchase scale. A band, never an exact figure (§14). */
  orderBand: '< ₹50K' | '₹50K–2L' | '₹2L–5L' | '₹5L+';
  fraudFlag: FraudFlag;
}

/* ------------------------------------------------------------------ *
 * Geography — real Hyderabad localities, so the map reads as a place
 * someone recognises rather than random dots.
 * ------------------------------------------------------------------ */

const LOCALITIES: Record<string, { lat: number; lng: number; pincode: string }> = {
  Kondapur: { lat: 17.4647, lng: 78.3639, pincode: '500084' },
  Gachibowli: { lat: 17.4401, lng: 78.3489, pincode: '500032' },
  Madhapur: { lat: 17.4483, lng: 78.3915, pincode: '500081' },
  Kukatpally: { lat: 17.4948, lng: 78.4, pincode: '500072' },
  Miyapur: { lat: 17.4966, lng: 78.3573, pincode: '500049' },
  Ameerpet: { lat: 17.4374, lng: 78.4487, pincode: '500016' },
  Begumpet: { lat: 17.4435, lng: 78.4645, pincode: '500016' },
  Secunderabad: { lat: 17.4399, lng: 78.4983, pincode: '500003' },
  Uppal: { lat: 17.4058, lng: 78.559, pincode: '500039' },
  'LB Nagar': { lat: 17.3457, lng: 78.5522, pincode: '500074' },
  Dilsukhnagar: { lat: 17.3687, lng: 78.5247, pincode: '500060' },
  'Banjara Hills': { lat: 17.4156, lng: 78.4347, pincode: '500034' },
  'Jubilee Hills': { lat: 17.431, lng: 78.407, pincode: '500033' },
  Manikonda: { lat: 17.4009, lng: 78.3844, pincode: '500089' },
  Nizampet: { lat: 17.5085, lng: 78.3878, pincode: '500090' },
  Chandanagar: { lat: 17.4948, lng: 78.32, pincode: '500050' },
  Attapur: { lat: 17.3616, lng: 78.4231, pincode: '500048' },
  Mehdipatnam: { lat: 17.3947, lng: 78.4372, pincode: '500028' },
  Malakpet: { lat: 17.373, lng: 78.503, pincode: '500036' },
  Kompally: { lat: 17.543, lng: 78.487, pincode: '500014' },
  Habsiguda: { lat: 17.406, lng: 78.545, pincode: '500007' },
  Tolichowki: { lat: 17.396, lng: 78.411, pincode: '500008' },
};

export const ALL_LOCALITIES = Object.keys(LOCALITIES).sort();
export const ALL_PINCODES = [
  ...new Set(Object.values(LOCALITIES).map((l) => l.pincode)),
].sort();

/* ------------------------------------------------------------------ *
 * Seed
 *
 * Tuple form keeps 48 records readable. Coordinates are derived from the
 * locality centre plus a deterministic offset, so the base looks the same
 * on every load — a demo that reshuffles itself is impossible to talk over.
 * ------------------------------------------------------------------ */

type Seed = [
  name: string,
  owner: string,
  category: RetailerCategory,
  locality: keyof typeof LOCALITIES | string,
  verification: VerificationLevel,
  distributors: number,
  orderBand: Retailer['orderBand'],
  duplicateInDms?: string,
  fraud?: FraudFlag,
];

const SEED: Seed[] = [
  ['Sri Balaji Kirana Stores', 'M. Ramesh', 'Kirana', 'Kondapur', 'multi', 4, '₹2L–5L', 'RET-8891'],
  ['Sunshine Kirana', 'K. Lakshmi', 'Kirana', 'Kondapur', 'business', 2, '₹50K–2L'],
  ['New Ganesh Provisions', 'P. Srinivas', 'General store', 'Gachibowli', 'company', 3, '₹2L–5L'],
  ['Anand General Store', 'S. Anand', 'General store', 'Gachibowli', 'registered', 1, '< ₹50K'],
  ['Sai Ram Super Market', 'V. Prasad', 'Supermarket', 'Madhapur', 'trusted', 5, '₹5L+', 'RET-4417'],
  ['Patel Provision Store', 'H. Patel', 'Kirana', 'Madhapur', 'business', 2, '₹50K–2L'],
  ['Krishna Kirana Mart', 'B. Krishna', 'Kirana', 'Kukatpally', 'company', 3, '₹2L–5L'],
  ['Lakshmi Traders', 'N. Lakshmi', 'Wholesale', 'Kukatpally', 'multi', 4, '₹5L+'],
  ['Venkateswara Stores', 'T. Venkat', 'Kirana', 'Miyapur', 'business', 2, '₹50K–2L'],
  ['Sri Durga Provisions', 'R. Durga', 'General store', 'Miyapur', 'registered', 1, '< ₹50K'],
  ['Ameerpet Daily Needs', 'M. Farooq', 'Kirana', 'Ameerpet', 'company', 2, '₹50K–2L'],
  ['Green Leaf Supermarket', 'A. Reddy', 'Supermarket', 'Ameerpet', 'trusted', 5, '₹5L+', 'RET-2203'],
  ['Begumpet Bazaar', 'S. Imran', 'General store', 'Begumpet', 'business', 3, '₹2L–5L'],
  ['City Medical & General', 'D. Kiran', 'Pharmacy', 'Begumpet', 'multi', 2, '₹50K–2L'],
  ['Secunderabad Kirana Hub', 'G. Rajesh', 'Kirana', 'Secunderabad', 'company', 4, '₹2L–5L'],
  ['Paradise Provisions', 'M. Yousuf', 'General store', 'Secunderabad', 'business', 2, '₹50K–2L'],
  ['Rainbow Bakery & Store', 'J. Mary', 'Bakery', 'Secunderabad', 'registered', 1, '< ₹50K'],
  ['Uppal Family Mart', 'C. Sudhakar', 'Supermarket', 'Uppal', 'business', 3, '₹2L–5L'],
  ['Sri Sai Kirana', 'K. Sai', 'Kirana', 'Uppal', 'unverified', 0, '< ₹50K', undefined, 'watch'],
  ['LB Nagar Wholesale Depot', 'P. Naresh', 'Wholesale', 'LB Nagar', 'multi', 5, '₹5L+'],
  ['Nagar Daily Bazaar', 'S. Vijaya', 'Kirana', 'LB Nagar', 'business', 2, '₹50K–2L'],
  ['Dilsukhnagar Super Store', 'R. Mohan', 'Supermarket', 'Dilsukhnagar', 'company', 3, '₹2L–5L', 'RET-7756'],
  ['Sneha Provisions', 'L. Sneha', 'General store', 'Dilsukhnagar', 'registered', 1, '< ₹50K'],
  ['Banjara Gourmet Mart', 'A. Khan', 'Supermarket', 'Banjara Hills', 'trusted', 4, '₹5L+'],
  ['Hill View Kirana', 'N. Satish', 'Kirana', 'Banjara Hills', 'business', 2, '₹50K–2L'],
  ['Jubilee Fresh Market', 'V. Deepa', 'Supermarket', 'Jubilee Hills', 'multi', 4, '₹5L+'],
  ['Road No 36 Provisions', 'S. Arif', 'General store', 'Jubilee Hills', 'company', 2, '₹2L–5L'],
  ['Manikonda Kirana Point', 'B. Ravi', 'Kirana', 'Manikonda', 'business', 3, '₹50K–2L'],
  ['Lanco Hills General', 'T. Padma', 'General store', 'Manikonda', 'registered', 1, '< ₹50K'],
  ['Nizampet Value Store', 'K. Suresh', 'Supermarket', 'Nizampet', 'company', 3, '₹2L–5L'],
  ['Sri Vinayaka Kirana', 'M. Ganesh', 'Kirana', 'Nizampet', 'business', 2, '₹50K–2L'],
  ['Chandanagar Cash & Carry', 'P. Ismail', 'Wholesale', 'Chandanagar', 'multi', 5, '₹5L+', 'RET-9902'],
  ['Beeramguda Daily Mart', 'R. Swathi', 'Kirana', 'Chandanagar', 'registered', 1, '< ₹50K'],
  ['Attapur Family Store', 'S. Zubair', 'General store', 'Attapur', 'business', 2, '₹50K–2L'],
  ['Rethi Bowli Provisions', 'A. Nagesh', 'Kirana', 'Attapur', 'unverified', 0, '< ₹50K', undefined, 'flagged'],
  ['Mehdipatnam Super Bazaar', 'F. Ahmed', 'Supermarket', 'Mehdipatnam', 'trusted', 4, '₹5L+'],
  ['Humayun Nagar Kirana', 'M. Salim', 'Kirana', 'Mehdipatnam', 'company', 2, '₹2L–5L'],
  ['Malakpet General Traders', 'V. Shankar', 'Wholesale', 'Malakpet', 'multi', 4, '₹5L+'],
  ['Nalgonda X Roads Store', 'K. Anitha', 'Kirana', 'Malakpet', 'business', 2, '₹50K–2L'],
  ['Kompally Fresh Mart', 'D. Praveen', 'Supermarket', 'Kompally', 'company', 3, '₹2L–5L'],
  ['Suchitra Kirana', 'G. Malathi', 'Kirana', 'Kompally', 'registered', 1, '< ₹50K'],
  ['Habsiguda Daily Needs', 'N. Kishore', 'Kirana', 'Habsiguda', 'business', 2, '₹50K–2L'],
  ['Tarnaka Provisions', 'S. Latha', 'General store', 'Habsiguda', 'company', 3, '₹2L–5L', 'RET-3318'],
  ['Tolichowki Super Store', 'M. Rizwan', 'Supermarket', 'Tolichowki', 'multi', 4, '₹5L+'],
  ['Nanal Nagar Kirana', 'A. Hameed', 'Kirana', 'Tolichowki', 'business', 2, '₹50K–2L'],
  ['Sri Sai Baba Medicals', 'P. Chandra', 'Pharmacy', 'Kondapur', 'company', 1, '₹50K–2L'],
  ['Botanical Garden Bakery', 'J. Rekha', 'Bakery', 'Gachibowli', 'registered', 1, '< ₹50K'],
  ['Hitech City Wholesale', 'R. Vamsi', 'Wholesale', 'Madhapur', 'trusted', 5, '₹5L+'],
];

/** Deterministic spread around a locality centre — roughly ±700m. */
function offset(index: number, axis: 0 | 1): number {
  const golden = 0.618033988749895;
  const t = ((index + 1) * golden * (axis === 0 ? 1 : 2.3)) % 1;
  return (t - 0.5) * 0.012;
}

function gstinFor(index: number, pincode: string): string {
  // 36 = Telangana. Shape only; not a real checksum.
  const block = String(10000 + index * 137).slice(0, 4);
  return `36AAB${block}${pincode.slice(-2)}1Z${String.fromCharCode(65 + (index % 26))}`;
}

const FEATURED: Retailer[] = SEED.map((s, i) => {
  const [name, owner, category, locality, verification, distributors, orderBand, dup, fraud] = s;
  const base = LOCALITIES[locality]!;
  return {
    nrid: `NRID-${String(10001 + i)}`,
    businessName: name,
    ownerName: owner,
    category,
    locality,
    city: 'Hyderabad',
    pincode: base.pincode,
    address: `${10 + ((i * 7) % 89)}-${1 + (i % 9)}/${20 + (i % 40)}, ${locality}, Hyderabad`,
    gstin: gstinFor(i, base.pincode),
    verification,
    lat: base.lat + offset(i, 0),
    lng: base.lng + offset(i, 1),
    duplicateInDms: dup,
    distributorCount: distributors,
    orderBand,
    fraudFlag: fraud ?? 'none',
    activeSince: `${2018 + (i % 7)}`,
  };
});

/* ------------------------------------------------------------------ *
 * Filler
 *
 * The hand-written seed above carries the interesting cases — duplicates,
 * fraud flags, the GSTIN-mismatch pairs. But 48 shops across 22 localities
 * makes a city map look empty, and a company user needs to see density to
 * believe the base is real. So each locality is filled out to a realistic
 * count from name components.
 *
 * Everything is derived from the index, so the base is byte-identical on
 * every load. A demo whose map reshuffles between runs is impossible to
 * talk over.
 * ------------------------------------------------------------------ */

const NAME_PREFIX = [
  'Sri', 'New', 'Sai', 'Bala', 'Lakshmi', 'Venkata', 'Anand', 'Ganesh',
  'Shiva', 'Raghava', 'Vijaya', 'Padma', 'Surya', 'Chandra', 'Amrutha',
  'Deepak', 'Gokul', 'Harsha', 'Indira', 'Jyothi', 'Kalyan', 'Manohar',
  'Nandini', 'Prasad', 'Rajeshwari', 'Santosh', 'Tejaswi', 'Uma',
];

const NAME_SUFFIX = [
  'Kirana', 'Provisions', 'General Store', 'Super Market', 'Traders',
  'Daily Needs', 'Bazaar', 'Mart', 'Stores', 'Enterprises', 'Agencies',
  'Fresh Mart', 'Family Store', 'Cash & Carry',
];

const OWNER_FIRST = [
  'M.', 'K.', 'S.', 'P.', 'R.', 'V.', 'B.', 'T.', 'N.', 'G.', 'D.', 'A.',
];
const OWNER_LAST = [
  'Ramesh', 'Lakshmi', 'Srinivas', 'Anand', 'Prasad', 'Krishna', 'Rao',
  'Reddy', 'Sharma', 'Kumar', 'Devi', 'Naidu', 'Yadav', 'Ahmed', 'Fatima',
  'Iqbal', 'Sudha', 'Vinod', 'Latha', 'Murthy',
];

const CATEGORIES: RetailerCategory[] = [
  'Kirana', 'Kirana', 'Kirana', 'General store', 'General store',
  'Supermarket', 'Wholesale', 'Pharmacy', 'Bakery',
];

const LEVELS: VerificationLevel[] = [
  'registered', 'business', 'business', 'business', 'company', 'company',
  'multi', 'trusted', 'unverified',
];

const BANDS: Retailer['orderBand'][] = ['< ₹50K', '₹50K–2L', '₹50K–2L', '₹2L–5L', '₹5L+'];

/** Small integer hash — stable, and spreads adjacent indices apart. */
function pick<T>(arr: T[], n: number): T {
  return arr[Math.abs(Math.imul(n, 2654435761) >>> 0) % arr.length]!;
}

/** Roughly how many shops each locality gets. Varies so density looks organic. */
const FILL_PER_LOCALITY = 24;

const generated: Retailer[] = [];
let g = 0;
for (const [locality, base] of Object.entries(LOCALITIES)) {
  const count = FILL_PER_LOCALITY + (pick([0, 3, 6, 9, 12], g) as number);
  for (let k = 0; k < count; k += 1) {
    const n = g * 131 + k * 17;
    const i = SEED.length + generated.length;
    const name = `${pick(NAME_PREFIX, n)} ${pick(NAME_SUFFIX, n + 5)}`;
    generated.push({
      nrid: `NRID-${String(10001 + i)}`,
      businessName: name,
      ownerName: `${pick(OWNER_FIRST, n + 1)} ${pick(OWNER_LAST, n + 2)}`,
      category: pick(CATEGORIES, n + 3),
      locality,
      city: 'Hyderabad',
      pincode: base.pincode,
      address: `${1 + (n % 120)}-${1 + (k % 9)}/${10 + (n % 60)}, ${locality}, Hyderabad`,
      gstin: gstinFor(i, base.pincode),
      verification: pick(LEVELS, n + 4),
      // Wider spread than the featured seed so a locality reads as a
      // neighbourhood rather than a cluster of pins on one street.
      lat: base.lat + offset(i, 0) * 1.8,
      lng: base.lng + offset(i, 1) * 1.8,
      // Roughly one in nine already exists in the viewing company's DMS.
      duplicateInDms: n % 9 === 0 ? `RET-${1000 + ((n * 7) % 7900)}` : undefined,
      distributorCount: n % 6,
      orderBand: pick(BANDS, n + 6),
      fraudFlag: n % 47 === 0 ? 'watch' : n % 113 === 0 ? 'flagged' : 'none',
      activeSince: `${2015 + (n % 10)}`,
    });
  }
  g += 1;
}

/** Featured cases first, so the interesting ones surface at the top of a rail. */
export const RETAILERS: Retailer[] = [...FEATURED, ...generated];

export const RETAILERS_BY_NRID = new Map(RETAILERS.map((r) => [r.nrid, r]));

/**
 * Area search. Matches locality, pincode or city — the three things a
 * company user would actually type.
 *
 * Deliberately does NOT match business name: name search would turn the base
 * into a lookup service for a list you already have, which is the harvesting
 * path §15 is trying to close. You search a place, not a company.
 */
export function searchRetailers(query: string): Retailer[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return RETAILERS.filter(
    (r) =>
      r.locality.toLowerCase().includes(q) ||
      r.pincode.startsWith(q) ||
      r.city.toLowerCase() === q,
  );
}
