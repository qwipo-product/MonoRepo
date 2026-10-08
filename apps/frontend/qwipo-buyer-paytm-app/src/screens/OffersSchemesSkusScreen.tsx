import { useState } from 'react';
import { ChevronLeft, BadgePercent } from 'lucide-react';
import { EmptyState } from '@mockups/ui';
import { ProductCard } from '@mockups/components';
import { PRODUCTS, defaultVariantId, skuFor } from '../data/products';
import { offerNameSuffix, offerLabelsFor } from '../data/coupons';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { deliveryFooter } from '../components/DeliveryFooter';
import { useSellerOffline } from '../components/SellerOffline';
import { CartBar } from '../components/CartBar';

/* Offers & Schemes SKU list — a shortcut one tap off Product List, for anyone
   (a demo, the product team walking a colleague through it) who needs to find
   "which SKU has which offer" fast, instead of scanning or filtering the full
   catalog. Every card here carries a live offer, and its name is tagged with
   which one(s) — BOGO / FREEBIE / CASE BONUS / SLAB / COMBO — the same way
   every other product list shows it now (see offerNameSuffix). The list
   itself is derived from OFFERS at render time — add a scheme to a new SKU in
   data/coupons.ts and it shows up here automatically, nothing to update by
   hand in this file. */
export function OffersSchemesSkusScreen({
  onBack,
  qty,
  onOpenSheet,
  onOpenGallery,
  onGoToCart,
  cartCount,
  cartTotal,
  cartFreight,
}: {
  onBack: () => void;
  qty: Record<string, number>;
  onOpenSheet: (id: string) => void;
  onOpenGallery?: (id: string) => void;
  onGoToCart: () => void;
  cartCount: number;
  cartTotal: number;
  /** Delivery across the whole cart — see CartBar. */
  cartFreight?: number;
}) {
  const { isOffline, notify } = useSellerOffline();
  const [variant, setVariant] = useState<Record<string, string>>({});
  const [discountsProductId, setDiscountsProductId] = useState<string | null>(null);

  const items = PRODUCTS.filter((p) => p.source === 'distributor' && offerLabelsFor(p.id).length > 0);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]" aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold leading-tight">Offers &amp; Schemes</h1>
          <p className="text-xs text-foreground-secondary">{items.length} products with a live offer</p>
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
        {items.length === 0 ? (
          <EmptyState
            icon={<BadgePercent strokeWidth={1.75} />}
            title="No offers running right now"
            description="Check back once a seller has a scheme live."
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
              offline={isOffline(p.seller)}
              onOfflineTap={() => notify(p.seller)}
            />
            );
          })
        )}
      </div>

      <CartBar count={cartCount} total={cartTotal} freight={cartFreight} onGoToCart={onGoToCart} />

      <DiscountsSheet
        open={!!discountsProductId}
        productId={discountsProductId}
        qty={qty}
        onClose={() => setDiscountsProductId(null)}
      />
    </div>
  );
}
