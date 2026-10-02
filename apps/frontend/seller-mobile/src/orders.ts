import { useState } from 'react';
import { sellerOrders } from '@mockups/mock-data';
import type { SellerOrder, SellerOrderLine, SellerOrderStatus } from '@mockups/types';

/* The seller's orders for this demo session. Seeded from the shared fixture
   and changed here as the seller confirms, cancels and delivers — the fixture
   itself stays read-only. */

export type OrderTab = 'new' | 'confirmed' | 'delivered' | 'cancelled';

// The portal's buckets: New = CREATED; Confirmed = ACCEPTED | PACKED | SHIPPED.
const TAB_STATUSES: Record<OrderTab, SellerOrderStatus[]> = {
  new: ['CREATED'],
  confirmed: ['ACCEPTED', 'PACKED', 'SHIPPED'],
  delivered: ['DELIVERED'],
  cancelled: ['CANCELLED', 'RETURNED'],
};

export const tabOf = (o: SellerOrder): OrderTab =>
  (Object.keys(TAB_STATUSES) as OrderTab[]).find((t) => TAB_STATUSES[t].includes(o.status)) ?? 'new';

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

// Cancel reasons — the portal's list, split by whether the goods have left.
export const CANCEL_REASONS = {
  beforePickup: [
    'One or more items in the order not available',
    'Store not responsive',
    'Order received during non-operational hours',
    'Order received during store rush',
    'Technical issue in merchant device',
  ],
  afterPickup: [
    'Retail buyer not found or cannot be contacted',
    'Retail buyer refuses to accept delivery',
    'Delivery address incorrect or not found',
    'Order not serviceable',
  ],
};

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
    /** Save the seller's line edits (changed quantities, removed items). */
    saveLines: (id: string, lines: SellerOrderLine[]) => update([id], (o) => ({ ...o, lines })),
  };
}

export type Orders = ReturnType<typeof useOrders>;
