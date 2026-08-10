import { useEffect, useState } from 'react';
import { ChevronLeft, Search, SlidersHorizontal } from 'lucide-react';
import { Badge, Button, Card, Chip, EmptyState, QtyStepper } from '@mockups/ui';
import { PriceLabel, formatInr } from '@mockups/components';
import { WHOLESALER_PRODUCTS, cheapestVendorId, type WholesalerProduct } from '../data/wholesaler';
import { WholesalerUnitsSheet } from '../sheets/WholesalerUnitsSheet';
import { VendorPicker } from '../components/VendorPicker';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { AppliedFilterBar } from '../components/AppliedFilterBar';
import { FiltersSheet } from '../sheets/FiltersSheet';
import { DEFAULT_FILTERS, applyFilters, countActiveFilters, type Filters, type AppliedFilter } from '../data/filters';

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
  onBack,
  onSearch,
  onGoToCart,
  initialSheet = false,
}: {
  applied?: AppliedFilter[];
  onBack: () => void;
  onSearch?: () => void;
  onGoToCart: () => void;
  initialSheet?: boolean;
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [vendorSel, setVendorSel] = useState<Record<string, string>>({});
  const [sheetId, setSheetId] = useState<string | null>(initialSheet ? WHOLESALER_PRODUCTS[0].id : null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [discountsOpen, setDiscountsOpen] = useState(false);
  const [applied, setApplied] = useState<AppliedFilter[]>(appliedProp);
  useEffect(() => setApplied(appliedProp), [appliedProp]);

  const base = applied.length ? WHOLESALER_PRODUCTS.filter((p) => applied.every((a) => matchesApplied(p, a))) : WHOLESALER_PRODUCTS;
  const products = applyFilters(base, filters, {
    id: (p) => p.id,
    brand: (p) => brandOf(p.name),
    price: minPrice,
  });
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
          <EmptyState icon="🔍" title="No products here" description="No vendors match this selection yet." />
        ) : (
          products.map((p) => (
            <VendorProductCard
              key={p.id}
              product={p}
              vendorId={vendorSel[p.id] ?? cheapestVendorId(p)}
              onVendor={(vid) => setVendorSel((s) => ({ ...s, [p.id]: vid }))}
              qty={qty[p.id] ?? 0}
              onQty={(n) => setQty((s) => ({ ...s, [p.id]: Math.max(0, n) }))}
              onAdd={() => setSheetId(p.id)}
              onDiscounts={() => setDiscountsOpen(true)}
            />
          ))
        )}
      </div>

      <WholesalerUnitsSheet
        product={sheetProduct}
        vendor={sheetProduct ? vendorFor(sheetProduct) : null}
        cartTotal={cartTotal}
        onAdd={(pcs) => {
          if (sheetId) setQty((s) => ({ ...s, [sheetId]: (s[sheetId] ?? 0) + pcs }));
        }}
        onContinue={() => {
          setSheetId(null);
          onGoToCart();
        }}
        onClose={() => setSheetId(null)}
      />

      {cartCount > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-bar-top)]">
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-wide text-foreground-secondary">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </div>
            <div className="text-lg font-bold tabular-nums">{formatInr(cartTotal)}</div>
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

function VendorProductCard({
  product,
  vendorId,
  onVendor,
  qty,
  onQty,
  onAdd,
  onDiscounts,
}: {
  product: WholesalerProduct;
  vendorId: string;
  onVendor: (id: string) => void;
  qty: number;
  onQty: (n: number) => void;
  onAdd: () => void;
  onDiscounts: () => void;
}) {
  const [variant, setVariant] = useState(product.variants[0].id);
  const cheapest = cheapestVendorId(product);
  const selected = product.vendors.find((v) => v.id === vendorId) ?? product.vendors[0];

  return (
    <Card className="p-3">
      <div className="flex gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-muted text-2xl">{product.image}</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground">{product.name}</div>
          <div className="text-xs text-foreground-secondary">{product.caseLabel}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
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

      {/* selected vendor: margin + delivery date + price (with discount) */}
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Badge variant="success">{selected.margin}</Badge>
          <div className="text-sm text-success-foreground">{selected.delivery}</div>
        </div>
        <PriceLabel price={selected.price} mrp={selected.mrp} suffix="/pc" size="lg" />
      </div>

      {/* actions */}
      <div className="mt-3 flex items-center gap-2">
        <Button variant="soft" className="flex-1" onClick={onDiscounts}>
          Discounts ⌄
        </Button>
        {qty > 0 ? (
          <QtyStepper value={qty} onChange={onQty} tone="soft" className="ml-auto" />
        ) : (
          <Button className="flex-1" onClick={onAdd}>
            + Add
          </Button>
        )}
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
