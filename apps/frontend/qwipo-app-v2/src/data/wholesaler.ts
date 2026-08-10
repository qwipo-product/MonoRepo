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
  vendors: WholesalerVendor[];
}

export const WHOLESALER_PRODUCTS: WholesalerProduct[] = [
  {
    id: 'wp1', name: 'Refined Sunflower Oil', category: 'Cooking Oils & Ghee', brand: 'Freedom', caseLabel: 'Case: 16 pc', caseSize: 16, image: '🛢️',
    variants: [
      { id: '1l', label: '1 Ltr' }, { id: '500ml', label: '500 ml' },
      { id: '5l', label: '5 Ltr' }, { id: '15kg', label: '15 Kg' },
    ],
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
    variants: [
      { id: '250g', label: '250 g' }, { id: '500g', label: '500 g' }, { id: '1kg', label: '1 Kg' },
    ],
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
];

/** Cheapest vendor id for a product (marked "Best"). */
export function cheapestVendorId(p: WholesalerProduct): string {
  return p.vendors.reduce((a, b) => (b.price < a.price ? b : a)).id;
}
