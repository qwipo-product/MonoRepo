import { useState, useEffect, useRef } from 'react';
import { Search, Clock, TrendingUp, RotateCcw, ArrowUpRight, PackageOpen } from 'lucide-react';
import { products, homepage, reorderHistory } from '../data';
import Logo from '../components/Logo';
import ProductCard from '../components/ProductCard';
import BackButton from '../components/BackButton';

const INITIAL_RECENT = ['Durga Ghee,50 Ml Pouch', 'freedom', 'Beauty & Hygiene', 'Hanamanja', 'Mung daal', 'Mung dal', 'Mung da', 'Mung', 'Red label', 'Nirma'];
const TRENDING = ['oil', 'ajay', 'Annapurna', 'Beauty & Hygiene', 'Cycle', 'vijaya sunflower oil,1 ltr pouch'];
const BROWSE_CATEGORIES = ['Personal Care', 'Sugar & Spices', 'Rice & Rice Products', 'Dals & Pulses', 'Atta, Flours & Sooji', 'Cleaning & Household', 'Edible Oils & Ghee', 'Beverages'];
// Spell-correction map (real screen reads it from response headers).
const SPELL: Record<string, string> = { 'mung daal': 'mung dal', hanamanja: 'hanuman', freedumb: 'freedom' };

const allBrands = homepage.allBrands as any[];
const SELLER_TYPE: Record<string, 'distributor' | 'wholesaler'> = Object.fromEntries(
  (reorderHistory as any[]).map((r) => [r.productId, r.sellerType])
);
const REORDERED = new Set((reorderHistory as any[]).map((r) => r.productId));
const BUY_AGAIN = (reorderHistory as any[]).map((r) => (products as any[]).find((p) => p.id === r.productId)).filter(Boolean).slice(0, 4);
const POPULAR = (products as any[]).filter((p) => !REORDERED.has(p.id)).slice(0, 4);
const sourceOf = (id: string) => (SELLER_TYPE[id] === 'distributor' ? 'Distributor' : 'Wholesaler');

function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-semibold text-primary">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

export default function GlobalSearchScreen({ onBack, onSelectProduct }: any) {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>(INITIAL_RECENT);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const raw = query.trim().toLowerCase();
  const corrected = SPELL[raw];
  const q = corrected || raw;

  const recentMatches = q ? recent.filter((r) => r.toLowerCase().includes(q)) : [];
  const brandMatches = q ? allBrands.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 8) : [];
  const productMatches = q ? (products as any[]).filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)) : [];
  const previouslyOrdered = productMatches.filter((p) => REORDERED.has(p.id));
  const moreResults = productMatches.filter((p) => !REORDERED.has(p.id));
  const hasSuggest = recentMatches.length > 0 || brandMatches.length > 0;
  const hasAnyMatch = productMatches.length > 0 || hasSuggest;

  const commitSearch = (term: string) => {
    setQuery(term);
    setRecent((prev) => [term, ...prev.filter((r) => r !== term)].slice(0, 10));
  };

  const chip = (label: string, onClick: () => void, icon?: any, trending?: boolean) => (
    <button
      key={label}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
        trending ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-border bg-card text-foreground'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-border bg-card p-3 shadow-sm">
        <BackButton onClick={onBack} />
        <div className="flex h-11 flex-1 items-center gap-2 rounded-lg border border-border bg-input-background px-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products"
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear" className="text-muted-foreground">✕</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {!raw && (
          <div className="space-y-6 pt-2">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent searches</h2>
                {recent.length > 0 && <button onClick={() => setRecent([])} className="text-xs font-medium text-primary">Clear</button>}
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => chip(r, () => commitSearch(r), <Clock className="h-3.5 w-3.5" />))}
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Trending searches</h2>
              <div className="flex flex-wrap gap-2">
                {TRENDING.map((r) => chip(r, () => commitSearch(r), <TrendingUp className="h-3.5 w-3.5" />, true))}
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Start with a category</h2>
              <div className="flex flex-wrap gap-2">
                {BROWSE_CATEGORIES.map((c) => chip(`${c} ›`, () => commitSearch(c)))}
              </div>
            </section>

            {BUY_AGAIN.length > 0 && (
              <section className="space-y-2">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold"><RotateCcw className="h-4 w-4" /> Buy again</h2>
                <div className="space-y-3">
                  {BUY_AGAIN.map((p: any) => <ProductCard key={p.id} p={p} source={sourceOf(p.id)} onSelect={onSelectProduct} />)}
                </div>
              </section>
            )}

            {POPULAR.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">Popular right now</h2>
                <div className="space-y-3">
                  {POPULAR.map((p: any) => <ProductCard key={p.id} p={p} source={sourceOf(p.id)} onSelect={onSelectProduct} />)}
                </div>
              </section>
            )}
          </div>
        )}

        {raw && hasAnyMatch && (
          <div className="space-y-4 pt-2">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {hasSuggest ? (
                <>
                  {recentMatches.map((r) => (
                    <button key={r} onClick={() => commitSearch(r)} className="flex w-full items-center gap-2 border-b border-border px-3 py-2.5 text-left text-sm last:border-0">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1"><Highlight text={r} q={q} /></span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                  {brandMatches.map((b) => (
                    <button key={b.id} onClick={() => commitSearch(b.name)} className="flex w-full items-center gap-2 border-b border-border px-3 py-2.5 text-left text-sm last:border-0">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1"><Highlight text={b.name} q={q} /></span>
                      <span className="text-xs text-muted-foreground">Brand</span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" /> Press search to see all matches
                </div>
              )}
            </div>

            {corrected && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div>Showing results for <strong>“{corrected}”</strong></div>
                <button onClick={() => setQuery(raw)} className="mt-1 text-primary">Search instead for <span className="underline">“{raw}”</span></button>
              </div>
            )}

            {brandMatches.length > 0 && (
              <section className="space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Brands</div>
                <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {brandMatches.map((b) => (
                    <button key={b.id} onClick={() => commitSearch(b.name)} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                      <Logo src={b.logo} text={b.logoText} color={b.color} className="h-14 w-14 rounded-full border border-border" />
                      <div className="w-full truncate text-center text-xs"><Highlight text={b.name} q={q} /></div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {previouslyOrdered.length > 0 && (
              <section className="space-y-2">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-primary"><RotateCcw className="h-4 w-4" /> Previously Ordered</h2>
                <div className="space-y-3">
                  {previouslyOrdered.map((p: any) => <ProductCard key={p.id} p={p} source={sourceOf(p.id)} onSelect={onSelectProduct} />)}
                </div>
              </section>
            )}

            {moreResults.length > 0 && (
              <section className="space-y-2">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold"><Search className="h-4 w-4" /> {previouslyOrdered.length > 0 ? 'More Results' : 'Products'}</h2>
                <div className="space-y-3">
                  {moreResults.map((p: any) => <ProductCard key={p.id} p={p} source={sourceOf(p.id)} onSelect={onSelectProduct} />)}
                </div>
              </section>
            )}
          </div>
        )}

        {raw && !hasAnyMatch && (
          <div className="flex flex-col items-center pt-10 text-center">
            <PackageOpen className="h-16 w-16 text-muted-foreground" />
            <div className="mt-3 text-base font-semibold">No results for "{query}"</div>
            <div className="mt-1 text-sm text-muted-foreground">Check the spelling, or try a brand or category name.</div>
            <div className="mt-5 w-full text-left text-sm font-medium">Try one of these</div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {TRENDING.map((r) => chip(r, () => commitSearch(r), <TrendingUp className="h-3.5 w-3.5" />, true))}
            </div>
            <div className="mt-5 w-full text-left text-sm font-medium">Browse categories</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {BROWSE_CATEGORIES.map((c) => chip(c, () => commitSearch(c)))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
