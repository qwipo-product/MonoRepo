import { ChevronLeft, Search, BadgeCheck, ArrowRight } from 'lucide-react';
import { Button } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import type { Navigate } from '../nav';
import type { AppliedFilter } from '../data/filters';
import { BrandTile } from '../components/BrandTile';
import { DIST_CATEGORIES, BRANDS, type Distributor } from '../data/home';
import { PRODUCTS } from '../data/products';
import { deliveryFor, dayLabel } from '../data/delivery';

/* Authorised Distributor storefront — brand hero (MOV + delivery), shop-by-
   category grid, and a top-brands rail. Renders whichever distributor was
   tapped; category / brand taps open the Product List scoped to THIS
   distributor (distributor chip + the category/brand chip). */

export function StorefrontScreen({
  distributor,
  onBack,
  onNavigate,
}: {
  distributor: Distributor;
  onBack: () => void;
  onNavigate: Navigate;
}) {
  const dist = deliveryFor(distributor.name);
  // Only show categories + brands this distributor actually stocks, so every
  // tap (which scopes the list to distributor + category/brand) returns products
  // instead of an empty "No products here".
  const myProducts = PRODUCTS.filter((p) => p.source === 'distributor' && p.seller === distributor.name);
  const myCategories = DIST_CATEGORIES.filter((c) => myProducts.some((p) => p.category === c.name));
  const myBrands = BRANDS.filter((b) =>
    myProducts.some((p) => p.shortName.toLowerCase().startsWith(b.name.toLowerCase()))
  );
  // Every product-list link from the storefront is scoped to this distributor.
  const openList = (extra?: AppliedFilter) =>
    onNavigate('listing', {
      applied: extra
        ? [{ type: 'distributor', value: distributor.name }, extra]
        : [{ type: 'distributor', value: distributor.name }],
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
              {distributor.short}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-base font-bold">{distributor.name}</span>
                <BadgeCheck className="h-4 w-4 shrink-0" />
              </div>
              <span className="mt-1 inline-flex items-center rounded-full bg-success/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Authorised
              </span>
            </div>
          </div>

          {/* delivery days — one cell per option, each with its own MOV (info only) */}
          <div className="mt-3 flex overflow-hidden rounded-lg bg-primary-foreground/10">
            {dist.options.map((o, i) => (
              <div
                key={i}
                className="flex-1 border-l border-primary-foreground/20 px-3 py-2.5 text-center first:border-l-0"
              >
                <div className="text-[11px] text-primary-foreground/70">Delivery by</div>
                <div className="mt-0.5 text-sm font-bold">{dayLabel(o)}</div>
                <div className="mt-1 text-[11px] font-medium text-primary-foreground/80 tabular-nums">
                  {o.mov != null ? `Min. order ${formatInr(o.mov)}` : 'No minimum'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 p-4">
          {/* view all products from this distributor */}
          <Button variant="secondary" fullWidth onClick={() => openList()}>
            View all products
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* shop by category — only this distributor's categories */}
          {myCategories.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Shop by category</h2>
            <div className="no-scrollbar flex gap-3 overflow-x-auto">
              {myCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openList({ type: 'category', value: c.name })}
                  className="flex w-28 shrink-0 flex-col items-center gap-1.5 active:scale-[0.98]"
                >
                  <span className="grid aspect-[2/1] w-full place-items-center overflow-hidden rounded-lg bg-white">
                    <img src={encodeURI(c.image)} alt={c.name} className="h-full w-full object-contain" />
                  </span>
                  <span className="w-full truncate text-center text-xs text-foreground">{c.name}</span>
                </button>
              ))}
            </div>
          </section>
          )}

          {/* top brands — only this distributor's brands */}
          {myBrands.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Top brands</h2>
            <div className="grid grid-cols-4 gap-3">
              {myBrands.map((b) => (
                <BrandTile
                  key={b.id}
                  name={b.name}
                  logo={b.logo}
                  onClick={() => openList({ type: 'brand', value: b.name })}
                />
              ))}
            </div>
          </section>
          )}
        </div>
      </div>
    </div>
  );
}
