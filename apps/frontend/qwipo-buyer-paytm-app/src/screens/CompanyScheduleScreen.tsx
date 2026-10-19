import { CalendarDays, ChevronLeft } from 'lucide-react';
import { BrandIcon } from '../components/BrandIcon';
import { CompanyLogo } from '../components/CompanyLogo';
import { companyById, companyDay, weekdayName, type Zone } from '../data/beatSchedule';

/* Delivery Schedule → a company. Which weekday it delivers to this area
   (beat days are fixed — no dates, no Today / Tomorrow) and the brands it covers. */

export function CompanyScheduleScreen({
  companyId,
  zone,
  onBack,
}: {
  companyId: string;
  zone: Zone;
  onBack: () => void;
}) {
  const company = companyById(companyId) ?? companyById('itc')!;
  const weekday = companyDay(zone, company.id);

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
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 shrink-0">
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

          <div className="mt-3 border-t border-border pt-2.5">
            <div className="text-2xs font-semibold uppercase tracking-wider text-foreground-secondary">Brands</div>
            {/* Logos, not name chips: a retailer spots a brand by its mark. */}
            <div className="mt-2.5 grid grid-cols-4 gap-x-2.5 gap-y-3">
              {company.brands.map((b) => (
                <BrandIcon key={b} name={b} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
