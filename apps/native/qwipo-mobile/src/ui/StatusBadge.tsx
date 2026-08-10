import { Badge } from './Badge';

export type OrderStatus = 'placed' | 'processing' | 'in_transit' | 'delivered' | 'cancelled';

const MAP: Record<OrderStatus, { variant: 'info' | 'warning' | 'success' | 'danger'; label: string }> = {
  placed: { variant: 'info', label: 'Order placed' },
  processing: { variant: 'warning', label: 'Being packed' },
  in_transit: { variant: 'warning', label: 'Out for delivery' },
  delivered: { variant: 'success', label: 'Delivered' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

export function StatusBadge({ status, label }: { status: OrderStatus; label?: string }) {
  const c = MAP[status] ?? MAP.placed;
  return <Badge variant={c.variant}>{label ?? c.label}</Badge>;
}
