// Wholesaler products — unlike the distributor catalog, the same product is
// offered by MULTIPLE vendors at different prices + delivery fees. The buyer
// picks a vendor per line.

export interface WholesalerVendor {
  id: string;
  name: string;
  price: number;
  /** Delivery fee copy, e.g. "₹2/kg" or "Free". */
  fee: string;
}

export interface WholesalerProduct {
  id: string;
  name: string;
  caseLabel: string;
  /** Pieces per case — drives the selling-unit pack tiers. */
  caseSize: number;
  image: string;
  variants: { id: string; label: string }[];
  vendors: WholesalerVendor[];
}

export const WHOLESALER_PRODUCTS: WholesalerProduct[] = [
  {
    id: 'wp1', name: 'Refined Sunflower Oil', caseLabel: 'Case: 16 pc', caseSize: 16, image: '🛢️',
    variants: [
      { id: '1l', label: '1 Ltr' }, { id: '500ml', label: '500 ml' },
      { id: '5l', label: '5 Ltr' }, { id: '15kg', label: '15 Kg' },
    ],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 158, fee: '₹2/kg' },
      { id: 'srisai', name: 'Sri Sai Krishna Traders', price: 172, fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 165, fee: '₹1.5/kg' },
    ],
  },
  {
    id: 'wp2', name: 'Fortune Besan', caseLabel: 'Case: 20 pc', caseSize: 20, image: '🫘',
    variants: [{ id: '500g', label: '500 g' }, { id: '1kg', label: '1 Kg' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 55, fee: '₹1/kg' },
      { id: 'balaji', name: 'Balaji Traders', price: 58, fee: 'Free' },
    ],
  },
  {
    id: 'wp3', name: 'Red Label Tea', caseLabel: 'Case: 40 pc', caseSize: 40, image: '🍵',
    variants: [
      { id: '250g', label: '250 g' }, { id: '500g', label: '500 g' }, { id: '1kg', label: '1 Kg' },
    ],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 135, fee: '₹1/kg' },
      { id: 'srisai', name: 'Sri Sai Krishna Traders', price: 142, fee: '₹1/kg' },
    ],
  },
  {
    id: 'wp4', name: 'Maggi 2-Minute Noodles', caseLabel: 'Case: 24 pc', caseSize: 24, image: '🍜',
    variants: [{ id: '280g', label: '280 g' }, { id: '560g', label: '560 g' }],
    vendors: [
      { id: 'omkar', name: 'Omkar Enterprises', price: 57, fee: '₹1/kg' },
      { id: 'vasudha', name: 'Vasudha Wholesalers', price: 60, fee: 'Free' },
      { id: 'balaji', name: 'Balaji Traders', price: 56, fee: '₹2/kg' },
    ],
  },
];

/** Cheapest vendor id for a product (marked "Best"). */
export function cheapestVendorId(p: WholesalerProduct): string {
  return p.vendors.reduce((a, b) => (b.price < a.price ? b : a)).id;
}
