import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Search, X, Clock, TrendingUp, ArrowUpRight, PackageOpen, Tag, LayoutGrid } from 'lucide-react';
import { cn } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import { PRODUCTS } from '../data/products';
import { BRANDS, DIST_CATEGORIES, WHOLESALER_CATEGORIES, type HomeCategory } from '../data/home';

/* Global Search. Typing collapses results into compact rows (not full product
   cards) to save vertical space. Matching BRANDS and CATEGORIES surface as
   suggestion rows first; product NAME rows follow. Tapping a product row opens
   the shared selling-units sheet ("Add item", with its SKU/variant pills). */

const RECENT = ['Sunflower Oil', 'Aashirvaad Atta', 'Maggi', 'Besan'];
const TRENDING = ['Edible Oils & Ghee', 'Atta & Flours', 'Instant Noodles', 'Dals & Pulses'];

// One category list, de-duped across the distributor + wholesaler feeds.
const CATEGORIES: HomeCategory[] = Array.from(
  new Map([...DIST_CATEGORIES, ...WHOLESALER_CATEGORIES].map((c) => [c.name, c])).values()
);

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

export function GlobalSearchScreen({
  onBack,
  onOpenSheet,
}: {
  onBack: () => void;
  onOpenSheet: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();

  const brandMatches = useMemo(
    () => (q ? BRANDS.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 6) : []),
    [q]
  );
  const categoryMatches = useMemo(
    () => (q ? CATEGORIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6) : []),
    [q]
  );
  const productMatches = useMemo(
    () =>
      q
        ? PRODUCTS.filter(
            (p) => p.name.toLowerCase().includes(q) || p.seller.toLowerCase().includes(q)
          )
        : [],
    [q]
  );

  const suggestions = brandMatches.length + categoryMatches.length;
  const hasAnyMatch = suggestions + productMatches.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* search header */}
      <header className="flex items-center gap-2 border-b border-border bg-card p-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex h-11 flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-5 w-5 shrink-0 text-primary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products"
            aria-label="Search for products"
            className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-secondary"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search" className="text-foreground-secondary active:scale-[0.98]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto bg-background-subtle">
        {!q ? (
          <div className="space-y-6 p-4">
            <ChipSection title="Recent searches" items={RECENT} icon={Clock} onPick={setQuery} />
            <ChipSection title="Trending searches" items={TRENDING} icon={TrendingUp} onPick={setQuery} accent />
            <ChipSection title="Start with a category" items={CATEGORIES.map((c) => c.name)} onPick={setQuery} />
          </div>
        ) : hasAnyMatch ? (
          <div className="space-y-4 p-3">
            {/* Brand + category suggestions — shown before products */}
            {suggestions > 0 && (
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {brandMatches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setQuery(b.name)}
                    className="flex w-full items-center gap-2.5 border-b border-border-subtle px-3 py-2 text-left last:border-0 active:scale-[0.99]"
                  >
                    <Tag className="h-4 w-4 shrink-0 text-foreground-secondary" />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      <Highlight text={b.name} q={q} />
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-foreground-secondary">Brand</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground-secondary" />
                  </button>
                ))}
                {categoryMatches.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setQuery(c.name)}
                    className="flex w-full items-center gap-2.5 border-b border-border-subtle px-3 py-2 text-left last:border-0 active:scale-[0.99]"
                  >
                    <LayoutGrid className="h-4 w-4 shrink-0 text-foreground-secondary" />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      <Highlight text={c.name} q={q} />
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-foreground-secondary">Category</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground-secondary" />
                  </button>
                ))}
              </div>
            )}

            {/* Product name rows */}
            {productMatches.length > 0 && (
              <section className="space-y-2">
                <div className="px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">
                  {productMatches.length} {productMatches.length === 1 ? 'product' : 'products'}
                </div>
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  {productMatches.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => onOpenSheet(p.id)}
                      className={cn(
                        'flex w-full items-start gap-3 px-3 py-2.5 text-left active:scale-[0.99]',
                        idx !== productMatches.length - 1 && 'border-b border-border-subtle'
                      )}
                    >
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-lg">
                        {p.image}
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-snug text-foreground line-clamp-2">
                        <Highlight text={p.name} q={q} />
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[11px] text-foreground-secondary">
                          {p.variants.map((v) => v.label).join(' · ')}
                        </span>
                        <span className="mt-0.5 block text-sm font-semibold tabular-nums text-foreground">
                          {formatInr(p.price)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 pt-12 text-center">
            <PackageOpen className="h-14 w-14 text-foreground-tertiary" />
            <div className="mt-3 text-base font-semibold text-foreground">No results for “{query}”</div>
            <div className="mt-1 text-sm text-foreground-secondary">
              Check the spelling, or try a brand or category name.
            </div>
            <div className="mt-6 w-full">
              <ChipSection title="Try one of these" items={TRENDING} icon={TrendingUp} onPick={setQuery} accent />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChipSection({
  title,
  items,
  icon: Icon,
  accent,
  onPick,
}: {
  title: string;
  items: string[];
  icon?: typeof Clock;
  accent?: boolean;
  onPick: (v: string) => void;
}) {
  return (
    <section className="space-y-2 text-left">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((label) => (
          <button
            key={label}
            onClick={() => onPick(label)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs active:scale-[0.98]',
              accent
                ? 'border-warning-border bg-warning-subtle text-warning-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
