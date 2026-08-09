// StatusBadge — maps a domain OrderStatus to one Badge variant + label, so an
// order's status reads the same everywhere. Replaces the STATUS_TINT map that
// was duplicated verbatim in MyOrdersScreen and OrderDetailsScreen.
//
//   <StatusBadge status={order.status} />
//   <StatusBadge status={order.status} label={order.statusLabel} />  // override copy

import { Badge, type BadgeProps } from '@mockups/ui';
import type { OrderStatus } from '@mockups/types';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

const STATUS_MAP: Record<OrderStatus, { variant: BadgeVariant; label: string }> = {
  placed: { variant: 'info', label: 'Order placed' },
  processing: { variant: 'warning', label: 'Being packed' },
  in_transit: { variant: 'warning', label: 'Out for delivery' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

export interface StatusBadgeProps {
  status: OrderStatus;
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
