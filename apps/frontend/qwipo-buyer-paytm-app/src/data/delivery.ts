/* Single source of truth for each distributor's delivery day(s) + MOV.
   Used by the product-list footer, the Storefront header, and the Cart, so the
   three surfaces can't drift.

   MOV is PER delivery option — each day carries its own minimum (a beat day
   often has a different one). Informational only; the surfaces just display it.

   Rules (per distributor):
   - Sri Sai Krishna Traders   → beat day = Tomorrow → "Tomorrow (Beat Day)" + MOV
   - Karnataka Soaps & Detergents → two options, each its own MOV:
       "Monday (Beat Day)" ₹5,000  and  "Tomorrow" ₹7,500
   - Omkar Enterprises         → no MOV, no beat day → plain "Tomorrow", no MOV */

export interface DeliveryOption {
  day: string;
  /** Marks this option as the distributor's beat day → " (Beat Day)" suffix. */
  beat?: boolean;
  /** Minimum order value for THIS day. undefined → this day has no MOV. */
  mov?: number;
}

export interface DistributorDelivery {
  options: DeliveryOption[];
  freeDeliveryAt: number;
  /** This distributor ships through the cross-dock store. A 3PL collects from
   *  every CDS distributor, the lot is packed per retailer at the store, and
   *  one drop goes out — so these sellers share a minimum and a delivery day
   *  instead of each setting their own. */
  cds?: boolean;
}

export const DISTRIBUTOR_DELIVERY: Record<string, DistributorDelivery> = {
  'Sri Sai Krishna Traders': {
    options: [{ day: 'Tomorrow', beat: true, mov: 2000 }],
    freeDeliveryAt: 3000,
  },
  'Karnataka Soaps & Detergents': {
    options: [{ day: 'Monday', beat: true, mov: 5000 }, { day: 'Tomorrow', mov: 7500 }],
    freeDeliveryAt: 6000,
  },
  'Omkar Enterprises': {
    options: [{ day: 'Tomorrow' }],
    freeDeliveryAt: 3000,
  },
  'Tata Consumer Products': {
    options: [{ day: 'Monday', beat: true, mov: 2000 }, { day: 'Tomorrow', mov: 3000 }],
    freeDeliveryAt: 4000,
  },

  /* Cross-dock distributors. No beat day — the 3PL collects daily, so every
     one of them delivers tomorrow — and no minimum of their own, because the
     minimum is the cross-dock store's and is checked across all of them
     together in the cart. */
  'Lakshmi Agencies': { options: [{ day: 'Tomorrow' }], freeDeliveryAt: 0, cds: true },
  'Venkateswara Traders': { options: [{ day: 'Tomorrow' }], freeDeliveryAt: 0, cds: true },
  'Nandi Distributors': { options: [{ day: 'Tomorrow' }], freeDeliveryAt: 0, cds: true },
  'Godavari Agencies': { options: [{ day: 'Tomorrow' }], freeDeliveryAt: 0, cds: true },
};

/** What the cart calls the cross-dock store when it stands in for the sellers
 *  behind it. The buyer orders from distributors; the goods arrive as one. */
export const CDS_NAME = 'CDS Partners';

/** The minimum the cross-dock store ships on.

    It is not the distributors' minimums added up — it is deliberately far
    below any one of them. A distributor delivering its own goods needs a van
    to be worth sending, which is why Sri Sai asks ₹2,000 and Karnataka Soaps
    ₹5,000 before they will move. The cross-dock store is already receiving a
    3PL collection from every CDS distributor that day, so the cost of adding
    one more retailer's carton is small, and the minimum can be small with it.

    That is the offer to the buyer: instead of finding ₹2,000 of one
    distributor's catalogue, find ₹2,500 across four. A few cases from each
    clears it. */
export const CDS_MOV = 2500;

const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** How soon a seller can deliver, as a number to sort by — lowest first.

    The order the buyer cares about is how long they wait, so next-day sellers
    lead. A beat day that happens to fall tomorrow still arrives tomorrow, but
    it is the van's round rather than a daily collection, so it sits behind the
    sellers who deliver tomorrow outright. After those come the sellers who
    offer tomorrow alongside a later day, and last the ones with no next-day
    option at all.

    Those last are ordered by their place in the week. The mockup has no clock
    behind it, so "Monday" cannot be turned into a real number of days away;
    the week's own order at least keeps them stable and readable. */
export function deliveryRank(seller: string): number {
  const { options } = deliveryFor(seller);
  const nextDay = options.filter((o) => o.day === 'Tomorrow');
  if (nextDay.length === options.length) return nextDay.some((o) => o.beat) ? 1 : 0;
  if (nextDay.length > 0) return 2;
  return 3 + Math.min(...options.map((o) => Math.max(WEEK.indexOf(o.day), 0)));
}

/** Whether this seller's orders go through the cross-dock store. */
export const isCdsSeller = (seller: string): boolean => !!DISTRIBUTOR_DELIVERY[seller]?.cds;

/** Every cross-dock distributor, in catalogue order. */
export const CDS_SELLERS: string[] = Object.keys(DISTRIBUTOR_DELIVERY).filter(isCdsSeller);

export const DEFAULT_DELIVERY: DistributorDelivery = {
  options: [{ day: 'Tomorrow', mov: 1000 }],
  freeDeliveryAt: 3000,
};

export const deliveryFor = (seller: string): DistributorDelivery =>
  DISTRIBUTOR_DELIVERY[seller] ?? DEFAULT_DELIVERY;

/** "Monday (Beat Day)" / "Tomorrow" — the display label for one option. */
export const dayLabel = (o: DeliveryOption): string => (o.beat ? `${o.day} (Beat Day)` : o.day);

/* Whether a display label names a beat day. The cart only has the labels, not
   the options behind them, and the suffix is this module's to know about. */
export const isBeatDay = (label: string): boolean => label.endsWith(' (Beat Day)');

/* What a beat day actually promises.

   "Delivered within 24–48 hrs" beside a chosen Monday read as 24–48 hours
   from now — a promise nobody made. The van is in the area on the beat day,
   and the goods follow within a day or two of *that*. The number means
   nothing without the thing it counts from, so the note names it.

   It says "Beat Day" rather than repeating the day itself: the chosen day is
   already on the control beside this line, and the fixed phrase matches the
   label on the chip the buyer just picked. */
export const BEAT_WINDOW_NOTE = 'Expected within 24–48 hrs of Beat Day';
