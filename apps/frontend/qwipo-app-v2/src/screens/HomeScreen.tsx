import { useEffect, useState } from 'react';
import { Bell, User, MapPin, ChevronDown, Search } from 'lucide-react';
import { cn } from '@mockups/ui';
import type { ScreenId } from '../review/screenIndex';
import { BrandLogo } from '../components/BrandLogo';
import {
  HERO_BANNERS,
  DISTRIBUTORS,
  DIST_CATEGORIES,
  BRANDS,
  WHOLESALER_CATEGORIES,
  type HomeCategory,
} from '../data/home';

const rail = 'flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function HomeScreen({
  deliveryLabel = 'Sri Venkateswara Kirana Store',
  onNavigate,
}: {
  deliveryLabel?: string;
  onNavigate: (id: ScreenId) => void;
}) {
  const [tab, setTab] = useState<'distributors' | 'wholesalers'>('distributors');

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto pb-6">
      {/* sticky header */}
      <div className="sticky top-0 z-10 bg-card shadow-sm">
        <div className="flex items-center gap-3 px-4 pt-3">
          <img src="/brand/qwipo-logo.svg" alt="Qwipo" className="h-6 shrink-0 dark:hidden" />
          <img src="/brand/qwipo-logo-dark.svg" alt="Qwipo" aria-hidden className="hidden h-6 shrink-0 dark:block" />
          <img src="/brand/digidukaan-logo.svg" alt="Powered by ONDC DigiDukaan" className="mx-auto h-5 shrink-0" />
          <div className="flex items-center gap-2">
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

        <div className="px-4 pb-2 pt-2">
          <button
            onClick={() => onNavigate('sub:addresses')}
            aria-label="Change delivery address"
            className="flex w-full items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-2.5 text-sm active:scale-[0.98]"
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
          <TabButton active={tab === 'distributors'} img="/home-category-cards/distributors.png" label="Authorised distributors" onClick={() => setTab('distributors')} />
          <TabButton active={tab === 'wholesalers'} img="/home-category-cards/wholesalers.png" label="Wholesalers" onClick={() => setTab('wholesalers')} />
        </div>
      </div>

      <div className="mt-4 space-y-6">
        <BannerCarousel banners={HERO_BANNERS} onOpen={() => onNavigate('listing')} />

        {tab === 'distributors' ? (
          <>
            <section className="space-y-3">
              <SectionHeader title="Distributors" onSeeAll={() => onNavigate('distributors-list')} />
              <div className={rail}>
                {DISTRIBUTORS.map((d) => (
                  <button key={d.id} onClick={() => onNavigate('storefront')} className="flex w-28 shrink-0 flex-col gap-1.5 text-left">
                    <BrandLogo src={d.logo} alt={d.title} className="h-28 w-28 rounded-lg border border-border shadow-sm" />
                    <div className="truncate text-sm font-medium">{d.title}</div>
                    <div className="truncate text-xs text-foreground-secondary">{d.short}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <SectionHeader title="Categories" onSeeAll={() => onNavigate('wholesaler-categories')} />
              <div className={rail}>
                {DIST_CATEGORIES.map((c) => (
                  <CategoryTile key={c.id} cat={c} onClick={() => onNavigate('listing')} />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <SectionHeader title="All Brands" onSeeAll={() => onNavigate('all-brands')} />
              <div className="grid grid-cols-4 gap-3 px-4">
                {BRANDS.map((b) => (
                  <button key={b.id} onClick={() => onNavigate('listing')} className="flex flex-col items-center gap-1.5">
                    <BrandLogo src={b.logo} alt={b.name} className="h-14 w-14 rounded-full border border-border shadow-sm" />
                    <div className="w-full truncate text-center text-xs">{b.name}</div>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="space-y-3">
              <SectionHeader title="Categories" onSeeAll={() => onNavigate('wholesaler-categories')} />
              <div className="grid grid-cols-2 gap-3 px-4">
                {WHOLESALER_CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => onNavigate('wholesaler-categories')} className="flex flex-col gap-1.5">
                    <span className="grid h-24 place-items-center overflow-hidden rounded-lg bg-muted">
                      <img src={encodeURI(c.image)} alt={c.name} className="h-full w-full object-cover" />
                    </span>
                    <div className="text-sm font-medium">{c.name}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <SectionHeader title="Top Brands" onSeeAll={() => onNavigate('all-brands')} />
              <div className={rail}>
                {BRANDS.map((b) => (
                  <button key={b.id} onClick={() => onNavigate('listing')} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
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

function TabButton({ active, img, label, onClick }: { active: boolean; img: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center gap-2 rounded-lg border p-2 text-left transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-primary'
      )}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
        <img src={img} alt="" className="h-full w-full object-cover" />
      </span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-sm font-medium text-primary">
          See all
        </button>
      )}
    </div>
  );
}

function CategoryTile({ cat, onClick }: { cat: HomeCategory; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-20 shrink-0 flex-col items-center gap-1.5">
      <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-lg bg-muted">
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
