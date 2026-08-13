import { useEffect, useState } from 'react';
import { ChevronLeft, Search, SlidersHorizontal, PackageOpen } from 'lucide-react';
import { EmptyState, Button } from '@mockups/ui';
import { ProductCard, formatInr } from '@mockups/components';
import { PRODUCTS, type Product } from '../data/products';
import { AppliedFilterBar } from '../components/AppliedFilterBar';
import { FiltersSheet } from '../sheets/FiltersSheet';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { DEFAULT_FILTERS, applyFilters, countActiveFilters, type Filters, type AppliedFilter } from '../data/filters';
import { deliveryFooter } from '../components/DeliveryFooter';
import { useEmptyable } from '../review/demoState';

const brandOf = (name: string) => name.split(' ')[0];
const BRAND_OPTIONS = [...new Set(PRODUCTS.map((p) => brandOf(p.shortName)))];

// Narrow the catalog to the category / brand / distributor a screen linked in with.
const matchesApplied = (p: Product, a: AppliedFilter) =>
  a.type === 'category'
    ? p.category === a.value
    : a.type === 'brand'
      ? p.shortName.toLowerCase().startsWith(a.value.toLowerCase())
      : p.seller === a.value;

export function CatalogScreen({
  applied: appliedProp = [],
  onBack,
  onSearch,
  qty,
  onOpenSheet,
  onOpenGallery,
  onSetQty,
  onGoToCart,
  cartCount,
  cartTotal,
}: {
  applied?: AppliedFilter[];
  onBack?: () => void;
  onSearch?: () => void;
  qty: Record<string, number>;
  onOpenSheet: (id: string) => void;
  onOpenGallery?: (id: string) => void;
  onSetQty: (id: string, n: number) => void;
  onGoToCart: () => void;
  cartCount: number;
  cartTotal: number;
}) {
  const [variant, setVariant] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [discountsOpen, setDiscountsOpen] = useState(false);
  const [applied, setApplied] = useState<AppliedFilter[]>(appliedProp);
  useEffect(() => setApplied(appliedProp), [appliedProp]);

  // Distributor flow: only distributor-source SKUs (wholesaler products live in
  // their own catalog + WholesalerProductsScreen — no channel cross-over).
  const distProducts = PRODUCTS.filter((p) => p.source === 'distributor');
  const base = applied.length ? distProducts.filter((p) => applied.every((a) => matchesApplied(p, a))) : distProducts;
  const items = useEmptyable(applyFilters(base, filters, {
    id: (p) => p.id,
    brand: (p) => brandOf(p.shortName),
    price: (p) => p.price,
  }));
  const activeFilters = countActiveFilters(filters);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]" aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold leading-tight">Product List</h1>
          <p className="text-xs text-foreground-secondary">{items.length} products</p>
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

      <AppliedFilterBar applied={applied} onRemove={(i) => setApplied((a) => a.filter((_, idx) => idx !== i))} />

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {items.length === 0 ? (
          <EmptyState
            icon={<PackageOpen strokeWidth={1.75} />}
            title="No products here"
            description={
              activeFilters > 0
                ? 'No product matches these filters. Try clearing one.'
                : 'New products are on the way.'
            }
            action={
              activeFilters > 0 ? (
                <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          items.map((p) => (
            <ProductCard
              key={p.id}
              name={p.name}
              caseLabel={p.caseLabel}
              image={p.image}
              variants={p.variants}
              selectedVariant={variant[p.id] ?? p.variants[0].id}
              onSelectVariant={(id) => setVariant((v) => ({ ...v, [p.id]: id }))}
              margin={p.margin}
              price={p.price}
              mrp={p.mrp}
              qty={qty[p.id] ?? 0}
              onQty={(n) => onSetQty(p.id, n)}
              onAdd={() => onOpenSheet(p.id)}
              onImageClick={onOpenGallery ? () => onOpenGallery(p.id) : undefined}
              onDiscounts={() => setDiscountsOpen(true)}
              subtotal={p.price * (qty[p.id] ?? 0)}
              subtotalLabel={`Total (${qty[p.id] ?? 0} pcs)`}
              footer={deliveryFooter(p.seller)}
            />
          ))
        )}
      </div>

      {cartCount > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-bar-top)]">
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-wide text-foreground-secondary">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </div>
            <div className="text-lg font-bold tabular-nums">{formatInr(cartTotal)}</div>
            <div className={cartTotal >= 3000 ? 'text-xs text-success-foreground' : 'text-xs text-foreground-secondary'}>
              {cartTotal >= 3000 ? 'Free delivery' : `+ ${formatInr(30)} delivery fee`}
            </div>
          </div>
          <Button className="px-8" onClick={onGoToCart}>
            Go to cart
          </Button>
        </div>
      )}

      <FiltersSheet
        open={filterOpen}
        value={filters}
        brands={BRAND_OPTIONS}
        onApply={setFilters}
        onClose={() => setFilterOpen(false)}
      />

      <DiscountsSheet open={discountsOpen} onClose={() => setDiscountsOpen(false)} />
    </div>
  );
}
