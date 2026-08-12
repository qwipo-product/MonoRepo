import { useEffect, useState } from 'react';
import { Button, Sheet, cn } from '@mockups/ui';

/* SortSheet — shared sort/filter bottom sheet for the product lists. Radio
   options, applied on "Apply" so the list only re-orders on confirm. */

export type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'name';

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];

export function SortSheet({
  open,
  value,
  onApply,
  onClose,
}: {
  open: boolean;
  value: SortKey;
  onApply: (v: SortKey) => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState<SortKey>(value);
  useEffect(() => {
    if (open) setPending(value);
  }, [open, value]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Sort products"
      footer={
        <Button
          fullWidth
          onClick={() => {
            onApply(pending);
            onClose();
          }}
        >
          Apply
        </Button>
      }
    >
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">Sort by</div>
      <div role="radiogroup" aria-label="Sort by" className="divide-y divide-border">
        {OPTIONS.map((o) => {
          const active = o.value === pending;
          return (
            <button
              key={o.value}
              role="radio"
              aria-checked={active}
              onClick={() => setPending(o.value)}
              className="flex w-full items-center justify-between gap-3 py-3 text-left active:scale-[0.99]"
            >
              <span className={cn('text-sm text-foreground', active && 'font-medium')}>{o.label}</span>
              <span
                className={cn(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2',
                  active ? 'border-primary' : 'border-foreground-tertiary'
                )}
              >
                {active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

/** Apply a SortKey to a list, given how to read price/name from an item. */
export function sortItems<T>(items: T[], sort: SortKey, priceOf: (t: T) => number, nameOf: (t: T) => string): T[] {
  const arr = [...items];
  switch (sort) {
    case 'price-asc':
      return arr.sort((a, b) => priceOf(a) - priceOf(b));
    case 'price-desc':
      return arr.sort((a, b) => priceOf(b) - priceOf(a));
    case 'name':
      return arr.sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
    default:
      return arr;
  }
}
