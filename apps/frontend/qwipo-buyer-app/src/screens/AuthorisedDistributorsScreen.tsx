import { useState } from 'react';
import { Icon, StatusBar } from '../components/Icons';
import { distributorsList, distributors } from '@mockups/mock-data';

// Up to this many brands are shown in the collapsed state on each seller
// card; beyond this the "View More" link appears.
const COLLAPSED_LIMIT = 8;

export default function AuthorisedDistributorsScreen({
  onBack,
  onSelectDistributor,
  onSelectBrand,
  filterDistributorIds,
  onOpenSearch,
}: any) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggle = (id: string) => setExpandedId((curr) => (curr === id ? null : id));

  const findDistributor = (name: string) =>
    distributors.find((d) => d.name.toLowerCase() === name.toLowerCase());

  const sellers = filterDistributorIds
    ? distributorsList.filter((d: any) => filterDistributorIds.includes(d.id))
    : distributorsList;

  return (
    <>
      <StatusBar />
      <div className="screen-body">
        <div className="top-bar">
          <button className="icon-btn" onClick={onBack}>
            <Icon.Back />
          </button>
          <div className="top-title">
            <h1>Authorised Distributors</h1>
          </div>
          <button className="icon-btn" onClick={onOpenSearch} aria-label="Search">
            <Icon.Search />
          </button>
        </div>

        <div className="dl-body">
          {sellers.map((d: any) => {
            const fullDistributor = findDistributor(d.name) || {
              id: d.id,
              name: d.name,
              shortName: d.name,
              location: '—',
              mov: 5000,
              skuCount: 1000,
              featuredBrand: d.brands[0]?.short || '',
              featuredBrandTitle: d.brands[0]?.short || '',
              featuredColor: '#FEF3C7',
              isAuthorised: true,
            };
            return (
              <div key={d.id} className="dl-card">
                <button
                  className="dl-card-head"
                  onClick={() => onSelectDistributor?.(fullDistributor, d)}
                  aria-label={`Open ${d.name} storefront`}
                >
                  <span className="dl-card-title">{d.name}</span>
                  <span className="dl-card-arrow">
                    <Icon.ChevronRight />
                  </span>
                </button>

                {d.deliveryWindows?.length > 0 && (
                  <>
                    <div className="dl-delivery-label">Delivery by</div>
                    <div className="dl-delivery-row">
                      {d.deliveryWindows.map((w: any, i: number) => (
                        <div className="dl-delivery-pill" key={i}>
                          <div className="dl-delivery-day">{w.day}</div>
                          <div className="dl-delivery-mov">MOV: ₹{w.mov.toLocaleString('en-IN')}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="dl-brand-grid">
                  {(expandedId === d.id ? d.brands : d.brands.slice(0, COLLAPSED_LIMIT)).map((b: any) => (
                    <button
                      key={b.id}
                      className="dl-brand-tile"
                      onClick={() => onSelectBrand?.(b, d)}
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

                {d.brands.length > COLLAPSED_LIMIT && (
                  <button
                    className="dl-view-toggle"
                    onClick={() => toggle(d.id)}
                    aria-expanded={expandedId === d.id}
                  >
                    {expandedId === d.id ? '− View Less' : '+ View More'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
