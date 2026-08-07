import { Icon, StatusBar } from '../components/Icons';
import { wholesalersGroceries, wholesalersFMCG, wholesalersAllCategories } from '../data/mockData';

export default function WholesalersCategoriesScreen({
  variant,
  onBack,
  onSelectCategory,
  onOpenSearch,
}: any) {
  const cats =
    variant === 'groceries'
      ? wholesalersGroceries
      : variant === 'fmcg'
      ? wholesalersFMCG
      : wholesalersAllCategories;
  const title = variant === 'groceries' ? 'Groceries' : variant === 'fmcg' ? 'FMCG' : 'All Categories';

  return (
    <>
      <StatusBar />
      <div className="screen-body">
        <div className="top-bar">
          <button className="icon-btn" onClick={onBack}>
            <Icon.Back />
          </button>
          <div className="top-title">
            <h1>{title}</h1>
          </div>
          <button className="icon-btn" onClick={onOpenSearch} aria-label="Search">
            <Icon.Search />
          </button>
        </div>

        <div className="cat-grid">
          {cats.map((c: any) => (
            <button
              key={c.id}
              className="cat-tile cat-tile-grid"
              onClick={() => onSelectCategory?.(c)}
            >
              <div className="cat-tile-card" style={{ background: c.bg }}>
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      const parent = (e.currentTarget as HTMLImageElement).parentElement!;
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
    </>
  );
}
