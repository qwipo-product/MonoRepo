import { useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { EmptyState } from '@mockups/ui';
import { ProductCard } from '@mockups/components';
import { REORDER_ITEMS } from '../data/reorder';
import { FiltersSheet } from '../sheets/FiltersSheet';
import { DEFAULT_FILTERS, applyFilters, countActiveFilters, type Filters } from '../data/filters';

/* Reorder — the distributor Product List pattern applied to purchase history.
   Distributor- and wholesaler-sourced items live in ONE list; each card shows
   the seller name and a Distributor / Wholesaler badge (ProductCard `source`).
   Root tab screen, so cart lives in the bottom nav — no in-screen cart strip. */

const brandOf = (name: string) => name.split(' ')[0];
const BRAND_OPTIONS = [...new Set(REORDER_ITEMS.map((r) => brandOf(r.product.shortName)))];

export function ReorderScreen({
  qty,
  onOpenSheet,
  onSetQty,
  onSearch,
}: {
  qty: Record<string, number>;
  onOpenSheet: (id: string) => void;
  onSetQty: (id: string, n: number) => void;
  onSearch?: () => void;
}) {
  const [variant, setVariant] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const items = applyFilters(REORDER_ITEMS, filters, {
    id: (r) => r.product.id,
    brand: (r) => brandOf(r.product.shortName),
    price: (r) => r.product.price,
  });
  const activeFilters = countActiveFilters(filters);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary-soft text-primary" aria-hidden>
          <RotateCcw size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold leading-tight">Reorder</h1>
          <p className="text-xs text-foreground-secondary">{items.length} items you buy often</p>
        </div>
        <button onClick={onSearch} className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]" aria-label="Search">
          <Search size={18} />
        </button>
        <button
          onClick={() => setFilterOpen(true)}
          className="relative grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
          aria-label="Sort and filter"
        >
          <SlidersHorizontal size={18} />
          {activeFilters > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </button>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {items.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No previous orders"
            description="Items you've ordered before will appear here to reorder in one tap."
          />
        ) : (
          items.map((r) => (
            <ProductCard
              key={r.product.id}
              name={r.product.name}
              caseLabel={r.product.caseLabel}
              image={r.product.image}
              variants={r.product.variants}
              selectedVariant={variant[r.product.id] ?? r.product.variants[0].id}
              onSelectVariant={(id) => setVariant((v) => ({ ...v, [r.product.id]: id }))}
              seller={r.product.seller}
              source={r.product.source}
              margin={r.product.margin}
              price={r.product.price}
              mrp={r.product.mrp}
              qty={qty[r.product.id] ?? 0}
              onQty={(n) => onSetQty(r.product.id, n)}
              onAdd={() => onOpenSheet(r.product.id)}
              footer={
                <>
                  <span>Last ordered {r.lastOrdered}</span>
                  <span>{r.timesOrdered}× before</span>
                </>
              }
            />
          ))
        )}
      </div>

      <FiltersSheet
        open={filterOpen}
        value={filters}
        brands={BRAND_OPTIONS}
        onApply={setFilters}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}
