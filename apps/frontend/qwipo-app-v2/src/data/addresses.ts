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

export const ADDRESSES: Address[] = [
  {
    id: 'shop-14',
    emoji: '🏪',
    title: 'Shop 14, Lit Box Complex',
    locality: 'Rai Durg, Hitech City, Hyderabad, Telangana',
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
    id: 'flat-502',
    emoji: '🏠',
    title: 'Flat 502, Sigma Towers',
    locality: 'Gachibowli, Hyderabad, Telangana',
    pincode: '500032',
  },
];

/** Address delivering by default (the last one, per the mockup). */
export const DEFAULT_ADDRESS_ID = 'flat-502';
