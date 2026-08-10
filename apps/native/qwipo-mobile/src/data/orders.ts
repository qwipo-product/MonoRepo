import type { OrderStatus } from '../ui/StatusBadge';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}
export interface Order {
  id: string;
  date: string;
  seller: string;
  status: OrderStatus;
  total: number;
  deliveryFee: number;
  items: OrderItem[];
}

export const ORDERS: Order[] = [
  {
    id: 'QW-24817',
    date: '08 Aug 2026',
    seller: 'Sri Sai Krishna Traders',
    status: 'processing',
    total: 3260,
    deliveryFee: 0,
    items: [
      { name: 'Freedom Refined Sunflower Oil', qty: 16, price: 165 },
      { name: 'Aashirvaad Atta', qty: 4, price: 420 },
    ],
  },
  {
    id: 'QW-24790',
    date: '05 Aug 2026',
    seller: 'Omkar Enterprises',
    status: 'in_transit',
    total: 1620,
    deliveryFee: 40,
    items: [{ name: 'Red Label Tea', qty: 12, price: 135 }],
  },
  {
    id: 'QW-24712',
    date: '28 Jul 2026',
    seller: 'Sri Sai Krishna Traders',
    status: 'delivered',
    total: 2100,
    deliveryFee: 0,
    items: [{ name: 'Mysore Sandal Soap', qty: 50, price: 42 }],
  },
];

export const orderById = (id: string) => ORDERS.find((o) => o.id === id);

/** Steps completed for the tracking timeline. */
export const STEP_INDEX: Record<OrderStatus, number> = {
  placed: 1,
  processing: 2,
  in_transit: 3,
  delivered: 4,
  cancelled: 0,
};
export const TRACK_STEPS = ['Placed', 'Packed', 'Out for delivery', 'Delivered'];
