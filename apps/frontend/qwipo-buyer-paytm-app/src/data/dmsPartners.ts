// Gated catalogues that sell only to customers registered in a DMS
// (Distributor Management System). Two ways to register:
//  – with a COMPANY (ITC, Colgate, …): one registration with the company, which
//    is served by one or more of its authorised distributors in the area;
//  – with a DISTRIBUTOR directly (Balaji Enterprises for TCPL, …): the
//    distributor runs its own DMS and approves the shop itself.
// Until approved the catalogue stays locked. Separate from DISTRIBUTORS in
// home.ts: those are open sellers.

// none → pending (request sent) → review (verifying) → registered
// or rejected (re-apply allowed).
export type DmsStatus = 'none' | 'pending' | 'review' | 'registered' | 'rejected';

/** A distributor operating a DMS — either under a company or registered with directly. */
export interface DmsDistributor {
  id: string;
  name: string;
  emoji: string;
  /** Companies whose stock this distributor carries (e.g. TCPL). */
  serves: string[];
  brands: string[];
  products: number;
  area: string;
  address: string;
  distanceKm: number;
  contactName: string;
  phone: string;
  beatDays: string;
  deliveryTime: string;
  mov: number;
  /** Shops currently registered in this distributor's DMS. */
  outlets: number;
  /** Placeholder format shown in the customer-ID field (direct registration). */
  idHint: string;
  rejectedReason?: string;
}

/** A company with a gated catalogue, served by its authorised distributors. */
export interface DmsCompany {
  id: string;
  company: string;
  /** Short name used in sentences ("Already a customer of TCPL?"). */
  shortName?: string;
  /** Registers with the company directly — no distributor page in between. */
  direct?: boolean;
  emoji: string;
  brands: string[];
  products: number;
  /** Authorised distributors serving this shop's area — DMS_DISTRIBUTOR ids. */
  distributorIds: string[];
  idHint: string;
  rejectedReason?: string;
}

/** Distributors that sit under a company (shown on the company page) … */
const COMPANY_DISTRIBUTORS: DmsDistributor[] = [
  {
    id: 'golden',
    name: 'Golden Distributors',
    emoji: '🏬',
    serves: ['ITC'],
    brands: ['Sunfeast', 'Bingo!', 'Yippee!', 'Aashirvaad'],
    products: 183,
    area: 'Hitech City, Madhapur, Kondapur',
    address: 'Plot 42, Ayyappa Society, Madhapur, Hyderabad',
    distanceKm: 2.4,
    contactName: 'Srinivas Rao',
    phone: '98480 22314',
    beatDays: 'Mon · Thu',
    deliveryTime: 'Next day',
    mov: 3000,
    outlets: 1240,
    idHint: 'e.g. GLD-40218',
  },
  {
    id: 'sri-lakshmi',
    name: 'Sri Lakshmi Agencies',
    emoji: '🏪',
    serves: ['ITC'],
    brands: ['Sunfeast', 'Bingo!', 'Classmate', 'Savlon'],
    products: 164,
    area: 'Gachibowli, Raidurg, Nanakramguda',
    address: '3-12, Main Road, Gachibowli, Hyderabad',
    distanceKm: 4.1,
    contactName: 'Lakshmi Narayana',
    phone: '99630 81127',
    beatDays: 'Tue · Fri',
    deliveryTime: 'Same day before 11 AM',
    mov: 2500,
    outlets: 860,
    idHint: 'e.g. SLA-11872',
  },
  {
    id: 'daily',
    name: 'Daily Agencies',
    emoji: '🏬',
    serves: ['Colgate-Palmolive'],
    brands: ['Colgate', 'Palmolive', 'Halo'],
    products: 148,
    area: 'Madhapur, Jubilee Hills',
    address: '8-2-293, Road No. 36, Jubilee Hills, Hyderabad',
    distanceKm: 3.2,
    contactName: 'Ramesh Babu',
    phone: '98490 55120',
    beatDays: 'Wed',
    deliveryTime: 'Next day',
    mov: 2000,
    outlets: 940,
    idHint: 'e.g. CLG-102938',
  },
  {
    id: 'aviso',
    name: 'Aviso Sales & Distribution',
    emoji: '🏬',
    serves: ['PepsiCo India'],
    brands: ["Lay's", 'Kurkure', 'Pepsi', 'Tropicana'],
    products: 212,
    area: 'Hitech City, Kukatpally',
    address: 'Survey 64, Kukatpally Industrial Area, Hyderabad',
    distanceKm: 6.8,
    contactName: 'Anil Kumar',
    phone: '90000 47781',
    beatDays: 'Mon · Wed · Sat',
    deliveryTime: 'Next day',
    mov: 2500,
    outlets: 2100,
    idHint: 'e.g. PEP-582104',
  },
  {
    id: 'sri-venkata',
    name: 'Sri Venkata Agencies',
    emoji: '🏬',
    serves: ['Marico'],
    brands: ['Parachute', 'Saffola', 'Livon'],
    products: 96,
    area: 'Kondapur, Miyapur',
    address: '2-48, Botanical Garden Road, Kondapur, Hyderabad',
    distanceKm: 3.9,
    contactName: 'Venkatesh',
    phone: '98660 31245',
    beatDays: 'Thu',
    deliveryTime: 'Next day',
    mov: 2000,
    outlets: 620,
    idHint: 'e.g. MRC-77451',
  },
  {
    id: 'sri-sai',
    name: 'Sri Sai Marketing',
    emoji: '🏬',
    serves: ['Hindustan Unilever'],
    brands: ['Surf Excel', 'Dove', 'Horlicks'],
    products: 240,
    area: 'Hitech City, Gachibowli',
    address: '1-90, Kothaguda X Roads, Hyderabad',
    distanceKm: 2.9,
    contactName: 'Sai Prasad',
    phone: '97010 66420',
    beatDays: 'Tue · Sat',
    deliveryTime: 'Next day',
    mov: 3000,
    outlets: 1580,
    idHint: 'e.g. HUL-33812',
  },
];

/** … and distributors a shop registers with directly (Register by Distributor tab). */
export const DMS_DISTRIBUTORS: DmsDistributor[] = [
  {
    id: 'balaji',
    name: 'Balaji Enterprises',
    emoji: '🫖',
    serves: ['Tata Consumer Products (TCPL)'],
    brands: ['Tata Tea', 'Tata Salt', 'Tata Sampann', 'Tetley', 'Himalayan'],
    products: 126,
    area: 'Hitech City, Madhapur, Raidurg',
    address: '5-4-187, Opp. Raidurg Metro, Hyderabad',
    distanceKm: 1.8,
    contactName: 'Balaji Reddy',
    phone: '98855 73302',
    beatDays: 'Mon · Thu',
    deliveryTime: 'Next day',
    mov: 2500,
    outlets: 730,
    idHint: 'e.g. BAL-20915',
  },
  {
    id: 'sri-ganesh',
    name: 'Sri Ganesh Traders',
    emoji: '🍪',
    serves: ['Britannia', 'Dabur'],
    brands: ['Good Day', 'Marie Gold', 'Real', 'Dabur Honey'],
    products: 154,
    area: 'Kondapur, Gachibowli',
    address: '12-3, Hafeezpet Road, Kondapur, Hyderabad',
    distanceKm: 3.4,
    contactName: 'Ganesh Gupta',
    phone: '99089 41120',
    beatDays: 'Wed · Sat',
    deliveryTime: 'Next day',
    mov: 2000,
    outlets: 510,
    idHint: 'e.g. SGT-55301',
  },
  {
    id: 'mahalakshmi',
    name: 'Mahalakshmi Distributors',
    emoji: '🧃',
    serves: ['Nestlé India'],
    brands: ['Maggi', 'Nescafé', 'KitKat'],
    products: 118,
    area: 'Madhapur, Jubilee Hills',
    address: '6-3-1090, Somajiguda, Hyderabad',
    distanceKm: 5.6,
    contactName: 'Mahesh',
    phone: '98490 10087',
    beatDays: 'Tue',
    deliveryTime: 'Next day',
    mov: 3000,
    outlets: 980,
    idHint: 'e.g. MLD-77120',
    rejectedReason: 'Shop address is outside our current delivery beat. We will notify you once we start serving Raidurg.',
  },
];

export const DMS_COMPANIES: DmsCompany[] = [
  {
    id: 'itc',
    company: 'ITC',
    emoji: '🍪',
    brands: ['Sunfeast', 'Bingo!', 'Yippee!', 'Aashirvaad'],
    products: 183,
    distributorIds: ['golden', 'sri-lakshmi'],
    idHint: 'e.g. ITC-90312',
  },
  {
    id: 'tcpl',
    company: 'Tata Consumer Products (TCPL)',
    shortName: 'TCPL',
    direct: true,
    emoji: '🫖',
    brands: ['Tata Tea', 'Tata Salt', 'Tata Sampann', 'Tetley', 'Himalayan'],
    products: 126,
    distributorIds: [],
    idHint: 'e.g. TCPL-48210',
  },
  {
    id: 'colgate',
    company: 'Colgate-Palmolive',
    emoji: '🪥',
    brands: ['Colgate', 'Palmolive', 'Halo'],
    products: 148,
    distributorIds: ['daily'],
    idHint: 'e.g. CLG-102938',
  },
  {
    id: 'pepsico',
    company: 'PepsiCo India',
    emoji: '🥤',
    brands: ["Lay's", 'Kurkure', 'Pepsi', 'Tropicana'],
    products: 212,
    distributorIds: ['aviso'],
    idHint: 'e.g. PEP-582104',
  },
  {
    id: 'marico',
    company: 'Marico',
    emoji: '🥥',
    brands: ['Parachute', 'Saffola', 'Livon'],
    products: 96,
    distributorIds: ['sri-venkata'],
    idHint: 'e.g. MRC-77451',
  },
  {
    id: 'hul',
    company: 'Hindustan Unilever',
    emoji: '🧴',
    brands: ['Surf Excel', 'Dove', 'Horlicks'],
    products: 240,
    distributorIds: ['sri-sai'],
    idHint: 'e.g. HUL-33812',
    rejectedReason: 'GSTIN could not be verified against the shop address on record.',
  },
];

const ALL_DISTRIBUTORS = [...COMPANY_DISTRIBUTORS, ...DMS_DISTRIBUTORS];

export const dmsCompanyById = (id: string) => DMS_COMPANIES.find((c) => c.id === id);
export const dmsDistributorById = (id: string) => ALL_DISTRIBUTORS.find((d) => d.id === id);
export const companyDistributors = (c: DmsCompany) =>
  c.distributorIds.map(dmsDistributorById).filter(Boolean) as DmsDistributor[];
