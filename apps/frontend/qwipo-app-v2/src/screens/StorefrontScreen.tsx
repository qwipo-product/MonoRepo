import { ChevronLeft, Search, BadgeCheck, ArrowRight } from 'lucide-react';
import { Button } from '@mockups/ui';
import type { Navigate } from '../nav';
import type { AppliedFilter } from '../data/filters';
import { BrandLogo } from '../components/BrandLogo';
import { DIST_CATEGORIES, BRANDS } from '../data/home';

/* Authorised Distributor storefront — brand hero (MOV + delivery), shop-by-
   category grid, and a top-brands rail. Category / brand taps open the Product
   List scoped to THIS distributor (distributor chip + the category/brand chip). */

const STOREFRONT = {
  initials: 'SSKT',
  name: 'Sri Sai Krishna Traders',
  mov: '₹5,000',
  delivery: 'Tomorrow',
};

export function StorefrontScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: Navigate }) {
  // Every product-list link from the storefront is scoped to this distributor.
  const openList = (extra?: AppliedFilter) =>
    onNavigate('listing', {
      applied: extra ? [{ type: 'distributor', value: STOREFRONT.name }, extra] : [{ type: 'distributor', value: STOREFRONT.name }],
      backTo: 'storefront',
    });
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Authorised Distributor</h1>
        <button
          onClick={() => onNavigate('global-search')}
          aria-label="Search"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <Search size={18} />
        </button>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto bg-background">
        {/* distributor hero */}
        <div className="bg-gradient-to-br from-primary to-primary-active px-4 pb-4 pt-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-white text-sm font-bold text-primary">
              {STOREFRONT.initials}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-base font-bold">{STOREFRONT.name}</span>
                <BadgeCheck className="h-4 w-4 shrink-0" />
              </div>
              <span className="mt-1 inline-flex items-center rounded-full bg-success/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Authorised
              </span>
            </div>
          </div>

          <div className="mt-3 flex overflow-hidden rounded-lg bg-primary-foreground/10">
            <div className="flex-1 px-3 py-2.5 text-center">
              <div className="text-[11px] text-primary-foreground/70">Minimum Order Value</div>
              <div className="mt-0.5 text-sm font-bold tabular-nums">{STOREFRONT.mov}</div>
            </div>
            <div className="w-px bg-primary-foreground/20" />
            <div className="flex-1 px-3 py-2.5 text-center">
              <div className="text-[11px] text-primary-foreground/70">Delivery by</div>
              <div className="mt-0.5 text-sm font-bold">{STOREFRONT.delivery}</div>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-4">
          {/* view all products from this distributor */}
          <Button variant="secondary" fullWidth onClick={() => openList()}>
            View all products
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* shop by category — horizontal rail, matches Homepage */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Shop by category</h2>
            <div className="no-scrollbar flex gap-3 overflow-x-auto">
              {DIST_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openList({ type: 'category', value: c.name })}
                  className="flex w-20 shrink-0 flex-col items-center gap-1.5 active:scale-[0.98]"
                >
                  <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-lg bg-muted">
                    <img src={encodeURI(c.image)} alt={c.name} className="h-full w-full object-cover" />
                  </span>
                  <span className="w-full truncate text-center text-xs text-foreground">{c.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* top brands — vertical 4-column grid, matches Homepage */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Top brands</h2>
            <div className="grid grid-cols-4 gap-3">
              {BRANDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => openList({ type: 'brand', value: b.name })}
                  className="flex flex-col items-center gap-1.5 active:scale-[0.98]"
                >
                  <BrandLogo src={b.logo} alt={b.name} className="h-14 w-14 rounded-full border border-border shadow-sm" />
                  <span className="w-full truncate text-center text-xs text-foreground">{b.name}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
