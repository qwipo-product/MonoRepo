// Coupons / offers for the Apply Coupon screen. Self-contained mock —
// eligibility is derived against the cart's grand total at render time.

export type CouponType = 'flat' | 'percent' | 'free' | 'cashback';

export interface Coupon {
  id: string;
  type: CouponType;
  title: string;
  sub: string;
  code: string;
  expires: string;
  /** Minimum cart value (₹) to unlock the offer. */
  minOrder: number;
  /** ₹ for flat, % for percent/cashback, 0 for free delivery. */
  value: number;
  /** Optional ribbon, e.g. "Best offer" / "Wallet". */
  tag?: string;
}

export const COUPONS: Coupon[] = [
  {
    id: 'qwipo500', type: 'flat', title: 'Flat ₹500 OFF', sub: 'On orders above ₹6,000',
    code: 'QWIPO500', expires: '30 Jun', minOrder: 9000, value: 500, tag: 'Best offer',
  },
  {
    id: 'welcome10', type: 'percent', title: '10% OFF up to ₹400', sub: 'For new business — first 3 orders',
    code: 'WELCOME10', expires: '15 Jul', minOrder: 0, value: 10,
  },
  {
    id: 'freeship', type: 'free', title: 'Free delivery', sub: 'On all orders above ₹3,500',
    code: 'FREESHIP', expires: '20 Jun', minOrder: 3500, value: 0,
  },
  {
    id: 'groc200', type: 'flat', title: '₹200 OFF on Groceries', sub: 'Min order ₹4,000 from Sri Sai Krishna',
    code: 'GROC200', expires: '28 Jun', minOrder: 4000, value: 200,
  },
  {
    id: 'cashback5', type: 'cashback', title: '5% Cashback to wallet', sub: 'Credited within 24 hours',
    code: 'CASHBACK5', expires: '31 Jul', minOrder: 8000, value: 5, tag: 'Wallet',
  },
];

/** Short "you save" phrase for the sticky Apply bar. */
export function savingsText(c: Coupon): string {
  if (c.type === 'free') return 'Free delivery';
  if (c.type === 'percent') return `${c.value}% off`;
  if (c.type === 'cashback') return `${c.value}% cashback`;
  return `₹${c.value.toLocaleString('en-IN')}`;
}
