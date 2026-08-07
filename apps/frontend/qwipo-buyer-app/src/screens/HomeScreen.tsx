import { useState } from 'react';
import { Icon, StatusBar } from '../components/Icons';
import BottomNav from '../components/BottomNav';
import BannerCarousel from '../components/BannerCarousel';
import { useI18n } from '@mockups/i18n';
import { useTheme } from '@mockups/ui';
import {
  distributors,
  brands,
  heroBanners,
  wholesalerBanners,
  wholesalerCategories,
  exclusiveOffers,
  categories,
  distributorCategories,
} from '@mockups/mock-data';

export default function HomeScreen({
  cartCount,
  onNavigate,
  onSelectDistributor,
  onSelectBrand,
  onSelectDistributorBrand,
  onOpenNotifications,
  onSeeAllDistributors,
  onSeeAllBrands,
  onOpenWholesalerCategory,
  onOpenAddresses,
  onSelectCategory,
  onSeeAllCategories,
  kycPending,
  onCompleteKyc,
  sellerAvailability = 'both',
  onOpenProfile,
  onOpenBannerListing,
  onOpenSearch,
}: any) {
  const { t } = useI18n();
  const { isDark } = useTheme();
  const distributorsAvailable = sellerAvailability !== 'wholesalers';
  const wholesalersAvailable = sellerAvailability !== 'distributors';
  const [tab, setTab] = useState(distributorsAvailable ? 'distributors' : 'wholesalers');

  // Cap the home rail at 16 distributor cards (the Distributors section).
  // Beyond that, "See all" routes to the Authorised Distributors list.
  const visibleDistributors = distributors
    .filter((d) => (tab === 'distributors' ? d.isAuthorised : true))
    .slice(0, 16);

  return (
    <>
      <StatusBar />
      <div className="screen-body">
        {/* Sticky header block — brand + address + tabs all on one white surface
            so the status bar through the tabs reads as one continuous header
            that stays put while the content below scrolls. */}
        <div className="home-sticky-top">
          <div className="home-header">
            <img
              className="home-brand-logo"
              src={isDark ? '/brand/qwipo-logo-dark.svg' : '/brand/qwipo-logo.svg'}
              alt="Qwipo"
            />
            <div className="ondc-badge">
              <img
                className={`ondc-logo-img ${isDark ? 'is-dark' : ''}`}
                src="/brand/digidukaan-logo.svg"
                alt="Powered by ONDC DigiDukaan"
              />
            </div>
            <div className="home-header-actions">
              <button className="icon-btn" onClick={onOpenNotifications}>
                <Icon.Bell />
                <div className="bell-dot" />
              </button>
              <button className="icon-btn" onClick={onOpenProfile}>
                <Icon.Profile />
              </button>
            </div>
          </div>

          <div className="location-bar">
            <button
              className="location-bar-inner"
              aria-label="Change delivery address"
              onClick={onOpenAddresses}
            >
              <span className="location-pin"><Icon.MapPin /></span>
              <span className="location-prefix">{t('common.deliver_to')}</span>
              <span className="location-value">Lit Box, Rai Durg, Hitech City</span>
              <Icon.ChevronDown />
            </button>
          </div>

          <div className="home-search-wrap">
            <button
              className="home-search-bar"
              onClick={onOpenSearch}
              aria-label="Search for Products"
            >
              <Icon.Search />
              <span className="home-search-placeholder">
                Search for Products
              </span>
            </button>
          </div>

          <div className="home-tabs">
            <button
              className={`home-tab ${tab === 'distributors' ? 'active' : ''} ${!distributorsAvailable ? 'disabled' : ''}`}
              onClick={() => distributorsAvailable && setTab('distributors')}
              disabled={!distributorsAvailable}
            >
              <div className="home-tab-img" style={{ background: '#FEF3C7' }}>
                <img
                  src="/home-category-cards/distributors.png"
                  alt="Distributors"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    (e.currentTarget as HTMLImageElement).parentElement!.textContent = '📦';
                  }}
                />
              </div>
              <span className="home-tab-label">
                {t('home.authorised_distributors')}
                {!distributorsAvailable && <span className="home-tab-badge">Coming Soon</span>}
              </span>
            </button>
            <button
              className={`home-tab ${tab === 'wholesalers' ? 'active' : ''} ${!wholesalersAvailable ? 'disabled' : ''}`}
              onClick={() => wholesalersAvailable && setTab('wholesalers')}
              disabled={!wholesalersAvailable}
            >
              <div className="home-tab-img" style={{ background: '#FED7AA' }}>
                <img
                  src="/home-category-cards/wholesalers.png"
                  alt="Wholesalers"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                    (e.currentTarget as HTMLImageElement).parentElement!.textContent = '🏪';
                  }}
                />
              </div>
              <span className="home-tab-label">
                {t('home.wholesalers')}
                {!wholesalersAvailable && <span className="home-tab-badge">Coming Soon</span>}
              </span>
            </button>
          </div>
        </div>

        {kycPending && (
          <div className="kyc-home-banner">
            <ul className="kyc-home-banner-list">
              <li>
                <Icon.Check /> View Prices from different vendors
              </li>
              <li>
                <Icon.Check /> Place Orders hassle free
              </li>
              <li>
                <Icon.Check /> Get best prices in the market
              </li>
            </ul>
            <button className="kyc-home-banner-cta" onClick={onCompleteKyc}>
              Complete KYC
            </button>
          </div>
        )}

        {tab === 'distributors' ? (
          <DistributorsView
            visibleDistributors={visibleDistributors}
            onSelectDistributor={onSelectDistributor}
            onSelectDistributorBrand={onSelectDistributorBrand}
            onSelectCategory={onSelectCategory}
            onSeeAllDistributors={onSeeAllDistributors}
            onSeeAllCategories={onSeeAllCategories}
            onOpenBannerListing={onOpenBannerListing}
          />
        ) : (
          <WholesalersView
            onSelectBrand={onSelectBrand}
            onSelectCategory={onSelectCategory}
            onOpenWholesalerCategory={onOpenWholesalerCategory}
            onSeeAllBrands={onSeeAllBrands}
            onSeeAllCategories={onSeeAllCategories}
          />
        )}
      </div>

      <BottomNav active="home" cartCount={cartCount} onNavigate={onNavigate} />
    </>
  );
}

function DistributorsView({
  visibleDistributors,
  onSelectDistributor,
  onSelectDistributorBrand,
  onSelectCategory,
  onSeeAllDistributors,
  onSeeAllCategories,
  onOpenBannerListing,
}: any) {
  const { t } = useI18n();
  return (
    <>
      {/* Hero banner carousel — auto-scrolls every 5s. Banners don't carry a
          specific product/brand link yet, so for now every banner opens a
          representative product listing (rather than nothing). */}
      <BannerCarousel
        banners={heroBanners}
        renderBanner={(b: any) =>
          b.image ? (
            <button
              key={b.id}
              className="hero-banner hero-banner-image"
              onClick={() => onOpenBannerListing?.()}
              aria-label={b.title}
            >
              <img
                src={b.image}
                alt={b.title}
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = 'none';
                }}
              />
            </button>
          ) : (
            <button
              key={b.id}
              className="hero-banner"
              style={{ background: b.bg }}
              onClick={() => onOpenBannerListing?.()}
            >
              <div className="hero-banner-text">
                <div className="hero-banner-tag">{b.tag}</div>
                <div className="hero-banner-title">{b.title}</div>
                <div className="hero-banner-sub">{b.subtitle}</div>
                <ul className="hero-banner-bullets">
                  {b.bullets.map((bl: string, i: number) => (
                    <li key={i}>{bl}</li>
                  ))}
                </ul>
                <span className="hero-banner-cta">{b.cta} →</span>
              </div>
              <div className="hero-banner-art">{b.emoji}</div>
            </button>
          )
        }
      />

      {/* Distributors section */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">{t('home.distributors')}</div>
          <button className="section-link" onClick={onSeeAllDistributors}>
            {t('common.see_all')}
          </button>
        </div>
        <div className="rail">
          {visibleDistributors.map((d) => {
            const featured = brands.find(
              (b) => b.name.toLowerCase() === d.featuredBrand.toLowerCase()
            );
            return (
              <button
                key={d.id}
                className="distributor-card"
                onClick={() => onSelectDistributor(d)}
              >
                <div
                  className="distributor-card-img"
                  style={{ background: '#ffffff' }}
                >
                  {featured?.logo ? (
                    <img
                      className="distributor-card-logo"
                      src={featured.logo}
                      alt={featured.name}
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        el.style.display = 'none';
                        el.parentElement!.style.background = d.featuredColor;
                        el.parentElement!.innerHTML = `<span class="distributor-card-brand">${d.featuredBrand}</span>`;
                      }}
                    />
                  ) : (
                    <span className="distributor-card-brand">{d.featuredBrand}</span>
                  )}
                </div>
                <div className="distributor-card-title">{d.featuredBrandTitle}</div>
                <div className="distributor-card-sub">{d.shortName}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories — single horizontal row of distributor categories
          (image card + name). Up to 8 shown; "See all" routes to the
          Authorised Distributors page with the Categories tab active. */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">{t('home.categories')}</div>
          <button className="section-link" onClick={onSeeAllCategories}>
            {t('common.see_all')}
          </button>
        </div>
        <div className="rail">
          {distributorCategories.slice(0, 8).map((c: any) => (
            <button
              key={c.id}
              className="cat-tile cat-tile-rail-sm"
              onClick={() => onSelectCategory?.(c)}
            >
              <div className="cat-tile-card">
                <img src={c.image} alt={c.name} />
              </div>
              <div className="cat-tile-name">{c.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* All brands grid — tapping a brand shows the authorised distributor(s)
          that carry it; "See all" opens the full distributor/seller list
          (same destination as the Distributors section above). */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">{t('home.all_brands')}</div>
          <button className="section-link" onClick={onSeeAllDistributors}>
            {t('common.see_all')}
          </button>
        </div>
        <div className="brand-grid">
          {brands.slice(0, 16).map((b) => (
            <button
              key={b.id}
              className="brand-grid-tile"
              onClick={() => onSelectDistributorBrand(b)}
            >
              <div
                className="brand-grid-circle"
                style={{ background: b.logo ? '#ffffff' : b.color }}
              >
                {b.logo ? (
                  <img
                    src={b.logo}
                    alt={b.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement.textContent = b.logoText;
                      e.currentTarget.parentElement.style.color = '#ffffff';
                      e.currentTarget.parentElement.style.background = b.color;
                    }}
                  />
                ) : (
                  b.logoText
                )}
              </div>
              <div className="brand-grid-name">{b.name}</div>
            </button>
          ))}
        </div>
      </div>

      <img className="home-footer-block" src="/home-footer-block.png" alt="Powered by ONDC DigiDukaan" />
    </>
  );
}

function WholesalersView({ onSelectBrand, onSelectCategory, onOpenWholesalerCategory, onSeeAllBrands, onSeeAllCategories }: any) {
  const { t } = useI18n();
  return (
    <>
      {/* Snack banner carousel — auto-scrolls every 5s */}
      <BannerCarousel
        banners={wholesalerBanners}
        renderBanner={(b) => (
          <div key={b.id} className="hero-banner snack-banner" style={{ background: b.bg }}>
            <div className="hero-banner-text">
              <div className="hero-banner-tag" style={{ color: '#DC2626' }}>{b.tag}</div>
              <div className="hero-banner-title" style={{ color: '#7C2D12' }}>{b.title}</div>
              <div className="snack-discount">{b.discount}</div>
              <button
                className="hero-banner-cta orange-cta"
                onClick={() => onOpenWholesalerCategory?.('groceries')}
              >
                {b.cta} →
              </button>
            </div>
            <div className="hero-banner-art">{b.emoji}</div>
          </div>
        )}
      />

      {/* Categories — Groceries + FMCG (2:1 banner cards) */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">{t('home.categories')}</div>
        </div>
        <div className="wholesale-categories">
          {wholesalerCategories.map((c: any) => (
            <button
              key={c.id}
              className="cat-tile cat-tile-grid"
              onClick={() => onOpenWholesalerCategory?.(c.id)}
            >
              <div className="cat-tile-card" style={{ background: c.bg }}>
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      el.style.display = 'none';
                      const parent = el.parentElement!;
                      parent.innerHTML = `<span class="cat-card-fallback">${c.emoji}</span>`;
                    }}
                  />
                ) : (
                  <span className="cat-card-fallback">{c.emoji}</span>
                )}
              </div>
              <div className="cat-tile-name">{c.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Exclusive offers */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">{t('home.exclusive_offers')}</div>
        </div>
        <div className="rail">
          {exclusiveOffers.map((o: any) => (
            <button
              key={o.id}
              className="exclusive-card"
              style={{ background: o.bg, color: o.textColor }}
              onClick={() =>
                onSelectBrand?.({ id: o.id, name: o.title, isBrand: true })
              }
            >
              <div className="exclusive-card-discount">{o.discount}</div>
              <div className="exclusive-card-art">{o.emoji}</div>
              <div className="exclusive-card-title">{o.title}</div>
              <div className="exclusive-card-sub">{o.subtitle}</div>
              <div className="exclusive-card-cta">Shop now →</div>
            </button>
          ))}
        </div>
      </div>

      {/* Top categories — single horizontal row of SKU categories */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">{t('home.top_categories')}</div>
          <button className="section-link" onClick={onSeeAllCategories}>{t('common.see_all')}</button>
        </div>
        <div className="rail">
          {categories.map((c: any) => (
            <button
              key={c.id}
              className="cat-tile cat-tile-rail-sm"
              onClick={() => onSelectCategory?.(c)}
            >
              <div className="cat-tile-card" style={{ background: c.color || '#F3F4F6' }}>
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      el.style.display = 'none';
                      const parent = el.parentElement!;
                      parent.innerHTML = `<span class="cat-card-fallback">${c.icon}</span>`;
                    }}
                  />
                ) : (
                  <span className="cat-card-fallback">{c.icon}</span>
                )}
              </div>
              <div className="cat-tile-name">{c.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Top Brands — single horizontal row of brand logos */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">{t('home.top_brands') || 'Top Brands'}</div>
          <button className="section-link" onClick={onSeeAllBrands}>{t('common.see_all')}</button>
        </div>
        <div className="brand-rail">
          {brands.slice(0, 12).map((b: any) => (
            <button
              key={b.id}
              className="brand-rail-tile"
              onClick={() => onSelectBrand(b)}
            >
              <div
                className="brand-rail-circle"
                style={{ background: b.logo ? '#ffffff' : b.color }}
              >
                {b.logo ? (
                  <img
                    src={b.logo}
                    alt={b.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.textContent = b.logoText;
                      e.currentTarget.parentElement!.style.color = '#ffffff';
                      e.currentTarget.parentElement!.style.background = b.color;
                    }}
                  />
                ) : (
                  b.logoText
                )}
              </div>
              <div className="brand-rail-name">{b.name}</div>
            </button>
          ))}
        </div>
      </div>

      <img className="home-footer-block" src="/home-footer-block.png" alt="Powered by ONDC DigiDukaan" />
    </>
  );
}
