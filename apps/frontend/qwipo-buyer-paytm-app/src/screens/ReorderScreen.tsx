import { useState } from 'react';
import { Search, SlidersHorizontal, ChevronLeft, History } from 'lucide-react';
import { EmptyState, SegmentedControl } from '@mockups/ui';
import { ProductCard } from '@mockups/components';
import { REORDER_ITEMS, WHOLESALE_REORDER_ITEMS } from '../data/reorder';
import { defaultVariantId, skuFor, type Source } from '../data/products';
import { cheapestVendorId, minVendorPrice, type WholesalerProduct } from '../data/wholesaler';
import { offerNameSuffix } from '../data/coupons';
import { FiltersSheet } from '../sheets/FiltersSheet';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { WholesalerUnitsSheet } from '../sheets/WholesalerUnitsSheet';
import { VendorProductCard } from '../components/VendorProductCard';
import { deliveryFooter } from '../components/DeliveryFooter';
import { DEFAULT_FILTERS, applyFilters, countActiveFilters, type Filters } from '../data/filters';
import { useEmptyable } from '../review/demoState';

/* Reorder — the Product List pattern applied to purchase history, in two tabs.
   Distributor and wholesale history are not one list: the two are bought,
   priced and delivered separately, and a wholesale SKU is quoted by several
   vendors, so each tab shows the card its own list shows — the distributor
   card on one side, the vendor card on the other.
   Root tab screen, so cart lives in the bottom nav — no in-screen cart strip. */

const brandOf = (name: string) => name.split(' ')[0];

const TABS = [
  { value: 'distributor' as const, label: 'Distributors' },
  { value: 'wholesaler' as const, label: 'Wholesalers' },
];

/** When it was last bought and how often — the line above every card here. */
function HistoryLine({ lastOrdered, timesOrdered }: { lastOrdered: string; timesOrdered: number }) {
  return (
    <div className="flex items-center justify-between px-1 text-xs text-foreground-secondary">
      <span>Last ordered {lastOrdered}</span>
      <span>{timesOrdered}× before</span>
    </div>
  );
}

export function ReorderScreen({
  qty,
  wholesaleQty,
  onSetWholesaleQty,
  vendorSel,
  onSetVendor,
  initialTab,
  onOpenSheet,
  onOpenGallery,
  onSearch,
  onBack,
}: {
  qty: Record<string, number>;
  /** Wholesale lines keep their own quantities — App.tsx owns both maps. */
  wholesaleQty: Record<string, number>;
  onSetWholesaleQty: (id: string, n: number) => void;
  vendorSel: Record<string, string>;
  onSetVendor: (id: string, vendorId: string) => void;
  /** Which tab to open on — set when a Home rail's See all lands here. */
  initialTab?: Source;
  onOpenSheet: (id: string) => void;
  /** Both tabs' pictures open the app's gallery, whichever catalogue they're from. */
  onOpenGallery?: (id: string) => void;
  onSearch?: () => void;
  onBack?: () => void;
}) {
  const [tab, setTab] = useState<Source>(initialTab ?? 'distributor');
  const [variant, setVariant] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [discountsProductId, setDiscountsProductId] = useState<string | null>(null);
  const [unitsId, setUnitsId] = useState<string | null>(null);

  /* Filters are per tab — the two catalogues barely share a brand, so a brand
     picked on one side would silently empty the other. */
  const selectTab = (t: Source) => {
    setTab(t);
    setFilters(DEFAULT_FILTERS);
  };

  const distItems = useEmptyable(applyFilters(REORDER_ITEMS, filters, {
    id: (r) => r.product.id,
    brand: (r) => brandOf(r.product.shortName),
    price: (r) => r.product.price,
  }));
  const wholeItems = useEmptyable(applyFilters(WHOLESALE_REORDER_ITEMS, filters, {
    id: (r) => r.product.id,
    brand: (r) => brandOf(r.product.name),
    price: (r) => minVendorPrice(r.product),
  }));

  const wholesale = tab === 'wholesaler';
  const count = wholesale ? wholeItems.length : distItems.length;
  const brandOptions = wholesale
    ? [...new Set(WHOLESALE_REORDER_ITEMS.map((r) => brandOf(r.product.name)))]
    : [...new Set(REORDER_ITEMS.map((r) => brandOf(r.product.shortName)))];
  const activeFilters = countActiveFilters(filters);

  const unitsProduct = unitsId
    ? WHOLESALE_REORDER_ITEMS.find((r) => r.product.id === unitsId)?.product ?? null
    : null;
  const vendorFor = (p: WholesalerProduct) => {
    const id = vendorSel[p.id] ?? cheapestVendorId(p);
    return p.vendors.find((v) => v.id === id) ?? p.vendors[0];
  };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border bg-card shadow-sm">
        <header className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold leading-tight">Reorder</h1>
            <p className="text-xs text-foreground-secondary">{count} items you buy often</p>
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

        <div className="px-4 pb-3">
          <SegmentedControl<Source> options={TABS} value={tab} onChange={selectTab} />
        </div>
      </div>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {count === 0 ? (
          <EmptyState
            icon={<History strokeWidth={1.75} />}
            title="No previous orders"
            description="Items you've ordered before will appear here to reorder in one tap."
          />
        ) : wholesale ? (
          wholeItems.map((r) => (
            <div key={r.product.id} className="space-y-1.5">
              <HistoryLine lastOrdered={r.lastOrdered} timesOrdered={r.timesOrdered} />
              <VendorProductCard
                product={r.product}
                vendorId={vendorSel[r.product.id] ?? cheapestVendorId(r.product)}
                onVendor={(vid) => onSetVendor(r.product.id, vid)}
                qty={wholesaleQty[r.product.id] ?? 0}
                onQty={(n) => onSetWholesaleQty(r.product.id, Math.max(0, n))}
                onDiscounts={() => setDiscountsProductId(r.product.id)}
                onAdd={() => setUnitsId(r.product.id)}
                onImageClick={onOpenGallery ? () => onOpenGallery(r.product.id) : undefined}
              />
            </div>
          ))
        ) : (
          distItems.map((r) => {
            const selected = variant[r.product.id] ?? defaultVariantId(r.product);
            const sku = skuFor(r.product, selected);
            return (
            <div key={r.product.id} className="space-y-1.5">
              <HistoryLine lastOrdered={r.lastOrdered} timesOrdered={r.timesOrdered} />
              <ProductCard
                name={r.product.name + offerNameSuffix(r.product.id)}
                caseLabel={r.product.caseLabel}
                image={sku.image}
                variants={r.product.variants}
                selectedVariant={selected}
                onSelectVariant={(id) => setVariant((v) => ({ ...v, [r.product.id]: id }))}
                seller={r.product.seller}
                delivery={r.product.delivery}
                margin={sku.margin}
                price={sku.price}
                mrp={sku.mrp}
                qty={qty[r.product.id] ?? 0}
                onAdd={() => onOpenSheet(r.product.id)}
                onImageClick={onOpenGallery ? () => onOpenGallery(r.product.id) : undefined}
                onDiscounts={() => setDiscountsProductId(r.product.id)}
                footer={deliveryFooter(r.product.seller)}
              />
            </div>
            );
          })
        )}
      </div>

      <FiltersSheet
        open={filterOpen}
        value={filters}
        brands={brandOptions}
        onApply={setFilters}
        onClose={() => setFilterOpen(false)}
      />

      <WholesalerUnitsSheet
        product={unitsProduct}
        vendor={unitsProduct ? vendorFor(unitsProduct) : null}
        qty={unitsId ? (wholesaleQty[unitsId] ?? 0) : 0}
        onAdd={(pcs) => {
          if (unitsId) onSetWholesaleQty(unitsId, (wholesaleQty[unitsId] ?? 0) + pcs);
        }}
        onContinue={() => setUnitsId(null)}
        onClose={() => setUnitsId(null)}
      />

      {/* Both maps: a scheme can be worded against either catalogue, and the
          ids never collide (p… vs wp…). */}
      <DiscountsSheet
        open={!!discountsProductId}
        productId={discountsProductId}
        qty={{ ...qty, ...wholesaleQty }}
        onClose={() => setDiscountsProductId(null)}
      />
    </div>
  );
}
