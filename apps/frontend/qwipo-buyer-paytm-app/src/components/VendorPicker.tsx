import { cn } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import type { WholesalerVendor } from '../data/wholesaler';

/* Choose-vendor picker — labelled header + a selectable tile per vendor
   (price · name). Shared by the wholesaler product card and the selling-units
   sheet so both use one design.

   No "Best" tag: the tiles are already ordered and the prices are right
   there, so the label was the app grading a choice the buyer can see for
   itself — and it read louder than the price it was pointing at. */
export function VendorPicker({
  vendors,
  value,
  onChange,
  className,
}: {
  vendors: WholesalerVendor[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Choose vendor</span>
        <span className="text-xs text-foreground-secondary">{vendors.length} options</span>
      </div>
      {/* Each tile is as wide as the name inside it, not a share of the row:
          a vendor called Omkar Enterprises doesn't need the same space as one
          called Balaji Traders, and stretching them to match left the price
          marooned in the middle of a wide empty tile. Past the edge they
          scroll. */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="radiogroup" aria-label="Vendor">
        {vendors.map((vn) => {
          const on = vn.id === value;
          return (
            <button
              key={vn.id}
              role="radio"
              aria-checked={on}
              onClick={() => onChange(vn.id)}
              className={cn(
                'w-fit shrink-0 rounded-lg border p-2.5 text-left transition-colors',
                on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'
              )}
            >
              {/* Two lines only: what it costs and who from. The per-kg
                  logistics charge came off — it's a term of the order, not
                  something to weigh while picking between vendors. A vendor's
                  price sits below the card's own selling price in the
                  hierarchy, so it's smaller than it too. */}
              <div className="text-xs font-bold tabular-nums">{formatInr(vn.price)}</div>
              <div className="max-w-40 truncate text-xs font-medium">{vn.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
