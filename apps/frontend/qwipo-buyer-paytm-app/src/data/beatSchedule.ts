import { DISTRIBUTORS, type Distributor } from './home';
import { deliveryFor } from './delivery';

/* Delivery / Beat Schedule — which COMPANY's distributors deliver to an area
   on which day, so a retailer (or the salesperson ordering for them) can order
   the day before the van comes.

   Companies, not brands: "Emami", not Zandu or Mentho Plus. At most five
   companies a day; no deliveries on Sunday.

   PLACEHOLDER DATA. Zone A is the timetable from the walkthrough video; zones
   B and C reuse the same companies on other days so switching customers
   visibly changes the schedule. Real days per area come from the business
   team's day-wise sheet; real logos replace the wordmark tiles. */

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
  brands: string[];
  /** Authorised distributors that carry this company (ids from DISTRIBUTORS). */
  distributorIds: string[];
}

export const COMPANIES: Company[] = [
  { id: 'emami', name: 'Emami', legalName: 'Emami Ltd', mark: 'emami', brands: ['Zandu', 'Mentho Plus', 'Navratna', 'Boroplus'], distributorIds: ['d1', 'd5'] },
  { id: 'dabur', name: 'Dabur', legalName: 'Dabur India Ltd', mark: 'Dabur', brands: ['Real', 'Dabur Red', 'Vatika', 'Hajmola'], distributorIds: ['d2', 'd6'] },
  { id: 'cholayil', name: 'Cholayil', legalName: 'Cholayil Pvt Ltd', mark: 'Cholayil', brands: ['Medimix', 'Cuticura'], distributorIds: ['d4'] },
  { id: 'itc', name: 'ITC', legalName: 'ITC Ltd', mark: 'ITC', brands: ['Aashirvaad', 'Sunfeast', 'Bingo!', 'Yippee!', 'Savlon'], distributorIds: ['d1', 'd2', 'd5'] },
  { id: 'haldirams', name: "Haldiram's", legalName: "Haldiram's Snacks Pvt Ltd", mark: "Haldiram's", brands: ['Namkeen', 'Sweets', 'Ready to Eat'], distributorIds: ['d6'] },
  { id: 'patanjali', name: 'Patanjali', legalName: 'Patanjali Ayurved Ltd', mark: 'Patanjali', brands: ['Dant Kanti', 'Patanjali Atta', 'Cow Ghee'], distributorIds: ['d4', 'd6'] },
  { id: 'tata', name: 'Tata', legalName: 'Tata Consumer Products Ltd', logo: '/brand-logos/Tata.png', mark: 'TATA', brands: ['Tata Salt', 'Tata Tea', 'Tata Sampann'], distributorIds: ['d7', 'd1'] },
  { id: 'colgate', name: 'Colgate', legalName: 'Colgate-Palmolive (India) Ltd', mark: 'Colgate', brands: ['Colgate', 'Palmolive'], distributorIds: ['d2', 'd5'] },
  { id: 'marico', name: 'Marico', legalName: 'Marico Ltd', mark: 'marico', brands: ['Parachute', 'Saffola', 'Nihar'], distributorIds: ['d1', 'd6'] },
  { id: 'gemini', name: 'Gemini', legalName: 'Gemini Edibles & Fats India Ltd', logo: '/brand-logos/Freedon Oil.png', mark: 'Freedom', brands: ['Freedom'], distributorIds: ['d1'] },
  { id: 'golddrop', name: 'Gold Drop', legalName: 'Gold Drop Oils Pvt Ltd', logo: '/brand-logos/Gold Drop.png', mark: 'Gold Drop', brands: ['Gold Drop'], distributorIds: ['d4'] },
  { id: 'hul', name: 'HUL', legalName: 'Hindustan Unilever Ltd', mark: 'HUL', brands: ['Surf Excel', 'Lifebuoy', 'Brooke Bond', 'Kissan'], distributorIds: ['d2', 'd5', 'd6'] },
  { id: 'mtr', name: 'MTR', legalName: 'MTR Foods Pvt Ltd', logo: '/brand-logos/MTR.png', mark: 'MTR', brands: ['MTR'], distributorIds: ['d5'] },
  { id: 'ajay', name: 'Ajay', legalName: 'Ajay Products', logo: '/brand-logos/Ajy.png', mark: 'Ajay', brands: ['Ajay'], distributorIds: ['d4'] },
  { id: 'mysoresandal', name: 'Mysore Sandal', legalName: 'Karnataka Soaps & Detergents Ltd', logo: '/brand-logos/Mysore Sandal.png', mark: 'Mysore Sandal', brands: ['Mysore Sandal'], distributorIds: ['d2'] },
  { id: 'grb', name: 'GRB', legalName: 'GRB Dairy Foods Pvt Ltd', logo: '/brand-logos/GRB.png', mark: 'GRB', brands: ['GRB Ghee'], distributorIds: ['d6'] },
  { id: 'cycle', name: 'Cycle', legalName: 'N. Ranga Rao & Sons', logo: '/brand-logos/Cycle.png', mark: 'Cycle', brands: ['Cycle Agarbatti'], distributorIds: ['d4'] },
];

export const companyById = (id: string) => COMPANIES.find((c) => c.id === id);

/* ---- Zones: where a shop is decides its timetable ------------------------- */

export interface Zone {
  id: string;
  name: string;
  /** Areas (as they appear in an address) that fall in this zone. */
  areas: string[];
  week: Record<Weekday, string[]>;
}

export const ZONES: Zone[] = [
  {
    id: 'A',
    name: 'Hitech City · Madhapur',
    areas: ['Hitech City', 'Madhapur', 'Gachibowli'],
    // The walkthrough video's timetable.
    week: {
      1: ['colgate', 'marico', 'gemini', 'golddrop'],
      2: ['hul', 'mtr', 'ajay'],
      3: ['mysoresandal', 'grb', 'cycle'],
      4: ['emami', 'dabur', 'cholayil'],
      5: ['itc', 'haldirams'],
      6: ['patanjali', 'tata'],
    },
  },
  {
    id: 'B',
    name: 'Kondapur · Miyapur · Kukatpally',
    areas: ['Kondapur', 'Miyapur', 'Kukatpally'],
    week: {
      1: ['emami', 'dabur', 'itc'],
      2: ['cholayil', 'haldirams', 'patanjali'],
      3: ['tata', 'colgate'],
      4: ['marico', 'gemini', 'golddrop', 'hul'],
      5: ['mtr', 'ajay'],
      6: ['mysoresandal', 'grb', 'cycle'],
    },
  },
  {
    id: 'C',
    name: 'Tolichowki',
    areas: ['Tolichowki'],
    week: {
      1: ['hul', 'tata'],
      2: ['itc', 'colgate', 'marico'],
      3: ['emami', 'haldirams'],
      4: ['gemini', 'golddrop', 'grb'],
      5: ['dabur', 'cholayil', 'patanjali', 'mtr'],
      6: ['ajay', 'mysoresandal', 'cycle'],
    },
  },
];

/** The zone for an address — the first zone whose area appears in it; zone A otherwise. */
export const zoneForAddress = (address: string): Zone =>
  ZONES.find((z) => z.areas.some((a) => address.toLowerCase().includes(a.toLowerCase()))) ?? ZONES[0];

/** The customer app's own shop (Sri Venkateswara Kirana Store, Hitech City). */
export const OWN_SHOP_ADDRESS = 'Shop 12, Rai Durg Main Road, Hitech City';

/* ---- Days ----------------------------------------------------------------- */

const DAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface ScheduleDay {
  date: Date;
  weekday: Weekday;
  /** "THU" */
  short: string;
  /** "Thursday" */
  long: string;
  /** "Thursday, 8 Oct" */
  title: string;
  /** "Sat, 10 Oct" */
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
      title: `${DAY_LONG[dow]}, ${date.getDate()} ${MONTH[date.getMonth()]}`,
      sub: `${DAY_LONG[dow].slice(0, 3)}, ${date.getDate()} ${MONTH[date.getMonth()]}`,
      offset: i,
      companies: zone.week[weekday].map((id) => companyById(id)!).filter(Boolean),
    });
  }
  return out;
}

/** "Today" / "Tomorrow" / "Sat, 10 Oct" for a day offset. */
export const relativeLabel = (d: ScheduleDay) => (d.offset === 0 ? 'Today' : d.offset === 1 ? 'Tomorrow' : d.sub);

/** The weekday a company delivers in a zone, if any. */
export const companyDay = (zone: Zone, companyId: string): Weekday | undefined =>
  ([1, 2, 3, 4, 5, 6] as Weekday[]).find((w) => zone.week[w].includes(companyId));

export const weekdayName = (w: Weekday) => DAY_LONG[w];

/** A company's authorised distributors, with the minimum order each one sets. */
export const distributorsFor = (c: Company): (Distributor & { mov: number })[] =>
  c.distributorIds
    .map((id) => DISTRIBUTORS.find((d) => d.id === id))
    .filter((d): d is Distributor => !!d)
    .map((d) => ({ ...d, mov: deliveryFor(d.name).options[0]?.mov ?? 2000 }));
