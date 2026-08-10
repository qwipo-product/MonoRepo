import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
import { SegmentedControl } from '@mockups/ui';
import type { ScreenId } from '../review/screenIndex';
import type { Navigate } from '../nav';
import { BrandLogo } from '../components/BrandLogo';
import { SearchField } from '../components/SearchField';
import type { HomeCategory, HomeBrand, Distributor } from '../data/home';

/* SellerBrowseScreen — one browse surface reused by Distributors (Categories /
   Brands / Sellers) and Wholesalers (Categories / Brands). Tabs, copy and data
   are passed in, so the two pages can't drift apart. */

export type BrowseTab = 'categories' | 'brands' | 'sellers';

const TAB_LABEL: Record<BrowseTab, string> = { categories: 'Categories', brands: 'Brands', sellers: 'Sellers' };
const PLACEHOLDER: Record<BrowseTab, string> = {
  categories: 'Search categories',
  brands: 'Search brands',
  sellers: 'Search sellers',
};

export function SellerBrowseScreen({
  title,
  subtitle,
  tabs,
  categories,
  brands,
  sellers = [],
  productListId = 'listing',
  selfId,
  initialTab,
  onBack,
  onNavigate,
}: {
  title: string;
  subtitle: string;
  tabs: BrowseTab[];
  categories: HomeCategory[];
  brands: HomeBrand[];
  sellers?: Distributor[];
  /** Where a category/brand tap goes (distributor vs wholesaler product list). */
  productListId?: ScreenId;
  /** This screen's own id — used as the Back target for product-list links. */
  selfId: ScreenId;
  /** Tab to open on (from a "See all Brands/Categories/Sellers" link). */
  initialTab?: BrowseTab;
  onBack: () => void;
  onNavigate: Navigate;
}) {
  const [tab, setTab] = useState<BrowseTab>(initialTab && tabs.includes(initialTab) ? initialTab : tabs[0]);
  // Re-sync when a new "See all" link picks a different tab for the same surface.
  useEffect(() => {
    setTab(initialTab && tabs.includes(initialTab) ? initialTab : tabs[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const catList = useMemo(() => (q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories), [q, categories]);
  const brandList = useMemo(() => (q ? brands.filter((b) => b.name.toLowerCase().includes(q)) : brands), [q, brands]);
  const sellerList = useMemo(() => (q ? sellers.filter((d) => d.title.toLowerCase().includes(q)) : sellers), [q, sellers]);

  const active = tab === 'categories' ? catList : tab === 'brands' ? brandList : sellerList;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border bg-card shadow-sm">
        <header className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
            <p className="text-xs text-foreground-secondary">{subtitle}</p>
          </div>
        </header>

        <div className="px-4">
          <SegmentedControl<BrowseTab>
            options={tabs.map((t) => ({ value: t, label: TAB_LABEL[t] }))}
            value={tab}
            onChange={setTab}
          />
        </div>

        <div className="px-4 pb-3 pt-3">
          <SearchField value={query} onChange={setQuery} placeholder={PLACEHOLDER[tab]} />
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto bg-background-subtle p-4">
        {active.length === 0 ? (
          <p className="py-12 text-center text-sm text-foreground-secondary">
            No {tab} match “{query}”.
          </p>
        ) : tab === 'categories' ? (
          <div className="grid grid-cols-2 gap-3">
            {catList.map((c) => (
              <button
                key={c.id}
                onClick={() => onNavigate(productListId, { applied: [{ type: 'category', value: c.name }], backTo: selfId })}
                className="flex flex-col gap-2 text-left active:scale-[0.99]"
              >
                <span className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                  <img src={encodeURI(c.image)} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="truncate px-0.5 text-center text-sm font-medium text-foreground">{c.name}</span>
              </button>
            ))}
          </div>
        ) : tab === 'brands' ? (
          <div className="grid grid-cols-4 gap-3">
            {brandList.map((b) => (
              <button
                key={b.id}
                onClick={() => onNavigate(productListId, { applied: [{ type: 'brand', value: b.name }], backTo: selfId })}
                className="flex flex-col items-center gap-1.5 active:scale-[0.98]"
              >
                <BrandLogo src={b.logo} alt={b.name} className="h-16 w-16 rounded-full border border-border shadow-sm" />
                <span className="w-full truncate text-center text-xs text-foreground">{b.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sellerList.map((d) => (
              <div key={d.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <button
                  onClick={() => onNavigate('storefront', { backTo: selfId })}
                  aria-label={`Open ${d.title} storefront`}
                  className="flex w-full items-center gap-3 p-3 text-left active:scale-[0.99]"
                >
                  <BrandLogo src={d.logo} alt={d.title} className="h-12 w-12 shrink-0 rounded-lg border border-border" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{d.title}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-success-foreground">
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0" /> Verified seller
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-foreground-secondary">{brands.length} brands</span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-foreground-secondary" />
                </button>
                <div className="no-scrollbar flex gap-3 overflow-x-auto border-t border-border px-3 py-2.5">
                  {brands.slice(0, 6).map((b) => (
                    <BrandLogo
                      key={b.id}
                      src={b.logo}
                      alt={b.name}
                      className="h-10 w-10 shrink-0 rounded-full border border-border"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
