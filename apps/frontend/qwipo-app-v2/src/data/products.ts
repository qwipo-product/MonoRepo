import type { PackPill } from '@mockups/components';

export type Source = 'distributor' | 'wholesaler';

export interface Product {
  id: string;
  name: string;
  /** Short display name for the sheet header (brand + product, no pack). */
  shortName: string;
  caseLabel: string;
  /** Pieces per case — drives the pack tiers in the selling-units sheet. */
  caseSize: number;
  image: string;
  variants: PackPill[];
  seller: string;
  source: Source;
  delivery: string;
  margin: string;
  price: number;
  mrp: number;
  deliveryDay: string;
  mov: number;
}

// Inline mock data — a real build would pull these from @mockups/mock-data.
export const PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'Freedom Refined Sunflower Oil - 1 L Packet X 16 Nos', shortName: 'Freedom Refined Sunflower Oil',
    caseLabel: 'Case: 16 pc', caseSize: 16, image: '🛢️',
    variants: [{ id: '1l', label: '1 L' }, { id: '5l', label: '5 L' }, { id: '15kg', label: '15 kg' }],
    seller: 'Sri Sai Krishna Traders', source: 'distributor', delivery: 'Free Delivery', margin: '12% Margin',
    price: 165, mrp: 185, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p2', name: 'Aashirvaad Atta - 10 kg Bag X 4 Nos', shortName: 'Aashirvaad Atta',
    caseLabel: 'Case: 4 pc', caseSize: 4, image: '🌾',
    variants: [{ id: '5kg', label: '5 kg' }, { id: '10kg', label: '10 kg' }],
    seller: 'Sri Sai Krishna Traders', source: 'distributor', delivery: 'Free Delivery', margin: '9% Margin',
    price: 420, mrp: 465, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p3', name: 'Fortune Besan - 500 G Packet X 20 Nos', shortName: 'Fortune Besan',
    caseLabel: 'Case: 20 pc', caseSize: 20, image: '🫘',
    variants: [{ id: '500g', label: '500 g' }, { id: '1kg', label: '1 kg' }],
    seller: 'Omkar Enterprises', source: 'wholesaler', delivery: 'Delivery by Tomorrow', margin: '11% Margin',
    price: 55, mrp: 62, deliveryDay: 'Tomorrow', mov: 5000,
  },
  {
    id: 'p4', name: 'Maggi 2-Minute Noodles - 280 G Packet X 24 Nos', shortName: 'Maggi 2-Minute Noodles',
    caseLabel: 'Case: 24 pc', caseSize: 24, image: '🍜',
    variants: [{ id: '280g', label: '280 g' }, { id: '560g', label: '560 g' }],
    seller: 'Omkar Enterprises', source: 'wholesaler', delivery: 'Delivery by Tomorrow', margin: '10% Margin',
    price: 57, mrp: 60, deliveryDay: 'Tomorrow', mov: 5000,
  },
  {
    id: 'p5', name: 'Mysore Sandal Soap - 150 G Carton X 72 Nos', shortName: 'Mysore Sandal Soap',
    caseLabel: 'Case: 72 pc', caseSize: 72, image: '🧼',
    variants: [
      { id: 's20', label: '20 g' }, { id: 's40', label: '40 g' }, { id: 's75', label: '75 g' },
      { id: 's100', label: '100 g' }, { id: 's125', label: '125 g' }, { id: 's150', label: '150 g' },
      { id: 's3x150', label: '3 × 150 g' }, { id: 's6x150', label: '6 × 150 g' },
    ],
    seller: 'Karnataka Soaps & Detergents', source: 'distributor', delivery: 'Free Delivery', margin: '12% Margin',
    price: 42, mrp: 48, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p6', name: 'Mysore Sandal Dhoop - 24 Sticks Box X 120 Nos', shortName: 'Mysore Sandal Dhoop',
    caseLabel: 'Case: 120 pc', caseSize: 120, image: '🪔',
    variants: [
      { id: 'd12', label: '12 Sticks' }, { id: 'd24', label: '24 Sticks' }, { id: 'd40', label: '40 Sticks' },
      { id: 'd80', label: '80 Sticks' }, { id: 'd100g', label: '100 g' }, { id: 'd200g', label: '200 g' },
      { id: 'dp3', label: 'Pack of 3' }, { id: 'dp6', label: 'Pack of 6' }, { id: 'dp12', label: 'Pack of 12' },
      { id: 'dcup', label: 'Cup Dhoop' },
    ],
    seller: 'Karnataka Soaps & Detergents', source: 'distributor', delivery: 'Free Delivery', margin: '14% Margin',
    price: 45, mrp: 50, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
  {
    id: 'p7', name: 'Mysore Sandal Talcum Powder - 100 G Bottle X 48 Nos', shortName: 'Mysore Sandal Talcum Powder',
    caseLabel: 'Case: 48 pc', caseSize: 48, image: '🧴',
    variants: [
      { id: 't60', label: '60 g' }, { id: 't100', label: '100 g' },
      { id: 't200', label: '200 g' }, { id: 't300', label: '300 g' },
    ],
    seller: 'Karnataka Soaps & Detergents', source: 'distributor', delivery: 'Free Delivery', margin: '11% Margin',
    price: 88, mrp: 98, deliveryDay: 'Fri (Beat day)', mov: 500,
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

/** Pack tiers offered in the selling-units sheet: single, half-case, full case. */
export function packTiers(caseSize: number) {
  const half = Math.max(2, Math.round(caseSize / 2));
  const uniq = Array.from(new Set([1, half, caseSize])).filter((n) => n <= caseSize);
  return uniq.map((pcs) => ({ id: `t${pcs}`, label: `1 X ${pcs}`, pcs }));
}

export interface Coupon {
  id: string;
  title: string;
  detail: string;
  code: string;
}

export const COUPONS: Coupon[] = [
  { id: 'c1', title: 'Flat ₹500 OFF', detail: 'On orders above ₹6,000', code: 'QWIPO500' },
  { id: 'c2', title: '10% OFF up to ₹400', detail: 'First 3 orders', code: 'WELCOME10' },
  { id: 'c3', title: 'Free delivery', detail: 'On all orders above ₹3,500', code: 'FREESHIP' },
];
