import { Plus, X } from 'lucide-react';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';
import { VendorMoney, VendorRequirements } from '../components/vendorSummary';

/* View Items — per-seller item list with remove + edit (tap opens the sheet).
   Parity port. `onUpdateItem(item, qty)` maps back to the flat cart. */
export default function ViewItemsScreen({ seller, onBack, onAddMore, onUpdateItem, onItemTap }: any) {
  if (!seller) return null;
  const total = seller.items.reduce((n: number, i: any) => n + i.price * i.quantity, 0);

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="View Items" onBack={onBack} />
      </div>

      <div className="flex items-start justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Buying from</div>
          <div className="truncate text-sm font-semibold">{seller.name}</div>
          <div className="text-xs text-muted-foreground">Total Items: {seller.items.length}</div>
          <VendorRequirements seller={seller} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="text-sm">Total: <strong>₹{Math.round(total).toLocaleString('en-IN')}</strong></div>
          <VendorMoney seller={seller} />
          <button onClick={onAddMore} className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium"><Plus className="h-3.5 w-3.5" /> Add More</button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {seller.items.map((item: any, idx: number) => (
          <div key={item.productId + idx} className="relative flex gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
            <button onClick={() => onUpdateItem?.(item, 0)} aria-label={`Remove ${item.name}`} className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-muted text-muted-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onItemTap?.(item)} className="grid h-16 w-16 shrink-0 place-items-center rounded-lg text-2xl" style={{ background: item.bgColor || '#f3f4f6' }} aria-label={`Edit ${item.name}`}>{item.image}</button>
            <div className="min-w-0 flex-1">
              <button onClick={() => onItemTap?.(item)} className="block text-left text-sm font-medium">{item.name}</button>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground line-through">MRP ₹{item.mrp.toFixed(2)}</span>
                <span className="font-semibold">₹{item.price.toFixed(2)}</span>
              </div>
              <button onClick={() => onItemTap?.(item)} className="mt-1 inline-block rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{item.quantity}</button>
            </div>
          </div>
        ))}

        {seller.items.length === 0 && (
          <div className="pt-16 text-center">
            <div className="text-4xl">🛒</div>
            <div className="mt-2 text-base font-semibold">No items left</div>
            <div className="mt-1 text-sm text-muted-foreground">Everything from this seller has been removed.</div>
          </div>
        )}
      </div>
    </div>
  );
}
