import { PRODUCTS, type Product } from './products';
import { WHOLESALER_PRODUCTS, cheapestVendorId, type WholesalerProduct, type WholesalerVendor } from './wholesaler';
import { deliveryFor, dayLabel } from './delivery';
import { OFFERS } from './coupons';

/* Cart Summary reads the SAME quantities the buyer picked on the Product List /
   Reorder / Wholesaler List screens — `buildCart()` takes them as arguments
   instead of a fixed seed, so adding something there shows up here too. The
   cart opens empty (App.tsx's `qty` starts at `{}`) — everything in it is
   something the buyer actually added.

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
  p31: 0.1, // Everest Garam Masala 100 g
  p32: 0.2, // Lifebuoy Handwash 200 ml
  p33: 1, // Tata Tea Gold 1 kg
  p34: 0.3, // Vim Dishwash Bar 300 g
  p35: 1, // Surf Excel Detergent 1 kg
  p36: 1, // Sunfeast Marie Gold Biscuits 1 kg
  p37: 0.2, // Colgate Toothpaste 200 g
};

/** Minimum order WEIGHT (kg) per seller. 0 → no weight minimum. */
export const SELLER_MOW: Record<string, number> = {
  'Sri Sai Krishna Traders': 25, // ~53 kg in cart → cleared
  'Omkar Enterprises': 25, // ~13 kg in cart → MOW alert (MOV is fine → MOW only)
  'Karnataka Soaps & Detergents': 5, // ~0.45 kg → MOW alert (also below MOV → both)
};

export const itemWeight = (item: CartItem): number =>
  item.quantity * (UNIT_WEIGHT_KG[item.product.id] ?? 0);

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
  /** One entry per percentage scheme (Slab/Combo) currently discounting this
   * line — the cart's answer to "or the discounted amount" for offers that
   * don't pay out in free goods. A line can carry more than one (a SKU can
   * stack a Slab and a Combo at once). Each `amount` is already folded into
   * `lineTotal`; kept separately so the UI can show it as its own line. */
  offerTags?: { label: string; amount: number }[];
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

/** A WholesalerProduct + the vendor the buyer picked, in the same shape every
 * other screen already reads (CartItem.product : Product) — so View Items,
 * Order Summary, the Alerts sheet etc. need no wholesaler-specific branches. */
function wholesaleAsProduct(wp: WholesalerProduct, vendor: WholesalerVendor): Product {
  return {
    id: wp.id,
    name: wp.name,
    shortName: wp.name,
    category: wp.category,
    caseLabel: wp.caseLabel,
    caseSize: wp.caseSize,
    image: wp.image,
    variants: wp.variants,
    seller: vendor.name,
    source: 'wholesaler',
    delivery: vendor.delivery,
    margin: vendor.margin,
    price: vendor.price,
    mrp: vendor.mrp,
    deliveryDay: vendor.delivery,
    mov: 0,
  };
}

export function buildCart(
  /** Live quantities from the Product List / Reorder screens, keyed by product id. */
  qty: Record<string, number>,
  /** Live quantities from the Wholesaler List, keyed by wp-id. */
  wholesaleQty: Record<string, number> = {},
  /** Chosen vendor per wp-id; falls back to the cheapest. */
  wholesaleVendor: Record<string, string> = {}
): {
  sellers: CartSeller[];
  grandTotal: number;
  totalItems: number;
  anyBelow: boolean;
  priceChanges: PriceChangeSummary;
} {
  const bySeller = new Map<string, CartItem[]>();
  // Paid lines by product id, so the percentage-offer pass below can find and
  // discount the exact line a Slab/Combo applies to.
  const itemByProductId = new Map<string, CartItem>();

  const addItem = (product: Product, quantity: number) => {
    if (quantity <= 0) return;
    const lineTotal = product.price * quantity;
    const was = PRICE_WHEN_ADDED[product.id];
    const priceDelta = was != null ? product.price - was : undefined;
    const item: CartItem = {
      product,
      quantity,
      lineTotal,
      free: false,
      priceWhenAdded: was,
      priceDelta,
      lineDelta: priceDelta != null ? priceDelta * quantity : undefined,
    };
    const arr = bySeller.get(product.seller) ?? [];
    arr.push(item);
    bySeller.set(product.seller, arr);
    itemByProductId.set(product.id, item);
  };

  const addFreeItem = (product: Product, quantity: number) => {
    if (quantity <= 0) return;
    const item: CartItem = { product, quantity, lineTotal: 0, free: true };
    const arr = bySeller.get(product.seller) ?? [];
    arr.push(item);
    bySeller.set(product.seller, arr);
  };

  for (const [productId, quantity] of Object.entries(qty)) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (product) addItem(product, quantity);
  }
  for (const [wpId, quantity] of Object.entries(wholesaleQty)) {
    const wp = WHOLESALER_PRODUCTS.find((p) => p.id === wpId);
    if (!wp) continue;
    const vendorId = wholesaleVendor[wpId] ?? cheapestVendorId(wp);
    const vendor = wp.vendors.find((v) => v.id === vendorId) ?? wp.vendors[0];
    addItem(wholesaleAsProduct(wp, vendor), quantity);
  }

  // Percentage schemes (Slab/Combo) — once `needs` are met, take the % off the
  // first `needs` line's total, right here in the cart, instead of leaving
  // "15% Off" as a label the total never actually reflects.
  for (const offer of OFFERS) {
    if (!offer.automatic || !offer.discountPct) continue;
    const needs = offer.needs ?? [];
    const short = needs.some((n) => (qty[n.productId] ?? 0) < n.qty);
    if (short || needs.length === 0) continue;
    const target = itemByProductId.get(needs[0].productId);
    if (!target) continue;
    const amount = Math.round((target.lineTotal * offer.discountPct) / 100);
    target.lineTotal -= amount;
    target.offerTags = [
      ...(target.offerTags ?? []),
      { label: `${offer.discountPct}% Off — ${offer.label ?? 'Offer'}`, amount },
    ];
  }

  // Promo free units — one per automatic Offer whose `needs` the cart actually
  // meets, so "Applied automatically" on the Offers page always matches a real
  // ₹0 line here, for BOTH the schemes and their free goods.
  for (const offer of OFFERS) {
    if (!offer.automatic || !offer.reward) continue;
    const short = (offer.needs ?? []).some((n) => (qty[n.productId] ?? 0) < n.qty);
    if (short) continue;
    const product = PRODUCTS.find((p) => p.id === offer.reward!.productId);
    if (product) addFreeItem(product, offer.reward.qty);
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
      (s, i) =>
        s +
        (i.free ? 0 : Math.max(0, (i.product.mrp - i.product.price) * i.quantity)) +
        (i.offerTags?.reduce((a, t) => a + t.amount, 0) ?? 0),
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
