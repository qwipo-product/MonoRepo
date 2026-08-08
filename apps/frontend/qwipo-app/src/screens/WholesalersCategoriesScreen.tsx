import { Search } from 'lucide-react';
import { homepage } from '../data';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';

export default function WholesalersCategoriesScreen({ variant, onBack, onSelectCategory, onOpenSearch }: any) {
  const groups = homepage.wholesalerCategoryGroups as any;
  const cats = (variant === 'groceries' ? groups.groceries : variant === 'fmcg' ? groups.fmcg : groups.all) as any[];
  const title = variant === 'groceries' ? 'Groceries' : variant === 'fmcg' ? 'FMCG' : 'All Categories';

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <StatusBar />
      <ScreenHeader
        title={title}
        onBack={onBack}
        right={
          <button onClick={onOpenSearch} aria-label="Search" className="grid h-11 w-11 place-items-center">
            <Search className="h-5 w-5" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {cats.map((c) => (
            <button key={c.id} onClick={() => onSelectCategory?.(c)} className="flex flex-col gap-1.5">
              <div className="grid h-28 place-items-center overflow-hidden rounded-lg" style={{ background: c.bg }}>
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
      </div>
    </div>
  );
}
