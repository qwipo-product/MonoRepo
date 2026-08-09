import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button, Chip, Sheet } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { packTiers, type Product } from '../data/products';

// Distributor selling-units sheet (screen 14). Content mirrors the source:
// product header + variant pills · MRP/SP/Margin bar · one row per pack tier
// with a per-unit price, line total, and its own Add · Total-cart-value footer.
export function AddToCartSheet({
  product,
  cartTotal,
  onAdd,
  onContinue,
  onClose,
}: {
  product: Product | null;
  cartTotal: number;
  onAdd: (pcs: number) => void;
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
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">
              Total cart value
            </div>
            <div className="text-lg font-bold tabular-nums text-foreground">{formatInr(cartTotal)}</div>
          </div>
          <Button className="flex-1" onClick={onContinue}>
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

      {/* pack tiers */}
      <div className="mt-4 flex flex-col gap-2.5">
        {tiers.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-base">📦</div>
            <div>
              <div className="text-sm font-semibold text-foreground">{t.label}</div>
              <div className="text-xs text-foreground-secondary">
                {t.pcs} {t.pcs === 1 ? 'Pc' : 'Pcs'}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[11px] tabular-nums text-foreground-secondary">{formatInr(product.price)}</div>
              <div className="text-sm font-bold tabular-nums text-foreground">
                {formatInr(product.price * t.pcs)}
              </div>
            </div>
            <Button size="sm" onClick={() => onAdd(t.pcs)}>
              + Add
            </Button>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
