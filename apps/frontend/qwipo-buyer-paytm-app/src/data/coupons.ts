// Offers & schemes for the Apply Coupon screen. Self-contained mock —
// every card's state is DERIVED from the cart at render time, so the numbers
// on screen ("add 30 more units") always agree with what's actually in it.
//
// Two kinds of offer, told apart by `automatic`:
//   • schemes  — trade offers the seller runs (case bonus, freebie, combo).
//     They apply themselves the moment the cart qualifies; the buyer never
//     picks one. Until it qualifies, the card says what's missing and offers
//     to add it.
//   • coupons  — the buyer chooses to apply, and can only hold one at a time.

import { PRODUCTS } from './products';

/** One product requirement inside a scheme. */
export interface OfferNeed {
  productId: string;
  /** Units of that product the scheme needs. */
  qty: number;
}

export interface Offer {
  id: string;
  /** Scheme name — rendered in quotes ahead of the benefit. Schemes only. */
  label?: string;
  /** The benefit itself — the emphasised part of the headline. */
  benefit: string;
  /** What the benefit applies to — trails the benefit in the same sentence. */
  scope: string;
  /** Schemes apply themselves; coupons wait for the buyer to tap Apply. */
  automatic: boolean;
  /** Scheme requirement — every line must be met. */
  needs?: OfferNeed[];
  /** Coupon requirement — cart value (₹). */
  minOrder?: number;
  /** Free goods this scheme grants once `needs` are met — Cart Summary and
   * View Items show this as an actual ₹0 line, so "Applied automatically"
   * here always matches a real free item in the cart, not just a label.
   * Percent-off schemes (Discount, Combo, Slab) have no reward — there's no
   * free product to show a line for. */
  reward?: OfferNeed;
  /** Percentage this scheme takes off once `needs` are met — the Combo/Slab
   * counterpart to `reward`: cart.ts applies it to the first `needs` line's
   * total, so "15% Off" is money actually off the order, not just a label.
   * Mutually exclusive with `reward` — a scheme pays out one or the other. */
  discountPct?: number;
  /** Last day the offer runs — shown when the card is expanded. */
  expires?: string;
  /** Conditions beyond the headline. Left unset on almost every offer:
   * `offerTerms()` below writes them from the offer's own numbers, so a
   * term can't drift out of step with the rule it describes. Set this only
   * for a condition the shape of the offer doesn't already state. */
  terms?: string[];
}

/* Written against the demo cart: 12 × Freedom Oil, 8 × Aashirvaad Atta,
   20 × Fortune Besan, 2 × Red Label Tea. That makes the oil, atta and combo
   schemes live, and leaves the besan case bonus 30 units short — one card in
   each state, without any of it being hard-coded. */
export const OFFERS: Offer[] = [
  {
    id: 'save5',
    expires: '15 Oct 2026',
    label: '5% Off',
    benefit: 'Get 5% off',
    scope: 'on your order above ₹500 upto ₹100',
    automatic: false,
    minOrder: 500,
  },
  {
    id: 'oil-case',
    expires: '31 Oct 2026',
    label: 'Bogo',
    benefit: 'Buy 10 Cases Get 1 Free',
    scope: 'on Freedom Refined Sunflower Oil',
    automatic: true,
    needs: [{ productId: 'p1', qty: 10 }],
    reward: { productId: 'p1', qty: 1 },
  },
  {
    id: 'atta-freebie',
    expires: '30 Nov 2026',
    label: 'Freebie',
    benefit: 'Buy 8 units → Get 1 FREE',
    scope: 'on Aashirvaad Atta',
    automatic: true,
    needs: [{ productId: 'p2', qty: 8 }],
    reward: { productId: 'p2', qty: 1 },
  },
  {
    id: 'besan-bonus',
    expires: '15 Nov 2026',
    label: 'Case Bonus',
    benefit: 'Buy 50 units → Get 5 FREE',
    scope: 'on Fortune Besan',
    automatic: true,
    needs: [{ productId: 'p3', qty: 50 }],
    reward: { productId: 'p3', qty: 5 },
  },
  {
    id: 'besan-combo',
    expires: '31 Dec 2026',
    label: 'Combo',
    benefit: '15% Off',
    scope: 'on Fortune Besan when bought together with Red Label Tea',
    automatic: true,
    needs: [
      { productId: 'p3', qty: 1 },
      { productId: 'p10', qty: 1 },
    ],
    discountPct: 15,
  },

  /* ── Tata Consumer Products (TCPL) — real schemes from TCP's own Salesforce
     export (see data/tcpl.ts). Thresholds are expressed in the same
     productId+qty shape every other scheme here uses; a value-based slab
     (Soulfull) is approximated at the unit count its lowest ₹ tier needs. */
  {
    label: 'Slab',
    benefit: '4.5% Off',
    scope: 'on 5+ cases of Tata Salt Black Salt Sachet',
    automatic: true,
    needs: [{ productId: 'p22', qty: 900 }], // 5 cases × 180 pcs/case
    discountPct: 4.5,
    id: 'tcp-black-salt',
    expires: '20 Oct 2026',
  },
  {
    label: 'Slab',
    benefit: 'Up to 15% Off',
    scope: 'on Soulfull Masala Oats+ (Masala), by order value',
    automatic: true,
    needs: [{ productId: 'p24', qty: 4 }], // ≈ ₹500 (the lowest tier) at ₹155/pc
    discountPct: 15, // flat rate for the demo — the real scheme is a multi-tier "up to"
    id: 'tcp-masala-oats',
    expires: '30 Nov 2026',
  },
  {
    label: 'Wafer Bogo',
    benefit: 'Buy 1 Case Get 1 Free',
    scope: 'on Soulfull Ragi Bites Strawberry Wafer',
    automatic: true,
    needs: [{ productId: 'p28', qty: 24 }], // 1 case
    reward: { productId: 'p28', qty: 24 }, // 1 free case = 24 pcs
    id: 'tcp-wafer-bogo-strawberry',
    expires: '15 Dec 2026',
  },

  /* ── Offer-pattern coverage — one SKU per scheme type below (see
     data/products.ts p31–p39), plus two SKUs stacking two patterns and one
     flagship SKU carrying all five at once. Written against the demo cart
     the same way the block above is: most qualify out of the box, one
     (Sunfeast Marie Gold's Slab) is left short so the "needs-items" state
     still has a live example. */
  {
    label: 'Bogo',
    benefit: 'Buy 1 Case Get 1 Free',
    scope: 'on Everest Garam Masala',
    automatic: true,
    needs: [{ productId: 'p31', qty: 24 }],
    reward: { productId: 'p31', qty: 24 },
    id: 'everest-garam-masala-bogo',
    expires: '31 Oct 2026',
  },
  {
    label: 'Freebie',
    benefit: 'Buy 6 units → Get 1 FREE',
    scope: 'on Lifebuoy Handwash',
    automatic: true,
    needs: [{ productId: 'p32', qty: 6 }],
    reward: { productId: 'p32', qty: 1 },
    id: 'lifebuoy-handwash-freebie',
    expires: '30 Nov 2026',
  },
  {
    label: 'Case Bonus',
    benefit: 'Buy 20 units → Get 2 FREE',
    scope: 'on Tata Tea Gold',
    automatic: true,
    needs: [{ productId: 'p33', qty: 20 }],
    reward: { productId: 'p33', qty: 2 },
    id: 'tata-tea-gold-bonus',
    expires: '10 Nov 2026',
  },
  {
    // A flat, single-tier % off — the plain "Discount" pattern, distinct from
    // Slab's quantity tiers and Combo's two-SKU requirement.
    label: 'Discount',
    benefit: '10% Off',
    scope: 'on 5+ units of Himalaya Neem Face Wash',
    automatic: true,
    needs: [{ productId: 'p20', qty: 5 }],
    discountPct: 10,
    id: 'himalaya-facewash-discount',
    expires: '31 Dec 2026',
  },
  {
    label: 'Combo',
    benefit: '10% Off',
    scope: 'on Vim Dishwash Bar when bought together with Surf Excel Easy Wash Detergent',
    automatic: true,
    needs: [
      { productId: 'p34', qty: 1 },
      { productId: 'p35', qty: 1 },
    ],
    discountPct: 10, // applied to Vim Dishwash Bar's line
    id: 'vim-surf-combo',
    expires: '25 Oct 2026',
  },
  {
    label: 'Slab',
    benefit: '6% Off',
    scope: 'on 5+ cases of Sunfeast Marie Gold Biscuits',
    automatic: true,
    needs: [{ productId: 'p36', qty: 60 }], // 5 cases × 12 pcs/case
    discountPct: 6,
    id: 'sunfeast-marie-gold-slab',
    expires: '30 Nov 2026',
  },
  {
    label: 'Bogo',
    benefit: 'Buy 1 Case Get 1 Free',
    scope: 'on Colgate Strong Teeth Toothpaste',
    automatic: true,
    needs: [{ productId: 'p37', qty: 12 }],
    reward: { productId: 'p37', qty: 12 },
    id: 'colgate-toothpaste-bogo',
    expires: '15 Dec 2026',
  },
  {
    label: 'Slab',
    benefit: '7% Off',
    scope: 'on 5+ cases of Colgate Strong Teeth Toothpaste',
    automatic: true,
    needs: [{ productId: 'p37', qty: 60 }], // 5 cases × 12 pcs/case
    discountPct: 7, // stacks with the Bogo above on the same SKU
    id: 'colgate-toothpaste-slab',
    expires: '31 Oct 2026',
  },
  {
    label: 'Freebie',
    benefit: 'Buy 8 units → Get 1 FREE',
    scope: 'on Tata Sampann Toor Dal',
    automatic: true,
    needs: [{ productId: 'p38', qty: 8 }],
    reward: { productId: 'p38', qty: 1 },
    id: 'tata-sampann-toor-dal-freebie',
    expires: '20 Nov 2026',
  },
  {
    label: 'Case Bonus',
    benefit: 'Buy 40 units → Get 4 FREE',
    scope: 'on Tata Sampann Toor Dal',
    automatic: true,
    needs: [{ productId: 'p38', qty: 40 }],
    reward: { productId: 'p38', qty: 4 },
    // stacks with the Freebie above on the same SKU
    id: 'tata-sampann-toor-dal-bonus',
    expires: '31 Dec 2026',
  },
  {
    label: 'Bogo',
    benefit: 'Buy 1 Case Get 1 Free',
    scope: 'on Tata Salt Iodised',
    automatic: true,
    needs: [{ productId: 'p39', qty: 20 }],
    reward: { productId: 'p39', qty: 20 },
    id: 'tata-salt-iodised-bogo',
    expires: '15 Nov 2026',
  },
  {
    label: 'Freebie',
    benefit: 'Buy 6 units → Get 1 FREE',
    scope: 'on Tata Salt Iodised',
    automatic: true,
    needs: [{ productId: 'p39', qty: 6 }],
    reward: { productId: 'p39', qty: 1 },
    id: 'tata-salt-iodised-freebie',
    expires: '30 Nov 2026',
  },
  {
    label: 'Case Bonus',
    benefit: 'Buy 50 units → Get 5 FREE',
    scope: 'on Tata Salt Iodised',
    automatic: true,
    needs: [{ productId: 'p39', qty: 50 }],
    reward: { productId: 'p39', qty: 5 },
    id: 'tata-salt-iodised-bonus',
    expires: '31 Dec 2026',
  },
  {
    // Parle-G has a scheme but no quantity price slab (see products.ts) — the
    // SKU that exercises the Discounts sheet with only one section in it.
    label: 'Freebie',
    benefit: 'Buy 24 units → Get 2 FREE',
    scope: 'on Parle-G Gold Biscuits',
    automatic: true,
    needs: [{ productId: 'p40', qty: 24 }],
    reward: { productId: 'p40', qty: 2 },
    id: 'parle-g-gold-freebie',
    expires: '25 Nov 2026',
  },
  {
    label: 'Slab',
    benefit: '12% Off',
    scope: 'on 5+ cases of Tata Salt Iodised',
    automatic: true,
    needs: [{ productId: 'p39', qty: 100 }], // 5 cases × 20 pcs/case
    discountPct: 12,
    id: 'tata-salt-iodised-slab',
    expires: '31 Oct 2026',
  },
  {
    label: 'Combo',
    benefit: '10% Off',
    scope: 'on Tata Salt Iodised when bought together with Tata Salt Black Salt Sachet',
    automatic: true,
    needs: [
      { productId: 'p39', qty: 1 },
      { productId: 'p22', qty: 1 },
    ],
    discountPct: 10,
    id: 'tata-salt-iodised-combo',
    expires: '15 Dec 2026',
  },
];

/** Every card is in exactly one of these. */
export type OfferState =
  /** Scheme, cart qualifies — nothing for the buyer to do. */
  | 'auto'
  /** Scheme, cart is short — show what's missing and offer to add it. */
  | 'needs-items'
  /** Coupon the buyer can take right now. */
  | 'available'
  /** Coupon the buyer has taken. */
  | 'applied'
  /** Coupon the cart doesn't reach yet. */
  | 'locked';

export interface ResolvedOffer {
  offer: Offer;
  state: OfferState;
  /** "Add 30 more units of Fortune Besan" — set on `needs-items` / `locked`. */
  requirement?: string;
}

/**
 * The conditions shown when an offer card is expanded.
 *
 * Written from the offer's own fields rather than stored alongside them, so a
 * term can never contradict the rule it describes — change a scheme's `needs`
 * and its terms follow. `offer.terms` overrides, for the rare condition the
 * offer's shape doesn't already imply.
 */
export function offerTerms(offer: Offer): string[] {
  if (offer.terms) return offer.terms;
  const out: string[] = ['Applicable only on eligible products from this seller.'];

  for (const n of offer.needs ?? []) {
    out.push(`Needs ${n.qty} ${n.qty === 1 ? 'unit' : 'units'} of ${shortName(n.productId)} in the cart.`);
  }
  if (offer.minOrder) {
    out.push(`Minimum order value of \u20b9${offer.minOrder.toLocaleString('en-IN')}.`);
  }
  if (offer.reward) {
    out.push(
      `Free goods (${offer.reward.qty} \u00d7 ${shortName(offer.reward.productId)}) are added to the same seller's order at \u20b90.`
    );
  }
  if (offer.discountPct) {
    out.push(`${offer.discountPct}% comes off the qualifying line, not the whole order.`);
  }
  out.push(
    offer.automatic
      ? 'Applies automatically \u2014 no code to enter, and it comes off again if the cart stops qualifying.'
      : 'One coupon per order. Applying another replaces this one.'
  );
  return out;
}

const shortName = (id: string) => PRODUCTS.find((p) => p.id === id)?.shortName ?? 'this product';

/**
 * Work out what a card should show, given the cart.
 *
 * @param qtyOf      units of a product currently in the cart
 * @param cartValue  cart grand total, for coupon minimums
 * @param appliedId  the coupon the buyer has applied, if any
 */
export function resolveOffer(
  offer: Offer,
  qtyOf: (productId: string) => number,
  cartValue: number,
  appliedId: string | null
): ResolvedOffer {
  if (offer.automatic) {
    const short = (offer.needs ?? []).find((n) => qtyOf(n.productId) < n.qty);
    if (!short) return { offer, state: 'auto' };
    return {
      offer,
      state: 'needs-items',
      requirement: `Add ${short.qty - qtyOf(short.productId)} more units of ${shortName(short.productId)}`,
    };
  }

  if (appliedId === offer.id) return { offer, state: 'applied' };
  const min = offer.minOrder ?? 0;
  if (cartValue < min) {
    return {
      offer,
      state: 'locked',
      requirement: `Add ₹${(min - cartValue).toLocaleString('en-IN')} more to use this coupon`,
    };
  }
  return { offer, state: 'available' };
}

/** Every scheme label live on this SKU (Bogo, Freebie, Case Bonus, Slab,
 * Combo — in the order data/coupons.ts defines them), deduped. Empty when
 * the SKU carries no offer. Derived from `OFFERS` at call time, so it can
 * never drift out of sync with what Apply Offer / the Discounts sheet
 * actually show for this product. */
export function offerLabelsFor(productId: string): string[] {
  const labels = OFFERS.filter((o) => o.needs?.some((n) => n.productId === productId)).map(
    (o) => o.label ?? o.benefit
  );
  return Array.from(new Set(labels));
}

/** " — BOGO + SLAB" style suffix for a product's display name, so a SKU
 * carrying an offer is identifiable at a glance in any list — the Product
 * List, Reorder, search results — without opening it. Empty string when the
 * SKU has no offer (see offerLabelsFor). */
export function offerNameSuffix(productId: string): string {
  const labels = offerLabelsFor(productId);
  return labels.length ? ` — ${labels.map((l) => l.toUpperCase()).join(' + ')}` : '';
}
