import { CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { OrderListCard } from '../../components/OrderListCard';
import { buildOrder, statusFromLabel, type Order } from '../../data/orders';
import { CUSTOMER_ORDERS, RECOMMENDATIONS } from '../../data/salesperson';

/* Shared read-only panels for a customer — reused by Task Details and Customer
   Details so the Orders / Recommendation tabs never drift between the two. */

export function OrdersPanel({
  customerId,
  businessName,
  onOpenOrder,
}: {
  customerId: string;
  businessName: string;
  onOpenOrder: (order: Order) => void;
}) {
  const orders = CUSTOMER_ORDERS[customerId] ?? [];
  if (orders.length === 0) return <PanelEmpty title="No Orders Found" />;
  return (
    <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
      {orders.map((o) => (
        <OrderListCard
          key={o.id}
          title={businessName}
          orderId={o.orderNo}
          status={statusFromLabel(o.status)}
          statusLabel={o.status}
          meta={`Placed ${o.date}`}
          total={o.amount}
          onOpenDetails={() =>
            onOpenOrder(
              buildOrder({ id: o.id, orderId: o.orderNo, seller: businessName, placedAt: o.date, total: o.amount, statusLabel: o.status })
            )
          }
        />
      ))}
    </div>
  );
}

export function RecoPanel({ customerId }: { customerId: string }) {
  const reco = RECOMMENDATIONS[customerId];
  if (!reco) return <PanelEmpty title="No Recommendations" description="No recent order to reorder from." />;
  return (
    <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-3">
      <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">Last order</div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <Mini label="Date" value={reco.lastOrderDate} />
          <Mini label="Value" value={formatInrExact(reco.lastOrderValue)} />
          <Mini label="Days ago" value={String(reco.daysSince)} />
        </div>
      </div>
      <div className="space-y-2">
        <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">Suggested reorder</div>
        {reco.products.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-background-subtle text-xl">{p.image}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{p.name}</div>
              <div className="mt-0.5 text-xs text-foreground-secondary">{p.pack} · Qty {p.qty}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold tabular-nums text-foreground">{formatInrExact(p.price)}</div>
              <div className="text-[11px] text-foreground-secondary line-through tabular-nums">{formatInrExact(p.mrp)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="grid flex-1 place-items-center bg-background-subtle">
      <EmptyState icon={<CheckCircle2 className="h-7 w-7 text-foreground-secondary" />} title={title} description={description} />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background-subtle p-2">
      <div className="text-sm font-semibold text-foreground">{value}</div>
      <div className="text-[11px] text-foreground-secondary">{label}</div>
    </div>
  );
}
