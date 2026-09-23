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
  /** Granted by a scheme rather than bought — billed at ₹0. */
  free?: boolean;
}

/** One offer that paid out on an order. */
export interface OrderOffer {
  /** The code the seller publishes — the same one the cart showed. */
  code: string;
  /** Scheme name (Bogo, Freebie, Case Bonus, Slab, Combo) or 'Coupon'. */
  label: string;
  /** What it gave, in words. */
  benefit: string;
  /** ₹ taken off the bill. 0 when the offer paid out in free goods instead. */
  saved: number;
  /** What it granted, when it paid out in goods rather than money. */
  freeGoods?: string;
}

export interface Order {
  id: string;
  /** Display order number, e.g. QWIP2402204. */
  orderId: string;
  /* An order is per COMPANY, not per distributor. The cart groups lines by
     the distributor delivering them, but each company invoices separately, so
     placing that cart raises one order per company — two companies bought
     from the same distributor become two orders, each with its own number,
     its own bill and its own offers. `seller` is therefore the company being
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
  eta: string;
  items: OrderItem[];
  /** ₹ off the items total, from the offers below. Absent → nothing came off. */
  discount?: number;
  /** Offers that paid out on this order — schemes and any coupon applied. */
  offers?: OrderOffer[];
}

/* One order per company, even when two of them came from one cart. o2 and o5
   were placed together from Sri Sai Krishna Traders — ITC and Adani Wilmar
   invoice separately, so they're separate orders with separate numbers.
   o4 has no scheme running, which is what an order with no offers looks
   like: no discount row, no offers section. */
export const ORDERS: Order[] = [
  {
    id: 'o1', orderId: 'QWIP2402204', seller: 'Nestlé India', distributor: 'Omkar Enterprise', itemCount: 4,
    placedAt: '2026-06-16', total: 4200, deliveryFee: 200, status: 'placed', statusLabel: 'Order placed', eta: '2026-06-18',
    discount: 220,
    offers: [
      { code: 'MAGGIBOGO', label: 'Bogo', benefit: 'Buy 1 Case Get 1 Free on Maggi Family Pack', saved: 0, freeGoods: '8 × Maggi Family Pack' },
      { code: 'SAVE5', label: 'Coupon', benefit: '5% off your order above ₹500, up to ₹100', saved: 100 },
      { code: 'NESCAFE10', label: 'Slab', benefit: '10% off on 4+ cases of Nescafé Classic', saved: 120 },
    ],
    items: [
      { brand: 'Maggi', name: 'Maggi Family Pack × 8', qty: 8, pack: '280 g · 24 Pcs/Case', image: '🍜', price: 52, mrp: 60 },
      { brand: 'Maggi', name: 'Maggi Family Pack × 8', qty: 8, pack: '280 g · 24 Pcs/Case', image: '🍜', price: 0, mrp: 60, free: true },
      { brand: 'Nescafé', name: 'Nescafé Classic 200g × 4', qty: 4, pack: '200 g · 24 Pcs/Case', image: '☕', price: 185, mrp: 210 },
      { brand: 'KitKat', name: 'KitKat 4-Finger × 12', qty: 12, pack: '37.3 g · 24 Pcs/Case', image: '🍫', price: 20, mrp: 25 },
    ],
  },
  {
    id: 'o2', orderId: 'QWIP2401204', seller: 'ITC Limited', distributor: 'Sri Sai Krishna Traders', itemCount: 3,
    placedAt: '2026-06-05', total: 7128, deliveryFee: 200, status: 'in_transit', statusLabel: 'Out for Delivery', eta: 'Tomorrow 11 AM',
    offers: [
      { code: 'ATTA8FREE', label: 'Freebie', benefit: 'Buy 8 units → Get 1 FREE on Aashirvaad Atta', saved: 0, freeGoods: '1 × Aashirvaad Atta 10 kg' },
    ],
    items: [
      { brand: 'Aashirvaad', name: 'Aashirvaad Atta 10kg × 8', qty: 8, pack: '10 kg · 4 Pcs/Case', image: '🌾', price: 420, mrp: 465 },
      { brand: 'Aashirvaad', name: 'Aashirvaad Atta 10kg × 1', qty: 1, pack: '10 kg · 4 Pcs/Case', image: '🌾', price: 0, mrp: 465, free: true },
      { brand: 'Aashirvaad', name: 'Aashirvaad Ghee 1L × 2', qty: 2, pack: '1 L · 12 Pcs/Case', image: '🧈', price: 620, mrp: 690 },
    ],
  },
  {
    id: 'o5', orderId: 'QWIP2401205', seller: 'Adani Wilmar', distributor: 'Sri Sai Krishna Traders', itemCount: 2,
    placedAt: '2026-06-05', total: 2890, deliveryFee: 0, status: 'in_transit', statusLabel: 'Out for Delivery', eta: 'Tomorrow 11 AM',
    discount: 185,
    offers: [
      { code: 'BESAN50', label: 'Case Bonus', benefit: 'Buy 50 units → Get 5 FREE on Fortune Besan', saved: 0, freeGoods: '5 × Fortune Besan 500 g' },
      { code: 'OILBOGO10', label: 'Slab', benefit: '6% off on 5+ cases of Fortune Sunflower Oil', saved: 185 },
    ],
    items: [
      { brand: 'Fortune', name: 'Fortune Besan × 50', qty: 50, pack: '500 g · 20 Pcs/Case', image: '🫘', price: 55, mrp: 62 },
      { brand: 'Fortune', name: 'Fortune Besan × 5', qty: 5, pack: '500 g · 20 Pcs/Case', image: '🫘', price: 0, mrp: 62, free: true },
    ],
  },
  {
    id: 'o3', orderId: 'QWIP2400204', seller: 'Hindustan Unilever', distributor: 'Omkar Enterprise', itemCount: 3,
    placedAt: '2026-06-03', total: 3640, deliveryFee: 200, status: 'processing', statusLabel: 'Being Packed', eta: 'Tomorrow 8 PM',
    discount: 310,
    offers: [
      { code: 'TEACOMBO10', label: 'Combo', benefit: '10% off Red Label Tea bought with Close Up', saved: 310 },
    ],
    items: [
      { brand: 'Red Label', name: 'Red Label Tea × 8', qty: 8, pack: '250 g · 40 Pcs/Case', image: '🍵', price: 135, mrp: 150 },
      { brand: 'Close Up', name: 'Close Up Red Toothpaste × 6', qty: 6, pack: '150 g · 36 Pcs/Case', image: '🪥', price: 48, mrp: 55 },
      { brand: 'Vim', name: 'Vim Dishwash Bar × 10', qty: 10, pack: '300 g · 30 Pcs/Case', image: '🧽', price: 28, mrp: 32 },
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
  offers?: OrderOffer[];
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
    offers: o.offers ?? [],
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
