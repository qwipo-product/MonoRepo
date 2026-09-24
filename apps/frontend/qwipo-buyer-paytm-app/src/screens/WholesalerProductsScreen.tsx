import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronDown, Search, SlidersHorizontal, PackageOpen } from 'lucide-react';
import { Badge, Button, Card, Chip, EmptyState, QtyStepper } from '@mockups/ui';
import { PriceLabel, formatInr } from '@mockups/components';
import { WHOLESALER_PRODUCTS, cheapestVendorId, type WholesalerProduct } from '../data/wholesaler';
import { WholesalerUnitsSheet } from '../sheets/WholesalerUnitsSheet';
import { ProductImagesSheet } from '../sheets/ProductImagesSheet';
import { VendorPicker } from '../components/VendorPicker';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { AppliedFilterBar } from '../components/AppliedFilterBar';
import { FiltersSheet } from '../sheets/FiltersSheet';
import { DEFAULT_FILTERS, applyFilters, countActiveFilters, type Filters, type AppliedFilter } from '../data/filters';
import { useEmptyable } from '../review/demoState';

const minPrice = (p: WholesalerProduct) => Math.min(...p.vendors.map((v) => v.price));
const brandOf = (name: string) => name.split(' ')[0];
const BRAND_OPTIONS = [...new Set(WHOLESALER_PRODUCTS.map((p) => brandOf(p.name)))];

// Narrow to the category / brand / distributor a screen linked in with.
const matchesApplied = (p: WholesalerProduct, a: AppliedFilter) =>
  a.type === 'category'
    ? p.category === a.value
    : a.type === 'brand'
      ? p.brand.toLowerCase() === a.value.toLowerCase() || p.name.toLowerCase().includes(a.value.toLowerCase())
      : p.vendors.some((v) => v.name === a.value);

/* Wholesaler Product List — replica of the distributor list, but each product
   is offered by MULTIPLE vendors (price + fee). The buyer selects a vendor per
   line; the cheapest is tagged "Best". Add opens the selling-units sheet. */
export function WholesalerProductsScreen({
  applied: appliedProp = [],
  qty,
  onSetQty,
  vendorSel,
  onSetVendor,
  onBack,
  onSearch,
  onGoToCart,
  initialSheet = false,
}: {
  applied?: AppliedFilter[];
  /** Live quantities, shared with Cart Summary — App.tsx owns this state. */
  qty: Record<string, number>;
  onSetQty: (id: string, n: number) => void;
  vendorSel: Record<string, string>;
  onSetVendor: (id: string, vendorId: string) => void;
  onBack: () => void;
  onSearch?: () => void;
  onGoToCart: () => void;
  initialSheet?: boolean;
}) {
  const [sheetId, setSheetId] = useState<string | null>(initialSheet ? WHOLESALER_PRODUCTS[0].id : null);
  const [galleryId, setGalleryId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [discountsProductId, setDiscountsProductId] = useState<string | null>(null);
  const [applied, setApplied] = useState<AppliedFilter[]>(appliedProp);
  useEffect(() => setApplied(appliedProp), [appliedProp]);

  const base = applied.length ? WHOLESALER_PRODUCTS.filter((p) => applied.every((a) => matchesApplied(p, a))) : WHOLESALER_PRODUCTS;
  const products = useEmptyable(applyFilters(base, filters, {
    id: (p) => p.id,
    brand: (p) => brandOf(p.name),
    price: minPrice,
  }));
  const activeFilters = countActiveFilters(filters);

  const vendorFor = (p: WholesalerProduct) => {
    const id = vendorSel[p.id] ?? cheapestVendorId(p);
    return p.vendors.find((v) => v.id === id) ?? p.vendors[0];
  };

  const cartCount = Object.values(qty).reduce((n, x) => n + x, 0);
  const cartTotal = WHOLESALER_PRODUCTS.reduce((s, p) => s + vendorFor(p).price * (qty[p.id] ?? 0), 0);

  const sheetProduct = sheetId ? WHOLESALER_PRODUCTS.find((p) => p.id === sheetId) ?? null : null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]" aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold leading-tight">Product List</h1>
          <p className="text-xs text-foreground-secondary">{products.length} products · multiple vendors</p>
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
        {products.length === 0 ? (
          <EmptyState
            icon={<PackageOpen strokeWidth={1.75} />}
            title="No products here"
            description="No vendors match this selection yet."
          />
        ) : (
          products.map((p) => (
            <VendorProductCard
              key={p.id}
              product={p}
              vendorId={vendorSel[p.id] ?? cheapestVendorId(p)}
              onVendor={(vid) => onSetVendor(p.id, vid)}
              qty={qty[p.id] ?? 0}
              onQty={(n) => onSetQty(p.id, Math.max(0, n))}
              onDiscounts={() => setDiscountsProductId(p.id)}
              onAdd={() => setSheetId(p.id)}
              onImageClick={() => setGalleryId(p.id)}
            />
          ))
        )}
      </div>

      <WholesalerUnitsSheet
        product={sheetProduct}
        vendor={sheetProduct ? vendorFor(sheetProduct) : null}
        qty={sheetId ? (qty[sheetId] ?? 0) : 0}
        onAdd={(pcs) => {
          if (sheetId) onSetQty(sheetId, (qty[sheetId] ?? 0) + pcs);
        }}
        onContinue={() => setSheetId(null)}
        onClose={() => setSheetId(null)}
      />

      <ProductImagesSheet
        product={galleryId ? WHOLESALER_PRODUCTS.find((p) => p.id === galleryId) ?? null : null}
        onClose={() => setGalleryId(null)}
      />

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

      <DiscountsSheet
        open={!!discountsProductId}
        productId={discountsProductId}
        qty={{ ...qty }}
        onClose={() => setDiscountsProductId(null)}
      />

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

function VendorProductCard({
  product,
  vendorId,
  onVendor,
  qty,
  onQty,
  onAdd,
  onImageClick,
  onDiscounts,
}: {
  product: WholesalerProduct;
  vendorId: string;
  onVendor: (id: string) => void;
  qty: number;
  onQty: (n: number) => void;
  onAdd: () => void;
  onImageClick: () => void;
  onDiscounts: () => void;
}) {
  const [variant, setVariant] = useState(product.variants[0].id);
  const cheapest = cheapestVendorId(product);
  const selected = product.vendors.find((v) => v.id === vendorId) ?? product.vendors[0];

  return (
    <Card className="p-3">
      {/* image (left) + info (right); square image sized to the info column's
          height — same layout as the distributor card. Image opens the gallery. */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onImageClick}
          aria-label={`View images of ${product.name}`}
          className="grid h-24 w-24 shrink-0 place-items-center rounded-lg border border-border bg-card text-4xl active:scale-[0.98]"
        >
          {product.image}
        </button>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onAdd}
            aria-label={`Open selling units for ${product.name}`}
            className="block w-full text-left active:scale-[0.99]"
          >
            <div className="text-sm font-semibold leading-snug text-foreground">{product.name}</div>
            <div className="mt-0.5 text-xs text-foreground-secondary">{product.caseLabel}</div>
          </button>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <Chip key={v.id} selected={v.id === variant} onClick={() => setVariant(v.id)} className="px-2.5 py-1">
                {v.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <VendorPicker
        className="mt-3"
        vendors={product.vendors}
        value={vendorId}
        onChange={onVendor}
        cheapestId={cheapest}
      />

      {/* The chosen vendor's terms, read across two rows: when it arrives
          against what it lists at, then the margin against what it costs.
          Splitting MRP off the price label puts each number beside the one it
          qualifies — the distributor card stacks them instead, because it has
          no vendor to choose and the delivery day lives in its footer. */}
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium text-success-foreground">
          {selected.delivery}
        </span>
        {selected.mrp > selected.price && (
          <span className="shrink-0 text-xs text-foreground-secondary">
            MRP <span className="line-through">{formatInr(selected.mrp)}</span>
          </span>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <Badge variant="success">{selected.margin}</Badge>
        <PriceLabel price={selected.price} suffix="/pc" size="lg" />
      </div>

      {/* Discounts + Add, the same even split the distributor card uses —
          wholesale SKUs run schemes too, so the sheet has something to say. */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1">
          <Button variant="soft" className="h-10 w-full font-medium" onClick={onDiscounts}>
            Discounts
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1">
          {qty > 0 ? (
            <QtyStepper value={qty} onChange={onQty} tone="soft" className="w-full" />
          ) : (
            <Button className="h-10 w-full" onClick={onAdd}>
              + Add
            </Button>
          )}
        </div>
      </div>

      {/* total for the selected qty */}
      {qty > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">
            Total ({qty} pcs)
          </span>
          <span className="text-base font-bold tabular-nums text-foreground">{formatInr(selected.price * qty)}</span>
        </div>
      )}
    </Card>
  );
}
