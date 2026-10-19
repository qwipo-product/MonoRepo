import { BRANDS } from './home';
import { SEARCH_CARDS } from './search';

/* Delivery / Beat Schedule — which COMPANY's distributors deliver to an area
   on which day, so a retailer (or the salesperson ordering for them) can order
   the day before the van comes.

   The companies and brands are NOT a list of their own: they come from the
   catalogue the app already shows — its DISTRIBUTOR products only, since the
   schedule is about distributor vans (wholesale-only brands stay off), read
   through the same brand logic as search and filters. Every brand that has a
   product in the app is grouped under the company that owns it; a company
   with no product in the app doesn't appear. Add a product with a new brand
   and it shows up here — only its owner below needs to be known.

   Companies, not brands: "HUL", not Surf Excel or Vim. Four or five companies a day;
   no deliveries on Sunday.

   The week depends on WHERE the shop is: each area (locality) has its own
   delivery days. The customer app uses the buyer's current delivery address;
   the salesperson app, the customer they've switched to.

   PLACEHOLDER DATA for the days. Hitech City is the walkthrough video's
   timetable extended to every company in the catalogue; the other areas put
   the same companies on other days, so changing address or customer visibly
   changes the week. Gachibowli's Monday and Hitech City's Tuesday carry
   extra companies, to show a busy day (scroll + View all). Real days per
   area come from the admin side. */

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6; // Mon..Sat (Sunday: no deliveries)

export interface Company {
  id: string;
  name: string;
  /** Full legal-ish name for the company page header. */
  legalName: string;
  /** Logo image if the app has one; otherwise a wordmark tile is drawn. */
  logo?: string;
  /** Short wordmark for the placeholder tile. */
  mark: string;
  /** Its brands that are in the app, best-selling first (most products in
   *  the catalogue) — the schedule's company rows lead with the first few. */
  brands: string[];
}

/* ---- Who owns which brand ---------------------------------------------------
   The one thing the catalogue doesn't carry: products name a brand, not its
   company. In the real system this comes from the admin's Companies & Brands
   screen. Keys are brands as the app names them. */

interface Owner {
  id: string;
  name: string;
  legalName: string;
  mark: string;
  logo?: string;
}

const OWNERS: Owner[] = [
  { id: 'gemini', name: 'Gemini', legalName: 'Gemini Edibles & Fats India Ltd', mark: 'Freedom', logo: '/brand-logos/Freedon Oil.png' },
  { id: 'itc', name: 'ITC', legalName: 'ITC Ltd', mark: 'ITC' },
  { id: 'adani', name: 'Adani Wilmar', legalName: 'AWL Agri Business Ltd', mark: 'Fortune', logo: '/brand-logos/Forture Oil.png' },
  { id: 'nestle', name: 'Nestlé', legalName: 'Nestlé India Ltd', mark: 'NESTLÉ' },
  { id: 'mysoresandal', name: 'Mysore Sandal', legalName: 'Karnataka Soaps & Detergents Ltd', mark: 'Mysore Sandal', logo: '/brand-logos/Mysore Sandal.png' },
  { id: 'hul', name: 'HUL', legalName: 'Hindustan Unilever Ltd', mark: 'HUL' },
  { id: 'dabur', name: 'Dabur', legalName: 'Dabur India Ltd', mark: 'Dabur' },
  { id: 'tata', name: 'Tata', legalName: 'Tata Consumer Products Ltd', mark: 'TATA', logo: '/brand-logos/Tata.png' },
  { id: 'madhur', name: 'Madhur', legalName: 'Shree Renuka Sugars Ltd', mark: 'Madhur', logo: '/brand-logos/Madhur.png' },
  { id: 'grb', name: 'GRB', legalName: 'GRB Dairy Foods Pvt Ltd', mark: 'GRB', logo: '/brand-logos/GRB.png' },
  { id: 'gokul', name: 'Gokul', legalName: 'Gokul Agro Resources Ltd', mark: 'Gokul', logo: '/brand-logos/Gokul.png' },
  { id: 'mtr', name: 'MTR', legalName: 'MTR Foods Pvt Ltd', mark: 'MTR', logo: '/brand-logos/MTR.png' },
  { id: 'eastern', name: 'Eastern', legalName: 'Eastern Condiments Pvt Ltd', mark: 'Eastern', logo: '/brand-logos/Eastern.png' },
  { id: 'cycle', name: 'Cycle', legalName: 'N. Ranga Rao & Sons', mark: 'Cycle', logo: '/brand-logos/Cycle.png' },
  { id: 'priya', name: 'Priya Gold', legalName: 'Surya Food & Agro Ltd', mark: 'Priya Gold', logo: '/brand-logos/Priya Gold.png' },
  { id: 'vicco', name: 'Vicco', legalName: 'Vicco Laboratories', mark: 'Vicco', logo: '/brand-logos/Vicco.png' },
  { id: 'himalaya', name: 'Himalaya', legalName: 'Himalaya Wellness Company', mark: 'Himalaya', logo: '/brand-logos/Himalaya.png' },
  { id: 'everest', name: 'Everest', legalName: 'Everest Food Products Pvt Ltd', mark: 'Everest' },
  { id: 'colgate', name: 'Colgate', legalName: 'Colgate-Palmolive (India) Ltd', mark: 'Colgate' },
  { id: 'parle', name: 'Parle', legalName: 'Parle Products Pvt Ltd', mark: 'Parle' },
  { id: 'kaleesuwari', name: 'Kaleesuwari', legalName: 'Kaleesuwari Refinery Pvt Ltd', mark: 'Gold Winner' },
  { id: 'mkagro', name: 'MK Agrotech', legalName: 'MK Agrotech Pvt Ltd', mark: 'Sunpure' },
  { id: 'motherdairy', name: 'Mother Dairy', legalName: 'Mother Dairy Fruit & Vegetable Pvt Ltd', mark: 'Dhara' },
  { id: 'marico', name: 'Marico', legalName: 'Marico Ltd', mark: 'marico' },
  { id: 'valuechoice', name: 'Value Choice', legalName: 'Value Choice Foods', mark: 'Value Choice' },
  { id: 'rajdhani', name: 'Rajdhani', legalName: 'Rajdhani Flour Mills Ltd', mark: 'Rajdhani' },
  { id: 'natureland', name: 'Natureland', legalName: 'Natureland Organic Foods Pvt Ltd', mark: 'Natureland' },
  { id: 'srilalitha', name: 'Sri Lalitha', legalName: 'Sri Lalitha Enterprises', mark: 'Sri Lalitha', logo: '/brand-logos/Sri Lalitha.png' },
  { id: 'pg', name: 'P&G', legalName: 'Procter & Gamble India', mark: 'P&G' },
  { id: 'cavinkare', name: 'CavinKare', legalName: 'CavinKare Pvt Ltd', mark: 'CavinKare' },
];

const OWNER_OF_BRAND: Record<string, string> = {
  Freedom: 'gemini',
  Gemini: 'gemini',
  Aashirvaad: 'itc',
  Sunfeast: 'itc',
  Fortune: 'adani',
  Maggi: 'nestle',
  'Mysore Sandal': 'mysoresandal',
  'Surf Excel': 'hul',
  'Red Label': 'hul',
  Lifebuoy: 'hul',
  Vim: 'hul',
  'Close Up': 'hul',
  'Clinic Plus': 'hul',
  Dabur: 'dabur',
  Tata: 'tata',
  'Tata Sampann': 'tata',
  Soulfull: 'tata',
  'TT 1868': 'tata',
  Madhur: 'madhur',
  GRB: 'grb',
  Gokul: 'gokul',
  MTR: 'mtr',
  Eastern: 'eastern',
  Cycle: 'cycle',
  'Priya Gold': 'priya',
  Vicco: 'vicco',
  Himalaya: 'himalaya',
  Everest: 'everest',
  Colgate: 'colgate',
  'Parle-G': 'parle',
  'Gold Winner': 'kaleesuwari',
  Sunpure: 'mkagro',
  Dhara: 'motherdairy',
  Saffola: 'marico',
  'Value Choice': 'valuechoice',
  Rajdhani: 'rajdhani',
  Natureland: 'natureland',
  'Sri Lalitha': 'srilalitha',
  'Head & Shoulders': 'pg',
  Chik: 'cavinkare',
};

/* Where the catalogue's brand guess falls back to a product's first word
   (wholesale names, a few distributor ones), put the real brand back. */
const BRAND_ALIASES: Record<string, string> = {
  Gold: 'Gold Winner',
  Value: 'Value Choice',
  Clinic: 'Clinic Plus',
  Head: 'Head & Shoulders',
  TT: 'TT 1868',
};

/* ---- Companies, built from the catalogue ----------------------------------- */

const productsPerBrand = new Map<string, number>();
for (const card of SEARCH_CARDS.filter((c) => c.source === 'distributor')) {
  const brand = BRAND_ALIASES[card.brand] ?? card.brand;
  productsPerBrand.set(brand, (productsPerBrand.get(brand) ?? 0) + 1);
}

/** Every company that owns at least one brand in the app, its brands best-selling first. */
export const COMPANIES: Company[] = OWNERS.map((o) => ({
  ...o,
  brands: [...productsPerBrand]
    .filter(([brand]) => OWNER_OF_BRAND[brand] === o.id)
    .sort((a, b) => b[1] - a[1])
    .map(([brand]) => brand),
})).filter((c) => c.brands.length > 0);

export const companyById = (id: string) => COMPANIES.find((c) => c.id === id);

/* Brand logos: the app's own brand list first (the home screen's brand
   tiles), then the other logo files it ships. Brands missing here draw a
   wordmark tile until their logo is dropped into public/brand-logos. */
const BRAND_LOGOS: Record<string, string> = {
  ...Object.fromEntries(BRANDS.map((b) => [b.name, b.logo])),
  Fortune: '/brand-logos/Forture Oil.png',
  'Tata Sampann': '/brand-logos/Tata.png',
  'Sri Lalitha': '/brand-logos/Sri Lalitha.png',
};

export const brandLogo = (brand: string): string | undefined => BRAND_LOGOS[brand];

/* ---- Zones: where a shop is decides its timetable ------------------------- */

export interface Zone {
  id: string;
  name: string;
  /** Map places (data/places.ts) inside this beat area — its boundary. */
  places: string[];
  /** Pincodes in this beat area (as the admin sets them). */
  pincodes: string[];
  /** Locality names, for an address with no map place (last resort). */
  areas: string[];
  week: Record<Weekday, string[]>;
}

/* One area per locality, each with its own week — as the admin sets them
   up (an area = its pincodes + boundary, and its delivery days). A shop gets
   the week of the area its address is in. */
export const ZONES: Zone[] = [
  {
    id: 'hitech',
    name: 'Hitech City · Rai Durg',
    places: ['rai-durg', 'hitech-city'],
    pincodes: ['500032', '500081'],
    areas: ['Rai Durg', 'Hitech City'],
    // The walkthrough video's timetable, extended to the whole catalogue.
    week: {
      1: ['gemini', 'marico', 'priya', 'natureland'],
      2: ['hul', 'mtr', 'kaleesuwari', 'eastern', 'rajdhani', 'colgate', 'gokul'],
      3: ['mysoresandal', 'grb', 'cycle', 'pg', 'vicco'],
      4: ['dabur', 'himalaya', 'everest', 'cavinkare'],
      5: ['itc', 'adani', 'parle', 'nestle', 'srilalitha'],
      6: ['tata', 'madhur', 'mkagro', 'motherdairy', 'valuechoice'],
    },
  },
  {
    id: 'madhapur',
    name: 'Madhapur',
    places: ['madhapur', 'jubilee-hills'],
    pincodes: ['500081', '500033'],
    areas: ['Madhapur'],
    week: {
      1: ['dabur', 'himalaya', 'gokul', 'everest', 'cavinkare'],
      2: ['itc', 'adani', 'parle', 'nestle', 'srilalitha'],
      3: ['tata', 'madhur', 'mkagro', 'motherdairy', 'valuechoice'],
      4: ['gemini', 'colgate', 'marico', 'priya', 'natureland'],
      5: ['hul', 'mtr', 'kaleesuwari', 'eastern', 'rajdhani'],
      6: ['mysoresandal', 'grb', 'cycle', 'pg', 'vicco'],
    },
  },
  {
    id: 'gachibowli',
    name: 'Gachibowli',
    places: ['gachibowli'],
    pincodes: ['500032'],
    areas: ['Gachibowli'],
    week: {
      1: ['hul', 'tata', 'priya', 'natureland', 'mkagro', 'gemini', 'grb', 'adani'],
      2: ['itc', 'colgate', 'marico', 'nestle', 'himalaya'],
      3: ['dabur', 'pg', 'eastern', 'madhur', 'valuechoice'],
      4: ['gokul', 'kaleesuwari', 'vicco'],
      5: ['mtr', 'parle', 'rajdhani', 'motherdairy'],
      6: ['mysoresandal', 'cycle', 'everest', 'cavinkare', 'srilalitha'],
    },
  },
  {
    id: 'kondapur',
    name: 'Kondapur',
    places: ['kondapur', 'kothaguda'],
    pincodes: ['500084'],
    areas: ['Kondapur'],
    week: {
      1: ['dabur', 'itc', 'nestle', 'vicco', 'rajdhani', 'valuechoice'],
      2: ['adani', 'priya', 'gokul', 'cavinkare', 'srilalitha'],
      3: ['tata', 'colgate', 'pg', 'natureland', 'kaleesuwari'],
      4: ['marico', 'gemini', 'hul', 'eastern', 'motherdairy'],
      5: ['mtr', 'parle', 'himalaya', 'everest'],
      6: ['mysoresandal', 'grb', 'cycle', 'madhur', 'mkagro'],
    },
  },
  {
    id: 'miyapur',
    name: 'Miyapur · Kukatpally',
    places: ['miyapur', 'kukatpally'],
    pincodes: ['500049', '500072'],
    areas: ['Miyapur', 'Kukatpally'],
    week: {
      1: ['marico', 'gemini', 'hul', 'eastern', 'motherdairy'],
      2: ['mtr', 'parle', 'himalaya', 'everest'],
      3: ['mysoresandal', 'grb', 'cycle', 'madhur', 'mkagro'],
      4: ['dabur', 'itc', 'nestle', 'vicco', 'rajdhani', 'valuechoice'],
      5: ['adani', 'priya', 'gokul', 'cavinkare', 'srilalitha'],
      6: ['tata', 'colgate', 'pg', 'natureland', 'kaleesuwari'],
    },
  },
  {
    id: 'tolichowki',
    name: 'Tolichowki',
    places: [],
    pincodes: ['500008'],
    areas: ['Tolichowki'],
    week: {
      1: ['gemini', 'grb', 'gokul', 'kaleesuwari', 'vicco'],
      2: ['adani', 'mtr', 'parle', 'rajdhani', 'motherdairy'],
      3: ['mysoresandal', 'cycle', 'everest', 'cavinkare', 'srilalitha'],
      4: ['hul', 'tata', 'priya', 'natureland', 'mkagro'],
      5: ['itc', 'colgate', 'marico', 'nestle', 'himalaya'],
      6: ['dabur', 'pg', 'eastern', 'madhur', 'valuechoice'],
    },
  },
];

/** Where a shop is: the map place it was pinned at, its pincode, its address text. */
export interface ShopLocation {
  placeId?: string;
  pincode?: string;
  text?: string;
}

/** The beat area for a shop's location, so its time table follows where it is:
 *  1. the area whose places include the shop's map place (its boundary);
 *  2. else the one area with that pincode (a pincode shared by two areas can't decide);
 *  3. else the area whose locality name appears in the address.
 *  None of these → undefined: the shop isn't on a beat yet, and the screen
 *  says so rather than showing another area's days. */
export const zoneForLocation = ({ placeId, pincode, text }: ShopLocation): Zone | undefined => {
  if (placeId) {
    const byPlace = ZONES.find((z) => z.places.includes(placeId));
    if (byPlace) return byPlace;
  }
  if (pincode) {
    const byPin = ZONES.filter((z) => z.pincodes.includes(pincode));
    if (byPin.length === 1) return byPin[0];
  }
  const t = (text ?? '').toLowerCase();
  return t ? ZONES.find((z) => z.areas.some((a) => t.includes(a.toLowerCase()))) : undefined;
};

/* ---- Days ----------------------------------------------------------------- */

const DAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface ScheduleDay {
  date: Date;
  weekday: Weekday;
  /** "THU" */
  short: string;
  /** "Thursday" */
  long: string;
  /** "Thursday" — weekday only: beat days are fixed, so the timetable never shows dates. */
  title: string;
  /** "Saturday" */
  sub: string;
  /** 0 = today, 1 = tomorrow, … */
  offset: number;
  companies: Company[];
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** The next six delivery days from today (Sunday skipped), with that zone's companies. */
export function nextDeliveryDays(zone: Zone, today = new Date(), count = 6): ScheduleDay[] {
  const out: ScheduleDay[] = [];
  const base = startOfDay(today);
  for (let i = 0; out.length < count && i < 14; i++) {
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const dow = date.getDay();
    if (dow === 0) continue;
    const weekday = dow as Weekday;
    out.push({
      date,
      weekday,
      short: DAY_SHORT[dow],
      long: DAY_LONG[dow],
      title: DAY_LONG[dow],
      sub: DAY_LONG[dow],
      offset: i,
      companies: zone.week[weekday].map((id) => companyById(id)!).filter(Boolean),
    });
  }
  return out;
}

/** The weekday a company delivers in a zone, if any. */
export const companyDay = (zone: Zone, companyId: string): Weekday | undefined =>
  ([1, 2, 3, 4, 5, 6] as Weekday[]).find((w) => zone.week[w].includes(companyId));

export const weekdayName = (w: Weekday) => DAY_LONG[w];
