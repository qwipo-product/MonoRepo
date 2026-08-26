// Saved delivery addresses (Account · Saved Addresses). Mirrors the mockup —
// each entry carries an emoji place-mark, a title, the multi-line locality and
// a pincode. `selectedId` marks the address currently delivering.
/* Where the delivery actually is. B2B buyers order to more than a home — the
   type changes what the driver looks for, so it's asked for up front and shown
   as the address's place-mark. */
export const ADDRESS_TYPES = [
  'Shop',
  'Warehouse',
  'Godown',
  'Office',
  'Factory',
  'Cold Storage',
  'Home',
  'Other',
] as const;

export type AddressType = (typeof ADDRESS_TYPES)[number];

const TYPE_EMOJI: Record<string, string> = {
  Shop: '🏪',
  Warehouse: '🏭',
  Godown: '📦',
  Office: '🏢',
  Factory: '🏗️',
  'Cold Storage': '❄️',
  Home: '🏠',
  Other: '📍',
};

export const emojiForType = (t: string) => TYPE_EMOJI[t] ?? '📍';

export interface Address {
  id: string;
  emoji: string;
  title: string;
  locality: string;
  pincode: string;
  /** Shop / Warehouse / Home … — drives the place-mark shown in the list. */
  type?: string;
  /* Addresses the buyer adds don't deliver straight away — ops verifies the
     location serves a beat before it can be picked. Pending ones sit at the
     bottom of the list, disabled. */
  status: 'approved' | 'pending';
}

// Order = Location 1 / 2 / 3 as shown in Saved Addresses:
//   1 (default) Gachibowli — distributors + wholesalers
//   2           Madhapur   — distributors only
//   3           Rai Durg   — wholesalers only
export const ADDRESSES: Address[] = [
  {
    id: 'flat-502',
    emoji: '🏠',
    type: 'Home',
    title: 'Flat 502, Sigma Towers',
    locality: 'Gachibowli, Hyderabad, Telangana',
    pincode: '500032',
    status: 'approved',
  },
  {
    id: 'plot-27',
    emoji: '📦',
    type: 'Godown',
    title: 'Plot 27, Industrial Estate',
    locality: 'Madhapur, Hyderabad, Telangana',
    pincode: '500081',
    status: 'approved',
  },
  {
    id: 'shop-14',
    emoji: '🏪',
    type: 'Shop',
    title: 'Shop 14, Lit Box Complex',
    locality: 'Rai Durg, Hitech City, Hyderabad, Telangana',
    pincode: '500032',
    status: 'approved',
  },
  {
    id: 'unit-9',
    emoji: '🏭',
    type: 'Warehouse',
    title: 'Unit 9, Cyber Gateway',
    locality: 'Kondapur, Serilingampally, Hyderabad, Telangana',
    pincode: '500084',
    status: 'pending',
  },
];

/** Only approved addresses can deliver. */
export const isDeliverable = (a: Address) => a.status === 'approved';

/** Address delivering by default — Location 1 (Gachibowli, both channels). */
export const DEFAULT_ADDRESS_ID = 'flat-502';

/** Which seller types are serviceable at a location. */
export type Availability = 'both' | 'distributors' | 'wholesalers';

// Serviceability per delivery address — mirrors v1's address→vendor geofencing:
// each location serves distributors, wholesalers, or both. Drives the Home tabs
// (the unavailable one shows "Coming Soon").
const AVAILABILITY: Record<string, Availability> = {
  'flat-502': 'both', // Gachibowli — distributors + wholesalers
  'plot-27': 'distributors', // Madhapur — distributors only
  'shop-14': 'wholesalers', // Rai Durg — wholesalers only
};

export function availabilityFor(id: string): Availability {
  return AVAILABILITY[id] ?? 'both';
}

export function addressById(id: string): Address | undefined {
  return ADDRESSES.find((a) => a.id === id);
}
