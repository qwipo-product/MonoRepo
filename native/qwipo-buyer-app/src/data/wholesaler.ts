// Wholesaler products — same product offered by MULTIPLE vendors at different
// prices + delivery fees. Ported verbatim from qwipo-app-v2/src/data/wholesaler.ts.
export interface WholesalerVendor {
  id: string;
  name: string;
  price: number;
  mrp: number;
  margin: string;
  delivery: string;
  fee: string;
}

export interface WholesalerProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  caseLabel: string;
  caseSize: number;
  image: string;
  variants: { id: string; label: string }[];
  vendors: WholesalerVendor[];
}

export const WHOLESALER_PRODUCTS: WholesalerProduct[] = [
  {
    id: 'wp1', name: 'Refined Sunflower Oil', category: 'Cooking Oils & Ghee', brand: 'Freedom', caseLabel: 'Case: 16 pc', caseSize: 16, image: '🛢️',
    variants: [{ id: '1l', label: '1 Ltr' }, { id: '500ml', label: '500 ml' }, { id: '5l', label: '5 Ltr' }, { id: '15kg', label: '15 Kg' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 158, mrp: 185, margin: '14% Margin', delivery: 'Delivery by Tomorrow', fee: '₹2/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 172, mrp: 190, margin: '9% Margin', delivery: 'Delivery by Friday', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 165, mrp: 188, margin: '12% Margin', delivery: 'Delivery by Wednesday', fee: '₹1.5/kg' },
    ],
  },
  {
    id: 'wp2', name: 'Fortune Besan', category: 'Dals & Pulses', brand: 'Fortune', caseLabel: 'Case: 20 pc', caseSize: 20, image: '🫘',
    variants: [{ id: '500g', label: '500 g' }, { id: '1kg', label: '1 Kg' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 55, mrp: 68, margin: '19% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 58, mrp: 70, margin: '17% Margin', delivery: 'Delivery by Friday', fee: 'Free' },
    ],
  },
  {
    id: 'wp3', name: 'Red Label Tea', category: 'Beverages', brand: 'Red Label', caseLabel: 'Case: 40 pc', caseSize: 40, image: '🍵',
    variants: [{ id: '250g', label: '250 g' }, { id: '500g', label: '500 g' }, { id: '1kg', label: '1 Kg' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 135, mrp: 160, margin: '15% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 142, mrp: 165, margin: '13% Margin', delivery: 'Delivery by Wednesday', fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp4', name: 'Maggi 2-Minute Noodles', category: 'Snacks & Namkeen', brand: 'Maggi', caseLabel: 'Case: 24 pc', caseSize: 24, image: '🍜',
    variants: [{ id: '280g', label: '280 g' }, { id: '560g', label: '560 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 57, mrp: 68, margin: '16% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 60, mrp: 70, margin: '14% Margin', delivery: 'Delivery by Wednesday', fee: 'Free' },
      { id: 'balaji', name: 'Balaji Traders', price: 56, mrp: 66, margin: '15% Margin', delivery: 'Delivery by Friday', fee: '₹2/kg' },
    ],
  },
  {
    id: 'wp5', name: 'Aashirvaad Sona Masoori Rice', category: 'Rice & Rice Products', brand: 'Aashirvaad', caseLabel: 'Case: 1 pc', caseSize: 1, image: '🍚',
    variants: [{ id: '5kg', label: '5 Kg' }, { id: '26kg', label: '26 Kg' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 2500, mrp: 2800, margin: '12% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 2650, mrp: 2900, margin: '10% Margin', delivery: 'Delivery by Friday', fee: 'Free' },
    ],
  },
  {
    id: 'wp6', name: 'Tata Salt', category: 'Sugar & Spices', brand: 'Tata', caseLabel: 'Case: 24 pc', caseSize: 24, image: '🧂',
    variants: [{ id: '1kg', label: '1 Kg' }, { id: '2kg', label: '2 Kg' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 22, mrp: 28, margin: '21% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 24, mrp: 28, margin: '14% Margin', delivery: 'Delivery by Wednesday', fee: 'Free' },
    ],
  },
  {
    id: 'wp7', name: 'Priya Gold Cashews W320', category: 'Dry Fruits', brand: 'Priya Gold', caseLabel: 'Case: 10 pc', caseSize: 10, image: '🥜',
    variants: [{ id: '250g', label: '250 g' }, { id: '500g', label: '500 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 4200, mrp: 4800, margin: '16% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 4400, mrp: 5000, margin: '14% Margin', delivery: 'Delivery by Friday', fee: '₹2/kg' },
    ],
  },
  {
    id: 'wp8', name: 'MTR Rasam Powder', category: 'Sugar & Spices', brand: 'MTR', caseLabel: 'Case: 24 pc', caseSize: 24, image: '🥘',
    variants: [{ id: '100g', label: '100 g' }, { id: '200g', label: '200 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 88, mrp: 105, margin: '16% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 92, mrp: 108, margin: '15% Margin', delivery: 'Delivery by Wednesday', fee: 'Free' },
    ],
  },
  {
    id: 'wp9', name: 'Eastern Turmeric Powder', category: 'Sugar & Spices', brand: 'Eastern', caseLabel: 'Case: 20 pc', caseSize: 20, image: '🌿',
    variants: [{ id: '200g', label: '200 g' }, { id: '500g', label: '500 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 78, mrp: 92, margin: '15% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 82, mrp: 96, margin: '15% Margin', delivery: 'Delivery by Friday', fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp10', name: 'Madhur Refined Sugar', category: 'Sugar & Spices', brand: 'Madhur', caseLabel: 'Case: 20 pc', caseSize: 20, image: '🍬',
    variants: [{ id: '1kg', label: '1 Kg' }, { id: '5kg', label: '5 Kg' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 42, mrp: 50, margin: '16% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 44, mrp: 52, margin: '15% Margin', delivery: 'Delivery by Wednesday', fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp11', name: 'GRB Pure Cow Ghee', category: 'Cooking Oils & Ghee', brand: 'GRB', caseLabel: 'Case: 12 pc', caseSize: 12, image: '🧈',
    variants: [{ id: '500ml', label: '500 ml' }, { id: '1l', label: '1 Ltr' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 590, mrp: 690, margin: '14% Margin', delivery: 'Delivery by Tomorrow', fee: '₹2/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 615, mrp: 700, margin: '12% Margin', delivery: 'Delivery by Friday', fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp12', name: 'Gokul Cow Ghee', category: 'Cooking Oils & Ghee', brand: 'Gokul', caseLabel: 'Case: 12 pc', caseSize: 12, image: '🧈',
    variants: [{ id: '200ml', label: '200 ml' }, { id: '500ml', label: '500 ml' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 300, mrp: 350, margin: '14% Margin', delivery: 'Delivery by Tomorrow', fee: '₹2/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 312, mrp: 355, margin: '12% Margin', delivery: 'Delivery by Wednesday', fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp13', name: 'Himalaya Premium Almonds', category: 'Dry Fruits', brand: 'Himalaya', caseLabel: 'Case: 10 pc', caseSize: 10, image: '🥜',
    variants: [{ id: '250g', label: '250 g' }, { id: '500g', label: '500 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 5000, mrp: 5600, margin: '16% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 5200, mrp: 5800, margin: '14% Margin', delivery: 'Delivery by Friday', fee: '₹2/kg' },
    ],
  },
  {
    id: 'wp14', name: 'Cycle Pure Filter Coffee', category: 'Beverages', brand: 'Cycle', caseLabel: 'Case: 24 pc', caseSize: 24, image: '☕',
    variants: [{ id: '200g', label: '200 g' }, { id: '500g', label: '500 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 165, mrp: 195, margin: '15% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 172, mrp: 200, margin: '14% Margin', delivery: 'Delivery by Wednesday', fee: 'Free' },
    ],
  },
  {
    id: 'wp15', name: 'Vicco Vajradanti Powder', category: 'Sugar & Spices', brand: 'Vicco', caseLabel: 'Case: 36 pc', caseSize: 36, image: '🌿',
    variants: [{ id: '50g', label: '50 g' }, { id: '100g', label: '100 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 68, mrp: 82, margin: '17% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 72, mrp: 85, margin: '15% Margin', delivery: 'Delivery by Friday', fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp16', name: 'Mysore Sandal Premium Cashews', category: 'Dry Fruits', brand: 'Mysore Sandal', caseLabel: 'Case: 10 pc', caseSize: 10, image: '🥜',
    variants: [{ id: '250g', label: '250 g' }, { id: '500g', label: '500 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 4800, mrp: 5400, margin: '15% Margin', delivery: 'Delivery by Tomorrow', fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 5000, mrp: 5600, margin: '14% Margin', delivery: 'Delivery by Wednesday', fee: '₹2/kg' },
    ],
  },
];

/** Cheapest vendor id for a product (marked "Best"). */
export function cheapestVendorId(p: WholesalerProduct): string {
  return p.vendors.reduce((a, b) => (b.price < a.price ? b : a)).id;
}
