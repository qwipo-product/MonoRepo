import { Icon, StatusBar } from '../components/Icons';
import BottomNav from '../components/BottomNav';
import { seller, categories, brands } from '@mockups/mock-data';

export default function SellerStorefront({ cartCount, distributor, onBack, onNavigate, onSelectCategory, onOpenSearch }: any) {
  const activeSeller = distributor
    ? {
        ...seller,
        name: distributor.name,
        shortName: distributor.shortName,
        mov: distributor.mov,
        location: distributor.location,
        totalSKUs: distributor.skuCount,
        deliveryWindows: distributor.deliveryWindows,
      }
    : seller;

  // A seller can deliver on more than one window (e.g. Beat day + Tomorrow),
  // each with its own MOV. Show every window; fall back to the single
  // MOV / Delivery-by pair when no windows are supplied.
  const windows = (activeSeller as any).deliveryWindows?.length
    ? (activeSeller as any).deliveryWindows
    : null;

  // Initials for the logo box (first letters of name words, max 4)
  const initials = activeSeller.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 4)
    .toUpperCase();

  return (
    <>
      <StatusBar />
      <div className="screen-body">
        {/* Top bar */}
        <div className="top-bar">
          <button className="icon-btn" onClick={onBack}>
            <Icon.Back />
          </button>
          <div className="top-title">
            <h1>Authorised Distributor</h1>
          </div>
          <button className="icon-btn" onClick={onOpenSearch} aria-label="Search">
            <Icon.Search />
          </button>
        </div>

        {/* Hero — seller info (location/SKU removed for retailer clarity) */}
        <div className="storefront-hero">
          <div className="seller-header">
            <div className="seller-logo">{initials}</div>
            <div className="seller-info">
              <div className="seller-name">
                {activeSeller.name}
                <span className="verified-badge">
                  <Icon.Check />
                </span>
              </div>
              <div className="seller-meta">
                <span className="seller-meta-tag">Authorised</span>
              </div>
            </div>
          </div>
          {windows ? (
            <div className={`seller-stats ${windows.length === 1 ? 'one-cell' : 'two-cell'}`}>
              {windows.map((w: any, i: number) => (
                <div className="stat-cell" key={i}>
                  <div className="stat-label">{w.day}</div>
                  <div className="stat-value">MOV ₹{w.mov.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="seller-stats two-cell">
              <div className="stat-cell">
                <div className="stat-label">Minimum Order Value</div>
                <div className="stat-value">₹{activeSeller.mov.toLocaleString('en-IN')}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Delivery by</div>
                <div className="stat-value">
                  {/* deliveryTime is "Tomorrow by 11 AM" / "Wednesday by 4 PM" etc — strip the time portion */}
                  {(activeSeller.deliveryTime || 'Tomorrow').replace(/\s+by\s+.*$/i, '')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Categories — 2:1 image cards with name-sized widths */}
        <div className="section">
          <div className="section-head">
            <div className="section-title">Shop by category</div>
          </div>
          <div className="cat-rail">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className="cat-tile cat-tile-rail"
                onClick={() => onSelectCategory(cat)}
              >
                <div className="cat-tile-card" style={{ background: cat.color }}>
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        const parent = (e.currentTarget as HTMLImageElement).parentElement!;
                        parent.innerHTML = `<span class="cat-card-fallback">${cat.icon}</span>`;
                      }}
                    />
                  ) : (
                    <span className="cat-card-fallback">{cat.icon}</span>
                  )}
                </div>
                <div className="cat-tile-name">{cat.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Brands — Phase-one PNG logos */}
        <div className="section" style={{ paddingBottom: '90px' }}>
          <div className="section-head">
            <div className="section-title">Top brands</div>
          </div>
          <div className="rail">
            {brands.map((brand) => (
              <button
                key={brand.id}
                className="brand-tile"
                onClick={() => onSelectCategory({ id: brand.id, name: brand.name, isBrand: true })}
              >
                <div
                  className="brand-circle"
                  style={{ background: brand.logo ? '#ffffff' : brand.color }}
                >
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.style.background = brand.color;
                        e.currentTarget.parentElement.textContent = brand.logoText;
                      }}
                    />
                  ) : (
                    brand.logoText
                  )}
                </div>
                <div className="brand-name">{brand.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav active="home" cartCount={cartCount} onNavigate={onNavigate} />
    </>
  );
}
