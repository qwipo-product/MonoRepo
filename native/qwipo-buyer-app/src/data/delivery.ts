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
};

export const DEFAULT_DELIVERY: DistributorDelivery = {
  options: [{ day: 'Tomorrow', mov: 1000 }],
  freeDeliveryAt: 3000,
};

export const deliveryFor = (seller: string): DistributorDelivery =>
  DISTRIBUTOR_DELIVERY[seller] ?? DEFAULT_DELIVERY;

/** "Monday (Beat Day)" / "Tomorrow" — the display label for one option. */
export const dayLabel = (o: DeliveryOption): string => (o.beat ? `${o.day} (Beat Day)` : o.day);
