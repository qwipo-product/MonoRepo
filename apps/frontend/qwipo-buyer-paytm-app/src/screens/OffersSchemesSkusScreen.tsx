import { useState } from 'react';
import { ChevronLeft, BadgePercent } from 'lucide-react';
import { EmptyState, Button } from '@mockups/ui';
import { ProductCard, formatInr } from '@mockups/components';
import { PRODUCTS } from '../data/products';
import { offerNameSuffix, offerLabelsFor } from '../data/coupons';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { deliveryFooter } from '../components/DeliveryFooter';

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
  onSetQty,
  onOpenSheet,
  onGoToCart,
  cartCount,
  cartTotal,
}: {
  onBack: () => void;
  qty: Record<string, number>;
  onSetQty: (id: string, n: number) => void;
  onOpenSheet: (id: string) => void;
  onGoToCart: () => void;
  cartCount: number;
  cartTotal: number;
}) {
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
          items.map((p) => (
            <ProductCard
              key={p.id}
              name={p.name + offerNameSuffix(p.id)}
              caseLabel={p.caseLabel}
              image={p.image}
              variants={p.variants}
              selectedVariant={variant[p.id] ?? p.variants[0].id}
              onSelectVariant={(id) => setVariant((v) => ({ ...v, [p.id]: id }))}
              seller={p.seller}
              source={p.source}
              margin={p.margin}
              price={p.price}
              mrp={p.mrp}
              qty={qty[p.id] ?? 0}
              onQty={(n) => onSetQty(p.id, n)}
              onAdd={() => onOpenSheet(p.id)}
              onDiscounts={() => setDiscountsProductId(p.id)}
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

      <DiscountsSheet
        open={!!discountsProductId}
        productId={discountsProductId}
        qty={qty}
        onClose={() => setDiscountsProductId(null)}
      />
    </div>
  );
}
