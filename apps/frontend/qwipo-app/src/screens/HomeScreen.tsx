import { useState } from 'react';
import { Bell, User, MapPin, ChevronDown, Search, Check } from 'lucide-react';
import { useI18n } from '@mockups/i18n';
import { useTheme } from '@mockups/ui';
import { homepage } from '../data';
import BannerCarousel from '../components/BannerCarousel';
import SectionHeader from '../components/SectionHeader';
import Logo from '../components/Logo';

// Everything the home feeds render comes from the one centralized source.
const {
  distributors,
  brands,
  heroBanners,
  wholesalerBanners,
  wholesalerCategories,
  exclusiveOffers,
  categories,
  distributorCategories,
} = homepage;

/* Home hub. Three review variants via `sellerAvailability`:
   both (home) · distributors only · wholesalers only. Bespoke sticky header +
   two tabbed feeds. Header/feeds own their layout; BuyerShell provides the
   status bar + bottom tabs. Parity port of qwipo-buyer-app/HomeScreen. */
export default function HomeScreen({
  sellerAvailability = 'both',
  kycPending,
  onCompleteKyc,
  onOpenNotifications,
  onOpenProfile,
  onOpenAddresses,
  onOpenSearch,
  onSelectDistributor,
  onSelectBrand,
  onSelectDistributorBrand,
  onSelectCategory,
  onSeeAllDistributors,
  onSeeAllBrands,
  onSeeAllCategories,
  onOpenWholesalerCategory,
  onOpenBannerListing,
}: any) {
  const { t } = useI18n();
  const { isDark } = useTheme();
  const distributorsAvailable = sellerAvailability !== 'wholesalers';
  const wholesalersAvailable = sellerAvailability !== 'distributors';
  const [tab, setTab] = useState(distributorsAvailable ? 'distributors' : 'wholesalers');

  const visibleDistributors = distributors
    .filter((d) => (tab === 'distributors' ? d.isAuthorised : true))
    .slice(0, 16);

  return (
    <div className="flex flex-col pb-6">
      {/* Sticky header — brand, address, search, tabs on one surface */}
      <div className="sticky top-0 z-10 bg-card">
        <div className="flex items-center gap-3 px-4 pt-3">
          <img
            src={isDark ? '/brand/qwipo-logo-dark.svg' : '/brand/qwipo-logo.svg'}
            alt="Qwipo"
            className="h-6"
          />
          <img src="/brand/digidukaan-logo.svg" alt="Powered by ONDC DigiDukaan" className="h-5" />
          <div className="ml-auto flex items-center gap-1">
            <button onClick={onOpenNotifications} aria-label="Notifications" className="relative grid h-10 w-10 place-items-center">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <button onClick={onOpenProfile} aria-label="Profile" className="grid h-10 w-10 place-items-center">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>

        <button
          onClick={onOpenAddresses}
          aria-label="Change delivery address"
          className="flex w-full items-center gap-1.5 px-4 py-2 text-sm"
        >
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">{t('common.deliver_to')}</span>
          <span className="truncate font-medium">Lit Box, Rai Durg, Hitech City</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="px-4 pb-2">
          <button
            onClick={onOpenSearch}
            aria-label="Search for Products"
            className="flex h-11 w-full items-center gap-2 rounded-lg border border-border bg-input-background px-3 text-sm text-muted-foreground"
          >
            <Search className="h-5 w-5" />
            Search for Products
          </button>
        </div>

        <div className="flex gap-2 px-4 pb-3">
          <TabButton
            active={tab === 'distributors'}
            disabled={!distributorsAvailable}
            img="/home-category-cards/distributors.png"
            label={t('home.authorised_distributors')}
            onClick={() => distributorsAvailable && setTab('distributors')}
          />
          <TabButton
            active={tab === 'wholesalers'}
            disabled={!wholesalersAvailable}
            img="/home-category-cards/wholesalers.png"
            label={t('home.wholesalers')}
            onClick={() => wholesalersAvailable && setTab('wholesalers')}
          />
        </div>
      </div>

      {kycPending && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <ul className="space-y-1.5 text-sm text-amber-800">
            <li className="flex items-center gap-2"><Check className="h-4 w-4" /> View Prices from different vendors</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Place Orders hassle free</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Get best prices in the market</li>
          </ul>
          <button
            onClick={onCompleteKyc}
            className="mt-3 h-9 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground"
          >
            Complete KYC
          </button>
        </div>
      )}

      <div className="mt-4 space-y-6">
        {tab === 'distributors' ? (
          <DistributorsView
            visibleDistributors={visibleDistributors}
            onSelectDistributor={onSelectDistributor}
            onSelectDistributorBrand={onSelectDistributorBrand}
            onSelectCategory={onSelectCategory}
            onSeeAllDistributors={onSeeAllDistributors}
            onSeeAllCategories={onSeeAllCategories}
            onOpenBannerListing={onOpenBannerListing}
            t={t}
          />
        ) : (
          <WholesalersView
            onSelectBrand={onSelectBrand}
            onSelectCategory={onSelectCategory}
            onOpenWholesalerCategory={onOpenWholesalerCategory}
            onSeeAllBrands={onSeeAllBrands}
            onSeeAllCategories={onSeeAllCategories}
            t={t}
          />
        )}
      </div>

      <img src="/home-footer-block.png" alt="Powered by ONDC DigiDukaan" className="mt-6 w-full" />
    </div>
  );
}

function TabButton({ active, disabled, img, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
        active ? 'border-primary bg-primary/5' : 'border-border bg-card'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
        <img src={img} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
      </span>
      <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-foreground'}`}>
        {label}
        {disabled && <span className="mt-0.5 block text-[10px] text-muted-foreground">Coming Soon</span>}
      </span>
    </button>
  );
}

const railClass = 'flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

function DistributorsView({
  visibleDistributors,
  onSelectDistributor,
  onSelectDistributorBrand,
  onSelectCategory,
  onSeeAllDistributors,
  onSeeAllCategories,
  onOpenBannerListing,
  t,
}: any) {
  return (
    <>
      <BannerCarousel
        banners={heroBanners}
        renderBanner={(b: any) =>
          b.image ? (
            <button onClick={() => onOpenBannerListing?.()} aria-label={b.title} className="block w-full overflow-hidden rounded-xl">
              <img src={b.image} alt={b.title} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </button>
          ) : (
            <button onClick={() => onOpenBannerListing?.()} className="flex h-40 w-full items-center justify-between rounded-xl p-4 text-left text-white" style={{ background: b.bg }}>
              <div className="space-y-1">
                <div className="text-xs font-medium opacity-90">{b.tag}</div>
                <div className="text-lg font-semibold">{b.title}</div>
                <div className="text-sm opacity-90">{b.subtitle}</div>
                <span className="mt-1 inline-block text-sm font-medium">{b.cta} →</span>
              </div>
              <div className="text-5xl">{b.emoji}</div>
            </button>
          )
        }
      />

      <section className="space-y-3">
        <SectionHeader title={t('home.distributors')} onSeeAll={onSeeAllDistributors} seeAllLabel={t('common.see_all')} />
        <div className={railClass}>
          {visibleDistributors.map((d: any) => {
            const featured = brands.find((b) => b.name.toLowerCase() === d.featuredBrand.toLowerCase());
            return (
              <button key={d.id} onClick={() => onSelectDistributor(d)} className="flex w-28 shrink-0 flex-col gap-1.5 text-left">
                <Logo src={featured?.logo} text={d.featuredBrand} color={d.featuredColor} className="h-28 w-28 rounded-lg border border-border" />
                <div className="truncate text-sm font-medium">{d.featuredBrandTitle}</div>
                <div className="truncate text-xs text-muted-foreground">{d.shortName}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t('home.categories')} onSeeAll={onSeeAllCategories} seeAllLabel={t('common.see_all')} />
        <div className={railClass}>
          {distributorCategories.slice(0, 8).map((c: any) => (
            <CategoryTile key={c.id} name={c.name} image={c.image} onClick={() => onSelectCategory?.(c)} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t('home.all_brands')} onSeeAll={onSeeAllDistributors} seeAllLabel={t('common.see_all')} />
        <div className="grid grid-cols-4 gap-3 px-4">
          {brands.slice(0, 16).map((b: any) => (
            <button key={b.id} onClick={() => onSelectDistributorBrand(b)} className="flex flex-col items-center gap-1.5">
              <Logo src={b.logo} text={b.logoText} color={b.color} className="h-14 w-14 rounded-full border border-border" />
              <div className="w-full truncate text-center text-xs">{b.name}</div>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function WholesalersView({ onSelectBrand, onSelectCategory, onOpenWholesalerCategory, onSeeAllBrands, onSeeAllCategories, t }: any) {
  return (
    <>
      <BannerCarousel
        banners={wholesalerBanners}
        renderBanner={(b: any) => (
          <div className="flex h-40 w-full items-center justify-between rounded-xl p-4 text-white" style={{ background: b.bg }}>
            <div className="space-y-1">
              <div className="text-xs font-medium opacity-90">{b.tag}</div>
              <div className="text-lg font-semibold">{b.title}</div>
              <div className="text-2xl font-bold">{b.discount}</div>
              <button onClick={() => onOpenWholesalerCategory?.('groceries')} className="mt-1 inline-block text-sm font-medium">
                {b.cta} →
              </button>
            </div>
            <div className="text-5xl">{b.emoji}</div>
          </div>
        )}
      />

      <section className="space-y-3">
        <SectionHeader title={t('home.categories')} />
        <div className="grid grid-cols-2 gap-3 px-4">
          {wholesalerCategories.map((c: any) => (
            <button key={c.id} onClick={() => onOpenWholesalerCategory?.(c.id)} className="flex flex-col gap-1.5">
              <div className="grid h-24 place-items-center overflow-hidden rounded-lg" style={{ background: c.bg }}>
                {c.image ? (
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <span className="text-4xl">{c.emoji}</span>
                )}
              </div>
              <div className="text-sm font-medium">{c.name}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t('home.exclusive_offers')} />
        <div className={railClass}>
          {exclusiveOffers.map((o: any) => (
            <button
              key={o.id}
              onClick={() => onSelectBrand?.({ id: o.id, name: o.title, isBrand: true })}
              className="flex w-40 shrink-0 flex-col gap-1 rounded-xl p-3 text-left"
              style={{ background: o.bg, color: o.textColor }}
            >
              <div className="text-lg font-bold">{o.discount}</div>
              <div className="text-3xl">{o.emoji}</div>
              <div className="text-sm font-semibold">{o.title}</div>
              <div className="text-xs opacity-90">{o.subtitle}</div>
              <div className="mt-1 text-xs font-medium">Shop now →</div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t('home.top_categories')} onSeeAll={onSeeAllCategories} seeAllLabel={t('common.see_all')} />
        <div className={railClass}>
          {categories.map((c: any) => (
            <CategoryTile key={c.id} name={c.name} image={c.image} bg={c.color} fallback={c.icon} onClick={() => onSelectCategory?.(c)} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title={t('home.top_brands') || 'Top Brands'} onSeeAll={onSeeAllBrands} seeAllLabel={t('common.see_all')} />
        <div className={railClass}>
          {brands.slice(0, 12).map((b: any) => (
            <button key={b.id} onClick={() => onSelectBrand(b)} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
              <Logo src={b.logo} text={b.logoText} color={b.color} className="h-14 w-14 rounded-full border border-border" />
              <div className="w-full truncate text-center text-xs">{b.name}</div>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function CategoryTile({ name, image, bg, fallback, onClick }: any) {
  return (
    <button onClick={onClick} className="flex w-20 shrink-0 flex-col items-center gap-1.5">
      <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-lg" style={{ background: bg || '#F3F4F6' }}>
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
        ) : (
          <span className="text-3xl">{fallback}</span>
        )}
      </div>
      <div className="w-full truncate text-center text-xs">{name}</div>
    </button>
  );
}
