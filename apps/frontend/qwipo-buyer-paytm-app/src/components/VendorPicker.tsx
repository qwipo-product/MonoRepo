import { cn } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import type { WholesalerVendor } from '../data/wholesaler';
import { OfflineBadge, useSellerOffline } from './SellerOffline';

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
  const { isOffline, notify } = useSellerOffline();
  /* Offline vendors (Accept Orders OFF) stay visible — greyed, at the end, with
     the red badge — but can't be chosen; tapping one says why. */
  const ordered = [...vendors.filter((v) => !isOffline(v.name)), ...vendors.filter((v) => isOffline(v.name))];
  const online = ordered.filter((v) => !isOffline(v.name)).length;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Choose vendor</span>
        <span className="text-xs text-foreground-secondary">
          {online} {online === 1 ? 'option' : 'options'}
          {online < vendors.length ? ` · ${vendors.length - online} offline` : ''}
        </span>
      </div>
      {/* Each tile is as wide as the name inside it, not a share of the row:
          a vendor called Omkar Enterprises doesn't need the same space as one
          called Balaji Traders, and stretching them to match left the price
          marooned in the middle of a wide empty tile. Past the edge they
          scroll. */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="radiogroup" aria-label="Vendor">
        {ordered.map((vn) => {
          if (isOffline(vn.name)) {
            return (
              <button
                key={vn.id}
                role="radio"
                aria-checked={false}
                aria-disabled
                aria-label={`${vn.name} is currently offline`}
                onClick={() => notify(vn.name)}
                className="w-fit shrink-0 rounded-lg border border-border bg-muted p-2.5 text-left"
              >
                <OfflineBadge className="mb-1 px-1.5 text-[10px]" />
                <div className="opacity-60 grayscale">
                  <div className="text-xs font-bold tabular-nums text-foreground-secondary line-through">
                    {formatInr(vn.price)}
                  </div>
                  <div className="max-w-40 truncate text-xs font-medium text-foreground-secondary">{vn.name}</div>
                </div>
              </button>
            );
          }
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
