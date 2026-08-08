import { useState } from 'react';
import { TriangleAlert, ShoppingCart, Package, MapPin, Store, ChevronDown, Plus, X } from 'lucide-react';

/* Pre-checkout alerts — MOV shortfalls + stock/serviceability accordions.
   Parity port of CartValidationSheet. */
export default function CartValidationSheet({ cart, onClose, onProceed, onAddItems }: any) {
  const [open, setOpen] = useState<Record<string, boolean>>({ mov: true });
  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const movSellers = cart.sellers
    .map((s: any) => {
      const subtotal = s.items.reduce((a: number, i: any) => a + i.price * i.quantity, 0);
      return { ...s, subtotal, balance: s.mov - subtotal, meets: s.mov - subtotal <= 0 };
    })
    .filter((s: any) => !s.meets);

  const sections = [
    { key: 'stock', icon: Package, title: 'Stock Adjustments', count: 2 },
    { key: 'unavailable', icon: MapPin, title: 'Unavailable Items', count: 1 },
    { key: 'seller', icon: Store, title: 'Seller unavailable', count: 2 },
    { key: 'location', icon: MapPin, title: 'Location not serviceable', count: 2 },
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/50" onClick={onClose} role="presentation">
      <div className="flex max-h-[85%] w-full flex-col rounded-t-xl bg-card text-card-foreground" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border p-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50 text-amber-700"><TriangleAlert className="h-5 w-5" /></span>
          <div className="flex-1"><div className="text-base font-semibold">Alerts</div><div className="text-xs text-muted-foreground">Please review the following Alerts before proceeding</div></div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          <div className="overflow-hidden rounded-lg border border-border">
            <button onClick={() => toggle('mov')} className="flex w-full items-center gap-2 p-3 text-left">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">MOV Fail ({movSellers.length} {movSellers.length === 1 ? 'Seller' : 'Sellers'})</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open.mov ? 'rotate-180' : ''}`} />
            </button>
            {open.mov && movSellers.length > 0 && (
              <div className="space-y-2 border-t border-border p-3">
                {movSellers.map((s: any) => (
                  <div key={s.id} className="flex items-start justify-between gap-2 rounded-lg bg-gray-50 p-2.5">
                    <div>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">Balance to Order: <span className="font-medium text-foreground">₹{Math.round(s.balance).toLocaleString('en-IN')}</span></div>
                      <div className="text-xs text-muted-foreground">Delivery By: {s.deliveryWindows?.[0]?.day || 'Tomorrow'}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="text-xs text-muted-foreground">MOV: <strong className="text-foreground">₹{s.mov.toLocaleString('en-IN')}</strong></div>
                      <button onClick={() => onAddItems?.(s)} className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium"><Plus className="h-3 w-3" /> Add items</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {sections.map(({ key, icon: Icon, title, count }) => (
            <div key={key} className="overflow-hidden rounded-lg border border-border">
              <button onClick={() => toggle(key)} className="flex w-full items-center gap-2 p-3 text-left">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{title} ({count})</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open[key] ? 'rotate-180' : ''}`} />
              </button>
              {open[key] && <div className="border-t border-border p-3 text-xs text-muted-foreground">Demo data — {count} {title.toLowerCase()} issue{count > 1 ? 's' : ''}.</div>}
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button onClick={onProceed} className="w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground">Proceed Anyway</button>
        </div>
      </div>
    </div>
  );
}
