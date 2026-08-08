import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { homepage } from '../data';

export type Filters = { sort: string; stock: string[]; brands: string[]; minMargin: number; schemesOnly: boolean };
export const DEFAULT_FILTERS: Filters = { sort: 'recommended', stock: [], brands: [], minMargin: 0, schemesOnly: false };

export function countActiveFilters(f: Filters) {
  let n = 0;
  if (f.sort !== 'recommended') n++;
  if (f.stock.length) n++;
  if (f.brands.length) n++;
  if (f.minMargin > 0) n++;
  if (f.schemesOnly) n++;
  return n;
}

export function applyFilters(list: any[], f: Filters) {
  let out = list;
  if (f.brands.length) out = out.filter((p) => f.brands.includes(p.brand));
  if (f.stock.length) out = out.filter((p) => f.stock.includes(p.variants[0].stock));
  if (f.minMargin > 0) out = out.filter((p) => p.variants.some((v: any) => v.margin >= f.minMargin));
  if (f.schemesOnly) out = out.filter((p) => p.variants.some((v: any) => v.scheme));
  out = [...out];
  if (f.sort === 'price_asc') out.sort((a, b) => a.variants[0].sellingPrice - b.variants[0].sellingPrice);
  else if (f.sort === 'price_desc') out.sort((a, b) => b.variants[0].sellingPrice - a.variants[0].sellingPrice);
  else if (f.sort === 'margin_desc') out.sort((a, b) => b.variants[0].margin - a.variants[0].margin);
  return out;
}

const SORT = [
  { id: 'recommended', label: 'Recommended', sub: 'Most relevant first' },
  { id: 'price_asc', label: 'Price: Low to High', sub: 'Cheapest first' },
  { id: 'price_desc', label: 'Price: High to Low', sub: 'Premium first' },
  { id: 'margin_desc', label: 'Margin: High to Low', sub: 'Best profit first' },
];
const STOCK = [{ id: 'available', label: 'In Stock', dot: 'bg-emerald-500' }, { id: 'limited', label: 'Limited', dot: 'bg-amber-500' }, { id: 'out', label: 'Out of Stock', dot: 'bg-red-500' }];
const MARGIN = [{ v: 0, l: 'Any' }, { v: 12, l: '12% +' }, { v: 14, l: '14% +' }, { v: 16, l: '16% +' }];

export default function FiltersSheet({ initialFilters, onClose, onApply }: { initialFilters: Filters; onClose: () => void; onApply: (f: Filters) => void }) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const toggleArr = (key: 'stock' | 'brands', value: string) => setFilters((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }));
  const active = countActiveFilters(filters);
  const chip = (on: boolean) => `rounded-full border px-3 py-1.5 text-xs font-medium ${on ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`;

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/50" onClick={onClose} role="presentation">
      <div className="flex max-h-[92%] w-full flex-col rounded-t-xl bg-card text-card-foreground" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border p-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><SlidersHorizontal className="h-5 w-5" /></span>
          <div className="flex-1"><div className="text-base font-semibold">Filters</div><div className="text-xs text-muted-foreground">{active > 0 ? `${active} active` : 'Refine your product view'}</div></div>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <Block title="Sort by">
            <div className="space-y-2">
              {SORT.map((s) => (
                <button key={s.id} onClick={() => setFilters((f) => ({ ...f, sort: s.id }))} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${filters.sort === s.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <span className={`grid h-4 w-4 place-items-center rounded-full border ${filters.sort === s.id ? 'border-primary' : 'border-muted-foreground'}`}>{filters.sort === s.id && <span className="h-2 w-2 rounded-full bg-primary" />}</span>
                  <span><span className="block text-sm font-medium">{s.label}</span><span className="block text-xs text-muted-foreground">{s.sub}</span></span>
                </button>
              ))}
            </div>
          </Block>
          <Block title="Availability">
            <div className="flex flex-wrap gap-2">{STOCK.map((s) => <button key={s.id} onClick={() => toggleArr('stock', s.id)} className={`flex items-center gap-1.5 ${chip(filters.stock.includes(s.id))}`}><span className={`h-2 w-2 rounded-full ${s.dot}`} />{s.label}</button>)}</div>
          </Block>
          <Block title="Minimum margin">
            <div className="flex flex-wrap gap-2">{MARGIN.map((m) => <button key={m.v} onClick={() => setFilters((f) => ({ ...f, minMargin: m.v }))} className={chip(filters.minMargin === m.v)}>{m.l}</button>)}</div>
          </Block>
          <Block title={`Brand${filters.brands.length ? ` · ${filters.brands.length}` : ''}`}>
            <div className="flex flex-wrap gap-2">{(homepage.brands as any[]).map((b) => <button key={b.id} onClick={() => toggleArr('brands', b.name)} className={chip(filters.brands.includes(b.name))}>{b.name}</button>)}</div>
          </Block>
          <Block title="Schemes">
            <button onClick={() => setFilters((f) => ({ ...f, schemesOnly: !f.schemesOnly }))} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${filters.schemesOnly ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <span className="flex-1"><span className="block text-sm font-medium">Show only items with schemes</span><span className="block text-xs text-muted-foreground">Buy 1 Get 1, flat off, %-discount, etc.</span></span>
              <span className={`relative h-6 w-10 shrink-0 rounded-full ${filters.schemesOnly ? 'bg-primary' : 'bg-switch-background'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${filters.schemesOnly ? 'left-[18px]' : 'left-0.5'}`} /></span>
            </button>
          </Block>
        </div>

        <div className="flex gap-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button onClick={() => setFilters(DEFAULT_FILTERS)} className="flex-1 rounded-md border border-border py-2.5 text-sm font-medium">Reset</button>
          <button onClick={() => { onApply(filters); onClose(); }} className="flex-1 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground">Apply{active > 0 ? ` (${active})` : ''}</button>
        </div>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><div className="mb-2 text-sm font-semibold">{title}</div>{children}</div>;
}
