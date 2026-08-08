import { useState } from 'react';
import { Search } from 'lucide-react';
import { homepage } from '../data';
import StatusBar from '../components/StatusBar';
import ScreenHeader from '../components/ScreenHeader';
import SearchField from '../components/SearchField';
import Logo from '../components/Logo';

export default function AllBrandsScreen({ onBack, onSelectBrand, onOpenSearch }: any) {
  const list = homepage.allBrands as any[];
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q ? list.filter((b) => b.name.toLowerCase().includes(q)) : list;

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <StatusBar />
      <ScreenHeader
        title="All Brands"
        onBack={onBack}
        right={
          <button onClick={onOpenSearch} aria-label="Search" className="grid h-11 w-11 place-items-center">
            <Search className="h-5 w-5" />
          </button>
        }
      />
      <SearchField value={query} onChange={setQuery} placeholder="Search brands" onClear={() => setQuery('')} />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No brands match "{query}".</p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filtered.map((b) => (
              <button key={b.id} onClick={() => onSelectBrand?.(b)} className="flex flex-col items-center gap-1.5">
                <Logo src={b.logo} text={b.logoText} color={b.color} className="h-16 w-16 rounded-full border border-border" />
                <div className="w-full truncate text-center text-xs">{b.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
