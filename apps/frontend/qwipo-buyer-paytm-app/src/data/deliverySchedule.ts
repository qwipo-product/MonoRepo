// Delivery Schedule — which company's authorised distributors deliver to the
// buyer's area on which day of the week, so a retailer can plan what to order
// and when. Source: the business team's "Day wise time table for brands" sheet.
//
// The sheet's rules, as built here:
// - Publish the COMPANY, not its brands — "Emami", never "Zandu" or "Mentho
//   Plus". A company's brands are listed on its own distributor page instead.
// - At most five companies a day, best sellers first; the table can't hold
//   every brand.
// - No deliveries on Sunday.
//
// Distributor ids point into DISTRIBUTORS (home.ts), so tapping one opens a
// storefront that actually has stock.

import { DISTRIBUTORS, type Distributor } from './home';

export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface ScheduleCompany {
  id: string;
  /** What the tile says — the name a retailer calls the company by. */
  name: string;
  /** Registered name, shown on the company's own page. */
  legalName: string;
  logo: string;
  /** The company's brands a retailer would recognise, best sellers first. */
  brands: string[];
  day: Weekday;
  /** Authorised distributors serving the buyer's area, with the minimum
   *  order each one takes for this company's goods. */
  distributors: { id: string; mov: number }[];
}

export const SCHEDULE_COMPANIES: ScheduleCompany[] = [
  // Monday
  {
    id: 'colgate', name: 'Colgate', legalName: 'Colgate-Palmolive (India) Ltd', logo: '/company-logos/colgate.svg',
    brands: ['Colgate', 'Palmolive', 'Charmis'], day: 'Monday',
    distributors: [{ id: 'd1', mov: 2000 }, { id: 'd5', mov: 3000 }],
  },
  {
    id: 'marico', name: 'Marico', legalName: 'Marico Ltd', logo: '/company-logos/marico.svg',
    brands: ['Parachute', 'Saffola', 'Nihar', 'Set Wet'], day: 'Monday',
    distributors: [{ id: 'd6', mov: 2500 }, { id: 'd3', mov: 2000 }],
  },
  {
    id: 'gemini', name: 'Gemini', legalName: 'Gemini Edible & Fats India Ltd', logo: '/brand-logos/Freedon Oil.png',
    brands: ['Freedom'], day: 'Monday',
    distributors: [{ id: 'd1', mov: 5000 }],
  },
  {
    id: 'golddrop', name: 'Gold Drop', legalName: 'Gold Drop', logo: '/brand-logos/Gold Drop.png',
    brands: ['Gold Drop'], day: 'Monday',
    distributors: [{ id: 'd3', mov: 4000 }],
  },

  // Tuesday
  {
    id: 'hul', name: 'HUL', legalName: 'Hindustan Unilever Ltd', logo: '/company-logos/hul.svg',
    brands: ['Surf Excel', 'Lifebuoy', 'Dove', 'Brooke Bond', 'Vim'], day: 'Tuesday',
    distributors: [{ id: 'd2', mov: 3000 }, { id: 'd1', mov: 2500 }, { id: 'd5', mov: 3000 }],
  },
  {
    id: 'mtr', name: 'MTR', legalName: 'MTR Foods Pvt Ltd', logo: '/brand-logos/MTR.png',
    brands: ['MTR', 'Eastern'], day: 'Tuesday',
    distributors: [{ id: 'd5', mov: 1500 }],
  },
  {
    id: 'ajay', name: 'Ajay', legalName: 'Ajay', logo: '/brand-logos/Ajy.png',
    brands: ['Ajay'], day: 'Tuesday',
    distributors: [{ id: 'd4', mov: 1500 }],
  },

  // Wednesday
  {
    id: 'ksdl', name: 'KSDL', legalName: 'Karnataka Soaps & Detergents Ltd', logo: '/brand-logos/Mysore Sandal.png',
    brands: ['Mysore Sandal'], day: 'Wednesday',
    distributors: [{ id: 'd2', mov: 5000 }],
  },
  {
    id: 'grb', name: 'GRB', legalName: 'GRB Dairy Foods Pvt Ltd', logo: '/brand-logos/GRB.png',
    brands: ['GRB Ghee', 'GRB Butter'], day: 'Wednesday',
    distributors: [{ id: 'd4', mov: 2000 }],
  },
  {
    id: 'cycle', name: 'NR Group', legalName: 'N. Ranga Rao & Sons Pvt Ltd', logo: '/brand-logos/Cycle.png',
    brands: ['Cycle', 'Lia', 'Rhythm'], day: 'Wednesday',
    distributors: [{ id: 'd6', mov: 1500 }],
  },

  // Thursday
  {
    id: 'emami', name: 'Emami', legalName: 'Emami Ltd', logo: '/company-logos/emami.svg',
    brands: ['Navratna', 'Boro Plus', 'Zandu', 'Mentho Plus', 'Kesh King'], day: 'Thursday',
    distributors: [{ id: 'd2', mov: 2500 }, { id: 'd6', mov: 2000 }],
  },
  {
    id: 'dabur', name: 'Dabur', legalName: 'Dabur India Ltd', logo: '/company-logos/dabur.svg',
    brands: ['Dabur Red', 'Real', 'Vatika', 'Hajmola', 'Odonil'], day: 'Thursday',
    distributors: [{ id: 'd1', mov: 2000 }, { id: 'd3', mov: 2500 }],
  },
  {
    id: 'cholayil', name: 'Cholayil', legalName: 'Cholayil Pvt Ltd', logo: '/company-logos/cholayil.svg',
    brands: ['Medimix', 'Krishna Thulasi'], day: 'Thursday',
    distributors: [{ id: 'd4', mov: 1500 }],
  },

  // Friday
  {
    id: 'itc', name: 'ITC', legalName: 'ITC Ltd', logo: '/company-logos/itc.svg',
    brands: ['Aashirvaad', 'Sunfeast', 'Bingo!', 'Yippee!', 'Savlon'], day: 'Friday',
    distributors: [{ id: 'd1', mov: 2000 }, { id: 'd2', mov: 3000 }, { id: 'd5', mov: 2500 }],
  },
  {
    id: 'haldiram', name: "Haldiram's", legalName: "Haldiram's", logo: '/company-logos/haldirams.svg',
    brands: ["Haldiram's Namkeen", "Haldiram's Sweets"], day: 'Friday',
    distributors: [{ id: 'd3', mov: 2000 }],
  },

  // Saturday
  {
    id: 'patanjali', name: 'Patanjali', legalName: 'Patanjali Foods Ltd', logo: '/company-logos/patanjali.svg',
    brands: ['Ruchi Gold', 'Nutrela', 'Mahakosh'], day: 'Saturday',
    distributors: [{ id: 'd6', mov: 4000 }],
  },
  {
    id: 'tata', name: 'Tata Consumer', legalName: 'Tata Consumer Products Ltd', logo: '/brand-logos/Tata.png',
    brands: ['Tata Tea', 'Tata Salt', 'Tata Sampann'], day: 'Saturday',
    distributors: [{ id: 'd7', mov: 2000 }],
  },
];

export const WEEKDAYS: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Most companies the sheet allows on one day. */
const MAX_PER_DAY = 5;

/** The companies delivering on a day, best sellers first (data order). */
export const companiesOn = (day: Weekday) =>
  SCHEDULE_COMPANIES.filter((c) => c.day === day).slice(0, MAX_PER_DAY);

export const scheduleCompanyById = (id: string) => SCHEDULE_COMPANIES.find((c) => c.id === id);

/** A company's distributors, resolved to the sellers the storefront opens. */
export const distributorsFor = (c: ScheduleCompany): (Distributor & { mov: number })[] =>
  c.distributors.flatMap(({ id, mov }) => {
    const d = DISTRIBUTORS.find((x) => x.id === id);
    return d ? [{ ...d, mov }] : [];
  });

/* Dates. The schedule is a weekly cycle; the screen pins it to real dates so
   "Thursday" reads as "this Thursday, 8 Oct" or "next Monday, 12 Oct". */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** JS getDay() index → Weekday (Sunday has no deliveries → null). */
export const weekdayOf = (d: Date): Weekday | null => (d.getDay() === 0 ? null : WEEKDAYS[d.getDay() - 1]);

/** The next date this weekday falls on, counting today. */
export function nextDateOf(day: Weekday, from = new Date()): Date {
  const target = WEEKDAYS.indexOf(day) + 1; // Mon = 1 … Sat = 6
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + ((target - d.getDay() + 7) % 7));
  return d;
}

/** "8 Oct" */
export const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

/** "Today" / "Tomorrow" / "Mon, 12 Oct" — how far off a delivery day is. */
export function whenLabel(day: Weekday, from = new Date()): string {
  const d = nextDateOf(day, from);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${day.slice(0, 3)}, ${shortDate(d)}`;
}
