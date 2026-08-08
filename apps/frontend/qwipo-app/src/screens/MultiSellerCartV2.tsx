import { useState } from 'react';
import { Plus } from 'lucide-react';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';
import { VendorMoney, VendorRequirements, computeVendorSummary } from '../components/vendorSummary';

const FALLBACK_WINDOWS = [{ day: 'Fri (Beat day)' }, { day: 'Tomorrow' }];

/* Cart Summary — per-seller card (MOV requirement, thumbnail rail, delivery-by
   radios) + grand total + Checkout. Wholesalers pool into one "Qwipo Sellers"
   block. Parity port. */
export default function MultiSellerCartV2({ cart, onBack, onCheckout, onAddMore, onViewItems }: any) {
  const [deliveryIndex, setDeliveryIndex] = useState<Record<string, number>>({});

  const distributors = cart.sellers.filter((s: any) => (s.type || 'distributor') === 'distributor').map((s: any) => ({ ...s, subtotal: computeVendorSummary(s).subtotal }));
  const wholesalers = cart.sellers.filter((s: any) => s.type === 'wholesaler');
  let wholesalerRow: any = null;
  if (wholesalers.length) {
    const items = wholesalers.flatMap((w: any) => w.items);
    wholesalerRow = { id: 'qwipo-sellers', name: 'Qwipo Sellers', type: 'wholesaler', items, subtotal: items.reduce((n: number, i: any) => n + i.price * i.quantity, 0), deliveryWindows: [{ day: 'Saturday' }] };
  }
  const rows = [...distributors, ...(wholesalerRow ? [wholesalerRow] : [])];
  const grandTotal = rows.reduce((n, r) => n + r.subtotal, 0);

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="Cart Summary" onBack={onBack} />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {rows.length === 0 && (
          <div className="pt-16 text-center">
            <div className="text-4xl">🛒</div>
            <div className="mt-2 text-base font-semibold">Your cart is empty</div>
            <div className="mt-1 text-sm text-muted-foreground">Add products to see them here.</div>
          </div>
        )}
        {rows.map((s: any) => (
          <SellerCard
            key={s.id}
            seller={s}
            activeIndex={deliveryIndex[s.id] || 0}
            onPickDelivery={(idx: number) => setDeliveryIndex((prev) => ({ ...prev, [s.id]: idx }))}
            onAddMore={() => onAddMore?.(s)}
            onViewItems={() => onViewItems?.(s)}
          />
        ))}
      </div>

      {rows.length > 0 && (
        <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-card px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <div>
            <div className="text-xs text-muted-foreground">Total Cart Value</div>
            <div className="text-base font-semibold">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <button onClick={onCheckout} className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">Checkout</button>
        </div>
      )}
    </div>
  );
}

function SellerCard({ seller, activeIndex, onPickDelivery, onAddMore, onViewItems }: any) {
  const isWholesaler = seller.type === 'wholesaler';
  const windows: { day: string }[] = seller.deliveryWindows?.length ? seller.deliveryWindows : FALLBACK_WINDOWS;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Buying from</div>
          <div className="truncate text-sm font-semibold">{seller.name}</div>
          <div className="text-xs text-muted-foreground">Total Items: {seller.items.length}</div>
          <VendorRequirements seller={seller} />
        </div>
        <div className="text-right">
          <div className="text-sm">Total: <strong>₹{Math.round(seller.subtotal).toLocaleString('en-IN')}</strong></div>
          <VendorMoney seller={seller} />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={onAddMore} className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium"><Plus className="h-3.5 w-3.5" /> Add More</button>
        <button onClick={onViewItems} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium">View items</button>
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {seller.items.map((item: any, idx: number) => (
          <div key={`${item.productId}-${idx}`} className="flex w-16 shrink-0 flex-col items-center">
            <div className="grid h-16 w-16 place-items-center rounded-lg text-2xl" style={{ background: item.bgColor || '#f3f4f6' }}>{item.image}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">({item.quantity})</div>
            <div className="text-[11px] font-medium">₹ {item.price * item.quantity}</div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <div className="mb-1.5 text-xs text-muted-foreground">Delivery by</div>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {windows.map((w, i) => {
            const active = isWholesaler ? true : i === activeIndex;
            return (
              <button
                key={w.day}
                role="radio"
                aria-checked={active}
                disabled={isWholesaler}
                onClick={() => !isWholesaler && onPickDelivery?.(i)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${active ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
              >
                <span className={`grid h-3.5 w-3.5 place-items-center rounded-full border ${active ? 'border-primary' : 'border-muted-foreground'}`}>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </span>
                {w.day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
