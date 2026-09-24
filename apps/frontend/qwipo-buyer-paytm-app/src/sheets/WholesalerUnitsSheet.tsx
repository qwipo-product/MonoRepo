import { useState } from 'react';
import { Store } from 'lucide-react';
import { Button, Chip, QtyStepper, Sheet } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { packTiers } from '../data/products';
import { cheapestVendorId, type WholesalerProduct, type WholesalerVendor } from '../data/wholesaler';
import { PackTierRow } from './PackTierRow';
import { VendorPicker } from '../components/VendorPicker';

/* Wholesaler selling-units sheet — the distributor Add-to-Cart sheet adapted for
   the multi-vendor model: the header shows the chosen vendor + fee, and the pack
   tiers price against that vendor. */
export function WholesalerUnitsSheet({
  product,
  vendor,
  cartTotal,
  qty,
  onAdd,
  onSetQty,
  onContinue,
  onClose,
}: {
  product: WholesalerProduct | null;
  vendor: WholesalerVendor | null;
  cartTotal: number;
  /** Pieces of this product already in the cart — the sheet opens showing it. */
  qty: number;
  onAdd: (pcs: number) => void;
  /** Set the absolute quantity, so the sheet can take a line back to zero. */
  onSetQty: (pcs: number) => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  const [variant, setVariant] = useState('');
  const [vendorId, setVendorId] = useState(vendor?.id ?? '');
  if (!product || !vendor) return <Sheet open={false} onClose={onClose} />;

  const tiers = packTiers(product.caseSize);
  const activeVariant = variant || product.variants[0].id;
  const sel = product.vendors.find((v) => v.id === vendorId) ?? vendor;

  return (
    <Sheet
      open
      onClose={onClose}
      icon={<Store size={18} />}
      title="Add to Cart"
      subtitle="Select the quantity to add to your cart"
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

      {/* vendor picker — same design as the product page's Choose vendor */}
      <VendorPicker
        className="mt-4"
        vendors={product.vendors}
        value={sel.id}
        onChange={setVendorId}
        cheapestId={cheapestVendorId(product)}
      />

      {/* pack tiers */}
      {/* What's already in the cart for this product — and the one control
          that can take it back out. Matches the distributor sheet. */}
      {qty > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-primary bg-primary-soft p-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-primary-soft-foreground">In your cart</div>
            <div className="text-sm font-semibold tabular-nums text-foreground">
              {qty} {qty === 1 ? 'pc' : 'pcs'} · {formatInr(sel.price * qty)}
            </div>
          </div>
          <QtyStepper value={qty} onChange={onSetQty} min={0} tone="soft" className="shrink-0 bg-card" />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2.5">
        {tiers.map((t) => (
          <PackTierRow key={t.id} label={t.label} pcs={t.pcs} unitPrice={sel.price} onDelta={onAdd} />
        ))}
      </div>
    </Sheet>
  );
}
