import { useState } from 'react';
import { Icon, StatusBar } from '../components/Icons';
import { allBrandsList } from '../data/mockData';

export default function AllBrandsScreen({ onBack, onSelectBrand, brandsList, onOpenSearch }: any) {
  const list = brandsList || allBrandsList;
  const [query, setQuery] = useState('');
  const filtered = query.trim()
    ? list.filter((b: any) => b.name.toLowerCase().includes(query.trim().toLowerCase()))
    : list;
  return (
    <>
      <StatusBar />
      <div className="screen-body">
        <div className="top-bar">
          <button className="icon-btn" onClick={onBack}>
            <Icon.Back />
          </button>
          <div className="top-title">
            <h1>All Brands</h1>
          </div>
          <button className="icon-btn" onClick={onOpenSearch} aria-label="Search">
            <Icon.Search />
          </button>
        </div>

        <div className="dl-search">
          <span className="dl-search-icon"><Icon.Search /></span>
          <input
            className="dl-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brands"
          />
        </div>

        <div className="dl-body dl-brand-grid dl-brand-grid-all">
          {filtered.length === 0 && (
            <div className="dl-empty">No brands match "{query}".</div>
          )}
          {filtered.map((b: any) => (
            <button key={b.id} className="dl-brand-tile" onClick={() => onSelectBrand?.(b)}>
              <div className="dl-brand-circle" style={{ background: b.logo ? '#ffffff' : b.color }}>
                {b.logo ? (
                  <img
                    src={b.logo}
                    alt={b.name}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = 'none';
                      const parent = img.parentElement!;
                      parent.style.background = b.color;
                      parent.innerHTML = `<span>${b.logoText}</span>`;
                    }}
                  />
                ) : (
                  <span style={{ color: '#ffffff' }}>{b.logoText}</span>
                )}
              </div>
              <div className="dl-brand-name">{b.name}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}


// hello