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
  /* An order is per COMPANY, not per distributor. The cart groups lines by
     the distributor delivering them, but each company invoices separately, so
     placing that cart raises one order per company — two companies bought
     from the same distributor become two orders, each with its own number,
     its own bill. `seller` is therefore the company being
     invoiced (it's what the order lists show); `distributor` is who
     actually delivers it. */
  seller: string;
  /** Who fulfils it, when that differs from the company. */
  distributor?: string;
  itemCount: number;
  placedAt: string;
  total: number;
  deliveryFee: number;
  status: OrderStatus;
  statusLabel: string;
  /** When delivery is expected, as a plain ISO date — for an order already
   *  delivered, the day it arrived. Never a time: nobody commits to one. */
  eta: string;
  items: OrderItem[];
  /** Discount on the items total. Absent means no discount. */
  discount?: number;
}

/* One order per company, even when two of them came from one cart. o2 and o5
   were placed together from Sri Sai Krishna Traders — ITC and Adani Wilmar
   invoice separately, so they're separate orders with separate numbers.
   o4 has no discount row. */
export const ORDERS: Order[] = [
  {
    id: 'o1', orderId: 'QWIP2402204', seller: 'Nestlé India', distributor: 'Omkar Enterprise', itemCount: 3,
    placedAt: '2026-06-16', total: 4200, deliveryFee: 200, status: 'placed', statusLabel: 'Order placed', eta: '2026-06-18',
    discount: 220,
    items: [
      { brand: 'Maggi', name: 'Maggi Family Pack × 8', qty: 8, pack: '280 g · 24 Pcs/Case', image: '🍜', price: 52, mrp: 60 },
      { brand: 'Nescafé', name: 'Nescafé Classic 200g × 4', qty: 4, pack: '200 g · 24 Pcs/Case', image: '☕', price: 185, mrp: 210 },
      { brand: 'KitKat', name: 'KitKat 4-Finger × 12', qty: 12, pack: '37.3 g · 24 Pcs/Case', image: '🍫', price: 20, mrp: 25 },
    ],
  },
  {
    id: 'o2', orderId: 'QWIP2401204', seller: 'ITC Limited', distributor: 'Sri Sai Krishna Traders', itemCount: 2,
    placedAt: '2026-06-05', total: 7128, deliveryFee: 200, status: 'in_transit', statusLabel: 'Out for Delivery', eta: '2026-06-06',
    items: [
      { brand: 'Aashirvaad', name: 'Aashirvaad Atta 10kg × 8', qty: 8, pack: '10 kg · 4 Pcs/Case', image: '🌾', price: 420, mrp: 465 },
      { brand: 'Aashirvaad', name: 'Aashirvaad Ghee 1L × 2', qty: 2, pack: '1 L · 12 Pcs/Case', image: '🧈', price: 620, mrp: 690 },
    ],
  },
  {
    id: 'o5', orderId: 'QWIP2401205', seller: 'Adani Wilmar', distributor: 'Sri Sai Krishna Traders', itemCount: 1,
    placedAt: '2026-06-05', total: 2890, deliveryFee: 0, status: 'in_transit', statusLabel: 'Out for Delivery', eta: '2026-06-06',
    discount: 185,
    items: [
      { brand: 'Fortune', name: 'Fortune Besan × 50', qty: 50, pack: '500 g · 20 Pcs/Case', image: '🫘', price: 55, mrp: 62 },
    ],
  },
  {
    id: 'o3', orderId: 'QWIP2400204', seller: 'Hindustan Unilever', distributor: 'Omkar Enterprise', itemCount: 3,
    placedAt: '2026-06-03', total: 3640, deliveryFee: 200, status: 'processing', statusLabel: 'Being Packed', eta: '2026-06-04',
    discount: 310,
    items: [
      { brand: 'Red Label', name: 'Red Label Tea × 8', qty: 8, pack: '250 g · 40 Pcs/Case', image: '🍵', price: 135, mrp: 150 },
      { brand: 'Close Up', name: 'Close Up Red Toothpaste × 6', qty: 6, pack: '150 g · 36 Pcs/Case', image: '🪥', price: 48, mrp: 55 },
      { brand: 'Vim', name: 'Vim Dishwash Bar × 10', qty: 10, pack: '300 g · 30 Pcs/Case', image: '🧽', price: 28, mrp: 32 },
    ],
  },
  {
    id: 'o4', orderId: 'QWIP2399204', seller: 'Karnataka Soaps & Detergents', itemCount: 2,
    placedAt: '2026-05-28', total: 2260, deliveryFee: 200, status: 'delivered', statusLabel: 'Delivered', eta: '2026-05-30',
    items: [
      { brand: 'Mysore Sandal', name: 'Mysore Sandal Soap × 12', qty: 12, pack: '150 g · 72 Pcs/Case', image: '🧼', price: 42, mrp: 48 },
      { brand: 'Mysore Sandal', name: 'Mysore Talcum Powder × 6', qty: 6, pack: '100 g · 48 Pcs/Case', image: '🧴', price: 88, mrp: 98 },
    ],
  },
];

/** Map a free-text status label to the canonical OrderStatus (for StatusBadge
 * + the shared Order Details, when an order comes from a leaner data source). */
export function statusFromLabel(label: string): OrderStatus {
  const k = label.toLowerCase();
  if (k.includes('cancel')) return 'cancelled';
  if (k.includes('deliver')) return 'delivered';
  if (k.includes('transit') || k.includes('out for')) return 'in_transit';
  if (k.includes('pack') || k.includes('process')) return 'processing';
  return 'placed';
}

/** Build a full Order from a leaner order (salesperson / payments) so the one
 * OrderDetailsScreen can render it. Items default to empty. */
export function buildOrder(o: {
  id: string;
  orderId: string;
  seller: string;
  placedAt: string;
  total: number;
  deliveryFee?: number;
  statusLabel: string;
  eta?: string;
  items?: OrderItem[];
  discount?: number;
}): Order {
  return {
    id: o.id,
    orderId: o.orderId,
    seller: o.seller,
    itemCount: o.items?.length ?? 0,
    placedAt: o.placedAt,
    total: o.total,
    deliveryFee: o.deliveryFee ?? 0,
    status: statusFromLabel(o.statusLabel),
    statusLabel: o.statusLabel,
    eta: o.eta ?? '—',
    items: o.items ?? [],
    discount: o.discount ?? 0,
  };
}

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
