import { useMemo, useState } from 'react';
import { ChevronRight, Truck } from 'lucide-react';
import { homepage } from '../data';
import { useAvailable } from '../data/availability';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';
import SearchField from '../components/SearchField';
import ToggleTabs from '../components/ToggleTabs';
import Logo from '../components/Logo';

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

  // Location-serviceable sellers only (mirrors bms per-location home bootstrap).
  const { distributors, sellers: availSellers } = useAvailable();
  const distributorCategories = homepage.distributorCategories as any[];
  const findDistributor = (name: string) => distributors.find((d: any) => d.name.toLowerCase() === name.toLowerCase());

  const allBrands = useMemo(() => {
    const seen = new Set<string>();
    const out: any[] = [];
    availSellers.forEach((d: any) => d.brands.forEach((b: any) => {
      if (seen.has(b.id)) return;
      seen.add(b.id);
      out.push(b);
    }));
    return out;
  }, [availSellers]);

  const filteredCategories = q ? distributorCategories.filter((c) => c.name.toLowerCase().includes(q)) : distributorCategories;
  const filteredBrands = q ? allBrands.filter((b) => (b.short || b.name || '').toLowerCase().includes(q)) : allBrands;
  const sellerPool = filterDistributorIds ? availSellers.filter((d: any) => filterDistributorIds.includes(d.id)) : availSellers;
  const filteredSellers = q
    ? sellerPool.filter((d) => d.name.toLowerCase().includes(q) || d.brands.some((b: any) => (b.short || b.name || '').toLowerCase().includes(q)))
    : sellerPool;

  const placeholder = { categories: 'Search categories', brands: 'Search brands', sellers: 'Search sellers or brands' }[tab];

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card pb-3 shadow-sm">
        <StatusBar />
        <ScreenHeader title="Authorised Distributors" subtitle="Verified sellers near you" onBack={onBack} />
        <ToggleTabs
          tabs={[{ key: 'categories', label: 'Categories' }, { key: 'brands', label: 'Brands' }, { key: 'sellers', label: 'Sellers' }]}
          active={tab}
          onChange={(k) => setTab(k as TabKey)}
        />
        <div className="mt-3">
          <SearchField value={query} onChange={setQuery} placeholder={placeholder} onClear={() => setQuery('')} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        {tab === 'categories' && (
          filteredCategories.length === 0 ? (
            <Empty q={query} what="categories" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredCategories.map((c) => (
                <button key={c.id} onClick={() => onSelectCategory?.(c)} className="flex flex-col gap-2 text-left">
                  <div className="h-28 w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                  <div className="truncate px-0.5 text-sm font-medium">{c.name}</div>
                </button>
              ))}
            </div>
          )
        )}

        {tab === 'brands' && (
          filteredBrands.length === 0 ? (
            <Empty q={query} what="brands" />
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {filteredBrands.map((b) => (
                <button key={b.id} onClick={() => onSelectBrand?.(b)} className="flex flex-col items-center gap-1.5">
                  <Logo src={b.logo} text={b.initials} color={b.bg} className="h-16 w-16 rounded-full border border-border" />
                  <div className="w-full truncate text-center text-xs">{b.short || b.name}</div>
                </button>
              ))}
            </div>
          )
        )}

        {tab === 'sellers' && (
          filteredSellers.length === 0 ? (
            <Empty q={query} what="sellers" />
          ) : (
            <div className="space-y-3">
              {filteredSellers.map((d) => {
                const full = findDistributor(d.name) || { id: d.id, name: d.name, shortName: d.name, featuredColor: '#FEF3C7', isAuthorised: true };
                return (
                  <div key={d.id} className="rounded-xl border border-border bg-card shadow-sm">
                    <button
                      onClick={() => onSelectDistributor?.({ ...full, deliveryWindows: d.deliveryWindows })}
                      aria-label={`Open ${d.name} storefront`}
                      className="flex w-full items-center gap-2 border-b border-border p-3 text-left"
                    >
                      <span className="flex-1 truncate text-sm font-semibold">{d.name}</span>
                      <span className="text-xs text-muted-foreground">{d.brands.length} brands</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {d.deliveryWindows?.length > 0 && (
                      <div className="border-b border-border px-3 py-2">
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Truck className="h-3.5 w-3.5" /> Delivery schedule
                        </div>
                        {d.deliveryWindows.map((w: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span>{w.day}</span>
                            <span className="text-muted-foreground">MOV ₹{w.mov.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {d.brands.map((b: any) => (
                        <button key={b.id} onClick={() => onSelectBrand?.(b, full)} className="flex w-14 shrink-0 flex-col items-center gap-1">
                          <Logo src={b.logo} text={b.initials} color={b.bg} className="h-12 w-12 rounded-full border border-border" />
                          <span className="w-full truncate text-center text-[10px]">{b.short || b.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Empty({ q, what }: { q: string; what: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">No {what} match "{q}".</p>;
}
