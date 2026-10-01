import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { EmptyState, SegmentedControl } from '@mockups/ui';
import type { ScreenId } from '../review/screenIndex';
import type { Navigate } from '../nav';
import { BrandTile } from '../components/BrandTile';
import { deliveryFooter } from '../components/DeliveryFooter';
import { SearchField } from '../components/SearchField';
import type { HomeCategory, HomeBrand, Distributor } from '../data/home';
import { useEmptyable } from '../review/demoState';

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
  const sellerList = useMemo(() => (q ? sellers.filter((d) => d.name.toLowerCase().includes(q)) : sellers), [q, sellers]);

  const active = useEmptyable<HomeCategory | HomeBrand | Distributor>(
    tab === 'categories' ? catList : tab === 'brands' ? brandList : sellerList
  );

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

        {/* One tab is not a choice — the L1 category screens pass a single
            tab and get the grid without a control above it. */}
        {tabs.length > 1 && (
          <div className="px-4">
            <SegmentedControl<BrowseTab>
              options={tabs.map((t) => ({ value: t, label: TAB_LABEL[t] }))}
              value={tab}
              onChange={setTab}
            />
          </div>
        )}

        <div className="px-4 pb-3 pt-3">
          <SearchField value={query} onChange={setQuery} placeholder={PLACEHOLDER[tab]} />
        </div>
      </div>

      {/* Keyed by tab: the panel animates in on a switch, and the list
          starts at the top rather than at the last tab's scroll offset. */}
      <div key={tab} className="no-scrollbar animate-screen flex-1 overflow-y-auto bg-background-subtle p-4">
        {active.length === 0 ? (
          <EmptyState
            icon={<SearchX strokeWidth={1.75} />}
            title={query ? <>No {tab} match “{query}”</> : `No ${tab} yet`}
            description={
              query
                ? 'Check the spelling, or try a shorter search.'
                : "We're onboarding sellers in your area. Check back soon."
            }
          />
        ) : tab === 'categories' ? (
          <div className="grid grid-cols-2 gap-3">
            {catList.map((c) => (
              <button
                key={c.id}
                onClick={() => onNavigate(productListId, { applied: [{ type: 'category', value: c.name }], backTo: selfId })}
                className="flex flex-col gap-2 text-left active:scale-[0.99]"
              >
                {/* The tile takes its proportions from the shot itself —
                    400x268 — set on the IMAGE rather than the plate, because
                    the plate's 1px border sizes into its aspect and left the
                    picture a hairline short down each side. A literal 400px
                    wide would overflow a 390px phone, so the grid sets the
                    width and the ratio sets the height from it. */}
                <span className="w-full overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                  <img src={encodeURI(c.image)} alt="" className="aspect-[400/268] w-full object-cover" />
                </span>
                <span className="truncate px-0.5 text-center text-sm font-medium text-foreground">{c.name}</span>
              </button>
            ))}
          </div>
        ) : tab === 'brands' ? (
          <div className="grid grid-cols-4 gap-3">
            {brandList.map((b) => (
              <BrandTile
                key={b.id}
                name={b.name}
                logo={b.logo}
                onClick={() => onNavigate(productListId, { applied: [{ type: 'brand', value: b.name }], backTo: selfId })}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sellerList.map((d) => (
              <div key={d.id} className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <button
                  onClick={() => onNavigate('storefront', { backTo: selfId, distributor: d })}
                  aria-label={`Open ${d.name} storefront`}
                  className="flex w-full items-center gap-3 p-3 text-left active:scale-[0.99]"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {d.name}
                  </span>
                  <span className="shrink-0 text-xs text-foreground-secondary">{brands.length} brands</span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-foreground-secondary" />
                </button>
                {/* delivery day(s) + the MOV for each — the same rows the
                    product cards carry, from the one delivery source, so a
                    seller's terms read identically wherever they appear */}
                <div className="px-3 pb-2.5 text-xs text-foreground-secondary">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                    Delivery by
                  </div>
                  {deliveryFooter(d.name, { boxed: true })}
                </div>

                {/* the seller's brands — scrolls sideways, and each one opens
                    that brand's list scoped to THIS seller, since that's the
                    list the buyer means from inside a seller's card */}
                <div className="no-scrollbar flex gap-2.5 overflow-x-auto border-t border-border px-3 py-2.5">
                  {brands.map((b) => (
                    <BrandTile
                      key={b.id}
                      name={b.name}
                      logo={b.logo}
                      ariaLabel={`${b.name} from ${d.name}`}
                      className="w-18 shrink-0"
                      onClick={() =>
                        onNavigate(productListId, {
                          applied: [
                            { type: 'brand', value: b.name },
                            { type: 'distributor', value: d.name },
                          ],
                          backTo: selfId,
                          tab: 'sellers',
                        })
                      }
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
