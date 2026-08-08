import { useState } from 'react';
import { Percent, ChevronDown, X } from 'lucide-react';

function computeSlabs(v: any) {
  return [
    { range: '> 5 Cases', margin: v.margin + 5, price: Math.round(v.sellingPrice * 0.93 * 100) / 100 },
    { range: '3 - 4 Cases', margin: v.margin + 2, price: Math.round(v.sellingPrice * 0.97 * 100) / 100 },
    { range: '1 - 2 Cases', margin: v.margin, price: Math.round(v.sellingPrice * 100) / 100 },
  ];
}
function computeOffers(v: any) {
  const offers: any[] = [];
  if (v.scheme) {
    let save = Math.round(v.casePrice / v.casePcs);
    const m = v.scheme.match(/Buy (\d+)/i);
    if (m) save = Math.round(v.casePrice / parseInt(m[1], 10));
    const flat = v.scheme.match(/₹(\d+)/);
    if (v.scheme.includes('Flat') && flat) save = parseInt(flat[1], 10);
    offers.push({ id: 'scheme', icon: '🎁', title: v.scheme, desc: `On purchases of ${v.casePack}`, savings: save });
  }
  offers.push({ id: 'pct', icon: '%', title: '5% Off', desc: 'Get 5% off on your order above ₹500 upto ₹100', savings: 100 });
  offers.push({ id: 'fr', icon: '🚚', title: 'Free Delivery', desc: 'Free shipping on orders above ₹3,000', savings: 60 });
  return offers;
}

export default function DiscountsSheet({ variant, onClose }: { variant: any; onClose: () => void }) {
  const slabs = computeSlabs(variant);
  const offers = computeOffers(variant);
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/50" onClick={onClose} role="presentation">
      <div className="flex max-h-[85%] w-full flex-col rounded-t-xl bg-card text-card-foreground" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border p-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Percent className="h-5 w-5" /></span>
          <div className="flex-1"><div className="text-base font-semibold">Offer &amp; Schemes</div><div className="text-xs text-muted-foreground">Please review the following before proceeding</div></div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div>
            <div className="mb-2 text-sm font-semibold">Quantity Price Slab</div>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-3 bg-muted px-3 py-2 text-xs font-medium text-muted-foreground"><span>Quantity</span><span>Margin %</span><span className="text-right">Unit Price</span></div>
              {slabs.map((s, i) => (
                <div key={s.range} className={`grid grid-cols-3 px-3 py-2.5 text-sm ${i > 0 ? 'border-t border-border' : ''}`}><span>{s.range}</span><span>{s.margin} %</span><span className="text-right font-medium">₹{s.price.toFixed(2)}</span></div>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold">Other Offers</div>
            <div className="space-y-2">{offers.map((o) => <OfferRow key={o.id} offer={o} />)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfferRow({ offer }: { offer: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-3 text-left">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-lg">{offer.icon}</span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{offer.title}</span><span className="block text-xs text-muted-foreground">{offer.desc}</span></span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-border bg-gray-50 p-3">
          <div className="rounded-lg bg-emerald-50 p-3 text-center">
            <div className="text-base font-semibold text-emerald-700">Save up to ₹{offer.savings.toLocaleString('en-IN')}</div>
            <div className="text-xs text-muted-foreground">Your Savings</div>
          </div>
        </div>
      )}
    </div>
  );
}
