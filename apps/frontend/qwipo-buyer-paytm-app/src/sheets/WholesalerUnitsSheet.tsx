import { useState } from 'react';
import { Store } from 'lucide-react';
import { Button, Chip, Sheet } from '@mockups/ui';
import { ProductImage, formatInr } from '@mockups/components';
import { packTiers, splitIntoPacks } from '../data/products';
import type { WholesalerProduct, WholesalerVendor } from '../data/wholesaler';
import { PackTierRow } from './PackTierRow';
import { VendorPicker } from '../components/VendorPicker';

/* Wholesaler selling-units sheet — the distributor Add-to-Cart sheet adapted for
   the multi-vendor model: the header shows the chosen vendor + fee, and the pack
   tiers price against that vendor. */
export function WholesalerUnitsSheet({
  product,
  vendor,
  qty,
  onAdd,
  onContinue,
  onClose,
}: {
  product: WholesalerProduct | null;
  vendor: WholesalerVendor | null;
  /** Pieces of THIS product in the cart — the footer totals the line at the
   * chosen vendor's price, not the whole cart. */
  qty: number;
  onAdd: (pcs: number) => void;
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
              Total value
            </div>
            <div className="text-lg font-bold tabular-nums text-foreground">{formatInr(sel.price * qty)}</div>
          </div>
          <Button className="px-8" onClick={onContinue}>
            Continue
          </Button>
        </div>
      }
    >
      {/* product header */}
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-card text-3xl">
          <ProductImage image={product.image} alt={product.name} />
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
      />

      {/* pack tiers */}
      <div className="mt-4 flex flex-col gap-2.5">
        {tiers.map((t) => (
          <PackTierRow
            key={t.id}
            label={t.label}
            pcs={t.pcs}
            unitPrice={sel.price}
            initialPacks={splitIntoPacks(qty, tiers)[t.id] ?? 0}
            onDelta={onAdd}
          />
        ))}
      </div>
    </Sheet>
  );
}
