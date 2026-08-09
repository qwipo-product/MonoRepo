import { PRODUCTS, type Product } from './products';

/* Self-contained cart mock. The Shop section (product list → selling-units →
   add-to-cart) is owned by another developer, so Cart Summary carries its own
   seeded lines and derives the multi-seller view here — it renders fully for
   review without depending on the live add-to-cart flow. */

export interface CartLine {
  productId: string;
  quantity: number;
}

// Seeded so the summary shows both a met seller (free delivery) and an unmet
// seller (below MOV → "add more" warning).
export const CART_LINES: CartLine[] = [
  { productId: 'p1', quantity: 2 }, // Freedom Oil       — Sri Sai Krishna (distributor)
  { productId: 'p2', quantity: 1 }, // Aashirvaad Atta   — Sri Sai Krishna (distributor)
  { productId: 'p5', quantity: 3 }, // Mysore Soap       — Karnataka Soaps (distributor, below MOV)
  { productId: 'p3', quantity: 10 }, // Fortune Besan    — Omkar (wholesaler)
  { productId: 'p10', quantity: 4 }, // Red Label Tea    — Omkar (wholesaler)
];

// Minimum order value per seller (₹). Distributors default to 500; the
// wholesaler carries its own higher floor.
const SELLER_MOV: Record<string, number> = {
  'Omkar Enterprises': 1000,
};
const DEFAULT_MOV = 500;

const DELIVERY_WINDOWS: Record<Product['source'], string[]> = {
  distributor: ['Fri (Beat day)', 'Tomorrow'],
  wholesaler: ['Tomorrow'],
};

export interface CartItem {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface CartSeller {
  id: string;
  name: string;
  type: Product['source'];
  items: CartItem[];
  subtotal: number;
  savings: number;
  mov: number;
  /** ₹ still needed to reach the MOV (0 when met). */
  remaining: number;
  met: boolean;
  deliveryFee: number;
  windows: string[];
}

export function buildCart(): { sellers: CartSeller[]; grandTotal: number; totalItems: number } {
  const bySeller = new Map<string, CartItem[]>();

  for (const line of CART_LINES) {
    const product = PRODUCTS.find((p) => p.id === line.productId);
    if (!product) continue;
    const item: CartItem = {
      product,
      quantity: line.quantity,
      lineTotal: product.price * line.quantity,
    };
    const arr = bySeller.get(product.seller) ?? [];
    arr.push(item);
    bySeller.set(product.seller, arr);
  }

  const sellers: CartSeller[] = [];
  for (const [name, items] of bySeller) {
    const type = items[0].product.source;
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const savings = items.reduce(
      (s, i) => s + Math.max(0, (i.product.mrp - i.product.price) * i.quantity),
      0
    );
    const mov = SELLER_MOV[name] ?? DEFAULT_MOV;
    const remaining = Math.max(0, mov - subtotal);
    const met = remaining === 0;
    sellers.push({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      type,
      items,
      subtotal,
      savings,
      mov,
      remaining,
      met,
      deliveryFee: met ? 0 : 30,
      windows: DELIVERY_WINDOWS[type],
    });
  }

  // Distributors first, then wholesalers — matches the grouped headers.
  sellers.sort((a, b) => (a.type === b.type ? 0 : a.type === 'distributor' ? -1 : 1));

  const grandTotal = sellers.reduce((s, x) => s + x.subtotal, 0);
  const totalItems = sellers.reduce((n, s) => n + s.items.length, 0);
  return { sellers, grandTotal, totalItems };
}
