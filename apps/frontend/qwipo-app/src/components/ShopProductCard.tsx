import type { ReactNode } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';

const stripPack = (s: string) => s.replace(/\s+(Pouch|Jar|Tin|Box|Packet|Bottle|Sachet|Carton|Bag|Tube)s?$/i, '');
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/* Shop product card — name, image, variant pills, margin + price, Discounts /
   Add-or-qty. `middle` and `footer` slots carry the per-screen extras
   (listing = read-only delivery windows; reorder = seller price options).
   Parity port of the qwipo-buyer-app product card. */
export default function ShopProductCard({
  product,
  variant,
  activeVarId,
  onSelectVariant,
  priceOverride,
  qty,
  onAdd,
  onUpdateQty,
  onImage,
  onDiscounts,
  middle,
  footer,
}: {
  product: any;
  variant: any;
  activeVarId: string;
  onSelectVariant: (variantId: string) => void;
  priceOverride?: number;
  qty: number;
  onAdd: () => void;
  onUpdateQty: (qty: number) => void;
  onImage?: () => void;
  onDiscounts?: () => void;
  middle?: ReactNode;
  footer?: ReactNode;
}) {
  const price = priceOverride ?? variant.sellingPrice;
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-snug">
            {product.name} - {titleCase(stripPack(variant.size))} Packet X {variant.casePcs} Nos
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Case: {variant.casePcs} pc</div>
        </div>
        <button
          onClick={onImage}
          aria-label={`View ${product.name}`}
          className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted"
        >
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-contain p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
          ) : (
            <span className="text-2xl">{product.image}</span>
          )}
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {product.variants.map((v: any) => (
          <button
            key={v.id}
            onClick={() => onSelectVariant(v.id)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              v.id === activeVarId ? 'border-primary bg-primary/5 font-semibold text-primary' : 'border-border text-muted-foreground'
            }`}
          >
            {stripPack(v.size)}
          </button>
        ))}
      </div>

      {middle}

      <div className="mt-3 flex items-end justify-between">
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{variant.margin}% Margin</span>
        <div className="text-right leading-tight">
          <div className="text-xs text-muted-foreground">MRP <span className="tabular-nums line-through">₹{variant.mrp}</span></div>
          <div><span className="text-xl font-bold tabular-nums tracking-tight">₹{price}</span><span className="text-xs text-muted-foreground">/pc</span></div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={onDiscounts} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary/10 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15">
          Discounts <ChevronDown className="h-4 w-4" />
        </button>
        {qty > 0 ? (
          <div className="flex flex-1 items-center justify-between rounded-lg bg-primary px-1 text-primary-foreground shadow-sm">
            <button onClick={() => onUpdateQty(qty - 1)} aria-label="Decrease" className="grid h-9 w-9 place-items-center"><Minus className="h-4 w-4" /></button>
            <span className="text-sm font-bold tabular-nums">{qty}</span>
            <button onClick={() => onUpdateQty(qty + 1)} aria-label="Increase" className="grid h-9 w-9 place-items-center"><Plus className="h-4 w-4" /></button>
          </div>
        ) : (
          <button
            onClick={onAdd}
            disabled={variant.stock === 'out'}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        )}
      </div>

      {qty > 0 && (
        <div className="mt-2 text-right text-sm font-semibold">
          ₹{(price * qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      )}

      {footer}
    </div>
  );
}
