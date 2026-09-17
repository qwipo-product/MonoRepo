// From/To date field whose calendar opens as its own popup over the drawer.
import { CalendarDays, X } from 'lucide-react';
import { cn } from '@mockups/ui';
import { Calendar } from './Calendar';

const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** From/To field. Its calendar opens as its OWN popup floating to the left of
 *  the drawer — never a popup nested inside the drawer's 360px. */
export function DateField({
  label, date, open, onOpen, onClose, onPick, rangeStart, rangeEnd,
}: {
  label: string; date?: Date; open: boolean; onOpen: () => void; onClose: () => void;
  onPick: (d: Date) => void; rangeStart?: Date; rangeEnd?: Date;
}) {
  return (
    <>
      <button
        type="button"
        onClick={open ? onClose : onOpen}
        className={cn(
          'flex w-full items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-left hover:bg-muted',
          open ? 'border-ring ring-2 ring-ring/30' : 'border-border',
        )}
      >
        <CalendarDays size={14} className="shrink-0 text-foreground-tertiary" />
        <span className="leading-tight">
          <span className="type-micro block normal-case tracking-normal text-foreground-secondary">{label}</span>
          <span className="type-label block">{date ? fmt(date) : <span className="text-foreground-secondary">Select</span>}</span>
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} role="presentation" />
          <div className="fixed right-4 top-24 z-50 w-[328px] rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
              <span className="type-label">Select {label.toLowerCase()} date</span>
              <button type="button" onClick={onClose} aria-label="Close" className="grid h-7 w-7 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
                <X size={15} />
              </button>
            </div>
            <Calendar selected={date} rangeStart={rangeStart} rangeEnd={rangeEnd} onPick={onPick} />
          </div>
        </>
      )}
    </>
  );
}

