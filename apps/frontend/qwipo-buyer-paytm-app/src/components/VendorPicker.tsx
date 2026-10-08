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
              {/* What it costs, who from, and what they charge to bring it.
                  The freight is part of choosing here: one vendor delivers
                  free and the next charges by the kilo, which can outweigh a
                  few rupees of difference on the price above it. It sits
                  smallest of the three — a term of the deal, not the deal. */}
              <div className="text-xs font-bold tabular-nums">{formatInr(vn.price)}</div>
              <div className="max-w-40 truncate text-xs font-medium">{vn.name}</div>
              <div
                className={cn(
                  'mt-0.5 text-xs',
                  on ? 'text-primary-foreground/80' : 'text-foreground-secondary'
                )}
              >
                {vn.fee === 'Free' ? 'Free delivery' : `Fee: ${vn.fee}`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
