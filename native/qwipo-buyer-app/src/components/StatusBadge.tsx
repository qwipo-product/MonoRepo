// StatusBadge — maps an OrderStatus to a Badge variant + label (RN port).
import { Badge, type BadgeVariant } from './ui';

export type OrderStatus = 'placed' | 'processing' | 'in_transit' | 'delivered' | 'cancelled';

const STATUS_MAP: Record<OrderStatus, { variant: BadgeVariant; label: string }> = {
  placed: { variant: 'info', label: 'Order placed' },
  processing: { variant: 'warning', label: 'Being packed' },
  in_transit: { variant: 'warning', label: 'Out for delivery' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

export function StatusBadge({ status, label }: { status: OrderStatus; label?: string }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.placed;
  return <Badge variant={cfg.variant}>{label ?? cfg.label}</Badge>;
}
