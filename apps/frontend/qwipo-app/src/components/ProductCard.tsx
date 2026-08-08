import { ChevronDown, Plus, Truck } from 'lucide-react';

/* Product card — brand/source tags, name, variant pills, margin + price, and
   Discounts / Add actions. Shared by Global Search and the listing screens.
   Parity port of qwipo-buyer-app's GlobalSearch ProductCard. */
export default function ProductCard({
  p,
  source = 'Wholesaler',
  onSelect,
}: {
  p: any;
  source?: 'Distributor' | 'Wholesaler';
  onSelect?: (p: any) => void;
}) {
  const variant = p.variants[0];
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{p.brand}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                source === 'Distributor' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {source}
            </span>
          </div>
          <div className="mt-1.5 text-sm font-medium">{p.name}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">Case: {variant.casePcs} pc</div>
        </div>
        <button
          onClick={() => onSelect?.(p)}
          aria-label={`View ${p.name}`}
          className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted"
        >
          {p.images?.[0] ? (
            <img src={p.images[0]} alt={p.name} className="h-full w-full object-contain p-1" />
          ) : (
            <span className="text-2xl">{p.image}</span>
          )}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {p.variants.map((v: any, i: number) => (
          <button
            key={v.id}
            className={`rounded-full border px-2 py-0.5 text-xs ${
              i === 0 ? 'border-primary text-primary' : 'border-border text-muted-foreground'
            }`}
          >
            {v.size}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
          {variant.margin}% Margin
        </span>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">
            MRP <span className="line-through">₹ {variant.mrp}</span>
          </div>
          <div>
            <span className="text-base font-semibold">₹ {variant.sellingPrice}</span>
            <span className="text-xs text-muted-foreground">/pc</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onSelect?.(p)}
          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary/10 py-2 text-sm font-medium text-primary"
        >
          Discounts <ChevronDown className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSelect?.(p)}
          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Truck className="h-3.5 w-3.5" /> Delivery by Sunday
      </div>
    </div>
  );
}
