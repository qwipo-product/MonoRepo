import { useEffect, useState, type ReactNode } from 'react';
import { Button, Chip, Sheet, Switch, cn } from '@mockups/ui';
import { DEFAULT_FILTERS, countActiveFilters, type Filters, type SortKey, type Stock } from '../data/filters';

/* FiltersSheet — shared sort/filter bottom sheet for both product lists (v1
   elements): Sort by · Availability · Minimum margin · Brand · Schemes, with
   Reset / Apply. */

const SORT: { value: SortKey; label: string; sub: string }[] = [
  { value: 'recommended', label: 'Recommended', sub: 'Most relevant first' },
  { value: 'price_asc', label: 'Price: Low to High', sub: 'Cheapest first' },
  { value: 'price_desc', label: 'Price: High to Low', sub: 'Premium first' },
  { value: 'margin_desc', label: 'Margin: High to Low', sub: 'Best profit first' },
];
const STOCK_OPTS: { value: Stock; label: string; dot: string }[] = [
  { value: 'available', label: 'In Stock', dot: 'bg-success' },
  { value: 'limited', label: 'Limited', dot: 'bg-warning' },
  { value: 'out', label: 'Out of Stock', dot: 'bg-error' },
];
const MARGIN_OPTS = [
  { v: 0, l: 'Any' }, { v: 12, l: '12% +' }, { v: 14, l: '14% +' }, { v: 16, l: '16% +' },
];

export function FiltersSheet({
  open,
  value,
  brands,
  onApply,
  onClose,
}: {
  open: boolean;
  value: Filters;
  brands: string[];
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState<Filters>(value);
  useEffect(() => {
    if (open) setF(value);
  }, [open, value]);

  const toggleArr = (key: 'stock' | 'brands', v: string) =>
    setF((s) => {
      const arr = s[key] as string[];
      return { ...s, [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });
  const active = countActiveFilters(f);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      subtitle={active > 0 ? `${active} active` : 'Refine your product view'}
      size="tall"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setF(DEFAULT_FILTERS)}>
            Reset
          </Button>
          <Button
            fullWidth
            onClick={() => {
              onApply(f);
              onClose();
            }}
          >
            Apply{active > 0 ? ` (${active})` : ''}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Block title="Sort by">
          <div role="radiogroup" aria-label="Sort by" className="space-y-2">
            {SORT.map((s) => {
              const on = f.sort === s.value;
              return (
                <button
                  key={s.value}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setF((x) => ({ ...x, sort: s.value }))}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left active:scale-[0.99]',
                    on ? 'border-primary bg-primary-soft' : 'border-border'
                  )}
                >
                  <span
                    className={cn(
                      'grid h-4 w-4 shrink-0 place-items-center rounded-full border-2',
                      on ? 'border-primary' : 'border-foreground-tertiary'
                    )}
                  >
                    {on && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-foreground">{s.label}</span>
                    <span className="block text-xs text-foreground-secondary">{s.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Block>

        <Block title="Availability">
          <div className="flex flex-wrap gap-2">
            {STOCK_OPTS.map((s) => (
              <Chip
                key={s.value}
                selected={f.stock.includes(s.value)}
                onClick={() => toggleArr('stock', s.value)}
                icon={<span className={cn('h-2 w-2 rounded-full', s.dot)} />}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </Block>

        <Block title="Minimum margin">
          <div className="flex flex-wrap gap-2">
            {MARGIN_OPTS.map((m) => (
              <Chip key={m.v} selected={f.minMargin === m.v} onClick={() => setF((x) => ({ ...x, minMargin: m.v }))}>
                {m.l}
              </Chip>
            ))}
          </div>
        </Block>

        <Block title={`Brand${f.brands.length ? ` · ${f.brands.length}` : ''}`}>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <Chip key={b} selected={f.brands.includes(b)} onClick={() => toggleArr('brands', b)}>
                {b}
              </Chip>
            ))}
          </div>
        </Block>

        <Block title="Schemes">
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">Show only items with schemes</div>
              <div className="text-xs text-foreground-secondary">Buy 1 Get 1, flat off, %-discount, etc.</div>
            </div>
            <Switch
              checked={f.schemesOnly}
              onCheckedChange={(v) => setF((x) => ({ ...x, schemesOnly: v }))}
              aria-label="Show only items with schemes"
            />
          </div>
        </Block>
      </div>
    </Sheet>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}
