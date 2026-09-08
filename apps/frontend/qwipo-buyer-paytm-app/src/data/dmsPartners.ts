// Company distributors that sell only to customers registered in their own
// DMS (Distributor Management System). A buyer either links an existing
// customer ID or requests a new registration — until approved, the company's
// catalogue stays locked. Separate from DISTRIBUTORS: those are open sellers.

// none → pending (request sent) → review (distributor verifying) → registered
// or rejected (re-apply allowed).
export type DmsStatus = 'none' | 'pending' | 'review' | 'registered' | 'rejected';

export interface DmsPartner {
  id: string;
  /** The company whose catalogue is gated (Colgate, PepsiCo, …). */
  company: string;
  /** The local authorised distributor operating that company's DMS. */
  distributor: string;
  emoji: string;
  /** Sample brands shown on the card so the buyer knows what unlocks. */
  brands: string[];
  products: number;
  /** Placeholder format shown in the customer-ID field, e.g. CLG-102938. */
  idHint: string;
  /** Why the distributor turned the request down (shown in the rejected state). */
  rejectedReason?: string;
}

export const DMS_PARTNERS: DmsPartner[] = [
  {
    id: 'colgate',
    company: 'Colgate-Palmolive',
    distributor: 'Daily Agencies',
    emoji: '🪥',
    brands: ['Colgate', 'Palmolive', 'Halo'],
    products: 148,
    idHint: 'e.g. CLG-102938',
  },
  {
    id: 'pepsico',
    company: 'PepsiCo India',
    distributor: 'Aviso Sales & Distribution',
    emoji: '🥤',
    brands: ["Lay's", 'Kurkure', 'Pepsi', 'Tropicana'],
    products: 212,
    idHint: 'e.g. PEP-582104',
  },
  {
    id: 'marico',
    company: 'Marico',
    distributor: 'Sri Venkata Agencies',
    emoji: '🥥',
    brands: ['Parachute', 'Saffola', 'Livon'],
    products: 96,
    idHint: 'e.g. MRC-77451',
  },
  {
    id: 'hul',
    company: 'Hindustan Unilever',
    distributor: 'Sri Sai Marketing',
    emoji: '🧴',
    brands: ['Surf Excel', 'Dove', 'Horlicks'],
    products: 240,
    idHint: 'e.g. HUL-33812',
    rejectedReason: 'GSTIN could not be verified against the shop address on record.',
  },
  {
    id: 'itc',
    company: 'ITC',
    distributor: 'Golden Distributors',
    emoji: '🍪',
    brands: ['Sunfeast', 'Bingo!', 'Yippee!'],
    products: 183,
    idHint: 'e.g. ITC-90312',
  },
];

export const dmsPartnerById = (id: string) => DMS_PARTNERS.find((p) => p.id === id);
