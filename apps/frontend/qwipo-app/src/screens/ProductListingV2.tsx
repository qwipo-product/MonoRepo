import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { seller } from '../data';
import { useAvailable } from '../data/availability';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';
import ShopProductCard from '../components/ShopProductCard';
import CartStrip from '../components/CartStrip';
import { DEFAULT_FILTERS, countActiveFilters, applyFilters, type Filters } from '../components/FiltersSheet';

const DELIVERY_LABELS = { beat: { day: 'Fri (Beat day)', mov: 500 }, tomorrow: { day: 'Tomorrow', mov: 2500 } } as const;

// Products now carry their owning vendor directly (bms-style ownership).
function sellerForProduct(product: any): string {
  return product.sellerName || (seller as any).name;
}

export default function ProductListingV2({
  category,
  cartItems = {},
  cartTotal = 0,
  filters = DEFAULT_FILTERS,
  onBack,
  onOpenSheet,
  onUpdateQty,
  onGoToCart,
  onOpenSearch,
  onOpenImageSheet,
  onOpenDiscounts,
  onOpenFilters,
}: { filters?: Filters; [k: string]: any }) {
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const activeFilterCount = countActiveFilters(filters);
  const { products: availableProducts } = useAvailable(); // location-serviceable only

  const list = useMemo(() => {
    const byCategory = availableProducts.filter((p: any) => {
      if (!category) return true;
      if (category.isBrand) return p.brand === category.name;
      return p.category === category.id;
    });
    return applyFilters(byCategory, filters);
  }, [category, filters, availableProducts]);

  const getQty = (pid: string, vid: string) => cartItems[`${pid}_${vid}`] || 0;

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card pb-1 shadow-sm">
        <StatusBar />
        <ScreenHeader
          title={category?.name || 'Catalog'}
          subtitle={`${list.length} products`}
          onBack={onBack}
          right={
            <div className="flex gap-1.5">
              <button onClick={onOpenSearch} aria-label="Search" className="grid h-10 w-10 place-items-center rounded-lg bg-muted transition-colors hover:bg-muted/70 active:scale-95">
                <Search className="h-5 w-5" />
              </button>
              <button onClick={onOpenFilters} aria-label="Filters" className="relative grid h-10 w-10 place-items-center rounded-lg bg-muted transition-colors hover:bg-muted/70 active:scale-95">
                <SlidersHorizontal className="h-5 w-5" />
                {activeFilterCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{activeFilterCount}</span>}
              </button>
            </div>
          }
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {list.map((product) => {
          const activeVarId = selectedVariant[product.id] || product.variants[0].id;
          const variant = product.variants.find((v: any) => v.id === activeVarId);
          const qty = getQty(product.id, variant.id);
          const opts: ('beat' | 'tomorrow')[] = product.deliveryOptions?.length ? product.deliveryOptions : ['beat', 'tomorrow'];
          const feeFree = opts.includes('beat');

          return (
            <ShopProductCard
              key={product.id}
              product={product}
              variant={variant}
              activeVarId={activeVarId}
              onSelectVariant={(vid) => setSelectedVariant({ ...selectedVariant, [product.id]: vid })}
              qty={qty}
              onAdd={() => onOpenSheet(product, variant)}
              onUpdateQty={(n) => onUpdateQty(product, variant, n)}
              onImage={() => onOpenImageSheet?.(product)}
              onDiscounts={() => onOpenDiscounts?.(product, variant)}
              middle={
                <>
                  {!category?.fromStorefront && <div className="mt-2 text-xs text-muted-foreground">{sellerForProduct(product)}</div>}
                  <div className="mt-1 text-xs font-medium text-emerald-700">{feeFree ? 'Free Delivery' : '+ ₹24 Delivery'}</div>
                </>
              }
              footer={
                <div className="mt-2 space-y-1 rounded-lg bg-gray-50 p-2">
                  {opts.map((kind) => (
                    <div key={kind} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{DELIVERY_LABELS[kind].day}</span>
                      <span className="text-muted-foreground">MOV: <strong className="text-foreground">₹{DELIVERY_LABELS[kind].mov.toLocaleString('en-IN')}</strong></span>
                    </div>
                  ))}
                </div>
              }
            />
          );
        })}

        {list.length === 0 && (
          <div className="pt-16 text-center">
            <div className="text-4xl">🔍</div>
            <div className="mt-2 text-base font-semibold">No matches</div>
            <div className="mt-1 text-sm text-muted-foreground">Try a different category to see more products.</div>
          </div>
        )}
      </div>

      <CartStrip total={cartTotal} onGoToCart={onGoToCart} />
    </div>
  );
}
