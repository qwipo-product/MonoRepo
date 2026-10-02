// StatusBadge — maps a domain OrderStatus to one Badge variant + label, so an
// order's status reads the same everywhere. Replaces the STATUS_TINT map that
// was duplicated verbatim in MyOrdersScreen and OrderDetailsScreen.
//
//   <StatusBadge status={order.status} />
//   <StatusBadge status={order.status} label={order.statusLabel} />  // override copy

import { Badge, type BadgeProps } from '@mockups/ui';
import type { OrderStatus, SellerOrderStatus } from '@mockups/types';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

// Buyer statuses are lowercase; seller statuses are the seller platform's
// real uppercase enum, so the two sets never collide.
const STATUS_MAP: Record<OrderStatus | SellerOrderStatus, { variant: BadgeVariant; label: string }> = {
  placed: { variant: 'info', label: 'Order placed' },
  processing: { variant: 'warning', label: 'Being packed' },
  in_transit: { variant: 'warning', label: 'Out for delivery' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
  CREATED: { variant: 'info', label: 'New' },
  ACCEPTED: { variant: 'warning', label: 'Confirmed' },
  PACKED: { variant: 'warning', label: 'Packed' },
  SHIPPED: { variant: 'warning', label: 'Shipped' },
  DELIVERED: { variant: 'success', label: 'Delivered' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
  RETURNED: { variant: 'neutral', label: 'Returned' },
};

export interface StatusBadgeProps {
  status: OrderStatus | SellerOrderStatus;
  /** Override the default label (e.g. an OrderHistoryEntry's own statusLabel). */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.placed;
  return (
    <Badge variant={cfg.variant} className={className}>
      {label ?? cfg.label}
    </Badge>
  );
}

export { STATUS_MAP as orderStatusMap };
