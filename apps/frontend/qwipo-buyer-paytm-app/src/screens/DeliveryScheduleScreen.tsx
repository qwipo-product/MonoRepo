import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Repeat } from 'lucide-react';
import { Button, EmptyState, cn } from '@mockups/ui';
import { CompanyLogo } from '../components/CompanyLogo';
import { Wordmark } from '../components/Wordmark';
import { brandLogo, nextDeliveryDays, type Weekday, type Zone } from '../data/beatSchedule';

/* Beat Day Delivery Time Table — customer (My Account) and salesperson
   (bottom tab), one page, two doors:

     the weekdays across the top, Monday to Saturday — Monday chosen on open
     "Companies" down the left, one per line — the first chosen on open; the
       chosen one lifted like a hovered card, with an arrow
     "Brands" on the right, one per line — logo (or a name tile) and the name
       in bold

   No dark blue blocks: the chosen day and company are lifted white cards
   with a blue outline and a shadow.

   Picking another day lists that day's companies and chooses its first one.
   The week is the zone of the shop being ordered for: the buyer's delivery
   address, or the customer a salesperson switched to. */

export function DeliveryScheduleScreen({
  title,
  zone,
  onBack,
  place,
}: {
  title: string;
  zone: Zone;
  /** Pushed screen (customer) → Back; root tab (salesperson) → none. */
  onBack?: () => void;
  /** Salesperson: the customer they switched to and its area, with a way to
   *  switch. The customer app shows none — its week follows the buyer's
   *  delivery address. */
  place?: SchedulePlace;
}) {
  // The six delivery days, Monday → Saturday.
  const week = useMemo(() => [...nextDeliveryDays(zone)].sort((a, b) => a.weekday - b.weekday), [zone]);
  const [dayId, setDayId] = useState<Weekday>(1);
  const day = week.find((d) => d.weekday === dayId) ?? week[0];
  // The chosen company; every day opens on its first one.
  const [picked, setPicked] = useState<string | null>(null);
  const company = day.companies.find((c) => c.id === picked) ?? day.companies[0];
  const pickDay = (w: Weekday) => {
    setDayId(w);
    setPicked(null);
  };

  return (
    <div className="relative flex h-full flex-col bg-background-subtle">
      <ScheduleHeader title={title} onBack={onBack} place={place} />

      {/* the weekday header: a labelled control — "Select delivery day" — with
          the six days in one light-blue track; the chosen day simply filled
          solid blue (no lift), the only solid blue on the screen */}
      <div className="shrink-0 border-b border-border bg-card px-3 pb-3 pt-2.5">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
          <CalendarDays className="h-4 w-4 text-primary" /> Select delivery day
        </div>
        <div role="tablist" aria-label="Delivery days" className="grid grid-cols-6 gap-1 rounded-2xl bg-primary/10 p-1 ring-1 ring-primary/25">
          {week.map((d) => {
            const on = d.weekday === day.weekday;
            return (
              <button
                key={d.weekday}
                role="tab"
                aria-selected={on}
                onClick={() => pickDay(d.weekday)}
                className={cn(
                  'h-10 rounded-xl text-[15px] font-bold transition-colors active:scale-95',
                  on ? 'bg-primary text-primary-foreground' : 'text-primary/80'
                )}
              >
                {d.short.charAt(0) + d.short.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      {day.companies.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-foreground-secondary">
          <CalendarDays className="h-8 w-8" />
          <p className="text-base font-medium">No deliveries on {day.long}.</p>
        </div>
      ) : (
        <div className="mx-2 mb-2 mt-2.5 flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
          {/* Companies — one per line; the chosen one lifted like a hovered
              card (white, blue outline, shadow, a touch bigger) with an arrow
              pointing at its brands */}
          <div className="flex w-[42%] shrink-0 flex-col border-r border-border bg-muted">
            <div className="shrink-0 border-b border-border px-3 py-2 text-sm font-bold text-foreground">Companies</div>
            <div role="listbox" aria-label={`Companies on ${day.long}`} className="no-scrollbar min-h-0 flex-1 divide-y divide-border overflow-y-auto overflow-x-hidden bg-muted">
              {day.companies.map((c) => {
                const on = c.id === company?.id;
                return (
                  <button
                    key={c.id}
                    role="option"
                    aria-selected={on}
                    onClick={() => setPicked(c.id)}
                    className={cn(
                      // Every row the same width (the arrow sits in the right
                      // padding), so the chosen card never squeezes the name.
                      'relative flex w-full items-center gap-2 py-2 pl-2 pr-5 text-left transition-all duration-200 ease-out active:bg-muted',
                      on ? 'z-10 rounded-lg bg-card text-primary shadow-lg ring-2 ring-inset ring-primary' : 'text-foreground'
                    )}
                  >
                    <span className="h-10 w-10 shrink-0 rounded-lg border border-border bg-white">
                      <CompanyLogo company={c} className="rounded-lg" />
                    </span>
                    {/* Full size always; a long name wraps onto the next line
                        (a long single word like "CavinKare" breaks with a hyphen). */}
                    <span lang="en" className="min-w-0 flex-1 hyphens-auto text-sm font-bold leading-tight [overflow-wrap:anywhere]">
                      {c.name}
                    </span>
                    {on && <ChevronRight className="absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brands — of the chosen company, one per line, on light blue (the
              companies sit on grey, so the two columns read as different) */}
          {company && (
            <div className="flex min-w-0 flex-1 flex-col bg-primary/10">
              <div className="shrink-0 border-b border-primary/25 bg-primary/10 px-3 py-2 text-sm font-bold text-primary">Brands</div>
              <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-2.5">
                <div className="divide-y divide-border border-b border-border">
                  {company.brands.map((b) => (
                    <BrandLine key={b} name={b} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* One brand on its own line: its logo (or a name tile where the app has no
   logo yet) and the name in bold — icon and name both clearly visible. */
function BrandLine({ name }: { name: string }) {
  // A listed logo file that's missing (Red Label's, today) falls back to the name tile.
  const [broken, setBroken] = useState(false);
  const logo = broken ? undefined : brandLogo(name);
  return (
    <div className="flex items-center gap-2.5 py-2">
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-white">
        {logo ? (
          <img src={encodeURI(logo)} alt="" onError={() => setBroken(true)} className="h-full w-full scale-110 object-contain" />
        ) : (
          <Wordmark text={name} className="p-1" />
        )}
      </span>
      <span className="min-w-0 text-[15px] font-bold leading-tight text-foreground">{name}</span>
    </div>
  );
}

/** The place a Beat Day Delivery Time Table can be opened for: the customer a
 *  salesperson switched to and its area, with a way to switch. */
export type SchedulePlace = { name: string; area: string; onChange: () => void };

/* The time table's header: title, then for a
   salesperson the area and shop with Change (the customer app just says what
   the screen is for). */
export function ScheduleHeader({ title, onBack, place }: { title: string; onBack?: () => void; place?: SchedulePlace }) {
  return (
    <header className="shrink-0 border-b border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 px-4 py-2.5">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {/* Salesperson: whose timetable this is, and for which area — one line
            in the header, with Change, so the week keeps the height. */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
          {place ? (
            <p className="flex min-w-0 items-center gap-1 text-xs text-foreground-secondary">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">
                {/* The area first — it's what decides the week — then whose. */}
                <b className="font-semibold text-foreground">{place.area}</b> · {place.name}
              </span>
            </p>
          ) : (
            <p className="truncate text-xs text-foreground-secondary">Plan your orders around delivery days</p>
          )}
        </div>
        {place && (
          <button
            onClick={place.onChange}
            className="flex shrink-0 items-center gap-1 rounded-md border border-primary bg-card px-2.5 py-1.5 text-xs font-semibold text-primary active:scale-[0.98]"
          >
            <Repeat className="h-3.5 w-3.5" /> Change
          </button>
        )}
      </div>
    </header>
  );
}

/* The shop's location isn't inside any beat area yet (no pincode or place
   the admin has mapped), so there are no delivery days to show — said
   plainly, rather than showing another area's week. */
export function NoBeatArea({ title, onBack, place }: { title: string; onBack?: () => void; place?: SchedulePlace }) {
  return (
    <div className="relative flex h-full flex-col bg-background-subtle">
      <ScheduleHeader title={title} onBack={onBack} place={place} />
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          icon={<MapPin strokeWidth={1.75} />}
          title="No delivery days for this area yet"
          description={
            place
              ? "This shop's area isn't on a delivery beat yet. Once it's added, its delivery days show here."
              : "Your delivery address isn't on a delivery beat yet. Once it's added, its delivery days show here."
          }
        />
      </div>
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
        <h1 className="text-base font-semibold leading-tight">Beat Day Delivery Time Table</h1>
        <p className="text-xs text-foreground-secondary">Plan your orders around delivery days</p>
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          icon={<CalendarDays strokeWidth={1.75} />}
          title="Switch to a customer"
          description="Delivery days depend on where the shop is. Switch to a customer to see their beat day delivery time table."
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
