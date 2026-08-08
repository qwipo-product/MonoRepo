import { useState } from 'react';
import { Ticket, Percent, Truck, Wallet } from 'lucide-react';
import { coupons } from '../data';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';

const ICONS: Record<string, any> = { flat: Ticket, percent: Percent, free: Truck, cashback: Wallet };

/* Apply Coupon — manual code entry + selectable offer list, sticky Apply.
   Offers come from the centralized data source. Parity port. */
export default function CouponsScreen({ onBack, onApply, cartTotal = 4250, appliedId = null }: any) {
  const list = coupons as any[];
  const [code, setCode] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(appliedId);

  const filtered = code.trim() ? list.filter((c) => c.code.toLowerCase().includes(code.trim().toLowerCase())) : list;
  const selected = list.find((c) => c.id === selectedId);
  const canApply = !!selected && cartTotal >= selected.minOrder;

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <StatusBar />
        <ScreenHeader title="Apply Coupon" onBack={onBack} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-2 text-sm font-medium">Have a coupon code?</div>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="h-11 flex-1 rounded-lg border border-border bg-input-background px-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => { const m = list.find((c) => c.code.toUpperCase() === code.trim().toUpperCase()); if (m) setSelectedId(m.id); }}
            className="rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Check
          </button>
        </div>

        <div className="mb-2 mt-5 text-sm font-semibold">Available offers</div>
        <div className="space-y-3">
          {filtered.map((c) => {
            const eligible = cartTotal >= c.minOrder;
            const on = selectedId === c.id;
            const Icon = ICONS[c.type] || Ticket;
            return (
              <button
                key={c.id}
                onClick={() => eligible && setSelectedId(c.id)}
                className={`flex w-full gap-3 rounded-xl border p-3 text-left shadow-sm ${on ? 'border-primary bg-primary/5' : 'border-border bg-card'} ${eligible ? '' : 'opacity-60'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                  {c.tag && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-800">{c.tag}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.sub}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded border border-dashed border-border px-1.5 py-0.5 text-[11px] font-medium">{c.code}</span>
                    <span className="text-[11px] text-muted-foreground">Expires {c.expires}</span>
                  </div>
                  {!eligible && <div className="mt-1 text-[11px] text-amber-700">Add ₹{(c.minOrder - cartTotal).toLocaleString('en-IN')} more to use</div>}
                </div>
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? 'border-primary' : 'border-muted-foreground'}`}>
                  {on && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center justify-between border-t border-border bg-card p-4">
        {selected ? (
          <div>
            <div className="text-sm font-semibold">{selected.code}</div>
            <div className="text-xs text-muted-foreground">
              You save <strong className="text-foreground">{selected.type === 'percent' ? `${selected.value}%` : selected.type === 'free' ? 'Free delivery' : selected.type === 'cashback' ? `${selected.value}% cashback` : `₹${selected.value}`}</strong>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Select a coupon to apply</div>
        )}
        <button onClick={() => canApply && onApply?.(selected)} disabled={!canApply} className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">Apply</button>
      </div>
    </div>
  );
}
