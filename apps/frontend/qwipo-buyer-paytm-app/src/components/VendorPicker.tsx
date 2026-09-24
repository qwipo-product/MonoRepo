import { cn } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import type { WholesalerVendor } from '../data/wholesaler';

/* Choose-vendor picker — labelled header + horizontal rail of selectable vendor
   cards (price · name · fee), cheapest tagged "Best". Shared by the wholesaler
   product card and the selling-units sheet so both use one design. */
export function VendorPicker({
  vendors,
  value,
  onChange,
  cheapestId,
  className,
}: {
  vendors: WholesalerVendor[];
  value: string;
  onChange: (id: string) => void;
  cheapestId: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">Choose vendor</span>
        <span className="text-xs text-foreground-secondary">{vendors.length} options</span>
      </div>
      {/* Two vendors is the common case and they fill the row; more than that
          and the row scrolls rather than shrinking the tiles to nothing. */}
      <div
        className={cn('no-scrollbar gap-2', vendors.length <= 2 ? 'grid grid-cols-2' : 'flex overflow-x-auto')}
        role="radiogroup"
        aria-label="Vendor"
      >
        {vendors.map((vn) => {
          const on = vn.id === value;
          return (
            <button
              key={vn.id}
              role="radio"
              aria-checked={on}
              onClick={() => onChange(vn.id)}
              className={cn(
                'relative rounded-lg border p-2.5 text-left transition-colors',
                vendors.length <= 2 ? 'min-w-0' : 'w-40 shrink-0',
                on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'
              )}
            >
              {vn.id === cheapestId && (
                <span
                  className={cn(
                    'absolute right-2 top-2 rounded-full px-1.5 py-0.5 type-micro',
                    on ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-success-subtle text-success-foreground'
                  )}
                >
                  Best
                </span>
              )}
              <div className="text-base font-bold tabular-nums">{formatInr(vn.price)}</div>
              <div className="truncate text-sm font-semibold">{vn.name}</div>
              <div className={cn('type-caption', on ? 'text-primary-foreground/80' : 'text-foreground-secondary')}>
                {vn.fee}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
