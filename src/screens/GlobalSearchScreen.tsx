import { useState, useEffect, useRef } from 'react';
import { Icon, StatusBar } from '../components/Icons';
import { products, allBrandsList, reorderHistory } from '../data/mockData';

const INITIAL_RECENT = [
  'Durga Ghee,50 Ml Pouch',
  'freedom',
  'Beauty & Hygiene',
  'Hanamanja',
  'Mung daal',
  'Mung dal',
  'Mung da',
  'Mung',
  'Red label',
  'Nirma',
];

const TRENDING = [
  'oil',
  'ajay',
  'Annapurna',
  'Beauty & Hygiene',
  'Cycle',
  'vijaya sunflower oil,1 ltr pouch',
];

const BROWSE_CATEGORIES = [
  'Personal Care',
  'Sugar & Spices',
  'Rice & Rice Products',
  'Dals & Pulses',
  'Atta, Flours & Sooji',
  'Cleaning & Household',
  'Edible Oils & Ghee',
  'Beverages',
];

// Story 20405 — the real screen reads the corrected term from the
// X-Spell-Corrected-* response headers. Mocked here as a small map: typing a
// key shows the "Showing results for …" banner and searches the value.
const SPELL: Record<string, string> = {
  'mung daal': 'mung dal',
  'hanamanja': 'hanuman',
  'freedumb': 'freedom',
};

// Which catalogue a product came from — drives the source badge on each card.
// Real data carries this per SKU; here we borrow it from the reorder history
// and default the rest to wholesaler.
const SELLER_TYPE: Record<string, 'distributor' | 'wholesaler'> = Object.fromEntries(
  reorderHistory.map((r) => [r.productId, r.sellerType])
);
const REORDERED = new Set(reorderHistory.map((r) => r.productId));

// Buy-again + popular rails for the zero state (Story 20401).
const BUY_AGAIN = reorderHistory
  .map((r) => products.find((p: any) => p.id === r.productId))
  .filter(Boolean)
  .slice(0, 4);
const POPULAR = products.filter((p: any) => !REORDERED.has(p.id)).slice(0, 4);

// Bold the matched substring inside a label — the contrast is what makes a long
// list of similar pack names scannable (search.component.html line ~80).
function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="gs2-hl">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

function ProductCard({ p, onSelect }: { p: any; onSelect?: (p: any) => void }) {
  const variant = p.variants[0];
  const source = SELLER_TYPE[p.id] === 'distributor' ? 'Distributor' : 'Wholesaler';
  return (
    <div className="product-card">
      <div className="product-card-top">
        <div className="product-info">
          <div className="gs2-product-tags">
            <span className="gs2-brand-tag">{p.brand}</span>
            <span className={`gs2-type-tag ${source === 'Distributor' ? 'dist' : ''}`}>{source}</span>
          </div>
          <div className="product-name" style={{ marginTop: 6 }}>
            {p.name}
          </div>
          <div className="product-subline">
            <span>Case: {variant.casePcs} pc</span>
          </div>
        </div>
        <button className="product-img" onClick={() => onSelect?.(p)} aria-label={`View ${p.name}`}>
          {p.images?.[0] ? <img src={p.images[0]} alt={p.name} /> : <span style={{ fontSize: 30 }}>{p.image}</span>}
        </button>
      </div>

      <div className="variant-pills">
        {p.variants.map((v: any) => (
          <button key={v.id} className={`variant-pill ${v.id === variant.id ? 'active' : ''}`}>
            {v.size}
          </button>
        ))}
      </div>

      <div className="product-price-row">
        <div className="margin-badge">{variant.margin}% Margin</div>
        <div className="price-block">
          <div className="price-mrp-row">
            MRP <span className="price-mrp">₹ {variant.mrp}</span>
          </div>
          <div className="price-main">
            <span className="price-current">₹ {variant.sellingPrice}</span>
            <span className="price-unit">/pc</span>
          </div>
        </div>
      </div>

      <div className="product-actions">
        <button className="discounts-btn-filled" onClick={() => onSelect?.(p)}>
          Discounts <Icon.ChevronDown />
        </button>
        <button className="add-btn compact" onClick={() => onSelect?.(p)}>
          <Icon.Plus /> Add
        </button>
      </div>

      <div className="reorder-delivery-line">
        <Icon.Truck size={14} /> Delivery by Sunday
      </div>
    </div>
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
  // Spell correction: search runs on the corrected term, banner offers the original.
  const corrected = SPELL[raw];
  const q = corrected || raw;

  const recentMatches = q ? recent.filter((r) => r.toLowerCase().includes(q)) : [];
  const brandMatches = q
    ? allBrandsList.filter((b: any) => b.name.toLowerCase().includes(q)).slice(0, 8)
    : [];
  const productMatches = q
    ? products.filter((p: any) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
    : [];

  // Story 20408 — previously-ordered products sit above the rest under their
  // own heading; everything else runs under "More Results" (or "Products" when
  // there is no split to label).
  const previouslyOrdered = productMatches.filter((p: any) => REORDERED.has(p.id));
  const moreResults = productMatches.filter((p: any) => !REORDERED.has(p.id));

  const hasSuggest = recentMatches.length > 0 || brandMatches.length > 0;
  const hasAnyMatch = productMatches.length > 0 || hasSuggest;

  const commitSearch = (term: string) => {
    setQuery(term);
    setRecent((prev) => [term, ...prev.filter((r) => r !== term)].slice(0, 10));
  };

  return (
    <>
      <StatusBar />
      <div className="screen-body">
        <div className="dl-sticky-top">
          <div className="search-top-bar">
            <button className="icon-btn" onClick={onBack} aria-label="Back">
              <Icon.Back />
            </button>
            <div className="search-top-input">
              <Icon.Search />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products"
              />
              {query && (
                <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Zero state — recent, trending, categories, then the heavy product rails */}
        {!raw && (
          <div className="gs2-panel">
            <div className="gs2-section-row">
              <div className="gs2-section-title">Recent searches</div>
              {recent.length > 0 && (
                <button className="gs2-clear" onClick={() => setRecent([])}>
                  Clear
                </button>
              )}
            </div>
            <div className="gs2-chip-wrap">
              {recent.map((r) => (
                <button key={r} className="gs2-chip" onClick={() => commitSearch(r)}>
                  <Icon.Clock size={14} /> {r}
                </button>
              ))}
            </div>

            <div className="gs2-section-title" style={{ marginTop: 24 }}>
              Trending searches
            </div>
            <div className="gs2-chip-wrap" style={{ marginTop: 12 }}>
              {TRENDING.map((r) => (
                <button key={r} className="gs2-chip trending" onClick={() => commitSearch(r)}>
                  <Icon.TrendingUp size={14} /> {r}
                </button>
              ))}
            </div>

            <div className="gs2-section-title" style={{ marginTop: 24 }}>
              Start with a category
            </div>
            <div className="gs2-chip-wrap" style={{ marginTop: 12 }}>
              {BROWSE_CATEGORIES.map((c) => (
                <button key={c} className="gs2-chip" onClick={() => commitSearch(c)}>
                  {c} ›
                </button>
              ))}
            </div>

            {BUY_AGAIN.length > 0 && (
              <>
                <div className="gs2-result-head" style={{ marginTop: 24 }}>
                  <Icon.Reorder size={16} />
                  <span>Buy again</span>
                </div>
                <div className="product-list">
                  {BUY_AGAIN.map((p: any) => (
                    <ProductCard key={p.id} p={p} onSelect={onSelectProduct} />
                  ))}
                </div>
              </>
            )}

            {POPULAR.length > 0 && (
              <>
                <div className="gs2-section-title" style={{ marginTop: 24, marginBottom: 12 }}>
                  Popular right now
                </div>
                <div className="product-list">
                  {POPULAR.map((p: any) => (
                    <ProductCard key={p.id} p={p} onSelect={onSelectProduct} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Typing state — suggestions + spell banner + brands + split product list */}
        {raw && hasAnyMatch && (
          <div className="gs2-panel">
            {/* Suggestion dropdown — type-ahead sits ABOVE the results (Story 20403) */}
            <div className="gs2-suggest-card">
              {hasSuggest ? (
                <>
                  {recentMatches.map((r) => (
                    <button key={r} className="gs2-suggest-row" onClick={() => commitSearch(r)}>
                      <Icon.Clock size={16} />
                      <span className="gs2-suggest-text">
                        <Highlight text={r} q={q} />
                      </span>
                      <Icon.ArrowUpRight size={16} />
                    </button>
                  ))}
                  {brandMatches.map((b: any) => (
                    <button key={b.id} className="gs2-suggest-row" onClick={() => commitSearch(b.name)}>
                      <Icon.Search size={16} />
                      <span className="gs2-suggest-text">
                        <Highlight text={b.name} q={q} />
                      </span>
                      <span className="gs2-suggest-end">Brand</span>
                      <Icon.ArrowUpRight size={16} />
                    </button>
                  ))}
                </>
              ) : (
                // Story 20403 AC-6 — nothing to suggest, but products exist behind it.
                <div className="gs2-hint-row">
                  <Icon.Search size={16} />
                  <span>Press search to see all matches</span>
                </div>
              )}
            </div>

            {/* Story 20405 — spell correction */}
            {corrected && (
              <div className="gs2-spell">
                <div>
                  Showing results for <strong>“{corrected}”</strong>
                </div>
                <button className="gs2-spell-orig" onClick={() => setQuery(raw)}>
                  Search instead for <span>“{raw}”</span>
                </button>
              </div>
            )}

            {/* Story 20407 — brand entry points */}
            {brandMatches.length > 0 && (
              <>
                <div className="gs2-label">BRANDS</div>
                <div className="dl-brand-grid gs2-brand-rail">
                  {brandMatches.map((b: any) => (
                    <button key={b.id} className="dl-brand-tile" onClick={() => commitSearch(b.name)}>
                      <div className="dl-brand-circle" style={{ background: b.logo ? '#ffffff' : b.color }}>
                        {b.logo ? <img src={b.logo} alt={b.name} /> : <span style={{ color: '#ffffff' }}>{b.logoText}</span>}
                      </div>
                      <div className="dl-brand-name">
                        <Highlight text={b.name} q={q} />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Story 20408 — Previously Ordered, then More Results / Products */}
            {previouslyOrdered.length > 0 && (
              <>
                <div className="gs2-result-head blue" style={{ marginTop: 12 }}>
                  <Icon.Reorder size={16} />
                  <span>Previously Ordered</span>
                </div>
                <div className="product-list">
                  {previouslyOrdered.map((p: any) => (
                    <ProductCard key={p.id} p={p} onSelect={onSelectProduct} />
                  ))}
                </div>
              </>
            )}

            {moreResults.length > 0 && (
              <>
                <div className="gs2-result-head" style={{ marginTop: 12 }}>
                  <Icon.Search size={16} />
                  <span>{previouslyOrdered.length > 0 ? 'More Results' : 'Products'}</span>
                </div>
                <div className="product-list">
                  {moreResults.map((p: any) => (
                    <ProductCard key={p.id} p={p} onSelect={onSelectProduct} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* No results — never a dead end: message + trending + browse categories */}
        {raw && !hasAnyMatch && (
          <div className="gs2-no-results">
            <Icon.PackageOpen size={64} color="#94a3b8" />
            <div className="gs2-no-results-title">No results for "{query}"</div>
            <div className="gs2-no-results-sub">Check the spelling, or try a brand or category name.</div>

            <div className="gs2-try-label">Try one of these</div>
            <div className="gs2-chip-wrap center">
              {TRENDING.map((r) => (
                <button key={r} className="gs2-chip trending" onClick={() => commitSearch(r)}>
                  <Icon.TrendingUp size={14} /> {r}
                </button>
              ))}
            </div>

            <div className="gs2-try-label">Browse categories</div>
            <div className="gs2-cat-wrap">
              {BROWSE_CATEGORIES.map((c) => (
                <button key={c} className="gs2-cat-chip" onClick={() => commitSearch(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
