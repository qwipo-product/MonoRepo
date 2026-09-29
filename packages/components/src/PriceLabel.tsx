// PriceLabel — Indian-formatted price with optional MRP strikethrough and a
// per-unit suffix. Replaces the ad-hoc `₹{n.toLocaleString('en-IN')}` + MRP
// logic scattered across ShopProductCard, OrderDetails, ViewItems, OrderSummary.
//
//   <PriceLabel price={165} mrp={185} suffix="/pc" size="lg" />

import { cn } from '@mockups/ui';

export interface PriceLabelProps {
  price: number;
  mrp?: number;
  /** e.g. "/pc" */
  suffix?: string;
  size?: 'sm' | 'lg';
  align?: 'start' | 'end';
  className?: string;
}

/** ₹ with Indian grouping + two decimals everywhere (e.g. ₹4,800.00). */
const inr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const inrExact = inr;

export function PriceLabel({
  price,
  mrp,
  suffix,
  size = 'sm',
  align = 'end',
  className,
}: PriceLabelProps) {
  const showMrp = mrp != null && mrp > price;
  return (
    <div className={cn('flex flex-col', align === 'end' ? 'items-end' : 'items-start', className)}>
      {showMrp && (
        <span className="text-xs text-foreground-secondary">
          MRP <span className="line-through">{inr(mrp)}</span>
        </span>
      )}
      <span
        className={cn(
          'font-bold tabular-nums text-foreground',
          // 16px, not 18: the selling price is the number that matters on a
          // card, but at 18 it shouted over everything around it.
          size === 'lg' ? 'text-base' : 'text-sm'
        )}
      >
        {inr(price)}
        {suffix && <span className="text-xs font-normal text-foreground-secondary">{suffix}</span>}
      </span>
    </div>
  );
}

export { inr as formatInr, inrExact as formatInrExact };
