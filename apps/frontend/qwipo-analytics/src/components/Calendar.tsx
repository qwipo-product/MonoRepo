// Range calendar for the filter panel. Click once for the start day, again for
// the end; clicking the same day twice selects a single day. Pure presentation
// — real Date math, mockup data limits nothing.
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@mockups/ui';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const sameDay = (a?: Date, b?: Date) => !!a && !!b && a.toDateString() === b.toDateString();

export function Calendar({
  from, to, onSelect,
}: {
  from?: Date; to?: Date; onSelect: (from: Date, to?: Date) => void;
}) {
  const [cursor, setCursor] = useState(from ?? new Date(2026, 7, 1)); // Aug 2026
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7; // Monday-first
  const days = new Date(y, m + 1, 0).getDate();

  const pick = (d: number) => {
    const date = new Date(y, m, d);
    if (!from || (from && to)) onSelect(date, undefined);
    else if (date < from) onSelect(date, from);
    else onSelect(from, date);
  };

  return (
    <div className="p-1">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => setCursor(new Date(y, m - 1, 1))} className="grid h-7 w-7 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
          <ChevronLeft size={15} />
        </button>
        <span className="type-label">{cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
        <button type="button" aria-label="Next month" onClick={() => setCursor(new Date(y, m + 1, 1))} className="grid h-7 w-7 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {DOW.map((d, i) => <span key={i} className="type-micro py-1 text-foreground-tertiary">{d}</span>)}
        {Array.from({ length: firstDow }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const date = new Date(y, m, i + 1);
          const isEnd = sameDay(date, from) || sameDay(date, to);
          const inRange = from && to && date > from && date < to;
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i + 1)}
              className={cn(
                'type-caption h-8 rounded-md tabular-nums hover:bg-muted',
                inRange && 'rounded-none bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft',
                isEnd && 'bg-primary font-medium text-primary-foreground hover:bg-primary',
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="type-caption mt-2 text-foreground-secondary">
        {!from ? 'Pick a start day' : !to ? 'Pick an end day — same day again for a single day' :
          sameDay(from, to) ? 'Single day selected' : 'Range selected'}
      </div>
    </div>
  );
}
