// Product catalog for the RN prototype — ported from the web mock. Emoji stand
// in for images. Mixed distributor/wholesaler sourcing drives the source badge.

export type Source = 'distributor' | 'wholesaler';

export interface Variant {
  id: string;
  label: string;
}
export interface Product {
  id: string;
  name: string;
  shortName: string;
  category: string;
  caseLabel: string;
  caseSize: number;
  image: string;
  variants: Variant[];
  seller: string;
  source: Source;
  delivery: string;
  margin: string;
  price: number;
  mrp: number;
  mov: number;
}

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Freedom Refined Sunflower Oil - 1 L X 16', shortName: 'Freedom Refined Sunflower Oil', category: 'Cooking Oils & Ghee', caseLabel: 'Case: 16 pc', caseSize: 16, image: '🛢️', variants: [{ id: '1l', label: '1 L' }, { id: '5l', label: '5 L' }, { id: '15kg', label: '15 kg' }], seller: 'Sri Sai Krishna Traders', source: 'distributor', delivery: 'Free Delivery', margin: '12% Margin', price: 165, mrp: 185, mov: 500 },
  { id: 'p2', name: 'Aashirvaad Atta - 10 kg X 4', shortName: 'Aashirvaad Atta', category: 'Atta, Flours & Sooji', caseLabel: 'Case: 4 pc', caseSize: 4, image: '🌾', variants: [{ id: '5kg', label: '5 kg' }, { id: '10kg', label: '10 kg' }], seller: 'Sri Sai Krishna Traders', source: 'distributor', delivery: 'Free Delivery', margin: '9% Margin', price: 420, mrp: 465, mov: 500 },
  { id: 'p3', name: 'Fortune Besan - 500 G X 20', shortName: 'Fortune Besan', category: 'Atta, Flours & Sooji', caseLabel: 'Case: 20 pc', caseSize: 20, image: '🫘', variants: [{ id: '500g', label: '500 g' }, { id: '1kg', label: '1 kg' }], seller: 'Omkar Enterprises', source: 'wholesaler', delivery: 'Delivery by Tomorrow', margin: '11% Margin', price: 55, mrp: 62, mov: 5000 },
  { id: 'p4', name: 'Maggi 2-Minute Noodles - 280 G X 24', shortName: 'Maggi 2-Minute Noodles', category: 'Snacks & Namkeen', caseLabel: 'Case: 24 pc', caseSize: 24, image: '🍜', variants: [{ id: '280g', label: '280 g' }, { id: '560g', label: '560 g' }], seller: 'Omkar Enterprises', source: 'wholesaler', delivery: 'Delivery by Tomorrow', margin: '10% Margin', price: 57, mrp: 60, mov: 5000 },
  { id: 'p5', name: 'Mysore Sandal Soap - 150 G X 72', shortName: 'Mysore Sandal Soap', category: 'Personal Care', caseLabel: 'Case: 72 pc', caseSize: 72, image: '🧼', variants: [{ id: 's75', label: '75 g' }, { id: 's150', label: '150 g' }], seller: 'Karnataka Soaps', source: 'distributor', delivery: 'Free Delivery', margin: '12% Margin', price: 42, mrp: 48, mov: 500 },
  { id: 'p10', name: 'Red Label Tea - 250 G X 40', shortName: 'Red Label Tea', category: 'Beverages', caseLabel: 'Case: 40 pc', caseSize: 40, image: '🍵', variants: [{ id: 'rl250', label: '250 g' }, { id: 'rl500', label: '500 g' }, { id: 'rl1kg', label: '1 kg' }], seller: 'Omkar Enterprises', source: 'wholesaler', delivery: 'Delivery by Tomorrow', margin: '12% Margin', price: 135, mrp: 150, mov: 5000 },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

/** Pack tiers offered in the selling-units sheet: single, half-case, full case. */
export function packTiers(caseSize: number) {
  const half = Math.max(2, Math.round(caseSize / 2));
  const uniq = Array.from(new Set([1, half, caseSize])).filter((n) => n <= caseSize);
  return uniq.map((pcs) => ({ id: `t${pcs}`, label: `1 × ${pcs}`, pcs }));
}
