import { useState } from 'react';
import { ImageIcon, X, Plus } from 'lucide-react';

/* Product image viewer — main image + thumbnail rail + price/savings + Add. */
export default function ProductImageSheet({ product, onClose, onAddClick }: { product: any; onClose: () => void; onAddClick?: () => void }) {
  const [idx, setIdx] = useState(0);
  const images: string[] = product.images || [];
  const v0 = product.variants[0];
  const savings = v0.mrp - v0.sellingPrice;

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/50" onClick={onClose} role="presentation">
      <div className="flex max-h-[92%] w-full flex-col rounded-t-xl bg-card text-card-foreground" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border p-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><ImageIcon className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><div className="truncate text-base font-semibold">{product.name}</div><div className="text-xs text-muted-foreground">{product.brand} · {product.variants.length} pack sizes</div></div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid h-56 place-items-center overflow-hidden rounded-xl border border-border" style={{ background: product.bgColor || '#f3f4f6' }}>
            {images[idx] ? <img src={images[idx]} alt={product.name} className="h-full w-full object-contain p-4" onError={(e) => (e.currentTarget.style.display = 'none')} /> : <span className="text-6xl">{product.image}</span>}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {images.map((img, i) => (
                <button key={i} onClick={() => setIdx(i)} className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border-2 ${i === idx ? 'border-primary' : 'border-border'}`}>
                  <img src={img} alt="" className="h-full w-full object-contain p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-end gap-2">
            <span className="text-2xl font-semibold">₹{v0.sellingPrice}</span>
            <span className="text-sm text-muted-foreground line-through">₹{v0.mrp}</span>
            {savings > 0 && <span className="ml-auto rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Save ₹{savings}</span>}
          </div>
        </div>

        <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button onClick={onAddClick} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Add to Cart</button>
        </div>
      </div>
    </div>
  );
}
