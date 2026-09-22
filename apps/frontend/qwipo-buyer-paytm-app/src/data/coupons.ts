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
  /** Still matched by the "Have a coupon code?" field, not shown on the card. */
  code: string;
  /** Schemes apply themselves; coupons wait for the buyer to tap Apply. */
  automatic: boolean;
  /** Scheme requirement — every line must be met. */
  needs?: OfferNeed[];
  /** Coupon requirement — cart value (₹). */
  minOrder?: number;
}

/* Written against the demo cart: 12 × Freedom Oil, 8 × Aashirvaad Atta,
   20 × Fortune Besan, 2 × Red Label Tea. That makes the oil, atta and combo
   schemes live, and leaves the besan case bonus 30 units short — one card in
   each state, without any of it being hard-coded. */
export const OFFERS: Offer[] = [
  {
    id: 'save5',
    label: '5% Off',
    benefit: 'Get 5% off',
    scope: 'on your order above ₹500 upto ₹100',
    code: 'SAVE5',
    automatic: false,
    minOrder: 500,
  },
  {
    id: 'oil-case',
    benefit: 'Buy 10 Cases Get 1 Free',
    scope: 'on Freedom Refined Sunflower Oil',
    code: 'OILCASE',
    automatic: true,
    needs: [{ productId: 'p1', qty: 10 }],
  },
  {
    id: 'atta-freebie',
    label: 'Freebie',
    benefit: 'Buy 8 units → Get 1 FREE',
    scope: 'on Aashirvaad Atta',
    code: 'ATTA8',
    automatic: true,
    needs: [{ productId: 'p2', qty: 8 }],
  },
  {
    id: 'besan-bonus',
    label: 'Case Bonus',
    benefit: 'Buy 50 units → Get 5 FREE',
    scope: 'on Fortune Besan',
    code: 'BESAN50',
    automatic: true,
    needs: [{ productId: 'p3', qty: 50 }],
  },
  {
    id: 'besan-combo',
    label: 'Combo',
    benefit: '15% Off',
    scope: 'on Fortune Besan when bought together with Red Label Tea',
    code: 'BESANTEA',
    automatic: true,
    needs: [
      { productId: 'p3', qty: 1 },
      { productId: 'p10', qty: 1 },
    ],
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
