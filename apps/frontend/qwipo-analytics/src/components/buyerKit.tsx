// Pieces shared by the DigiDukaan · Buyer pages: the scope bar (date range in
// dd-mm-yyyy + State / City / Distributor), table chrome (search, filter
// selects, pager, export header), a right-side drawer and CSV export.
import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Download, RotateCcw, Search, X } from 'lucide-react';
import { Button, Card, Input, cn } from '@mockups/ui';
import { Calendar } from './Calendar';
import { dmy, geoText, num, rangeText } from './buyerFormat';
import {
  DEFAULT_SCOPE, FIRST_DAY, TODAY, citiesOf, distributorsIn, presetRange, states,
  type BuyerScope, type Preset,
} from '../data/buyer';
import { useBuyerScope } from '../scope';

export function BuyerScopeBar({ note }: { note?: string }) {
  const { s, setS } = useBuyerScope();
  const set = (p: Partial<BuyerScope>) => setS({ ...s, ...p });
  const applyPreset = (p: Preset) => { const [from, to] = presetRange(p); set({ preset: p, from, to }); };
  const dists = distributorsIn(s);
  const changed = s.preset !== DEFAULT_SCOPE.preset || s.state !== 'All' || s.city !== 'All' || s.distributor !== 'All';

  return (
    <Card className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <DateInput label="From" date={s.from} max={s.to} onPick={(d) => set({ preset: 'Custom', from: d })} />
        <span className="text-foreground-tertiary">–</span>
        <DateInput label="To" date={s.to} min={s.from} onPick={(d) => set({ preset: 'Custom', to: d })} />
        <div className="flex gap-1">
          {(['Today', 'Last 7 Days', 'Last 30 Days', 'All Time'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => applyPreset(p)}
              className={cn(
                'type-caption h-8 whitespace-nowrap rounded-full border px-3 font-medium',
                s.preset === p ? 'border-primary bg-primary-soft text-primary-soft-foreground' : 'border-border text-foreground-secondary hover:bg-muted',
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="mx-1 h-6 w-px bg-border" />
        <FilterSelect label="State" value={s.state} options={states}
          onChange={(v) => set({ state: v, city: 'All', distributor: 'All' })} />
        <FilterSelect label="City" value={s.city} options={citiesOf(s.state)}
          onChange={(v) => set({ city: v, distributor: 'All' })} />
        <FilterSelect label="Distributor" value={s.distributor} options={dists.map((d) => d.name)}
          onChange={(v) => set({ distributor: v })} />
        {changed && (
          <button type="button" onClick={() => setS(DEFAULT_SCOPE)} className="type-caption flex items-center gap-1 px-1.5 font-medium text-link hover:underline">
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>
      <div className="type-caption mt-2.5 flex flex-wrap justify-between gap-2 text-foreground-secondary">
        <span>
          Showing <b className="font-semibold tabular-nums text-foreground">{rangeText(s)}</b>
          {s.preset !== 'Custom' && <span className="text-foreground-tertiary"> · {s.preset}</span>}
          {' · '}<b className="font-semibold text-foreground">{geoText(s)}</b>
          {note && <span className="text-foreground-tertiary"> · {note}</span>}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Buyer app data · refreshed 22-08-2026 18:30 IST
        </span>
      </div>
    </Card>
  );
}

/* ---------------------------------- toast ---------------------------------- */

/** Bottom toast; returns the node to render and a trigger. */
// eslint-disable-next-line react-refresh/only-export-components
export function useFlash() {
  const [msg, setMsg] = useState<string | null>(null);
  const flash = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(null), 3500); };
  const node = msg && (
    <div className="type-caption fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-success-border bg-success-subtle px-4 py-2.5 font-medium text-success-foreground shadow-md">
      {msg}
    </div>
  );
  return [node, flash] as const;
}

/* ---------------------------------- table ---------------------------------- */

export function SectionHead({ title, sub, onExport, right }: { title: string; sub: string; onExport?: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
      <div>
        <div className="type-h3">{title}</div>
        <div className="type-caption text-foreground-secondary">{sub}</div>
      </div>
      <span className="flex items-center gap-2">
        {right}
        {onExport && <Button variant="secondary" size="sm" onClick={onExport}><Download size={14} /> Export</Button>}
      </span>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-64">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 pl-8" />
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label
      className={cn(
        'type-caption flex h-9 items-center gap-1.5 rounded-md border pl-2.5 pr-1',
        value !== 'All' ? 'border-primary bg-primary-soft text-primary-soft-foreground' : 'border-border bg-card text-foreground-secondary',
      )}
    >
      <span className="whitespace-nowrap">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[170px] cursor-pointer bg-transparent py-1 pr-1 font-medium text-foreground outline-none"
      >
        <option value="All">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

export function ClearBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="type-caption flex items-center gap-1 px-1.5 font-medium text-link hover:underline">
      <X size={13} /> Clear filters
    </button>
  );
}

export function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols} className="py-10 text-center text-foreground-secondary">
        {text} — try a wider date range, another state or city, or clear filters.
      </td>
    </tr>
  );
}

export function Pager({ page, per, total, unit, onPage }: { page: number; per: number; total: number; unit: string; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / per));
  if (total <= per) return null;
  return (
    <div className="flex items-center justify-between border-t border-border-subtle px-5 py-3">
      <span className="type-caption tabular-nums text-foreground-secondary">
        {page * per + 1}–{Math.min(total, page * per + per)} of {num(total)} {unit}
      </span>
      <span className="flex gap-1.5">
        <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}><ChevronLeft size={14} /> Prev</Button>
        <Button variant="secondary" size="sm" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>Next <ChevronRight size={14} /></Button>
      </span>
    </div>
  );
}

/** Stat tile used on the buyer pages; clickable when it filters something below. */
export function Stat({ label, value, note, tone, active, onClick }: {
  label: string; value: string; note?: React.ReactNode; tone?: 'warning' | 'error' | 'success'; active?: boolean; onClick?: () => void;
}) {
  return (
    <Card
      variant={onClick ? 'interactive' : 'default'}
      onClick={onClick}
      className={cn(
        'px-4 py-3',
        tone === 'warning' && 'border-l-[3px] border-l-warning',
        tone === 'error' && 'border-l-[3px] border-l-error',
        tone === 'success' && 'border-l-[3px] border-l-success',
        active && 'ring-2 ring-primary',
      )}
    >
      <div className="type-caption text-foreground-secondary">{label}</div>
      <div className="type-h1 my-0.5 tabular-nums tracking-tight">{value}</div>
      {note && <div className="type-caption text-foreground-secondary">{note}</div>}
    </Card>
  );
}

/* ---------------------------------- drawer --------------------------------- */

export function Drawer({ title, sub, onClose, width = 'w-[560px]', children, footer }: {
  title: React.ReactNode; sub?: React.ReactNode; onClose: () => void; width?: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className={cn('animate-slide-in-right fixed right-0 top-0 flex h-dvh flex-col border-l border-border bg-card shadow-xl', width)}
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true"
      >
        <header className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="flex-1 leading-tight">
            <span className="type-h3 block">{title}</span>
            {sub && <span className="type-caption mt-0.5 block text-foreground-secondary">{sub}</span>}
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
            <X size={17} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="flex gap-2 border-t border-border p-4">{footer}</footer>}
      </aside>
    </div>
  );
}

export function DrawerSection({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-b border-border-subtle px-5 py-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="type-micro text-foreground-tertiary">{title}</span>
        {right}
      </div>
      {children}
    </section>
  );
}

/* ----------------------------------- date ---------------------------------- */

/** dd-mm-yyyy field with a calendar popover. */
export function DateInput({ label, date, min, max, onPick }: { label: string; date: Date; min?: Date; max?: Date; onPick: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn('flex h-9 items-center gap-2 rounded-md border bg-card px-2.5 hover:bg-muted', open ? 'border-ring ring-2 ring-ring/30' : 'border-border')}
      >
        <CalendarDays size={14} className="text-foreground-tertiary" />
        <span className="type-caption text-foreground-secondary">{label}</span>
        <span className="type-label tabular-nums">{dmy(date)}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} role="presentation" />
          <div className="absolute left-0 top-11 z-50 w-[300px] rounded-xl border border-border bg-card shadow-xl">
            <Calendar
              selected={date}
              onPick={(d) => {
                const floor = min && new Date(min.getFullYear(), min.getMonth(), min.getDate());
                if (d > TODAY || d < FIRST_DAY || (floor && d < floor) || (max && d > max)) return;
                onPick(d); setOpen(false);
              }}
            />
            <div className="type-caption border-t border-border-subtle px-3 py-2 text-foreground-tertiary">
              {min ? `On or after ${dmy(min)}` : max ? `On or before ${dmy(max)}` : ''} · data from {dmy(FIRST_DAY)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
