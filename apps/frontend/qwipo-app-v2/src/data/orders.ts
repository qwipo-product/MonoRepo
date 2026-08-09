// My Orders — self-contained mock order history.

export type OrderStatus = 'placed' | 'processing' | 'in_transit' | 'delivered' | 'cancelled';

export interface OrderItem {
  brand: string;
  name: string;
  qty: number;
  pack: string;
  image: string;
  price: number;
  mrp: number;
}

export interface Order {
  id: string;
  /** Display order number, e.g. QWIP2402204. */
  orderId: string;
  seller: string;
  itemCount: number;
  placedAt: string;
  total: number;
  deliveryFee: number;
  status: OrderStatus;
  statusLabel: string;
  eta: string;
  items: OrderItem[];
}

export const ORDERS: Order[] = [
  {
    id: 'o1', orderId: 'QWIP2402204', seller: 'Nestle · Omkar Enterprise', itemCount: 3,
    placedAt: '2026-06-16', total: 4200, deliveryFee: 200, status: 'placed', statusLabel: 'Order placed', eta: '2026-06-18',
    items: [
      { brand: 'Maggi', name: 'Maggi Family Pack × 8', qty: 8, pack: '280 g · 24 Pcs/Case', image: '🍜', price: 52, mrp: 60 },
      { brand: 'Nescafé', name: 'Nescafé Classic 200g × 4', qty: 4, pack: '200 g · 24 Pcs/Case', image: '☕', price: 185, mrp: 210 },
      { brand: 'KitKat', name: 'KitKat 4-Finger × 12', qty: 12, pack: '37.3 g · 24 Pcs/Case', image: '🍫', price: 20, mrp: 25 },
    ],
  },
  {
    id: 'o2', orderId: 'QWIP2401204', seller: 'Sri Sai Krishna Traders', itemCount: 4,
    placedAt: '2026-06-05', total: 7128, deliveryFee: 200, status: 'in_transit', statusLabel: 'Out for Delivery', eta: 'Tomorrow 11 AM',
    items: [
      { brand: 'Freedom', name: 'Freedom Sunflower Oil × 10', qty: 10, pack: '1 L · 16 Pcs/Case', image: '🛢️', price: 165, mrp: 185 },
      { brand: 'Aashirvaad', name: 'Aashirvaad Atta 10kg × 4', qty: 4, pack: '10 kg · 4 Pcs/Case', image: '🌾', price: 420, mrp: 465 },
      { brand: 'Aashirvaad', name: 'Aashirvaad Ghee 1L × 2', qty: 2, pack: '1 L · 12 Pcs/Case', image: '🧈', price: 620, mrp: 690 },
      { brand: 'Fortune', name: 'Fortune Besan × 6', qty: 6, pack: '500 g · 20 Pcs/Case', image: '🫘', price: 55, mrp: 62 },
    ],
  },
  {
    id: 'o3', orderId: 'QWIP2400204', seller: 'Omkar Enterprise', itemCount: 3,
    placedAt: '2026-06-03', total: 3640, deliveryFee: 200, status: 'processing', statusLabel: 'Being Packed', eta: 'Tomorrow 8 PM',
    items: [
      { brand: 'Fortune', name: 'Fortune Besan × 20', qty: 20, pack: '500 g · 20 Pcs/Case', image: '🫘', price: 55, mrp: 62 },
      { brand: 'Red Label', name: 'Red Label Tea × 8', qty: 8, pack: '250 g · 40 Pcs/Case', image: '🍵', price: 135, mrp: 150 },
      { brand: 'Close Up', name: 'Close Up Red Toothpaste × 6', qty: 6, pack: '150 g · 36 Pcs/Case', image: '🪥', price: 48, mrp: 55 },
    ],
  },
  {
    id: 'o4', orderId: 'QWIP2399204', seller: 'Karnataka Soaps & Detergents', itemCount: 2,
    placedAt: '2026-05-28', total: 2260, deliveryFee: 200, status: 'delivered', statusLabel: 'Delivered', eta: 'Delivered 2026-05-30',
    items: [
      { brand: 'Mysore Sandal', name: 'Mysore Sandal Soap × 12', qty: 12, pack: '150 g · 72 Pcs/Case', image: '🧼', price: 42, mrp: 48 },
      { brand: 'Mysore Sandal', name: 'Mysore Talcum Powder × 6', qty: 6, pack: '100 g · 48 Pcs/Case', image: '🧴', price: 88, mrp: 98 },
    ],
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
