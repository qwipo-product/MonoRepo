import { useMemo, useState } from 'react';
import { ChevronLeft, FileText, Check, Package } from 'lucide-react';
import { Button, EmptyState, Sheet, cn } from '@mockups/ui';
import { OrderListCard } from '../components/OrderListCard';
import { ORDERS, TRACKING_STEPS, completedSteps, type Order, type OrderStatus } from '../data/orders';
import { formatDay, formatEta, isEtaWindow } from '../date';
import { useEmptyable } from '../review/demoState';
import { cancellationPolicy, feeSellerOf, useWallet, type CancelPolicy } from '../data/cancellation';

const CANCELLABLE: OrderStatus[] = ['placed', 'processing', 'in_transit'];

export function MyOrdersScreen({
  onBack,
  onOpenDetails,
  onStartShopping,
}: {
  onBack: () => void;
  onOpenDetails: (orderId: string) => void;
  onStartShopping: () => void;
}) {
  const { cancelled: cancelledFees, cancelOrder } = useWallet();
  const [tracking, setTracking] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const source = useEmptyable(ORDERS);
  const orders = useMemo(
    () =>
      source.map((o) =>
        o.id in cancelledFees ? { ...o, status: 'cancelled' as OrderStatus, statusLabel: 'Cancelled' } : o
      ),
    [cancelledFees, source]
  );

  const policy = cancelTarget ? cancellationPolicy(cancelTarget) : null;

  const confirmCancel = () => {
    if (cancelTarget && policy) cancelOrder(cancelTarget, policy.fee);
    setCancelTarget(null);
  };

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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">My Orders</h1>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {orders.length === 0 ? (
          <EmptyState
            icon={<Package strokeWidth={1.75} />}
            title="No orders yet"
            description="Orders you place will show up here, with live tracking until they're delivered."
            action={<Button onClick={onStartShopping}>Start shopping</Button>}
          />
        ) : (
          orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onOpen={() => onOpenDetails(o.id)}
              onTrack={() => setTracking(o)}
              onCancel={() => setCancelTarget(o)}
            />
          ))
        )}
      </div>

      {/* tracking timeline */}
      <Sheet
        open={!!tracking}
        onClose={() => setTracking(null)}
        title="Tracking details"
        subtitle={tracking?.orderId}
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                const id = tracking?.id;
                setTracking(null);
                if (id) onOpenDetails(id);
              }}
            >
              Order details
            </Button>
            <Button fullWidth onClick={() => setTracking(null)}>
              Track order
            </Button>
          </div>
        }
      >
        {tracking && <Timeline status={tracking.status} />}
      </Sheet>

      {/* cancel confirmation */}
      <Sheet
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel this order?"
        subtitle={cancelTarget?.orderId}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setCancelTarget(null)}>
              Keep order
            </Button>
            <Button variant="destructive" fullWidth onClick={confirmCancel}>
              {policy?.kind === 'fee' ? `Cancel · ₹${policy.fee} fee` : 'Cancel order'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground-secondary">
          This will cancel your order from <span className="font-medium text-foreground">{cancelTarget?.seller}</span>.
          You can’t undo this.
        </p>
        {cancelTarget && policy && <FeeNotice order={cancelTarget} policy={policy} />}
      </Sheet>
    </div>
  );
}

function OrderCard({
  order,
  onOpen,
  onTrack,
  onCancel,
}: {
  order: Order;
  onOpen: () => void;
  onTrack: () => void;
  onCancel: () => void;
}) {
  const cancelled = order.status === 'cancelled';
  const delivered = order.status === 'delivered';
  const cancellable = CANCELLABLE.includes(order.status);
  const { cancelled: cancelledFees } = useWallet();
  const policy = cancellationPolicy(order);
  const feeCharged = cancelledFees[order.id] ?? 0;

  let hint: string | undefined;
  if (cancelled) {
    if (feeCharged > 0)
      hint = `₹${feeCharged} cancellation fee added to your wallet. Collected on your next order with ${feeSellerOf(order)}`;
  } else if (cancellable) {
    if (policy.kind === 'seller_delay') hint = 'Delivery delayed by the seller. You can cancel without a fee';
    else if (policy.kind === 'fee') hint = `Cancelling now adds a ₹${policy.fee} cancellation fee`;
    else if (policy.freeUntil) hint = `Free cancellation until 11:59 PM on ${formatDay(policy.freeUntil)}`;
  }

  return (
    <OrderListCard
      title={order.seller}
      orderId={order.orderId}
      status={order.status}
      statusLabel={order.statusLabel}
      meta={`${order.itemCount} ${order.itemCount === 1 ? 'item' : 'items'} · Placed ${formatDay(order.placedAt)}`}
      total={order.total}
      rightLabel="Expected delivery"
      rightValue={formatEta(order.eta)}
      rightNote={isEtaWindow(order.eta) ? 'Delivered within 24–48 hrs' : undefined}
      onOpenDetails={onOpen}
      actions={
        cancelled ? undefined : delivered ? (
          <Button variant="secondary" fullWidth onClick={onOpen}>
            <FileText size={16} /> Invoice
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={onCancel} className="border border-destructive text-destructive">
              Cancel
            </Button>
            <Button fullWidth onClick={onTrack}>
              Track order
            </Button>
          </div>
        )
      }
      hint={hint}
    />
  );
}

/* What cancelling costs, said before the retailer confirms. */
function FeeNotice({ order, policy }: { order: Order; policy: CancelPolicy }) {
  const seller = feeSellerOf(order);
  if (policy.kind === 'fee')
    return (
      <div className="mt-3 rounded-md border border-warning-border bg-warning-subtle p-3 text-sm text-warning-foreground">
        <div className="font-semibold">₹{policy.fee} cancellation fee applies</div>
        <p className="mt-1 text-xs">
          Free cancellation ended the night before delivery. The fee is added to your wallet and collected with your
          next order from {seller}.
        </p>
      </div>
    );
  if (policy.kind === 'seller_delay')
    return (
      <div className="mt-3 rounded-md border border-success-border bg-success-subtle p-3 text-sm text-success-foreground">
        <div className="font-semibold">No cancellation fee</div>
        <p className="mt-1 text-xs">This delivery is running late because of the seller, so you won’t be charged.</p>
      </div>
    );
  return (
    <div className="mt-3 rounded-md border border-success-border bg-success-subtle p-3 text-sm text-success-foreground">
      <div className="font-semibold">Free cancellation</div>
      <p className="mt-1 text-xs">
        {policy.freeUntil
          ? `No fee if you cancel before 11:59 PM on ${formatDay(policy.freeUntil)}.`
          : 'No fee for this cancellation.'}
      </p>
    </div>
  );
}

function Timeline({ status }: { status: OrderStatus }) {
  const done = completedSteps(status);
  return (
    <ol className="ml-1">
      {TRACKING_STEPS.map((label, i) => {
        const isDone = i < done;
        const isCurrent = i === done && done < TRACKING_STEPS.length;
        const isLast = i === TRACKING_STEPS.length - 1;
        return (
          <li key={label} className="flex gap-3 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              {isDone ? (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success text-white">
                  <Check size={14} />
                </span>
              ) : isCurrent ? (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-success bg-success-subtle">
                  <span className="h-2 w-2 rounded-full bg-success" />
                </span>
              ) : (
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-muted" />
              )}
              {!isLast && <span className={cn('w-0.5 flex-1', isDone ? 'bg-success' : 'bg-border')} />}
            </div>
            <span
              className={cn(
                'pt-0.5 text-sm',
                isDone || isCurrent ? 'font-medium text-foreground' : 'text-foreground-secondary'
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
