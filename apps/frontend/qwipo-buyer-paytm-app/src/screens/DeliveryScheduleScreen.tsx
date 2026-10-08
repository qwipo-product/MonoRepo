import { useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, ChevronLeft, Info, MapPin, Repeat } from 'lucide-react';
import { Button, EmptyState, cn } from '@mockups/ui';
import { CompanyLogo } from '../components/CompanyLogo';
import { distributorsFor, nextDeliveryDays, relativeLabel, type Zone } from '../data/beatSchedule';

/* Delivery Schedule (customer · My Account) and Beat Schedule (salesperson ·
   bottom tab) — one page, two doors.

     next six delivery days (Sunday skipped) · dots = companies that day
     the chosen day's companies → tap → that company's distributors
     "Order a day ahead"
     the whole week, logos tappable

   The timetable is the zone of the shop being ordered for: the buyer's own
   shop, or — for a salesperson — whichever customer they've switched to. */

export function DeliveryScheduleScreen({
  title,
  zone,
  onBack,
  forShop,
  onOpenCompany,
}: {
  title: string;
  zone: Zone;
  /** Pushed screen (customer) → Back; root tab (salesperson) → none. */
  onBack?: () => void;
  /** Salesperson: whose schedule this is, with a way to switch. */
  forShop?: { name: string; area: string; onChange: () => void };
  onOpenCompany: (companyId: string) => void;
}) {
  const days = useMemo(() => nextDeliveryDays(zone), [zone]);
  const [selected, setSelected] = useState(0);
  const day = days[Math.min(selected, days.length - 1)];

  return (
    <div className="flex h-full flex-col bg-background-subtle">
      <header className="shrink-0 border-b border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
            <p className="truncate text-xs text-foreground-secondary">Plan your orders around delivery days</p>
          </div>
        </div>

        {forShop && (
          <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs text-foreground-secondary">Schedule for</div>
              <div className="truncate text-sm font-semibold text-foreground">{forShop.name}</div>
              <div className="truncate text-xs text-foreground-secondary">{forShop.area}</div>
            </div>
            <button
              onClick={forShop.onChange}
              className="flex shrink-0 items-center gap-1 rounded-md border border-primary bg-card px-2.5 py-1.5 text-xs font-semibold text-primary active:scale-[0.98]"
            >
              <Repeat className="h-3.5 w-3.5" /> Change
            </button>
          </div>
        )}

        {/* next six delivery days */}
        <div className="grid grid-cols-6 gap-1.5 px-4 pb-3" role="tablist" aria-label="Delivery days">
          {days.map((d, i) => {
            const on = i === selected;
            const today = d.offset === 0;
            return (
              <button
                key={d.date.toISOString()}
                role="tab"
                aria-selected={on}
                onClick={() => setSelected(i)}
                className={cn(
                  'flex flex-col items-center rounded-lg border py-1.5 active:scale-[0.97]',
                  on
                    ? 'border-primary bg-primary text-primary-foreground'
                    : today
                      ? 'border-primary bg-card text-primary'
                      : 'border-border bg-card text-foreground'
                )}
              >
                <span className="text-2xs font-semibold">{d.short}</span>
                <span className="text-base font-bold leading-tight">{d.date.getDate()}</span>
                {today ? (
                  <span className="text-2xs">Today</span>
                ) : (
                  <span className="flex h-3 items-center gap-0.5" aria-label={`${d.companies.length} companies`}>
                    {d.companies.map((c) => (
                      <span key={c.id} className={cn('h-1 w-1 rounded-full', on ? 'bg-primary-foreground' : 'bg-foreground-tertiary')} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {/* the chosen day */}
        <section>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{day.title}</h2>
            {day.offset <= 1 && (
              <span className="rounded-full border border-success-border bg-success-subtle px-2 py-0.5 text-2xs font-bold uppercase text-success-foreground">
                {day.offset === 0 ? 'Today' : 'Tomorrow'}
              </span>
            )}
            <span className="ml-auto text-xs text-foreground-secondary">
              {day.companies.length} {day.companies.length === 1 ? 'company' : 'companies'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {day.companies.map((c) => {
              const n = distributorsFor(c).length;
              return (
                <button
                  key={c.id}
                  onClick={() => onOpenCompany(c.id)}
                  className="rounded-lg border border-border bg-card p-2 text-center shadow-sm active:scale-[0.98]"
                >
                  <div className="aspect-square w-full">
                    <CompanyLogo company={c} className="border-0" />
                  </div>
                  <div className="mt-1 truncate text-xs font-semibold text-foreground">{c.name}</div>
                  <div className="text-2xs text-foreground-secondary">
                    {n} {n === 1 ? 'distributor' : 'distributors'}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex gap-2.5 rounded-lg border border-info-border bg-info-subtle p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info-foreground" />
          <div className="text-sm">
            <div className="font-semibold text-info-foreground">Order a day ahead</div>
            <p className="mt-0.5 text-info-foreground">
              Each company&apos;s distributor delivers to your area on its day. Order the day before so your stock is
              on that van.
            </p>
          </div>
        </div>

        {/* the whole week */}
        <section>
          <h2 className="mb-2 px-1 text-2xs font-semibold uppercase tracking-wider text-foreground-secondary">
            Weekly timetable
          </h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {days.map((d, i) => (
              <WeekRow
                key={d.date.toISOString()}
                active={i === selected}
                day={d.long.slice(0, 3)}
                sub={relativeLabel(d)}
                onPickDay={() => setSelected(i)}
              >
                {d.companies.map((c) => (
                  <button key={c.id} onClick={() => onOpenCompany(c.id)} aria-label={c.name} className="active:scale-95">
                    <CompanyLogo company={c} size="sm" />
                  </button>
                ))}
              </WeekRow>
            ))}
            <WeekRow day="Sun" muted>
              <span className="text-xs text-foreground-secondary">No deliveries</span>
            </WeekRow>
          </div>
        </section>
      </div>
    </div>
  );
}

function WeekRow({
  day,
  sub,
  active,
  muted,
  onPickDay,
  children,
}: {
  day: string;
  sub?: string;
  active?: boolean;
  muted?: boolean;
  onPickDay?: () => void;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-0', active && 'bg-primary-soft')}>
      <button
        onClick={onPickDay}
        disabled={!onPickDay}
        className="w-16 shrink-0 text-left disabled:cursor-default"
      >
        <div className={cn('text-sm font-semibold', active ? 'text-primary' : muted ? 'text-foreground-secondary' : 'text-foreground')}>
          {day}
        </div>
        {sub && <div className="text-2xs text-foreground-secondary">{sub}</div>}
      </button>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/* Salesperson · Beat Schedule before any customer is chosen: the timetable
   depends on the shop's location, so there is nothing to show until they
   switch into a customer. */
export function BeatSchedulePrompt({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="flex h-full flex-col bg-background-subtle">
      <header className="shrink-0 border-b border-border bg-card px-4 py-3 shadow-sm">
        <h1 className="text-base font-semibold leading-tight">Beat Schedule</h1>
        <p className="text-xs text-foreground-secondary">Plan your orders around delivery days</p>
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          icon={<CalendarDays strokeWidth={1.75} />}
          title="Switch to a customer"
          description="Delivery days depend on where the shop is. Switch to a customer to see their beat schedule."
          action={
            <Button onClick={onSwitch}>
              <Repeat size={16} /> Switch Customer
            </Button>
          }
        />
      </div>
    </div>
  );
}
