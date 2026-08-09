import { useState } from 'react';
import { ChevronLeft, Search, SlidersHorizontal } from 'lucide-react';
import { Button, Card, Chip, QtyStepper, cn } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { WHOLESALER_PRODUCTS, cheapestVendorId, type WholesalerProduct } from '../data/wholesaler';
import { WholesalerUnitsSheet } from '../sheets/WholesalerUnitsSheet';
import { FiltersSheet } from '../sheets/FiltersSheet';
import { DEFAULT_FILTERS, applyFilters, countActiveFilters, type Filters } from '../data/filters';

const minPrice = (p: WholesalerProduct) => Math.min(...p.vendors.map((v) => v.price));
const brandOf = (name: string) => name.split(' ')[0];
const BRAND_OPTIONS = [...new Set(WHOLESALER_PRODUCTS.map((p) => brandOf(p.name)))];

/* Wholesaler Product List — replica of the distributor list, but each product
   is offered by MULTIPLE vendors (price + fee). The buyer selects a vendor per
   line; the cheapest is tagged "Best". Add opens the selling-units sheet. */
export function WholesalerProductsScreen({
  onBack,
  onGoToCart,
  initialSheet = false,
}: {
  onBack: () => void;
  onGoToCart: () => void;
  initialSheet?: boolean;
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [vendorSel, setVendorSel] = useState<Record<string, string>>({});
  const [sheetId, setSheetId] = useState<string | null>(initialSheet ? WHOLESALER_PRODUCTS[0].id : null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const products = applyFilters(WHOLESALER_PRODUCTS, filters, {
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
          <p className="text-xs text-foreground-secondary">{WHOLESALER_PRODUCTS.length} products · multiple vendors</p>
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]" aria-label="Search">
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
        {products.map((p) => (
          <VendorProductCard
            key={p.id}
            product={p}
            vendorId={vendorSel[p.id] ?? cheapestVendorId(p)}
            onVendor={(vid) => setVendorSel((s) => ({ ...s, [p.id]: vid }))}
            qty={qty[p.id] ?? 0}
            onQty={(n) => setQty((s) => ({ ...s, [p.id]: Math.max(0, n) }))}
            onAdd={() => setSheetId(p.id)}
          />
        ))}
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
        <div className="flex items-center gap-3 border-t border-border bg-card px-4 py-3 shadow-[var(--shadow-bar-top)]">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-foreground-secondary">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </div>
            <div className="text-lg font-bold tabular-nums">{formatInr(cartTotal)}</div>
          </div>
          <Button className="flex-1" onClick={onGoToCart}>
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
}: {
  product: WholesalerProduct;
  vendorId: string;
  onVendor: (id: string) => void;
  qty: number;
  onQty: (n: number) => void;
  onAdd: () => void;
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

      {/* vendor selector */}
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">Choose vendor</span>
          <span className="text-xs text-foreground-secondary">{product.vendors.length} options</span>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="radiogroup" aria-label="Vendor">
          {product.vendors.map((vn) => {
            const on = vn.id === vendorId;
            return (
              <button
                key={vn.id}
                role="radio"
                aria-checked={on}
                onClick={() => onVendor(vn.id)}
                className={cn(
                  'relative w-40 shrink-0 rounded-lg border p-2.5 text-left transition-colors',
                  on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'
                )}
              >
                {vn.id === cheapest && (
                  <span
                    className={cn(
                      'absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      on ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-success-subtle text-success-foreground'
                    )}
                  >
                    Best
                  </span>
                )}
                <div className="text-base font-bold tabular-nums">{formatInr(vn.price)}</div>
                <div className="truncate pr-10 text-xs font-medium">{vn.name}</div>
                <div className={cn('text-[11px]', on ? 'text-primary-foreground/80' : 'text-foreground-secondary')}>
                  Fee: {vn.fee}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* add / qty for the selected vendor */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0 text-sm">
          <span className="font-bold tabular-nums text-foreground">{formatInr(selected.price)}</span>
          <span className="truncate text-xs text-foreground-secondary"> · from {selected.name}</span>
        </div>
        {qty > 0 ? (
          <QtyStepper value={qty} onChange={onQty} />
        ) : (
          <Button size="sm" onClick={onAdd}>
            + Add
          </Button>
        )}
      </div>
    </Card>
  );
}
