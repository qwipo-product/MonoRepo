// Pieces shared by the DigiDukaan · Buyer pages: the scope bar (same chip
// grammar as the seller ScopeBar — Date, State, City, Distributor, Team — plus
// one universal search that opens the drill-down dashboard of whatever it
// finds), its filter panel, the Attention card, a right-side drawer and a toast.
import { useState } from 'react';
import { CalendarDays, ChevronLeft, Search, SlidersHorizontal, Store, Truck, UserRound, X } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, cn } from '@mockups/ui';
import { Calendar } from './Calendar';
import { Chip } from './Chip';
import { Section, Option } from './filterControls';
import { dmy, geoText, rangeText } from './buyerFormat';
import { useBuyerDrill } from './buyerDrillContext';
import {
  DEFAULT_SCOPE, FIRST_DAY, TODAY, citiesOf, distributorsIn, leads, presetRange, states,
  type BuyerScope, type Preset,
} from '../data/buyer';
import { previousScope, searchBuyer, type SearchHit } from '../data/buyerMetrics';
import { useBuyerScope } from '../scope';

const PRESETS: Exclude<Preset, 'Custom'>[] = ['Today', 'Last 7 Days', 'Month to date', 'Last 30 Days', 'All Time'];

export function BuyerScopeBar() {
  const { s, setS } = useBuyerScope();
  const [open, setOpen] = useState(false);
  const openPanel = () => setOpen(true);
  const prev = previousScope(s);
  const changed = s.preset !== DEFAULT_SCOPE.preset || s.state !== 'All' || s.city !== 'All' || s.distributor !== 'All' || s.team !== 'All';

  // A filter with a selection shows its value as a removable chip; otherwise "All (n)".
  const groups: { label: string; value: string; total: number; clear: Partial<BuyerScope> }[] = [
    { label: 'State', value: s.state, total: states.length, clear: { state: 'All', city: 'All', distributor: 'All' } },
    { label: 'City', value: s.city, total: citiesOf(s.state).length, clear: { city: 'All', distributor: 'All' } },
    { label: 'Distributor', value: s.distributor, total: distributorsIn(s).length, clear: { distributor: 'All' } },
    { label: 'Team', value: s.team, total: leads.length, clear: { team: 'All' } },
  ];

  return (
    <Card className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip label="Date" value={`${dmy(s.from)} – ${dmy(s.to)}${s.preset !== 'Custom' ? ` · ${s.preset}` : ''}`} active={s.preset !== DEFAULT_SCOPE.preset} onClick={openPanel} />
        {groups.map((g) => g.value === 'All'
          ? <Chip key={g.label} label={g.label} value={`All (${g.total})`} onClick={openPanel} />
          : <Chip key={g.label} label={g.label} value={g.value} active onClick={openPanel} onRemove={() => setS({ ...s, ...g.clear })} />)}
        <span className="ml-auto flex items-center gap-1.5">
          <UniversalSearch />
          {changed && <Button variant="ghost" size="sm" className="text-link" onClick={() => setS(DEFAULT_SCOPE)}>Reset</Button>}
          <Button variant="secondary" size="sm" onClick={openPanel}><SlidersHorizontal size={14} /> Filters</Button>
        </span>
      </div>
      <div className="type-caption mt-2.5 flex flex-wrap justify-between gap-2 text-foreground-secondary">
        <span>
          {prev ? <>Compared with <b className="font-medium text-foreground">{rangeText(prev)}</b></> : 'No earlier period in the ledger to compare'}
          {' · '}{geoText(s)} · same filters on every Buyer page
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Buyer app data · refreshed {dmy(TODAY)} 18:30 IST
        </span>
      </div>
      {open && <BuyerFilterPanel value={s} onClose={() => setOpen(false)} onApply={setS} />}
    </Card>
  );
}

/* ----------------------------- universal search ---------------------------- */

const hitIcon = { distributor: Truck, ba: UserRound, customer: Store } as const;
const hitGroup = { distributor: 'Distributors', ba: 'Salespersons (BA)', customer: 'Customers' } as const;

/** One search for every buyer page: pick a result to open its drill-down dashboard. */
function UniversalSearch() {
  const { s } = useBuyerScope();
  const drill = useBuyerDrill();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const hits = searchBuyer(q, s);
  const pick = (h: SearchHit) => {
    setQ(''); setFocus(false);
    drill.open(h.kind === 'customer' ? { kind: 'customer', id: h.key } : h.kind === 'ba' ? { kind: 'ba', name: h.key } : { kind: 'distributor', name: h.key });
  };
  return (
    <div className="relative">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => window.setTimeout(() => setFocus(false), 150)}
        onKeyDown={(e) => { if (e.key === 'Enter' && hits[0]) pick(hits[0]); if (e.key === 'Escape') setQ(''); }}
        placeholder="Search distributor, BA or customer"
        aria-label="Search distributor, BA or customer"
        className="h-9 w-72 pl-8"
      />
      {focus && q.trim().length >= 2 && (
        <div className="absolute right-0 top-11 z-40 w-[380px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          {hits.length === 0 ? (
            <p className="type-caption px-4 py-3 text-foreground-secondary">Nothing matches “{q}” in {geoText(s)}.</p>
          ) : (['distributor', 'ba', 'customer'] as const).map((k) => {
            const group = hits.filter((h) => h.kind === k);
            if (!group.length) return null;
            const Icon = hitIcon[k];
            return (
              <div key={k} className="border-b border-border-subtle py-1.5 last:border-b-0">
                <div className="type-micro px-4 py-1 text-foreground-tertiary">{hitGroup[k]}</div>
                {group.map((h) => (
                  <button
                    key={h.key}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(h)}
                    className="flex w-full items-center gap-2.5 px-4 py-1.5 text-left hover:bg-muted"
                  >
                    <Icon size={15} className="shrink-0 text-foreground-tertiary" />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="type-label block truncate">{h.title}</span>
                      <span className="type-caption block truncate text-foreground-secondary">{h.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
          <div className="type-caption border-t border-border-subtle bg-background-subtle px-4 py-2 text-foreground-tertiary">Opens the drill-down dashboard · within the current filters</div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- filter panel ------------------------------ */

function BuyerFilterPanel({ value, onClose, onApply }: { value: BuyerScope; onClose: () => void; onApply: (s: BuyerScope) => void }) {
  const [d, setD] = useState(value);
  const [distQ, setDistQ] = useState('');
  const set = (p: Partial<BuyerScope>) => setD({ ...d, ...p });
  const dists = distributorsIn(d).filter((x) => !distQ || x.name.toLowerCase().includes(distQ.toLowerCase()));
  const presetText = (p: Preset) => {
    const [from, to] = presetRange(p);
    return p === 'Today' ? `Today · ${dmy(TODAY)}` : `${p} · ${dmy(from)} – ${dmy(to)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[360px] flex-col border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Filters"
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary-soft-foreground"><SlidersHorizontal size={17} /></span>
          <span className="flex-1 leading-tight">
            <span className="type-h3 block">Filters</span>
            <span className="type-caption block text-foreground-secondary">Scope every card on the Buyer pages</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted"><X size={17} /></button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Section label="Date range">
            {PRESETS.map((p) => (
              <Option key={p} selected={d.preset === p} onClick={() => { const [from, to] = presetRange(p); set({ preset: p, from, to }); }}>{presetText(p)}</Option>
            ))}
            <Option selected={d.preset === 'Custom'} onClick={() => set({ preset: 'Custom' })}>Custom…</Option>
            {d.preset === 'Custom' && (
              <div className="mt-1.5 flex flex-col gap-2">
                <DateInput label="From" date={d.from} max={d.to} onPick={(x) => set({ from: x })} />
                <DateInput label="To" date={d.to} min={d.from} onPick={(x) => set({ to: x })} />
              </div>
            )}
          </Section>
          <Section label="State" hint="Telangana, Maharashtra, Rajasthan · changing state resets City and Distributor">
            {['All', ...states].map((x) => (
              <Option key={x} selected={d.state === x} muted={x === 'All'} onClick={() => set({ state: x, city: 'All', distributor: 'All' })}>{x === 'All' ? `All states (${states.length})` : x}</Option>
            ))}
          </Section>
          <Section label="City">
            {['All', ...citiesOf(d.state)].map((x) => (
              <Option key={x} selected={d.city === x} muted={x === 'All'} onClick={() => set({ city: x, distributor: 'All' })}>{x === 'All' ? `All cities (${citiesOf(d.state).length})` : x}</Option>
            ))}
          </Section>
          <Section label="Distributor" hint="Narrowed by state and city">
            <div className="relative mb-1.5">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
              <Input value={distQ} onChange={(e) => setDistQ(e.target.value)} placeholder="Search distributors" className="h-9 pl-8" />
            </div>
            {!distQ && <Option selected={d.distributor === 'All'} muted onClick={() => set({ distributor: 'All' })}>All distributors ({distributorsIn(d).length})</Option>}
            {dists.map((x) => (
              <Option key={x.name} selected={d.distributor === x.name} onClick={() => set({ distributor: x.name })}>
                {x.name}<span className="type-caption ml-1.5 text-foreground-tertiary">{x.city}</span>
              </Option>
            ))}
          </Section>
          <Section label="Team" hint="A team is one team lead's BAs">
            {['All', ...leads].map((x) => (
              <Option key={x} selected={d.team === x} muted={x === 'All'} onClick={() => set({ team: x })}>{x === 'All' ? `All teams (${leads.length})` : `Team ${x}`}</Option>
            ))}
          </Section>
        </div>

        <footer className="flex gap-2 border-t border-border p-4">
          <Button fullWidth onClick={() => { onApply(d); onClose(); }}>Apply filters</Button>
          <Button variant="ghost" onClick={() => setD(DEFAULT_SCOPE)}>Reset</Button>
        </footer>
      </aside>
    </div>
  );
}

/* --------------------------------- attention -------------------------------- */

export type AttentionItem = { count: number | string; title: string; detail: string; tone: 'error' | 'warning' | 'info'; onClick?: () => void };
const toneText = { error: 'text-error', warning: 'text-warning', info: 'text-info' } as const;

/** The seller Overview's Attention card: the few numbers someone should act on, each a drill. */
export function AttentionCard({ items, className }: { items: AttentionItem[]; className?: string }) {
  const shown = items.filter((a) => a.count !== 0);
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="type-label">Attention</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {shown.length === 0 && <p className="type-caption text-foreground-secondary">Nothing needs attention in this scope.</p>}
        {shown.map((a) => (
          <Card key={a.title} variant={a.onClick ? 'interactive' : 'default'} onClick={a.onClick} className="grid grid-cols-[44px_1fr] gap-2.5 p-2.5">
            <span className={cn('type-h1 text-right tabular-nums', toneText[a.tone])}>{a.count}</span>
            <span>
              <b className="type-label block leading-snug">{a.title}</b>
              <span className="type-caption block text-foreground-secondary">{a.detail}</span>
            </span>
          </Card>
        ))}
      </CardContent>
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

/* --------------------------------- controls -------------------------------- */

/** Compact labelled select — used by the Buyer app analytics boards. */
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

/* ---------------------------------- drawer --------------------------------- */

export function Drawer({ title, sub, onClose, onBack, width = 'w-[560px]', children, footer }: {
  title: React.ReactNode; sub?: React.ReactNode; onClose: () => void; onBack?: () => void; width?: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className={cn('animate-slide-in-right fixed right-0 top-0 flex h-dvh flex-col border-l border-border bg-card shadow-xl', width)}
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true"
      >
        <header className="flex items-start gap-3 border-b border-border px-5 py-4">
          {onBack && (
            <button type="button" onClick={onBack} aria-label="Back" className="-ml-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
              <ChevronLeft size={18} />
            </button>
          )}
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
      <div className="mb-2 flex items-baseline justify-between gap-3">
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
        className={cn('flex h-9 w-full items-center gap-2 rounded-md border bg-card px-2.5 hover:bg-muted', open ? 'border-ring ring-2 ring-ring/30' : 'border-border')}
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
