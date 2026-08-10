import type { ComponentType } from 'react';
import { ChevronDown, Gift, Percent, Truck } from 'lucide-react';
import { Sheet, cn } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';

/* Offer & Schemes sheet — opened from a product card's "Discounts" button. Shows
   the quantity price-slab (margin + unit price per case band) and the seller's
   running offers as expandable rows. Self-contained demo content. */

interface Slab {
  qty: string;
  margin: number;
  price: number;
}

const SLABS: Slab[] = [
  { qty: '> 5 Cases', margin: 17, price: 153.45 },
  { qty: '3 - 4 Cases', margin: 14, price: 160.05 },
  { qty: '1 - 2 Cases', margin: 12, price: 165 },
];

interface Offer {
  icon: ComponentType<{ className?: string }>;
  tint: string;
  title: string;
  sub: string;
  detail: string;
}

const OFFERS: Offer[] = [
  {
    icon: Gift,
    tint: 'bg-warning-subtle text-warning-foreground',
    title: 'Buy 10 Cases Get 1 Free',
    sub: 'On purchases of 16 Pcs/Case',
    detail: 'Add 10 cases of this product and 1 case is added free at checkout.',
  },
  {
    icon: Percent,
    tint: 'bg-primary-soft text-primary',
    title: '5% Off',
    sub: 'Get 5% off on your order above ₹500 upto ₹100',
    detail: 'Applies to the seller subtotal above ₹500. Maximum discount ₹100 per order.',
  },
  {
    icon: Truck,
    tint: 'bg-success-subtle text-success-foreground',
    title: 'Free Delivery',
    sub: 'Free shipping on orders above ₹3,000',
    detail: "Delivery fee is waived once this seller's subtotal crosses ₹3,000.",
  },
];

export function DiscountsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<Percent size={18} />}
      title="Offer & Schemes"
      subtitle="Please review the following before proceeding"
    >
      {/* quantity price slab */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Quantity Price Slab</h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-3 bg-muted px-3 py-2.5 text-xs font-medium text-foreground-secondary">
            <span>Quantity</span>
            <span>Margin %</span>
            <span className="text-right">Unit Price</span>
          </div>
          {SLABS.map((s) => (
            <div
              key={s.qty}
              className="grid grid-cols-3 items-center border-t border-border px-3 py-3.5 text-sm"
            >
              <span className="font-medium text-foreground">{s.qty}</span>
              <span className="font-semibold text-success-foreground">{s.margin} %</span>
              <span className="text-right font-bold tabular-nums text-foreground">{formatInrExact(s.price)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* other offers */}
      <section className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Other Offers</h3>
        <div className="space-y-3">
          {OFFERS.map((o) => (
            <details
              key={o.title}
              className="group rounded-lg border border-border bg-card [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
                <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', o.tint)}>
                  <o.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{o.title}</span>
                  <span className="block text-xs text-foreground-secondary">{o.sub}</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-foreground-secondary transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-border p-3 text-sm text-foreground-secondary">{o.detail}</div>
            </details>
          ))}
        </div>
      </section>
    </Sheet>
  );
}
