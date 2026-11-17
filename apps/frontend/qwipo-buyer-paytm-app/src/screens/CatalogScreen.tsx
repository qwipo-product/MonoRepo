import { useEffect, useState } from 'react';
import { ChevronLeft, Search, SlidersHorizontal, PackageOpen } from 'lucide-react';
import { EmptyState, Button } from '@mockups/ui';
import { ProductCard } from '@mockups/components';
import { PRODUCTS, defaultVariantId, skuFor, type Product } from '../data/products';
import { offerNameSuffix } from '../data/coupons';
import { FiltersSheet } from '../sheets/FiltersSheet';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { DEFAULT_FILTERS, applyFilters, countActiveFilters, type Filters, type AppliedFilter } from '../data/filters';
import { deliveryFooter } from '../components/DeliveryFooter';
import { useEmptyable } from '../review/demoState';
import { CartBar } from '../components/CartBar';

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
  onGoToCart,
  cartCount,
  cartTotal,
  cartFreight,
}: {
  applied?: AppliedFilter[];
  onBack?: () => void;
  onSearch?: () => void;
  qty: Record<string, number>;
  onOpenSheet: (id: string) => void;
  onOpenGallery?: (id: string) => void;
  onGoToCart: () => void;
  cartCount: number;
  cartTotal: number;
  /** Delivery across the whole cart — see CartBar. */
  cartFreight?: number;
}) {
  const [variant, setVariant] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [discountsProductId, setDiscountsProductId] = useState<string | null>(null);
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

  /* The header says two things and no more: what the buyer tapped to get
     here, and whose products these are.

     A seller's own brand or category link carries both — the brand AND the
     distributor — and the brand is what was tapped, so it leads. The
     distributor then becomes the context under the count rather than
     competing for the heading. */
  const sellerFilter = applied.find((a) => a.type === 'distributor');
  const tapped = [...applied].reverse().find((a) => a.type !== 'distributor');
  const heading = tapped?.value ?? sellerFilter?.value ?? 'Product List';

  /* Under the count: whose shelf this is. Scoped to one seller, name them —
     except when they are already the heading, where the list is simply all of
     what they carry. Otherwise one seller gets named and several do not,
     because naming them all would neither fit nor help. */
  const sellers = Array.from(new Set(items.map((p) => p.seller)));
  const context = sellerFilter
    ? tapped
      ? sellerFilter.value
      : 'All products'
    : sellers.length === 1
      ? sellers[0]
      : 'multiple sellers';
  const subtitle = `${items.length} products · ${context}`;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]" aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">{heading}</h1>
          <p className="truncate text-xs text-foreground-secondary">{subtitle}</p>
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
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-2xs font-semibold text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </button>
      </header>

      {/* No "Filtered by" chip row: the header above already names the
          category or brand this list was opened from, so the chip repeated it
          one line below. The filter still applies, and the Filters sheet still
          shows what is active. */}
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
          items.map((p) => {
            const selected = variant[p.id] ?? defaultVariantId(p);
            const sku = skuFor(p, selected);
            return (
            <ProductCard
              key={p.id}
              name={p.name + offerNameSuffix(p.id)}
              caseLabel={p.caseLabel}
              image={sku.image}
              variants={p.variants}
              selectedVariant={selected}
              onSelectVariant={(id) => setVariant((v) => ({ ...v, [p.id]: id }))}
              seller={p.seller}
              margin={sku.margin}
              price={sku.price}
              mrp={sku.mrp}
              qty={qty[p.id] ?? 0}
              onAdd={() => onOpenSheet(p.id)}
              onImageClick={onOpenGallery ? () => onOpenGallery(p.id) : undefined}
              onDiscounts={() => setDiscountsProductId(p.id)}
              footer={deliveryFooter(p.seller)}
            />
            );
          })
        )}
      </div>

      <CartBar count={cartCount} total={cartTotal} freight={cartFreight} onGoToCart={onGoToCart} />

      <FiltersSheet
        open={filterOpen}
        value={filters}
        brands={BRAND_OPTIONS}
        onApply={setFilters}
        onClose={() => setFilterOpen(false)}
      />

      <DiscountsSheet
        open={!!discountsProductId}
        productId={discountsProductId}
        onClose={() => setDiscountsProductId(null)}
      />
    </div>
  );
}
