import { useState } from 'react';
import { Search, SlidersHorizontal, ChevronLeft, History } from 'lucide-react';
import { EmptyState } from '@mockups/ui';
import { ProductCard } from '@mockups/components';
import {
  REORDER_ITEMS,
  WHOLESALE_REORDER_ITEMS,
  type ReorderItem,
  type WholesaleReorderItem,
} from '../data/reorder';
import { defaultVariantId, skuFor } from '../data/products';
import { cheapestVendorId, minVendorPrice, type WholesalerProduct } from '../data/wholesaler';
import { offerNameSuffix } from '../data/coupons';
import { FiltersSheet } from '../sheets/FiltersSheet';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { WholesalerUnitsSheet } from '../sheets/WholesalerUnitsSheet';
import { VendorProductCard } from '../components/VendorProductCard';
import { deliveryFooter } from '../components/DeliveryFooter';
import { DEFAULT_FILTERS, applyFilters, countActiveFilters, type Filters } from '../data/filters';
import { useEmptyable } from '../review/demoState';
import { CartBar } from '../components/CartBar';

/* Reorder — the Product List pattern applied to purchase history. One list:
   a buyer reordering doesn't think "distributor history" or "wholesale
   history", they think "the thing I bought last week", so the two catalogues
   are interleaved by when they were last bought. The cards still differ,
   because the purchases do — a distributor line is one seller's SKU at one
   price, a wholesale line is the same SKU quoted by several vendors — and
   each card says on its face which it is.
   A root tab screen, so the cart also sits in the bottom nav — but the nav
   shows a count and this shows the money, which is the figure that decides
   whether to keep reordering. */

const brandOf = (name: string) => name.split(' ')[0];

/* The history labels are human ("3 days ago", "1 month ago"); this turns one
   into a rough number of days so both catalogues can be put in one order.
   Rough is enough — nothing here is a date. */
const AGO_DAYS: Record<string, number> = { day: 1, week: 7, month: 30 };
const daysAgo = (label: string): number => {
  const m = /^(\d+)\s+(day|week|month)/.exec(label);
  return m ? Number(m[1]) * AGO_DAYS[m[2]] : Number.MAX_SAFE_INTEGER;
};

/** One line of history, carrying which catalogue it was bought from. */
type Row =
  | { kind: 'distributor'; item: ReorderItem }
  | { kind: 'wholesale'; item: WholesaleReorderItem };

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
  onOpenSheet,
  onOpenGallery,
  onSearch,
  onBack,
  onGoToCart,
  cartCount,
  cartTotal,
  cartFreight,
}: {
  qty: Record<string, number>;
  /** Wholesale lines keep their own quantities — App.tsx owns both maps. */
  wholesaleQty: Record<string, number>;
  onSetWholesaleQty: (id: string, n: number) => void;
  vendorSel: Record<string, string>;
  onSetVendor: (id: string, vendorId: string) => void;
  onOpenSheet: (id: string) => void;
  /** Every picture opens the app's gallery, whichever catalogue it's from. */
  onOpenGallery?: (id: string) => void;
  onSearch?: () => void;
  onBack?: () => void;
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
  const [unitsId, setUnitsId] = useState<string | null>(null);

  /* Filtered apart, shown together: a wholesale line is priced by its
     cheapest vendor, a distributor line by its own SKU, so the price filter
     has to read each the way that catalogue quotes it. */
  const distItems = applyFilters(REORDER_ITEMS, filters, {
    id: (r) => r.product.id,
    brand: (r) => brandOf(r.product.shortName),
    price: (r) => r.product.price,
  });
  const wholeItems = applyFilters(WHOLESALE_REORDER_ITEMS, filters, {
    id: (r) => r.product.id,
    brand: (r) => brandOf(r.product.name),
    price: (r) => minVendorPrice(r.product),
  });

  /* Most recently bought first, and the oftener-bought of two same-week lines
     ahead of the other — the order a buyer works down a reorder list in. */
  const rows = useEmptyable<Row>(
    [
      ...distItems.map((item): Row => ({ kind: 'distributor', item })),
      ...wholeItems.map((item): Row => ({ kind: 'wholesale', item })),
    ].sort(
      (a, b) =>
        daysAgo(a.item.lastOrdered) - daysAgo(b.item.lastOrdered) ||
        b.item.timesOrdered - a.item.timesOrdered
    )
  );

  const brandOptions = [
    ...new Set([
      ...REORDER_ITEMS.map((r) => brandOf(r.product.shortName)),
      ...WHOLESALE_REORDER_ITEMS.map((r) => brandOf(r.product.name)),
    ]),
  ];
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
            <p className="text-xs text-foreground-secondary">{rows.length} items you buy often</p>
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
      </div>

      <div className="no-scrollbar animate-screen flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {rows.length === 0 ? (
          <EmptyState
            icon={<History strokeWidth={1.75} />}
            title="No previous orders"
            description="Items you've ordered before will appear here to reorder in one tap."
          />
        ) : (
          rows.map((row) => {
            const r = row.item;
            return (
              <div key={r.product.id} className="space-y-1.5">
                <HistoryLine lastOrdered={r.lastOrdered} timesOrdered={r.timesOrdered} />
                {row.kind === 'wholesale' ? (
                  <VendorProductCard
                    product={row.item.product}
                    vendorId={vendorSel[r.product.id] ?? cheapestVendorId(row.item.product)}
                    onVendor={(vid) => onSetVendor(r.product.id, vid)}
                    qty={wholesaleQty[r.product.id] ?? 0}
                    onQty={(n) => onSetWholesaleQty(r.product.id, Math.max(0, n))}
                    onDiscounts={() => setDiscountsProductId(r.product.id)}
                    onAdd={() => setUnitsId(r.product.id)}
                    onImageClick={onOpenGallery ? () => onOpenGallery(r.product.id) : undefined}
                  />
                ) : (
                  <DistributorRow
                    item={row.item}
                    selected={variant[r.product.id] ?? defaultVariantId(row.item.product)}
                    onSelectVariant={(id) => setVariant((v) => ({ ...v, [r.product.id]: id }))}
                    qty={qty[r.product.id] ?? 0}
                    onAdd={() => onOpenSheet(r.product.id)}
                    onDiscounts={() => setDiscountsProductId(r.product.id)}
                    onImageClick={onOpenGallery ? () => onOpenGallery(r.product.id) : undefined}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <CartBar count={cartCount} total={cartTotal} freight={cartFreight} onGoToCart={onGoToCart} />

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

/* A distributor line: the same card the Product List shows, down to the
   delivery footer — which is how this row says it came from a distributor
   without a label on it. */
function DistributorRow({
  item,
  selected,
  onSelectVariant,
  qty,
  onAdd,
  onDiscounts,
  onImageClick,
}: {
  item: ReorderItem;
  selected: string;
  onSelectVariant: (id: string) => void;
  qty: number;
  onAdd: () => void;
  onDiscounts: () => void;
  onImageClick?: () => void;
}) {
  const sku = skuFor(item.product, selected);
  return (
    <ProductCard
      name={item.product.name + offerNameSuffix(item.product.id)}
      caseLabel={item.product.caseLabel}
      image={sku.image}
      variants={item.product.variants}
      selectedVariant={selected}
      onSelectVariant={onSelectVariant}
      seller={item.product.seller}
      delivery={item.product.delivery}
      margin={sku.margin}
      price={sku.price}
      mrp={sku.mrp}
      qty={qty}
      onAdd={onAdd}
      onImageClick={onImageClick}
      onDiscounts={onDiscounts}
      footer={deliveryFooter(item.product.seller)}
    />
  );
}
