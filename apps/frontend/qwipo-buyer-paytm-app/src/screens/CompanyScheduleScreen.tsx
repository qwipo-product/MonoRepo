import { BadgeCheck, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatInr } from '@mockups/components';
import { CompanyLogo } from '../components/CompanyLogo';
import type { Distributor } from '../data/home';
import {
  companyById,
  companyDay,
  distributorsFor,
  nextDeliveryDays,
  relativeLabel,
  weekdayName,
  type Zone,
} from '../data/beatSchedule';

/* Delivery Schedule → a company. When it delivers to this area, when the next
   van comes, the brands it covers, and its authorised distributors nearby —
   each with its minimum order and a Shop button into that distributor's store
   (the existing storefront → brand → product list → cart). */

export function CompanyScheduleScreen({
  companyId,
  zone,
  onBack,
  onShop,
}: {
  companyId: string;
  zone: Zone;
  onBack: () => void;
  onShop: (d: Distributor) => void;
}) {
  const company = companyById(companyId) ?? companyById('itc')!;
  const weekday = companyDay(zone, company.id);
  const next = weekday ? nextDeliveryDays(zone).find((d) => d.weekday === weekday) : undefined;
  const distributors = distributorsFor(company);
  const dayTag = weekday ? weekdayName(weekday).toUpperCase() : '';

  return (
    <div className="flex h-full flex-col bg-background-subtle">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">{company.name}</h1>
          <p className="truncate text-xs text-foreground-secondary">Authorised distributors</p>
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0">
              <CompanyLogo company={company} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">{company.legalName}</div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-foreground-secondary">
                <CalendarDays className="h-3.5 w-3.5" />
                {weekday ? (
                  <>
                    Delivers every <span className="font-semibold text-foreground">{weekdayName(weekday)}</span>
                  </>
                ) : (
                  'No delivery day in your area yet'
                )}
              </div>
            </div>
          </div>

          {next && (
            <div className="mt-3 flex items-center justify-between rounded-md bg-primary-soft px-3 py-2">
              <span className="text-xs text-foreground-secondary">Next delivery</span>
              <span className="text-sm font-semibold text-primary">{relativeLabel(next)}</span>
            </div>
          )}

          <div className="mt-3 border-t border-border pt-2.5">
            <div className="text-2xs font-semibold uppercase tracking-wider text-foreground-secondary">Brands</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {company.brands.map((b) => (
                <span key={b} className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-2xs font-semibold uppercase tracking-wider text-foreground-secondary">
            {distributors.length} authorised {distributors.length === 1 ? 'distributor' : 'distributors'} near you
          </h2>
          <div className="space-y-2">
            {distributors.map((d) => (
              <button
                key={d.id}
                onClick={() => onShop(d)}
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-sm active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-sm font-semibold text-foreground">{d.name}</span>
                    <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {dayTag && (
                      <span className="rounded border border-success-border bg-success-subtle px-1.5 py-0.5 text-2xs font-bold text-success-foreground">
                        {dayTag}
                      </span>
                    )}
                    <span className="text-xs text-foreground-secondary">
                      Min. order <span className="font-semibold text-foreground">{formatInr(d.mov)}</span>
                    </span>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary">
                  Shop <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
