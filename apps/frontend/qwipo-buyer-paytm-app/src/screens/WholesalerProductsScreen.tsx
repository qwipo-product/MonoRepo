import { useEffect, useState } from 'react';
import { ChevronLeft, Search, SlidersHorizontal, PackageOpen } from 'lucide-react';
import { EmptyState } from '@mockups/ui';
import { WHOLESALER_PRODUCTS, cheapestVendorId, minVendorPrice, type WholesalerProduct } from '../data/wholesaler';
import { WholesalerUnitsSheet } from '../sheets/WholesalerUnitsSheet';
import { ProductImagesSheet } from '../sheets/ProductImagesSheet';
import { VendorProductCard } from '../components/VendorProductCard';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { FiltersSheet } from '../sheets/FiltersSheet';
import { DEFAULT_FILTERS, applyFilters, countActiveFilters, type Filters, type AppliedFilter } from '../data/filters';
import { useEmptyable } from '../review/demoState';
import { CartBar } from '../components/CartBar';

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
   line. Add opens the selling-units sheet. */
export function WholesalerProductsScreen({
  applied: appliedProp = [],
  qty,
  onSetQty,
  vendorSel,
  onSetVendor,
  onBack,
  onSearch,
  onGoToCart,
  cartCount,
  cartTotal,
  cartFreight,
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
  /* The whole cart, both channels — the bar says "total cart value", and a
     wholesale-only subtotal would have made it mean something different here
     than on every other list. */
  cartCount: number;
  cartTotal: number;
  /** Delivery across the whole cart — see CartBar. */
  cartFreight?: number;
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
    price: minVendorPrice,
  }));
  const activeFilters = countActiveFilters(filters);

  /* Same two lines as the distributor list: what was tapped, then what it is.
     No breadcrumb — it only repeated the heading. */
  const heading = applied.length ? applied[applied.length - 1].value : 'Product List';

  /* A wholesale SKU is quoted by several vendors, so a list almost always
     spans more than one — but it is read off the list rather than assumed,
     so a list that happens to carry a single vendor names them. */
  const vendorNames = Array.from(new Set(products.flatMap((p) => p.vendors.map((v) => v.name))));
  const subtitle = `${products.length} products · ${
    vendorNames.length === 1 ? vendorNames[0] : 'multiple vendors'
  }`;

  const vendorFor = (p: WholesalerProduct) => {
    const id = vendorSel[p.id] ?? cheapestVendorId(p);
    return p.vendors.find((v) => v.id === id) ?? p.vendors[0];
  };


  const sheetProduct = sheetId ? WHOLESALER_PRODUCTS.find((p) => p.id === sheetId) ?? null : null;

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

      <CartBar count={cartCount} total={cartTotal} freight={cartFreight} onGoToCart={onGoToCart} />

      <DiscountsSheet
        open={!!discountsProductId}
        productId={discountsProductId}
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
