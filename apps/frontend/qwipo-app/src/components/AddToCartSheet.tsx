import { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, Package } from 'lucide-react';

const stripPack = (s: string) => s.replace(/\s+(Pouch|Jar|Tin|Box|Packet|Bottle|Sachet|Carton|Bag|Tube|Pack)s?$/i, '');

/* Add-to-Cart / Selling-Units sheet — pick pack tiers (piece / set / case),
   optional seller options (wholesaler), review the running total, Continue.
   Parity port of qwipo-buyer-app's AddToCartSheet. Confirms with total pieces. */
export default function AddToCartSheet({
  product,
  initialVariant,
  sellerOptions,
  hidePrice,
  onClose,
  onConfirm,
}: {
  product: any;
  initialVariant?: any;
  sellerOptions?: { id: string; name: string; price: number }[] | null;
  hidePrice?: boolean;
  onClose: () => void;
  onConfirm: (product: any, variant: any, totalPcs: number) => void;
}) {
  const [variantId, setVariantId] = useState(initialVariant?.id || product.variants[0].id);
  const [packs, setPacks] = useState<Record<string, number>>({ pc: 0, set: 0, case: 0 });
  const [sellerId, setSellerId] = useState(sellerOptions?.[0]?.id);
  const variant = product.variants.find((v: any) => v.id === variantId);

  const setPcs = Math.floor(variant.casePcs / 2) || 1;
  const tiers = [
    { key: 'pc', n: 1 },
    ...(setPcs > 1 && setPcs < variant.casePcs ? [{ key: 'set', n: setPcs }] : []),
    ...(variant.casePcs > 1 ? [{ key: 'case', n: variant.casePcs }] : []),
  ];
  const totalPcs = tiers.reduce((s, t) => s + packs[t.key] * t.n, 0);
  const totalValue = totalPcs * variant.sellingPrice;
  const bump = (key: string, d: number) => setPacks((p) => ({ ...p, [key]: Math.max(0, (p[key] || 0) + d) }));

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/50" onClick={onClose} role="presentation">
      <div className="flex max-h-[92%] w-full flex-col rounded-t-xl bg-card text-card-foreground" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border p-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><ShoppingCart className="h-5 w-5" /></span>
          <div className="flex-1">
            <div className="text-base font-semibold">Add to Cart</div>
            <div className="text-xs text-muted-foreground">Please select the quantity to add to your cart</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg" style={{ background: product.bgColor || '#f3f4f6' }}>
              {product.images?.[0] ? <img src={product.images[0]} alt="" className="h-full w-full object-contain p-1" /> : <span className="text-2xl">{product.image}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{product.name}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.variants.map((v: any) => (
                  <button key={v.id} onClick={() => setVariantId(v.id)} className={`rounded-full border px-2 py-0.5 text-xs ${v.id === variantId ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>
                    {stripPack(v.size)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!hidePrice && (
            <div className="mt-4 flex items-center gap-4 rounded-lg bg-gray-50 p-3">
              <div><div className="text-[11px] text-muted-foreground">MRP</div><div className="text-sm line-through">₹{variant.mrp}</div></div>
              <div><div className="text-[11px] text-muted-foreground">SP</div><div className="text-sm font-semibold">₹{variant.sellingPrice}</div></div>
              <span className="ml-auto rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{variant.margin}% Margin</span>
            </div>
          )}

          {!hidePrice && sellerOptions && sellerOptions.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {sellerOptions.map((s) => (
                <button key={s.id} onClick={() => setSellerId(s.id)} className={`rounded-lg border p-2 text-left ${s.id === sellerId ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="text-sm font-semibold">₹{s.price.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-muted-foreground">{s.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground"><Package className="h-3 w-3" /> Fee: ₹{s.id === sellerId ? 2 : 1}/kg</div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {tiers.map((t) => {
              const qty = packs[t.key] || 0;
              return (
                <div key={t.key} className={`flex items-center gap-3 rounded-lg border p-3 ${qty > 0 ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <span className="text-2xl">📦</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">1 X {t.n}</div>
                    <div className="text-xs text-muted-foreground">{t.n} Pc{t.n > 1 ? 's' : ''}</div>
                  </div>
                  {!hidePrice && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">₹{variant.sellingPrice.toLocaleString('en-IN')}</div>
                      <div className="text-sm font-semibold">₹{(variant.sellingPrice * t.n).toLocaleString('en-IN')}</div>
                    </div>
                  )}
                  {qty > 0 ? (
                    <div className="flex items-center gap-2 rounded-md bg-primary px-1 text-primary-foreground">
                      <button onClick={() => bump(t.key, -1)} aria-label="Decrease" className="grid h-7 w-7 place-items-center"><Minus className="h-4 w-4" /></button>
                      <span className="text-sm font-semibold">{qty}</span>
                      <button onClick={() => bump(t.key, 1)} aria-label="Increase" className="grid h-7 w-7 place-items-center"><Plus className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => bump(t.key, 1)} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Add</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div>
            <div className="text-xs text-muted-foreground">Total Cart Value:</div>
            <div className="text-base font-semibold">₹{totalValue.toLocaleString('en-IN')}</div>
          </div>
          <button
            onClick={() => (totalPcs === 0 ? onClose() : onConfirm(product, variant, totalPcs))}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {totalPcs === 0 ? 'Close' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
