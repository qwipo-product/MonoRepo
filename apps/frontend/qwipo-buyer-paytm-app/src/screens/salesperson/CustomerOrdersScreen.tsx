import { ChevronLeft, ShoppingBag } from 'lucide-react';
import { EmptyState } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { OrderListCard } from '../../components/OrderListCard';
import { buildOrder, type Order } from '../../data/orders';
import { SP_ORDERS, SP_ORDER_SUMMARY, type SpOrder } from '../../data/salesperson';
import { formatDate } from '../../date';
import { useEmptyable } from '../../review/demoState';

/* Salesperson · Customer Orders — the salesperson's order book for today: a
   revenue summary (task vs unassigned) then the day's orders, each a My-Orders
   style card that opens the shared Order Details. */
export function CustomerOrdersScreen({
  onBack,
  onOpenOrder,
}: {
  onBack: () => void;
  onOpenOrder: (order: Order) => void;
}) {
  const s = SP_ORDER_SUMMARY;
  const spOrders = useEmptyable(SP_ORDERS);
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Customer Orders</h1>
      </header>

      {spOrders.length === 0 ? (
        <div className="grid flex-1 place-items-center bg-background-subtle">
          <EmptyState
            icon={<ShoppingBag strokeWidth={1.75} />}
            title="No orders yet"
            description="Orders this customer places will appear here."
          />
        </div>
      ) : (
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
          {/* summary */}
          <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-secondary">Today's revenue</span>
              <span className="text-lg font-bold tabular-nums text-foreground">{formatInrExact(s.revenue)}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <SummaryCell label="Task orders" count={s.tasksCustomerCount} amount={s.tasksRevenue} />
              <SummaryCell label="Unassigned" count={s.unassignedCustomerCount} amount={s.unassignedRevenue} />
            </div>
          </div>

          {spOrders.map((o) => (
            <OrderListCard
              key={o.id}
              title={o.business}
              orderId={o.orderNo}
              status={o.cancelled ? 'cancelled' : 'placed'}
              statusLabel={o.status}
              meta={o.seller}
              total={o.total}
              rightLabel="Order date"
              rightValue={formatDate(o.date)}
              onOpenDetails={() => onOpenOrder(toOrder(o))}
              hint={o.discount ? `Coupon −${formatInrExact(o.discount)}` : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function toOrder(o: SpOrder): Order {
  return buildOrder({
    id: o.id,
    orderId: o.orderNo,
    seller: o.business,
    placedAt: o.date,
    total: o.total,
    deliveryFee: o.deliveryFee,
    statusLabel: o.status,
  });
}

function SummaryCell({ label, count, amount }: { label: string; count: number; amount: number }) {
  return (
    <div className="rounded-md bg-background-subtle p-2.5">
      <div className="text-[11px] text-foreground-secondary">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{formatInrExact(amount)}</div>
      <div className="text-[11px] text-foreground-secondary">{count} {count === 1 ? 'customer' : 'customers'}</div>
    </div>
  );
}
