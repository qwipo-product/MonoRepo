import { Bell, User, MapPin, ChevronDown, Search, ClipboardList } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@mockups/ui';
import type { Navigate } from '../nav';
import type { ScreenId } from '../review/screenIndex';
import { BrandLogo } from '../components/BrandLogo';
import { BrandTile } from '../components/BrandTile';
import { CarouselDots } from '../components/CarouselDots';
import { useAutoAdvance } from '../components/useAutoAdvance';
import { ProductTeaserRail } from '../components/ProductTeaserRail';
import {
  HERO_BANNERS,
  DISTRIBUTORS,
  DIST_CATEGORIES,
  BRANDS,
  WHOLESALER_CATEGORIES,
  WHOLESALER_L1,
  WHOLESALER_OFFERS,
  type HomeCategory,
  type HomeOffer,
  type WholesalerL1,
} from '../data/home';
import { previouslyOrdered } from '../data/reorder';
import { trendingNearby } from '../data/trending';

const rail = 'flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

/* ITC's store router — it works out whether the buyer is on Android or iOS and
   sends them to the right store, so the app doesn't have to. */
const ITC_APP_LINK = 'https://onestore.link/ymb4cy';

/* Each level-1 group has its own screen: Groceries and FMCG are separate
   trades, so the two lists never share a page. */
const L1_SCREEN: Record<WholesalerL1, ScreenId> = {
  Groceries: 'wholesaler-groceries',
  FMCG: 'wholesaler-fmcg',
};

export function HomeScreen({
  deliveryLabel = 'Sri Venkateswara Kirana Store',
  availability = 'both',
  tab,
  onTabChange,
  onNavigate,
  onOpenSheet,
  onOpenWholesaleSheet,
  sheetOpen = false,
  salesperson = false,
  notice,
}: {
  /** Account-level message above the banners (e.g. KYC Pending). */
  notice?: ReactNode;
  deliveryLabel?: string;
  availability?: 'both' | 'distributors' | 'wholesalers';
  /* Which side the buyer is shopping. App.tsx holds it rather than this
     screen, so coming back from a wholesale category — or from anywhere else
     the buyer drilled into — lands on the tab they left from, not on
     Distributors again. */
  tab: 'distributors' | 'wholesalers';
  onTabChange: (tab: 'distributors' | 'wholesalers') => void;
  onNavigate: Navigate;
  /** A tapped product rail card opens that SKU's add-to-cart sheet — the
   *  distributor one or the vendor one, depending on the tab it's on. */
  onOpenSheet: (id: string) => void;
  onOpenWholesaleSheet: (id: string) => void;
  /** True while either add-to-cart sheet is up, so the product rails hold
   *  still behind it — and for five seconds after it closes, so the card the
   *  buyer came back to is still where they left it. */
  sheetOpen?: boolean;
  /** Salesperson persona → show the beat-day task shortcut in the header. */
  salesperson?: boolean;
}) {

  // Availability at the selected address decides which tabs are open. The
  // unavailable one shows "Coming Soon"; the active tab always resolves to an
  // available one. No vendors of a kind is the same situation as an address that kind doesn't
  // serve: block the tab and mark it Coming Soon, rather than opening it onto an
  // empty page. The other tab becomes the active one.
  const distributors = DISTRIBUTORS;
  /* Repeat buys, one rail per side of the catalogue — a distributor tab
     never surfaces a wholesaler line, or the other way round. */
  const prevOrderedDistributor = previouslyOrdered('distributor');
  const prevOrderedWholesaler = previouslyOrdered('wholesaler');
  /* What the neighbourhood is buying, as opposed to what this buyer bought —
     same rail, ranked on orders placed in the delivering pincode. */
  const trendingDistributor = trendingNearby('distributor');
  const trendingWholesaler = trendingNearby('wholesaler');
  const wholesalerL1 = WHOLESALER_L1;
  const distAvailable = availability !== 'wholesalers' && distributors.length > 0;
  const wholeAvailable = availability !== 'distributors' && wholesalerL1.length > 0;
  const effectiveTab = !distAvailable ? 'wholesalers' : !wholeAvailable ? 'distributors' : tab;

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto">
      {/* sticky header */}
      <div className="sticky top-0 z-10 bg-card shadow-sm">
        <div className="flex items-center gap-3 px-4 pt-3">
          <img src="./brand/qwipo-logo.svg" alt="Qwipo" className="h-6 shrink-0 dark:hidden" />
          <img src="./brand/qwipo-logo-dark.svg" alt="Qwipo" aria-hidden className="hidden h-6 shrink-0 dark:block" />
          <img src="./brand/digidukaan-logo.svg" alt="Powered by ONDC DigiDukaan" className="mx-auto h-5 shrink-0" />
          <div className="flex items-center gap-2">
            {salesperson && (
              <button
                onClick={() => onNavigate('sp:tasks')}
                aria-label="My tasks"
                className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground active:scale-[0.98]"
              >
                <ClipboardList className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
              </button>
            )}
            <button
              onClick={() => onNavigate('notifications')}
              aria-label="Notifications"
              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground active:scale-[0.98]"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error ring-2 ring-card" />
            </button>
            <button
              onClick={() => onNavigate('profile')}
              aria-label="Profile"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground active:scale-[0.98]"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-1 pt-1">
          <button
            onClick={() => onNavigate('sub:addresses')}
            aria-label="Change delivery address"
            /* Sized to the address, not to the row: `w-fit` lets a short one
               keep the pill short, `max-w-full` stops a long one running past
               the search bar below, and the name truncates only once it has
               actually run out of room. */
            className="flex w-fit max-w-full items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1 text-xs active:scale-[0.98]"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="shrink-0 text-primary">Deliver to</span>
            <span className="min-w-0 truncate text-left font-medium text-foreground">
              {deliveryLabel}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground-secondary" />
          </button>
        </div>

        <div className="px-4 pb-2">
          <button
            onClick={() => onNavigate('global-search')}
            aria-label="Search for Products"
            className="flex h-11 w-full items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-foreground-secondary"
          >
            <Search className="h-5 w-5 text-primary" />
            Search for Products
          </button>
        </div>

        <div className="flex gap-2 px-4 pb-3">
          <TabButton
            active={effectiveTab === 'distributors'}
            disabled={!distAvailable}
            img="./home-category-cards/distributors.png"
            label="Authorized Distributors"
            onClick={() => onTabChange('distributors')}
          />
          <TabButton
            active={effectiveTab === 'wholesalers'}
            disabled={!wholeAvailable}
            img="./home-category-cards/wholesalers.png"
            label="Wholesalers"
            onClick={() => onTabChange('wholesalers')}
          />
        </div>
      </div>

      <div className="mt-4 space-y-6">
        {notice && <div className="px-4">{notice}</div>}
        <BannerCarousel banners={HERO_BANNERS} onOpen={() => onNavigate('listing')} />

        {/* Keyed by tab, so switching sides animates in rather than
            swapping under the thumb. The banner above is outside it and
            keeps running. */}
        <div key={effectiveTab} className="animate-screen space-y-6">
        {effectiveTab === 'distributors' ? (
          <>
            <section className="space-y-3">
              <SectionHeader title="Distributors" onSeeAll={() => onNavigate('distributors-list', { tab: 'sellers' })} />
              <div className={rail}>
                {distributors.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onNavigate('storefront', { distributor: d })}
                    className="w-24 shrink-0 rounded-lg border border-border bg-card p-1.5 text-center shadow-sm active:scale-[0.98]"
                  >
                    {/* No frame of its own: the card already draws one around
                        the mark and the two lines, and a second outline just
                        inside it read as a box in a box. */}
                    <BrandLogo
                      src={d.logo}
                      alt={d.title}
                      className="aspect-square w-full rounded"
                      imgClassName="p-0 scale-110"
                    />
                    <div className="mt-1.5 truncate text-xs font-semibold text-foreground">{d.title}</div>
                    <div className="truncate text-xs text-foreground-secondary">{d.name}</div>
                  </button>
                ))}
              </div>
            </section>

            {prevOrderedDistributor.length > 0 && (
              <section className="space-y-3">
                <SectionHeader
                  title="Previously Ordered"
                  onSeeAll={() => onNavigate('reorder')}
                />
                <ProductTeaserRail items={prevOrderedDistributor} onOpen={onOpenSheet} paused={sheetOpen} />
              </section>
            )}

            <section className="space-y-3">
              <SectionHeader title="Categories" onSeeAll={() => onNavigate('distributors-list', { tab: 'categories' })} />
              <div className={rail}>
                {DIST_CATEGORIES.map((c) => (
                  <CategoryTile
                    key={c.id}
                    cat={c}
                    onClick={() => onNavigate('listing', { applied: [{ type: 'category', value: c.name }] })}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <SectionHeader title="All Brands" onSeeAll={() => onNavigate('distributors-list', { tab: 'brands' })} />
              <div className="grid grid-cols-4 gap-3 px-4">
                {BRANDS.slice(0, 8).map((b) => (
                  <BrandTile
                    key={b.id}
                    name={b.name}
                    logo={b.logo}
                    onClick={() => onNavigate('listing', { applied: [{ type: 'brand', value: b.name }] })}
                  />
                ))}
              </div>
            </section>

            {trendingDistributor.length > 0 && (
              <section className="space-y-3">
                <SectionHeader
                  title="Trending Products"
                  onSeeAll={() => onNavigate('listing')}
                />
                <ProductTeaserRail items={trendingDistributor} onOpen={onOpenSheet} paused={sheetOpen} />
              </section>
            )}

            {/* ITC's own placement — a fixed banner, not part of the hero rail,
                so it holds its spot under Trending rather than scrolling past.
                It leaves the app: the link is a store router that sends the
                buyer to Play or App Store for whichever phone they're on. */}
            <div className="px-4">
              {/* The radius and the clipping live on the container, not the
                  picture, so the artwork simply fills it and the corners are
                  cut cleanly — the same 12px the product cards use. */}
              <a
                href={ITC_APP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg shadow-sm active:scale-[0.99]"
              >
                <img
                  src="./app-banners/itc-shop-from-itc.jpg"
                  alt="Shop from ITC"
                  className="block w-full"
                />
              </a>
            </div>
          </>
        ) : (
          <>
            {/* Level-1 categories — Groceries · FMCG */}
            <section className="space-y-3">
              <SectionHeader title="Categories" />
              <div className="grid grid-cols-2 gap-3 px-4">
                {wholesalerL1.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onNavigate(L1_SCREEN[c.l1])}
                    className="flex flex-col gap-2"
                  >
                    <span className="grid w-full place-items-center overflow-hidden rounded-lg bg-muted">
                      <img src={encodeURI(c.image)} alt={c.name} className="aspect-[400/268] w-full object-cover" />
                    </span>
                    <div className="text-center text-xs text-foreground">{c.name}</div>
                  </button>
                ))}
              </div>
            </section>

            {prevOrderedWholesaler.length > 0 && (
              <section className="space-y-3">
                <SectionHeader
                  title="Previously Ordered"
                  onSeeAll={() => onNavigate('reorder')}
                />
                <ProductTeaserRail items={prevOrderedWholesaler} onOpen={onOpenWholesaleSheet} paused={sheetOpen} />
              </section>
            )}

            {/* Exclusive offers — promo KPIs */}
            <section className="space-y-3">
              <SectionHeader title="Exclusive offers" />
              <div className={rail}>
                {WHOLESALER_OFFERS.map((o) => (
                  <OfferCard
                    key={o.id}
                    offer={o}
                    onClick={() => onNavigate('wholesaler-products', { applied: [{ type: 'brand', value: o.brand }] })}
                  />
                ))}
              </div>
            </section>

            {/* Categories & Brands — same structure as Distributors */}
            <section className="space-y-3">
              <SectionHeader title="Top categories" onSeeAll={() => onNavigate('wholesaler-categories', { tab: 'categories' })} />
              <div className={rail}>
                {WHOLESALER_CATEGORIES.map((c) => (
                  <CategoryTile
                    key={c.id}
                    cat={c}
                    onClick={() => onNavigate('wholesaler-products', { applied: [{ type: 'category', value: c.name }] })}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <SectionHeader title="All Brands" onSeeAll={() => onNavigate('wholesaler-categories', { tab: 'brands' })} />
              <div className="grid grid-cols-4 gap-3 px-4">
                {BRANDS.slice(0, 8).map((b) => (
                  <BrandTile
                    key={b.id}
                    name={b.name}
                    logo={b.logo}
                    onClick={() => onNavigate('wholesaler-products', { applied: [{ type: 'brand', value: b.name }] })}
                  />
                ))}
              </div>
            </section>

            {trendingWholesaler.length > 0 && (
              <section className="space-y-3">
                <SectionHeader
                  title="Trending Products"
                  onSeeAll={() => onNavigate('wholesaler-products')}
                />
                <ProductTeaserRail items={trendingWholesaler} onOpen={onOpenWholesaleSheet} paused={sheetOpen} />
              </section>
            )}
          </>
        )}
        </div>
      </div>

      <img src="./home-footer-block.png" alt="Powered by ONDC DigiDukaan" className="mt-6 w-full" />
    </div>
  );
}

function TabButton({
  active,
  disabled,
  img,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  img: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={cn(
        'flex flex-1 items-center gap-2 rounded-lg border p-2 text-left transition-colors',
        disabled ? 'border-border bg-card opacity-70' : active ? 'border-primary bg-card' : 'border-border bg-card'
      )}
    >
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-muted',
          disabled && 'grayscale'
        )}
      >
        <img src={img} alt="" className="h-full w-full object-cover" />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block text-xs font-medium leading-tight',
            disabled ? 'text-foreground-secondary' : active ? 'text-primary' : 'text-foreground'
          )}
        >
          {label}
        </span>
        {disabled && <span className="mt-0.5 block text-2xs text-foreground-tertiary">Coming Soon</span>}
      </span>
    </button>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-sm font-medium text-primary">
          See all
        </button>
      )}
    </div>
  );
}

/* The promotion is the artwork — no type of ours on top of it, so the tile is
   the picture and nothing else. Square, the size the tiles already were. */
function OfferCard({ offer, onClick }: { offer: HomeOffer; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={offer.label}
      className="h-30 w-30 shrink-0 overflow-hidden rounded-lg active:scale-[0.98]"
    >
      <img src={encodeURI(offer.image)} alt="" className="h-full w-full object-cover" />
    </button>
  );
}

function CategoryTile({ cat, onClick }: { cat: HomeCategory; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-28 shrink-0 flex-col items-center gap-1.5">
      <span className="grid w-full place-items-center overflow-hidden rounded-lg bg-muted">
        <img src={encodeURI(cat.image)} alt={cat.name} className="aspect-[400/268] w-full object-cover" />
      </span>
      <div className="w-full truncate text-center text-xs">{cat.name}</div>
    </button>
  );
}

/** How long each banner holds before the rail advances. The active dot's
 *  fill runs for exactly this long, so the bar reaching its end and the
 *  banner moving are the same moment. */
const ADVANCE_MS = 3000;

function BannerCarousel({ banners, onOpen }: { banners: string[]; onOpen: () => void }) {
  const { index, autoplay, fillRef, railProps } = useAutoAdvance(banners.length, ADVANCE_MS);
  return (
    <div className="px-4">
      <div {...railProps} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-lg">
        {banners.map((b, j) => (
          <button key={j} onClick={onOpen} aria-label="Open offers" className="w-full shrink-0 snap-start">
            <img src={encodeURI(b)} alt="" className="h-40 w-full object-cover" />
          </button>
        ))}
      </div>
      <CarouselDots count={banners.length} index={index} autoplay={autoplay} fillRef={fillRef} />
    </div>
  );
}
