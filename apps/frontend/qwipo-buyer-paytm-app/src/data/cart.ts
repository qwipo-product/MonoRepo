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
  p40: 0.1, // Parle-G Gold 100 g
};

/** Minimum order WEIGHT (kg) per seller. 0 → no weight minimum. */
export const SELLER_MOW: Record<string, number> = {
  'Sri Sai Krishna Traders': 25, // ~53 kg in cart → cleared
  'Omkar Enterprises': 25, // ~13 kg in cart → MOW alert (MOV is fine → MOW only)
  'Karnataka Soaps & Detergents': 5, // ~0.45 kg → MOW alert (also below MOV → both)
};

/* What the cart starts with.
 *
 * The cart is built from the buyer's own picked quantities, so an empty one
 * means every offer screen opens empty too and there's nothing to walk a
 * stakeholder through. These seed it with SKUs across three sellers, chosen
 * so that every kind of scheme AND both of its states are on screen at once:
 *
 *   p1  × 16  Sri Sai   Bogo ...................... qualifies
 *   p2  ×  8  Sri Sai   Freebie ................... qualifies
 *   p40 × 12  Sri Sai   Freebie (needs 24) ........ short → Add Items
 *                       — and the SKU with no price slab
 *   p3  × 20  Omkar     Case Bonus (needs 50) ..... short → Add Items
 *   p10 ×  2  Omkar     Combo with p3 ............. qualifies
 *                       — Omkar's ₹5,000 minimum is unmet, so the cart's
 *                         minimum-order-value bar shows on that card
 *   p39 × 20  Tata      Bogo + Freebie ............ qualify
 *                       Case Bonus, Slab, Combo ... short
 *   p5  ×  4  Karnataka a few bars of soap ........ under both minimums
 *
 * The four sellers also cover every combination of the two minimums, so the
 * cart shows all of them side by side:
 *
 *   Sri Sai     ₹6,120 / 53 kg  — clears both ........ no bar
 *   Omkar       no MOV, 13 kg   — weight only ........ weight bar
 *   Tata        ₹480 of ₹2,000  — no MOW set ......... value bar
 *   Karnataka   ₹168 / 0.6 kg   — under both ......... both bars
 *
 * Nothing depends on these being present — clear the cart and every screen
 * still behaves, it just has less to show.
 */
export const INITIAL_QTY: Record<string, number> = {
  p1: 16,
  p2: 8,
  p40: 12,
  p3: 20,
  p10: 2,
  p39: 20,
  p5: 4,
};

export const itemWeight = (item: CartItem): number =>
  item.quantity * (UNIT_WEIGHT_KG[item.product.id] ?? item.unitKg ?? 0);

/* Kilos in one selling unit, read off the pack label the buyer picked:
   "1 Ltr" → 1, "500 ml" → 0.5, "15 Kg" → 15, "250 g" → 0.25. Litres are
   carried as kilos, which is how freight is charged on oil. A label that
   isn't a weight ("Set of 6") falls back to the SKU's own unitKg. */
export function variantKg(label: string): number | undefined {
  const m = /([\d.]+)\s*(kg|g|ltr|lt|l|ml)\b/i.exec(label);
  if (!m) return undefined;
  const n = Number(m[1]);
  switch (m[2].toLowerCase()) {
    case 'kg':
      return n;
    case 'g':
      return n / 1000;
    case 'ml':
      return n / 1000;
    default:
      return n; // litres ≈ kilos
  }
}

/** "₹2/kg" → 2, "₹1.5/kg" → 1.5, "Free" → 0. */
export const perKgRate = (fee: string): number => {
  const m = /([\d.]+)\s*\/\s*kg/i.exec(fee);
  return m ? Number(m[1]) : 0;
};

/** What this line costs to carry: rate per kilo × kilos ordered. */
export const lineFreight = (item: CartItem): number =>
  (item.freightPerKg ?? 0) * item.quantity * (item.unitKg ?? 0);

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
  /* Wholesale freight: what this vendor charges per kilo, and what one unit
     weighs. Both sit on the line because freight is quoted per kilo and a
     cart line is the only place that knows how many kilos were ordered.
     Absent on a distributor line — those deliver on the seller's own terms. */
  freightPerKg?: number;
  unitKg?: number;
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
  /** Checkout is blocked when below MOV or below MOW. */
  blocked: boolean;
  /* What this seller charges to carry the order: their per-kilo rate across
     the kilos ordered. 0 for a distributor, and 0 for a wholesaler who
     delivers free. */
  freight: number;
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
  /** Delivery across the whole cart — the per-kilo freight every vendor adds. */
  freightTotal: number;
  totalItems: number;
  anyBelow: boolean;
  priceChanges: PriceChangeSummary;
} {
  const bySeller = new Map<string, CartItem[]>();
  // Paid lines by product id, so the percentage-offer pass below can find and
  // discount the exact line a Slab/Combo applies to.
  const itemByProductId = new Map<string, CartItem>();

  const addItem = (
    product: Product,
    quantity: number,
    freight?: { freightPerKg: number; unitKg: number }
  ) => {
    if (quantity <= 0) return;
    const lineTotal = product.price * quantity;
    const was = PRICE_WHEN_ADDED[product.id];
    const priceDelta = was != null ? product.price - was : undefined;
    const item: CartItem = {
      product,
      quantity,
      lineTotal,
      free: false,
      ...freight,
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
    /* Freight travels with the line: the vendor's per-kilo rate from the card
       the buyer chose, and the kilos in one unit from the pack it's listed
       at. The cart is where the two meet the quantity. */
    addItem(wholesaleAsProduct(wp, vendor), quantity, {
      freightPerKg: perKgRate(vendor.fee),
      unitKg: wp.unitKg ?? variantKg(wp.variants[0]?.label ?? '') ?? 1,
    });
  }

  /* Schemes are checked against BOTH catalogues. A wholesale line is a cart
     line like any other — it just came from a vendor rather than a
     distributor — so its quantity has to count toward a scheme's `needs` or
     a wholesale offer could never fire. */
  const allQty: Record<string, number> = { ...qty, ...wholesaleQty };

  // Percentage schemes (Slab/Combo) — once `needs` are met, take the % off the
  // first `needs` line's total, right here in the cart, instead of leaving
  // "15% Off" as a label the total never actually reflects.
  for (const offer of OFFERS) {
    if (!offer.automatic || !offer.discountPct) continue;
    const needs = offer.needs ?? [];
    const short = needs.some((n) => (allQty[n.productId] ?? 0) < n.qty);
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
    const short = (offer.needs ?? []).some((n) => (allQty[n.productId] ?? 0) < n.qty);
    if (short) continue;
    const rewardId = offer.reward.productId;
    const product = PRODUCTS.find((p) => p.id === rewardId);
    if (product) {
      addFreeItem(product, offer.reward.qty);
      continue;
    }
    // wholesale reward — priced at the vendor the buyer picked for that SKU
    const wp = WHOLESALER_PRODUCTS.find((w) => w.id === rewardId);
    if (!wp) continue;
    const v = wp.vendors.find((x) => x.id === (wholesaleVendor[rewardId] ?? cheapestVendorId(wp))) ?? wp.vendors[0];
    addFreeItem(wholesaleAsProduct(wp, v), offer.reward.qty);
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
      freight: items.reduce((n, i) => n + lineFreight(i), 0),
      unlockRemaining: status === 'below' ? cfg.mov - subtotal : 0,
      windows: cfg.windows,
      mow,
      weight,
      belowWeight,
      weightRemaining: belowWeight ? mow - weight : 0,
      blocked: status === 'below' || belowWeight,
    });
  }

  const grandTotal = sellers.reduce((s, x) => s + x.subtotal, 0);
  /** Every seller's freight added up — what the cart costs to deliver. */
  const freightTotal = sellers.reduce((s, x) => s + x.freight, 0);
  const totalItems = sellers.reduce((n, s) => n + s.items.length, 0);
  const anyBelow = sellers.some((s) => s.blocked);

  const moved = sellers.flatMap((s) => s.items).filter((i) => !!i.priceDelta);
  const priceChanges: PriceChangeSummary = {
    changed: moved.length,
    up: moved.filter((i) => (i.priceDelta ?? 0) > 0).length,
    down: moved.filter((i) => (i.priceDelta ?? 0) < 0).length,
    net: moved.reduce((n, i) => n + (i.lineDelta ?? 0), 0),
  };

  return { sellers, grandTotal, freightTotal, totalItems, anyBelow, priceChanges };
}
