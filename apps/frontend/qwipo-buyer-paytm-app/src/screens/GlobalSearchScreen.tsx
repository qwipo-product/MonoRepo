import { useMemo, useState } from 'react';
import {
  ChevronLeft, Clock, TrendingUp, ArrowUpRight, PackageOpen, Tag, LayoutGrid,
  X, Store, Warehouse,
} from 'lucide-react';
import { Badge, EmptyState, cn } from '@mockups/ui';
import { useEmptyDemo } from '../review/demoState';
import { ProductCard } from '@mockups/components';
import { SearchField } from '../components/SearchField';
import { BrandTile } from '../components/BrandTile';
import { BRANDS } from '../data/home';
import { productById, defaultVariantId, skuFor } from '../data/products';
import { WHOLESALER_PRODUCTS, cheapestVendorId } from '../data/wholesaler';
import { VendorProductCard } from '../components/VendorProductCard';
import { deliveryFooter } from '../components/DeliveryFooter';
import { DiscountsSheet } from '../sheets/DiscountsSheet';
import { offerNameSuffix } from '../data/coupons';
import { search, browse, suggest, normalise, CATEGORY_NAMES, type SearchCard, type Suggestion } from '../data/search';
import type { Navigate } from '../nav';

/* Global Search — one box, three states.

   Nothing typed: what you searched before, and what everyone is searching now.
   Typing: suggestions, a mix of your recents, terms, categories, brands and
   products. Searched: one merged list of cards — no tabs — with the brands
   across the top, what you've bought before next, and everything else after.

   A card is one thing bought one way, so a SKU both channels carry appears
   twice: the distributor card, then its wholesale card directly beneath. */

/* Both lists are words the catalogue answers to. "Edible Oils & Ghee" and
   "Instant Noodles" read well and found nothing — the categories here are
   Cooking Oils & Ghee and Snacks & Namkeen — so a tap from the opening screen
   landed on an empty result, which is the first thing anyone tries. Card
   counts in comments are what each returns today. */
const TRENDING = [
  'Toor Dal',      // 12
  'Mustard Oil',   // 10
  'Cow Ghee',      // 4
  'Tata Salt',     // 5
];
const SEEDED_RECENT = [
  'Sunflower Oil', // 14
  'Aashirvaad',    // 12
  'Maggi',         // 2
  'Besan',         // 2
];

/** Kept short: three rows of history, eight remembered. */
const RECENT_SHOWN = 3;
const RECENT_KEPT = 8;

const SUGGESTION_ICON: Record<Suggestion['kind'], typeof Clock> = {
  recent: Clock,
  term: TrendingUp,
  category: LayoutGrid,
  brand: Tag,
};

/** "red label" reads as a brand when it's offered back as one. */
const titleCase = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());

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

/** Who sells it — the one thing a buyer needs before the name. */
function SourceBadge({ card }: { card: SearchCard }) {
  const distributor = card.source === 'distributor';
  const Icon = distributor ? Store : Warehouse;
  return (
    <Badge variant={distributor ? 'info' : 'accent'}>
      <Icon className="h-3 w-3" />
      {distributor ? 'Distributor' : 'Wholesaler'}
    </Badge>
  );
}

export function GlobalSearchScreen({
  qty = {},
  wholesaleQty = {},
  onSetWholesaleQty,
  vendorSel = {},
  onSetVendor,
  onBack,
  onOpenSheet,
  onOpenWholesaleSheet,
  onOpenGallery,
  onNavigate,
}: {
  /* Results are the same cards the product lists show, so they need the same
     live state: what's in the cart, and which vendor a wholesale line is on. */
  qty?: Record<string, number>;
  wholesaleQty?: Record<string, number>;
  onSetWholesaleQty?: (id: string, n: number) => void;
  vendorSel?: Record<string, string>;
  onSetVendor?: (id: string, vendorId: string) => void;
  onBack: () => void;
  onOpenSheet: (id: string) => void;
  /** Wholesale cards open the vendor sheet instead of the distributor one. */
  onOpenWholesaleSheet?: (id: string) => void;
  onOpenGallery?: (id: string) => void;
  onNavigate: Navigate;
}) {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(SEEDED_RECENT);
  const [scope, setScope] = useState<string | null>(null);
  /* Set by "search instead for" — the buyer has overruled the correction, so
     don't quietly apply it again. */
  const [asTyped, setAsTyped] = useState(false);
  const [variant, setVariant] = useState<Record<string, string>>({});
  const [discountsProductId, setDiscountsProductId] = useState<string | null>(null);

  const emptyDemo = useEmptyDemo();

  const remember = (term: string) =>
    setRecent((r) => [term, ...r.filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, RECENT_KEPT));

  const runSearch = (term: string, asTypedOnly = false) => {
    const t = term.trim();
    setQuery(t);
    setSubmitted(t);
    setAsTyped(asTypedOnly);
    if (t) remember(t);
  };

  const openScope = (category: string) => {
    setScope(category);
    setQuery('');
    setSubmitted('');
  };

  const clearScope = () => setScope(null);

  const suggestions = useMemo(
    /* Terms are the trending searches only — category names come back as
       their own kind, and a category suggestion opens a scoped browse rather
       than running as a query. */
    () => (submitted === null ? suggest(query, recent, TRENDING) : []),
    [query, recent, submitted]
  );

  /* The matching SKUs while still typing. Same search, same cards: the buyer
     can add straight from here instead of searching first. */
  const live = useMemo(
    () => (submitted === null && normalise(query).length >= 2 ? search(query, scope ?? undefined) : null),
    [query, scope, submitted]
  );

  const result = useMemo(() => {
    if (submitted === null) return null;
    if (!submitted && scope) return browse(scope);
    return search(submitted, scope ?? undefined, !asTyped);
  }, [submitted, scope, asTyped]);

  const showZero = submitted === null && !query && !emptyDemo;
  const showSuggestions = submitted === null && !!query && !emptyDemo;
  const hasResults = !emptyDemo && !!result && result.cards.length > 0;

  /* The card a result gets is the card its own list would give it — the
     distributor card, or the wholesale one with its vendor picker — so a SKU
     looks the same wherever it's found. The only addition is the pair of
     labels above it saying which kind of seller this is and whose brand. */
  const renderCard = (card: SearchCard) => {
    const labels = <SourceBadge card={card} />;

    if (card.source === 'wholesaler') {
      const p = WHOLESALER_PRODUCTS.find((x) => x.id === card.id);
      if (!p) return null;
      return (
        <VendorProductCard
          key={card.id}
          badge={labels}
          product={p}
          vendorId={vendorSel[p.id] ?? cheapestVendorId(p)}
          onVendor={(vid) => onSetVendor?.(p.id, vid)}
          qty={wholesaleQty[p.id] ?? 0}
          onQty={(n) => onSetWholesaleQty?.(p.id, Math.max(0, n))}
          onAdd={() => onOpenWholesaleSheet?.(p.id)}
          onImageClick={() => onOpenWholesaleSheet?.(p.id)}
        onDiscounts={() => setDiscountsProductId(p.id)}
        />
      );
    }

    const p = productById(card.id);
    if (!p) return null;
    const selected = variant[p.id] ?? defaultVariantId(p);
    const sku = skuFor(p, selected);
    return (
      <ProductCard
        key={card.id}
        badge={labels}
        name={p.name + offerNameSuffix(p.id)}
        caseLabel={p.caseLabel}
        image={sku.image}
        variants={p.variants}
        selectedVariant={selected}
        onSelectVariant={(id) => setVariant((v) => ({ ...v, [p.id]: id }))}
        seller={p.seller}
        margin={sku.margin}
        price={sku.price}
        mrp={sku.mrp}
        qty={qty[p.id] ?? 0}
        onAdd={() => onOpenSheet(p.id)}
        onImageClick={onOpenGallery ? () => onOpenGallery(p.id) : undefined}
          onDiscounts={() => setDiscountsProductId(p.id)}
        footer={deliveryFooter(p.seller)}
      />
    );
  };

  return (
    <div className="flex h-full flex-col">
      <header className="space-y-2 border-b border-border bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            aria-label="Back"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
          >
            <ChevronLeft size={18} />
          </button>
          <form
            className="flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query);
            }}
          >
            <SearchField
              value={query}
              onChange={(v) => {
                setQuery(v);
                setSubmitted(null);
              }}
              placeholder={scope ? `Search in ${scope}` : 'Search for products'}
              autoFocus
            />
          </form>
        </div>

        {/* what the search is narrowed to, and the way out of it */}
        {scope && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary-soft px-3 py-1 text-xs font-medium text-primary-soft-foreground">
              {scope}
              <button onClick={clearScope} aria-label={`Leave ${scope}`} className="active:scale-[0.98]">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        )}
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto bg-background-subtle">
        {showZero ? (
          <div className="space-y-6 p-4">
            {recent.length > 0 && (
              <ChipSection
                title="Recent searches"
                items={recent.slice(0, RECENT_SHOWN)}
                icon={Clock}
                onPick={runSearch}
                onClear={() => setRecent([])}
              />
            )}
            <ChipSection title="Trending searches" items={TRENDING} icon={TrendingUp} onPick={runSearch} accent />
            <ChipSection title="Start with a category" items={CATEGORY_NAMES} onPick={openScope} />
          </div>
        ) : showSuggestions ? (
          suggestions.length > 0 || (live && live.cards.length > 0) ? (
            <div className="space-y-4 p-3">
              {suggestions.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {suggestions.map((s) => {
                  const Icon = SUGGESTION_ICON[s.kind];
                  return (
                    <button
                      key={`${s.kind}:${s.label}`}
                      onClick={() => (s.kind === 'category' ? openScope(s.label) : runSearch(s.label))}
                      className="flex w-full items-center gap-2.5 border-b border-border-subtle px-3 py-2.5 text-left last:border-0 active:scale-[0.99]"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-foreground-secondary" />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        <Highlight text={s.label} q={query.trim()} />
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-foreground-secondary">
                        {s.kind === 'term' ? 'search' : s.kind}
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground-secondary" />
                    </button>
                  );
                })}
              </div>
              )}

              {/* One list while typing, best match first — no sections. The
                  point here is the closest thing to what's being typed, close
                  enough to add without searching first. */}
              {live && live.cards.length > 0 && (
                <div className="space-y-3">{live.cards.map(renderCard)}</div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-foreground-secondary">
              No suggestions — press search to see all matches
            </div>
          )
        ) : hasResults && result ? (
          <div className="space-y-4 p-3">
            {/* corrected before searching, and reversible */}
            {result.correctedFrom && (
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground-secondary">
                Showing results for <span className="font-semibold text-foreground">{result.query}</span>
                {' · '}
                <button
                  className="font-medium text-primary active:scale-[0.98]"
                  onClick={() => runSearch(result.correctedFrom!, true)}
                >
                  Search instead for {result.correctedFrom}
                </button>
              </div>
            )}

            <div className="px-1 text-xs text-foreground-secondary">
              <span className="font-semibold text-foreground">{result.cards.length}</span> results ·{' '}
              {result.skuCount} products
            </div>

            {result.brands.length > 0 && (
              <section className="space-y-2">
                <h2 className="px-1 text-sm font-medium text-foreground">Brands</h2>
                <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                  {result.brands.map((name) => (
                    <BrandTile
                      key={name}
                      name={name}
                      logo={BRANDS.find((b) => b.name === name)?.logo}
                      className="w-18 shrink-0"
                      onClick={() => onNavigate('listing', { applied: [{ type: 'brand', value: name }], backTo: 'global-search' })}
                    />
                  ))}
                </div>
              </section>
            )}

            {result.previouslyOrdered.length > 0 && (
              <section className="space-y-2">
                <h2 className="px-1 text-sm font-medium text-foreground">Previously Ordered</h2>
                <div className="space-y-3">{result.previouslyOrdered.map(renderCard)}</div>
              </section>
            )}

            {result.more.length > 0 && (
              <section className="space-y-2">
                <h2 className="px-1 text-sm font-medium text-foreground">More Results</h2>
                <div className="space-y-3">{result.more.map(renderCard)}</div>
              </section>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            <EmptyState
              icon={<PackageOpen strokeWidth={1.75} />}
              title={submitted ? <>No results for “{submitted}”</> : 'No matching products'}
              description="Check the spelling, or try a brand or category name."
              className="h-auto py-0"
            />
            {result?.suggestion && (
              <button
                onClick={() => runSearch(result.suggestion!)}
                className="mt-3 text-sm font-medium text-primary active:scale-[0.98]"
              >
                Did you mean {titleCase(result.suggestion)}?
              </button>
            )}
            {scope && (
              <button
                onClick={clearScope}
                className="mt-3 text-sm font-medium text-primary active:scale-[0.98]"
              >
                Search all products
              </button>
            )}
            <div className="mt-8 w-full px-6">
              <ChipSection title="Try one of these" items={TRENDING} icon={TrendingUp} onPick={runSearch} accent />
            </div>
          </div>
        )}
      </div>

      <DiscountsSheet
        open={!!discountsProductId}
        productId={discountsProductId}
        qty={{ ...qty, ...wholesaleQty }}
        onClose={() => setDiscountsProductId(null)}
      />
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
          <button onClick={onClear} className="text-xs font-medium text-primary active:scale-[0.98]">
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
