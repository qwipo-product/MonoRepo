import { useState } from 'react';
import { sellerOrders } from '@mockups/mock-data';
import type { SellerOrder, SellerOrderStatus } from '@mockups/types';

/* The seller's orders for this demo session. Seeded from the shared fixture
   and changed here as the seller confirms, cancels and delivers — the fixture
   itself stays read-only. */

export type OrderTab = 'all' | 'new' | 'confirmed' | 'logistics' | 'delivered' | 'cancelled';

/** The bucket an order lives in — never 'all'. */
export type OrderBucket = Exclude<OrderTab, 'all'>;

// The portal's buckets: New = CREATED; Confirmed = ACCEPTED | PACKED | SHIPPED,
// split off into Logistics once a 3PL partner or a dark store has the order.
const BUCKET_STATUSES: Record<Exclude<OrderBucket, 'logistics'>, SellerOrderStatus[]> = {
  new: ['CREATED'],
  confirmed: ['ACCEPTED', 'PACKED', 'SHIPPED'],
  delivered: ['DELIVERED'],
  cancelled: ['CANCELLED', 'RETURNED'],
};

export const tabOf = (o: SellerOrder): OrderBucket => {
  const bucket = (Object.keys(BUCKET_STATUSES) as (keyof typeof BUCKET_STATUSES)[]).find((t) => BUCKET_STATUSES[t].includes(o.status)) ?? 'new';
  return bucket === 'confirmed' && o.logistics ? 'logistics' : bucket;
};

/** Portal labels for the provider-agnostic logistics status. */
export const LOGISTICS_STATUS_KEYS = [
  'REQUESTED',
  'PENDING',
  'READY_FOR_SHIPMENT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'PARTIALLY_DELIVERED',
  'RETURNED',
  'CANCELLED',
  'OFFLINE_DELIVERY',
] as const;

/** Exact shop location as a Google Maps link, or the address text when it isn't set. */
export const mapsLink = (o: SellerOrder) =>
  o.buyer.lat !== null && o.buyer.lng !== null
    ? `https://www.google.com/maps/search/?api=1&query=${o.buyer.lat},${o.buyer.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.buyer.address}, ${o.buyer.area}, ${o.buyer.city} ${o.buyer.pincode}`)}`;

/** Lines still being sold — removed lines drop out. A cancelled order keeps
 *  all its lines, so it shows what it was worth (the portal's Original Value). */
export const liveLines = (o: SellerOrder) =>
  o.status === 'CANCELLED' ? o.lines : o.lines.filter((l) => l.status !== 'CANCELLED');
export const orderTotal = (o: SellerOrder) => liveLines(o).reduce((sum, l) => sum + l.qty * l.price, 0);
export const unavailableLines = (o: SellerOrder) => o.lines.filter((l) => l.status === 'OUT_OF_STOCK');
/** What the buyer's offers took off this order — base price minus price paid, on live lines. */
export const offerSavings = (o: SellerOrder) =>
  liveLines(o).reduce((sum, l) => sum + (l.basePrice ? (l.basePrice - l.price) * l.qty : 0), 0);

/** Why an order was cancelled, in words — a store cancelling in the buyer app gives no reason. */
export function cancelReasonText(order: SellerOrder, t: (k: string) => string) {
  if (order.cancelReason) return order.cancelReason;
  return t(order.cancelledBy === 'CUSTOMER' ? 'seller.detail.cancelled_in_app' : 'seller.detail.no_reason');
}

// Cancel reasons — the portal's eleven, in the portal's order and words.
export const CANCEL_REASONS = [
  'One or more items in the order not available',
  'Store not responsive',
  'Technical issue in merchant device',
  'Order received during non-operational hours',
  'Order received during store rush',
  'Retail buyer not found or cannot be contacted',
  'Retail buyer refuses to accept delivery',
  'Delivery address incorrect or not found',
  'Force majeure (accident / strike / law & order situation)',
  'Order not serviceable',
  'Order confirmation failure',
];

export function useOrders(empty = false) {
  const [orders, setOrders] = useState<SellerOrder[]>(() => (empty ? [] : structuredClone(sellerOrders)));

  const update = (ids: string[], change: (o: SellerOrder) => SellerOrder) =>
    setOrders((prev) => prev.map((o) => (ids.includes(o.id) ? change(o) : o)));

  return {
    orders,
    confirm: (ids: string[]) => update(ids, (o) => ({ ...o, status: 'ACCEPTED' })),
    deliver: (ids: string[]) =>
      update(ids, (o) => ({
        ...o,
        status: 'DELIVERED',
        lines: o.lines.map((l) => (l.status === 'ORDERED' ? { ...l, status: 'FULFILLED' } : l)),
      })),
    cancel: (ids: string[], reason: string) =>
      update(ids, (o) => ({ ...o, status: 'CANCELLED', cancelReason: reason, cancelledBy: 'SELLER', cancelledAt: new Date().toISOString() })),
    /** Hand confirmed orders to the 3PL partner or the dark store (portal: Move to Logistics / Dark Store). */
    sendToLogistics: (ids: string[], via: 'LOGISTICS' | 'DARK_STORE') =>
      update(ids, (o) => ({
        ...o,
        logistics: { via, partner: via === 'LOGISTICS' ? 'Shiprocket' : 'Moosapet Dark Store', status: 'REQUESTED' },
      })),
  };
}

export type Orders = ReturnType<typeof useOrders>;

/** The Orders filter sheet's choices — one panel, like the portal's drawer + pill rows. */
export interface OrderFilters {
  type: 'all' | 'beat' | 'nonbeat';
  cancelledBy: 'all' | 'CUSTOMER' | 'SELLER';
  companies: string[];
}

export const NO_FILTERS: OrderFilters = { type: 'all', cancelledBy: 'all', companies: [] };

export const filterCount = (f: OrderFilters) => (f.type !== 'all' ? 1 : 0) + (f.cancelledBy !== 'all' ? 1 : 0) + f.companies.length;

export const matchesFilters = (o: SellerOrder, f: OrderFilters) =>
  (f.type === 'all' || (f.type === 'beat' ? o.beatName !== null : o.beatName === null)) &&
  (f.cancelledBy === 'all' || o.cancelledBy === f.cancelledBy) &&
  (f.companies.length === 0 || f.companies.includes(o.company));
