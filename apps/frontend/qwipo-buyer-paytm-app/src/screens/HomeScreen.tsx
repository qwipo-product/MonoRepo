import { useEffect, useState } from 'react';
import { Bell, User, MapPin, ChevronDown, Search, ArrowRight, ClipboardList } from 'lucide-react';
import { cn } from '@mockups/ui';
import type { Navigate } from '../nav';
import { BrandLogo } from '../components/BrandLogo';
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
} from '../data/home';

const rail = 'flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function HomeScreen({
  deliveryLabel = 'Sri Venkateswara Kirana Store',
  availability = 'both',
  onNavigate,
  salesperson = false,
}: {
  deliveryLabel?: string;
  availability?: 'both' | 'distributors' | 'wholesalers';
  onNavigate: Navigate;
  /** Salesperson persona → show the beat-day task shortcut in the header. */
  salesperson?: boolean;
}) {
  const [tab, setTab] = useState<'distributors' | 'wholesalers'>('distributors');

  // Availability at the selected address decides which tabs are open. The
  // unavailable one shows "Coming Soon"; the active tab always resolves to an
  // available one. No vendors of a kind is the same situation as an address that kind doesn't
  // serve: block the tab and mark it Coming Soon, rather than opening it onto an
  // empty page. The other tab becomes the active one.
  const distributors = DISTRIBUTORS;
  const wholesalerL1 = WHOLESALER_L1;
  const distAvailable = availability !== 'wholesalers' && distributors.length > 0;
  const wholeAvailable = availability !== 'distributors' && wholesalerL1.length > 0;
  const effectiveTab = !distAvailable ? 'wholesalers' : !wholeAvailable ? 'distributors' : tab;

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto pb-6">
      {/* sticky header */}
      <div className="sticky top-0 z-10 bg-card shadow-sm">
        <div className="flex items-center gap-3 px-4 pt-3">
          <img src="/brand/qwipo-logo.svg" alt="Qwipo" className="h-6 shrink-0 dark:hidden" />
          <img src="/brand/qwipo-logo-dark.svg" alt="Qwipo" aria-hidden className="hidden h-6 shrink-0 dark:block" />
          <img src="/brand/digidukaan-logo.svg" alt="Powered by ONDC DigiDukaan" className="mx-auto h-5 shrink-0" />
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
            className="flex w-[100%] items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-sm active:scale-[0.98]"
          >
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <span className="shrink-0 text-primary">Deliver to</span>
            <span className="min-w-0 flex-1 truncate text-left font-medium text-foreground">{deliveryLabel}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-foreground-secondary" />
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
            img="/home-category-cards/distributors.png"
            label="Authorized Distributors"
            onClick={() => setTab('distributors')}
          />
          <TabButton
            active={effectiveTab === 'wholesalers'}
            disabled={!wholeAvailable}
            img="/home-category-cards/wholesalers.png"
            label="Wholesalers"
            onClick={() => setTab('wholesalers')}
          />
        </div>
      </div>

      <div className="mt-4 space-y-6">
        <BannerCarousel banners={HERO_BANNERS} onOpen={() => onNavigate('listing')} />

        {effectiveTab === 'distributors' ? (
          <>
            <section className="space-y-3">
              <SectionHeader title="Distributors" onSeeAll={() => onNavigate('distributors-list', { tab: 'sellers' })} />
              <div className={rail}>
                {distributors.map((d) => (
                  <button key={d.id} onClick={() => onNavigate('storefront', { backTo: 'home', distributor: d })} className="flex w-28 shrink-0 flex-col gap-1.5 text-center">
                    <BrandLogo src={d.logo} alt={d.title} className="h-28 w-28 rounded-lg border border-border shadow-sm" />
                    <div className="truncate text-sm font-medium">{d.title}</div>
                    <div className="truncate text-xs text-foreground-secondary">{d.short}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <SectionHeader title="Categories" onSeeAll={() => onNavigate('distributors-list', { tab: 'categories' })} />
              <div className={rail}>
                {DIST_CATEGORIES.map((c) => (
                  <CategoryTile
                    key={c.id}
                    cat={c}
                    onClick={() => onNavigate('listing', { applied: [{ type: 'category', value: c.name }], backTo: 'home' })}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <SectionHeader title="All Brands" onSeeAll={() => onNavigate('distributors-list', { tab: 'brands' })} />
              <div className="grid grid-cols-4 gap-3 px-4">
                {BRANDS.slice(0, 8).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onNavigate('listing', { applied: [{ type: 'brand', value: b.name }], backTo: 'home' })}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <BrandLogo src={b.logo} alt={b.name} className="h-14 w-14 rounded-full border border-border shadow-sm" />
                    <div className="w-full truncate text-center text-xs">{b.name}</div>
                  </button>
                ))}
              </div>
            </section>
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
                    onClick={() => onNavigate('wholesaler-categories', { tab: 'categories' })}
                    className="flex flex-col gap-2"
                  >
                    <span className="grid aspect-[2/1] w-full place-items-center overflow-hidden rounded-lg bg-muted">
                      <img src={encodeURI(c.image)} alt={c.name} className="h-full w-full object-cover" />
                    </span>
                    <div className="text-center text-sm font-medium">{c.name}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Exclusive offers — promo KPIs */}
            <section className="space-y-3">
              <SectionHeader title="Exclusive offers" />
              <div className={rail}>
                {WHOLESALER_OFFERS.map((o) => (
                  <OfferCard
                    key={o.id}
                    offer={o}
                    onClick={() => onNavigate('wholesaler-products', { applied: [{ type: 'brand', value: o.brand }], backTo: 'home' })}
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
                    onClick={() => onNavigate('wholesaler-products', { applied: [{ type: 'category', value: c.name }], backTo: 'home' })}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <SectionHeader title="All Brands" onSeeAll={() => onNavigate('wholesaler-categories', { tab: 'brands' })} />
              <div className="grid grid-cols-4 gap-3 px-4">
                {BRANDS.slice(0, 8).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onNavigate('wholesaler-products', { applied: [{ type: 'brand', value: b.name }], backTo: 'home' })}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <BrandLogo src={b.logo} alt={b.name} className="h-14 w-14 rounded-full border border-border shadow-sm" />
                    <div className="w-full truncate text-center text-xs">{b.name}</div>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <img src="/home-footer-block.png" alt="Powered by ONDC DigiDukaan" className="mt-6 w-full" />
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
        {disabled && <span className="mt-0.5 block text-[10px] text-foreground-tertiary">Coming Soon</span>}
      </span>
    </button>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-sm font-medium text-primary">
          See all
        </button>
      )}
    </div>
  );
}

const OFFER_TONE: Record<HomeOffer['tone'], string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-subtle text-success-foreground',
  warning: 'bg-warning-subtle text-warning-foreground',
};

function OfferCard({ offer, onClick }: { offer: HomeOffer; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex h-40 w-52 shrink-0 flex-col rounded-lg p-3 text-left', OFFER_TONE[offer.tone])}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-base font-bold leading-tight">{offer.headline}</div>
        <div className="shrink-0 text-2xl leading-none">{offer.emoji}</div>
      </div>
      <div className="mt-auto">
        <div className="text-sm font-semibold text-foreground">{offer.brand}</div>
        <div className="truncate text-xs text-foreground-secondary">{offer.sub}</div>
        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold">
          Shop now <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}

function CategoryTile({ cat, onClick }: { cat: HomeCategory; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-28 shrink-0 flex-col items-center gap-1.5">
      <span className="grid aspect-[2/1] w-full place-items-center overflow-hidden rounded-lg bg-muted">
        <img src={encodeURI(cat.image)} alt={cat.name} className="h-full w-full object-cover" />
      </span>
      <div className="w-full truncate text-center text-xs">{cat.name}</div>
    </button>
  );
}

function BannerCarousel({ banners, onOpen }: { banners: string[]; onOpen: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % banners.length), 3500);
    return () => clearInterval(t);
  }, [banners.length]);
  return (
    <div className="px-4">
      <button onClick={onOpen} aria-label="Open offers" className="block w-full overflow-hidden rounded-lg">
        <img src={encodeURI(banners[i])} alt="" className="h-40 w-full object-cover" />
      </button>
      <div className="mt-2 flex justify-center gap-1.5">
        {banners.map((_, j) => (
          <span
            key={j}
            className={cn('h-1.5 rounded-full transition-all', j === i ? 'w-4 bg-primary' : 'w-1.5 bg-foreground-secondary/30')}
          />
        ))}
      </div>
    </div>
  );
}
