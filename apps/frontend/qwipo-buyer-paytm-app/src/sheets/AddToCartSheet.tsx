import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button, Chip, QtyStepper, Sheet } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { packTiers, type Product } from '../data/products';
import { PackTierRow } from './PackTierRow';

// Distributor selling-units sheet (screen 14). Content mirrors the source:
// product header + variant pills · MRP/SP/Margin bar · one row per pack tier
// with a per-unit price, line total, and its own Add · Total-cart-value footer.
export function AddToCartSheet({
  product,
  cartTotal,
  qty,
  onAdd,
  onSetQty,
  onContinue,
  onClose,
}: {
  product: Product | null;
  cartTotal: number;
  /** Pieces of this product already in the cart — the sheet opens showing it. */
  qty: number;
  onAdd: (pcs: number) => void;
  /** Set the absolute quantity, so the sheet can take a line back to zero. */
  onSetQty: (pcs: number) => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  const [variant, setVariant] = useState<string>('');
  if (!product) {
    return <Sheet open={false} onClose={onClose} />;
  }
  const tiers = packTiers(product.caseSize);
  const activeVariant = variant || product.variants[0].id;

  return (
    <Sheet
      open={!!product}
      onClose={onClose}
      icon={<ShoppingCart size={18} />}
      title="Add to Cart"
      subtitle="Please select the quantity to add to your cart"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <div className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">
              Total cart value
            </div>
            <div className="text-lg font-bold tabular-nums text-foreground">{formatInr(cartTotal)}</div>
          </div>
          <Button className="px-8" onClick={onContinue}>
            Continue
          </Button>
        </div>
      }
    >
      {/* product header */}
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-card text-2xl ring-2 ring-warning/70">
          {product.image}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{product.shortName}</div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <Chip
                key={v.id}
                selected={v.id === activeVariant}
                onClick={() => setVariant(v.id)}
                className="px-2.5 py-1"
              >
                {v.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* MRP / SP / Margin bar */}
      <div className="mt-4 flex items-center gap-5 rounded-lg bg-muted p-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">MRP</div>
          <div className="text-sm font-medium tabular-nums text-foreground-secondary line-through">
            {formatInr(product.mrp)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">SP</div>
          <div className="text-sm font-semibold tabular-nums text-foreground">{formatInr(product.price)}</div>
        </div>
        <div className="ml-auto text-sm font-semibold text-success-foreground">{product.margin}</div>
      </div>

      {/* What's already in the cart for this product, and the one control that
          can take it back out. The tier rows below add packs, and each keeps
          its own count for this visit — they can't show a running total,
          because 13 pcs isn't any whole number of 8s or 16s. This row is the
          truth, and it's the same quantity the product card steps. */}
      {qty > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-primary bg-primary-soft p-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-primary-soft-foreground">In your cart</div>
            <div className="text-sm font-semibold tabular-nums text-foreground">
              {qty} {qty === 1 ? 'pc' : 'pcs'} · {formatInr(product.price * qty)}
            </div>
          </div>
          <QtyStepper value={qty} onChange={onSetQty} min={0} tone="soft" className="shrink-0 bg-card" />
        </div>
      )}

      {/* pack tiers */}
      <div className="mt-4 flex flex-col gap-2.5">
        {tiers.map((t) => (
          <PackTierRow key={t.id} label={t.label} pcs={t.pcs} unitPrice={product.price} onDelta={onAdd} />
        ))}
      </div>
    </Sheet>
  );
}
