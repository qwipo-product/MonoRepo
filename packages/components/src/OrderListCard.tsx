import { useState, type ReactNode } from 'react';
import { ChevronRight, Copy, Check } from 'lucide-react';
import { cn } from '@mockups/ui';
import type { OrderStatus, SellerOrderStatus } from '@mockups/types';
import { StatusBadge } from './StatusBadge';
import { formatInrExact } from './PriceLabel';

/* The one order-list card. My Orders is the reference layout; every order list
   (My Orders, Customer Orders, Task/Customer Details orders, Payment Orders)
   renders through this so they stay identical. Lifecycle actions (cancel/track/
   pay/invoice) and the "Order details" link are optional slots — a screen turns
   on only what it needs. Shared with the seller app, which also uses the
   tick box (`onToggleSelect`) for bulk actions. */
export interface OrderListCardProps {
  title: string;
  orderId: string;
  status: OrderStatus | SellerOrderStatus;
  /** Defaults to the StatusBadge's own label for the status. */
  statusLabel?: string;
  meta?: ReactNode;
  total: number;
  totalLabel?: string;
  rightLabel?: string;
  rightValue?: ReactNode;
  /** Present → title + "Order details" link open the shared Order Details. */
  onOpenDetails?: () => void;
  /** Button row (Cancel/Track, Invoice, Pay, …). */
  actions?: ReactNode;
  /** Small helper line under the actions (e.g. cancel window). */
  hint?: ReactNode;
  /** Present → a tick box before the title, for picking cards for a bulk action. */
  onToggleSelect?: () => void;
  selected?: boolean;
}

export function OrderListCard({
  title,
  orderId,
  status,
  statusLabel,
  meta,
  total,
  totalLabel = 'Grand total',
  rightLabel,
  rightValue,
  onOpenDetails,
  actions,
  hint,
  onToggleSelect,
  selected = false,
}: OrderListCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-3 shadow-sm', selected ? 'border-primary' : 'border-border')}>
      <div className="flex items-center justify-between gap-2">
        {onToggleSelect && (
          <button
            role="checkbox"
            aria-checked={selected}
            aria-label={`Select order ${orderId}`}
            onClick={onToggleSelect}
            className="-m-2 grid h-10 w-10 shrink-0 place-items-center"
          >
            <span
              className={cn(
                'grid h-5 w-5 place-items-center rounded border-2',
                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong bg-card'
              )}
            >
              {selected && <Check size={14} strokeWidth={3} />}
            </span>
          </button>
        )}
        {onOpenDetails ? (
          <button
            onClick={onOpenDetails}
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-foreground active:scale-[0.98]"
          >
            {title}
          </button>
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{title}</span>
        )}
        <StatusBadge status={status} label={statusLabel} className="shrink-0" />
      </div>

      {meta != null && <div className="mt-1 text-xs text-foreground-secondary">{meta}</div>}

      <div className="mt-2 flex items-center justify-between gap-2">
        <CopyChip value={orderId} />
        {onOpenDetails && (
          <button
            onClick={onOpenDetails}
            className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary active:scale-[0.98]"
          >
            Order details
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between rounded-md bg-background-subtle p-2.5">
        <div>
          <div className="text-[11px] text-foreground-secondary">{totalLabel}</div>
          <div className="text-sm font-semibold tabular-nums text-foreground">{formatInrExact(total)}</div>
        </div>
        {rightLabel && (
          <div className="text-right">
            <div className="text-[11px] text-foreground-secondary">{rightLabel}</div>
            <div className="text-sm font-medium text-foreground">{rightValue}</div>
          </div>
        )}
      </div>

      {actions && <div className="mt-3">{actions}</div>}
      {hint && <div className="mt-2 text-[11px] text-foreground-secondary">{hint}</div>}
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
