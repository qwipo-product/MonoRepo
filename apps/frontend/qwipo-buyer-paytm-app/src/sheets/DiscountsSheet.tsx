import { Percent } from 'lucide-react';
import { Sheet, EmptyState } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { priceSlabsFor } from '../data/products';

/** Quantity discounts for the product whose Discounts control opened this sheet. */
export function DiscountsSheet({
  open,
  onClose,
  productId,
}: {
  open: boolean;
  onClose: () => void;
  productId?: string | null;
}) {
  const slabs = priceSlabsFor(productId);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<Percent size={18} />}
      title="Offer & Schemes"
      subtitle="Please review the following before proceeding"
      className="min-h-[40%] max-h-[70%]"
    >
      {slabs.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Quantity Price Slab</h3>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-3 bg-muted px-3 py-2.5 text-xs font-medium text-foreground-secondary">
              <span>Quantity</span>
              <span>Margin %</span>
              <span className="text-right">Unit Price</span>
            </div>
            {slabs.map((s) => (
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
      ) : (
        <EmptyState
          icon={<Percent strokeWidth={1.75} />}
          title="No quantity price slabs"
          description="This item uses a single selling price."
        />
      )}
    </Sheet>
  );
}
