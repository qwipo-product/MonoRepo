import { PRODUCTS, type Product } from './products';

/* Self-contained cart mock. The Shop section (product list → selling-units →
   add-to-cart) is owned by another developer, so Cart Summary carries its own
   seeded lines and derives the multi-seller view here — it renders fully for
   review without depending on the live add-to-cart flow.

   Each seller resolves to one of three retailer-facing states:
     • free  — at/above the free-delivery threshold  → ELIGIBLE · FREE DELIVERY
     • paid  — above minimum but below free threshold → PAID DELIVERY (₹30)
     • below — under the minimum order value          → BELOW MINIMUM (blocks checkout) */

export type CartStatus = 'free' | 'paid' | 'below';

export interface CartLine {
  productId: string;
  quantity: number;
  /** Promotional free unit — shows a FREE badge and a ₹0 line. */
  free?: boolean;
}

interface SellerConfig {
  mov: number;
  freeDeliveryAt: number;
  windows: [string, string];
}

// Per-seller thresholds + beat-day windows.
const SELLER_CONFIG: Record<string, SellerConfig> = {
  'Sri Sai Krishna Traders': { mov: 2000, freeDeliveryAt: 3000, windows: ['Sat 8th · Beat', 'Tomorrow'] },
  'Omkar Enterprises': { mov: 1000, freeDeliveryAt: 3000, windows: ['Fri · Beat day', 'Tomorrow'] },
  'Karnataka Soaps & Detergents': { mov: 5000, freeDeliveryAt: 6000, windows: ['Sat 8th · Beat', 'Tomorrow'] },
};
const DEFAULT_CONFIG: SellerConfig = { mov: 1000, freeDeliveryAt: 3000, windows: ['Tomorrow', 'Day after'] };

// Seeded to show all three states + a FREE item + a "+N more" rail.
export const CART_LINES: CartLine[] = [
  { productId: 'p1', quantity: 12 }, // Freedom Oil     — Sri Sai (distributor) → FREE seller
  { productId: 'p1', quantity: 1, free: true }, // free promo unit
  { productId: 'p2', quantity: 8 }, // Aashirvaad Atta  — Sri Sai
  { productId: 'p3', quantity: 20 }, // Fortune Besan   — Omkar (wholesaler) → PAID seller (5 lines → +more)
  { productId: 'p4', quantity: 6 }, // Maggi            — Omkar
  { productId: 'p8', quantity: 4 }, // Close Up         — Omkar
  { productId: 'p9', quantity: 3 }, // Dabur Red        — Omkar
  { productId: 'p10', quantity: 2 }, // Red Label Tea   — Omkar
  { productId: 'p5', quantity: 3 }, // Mysore Soap      — Karnataka (distributor) → BELOW MINIMUM
];

export interface CartItem {
  product: Product;
  quantity: number;
  lineTotal: number;
  free: boolean;
}

export interface CartSeller {
  id: string;
  name: string;
  type: Product['source'];
  items: CartItem[];
  subtotal: number;
  savings: number;
  mov: number;
  freeDeliveryAt: number;
  status: CartStatus;
  deliveryFee: number;
  /** ₹ still needed to clear the minimum (0 unless status === 'below'). */
  unlockRemaining: number;
  /** 0–100, subtotal toward the minimum. */
  progress: number;
  windows: [string, string];
}

export function buildCart(): {
  sellers: CartSeller[];
  grandTotal: number;
  totalItems: number;
  anyBelow: boolean;
} {
  const bySeller = new Map<string, CartItem[]>();

  for (const line of CART_LINES) {
    const product = PRODUCTS.find((p) => p.id === line.productId);
    if (!product) continue;
    const lineTotal = line.free ? 0 : product.price * line.quantity;
    const item: CartItem = { product, quantity: line.quantity, lineTotal, free: !!line.free };
    const arr = bySeller.get(product.seller) ?? [];
    arr.push(item);
    bySeller.set(product.seller, arr);
  }

  const sellers: CartSeller[] = [];
  for (const [name, items] of bySeller) {
    const type = items[0].product.source;
    const cfg = SELLER_CONFIG[name] ?? DEFAULT_CONFIG;
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const savings = items.reduce(
      (s, i) => s + (i.free ? 0 : Math.max(0, (i.product.mrp - i.product.price) * i.quantity)),
      0
    );

    let status: CartStatus;
    if (subtotal < cfg.mov) status = 'below';
    else if (subtotal < cfg.freeDeliveryAt) status = 'paid';
    else status = 'free';

    sellers.push({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      type,
      items,
      subtotal,
      savings,
      mov: cfg.mov,
      freeDeliveryAt: cfg.freeDeliveryAt,
      status,
      deliveryFee: status === 'paid' ? 30 : 0,
      unlockRemaining: status === 'below' ? cfg.mov - subtotal : 0,
      progress: Math.min(100, Math.round((subtotal / cfg.mov) * 100)),
      windows: cfg.windows,
    });
  }

  const grandTotal = sellers.reduce((s, x) => s + x.subtotal, 0);
  const totalItems = sellers.reduce((n, s) => n + s.items.length, 0);
  const anyBelow = sellers.some((s) => s.status === 'below');
  return { sellers, grandTotal, totalItems, anyBelow };
}
