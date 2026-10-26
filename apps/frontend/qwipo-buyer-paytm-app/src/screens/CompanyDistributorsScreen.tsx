import { BadgeCheck, CalendarDays, ChevronLeft, ChevronRight, Store } from 'lucide-react';
import { Badge, EmptyState } from '@mockups/ui';
import { formatInr } from '@mockups/components';
import type { Navigate } from '../nav';
import { BrandLogo } from '../components/BrandLogo';
import { distributorsFor, whenLabel, type ScheduleCompany } from '../data/deliverySchedule';
import { useEmptyable } from '../review/demoState';

/* Delivery Schedule · Company — one company's authorised distributors in the
   buyer's area. The hero says when the company delivers and which of its
   brands to expect; each distributor card opens that distributor's
   storefront, where the buyer orders. */
export function CompanyDistributorsScreen({
  company: c,
  onBack,
  onNavigate,
}: {
  company: ScheduleCompany;
  onBack: () => void;
  onNavigate: Navigate;
}) {
  const sellers = useEmptyable(distributorsFor(c));
  const when = whenLabel(c.day);

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
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">{c.name}</h1>
          <p className="text-xs text-foreground-secondary">Authorised distributors</p>
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        {/* company hero — delivery day + the brands it covers */}
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <BrandLogo
              src={c.logo}
              alt={c.name}
              className="h-14 w-14 shrink-0 rounded-md border border-border"
              imgClassName="p-0 scale-110"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">{c.legalName}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-foreground-secondary">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                Delivers every <span className="font-semibold text-foreground">{c.day}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-primary-soft px-3 py-2">
            <span className="text-xs text-foreground-secondary">Next delivery</span>
            <span className="text-sm font-semibold text-primary">{when}</span>
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <div className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Brands
            </div>
            <div className="flex flex-wrap gap-1.5">
              {c.brands.map((b) => (
                <span key={b} className="rounded-full border border-border bg-background-subtle px-2.5 py-1 text-xs text-foreground">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>

        {sellers.length === 0 ? (
          <EmptyState
            icon={<Store strokeWidth={1.75} />}
            title={`No ${c.name} distributors yet`}
            description={`We're onboarding ${c.name}'s authorised distributors in your area. Check back soon.`}
          />
        ) : (
          <section className="space-y-1.5">
            <h2 className="px-1 text-2xs font-semibold uppercase tracking-wider text-foreground-secondary">
              {sellers.length} authorised {sellers.length === 1 ? 'distributor' : 'distributors'} near you
            </h2>
            <div className="space-y-3">
              {sellers.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onNavigate('storefront', { distributor: d })}
                  aria-label={`Open ${d.name} storefront`}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-sm active:scale-[0.99]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1">
                      <span className="truncate text-sm font-semibold text-foreground">{d.name}</span>
                      <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="success">{c.day}</Badge>
                      <span className="text-xs text-foreground-secondary">
                        Min. order <span className="font-semibold text-foreground">{formatInr(d.mov)}</span>
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary">
                    Shop
                    <ChevronRight size={16} />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
