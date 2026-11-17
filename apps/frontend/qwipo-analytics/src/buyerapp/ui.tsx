// Building blocks for the Buyer app analytics boards, on the mobile kit:
// hover tips, filter bar (with the state → city picker), KPI cards, event and
// funnel tables, and the "what changed" rail.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, MapPin, RotateCcw, Sparkles, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { Button, Card, SegmentedControl, cn } from '@mockups/ui';
import { FilterSelect } from '../components/buyerKit';
import { Sparkline } from './charts';
import type { Explain } from './explain';
import {
  ALL_CITIES, PLATFORMS, RANGES, STATES, VERSIONS, changeWords, int, pct, trendLabels,
  type Change, type EventValue, type FunnelStep, type KpiValue, type Range,
} from './engine';
import { useBoard, useFilters } from './filters';

/* ── hover tip ──────────────────────────────────────────────────────── */

export type TipRow = [label: ReactNode, value: ReactNode];

const SIDE = {
  top: 'bottom-full mb-1.5',
  bottom: 'top-full mt-1.5',
  left: 'right-full mr-1.5 top-1/2 -translate-y-1/2',
  right: 'left-full ml-1.5 top-1/2 -translate-y-1/2',
};
const ALIGN = { start: 'left-0', center: 'left-1/2 -translate-x-1/2', end: 'right-0' };

/** Hover card (white): a title, label/value rows, then — when given — What it is / Why it's used / How to check it. Wraps its children. */
export function Tip({
  children, title, rows = [], note, what, why, side = 'top', align = 'center', block = false,
}: {
  children: ReactNode; title?: ReactNode; rows?: TipRow[]; note?: ReactNode;
} & Partial<Explain> & {
  side?: keyof typeof SIDE; align?: keyof typeof ALIGN; block?: boolean;
}) {
  const explained = !!(what || why);
  const part = (label: string, text?: string) =>
    text ? (
      <span className="mt-2 block first:mt-0">
        <span className="type-micro block text-foreground-tertiary">{label}</span>
        <span className="type-caption block leading-snug">{text}</span>
      </span>
    ) : null;
  return (
    <span className={cn('group/tip relative', block ? 'block' : 'inline-block')}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-40 hidden w-max max-w-72 rounded-md border border-border bg-card px-3 py-2.5 text-left font-normal normal-case tracking-normal text-foreground shadow-lg group-hover/tip:block',
          SIDE[side],
          (side === 'top' || side === 'bottom') && ALIGN[align],
        )}
      >
        {title && <span className={cn('type-label block', (rows.length > 0 || note || explained) && 'mb-1.5')}>{title}</span>}
        {rows.length > 0 && (
          <span className="type-caption grid grid-cols-[auto_auto] gap-x-6 gap-y-1">
            {rows.map(([label, value], i) => (
              <span key={i} className="contents">
                <span className="text-foreground-secondary">{label}</span>
                <span className="text-right font-medium tabular-nums">{value}</span>
              </span>
            ))}
          </span>
        )}
        {!explained && note && (
          <span className={cn('type-caption block leading-snug text-foreground-secondary', rows.length > 0 && 'mt-1.5')}>{note}</span>
        )}
        {explained && (
          <span className={cn('block', (rows.length > 0 || title) && 'mt-2 border-t border-border-subtle pt-2')}>
            {part('What it is', what)}
            {part('Why it’s used', why)}
          </span>
        )}
      </span>
    </span>
  );
}

/* ── location: state → city ─────────────────────────────────────────── */

function locationLabel(cities: string[]) {
  if (cities.length === ALL_CITIES.length) return 'All locations';
  if (cities.length === 0) return 'No location';
  if (cities.length === 1) return cities[0];
  const whole = STATES.find((s) => s.cities.length === cities.length && s.cities.every((c) => cities.includes(c)));
  return whole ? whole.name : `${cities.length} cities`;
}

function Check({ state, onChange }: { state: boolean | 'indeterminate'; onChange: () => void }) {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 cursor-pointer accent-primary"
      checked={state === true}
      ref={(el) => { if (el) el.indeterminate = state === 'indeterminate'; }}
      onChange={onChange}
    />
  );
}

function OnlyButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      aria-label={`Only ${label}`}
      className="type-caption ml-auto rounded px-1.5 font-medium text-link opacity-0 hover:underline focus-visible:opacity-100 group-hover:opacity-100"
    >
      only
    </button>
  );
}

function LocationPicker() {
  const { filters, set } = useFilters();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const sel = filters.cities;
  const has = (c: string) => sel.includes(c);
  const allOn = sel.length === ALL_CITIES.length;
  const setCities = (cities: string[]) => set({ cities: ALL_CITIES.filter((c) => cities.includes(c)) });
  const toggle = (cities: string[], on: boolean) =>
    setCities(on ? [...new Set([...sel, ...cities])] : sel.filter((c) => !cities.includes(c)));
  const state = (cities: string[]) => (cities.every(has) ? true : cities.some(has) ? ('indeterminate' as const) : false);
  const row = 'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted';

  return (
    <div ref={box} className="relative">
      <Tip
        side="bottom"
        title="Location"
        rows={STATES.map((s) => [s.name, s.cities.filter(has).join(', ') || 'none'])}
        note="Pick states or cities. Use “only” to see just one."
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'type-caption flex h-9 items-center gap-2 rounded-md border bg-card pl-2.5 pr-2 font-medium',
            allOn ? 'border-border text-foreground-secondary' : 'border-primary bg-primary-soft text-primary-soft-foreground',
          )}
        >
          <MapPin size={14} /> {locationLabel(sel)} <ChevronDown size={13} />
        </button>
      </Tip>
      {open && (
        <div className="absolute left-0 top-11 z-50 w-64 rounded-xl border border-border bg-card p-2 shadow-xl">
          <label className={cn(row, 'type-label')}>
            <Check state={allOn ? true : sel.length ? 'indeterminate' : false} onChange={() => setCities(allOn ? [] : ALL_CITIES)} />
            Select all
          </label>
          <div className="my-1 border-t border-border-subtle" />
          {STATES.map((s) => (
            <div key={s.name}>
              <label className={cn(row, 'type-label')}>
                <Check state={state(s.cities)} onChange={() => toggle(s.cities, state(s.cities) !== true)} />
                {s.name}
                <OnlyButton label={s.name} onClick={() => setCities(s.cities)} />
              </label>
              {s.cities.map((c) => (
                <label key={c} className={cn(row, 'type-caption pl-8')}>
                  <Check state={has(c)} onChange={() => toggle([c], !has(c))} />
                  {c}
                  <OnlyButton label={c} onClick={() => setCities([c])} />
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── filter bar ─────────────────────────────────────────────────────── */

const RANGE_SPAN: Record<Range, string> = {
  '7d': '16 Aug – 22 Aug 2026',
  '30d': '24 Jul – 22 Aug 2026',
  '90d': '24 May – 22 Aug 2026',
};

export function FilterBar() {
  const { filters, set, reset } = useFilters();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl
        className="w-auto"
        options={RANGES.map((r) => ({
          value: r.id,
          label: (
            <Tip side="bottom" title={r.label} note={`${RANGE_SPAN[r.id]}, compared with the ${r.label.toLowerCase().replace('last', 'previous')}`}>
              <span className="whitespace-nowrap">{r.label}</span>
            </Tip>
          ),
        }))}
        value={filters.range}
        onChange={(v) => set({ range: v })}
      />
      <LocationPicker />
      <FilterSelect label="Platform" value={filters.platform} options={PLATFORMS} onChange={(v) => set({ platform: v })} />
      <FilterSelect label="Buyers" value={filters.buyer} options={['New', 'Returning']} onChange={(v) => set({ buyer: v })} />
      <FilterSelect label="Version" value={filters.version} options={VERSIONS} onChange={(v) => set({ version: v })} />
      <Tip side="bottom" title="Reset filters" note="Back to last 7 days, all locations, all platforms, all buyers and versions.">
        <Button variant="ghost" size="sm" className="text-foreground-secondary" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </Button>
      </Tip>
    </div>
  );
}

/* ── sections ───────────────────────────────────────────────────────── */

export function Section({ title, sub, action, info, children }: { title: string; sub?: string; action?: ReactNode; info?: Explain; children: ReactNode }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
        <div className="min-w-0">
          <div className="type-h3">{info ? <Tip side="bottom" align="start" {...info}><span className="cursor-help">{title}</span></Tip> : title}</div>
          {sub && <div className="type-caption truncate text-foreground-secondary">{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

/* ── numbers ────────────────────────────────────────────────────────── */

export function ChangePill({ c }: { c: Change }) {
  return (
    <span
      className={cn(
        'type-caption inline-flex cursor-default items-center whitespace-nowrap rounded-md px-1.5 py-0.5 font-medium tabular-nums',
        c.good ? 'bg-success-subtle text-success-foreground' : 'bg-error-subtle text-error-foreground',
      )}
    >
      {c.text}
    </span>
  );
}

const verdict = (c: Change) => (c.good ? 'Better' : 'Worse');

export function KpiCard({ k, prev, big = false }: { k: KpiValue & Partial<Explain>; prev: string; big?: boolean }) {
  const { m } = useBoard();
  return (
    <Tip
      block
      side="bottom"
      align="start"
      title={k.label}
      rows={[
        ['Now', k.value],
        [`Before (${prev})`, k.before],
        ['Change', `${k.change.text} · ${verdict(k.change)}`],
      ]}
      note={`${k.hint}.${k.lowerIsBetter ? ' Lower is better.' : ''} Hover the line for each ${m.daily ? 'day' : 'week'}.`}
      what={k.what}
      why={k.why}
      check={k.check}
    >
      <Card className="flex cursor-default flex-col gap-2 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="type-label text-foreground-secondary">{k.label}</span>
          <ChangePill c={k.change} />
        </div>
        <div className="flex items-end justify-between gap-3">
          <span className={cn('font-semibold tabular-nums tracking-tight', big ? 'text-4xl' : 'text-2xl')}>{k.value}</span>
          <Sparkline points={k.points} good={k.change.good} width={big ? 220 : 88} height={big ? 52 : 28} labels={trendLabels(m)} fmt={k.fmt} />
        </div>
        <div className="type-caption text-foreground-secondary">{k.hint} · vs {prev}</div>
      </Card>
    </Tip>
  );
}

export function KpiStrip({ kpis, prev }: { kpis: (KpiValue & Partial<Explain>)[]; prev: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 2xl:grid-cols-4">
      {kpis.map((k) => <KpiCard key={k.label} k={k} prev={prev} />)}
    </div>
  );
}

/* ── tables ─────────────────────────────────────────────────────────── */

const TH = 'type-micro py-2.5 font-semibold text-foreground-tertiary';

function HeadTip({ children, note, className }: { children: ReactNode; note: string; className?: string }) {
  return (
    <th className={cn(TH, className)}>
      <Tip side="top" note={note}>
        <span className="cursor-help border-b border-dotted border-foreground-tertiary">{children}</span>
      </Tip>
    </th>
  );
}

/** Every tracked action in a group, as a plain sentence: how many buyers did it, what they did next, how many didn't. */
export function EventTable({ rows }: { rows: (EventValue & Partial<Explain>)[] }) {
  const { m } = useBoard();
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr>
          <th className={cn(TH, 'pl-5')}>What the buyer did</th>
          <HeadTip className="w-24 text-right" note="Different buyers who did this at least once. Each buyer is counted once.">Buyers</HeadTip>
          <HeadTip className="pl-6" note="How many of those buyers took the next step straight after, and what that step was.">Then</HeadTip>
          <HeadTip className="" note="Everyone else: they left, closed it, or gave up instead of taking the next step.">Didn’t carry on</HeadTip>
          <HeadTip className="pr-5 text-right" note={`Buyers now compared with the ${m.R.prev}. Green is good, red needs a look.`}>
            Change
          </HeadTip>
        </tr>
      </thead>
      <tbody className="type-caption">
        {rows.map((r) => {
          const w = changeWords(r.change);
          return (
            <tr key={r.name} className="border-t border-border-subtle align-top">
              <td className="py-2.5 pl-5">
                <Tip
                  side="right"
                  title={r.say}
                  rows={[
                    ['Buyers', int(r.users)],
                    ['Times it happened', int(r.times)],
                    ['Times per buyer', (r.times / (r.users || 1)).toFixed(1)],
                    ['Buyers before', int(r.before)],
                  ]}
                  what={r.what}
                  why={r.why}
                >
                  <span className="flex cursor-default items-start gap-2">
                    {r.good === 'down' && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-error" aria-label="Problem" />}
                    {r.say}
                  </span>
                </Tip>
              </td>
              <td className="py-2.5 text-right font-semibold tabular-nums">{int(r.users)}</td>
              <td className="py-2.5 pl-6">
                {r.next ? (
                  <span>
                    <b className="font-semibold tabular-nums">{int(r.went)}</b>{' '}
                    <span className="text-foreground-secondary">{r.next}</span>
                  </span>
                ) : (
                  <span className="text-foreground-tertiary">—</span>
                )}
              </td>
              <td className="py-2.5 pr-3">
                {r.next ? (
                  <span>
                    <b className="font-semibold tabular-nums">{int(r.left)}</b>{' '}
                    <span className="text-foreground-secondary">{r.rest}</span>
                  </span>
                ) : (
                  <span className="text-foreground-tertiary">—</span>
                )}
              </td>
              <td
                className={cn(
                  'whitespace-nowrap py-2.5 pr-5 text-right font-medium',
                  w.flat ? 'text-foreground-secondary' : w.good ? 'text-success' : 'text-error',
                )}
              >
                {w.text}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** "8,960 buyers came to the Search page → 7,240 did something → 1,720 left without doing anything". */
export function EntryLine({ place, came, acted, left }: { place: string; came: number; acted: number; left: number }) {
  return (
    <Card className="type-body flex flex-wrap items-center gap-x-2 gap-y-1 px-5 py-3.5">
      <span><b className="font-semibold tabular-nums">{int(came)}</b> buyers came to {place}</span>
      <span className="text-foreground-tertiary">→</span>
      <span><b className="font-semibold tabular-nums">{int(acted)}</b> did something</span>
      <span className="text-foreground-tertiary">→</span>
      <span className="text-error"><b className="font-semibold tabular-nums">{int(left)}</b> left without doing anything</span>
    </Card>
  );
}

/** A funnel as a table: buyers, events, conversion, drop-off and time between steps. */
export function FunnelTable({ steps, explain }: { steps: FunnelStep[]; explain?: (s: FunnelStep, i: number) => Explain }) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr>
          <th className={cn(TH, 'pl-5')}>Step</th>
          <HeadTip className="text-right" note="Unique buyers who reached this step.">Buyers</HeadTip>
          <HeadTip className="text-right" note="Times the step’s event fired, counting repeats.">Events</HeadTip>
          <HeadTip className="w-52 pl-6" note="Share of buyers from the first step who got this far.">Conversion</HeadTip>
          <HeadTip className="text-right" note="Share of buyers lost since the step before.">Drop-off</HeadTip>
          <HeadTip className="pr-5 text-right" note="Typical (median) time buyers took from the step before.">Time from last step</HeadTip>
        </tr>
      </thead>
      <tbody className="type-caption">
        {steps.map((s, i) => {
          const prev = steps[i - 1];
          const lost = prev ? prev.users - s.users : 0;
          return (
            <tr key={s.label} className="border-t border-border-subtle">
              <td className="py-2.5 pl-5">
                <Tip
                  side="right"
                  title={`Step ${i + 1}: ${s.label}`}
                  rows={[
                    ['Buyers', int(s.users)],
                    ['Events', int(s.events)],
                    ['From the start', pct(s.ofStart)],
                    ...(prev ? ([['Lost since last step', `${int(lost)} (${pct(s.drop)})`], ['Typical time', s.time]] as [string, string][]) : []),
                  ]}
                  note={s.worst ? 'Most buyers are lost here.' : undefined}
                  {...explain?.(s, i)}
                >
                  <span className="flex cursor-default items-center">
                    <span className="mr-2.5 grid h-5 w-5 place-items-center rounded-full bg-muted font-medium tabular-nums text-foreground-secondary">{i + 1}</span>
                    {s.label}
                  </span>
                </Tip>
              </td>
              <td className="py-2.5 text-right font-medium tabular-nums">{int(s.users)}</td>
              <td className="py-2.5 text-right tabular-nums text-foreground-secondary">{int(s.events)}</td>
              <td className="py-2.5 pl-6">
                <Tip block side="top" note={`${int(s.users)} of ${int(steps[0].users)} buyers who started got this far.`}>
                  <span className="flex cursor-default items-center gap-2">
                    <span className="h-1.5 flex-1 rounded-full bg-muted">
                      <span className={cn('block h-full rounded-full', s.worst ? 'bg-error' : 'bg-primary')} style={{ width: `${s.ofStart}%` }} />
                    </span>
                    <span className="w-12 text-right tabular-nums">{pct(s.ofStart)}</span>
                  </span>
                </Tip>
              </td>
              <td className="py-2.5 text-right">
                {!prev ? (
                  <span className="text-foreground-tertiary">—</span>
                ) : (
                  <Tip side="top" note={`${int(lost)} buyers stopped between “${prev.label}” and “${s.label}”.`}>
                    {s.worst ? (
                      <span className="cursor-default rounded-md bg-error-subtle px-1.5 py-0.5 font-semibold tabular-nums text-error-foreground">−{pct(s.drop)} · biggest</span>
                    ) : (
                      <span className="cursor-default tabular-nums text-foreground-secondary">−{pct(s.drop)}</span>
                    )}
                  </Tip>
                )}
              </td>
              <td className="py-2.5 pr-5 text-right tabular-nums text-foreground-secondary">
                {prev ? (
                  <Tip side="left" note={`Typical time from “${prev.label}” to “${s.label}”.`}>
                    <span className="cursor-default">{s.time}</span>
                  </Tip>
                ) : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── insights rail ──────────────────────────────────────────────────── */

function MoverList({ items, label, icon: Icon, tone }: { items: (EventValue & Partial<Explain>)[]; label: string; icon: LucideIcon; tone: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn('type-micro flex items-center gap-1.5 font-semibold', tone)}>
        <Icon size={14} /> {label}
      </div>
      {items.length === 0 ? (
        <p className="type-caption text-foreground-secondary">Nothing notable.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((r) => (
            <li key={r.name} className="type-caption -mx-2 flex items-start justify-between gap-3 rounded-md px-2 py-1 hover:bg-muted">
              <Tip
                side="left"
                title={r.say}
                rows={[
                  ['Buyers before', int(r.before)],
                  ['Buyers now', int(r.users)],
                  ['Times', int(r.times)],
                ]}
                note={r.good === 'down' ? 'Fewer is better for this one.' : undefined}
                what={r.what}
                why={r.why}
                check={r.check}
              >
                <span className="min-w-0 cursor-default leading-snug">{r.say}</span>
              </Tip>
              <ChangePill c={r.change} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "What changed": the biggest moves up and down, surfaced like an anomaly feed. */
export function Movers({ rows, title = 'What changed' }: { rows: (EventValue & Partial<Explain>)[]; title?: string }) {
  const sorted = rows
    .filter((r) => r.name !== 'Other')
    .sort((a, b) => Math.abs(b.change.value) - Math.abs(a.change.value));
  return (
    <Card className="flex flex-col gap-4 px-5 py-4">
      <Tip side="bottom" align="start" note="The tracked actions that moved the most vs the previous period, good and bad.">
        <span className="flex cursor-default items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="type-h3">{title}</span>
        </span>
      </Tip>
      <MoverList items={sorted.filter((r) => !r.change.good).slice(0, 3)} label="Needs a look" icon={TrendingDown} tone="text-error" />
      <div className="border-t border-border-subtle" />
      <MoverList items={sorted.filter((r) => r.change.good).slice(0, 3)} label="Going well" icon={TrendingUp} tone="text-success" />
    </Card>
  );
}
