import { useState, useEffect, useRef } from 'react';
import { Icon, StatusBar } from '../components/Icons';
import { products, allBrandsList } from '../data/mockData';

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

export default function GlobalSearchScreen({ onBack, onSelectProduct }: any) {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>(INITIAL_RECENT);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();

  const recentMatches = q ? recent.filter((r) => r.toLowerCase().includes(q)) : [];
  const brandMatches = q
    ? allBrandsList.filter((b: any) => b.name.toLowerCase().includes(q)).slice(0, 8)
    : [];
  const productMatches = q
    ? products.filter(
        (p: any) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      )
    : [];

  const hasAnyMatch = recentMatches.length > 0 || brandMatches.length > 0 || productMatches.length > 0;

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

        {/* Empty state — recent + trending searches */}
        {!q && (
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
            <div className="gs2-chip-wrap">
              {TRENDING.map((r) => (
                <button key={r} className="gs2-chip trending" onClick={() => commitSearch(r)}>
                  <Icon.TrendingUp size={14} /> {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Typing state — suggestions + brands + products */}
        {q && hasAnyMatch && (
          <div className="gs2-panel">
            {(recentMatches.length > 0 || brandMatches.length > 0) && (
              <div className="gs2-suggest-card">
                {recentMatches.map((r) => (
                  <button key={r} className="gs2-suggest-row" onClick={() => commitSearch(r)}>
                    <Icon.Clock size={16} />
                    <span className="gs2-suggest-text">
                      <strong>{r}</strong>
                    </span>
                    <Icon.ArrowUpRight size={16} />
                  </button>
                ))}
                {brandMatches.map((b: any) => (
                  <button key={b.id} className="gs2-suggest-row" onClick={() => commitSearch(b.name)}>
                    <Icon.Search size={16} />
                    <span className="gs2-suggest-text">
                      <strong>{b.name}</strong>
                      <span className="gs2-suggest-sub">Brand · Grocery</span>
                    </span>
                    <Icon.ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
            )}

            {brandMatches.length > 0 && (
              <>
                <div className="gs2-label">BRANDS</div>
                <div className="dl-brand-grid gs2-brand-rail">
                  {brandMatches.map((b: any) => (
                    <button key={b.id} className="dl-brand-tile" onClick={() => commitSearch(b.name)}>
                      <div className="dl-brand-circle" style={{ background: b.logo ? '#ffffff' : b.color }}>
                        {b.logo ? (
                          <img src={b.logo} alt={b.name} />
                        ) : (
                          <span style={{ color: '#ffffff' }}>{b.logoText}</span>
                        )}
                      </div>
                      <div className="dl-brand-name">{b.name}</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {productMatches.length > 0 && (
              <>
                <div className="gs2-label with-icon">
                  <Icon.Search size={14} /> Products
                </div>
                <div className="product-list">
                  {productMatches.map((p: any) => {
                    const variant = p.variants[0];
                    return (
                      <div key={p.id} className="product-card">
                        <div className="product-card-top">
                          <div className="product-info">
                            <div className="gs2-product-tags">
                              <span className="gs2-brand-tag">{p.brand}</span>
                              <span className="gs2-type-tag">Wholesaler</span>
                            </div>
                            <div className="product-name" style={{ marginTop: 6 }}>
                              {p.name}
                            </div>
                            <div className="product-subline">
                              <span>Case: {variant.casePcs} pc</span>
                            </div>
                          </div>
                          <button
                            className="product-img"
                            onClick={() => onSelectProduct?.(p)}
                            aria-label={`View ${p.name}`}
                          >
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} />
                            ) : (
                              <span style={{ fontSize: 30 }}>{p.image}</span>
                            )}
                          </button>
                        </div>

                        <div className="variant-pills">
                          {p.variants.map((v: any) => (
                            <button
                              key={v.id}
                              className={`variant-pill ${v.id === variant.id ? 'active' : ''}`}
                            >
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
                          <button className="discounts-btn-filled" onClick={() => onSelectProduct?.(p)}>
                            Discounts <Icon.ChevronDown />
                          </button>
                          <button className="add-btn compact" onClick={() => onSelectProduct?.(p)}>
                            <Icon.Plus /> Add
                          </button>
                        </div>

                        <div className="reorder-delivery-line">
                          <Icon.Truck size={14} /> Delivery by Sunday
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* No results */}
        {q && !hasAnyMatch && (
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
