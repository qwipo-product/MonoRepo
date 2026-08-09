import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Check, FileText } from 'lucide-react';
import { Button, Sheet, cn } from '@mockups/ui';
import { StatusBadge } from '@mockups/components';
import { ORDERS, TRACKING_STEPS, completedSteps, type Order, type OrderStatus } from '../data/orders';

const money = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CANCELLABLE: OrderStatus[] = ['placed', 'processing', 'in_transit'];

export function MyOrdersScreen({
  onBack,
  onOpenDetails,
}: {
  onBack: () => void;
  onOpenDetails: (orderId: string) => void;
}) {
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const [tracking, setTracking] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const orders = useMemo(
    () =>
      ORDERS.map((o) =>
        cancelledIds.has(o.id) ? { ...o, status: 'cancelled' as OrderStatus, statusLabel: 'Cancelled' } : o
      ),
    [cancelledIds]
  );

  const confirmCancel = () => {
    if (cancelTarget) setCancelledIds((prev) => new Set(prev).add(cancelTarget.id));
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
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            onOpen={() => onOpenDetails(o.id)}
            onTrack={() => setTracking(o)}
            onCancel={() => setCancelTarget(o)}
          />
        ))}
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
              Cancel order
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground-secondary">
          This will cancel your order from <span className="font-medium text-foreground">{cancelTarget?.seller}</span>.
          You can’t undo this.
        </p>
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

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onOpen}
          aria-label={`Open order ${order.orderId}`}
          className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-foreground active:scale-[0.98]"
        >
          {order.seller}
        </button>
        <StatusBadge status={order.status} label={order.statusLabel} className="shrink-0" />
      </div>

      <div className="mt-1 text-xs text-foreground-secondary">
        {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} · Placed {order.placedAt}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <CopyChip value={order.orderId} />
        <button
          onClick={onOpen}
          className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary active:scale-[0.98]"
        >
          Order details
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between rounded-md bg-background-subtle p-2.5">
        <div>
          <div className="text-[11px] text-foreground-secondary">Grand total</div>
          <div className="text-sm font-semibold tabular-nums text-foreground">{money(order.total)}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-foreground-secondary">Expected delivery</div>
          <div className="text-sm font-medium text-foreground">{order.eta}</div>
        </div>
      </div>

      {!cancelled && (
        <div className="mt-3 flex gap-2">
          {delivered ? (
            <Button variant="secondary" fullWidth onClick={onOpen}>
              <FileText size={16} /> Invoice
            </Button>
          ) : (
            <>
              <Button variant="secondary" fullWidth onClick={onCancel}>
                Cancel
              </Button>
              <Button fullWidth onClick={onTrack}>
                Track order
              </Button>
            </>
          )}
        </div>
      )}

      {cancellable && !cancelled && (
        <div className="mt-2 text-[11px] text-foreground-secondary">
          You can cancel this order before {order.eta}
        </div>
      )}
    </div>
  );
}

function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      },
      () => undefined
    );
  };
  return (
    <button
      onClick={copy}
      aria-label={`Copy order number ${value}`}
      className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground active:scale-[0.98]"
    >
      {value}
      {copied ? <Check size={13} className="text-success-foreground" /> : <Copy size={13} className="text-foreground-secondary" />}
    </button>
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
