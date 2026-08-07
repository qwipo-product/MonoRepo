import { useMemo, useState } from 'react';
import { Icon, StatusBar } from '../components/Icons';
import {
  distributorsList,
  distributors,
  distributorCategories,
} from '@mockups/mock-data';

type TabKey = 'categories' | 'brands' | 'sellers';

export default function DistributorsListScreen({
  onBack,
  onSelectBrand,
  onSelectDistributor,
  onSelectCategory,
  initialTab,
  filterDistributorIds,
}: any) {
  const [tab, setTab] = useState<TabKey>((initialTab as TabKey) || 'categories');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  // Find the full Distributor record (mov, location, skuCount) by name match so
  // tapping the header row opens the right storefront with rich seller data.
  const findDistributor = (name: string) =>
    distributors.find((d) => d.name.toLowerCase() === name.toLowerCase());

  // Union of every brand across every distributor in this list, de-duplicated
  // by id. Drives the Brands tab so taps land on the cumulative brand pool.
  const allBrands = useMemo(() => {
    const seen = new Set<string>();
    const out: any[] = [];
    distributorsList.forEach((d: any) => {
      d.brands.forEach((b: any) => {
        if (seen.has(b.id)) return;
        seen.add(b.id);
        out.push(b);
      });
    });
    return out;
  }, []);

  // Page-level search filters whichever tab is active.
  const filteredCategories = q
    ? distributorCategories.filter((c: any) => c.name.toLowerCase().includes(q))
    : distributorCategories;
  const filteredBrands = q
    ? allBrands.filter((b: any) => (b.short || b.name || '').toLowerCase().includes(q))
    : allBrands;
  // Optionally narrow the seller list to a specific set (Add More from cart,
  // or tapping a brand on Home lands here filtered to who stocks it).
  const sellerPool = filterDistributorIds
    ? distributorsList.filter((d: any) => filterDistributorIds.includes(d.id))
    : distributorsList;
  const filteredSellers = q
    ? sellerPool.filter((d: any) =>
        d.name.toLowerCase().includes(q) ||
        d.brands.some((b: any) => (b.short || b.name || '').toLowerCase().includes(q))
      )
    : sellerPool;

  const placeholderByTab: Record<TabKey, string> = {
    categories: 'Search categories',
    brands: 'Search brands',
    sellers: 'Search sellers or brands',
  };

  return (
    <>
      <StatusBar />
      <div className="screen-body">
        {/* Sticky cluster: header + tabs + page-level search stay pinned. */}
        <div className="dl-sticky-top">
          <div className="top-bar">
            <button className="icon-btn" onClick={onBack}>
              <Icon.Back />
            </button>
            <div className="top-title">
              <h1>Authorised Distributors</h1>
            </div>
          </div>

          {/* Three-tab segmented control */}
          <div className="toggle-tabs">
            {(['categories', 'brands', 'sellers'] as TabKey[]).map((key) => (
              <button
                key={key}
                className={`toggle-tab ${tab === key ? 'active' : ''}`}
                onClick={() => setTab(key)}
              >
                {key === 'categories' ? 'Categories' : key === 'brands' ? 'Brands' : 'Sellers'}
              </button>
            ))}
          </div>

          {/* Page-level search — filters whichever tab is active. */}
          <div className="dl-search">
            <span className="dl-search-icon"><Icon.Search /></span>
            <input
              className="dl-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholderByTab[tab]}
            />
          </div>
        </div>

        {tab === 'sellers' && (
          <div className="dl-body">
            {filteredSellers.length === 0 && (
              <div className="dl-empty">No sellers match "{query}".</div>
            )}
            {filteredSellers.map((d: any) => {
              const fullDistributor = findDistributor(d.name) || {
                id: d.id,
                name: d.name,
                shortName: d.name,
                location: '—',
                mov: 5000,
                skuCount: 1000,
                featuredBrand: d.brands[0]?.short || d.brands[0]?.name || '',
                featuredBrandTitle: d.brands[0]?.short || d.brands[0]?.name || '',
                featuredColor: '#FEF3C7',
                isAuthorised: true,
              };
              return (
                <div key={d.id} className="dl-card">
                  <button
                    className="dl-card-head"
                    onClick={() => onSelectDistributor?.({ ...fullDistributor, deliveryWindows: d.deliveryWindows })}
                    aria-label={`Open ${d.name} storefront`}
                  >
                    <span className="dl-card-title">{d.name}</span>
                    <span className="dl-card-count">{d.brands.length} brands</span>
                    <span className="dl-card-arrow">
                      <Icon.ChevronRight />
                    </span>
                  </button>

                  {/* Beat Day + MOV, plus a Tomorrow window with its own MOV
                      when the seller delivers next-day. Read-only schedule —
                      styled as an info strip, not tappable pills. */}
                  {d.deliveryWindows?.length > 0 && (
                    <div className="dl-sched">
                      <div className="dl-sched-label">
                        <Icon.Truck /> Delivery schedule
                      </div>
                      {d.deliveryWindows.map((w: any, i: number) => (
                        <div className="dl-sched-row" key={i}>
                          <span className="dl-sched-day">{w.day}</span>
                          <span className="dl-sched-dots" aria-hidden="true" />
                          <span className="dl-sched-mov">
                            MOV ₹{w.mov.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* All brands in one horizontal scroll row — no collapse. */}
                  <div className="dl-brand-scroll">
                    {d.brands.map((b: any) => (
                      <button
                        key={b.id}
                        className="dl-brand-tile"
                        onClick={() => onSelectBrand?.(b, fullDistributor)}
                      >
                        <div className="dl-brand-circle" style={{ background: b.logo ? '#ffffff' : b.bg }}>
                          {b.logo ? (
                            <img
                              src={b.logo}
                              alt={b.short || b.name}
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement!;
                                parent.style.background = b.bg;
                                parent.innerHTML = `<span>${b.initials}</span>`;
                              }}
                            />
                          ) : (
                            <span>{b.initials}</span>
                          )}
                        </div>
                        <div className="dl-brand-name">{b.short || b.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'categories' && (
          <div className="dl-body dl-tabpane-grid">
            {filteredCategories.length === 0 ? (
              <div className="dl-empty">No categories match "{query}".</div>
            ) : (
              filteredCategories.map((c: any) => (
                <button
                  key={c.id}
                  className="cat-tile cat-tile-grid"
                  onClick={() => onSelectCategory?.(c)}
                >
                  <div className="cat-tile-card">
                    <img src={c.image} alt={c.name} />
                  </div>
                  <div className="cat-tile-name">{c.name}</div>
                </button>
              ))
            )}
          </div>
        )}

        {tab === 'brands' && (
          <div className="dl-body dl-brand-grid dl-brand-grid-all">
            {filteredBrands.length === 0 ? (
              <div className="dl-empty">No brands match "{query}".</div>
            ) : (
              filteredBrands.map((b: any) => (
                <button
                  key={b.id}
                  className="dl-brand-tile"
                  onClick={() => onSelectBrand?.(b)}
                >
                  <div className="dl-brand-circle" style={{ background: b.logo ? '#ffffff' : b.bg }}>
                    {b.logo ? (
                      <img
                        src={b.logo}
                        alt={b.short || b.name}
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.style.display = 'none';
                          const parent = img.parentElement!;
                          parent.style.background = b.bg;
                          parent.innerHTML = `<span>${b.initials}</span>`;
                        }}
                      />
                    ) : (
                      <span>{b.initials}</span>
                    )}
                  </div>
                  <div className="dl-brand-name">{b.short || b.name}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
