import { useState } from 'react';
import { Store } from 'lucide-react';
import { Button, Chip, Sheet } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { packTiers } from '../data/products';
import type { WholesalerProduct, WholesalerVendor } from '../data/wholesaler';

/* Wholesaler selling-units sheet — the distributor Add-to-Cart sheet adapted for
   the multi-vendor model: the header shows the chosen vendor + fee, and the pack
   tiers price against that vendor. */
export function WholesalerUnitsSheet({
  product,
  vendor,
  cartTotal,
  onAdd,
  onContinue,
  onClose,
}: {
  product: WholesalerProduct | null;
  vendor: WholesalerVendor | null;
  cartTotal: number;
  onAdd: (pcs: number) => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  const [variant, setVariant] = useState('');
  if (!product || !vendor) return <Sheet open={false} onClose={onClose} />;

  const tiers = packTiers(product.caseSize);
  const activeVariant = variant || product.variants[0].id;

  return (
    <Sheet
      open
      onClose={onClose}
      icon={<Store size={18} />}
      title="Add to Cart"
      subtitle="Select the quantity to add to your cart"
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
          <div className="text-sm font-semibold text-foreground">{product.name}</div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <Chip key={v.id} selected={v.id === activeVariant} onClick={() => setVariant(v.id)} className="px-2.5 py-1">
                {v.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {/* vendor bar */}
      <div className="mt-4 flex items-center gap-3 rounded-lg bg-muted p-3">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">Vendor</div>
          <div className="truncate text-sm font-semibold text-foreground">{vendor.name}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] font-medium uppercase tracking-wide text-foreground-secondary">Price · Fee</div>
          <div className="text-sm font-semibold tabular-nums text-foreground">
            {formatInr(vendor.price)} · {vendor.fee}
          </div>
        </div>
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
              <div className="text-[11px] tabular-nums text-foreground-secondary">{formatInr(vendor.price)}</div>
              <div className="text-sm font-bold tabular-nums text-foreground">{formatInr(vendor.price * t.pcs)}</div>
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
