import { useMemo, useState } from 'react';
import { ChevronLeft, Clock, TrendingUp, ArrowUpRight, PackageOpen, Tag, LayoutGrid } from 'lucide-react';
import { EmptyState, cn } from '@mockups/ui';
import { useEmptyDemo } from '../review/demoState';
import { ProductImage, formatInr } from '@mockups/components';
import { SearchField } from '../components/SearchField';
import { PRODUCTS } from '../data/products';
import { offerNameSuffix } from '../data/coupons';
import { BRANDS, DIST_CATEGORIES, WHOLESALER_CATEGORIES, type HomeCategory } from '../data/home';
import type { Navigate } from '../nav';

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
  onNavigate,
}: {
  onBack: () => void;
  onOpenSheet: (id: string) => void;
  onNavigate: Navigate;
}) {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState(RECENT);

  // Suggestion rows open the filtered product list (the "results page").
  const openList = (applied: { type: 'brand' | 'category'; value: string }) =>
    onNavigate('listing', { applied: [applied], backTo: 'global-search' });

  const q = query.trim().toLowerCase();

  // Brands & categories are wayfinding only — keep them tight (top 2) so the
  // actual product rows own the space.
  const BRAND_CAP = 2;
  const CATEGORY_CAP = 2;

  const brandMatches = useMemo(
    () => (q ? BRANDS.filter((b) => b.name.toLowerCase().includes(q)).slice(0, BRAND_CAP) : []),
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
  // Categories that match by name OR that own a matching product
  // (e.g. "red" → Personal Care & Beverages, via its products).
  const categoryMatches = useMemo(() => {
    if (!q) return [];
    const byName = CATEGORIES.filter((c) => c.name.toLowerCase().includes(q)).map((c) => c.name);
    const byProduct = productMatches.map((p) => p.category);
    return Array.from(new Set([...byName, ...byProduct])).slice(0, CATEGORY_CAP);
  }, [q, productMatches]);

  const term = query.trim();
  // Empty demo forces the zero-results branch regardless of the query.
  const emptyDemo = useEmptyDemo();
  const hasAnyMatch =
    !emptyDemo && brandMatches.length + categoryMatches.length + productMatches.length > 0;

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
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search for products"
          autoFocus
          className="flex-1"
        />
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto bg-background-subtle">
        {!q && !emptyDemo ? (
          <div className="space-y-6 p-4">
            {recent.length > 0 && (
              <ChipSection title="Recent searches" items={recent} icon={Clock} onPick={setQuery} onClear={() => setRecent([])} />
            )}
            <ChipSection title="Trending searches" items={TRENDING} icon={TrendingUp} onPick={setQuery} accent />
            <ChipSection title="Start with a category" items={CATEGORIES.map((c) => c.name)} onPick={setQuery} />
          </div>
        ) : hasAnyMatch ? (
          <div className="space-y-3 p-3">
            {/* Brands — "<term> in Brands" */}
            {brandMatches.length > 0 && (
              <section className="space-y-1.5">
                <GroupHeader term={term} group="Brands" />
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  {brandMatches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => openList({ type: 'brand', value: b.name })}
                      className="flex w-full items-center gap-2.5 border-b border-border-subtle px-3 py-1.5 text-left last:border-0 active:scale-[0.99]"
                    >
                      <Tag className="h-4 w-4 shrink-0 text-foreground-secondary" />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        <Highlight text={b.name} q={q} />
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground-secondary" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Categories — "<term> in Categories" */}
            {categoryMatches.length > 0 && (
              <section className="space-y-1.5">
                <GroupHeader term={term} group="Categories" />
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  {categoryMatches.map((name) => (
                    <button
                      key={name}
                      onClick={() => openList({ type: 'category', value: name })}
                      className="flex w-full items-center gap-2.5 border-b border-border-subtle px-3 py-1.5 text-left last:border-0 active:scale-[0.99]"
                    >
                      <LayoutGrid className="h-4 w-4 shrink-0 text-foreground-secondary" />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        <Highlight text={name} q={q} />
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground-secondary" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Products — "<term> in Products" */}
            {productMatches.length > 0 && (
              <section className="space-y-2">
                <GroupHeader term={term} group="Products" />
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
                        <ProductImage image={p.image} alt={p.name} />
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-snug text-foreground line-clamp-2">
                        <Highlight text={p.name} q={q} />
                        {offerNameSuffix(p.id)}
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block whitespace-nowrap text-[11px] leading-snug text-foreground-secondary">
                          {p.variants.slice(0, 2).map((v) => v.label).join(' · ')}
                          {p.variants.length > 2 && ` +${p.variants.length - 2}`}
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
          /* Empty state + the "try one of these" chips are centred as one
             group, so this reads the same as every other empty screen. */
          <div className="flex h-full flex-col items-center justify-center">
            <EmptyState
              icon={<PackageOpen strokeWidth={1.75} />}
              title={term ? <>No results for “{term}”</> : 'No matching products'}
              description="Check the spelling, or try a brand or category name."
              className="h-auto py-0"
            />
            <div className="mt-8 w-full px-6">
              <ChipSection title="Try one of these" items={TRENDING} icon={TrendingUp} onPick={setQuery} accent />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Group label — "<term> in Brands / Categories / Products". */
function GroupHeader({ term, group }: { term: string; group: string }) {
  return (
    <div className="px-1 text-xs text-foreground-secondary">
      <span className="font-semibold text-foreground">{term}</span> in {group}
    </div>
  );
}

function ChipSection({
  title,
  items,
  icon: Icon,
  accent,
  onPick,
  onClear,
}: {
  title: string;
  items: string[];
  icon?: typeof Clock;
  accent?: boolean;
  onPick: (v: string) => void;
  onClear?: () => void;
}) {
  return (
    <section className="space-y-2 text-left">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {onClear && (
          <button
            onClick={onClear}
            className="text-xs font-medium text-primary active:scale-[0.98]"
          >
            Clear
          </button>
        )}
      </div>
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
