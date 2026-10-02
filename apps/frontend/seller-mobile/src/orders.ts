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

/** Lines still being sold — removed and cancelled lines drop out. */
export const liveLines = (o: SellerOrder) => o.lines.filter((l) => l.status !== 'CANCELLED');
export const orderTotal = (o: SellerOrder) => liveLines(o).reduce((sum, l) => sum + l.qty * l.price, 0);
export const unavailableLines = (o: SellerOrder) => o.lines.filter((l) => l.status === 'OUT_OF_STOCK');

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
      update(ids, (o) => ({ ...o, status: 'CANCELLED', cancelReason: reason })),
    /** Save the seller's line edits (changed quantities, removed items). */
    saveLines: (id: string, lines: SellerOrderLine[]) => update([id], (o) => ({ ...o, lines })),
  };
}

export type Orders = ReturnType<typeof useOrders>;
