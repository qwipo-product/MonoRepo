import { PRODUCTS, type Product } from './products';
import { deliveryFor, dayLabel } from './delivery';

/* Self-contained cart mock. The Shop section (product list → selling-units →
   add-to-cart) is owned by another developer, so Cart Summary carries its own
   seeded lines and derives the multi-seller view here — it renders fully for
   review without depending on the live add-to-cart flow.

   Each seller resolves to one of three retailer-facing states:
     • free  — at/above the free-delivery threshold  → ELIGIBLE · FREE DELIVERY
     • paid  — above minimum but below free threshold → PAID DELIVERY (₹30)
     • below — under the minimum order value          → BELOW MINIMUM (blocks checkout) */

export type CartStatus = 'free' | 'paid' | 'below';

// Weight per selling unit (kg) for the seeded cart products — drives the
// Minimum Order Weight (MOW) check alongside the value-based MOV.
export const UNIT_WEIGHT_KG: Record<string, number> = {
  p1: 1, // Freedom Oil 1 L
  p2: 5, // Aashirvaad Atta 5 kg
  p3: 0.5, // Fortune Besan 500 g
  p4: 0.28, // Maggi 280 g
  p5: 0.15, // Mysore Soap 150 g
  p8: 0.15, // Close Up 150 g
  p9: 0.1, // Dabur Red 100 g
  p10: 0.25, // Red Label Tea 250 g
};

/** Minimum order WEIGHT (kg) per seller. 0 → no weight minimum. */
export const SELLER_MOW: Record<string, number> = {
  'Sri Sai Krishna Traders': 25, // ~53 kg in cart → cleared
  'Omkar Enterprises': 25, // ~13 kg in cart → MOW alert (MOV is fine → MOW only)
  'Karnataka Soaps & Detergents': 5, // ~0.45 kg → MOW alert (also below MOV → both)
};

export const itemWeight = (item: CartItem): number =>
  item.quantity * (UNIT_WEIGHT_KG[item.product.id] ?? 0);

export interface CartLine {
  productId: string;
  quantity: number;
  /** Promotional free unit — shows a FREE badge and a ₹0 line. */
  free?: boolean;
}


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

/* Price the buyer saw when the item went into the cart, for the lines that have
   since moved. Sellers re-rate stock daily, so a cart left overnight is the
   normal case, not an edge case — the buyer has to see it before checkout.
   Only lines listed here changed; everything else held its price. */
const PRICE_WHEN_ADDED: Record<string, number> = {
  p1: 158, // Freedom Sunflower Oil — went UP
  p9: 96, // Dabur Red             — went UP
  p10: 245, // Red Label Tea       — came DOWN
};

export interface CartItem {
  product: Product;
  quantity: number;
  lineTotal: number;
  free: boolean;
  /** Unit price when the item was added — absent when it hasn't moved. */
  priceWhenAdded?: number;
  /** Per-unit delta: + dearer, − cheaper. 0/undefined when unchanged. */
  priceDelta?: number;
  /** Delta across this whole line (priceDelta × quantity). */
  lineDelta?: number;
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
  windows: string[];
  // ── Minimum Order Weight (MOW) ──
  /** Minimum order weight (kg) for this seller; 0 → no weight minimum. */
  mow: number;
  /** Current order weight (kg) for this seller. */
  weight: number;
  /** True when weight is under the seller's MOW. */
  belowWeight: boolean;
  /** kg still needed to clear the MOW (0 unless belowWeight). */
  weightRemaining: number;
  /** 0–100, weight toward the MOW. */
  weightProgress: number;
  /** Checkout is blocked when below MOV or below MOW. */
  blocked: boolean;
}

/** Cart-wide summary of what re-rating did to this order. */
export interface PriceChangeSummary {
  /** Lines whose unit price moved since they were added. */
  changed: number;
  /** How many went up / came down. */
  up: number;
  down: number;
  /** Net rupee effect on the order total: + dearer, − cheaper. */
  net: number;
}

export function buildCart(): {
  sellers: CartSeller[];
  grandTotal: number;
  totalItems: number;
  anyBelow: boolean;
  priceChanges: PriceChangeSummary;
} {
  const bySeller = new Map<string, CartItem[]>();

  for (const line of CART_LINES) {
    const product = PRODUCTS.find((p) => p.id === line.productId);
    if (!product) continue;
    const lineTotal = line.free ? 0 : product.price * line.quantity;
    const was = line.free ? undefined : PRICE_WHEN_ADDED[product.id];
    const priceDelta = was != null ? product.price - was : undefined;
    const item: CartItem = {
      product,
      quantity: line.quantity,
      lineTotal,
      free: !!line.free,
      priceWhenAdded: was,
      priceDelta,
      lineDelta: priceDelta != null ? priceDelta * line.quantity : undefined,
    };
    const arr = bySeller.get(product.seller) ?? [];
    arr.push(item);
    bySeller.set(product.seller, arr);
  }

  const sellers: CartSeller[] = [];
  for (const [name, items] of bySeller) {
    const type = items[0].product.source;
    const d = deliveryFor(name);
    // MOV is per delivery day; gate on the lowest (clear the cheapest day → order
    // allowed). A day with no MOV (e.g. Omkar) → 0, so the seller never blocks.
    const mov = Math.min(...d.options.map((o) => o.mov ?? 0));
    const cfg = { mov, freeDeliveryAt: d.freeDeliveryAt, windows: d.options.map(dayLabel) };
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const savings = items.reduce(
      (s, i) => s + (i.free ? 0 : Math.max(0, (i.product.mrp - i.product.price) * i.quantity)),
      0
    );

    let status: CartStatus;
    if (subtotal < cfg.mov) status = 'below';
    else if (subtotal < cfg.freeDeliveryAt) status = 'paid';
    else status = 'free';

    const mow = SELLER_MOW[name] ?? 0;
    const weight = items.reduce((s, i) => s + itemWeight(i), 0);
    const belowWeight = mow > 0 && weight < mow;

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
      mow,
      weight,
      belowWeight,
      weightRemaining: belowWeight ? mow - weight : 0,
      weightProgress: mow > 0 ? Math.min(100, Math.round((weight / mow) * 100)) : 100,
      blocked: status === 'below' || belowWeight,
    });
  }

  const grandTotal = sellers.reduce((s, x) => s + x.subtotal, 0);
  const totalItems = sellers.reduce((n, s) => n + s.items.length, 0);
  const anyBelow = sellers.some((s) => s.blocked);

  const moved = sellers.flatMap((s) => s.items).filter((i) => !!i.priceDelta);
  const priceChanges: PriceChangeSummary = {
    changed: moved.length,
    up: moved.filter((i) => (i.priceDelta ?? 0) > 0).length,
    down: moved.filter((i) => (i.priceDelta ?? 0) < 0).length,
    net: moved.reduce((n, i) => n + (i.lineDelta ?? 0), 0),
  };

  return { sellers, grandTotal, totalItems, anyBelow, priceChanges };
}
