import { Search, BadgeCheck } from 'lucide-react';
import { seller as defaultSeller, homepage } from '../data';
import ScreenHeader from '../components/ScreenHeader';
import SectionHeader from '../components/SectionHeader';
import Logo from '../components/Logo';

const { categories, brands } = homepage;

export default function SellerStorefront({ distributor, onBack, onSelectCategory, onOpenSearch }: any) {
  const s: any = distributor
    ? { ...defaultSeller, name: distributor.name, shortName: distributor.shortName, mov: distributor.mov, location: distributor.location, deliveryWindows: distributor.deliveryWindows }
    : defaultSeller;
  const windows = s.deliveryWindows?.length ? s.deliveryWindows : null;
  const initials = s.name.split(' ').map((w: string) => w[0]).join('').slice(0, 4).toUpperCase();

  return (
    <div className="flex h-full flex-col bg-gray-50 text-foreground">
      <div className="flex-shrink-0 border-b border-border bg-card shadow-sm">
        <ScreenHeader
          title="Authorised Distributor"
          onBack={onBack}
          right={
            <button onClick={onOpenSearch} aria-label="Search" className="grid h-10 w-10 place-items-center rounded-lg bg-muted transition-colors hover:bg-muted/70 active:scale-95">
              <Search className="h-5 w-5" />
            </button>
          }
        />
        {/* Hero */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{initials}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-base font-semibold">
                <span className="truncate">{s.name}</span>
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
              </div>
              <span className="mt-0.5 inline-block rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Authorised</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {windows ? (
              windows.map((w: any, i: number) => (
                <Stat key={i} label={w.day} value={`MOV ₹${w.mov.toLocaleString('en-IN')}`} />
              ))
            ) : (
              <>
                <Stat label="Minimum Order Value" value={`₹${s.mov?.toLocaleString('en-IN') ?? '—'}`} />
                <Stat label="Delivery by" value={(s.deliveryTime || 'Tomorrow').replace(/\s+by\s+.*$/i, '')} />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto py-4">
        <section className="space-y-3">
          <SectionHeader title="Shop by category" />
          <div className="flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((cat: any) => (
              <button key={cat.id} onClick={() => onSelectCategory(cat)} className="flex w-20 shrink-0 flex-col items-center gap-1.5">
                <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-xl border border-border shadow-sm" style={{ background: cat.color || '#F3F4F6' }}>
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <span className="text-3xl">{cat.icon}</span>
                  )}
                </div>
                <div className="w-full truncate text-center text-xs">{cat.name}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader title="Top brands" />
          <div className="flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {brands.map((brand: any) => (
              <button
                key={brand.id}
                onClick={() => onSelectCategory({ id: brand.id, name: brand.name, isBrand: true })}
                className="flex w-16 shrink-0 flex-col items-center gap-1.5"
              >
                <Logo src={brand.logo} text={brand.logoText} color={brand.color} className="h-14 w-14 rounded-full border border-border" />
                <div className="w-full truncate text-center text-xs">{brand.name}</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-gray-50 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
