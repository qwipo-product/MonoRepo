import { CalendarX, ChevronLeft } from 'lucide-react';
import { Badge, EmptyState, InlineMessage, cn } from '@mockups/ui';
import { BrandLogo } from '../components/BrandLogo';
import {
  SCHEDULE_COMPANIES,
  WEEKDAYS,
  companiesOn,
  nextDateOf,
  shortDate,
  whenLabel,
  type ScheduleCompany,
  type Weekday,
} from '../data/deliverySchedule';
import { useEmptyable } from '../review/demoState';

/* Account · Delivery Schedule — which company's distributors deliver on which
   day, so the retailer can plan orders around the van. A day strip picks the
   day; that day's companies show as tiles (same plate as the Brands tab);
   the weekly timetable underneath is the whole cycle at a glance. Tapping a
   company opens its authorised distributors. */

/** The six delivery days in the order they next come round, today first. */
function upcomingDays(from = new Date()): Weekday[] {
  return [...WEEKDAYS].sort((a, b) => nextDateOf(a, from).getTime() - nextDateOf(b, from).getTime());
}

export function DeliveryScheduleScreen({
  day,
  onDayChange,
  onBack,
  onOpenCompany,
}: {
  /** Selected day — held by the app so Back from a company returns to it. */
  day: Weekday | null;
  onDayChange: (d: Weekday) => void;
  onBack: () => void;
  onOpenCompany: (id: string) => void;
}) {
  const companies = useEmptyable(SCHEDULE_COMPANIES);
  const days = upcomingDays();
  const selected = day ?? days[0];
  const todays = companies.length ? companiesOn(selected) : [];
  const when = whenLabel(selected);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border bg-card shadow-sm">
        <header className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            aria-label="Back"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">Delivery Schedule</h1>
            <p className="text-xs text-foreground-secondary">Plan your orders around delivery days</p>
          </div>
        </header>

        {/* day strip — the next six delivery days, today first */}
        {companies.length > 0 && (
          <div role="tablist" aria-label="Delivery day" className="grid grid-cols-6 gap-1.5 px-4 pb-3">
            {days.map((d) => {
              const date = nextDateOf(d);
              const active = d === selected;
              const isToday = whenLabel(d) === 'Today';
              return (
                <button
                  key={d}
                  role="tab"
                  aria-selected={active}
                  aria-label={`${d}, ${shortDate(date)}`}
                  onClick={() => onDayChange(d)}
                  className={cn(
                    'flex flex-col items-center rounded-lg border py-1.5 active:scale-[0.97]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isToday
                        ? 'border-primary bg-card text-primary'
                        : 'border-border bg-card text-foreground'
                  )}
                >
                  <span className="text-2xs font-semibold uppercase tracking-wider">{d.slice(0, 3)}</span>
                  <span className="text-base font-bold leading-tight">{date.getDate()}</span>
                  {/* one dot per company that day — how busy the day is, at a glance */}
                  {isToday ? (
                    <span className={cn('text-2xs', active ? 'text-primary-foreground/80' : 'text-primary')}>Today</span>
                  ) : (
                    <span aria-hidden className="flex h-4 items-center gap-0.5">
                      {companiesOn(d).map((c) => (
                        <span
                          key={c.id}
                          className={cn('h-1 w-1 rounded-full', active ? 'bg-primary-foreground' : 'bg-foreground-tertiary')}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {companies.length === 0 ? (
        <div className="grid flex-1 place-items-center bg-background-subtle">
          <EmptyState
            icon={<CalendarX strokeWidth={1.75} />}
            title="No delivery schedule yet"
            description="We're onboarding distributors in your area. Their delivery days will appear here."
          />
        </div>
      ) : (
        <div key={selected} className="no-scrollbar animate-screen flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
          {/* the selected day */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-sm font-semibold text-foreground">
                {selected}, {shortDate(nextDateOf(selected))}
              </h2>
              {when === 'Today' && <Badge variant="success">Today</Badge>}
              {when === 'Tomorrow' && <Badge variant="info">Tomorrow</Badge>}
              <span className="ml-auto text-xs text-foreground-secondary">
                {todays.length} {todays.length === 1 ? 'company' : 'companies'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {todays.map((c) => (
                <CompanyTile key={c.id} company={c} onClick={() => onOpenCompany(c.id)} />
              ))}
            </div>
          </section>

          <InlineMessage
            variant="info"
            title="Order a day ahead"
            description="Each company's distributor delivers to your area on its day. Order the day before so your stock is on that van."
          />

          {/* the whole week — the timetable itself */}
          <section className="space-y-1.5">
            <h2 className="px-1 text-2xs font-semibold uppercase tracking-wider text-foreground-secondary">
              Weekly timetable
            </h2>
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              {days.map((d) => {
                const active = d === selected;
                return (
                  <div key={d} className={cn('flex items-center gap-3 px-3 py-2.5', active && 'bg-primary-soft')}>
                    <button
                      onClick={() => onDayChange(d)}
                      aria-label={`Show ${d}`}
                      className="w-16 shrink-0 text-left active:scale-[0.98]"
                    >
                      <span className={cn('block text-sm font-semibold', active ? 'text-primary' : 'text-foreground')}>
                        {d.slice(0, 3)}
                      </span>
                      <span className="block text-2xs text-foreground-secondary">{whenLabel(d)}</span>
                    </button>
                    <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                      {companiesOn(d).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => onOpenCompany(c.id)}
                          aria-label={`${c.name} distributors`}
                          className="rounded-md border border-border bg-card p-0.5 active:scale-[0.96]"
                        >
                          <BrandLogo src={c.logo} alt={c.name} className="h-9 w-9 rounded" imgClassName="p-0 scale-110" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-16 shrink-0 text-sm font-semibold text-foreground-tertiary">Sun</span>
                <span className="text-xs text-foreground-tertiary">No deliveries</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/* A company on the selected day — the Brands-tab plate, with how many
   authorised distributors carry it underneath. */
function CompanyTile({ company: c, onClick }: { company: ScheduleCompany; onClick: () => void }) {
  const n = c.distributors.length;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${c.name} — ${n} ${n === 1 ? 'distributor' : 'distributors'}`}
      className="rounded-lg border border-border bg-card p-1.5 shadow-sm active:scale-[0.98]"
    >
      <BrandLogo src={c.logo} alt={c.name} className="aspect-square w-full rounded" imgClassName="p-0 scale-110" />
      <span className="mt-1 block truncate text-center text-xs font-semibold text-foreground">{c.name}</span>
      <span className="block truncate text-center text-2xs text-foreground-secondary">
        {n} {n === 1 ? 'distributor' : 'distributors'}
      </span>
    </button>
  );
}
