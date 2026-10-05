// Gated catalogues that sell only to customers registered in a company's DMS
// (Distributor Management System). Every company follows the same flow: the
// shop registers with the company directly — already a customer (link the
// customer ID) or new (share KYC) — and the catalogue stays locked until the
// company approves. Separate from DISTRIBUTORS in home.ts: those are open
// sellers.

// none → pending (request sent) → review (verifying) → registered
// or rejected (re-apply allowed).
export type DmsStatus = 'none' | 'pending' | 'review' | 'registered' | 'rejected';

/** A company with a gated catalogue, registered with directly. */
export interface DmsCompany {
  id: string;
  company: string;
  /** Short name used in sentences ("Already a customer of TCPL?"). */
  shortName?: string;
  emoji: string;
  brands: string[];
  products: number;
  /** Placeholder format shown in the customer-ID field. */
  idHint: string;
  rejectedReason?: string;
}

/* TCPL and HUL start unregistered so the flow can be walked end to end; the
   rest start at a fixed status (see App) to show how each one looks. */
export const DMS_COMPANIES: DmsCompany[] = [
  {
    id: 'tcpl',
    company: 'Tata Consumer Products (TCPL)',
    shortName: 'TCPL',
    emoji: '🫖',
    brands: ['Tata Tea', 'Tata Salt', 'Tata Sampann', 'Tetley', 'Himalayan'],
    products: 126,
    idHint: 'e.g. TCPL-48210',
  },
  {
    id: 'hul',
    company: 'Hindustan Unilever (HUL)',
    shortName: 'HUL',
    emoji: '🧴',
    brands: ['Surf Excel', 'Dove', 'Lifebuoy', 'Brooke Bond', 'Horlicks'],
    products: 240,
    idHint: 'e.g. HUL-33812',
  },
  {
    id: 'pepsico',
    company: 'PepsiCo India',
    shortName: 'PepsiCo',
    emoji: '🥤',
    brands: ["Lay's", 'Kurkure', 'Pepsi', 'Tropicana'],
    products: 212,
    idHint: 'e.g. PEP-582104',
  },
  {
    id: 'marico',
    company: 'Marico',
    emoji: '🥥',
    brands: ['Parachute', 'Saffola', 'Livon'],
    products: 96,
    idHint: 'e.g. MRC-77451',
  },
  {
    id: 'colgate',
    company: 'Colgate-Palmolive',
    shortName: 'Colgate',
    emoji: '🪥',
    brands: ['Colgate', 'Palmolive', 'Halo'],
    products: 148,
    idHint: 'e.g. CLG-102938',
  },
  {
    id: 'itc',
    company: 'ITC',
    emoji: '🍪',
    brands: ['Sunfeast', 'Bingo!', 'Yippee!', 'Aashirvaad'],
    products: 183,
    idHint: 'e.g. ITC-90312',
    rejectedReason: 'GSTIN could not be verified against the shop address on record.',
  },
];

export const dmsCompanyById = (id: string) => DMS_COMPANIES.find((c) => c.id === id);
