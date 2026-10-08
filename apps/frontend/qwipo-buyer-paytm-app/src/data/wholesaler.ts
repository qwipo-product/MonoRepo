import { isSellerOffline } from './sellerStatus';
import { EXTRA_WHOLESALE } from './catalogExtra';
// Wholesaler products — unlike the distributor catalog, the same product is
// offered by MULTIPLE vendors at different prices + delivery fees. The buyer
// picks a vendor per line.

export interface WholesalerVendor {
  id: string;
  name: string;
  price: number;
  /** Vendor's MRP — drives the strikethrough + discount vs selling price. */
  mrp: number;
  /** Retailer margin copy, e.g. "12% Margin". */
  margin: string;
  /** Delivery-date copy, e.g. "Delivery by Tomorrow". */
  delivery: string;
  /** Delivery fee copy, e.g. "₹2/kg" or "Free". */
  fee: string;
}

export interface WholesalerProduct {
  id: string;
  name: string;
  /** Merchandising category — drives the "category" applied filter. */
  category: string;
  /** Brand label — drives the "brand" applied filter. */
  brand: string;
  caseLabel: string;
  /** Pieces per case — drives the selling-unit pack tiers. */
  caseSize: number;
  image: string;
  variants: { id: string; label: string }[];
  /* Per-pack shot, keyed by variant id. Only the price moves with the vendor
     here, not with the pack, so this carries pictures and nothing else. */
  images?: Record<string, string>;
  /* The pictures the images sheet pages through — up to five, in the order a
     buyer should see them. Separate from the map above, which answers "what
     does THIS pack look like". */
  gallery?: string[];
  /* Weight of one selling unit, in kg. Wholesale freight is quoted per kilo,
     so without this a vendor's "₹2/kg" has nothing to multiply. Defaults to
     1 kg where a SKU doesn't say. */
  unitKg?: number;
  vendors: WholesalerVendor[];
}

const BASE_WHOLESALE: WholesalerProduct[] = [
  {
    id: 'wp1', name: 'Refined Sunflower Oil', category: 'Cooking Oils & Ghee', brand: 'Freedom', caseLabel: 'Case: 16 pc', caseSize: 16, unitKg: 1,
    image: '/product-images/freedom/1l-pouch.png',
    variants: [
      { id: '1l', label: '1 Ltr' }, { id: '500ml', label: '500 ml' },
      { id: '5l', label: '5 Ltr' }, { id: '15kg', label: '15 Kg' },
    ],
    gallery: [
      '/product-images/freedom/1l-pouch.png',
      '/product-images/freedom/500ml-pouch.png',
      '/product-images/freedom/5l.png',
      '/product-images/freedom/15l.png',
    ],
    images: {
      '1l': '/product-images/freedom/1l-pouch.png',
      '500ml': '/product-images/freedom/500ml-pouch.png',
      '5l': '/product-images/freedom/5l.png',
      '15kg': '/product-images/freedom/15l.png',
    },
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 158, mrp: 185, margin: '14% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹2/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 172, mrp: 190, margin: '9% Net Margin', delivery: 'Delivery by Friday', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 165, mrp: 188, margin: '12% Net Margin', delivery: 'Delivery by Wednesday', fee: '₹1.5/kg' },
    ],
  },
  {
    id: 'wp2', name: 'Fortune Besan', category: 'Dals & Pulses', brand: 'Fortune', caseLabel: 'Case: 20 pc', caseSize: 20, unitKg: 0.5, image: '🫘',
    variants: [{ id: '500g', label: '500 g' }, { id: '1kg', label: '1 Kg' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 55, mrp: 68, margin: '19% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 58, mrp: 70, margin: '17% Net Margin', delivery: 'Delivery by Friday', fee: 'Free' },
    ],
  },
  {
    id: 'wp3', name: 'Red Label Tea', category: 'Beverages', brand: 'Red Label', caseLabel: 'Case: 40 pc', caseSize: 40, unitKg: 0.25, image: '🍵',
    variants: [
      { id: '250g', label: '250 g' }, { id: '500g', label: '500 g' }, { id: '1kg', label: '1 Kg' },
    ],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 135, mrp: 160, margin: '15% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 142, mrp: 165, margin: '13% Net Margin', delivery: 'Delivery by Wednesday', fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp4', name: 'Maggi 2-Minute Noodles', category: 'Snacks & Namkeen', brand: 'Maggi', caseLabel: 'Case: 24 pc', caseSize: 24, unitKg: 0.28, image: '🍜',
    variants: [{ id: '280g', label: '280 g' }, { id: '560g', label: '560 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 57, mrp: 68, margin: '16% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 60, mrp: 70, margin: '14% Net Margin', delivery: 'Delivery by Wednesday', fee: 'Free' },
      { id: 'balaji', name: 'Balaji Traders', price: 56, mrp: 66, margin: '15% Net Margin', delivery: 'Delivery by Friday', fee: '₹2/kg' },
    ],
  },

  // ── Coverage fill: every wholesaler category + brand gets ≥1 product (each
  // with 1–2 variants and ≥2 vendors), so no wholesaler category / brand page
  // is ever empty.
  {
    id: 'wp5', name: 'Aashirvaad Sona Masoori Rice', category: 'Rice & Rice Products', brand: 'Aashirvaad', caseLabel: 'Case: 1 pc', caseSize: 1, unitKg: 26, image: '🍚',
    variants: [{ id: '5kg', label: '5 Kg' }, { id: '26kg', label: '26 Kg' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 2500, mrp: 2800, margin: '12% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 2650, mrp: 2900, margin: '10% Net Margin', delivery: 'Delivery by Friday', fee: 'Free' },
    ],
  },
  {
    id: 'wp6', name: 'Tata Salt', category: 'Sugar & Spices', brand: 'Tata', caseLabel: 'Case: 24 pc', caseSize: 24, unitKg: 1, image: '🧂',
    variants: [{ id: '1kg', label: '1 Kg' }, { id: '2kg', label: '2 Kg' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 22, mrp: 28, margin: '21% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 24, mrp: 28, margin: '14% Net Margin', delivery: 'Delivery by Wednesday', fee: 'Free' },
    ],
  },
  {
    id: 'wp7', name: 'Priya Gold Cashews W320', category: 'Dry Fruits', brand: 'Priya Gold', caseLabel: 'Case: 10 pc', caseSize: 10, unitKg: 1, image: '🥜',
    variants: [{ id: '250g', label: '250 g' }, { id: '500g', label: '500 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 4200, mrp: 4800, margin: '16% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 4400, mrp: 5000, margin: '14% Net Margin', delivery: 'Delivery by Friday', fee: '₹2/kg' },
    ],
  },
  {
    id: 'wp8', name: 'MTR Rasam Powder', category: 'Sugar & Spices', brand: 'MTR', caseLabel: 'Case: 24 pc', caseSize: 24, unitKg: 0.1, image: '🥘',
    variants: [{ id: '100g', label: '100 g' }, { id: '200g', label: '200 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 88, mrp: 105, margin: '16% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 92, mrp: 108, margin: '15% Net Margin', delivery: 'Delivery by Wednesday', fee: 'Free' },
    ],
  },
  {
    id: 'wp9', name: 'Eastern Turmeric Powder', category: 'Sugar & Spices', brand: 'Eastern', caseLabel: 'Case: 20 pc', caseSize: 20, unitKg: 0.2, image: '🌿',
    variants: [{ id: '200g', label: '200 g' }, { id: '500g', label: '500 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 78, mrp: 92, margin: '15% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 82, mrp: 96, margin: '15% Net Margin', delivery: 'Delivery by Friday', fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp10', name: 'Madhur Refined Sugar', category: 'Sugar & Spices', brand: 'Madhur', caseLabel: 'Case: 20 pc', caseSize: 20, unitKg: 1, image: '🍬',
    variants: [{ id: '1kg', label: '1 Kg' }, { id: '5kg', label: '5 Kg' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 42, mrp: 50, margin: '16% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 44, mrp: 52, margin: '15% Net Margin', delivery: 'Delivery by Wednesday', fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp11', name: 'GRB Pure Cow Ghee', category: 'Cooking Oils & Ghee', brand: 'GRB', caseLabel: 'Case: 12 pc', caseSize: 12, unitKg: 1, image: '🧈',
    variants: [{ id: '500ml', label: '500 ml' }, { id: '1l', label: '1 Ltr' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 590, mrp: 690, margin: '14% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹2/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 615, mrp: 700, margin: '12% Net Margin', delivery: 'Delivery by Friday', fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp12', name: 'Gokul Cow Ghee', category: 'Cooking Oils & Ghee', brand: 'Gokul', caseLabel: 'Case: 12 pc', caseSize: 12, unitKg: 0.5, image: '🧈',
    variants: [{ id: '200ml', label: '200 ml' }, { id: '500ml', label: '500 ml' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 300, mrp: 350, margin: '14% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹2/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 312, mrp: 355, margin: '12% Net Margin', delivery: 'Delivery by Wednesday', fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp13', name: 'Himalaya Premium Almonds', category: 'Dry Fruits', brand: 'Himalaya', caseLabel: 'Case: 10 pc', caseSize: 10, unitKg: 0.5, image: '🥜',
    variants: [{ id: '250g', label: '250 g' }, { id: '500g', label: '500 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 5000, mrp: 5600, margin: '16% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 5200, mrp: 5800, margin: '14% Net Margin', delivery: 'Delivery by Friday', fee: '₹2/kg' },
    ],
  },
  {
    id: 'wp14', name: 'Cycle Pure Filter Coffee', category: 'Beverages', brand: 'Cycle', caseLabel: 'Case: 24 pc', caseSize: 24, unitKg: 0.5, image: '☕',
    variants: [{ id: '200g', label: '200 g' }, { id: '500g', label: '500 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 165, mrp: 195, margin: '15% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 172, mrp: 200, margin: '14% Net Margin', delivery: 'Delivery by Wednesday', fee: 'Free' },
    ],
  },
  {
    id: 'wp15', name: 'Vicco Vajradanti Powder', category: 'Sugar & Spices', brand: 'Vicco', caseLabel: 'Case: 36 pc', caseSize: 36, unitKg: 0.1, image: '🌿',
    variants: [{ id: '50g', label: '50 g' }, { id: '100g', label: '100 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 68, mrp: 82, margin: '17% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 72, mrp: 85, margin: '15% Net Margin', delivery: 'Delivery by Friday', fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp16', name: 'Mysore Sandal Premium Cashews', category: 'Dry Fruits', brand: 'Mysore Sandal', caseLabel: 'Case: 10 pc', caseSize: 10, unitKg: 1, image: '🥜',
    variants: [{ id: '250g', label: '250 g' }, { id: '500g', label: '500 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 4800, mrp: 5400, margin: '15% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 5000, mrp: 5600, margin: '14% Net Margin', delivery: 'Delivery by Wednesday', fee: '₹2/kg' },
    ],
  },
  // Personal Care and Cleaning & Household are the FMCG group's own
  // categories; the coverage rule above applies to them too.
  {
    id: 'wp17', name: 'Mysore Sandal Soap', category: 'Personal Care', brand: 'Mysore Sandal', caseLabel: 'Case: 72 pc', caseSize: 72, unitKg: 0.15, image: '🧼',
    variants: [{ id: '75g', label: '75 g' }, { id: '150g', label: '150 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 38, mrp: 48, margin: '21% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 40, mrp: 50, margin: '20% Net Margin', delivery: 'Delivery by Friday', fee: 'Free' },
    ],
  },
  {
    id: 'wp18', name: 'Surf Excel Easy Wash Detergent', category: 'Cleaning & Household', brand: 'Surf Excel', caseLabel: 'Case: 20 pc', caseSize: 20, unitKg: 1, image: '🧺',
    variants: [{ id: '500g', label: '500 g' }, { id: '1kg', label: '1 Kg' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 112, mrp: 135, margin: '17% Net Margin', delivery: 'Delivery by Tomorrow', fee: '₹2/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 118, mrp: 140, margin: '16% Net Margin', delivery: 'Delivery by Wednesday', fee: '₹1/kg' },
    ],
  },
];

export const WHOLESALER_PRODUCTS: WholesalerProduct[] = [...BASE_WHOLESALE, ...EXTRA_WHOLESALE];

/* Vendors who are taking orders. An offline vendor (Accept Orders OFF in the
   Seller Portal) is never the default and never "Best"; if every vendor of a
   product is offline, the list falls back to all of them so the card can still
   be drawn — greyed, as offline. */
const onlineVendors = (p: WholesalerProduct) => {
  const on = p.vendors.filter((v) => !isSellerOffline(v.name));
  return on.length ? on : p.vendors;
};

/** True when no vendor of this product is taking orders. */
export const allVendorsOffline = (p: WholesalerProduct) => p.vendors.every((v) => isSellerOffline(v.name));

/** Cheapest vendor id for a product (marked "Best"), among vendors taking orders. */
export function cheapestVendorId(p: WholesalerProduct): string {
  return onlineVendors(p).reduce((a, b) => (b.price < a.price ? b : a)).id;
}

/** What the SKU costs at its cheapest vendor — what a list sorts and filters on. */
export const minVendorPrice = (p: WholesalerProduct) => Math.min(...onlineVendors(p).map((v) => v.price));
