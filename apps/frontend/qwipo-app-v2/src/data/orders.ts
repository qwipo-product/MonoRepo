// My Orders — self-contained mock order history.

export type OrderStatus = 'placed' | 'processing' | 'in_transit' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  /** Display order number, e.g. QWIP2402204. */
  orderId: string;
  seller: string;
  itemCount: number;
  placedAt: string;
  total: number;
  status: OrderStatus;
  statusLabel: string;
  eta: string;
}

export const ORDERS: Order[] = [
  {
    id: 'o1', orderId: 'QWIP2402204', seller: 'Nestle · Omkar Enterprise', itemCount: 3,
    placedAt: '2026-06-16', total: 4200, status: 'placed', statusLabel: 'Order placed', eta: '2026-06-18',
  },
  {
    id: 'o2', orderId: 'QWIP2401204', seller: 'Sri Sai Krishna Traders', itemCount: 4,
    placedAt: '2026-06-05', total: 7128, status: 'in_transit', statusLabel: 'Out for Delivery', eta: 'Tomorrow 11 AM',
  },
  {
    id: 'o3', orderId: 'QWIP2400204', seller: 'Omkar Enterprise', itemCount: 3,
    placedAt: '2026-06-03', total: 3640, status: 'processing', statusLabel: 'Being Packed', eta: 'Tomorrow 8 PM',
  },
  {
    id: 'o4', orderId: 'QWIP2399204', seller: 'Karnataka Soaps & Detergents', itemCount: 2,
    placedAt: '2026-05-28', total: 2260, status: 'delivered', statusLabel: 'Delivered', eta: 'Delivered 2026-05-30',
  },
];

/** Ordered tracking milestones. */
export const TRACKING_STEPS = ['Placed', 'Confirmed', 'Being Packed', 'Out for Delivery', 'Delivered'] as const;

/** Number of fully-completed milestones. The step at this index is the current
 * (in-progress) one; everything after is upcoming. */
export function completedSteps(status: OrderStatus): number {
  switch (status) {
    case 'placed':
      return 1; // Placed done → Confirmed in progress
    case 'processing':
      return 2; // Placed, Confirmed done → Being Packed in progress
    case 'in_transit':
      return 3; // → Out for Delivery in progress
    case 'delivered':
      return 5; // all done
    default:
      return 0;
  }
}
