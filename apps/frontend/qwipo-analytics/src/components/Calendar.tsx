// Single-date month calendar used by the From / To fields in the filter
// panel. `selected` is this field's date; `rangeStart`/`rangeEnd` shade the
// overall range for context.
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@mockups/ui';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const sameDay = (a?: Date, b?: Date) => !!a && !!b && a.toDateString() === b.toDateString();

export function Calendar({
  selected, rangeStart, rangeEnd, onPick,
}: {
  selected?: Date; rangeStart?: Date; rangeEnd?: Date; onPick: (d: Date) => void;
}) {
  const [cursor, setCursor] = useState(selected ?? rangeStart ?? new Date(2026, 7, 1));
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7; // Monday-first
  const days = new Date(y, m + 1, 0).getDate();

  return (
    <div className="p-2">
      <div className="mb-1.5 flex items-center justify-between">
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
          const isSel = sameDay(date, selected);
          const isEnd = sameDay(date, rangeStart) || sameDay(date, rangeEnd);
          const inRange = rangeStart && rangeEnd && date > rangeStart && date < rangeEnd;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(date)}
              className={cn(
                'type-caption h-8 rounded-md tabular-nums hover:bg-muted',
                inRange && 'rounded-none bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft',
                (isSel || isEnd) && 'bg-primary font-medium text-primary-foreground hover:bg-primary',
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
