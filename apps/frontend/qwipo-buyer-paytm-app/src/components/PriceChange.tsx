/* Price-change display for the cart.

   Sellers re-rate daily, so a cart left overnight can cost more (or less) than
   when it was filled. Two pieces, deliberately separate:

     • <PriceChangeTag>     — per line: what this item did
     • <PriceChangeBanner>  — cart-wide: what it did to the order total

   Direction is never carried by colour alone — the arrow and the sign say it
   too, so it survives greyscale and colour-blind viewing. */

import { ArrowDown, ArrowUp } from 'lucide-react';
import { InlineMessage, cn } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import type { PriceChangeSummary } from '../data/cart';

/** Per-line tag: "↑ ₹7" with the old price struck through. */
export function PriceChangeTag({
  priceWhenAdded,
  delta,
  className,
}: {
  priceWhenAdded?: number;
  /** Per-unit change: + dearer, − cheaper. */
  delta?: number;
  className?: string;
}) {
  if (!delta || priceWhenAdded == null) return null;
  const up = delta > 0;
  const Arrow = up ? ArrowUp : ArrowDown;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      <span className="text-foreground-secondary line-through tabular-nums">
        {formatInr(priceWhenAdded)}
      </span>
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-semibold tabular-nums',
          up
            ? 'bg-error-subtle text-error-foreground'
            : 'bg-success-subtle text-success-foreground'
        )}
      >
        <Arrow className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        {up ? '+' : '−'}
        {formatInr(Math.abs(delta))}
      </span>
    </span>
  );
}

/** Cart-wide banner: how many lines moved and the net effect on the total. */
export function PriceChangeBanner({
  summary,
  onReview,
  className,
}: {
  summary: PriceChangeSummary;
  onReview?: () => void;
  className?: string;
}) {
  if (summary.changed === 0) return null;

  const net = summary.net;
  const parts = [
    summary.up > 0 ? `${summary.up} up` : null,
    summary.down > 0 ? `${summary.down} down` : null,
  ].filter(Boolean);

  return (
    <InlineMessage
      className={className}
      variant="warning"
      title={`${summary.changed} ${summary.changed === 1 ? 'item' : 'items'} changed price`}
      description={
        <>
          {parts.join(' · ')} since you added {summary.changed === 1 ? 'it' : 'them'}.{' '}
          {net === 0 ? (
            <span className="font-semibold">No change to your total.</span>
          ) : (
            <span className="font-semibold tabular-nums">
              Your total is {net > 0 ? 'up' : 'down'} {formatInr(Math.abs(net))}.
            </span>
          )}
        </>
      }
      action={
        onReview ? (
          <button
            type="button"
            onClick={onReview}
            className="text-xs font-semibold underline underline-offset-2"
          >
            Review changes
          </button>
        ) : undefined
      }
    />
  );
}
