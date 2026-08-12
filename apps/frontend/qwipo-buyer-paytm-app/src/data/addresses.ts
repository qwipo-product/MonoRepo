// Saved delivery addresses (Account · Saved Addresses). Mirrors the mockup —
// each entry carries an emoji place-mark, a title, the multi-line locality and
// a pincode. `selectedId` marks the address currently delivering.
export interface Address {
  id: string;
  emoji: string;
  title: string;
  locality: string;
  pincode: string;
}

// Order = Location 1 / 2 / 3 as shown in Saved Addresses:
//   1 (default) Gachibowli — distributors + wholesalers
//   2           Madhapur   — distributors only
//   3           Rai Durg   — wholesalers only
export const ADDRESSES: Address[] = [
  {
    id: 'flat-502',
    emoji: '🏠',
    title: 'Flat 502, Sigma Towers',
    locality: 'Gachibowli, Hyderabad, Telangana',
    pincode: '500032',
  },
  {
    id: 'plot-27',
    emoji: '📦',
    title: 'Plot 27, Industrial Estate',
    locality: 'Madhapur, Hyderabad, Telangana',
    pincode: '500081',
  },
  {
    id: 'shop-14',
    emoji: '🏪',
    title: 'Shop 14, Lit Box Complex',
    locality: 'Rai Durg, Hitech City, Hyderabad, Telangana',
    pincode: '500032',
  },
];

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
