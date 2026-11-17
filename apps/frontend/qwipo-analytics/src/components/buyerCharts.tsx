// Chart pieces for the DigiDukaan · Buyer pages, kept to what a sales team
// reads without thinking: a target bar, plain bar charts, ranked bars and
// pies. Token classes only; inline styles carry data geometry and nothing
// else. Every mark is a drill target.
import { useState } from 'react';
import { cn } from '@mockups/ui';

const toneBg = { brand: 'bg-chart-blue', success: 'bg-success', warning: 'bg-warning', error: 'bg-error', muted: 'bg-border-strong' } as const;
export type Tone = keyof typeof toneBg;

/** Big progress bar towards a target, with a marker where the team should be by today. */
export function TargetBar({ achieved, target, expected, achievedText, targetText, expectedText }: {
  achieved: number; target: number; expected?: number;
  achievedText: string; targetText: string; expectedText?: string;
}) {
  const pct = target ? (achieved / target) * 100 : 0;
  const pace = expected ? achieved / expected : pct / 100;
  const tone: Tone = pace >= 1 ? 'success' : pace >= 0.85 ? 'warning' : 'error';
  const at = (v: number) => `${Math.min(100, target ? (v / target) * 100 : 0)}%`;
  return (
    <div>
      <div className="relative h-5 rounded-full bg-background-sunken">
        <i className={cn('absolute inset-y-0 left-0 block rounded-full', toneBg[tone])} style={{ width: at(achieved) }} />
        {expected != null && <i className="absolute -inset-y-1 border-l-2 border-dashed border-foreground" style={{ left: at(expected) }} />}
      </div>
      <div className="type-caption relative mt-1.5 flex justify-between text-foreground-secondary">
        <span><b className="font-semibold text-foreground">{achievedText}</b> achieved · {pct.toFixed(0)}%</span>
        <span>Target <b className="font-semibold text-foreground">{targetText}</b></span>
      </div>
      {expected != null && expectedText && (
        <div className="type-caption mt-0.5 text-foreground-tertiary">Dashed line = where you should be today ({expectedText})</div>
      )}
    </div>
  );
}

/** Plain vertical bars with a hover tooltip; values on top when there are few bars; optional dashed target line. */
export function Bars({ items, height = 170, target, onBar, tone = 'brand' }: {
  items: { key: string; label: string; title?: string; value: number; display: string; note?: string }[];
  height?: number;
  /** a per-bar goal, drawn as one dashed line */
  target?: { value: number; label: string };
  onBar?: (key: string) => void;
  tone?: Tone;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, target?.value ?? 0, ...items.map((i) => i.value)) * 1.1;
  const few = items.length <= 12;
  const every = Math.ceil(items.length / 10);
  const h = hover === null ? null : items[hover];
  return (
    <div className="relative">
      {h && !few && (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 shadow-md"
          style={{ left: `${Math.min(Math.max(((hover! + 0.5) / items.length) * 100, 12), 88)}%` }}
        >
          <div className="type-label whitespace-nowrap">{h.title ?? h.label}</div>
          <div className="type-caption whitespace-nowrap text-foreground-secondary"><b className="text-foreground">{h.display}</b>{h.note && ` · ${h.note}`}</div>
        </div>
      )}
      <div className="relative" style={{ height }}>
        {target && (
          <div className="absolute inset-x-0 z-[1] border-t-2 border-dashed border-foreground/70" style={{ bottom: `${(target.value / max) * 100}%` }}>
            <span className="type-micro absolute -top-4 right-0 bg-card px-1 normal-case tracking-normal text-foreground">{target.label}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end gap-1">
          {items.map((b, i) => (
            <div
              key={b.key}
              className={cn('flex h-full flex-1 flex-col items-center justify-end gap-1 rounded-t-sm', onBar && 'cursor-pointer', hover === i && 'bg-muted')}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={onBar ? (e) => { e.stopPropagation(); onBar(b.key); } : undefined}
              title={few ? `${b.title ?? b.label} · ${b.display}${b.note ? ` · ${b.note}` : ''}` : undefined}
            >
              {few && <b className="type-caption whitespace-nowrap font-semibold tabular-nums">{b.display}</b>}
              <i className={cn('block w-full rounded-t-sm', toneBg[tone])} style={{ height: `${(b.value / max) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 flex gap-1 border-t border-border pt-1">
        {items.map((b, i) => (
          <span key={b.key} className="type-caption flex-1 whitespace-nowrap text-center text-foreground-secondary">
            {few || i % every === 0 ? b.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/** League table as bars: rank · name · bar · value. A row's `target` draws a tick on its bar. */
export function RankBars({ rows, onRow, ranked = true }: {
  rows: { key: string; label: string; sub?: string; value: number; display: string; target?: number; tone?: Tone; badge?: React.ReactNode }[];
  onRow?: (key: string) => void;
  ranked?: boolean;
}) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.value, r.target ?? 0)));
  return (
    <div className="flex flex-col gap-1">
      {rows.map((r, i) => (
        <div
          key={r.key}
          className={cn('type-caption grid items-center gap-2.5 rounded-md py-1', ranked ? 'grid-cols-[16px_180px_1fr_128px]' : 'grid-cols-[180px_1fr_128px]', onRow && '-mx-1 cursor-pointer px-1 hover:bg-muted')}
          onClick={onRow && ((e) => { e.stopPropagation(); onRow(r.key); })}
        >
          {ranked && <span className="text-right tabular-nums text-foreground-tertiary">{i + 1}</span>}
          <span className="min-w-0 leading-tight">
            <span className="flex items-center gap-1.5"><span className="truncate text-foreground">{r.label}</span>{r.badge}</span>
            {r.sub && <span className="block truncate text-foreground-tertiary">{r.sub}</span>}
          </span>
          <span className="relative h-3.5 rounded-sm bg-background-sunken">
            <i className={cn('absolute inset-y-0 left-0 block rounded-sm', toneBg[r.tone ?? 'brand'])} style={{ width: `${(r.value / max) * 100}%` }} />
            {r.target != null && <i className="absolute -inset-y-1 border-l-2 border-foreground/70" style={{ left: `${(r.target / max) * 100}%` }} />}
          </span>
          <span className="text-right font-semibold tabular-nums">{r.display}</span>
        </div>
      ))}
    </div>
  );
}

const strokeOf = {
  'bg-chart-blue': 'stroke-chart-blue', 'bg-chart-teal': 'stroke-chart-teal', 'bg-chart-violet': 'stroke-chart-violet',
  'bg-chart-sky': 'stroke-chart-sky', 'bg-chart-indigo': 'stroke-chart-indigo', 'bg-chart-cyan': 'stroke-chart-cyan',
  'bg-success': 'stroke-success', 'bg-warning': 'stroke-warning', 'bg-error': 'stroke-error', 'bg-info': 'stroke-info',
  'bg-border-strong': 'stroke-border-strong',
} as const;
export type PieColour = keyof typeof strokeOf;

/** Pie (donut) with the total in the middle and a legend that doubles as the click target. */
export function Donut({ parts, center, centerLabel, onPart }: {
  parts: { key: string; label: string; value: number; display: string; colour: PieColour }[];
  center: string; centerLabel: string;
  onPart?: (key: string) => void;
}) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const R = 42, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-32 w-32 shrink-0 -rotate-90" role="img" aria-label={centerLabel}>
        <circle cx={50} cy={50} r={R} className="fill-none stroke-background-sunken" strokeWidth={14} />
        {total > 0 && parts.filter((p) => p.value > 0).map((p) => {
          const len = (p.value / total) * C;
          const el = (
            <circle
              key={p.key} cx={50} cy={50} r={R}
              className={cn('fill-none', strokeOf[p.colour], onPart && 'cursor-pointer hover:opacity-80')}
              strokeWidth={14} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
              onClick={onPart && ((e) => { e.stopPropagation(); onPart(p.key); })}
            />
          );
          offset += len;
          return el;
        })}
        <text x={50} y={48} textAnchor="middle" transform="rotate(90 50 50)" className="fill-foreground text-[15px] font-bold">{center}</text>
        <text x={50} y={62} textAnchor="middle" transform="rotate(90 50 50)" className="fill-foreground-secondary text-[8px]">{centerLabel}</text>
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {parts.map((p) => (
          <button
            key={p.key} type="button" disabled={!onPart}
            onClick={onPart && ((e) => { e.stopPropagation(); onPart(p.key); })}
            className="type-caption -mx-1 grid grid-cols-[10px_1fr_auto] items-center gap-2 rounded-md px-1 py-0.5 text-left enabled:hover:bg-muted"
          >
            <i className={cn('h-2.5 w-2.5 rounded-sm', p.colour)} />
            <span className="truncate text-foreground">{p.label}</span>
            <span className="tabular-nums"><b className="font-semibold">{p.display}</b> <span className="text-foreground-tertiary">{total ? `${Math.round((p.value / total) * 100)}%` : '—'}</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** "Top 3" card: the leaders on one number, for a sales-team podium. */
export function TopThree({ title, accent, rows, onRow }: {
  title: string; accent: string;
  rows: { key: string; name: string; sub: string; value: string }[];
  onRow?: (key: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className={cn('type-micro mb-1.5', accent)}>{title}</div>
      {rows.length === 0 && <p className="type-caption text-foreground-secondary">No one yet in this scope.</p>}
      {rows.map((r, i) => (
        <div
          key={r.key}
          className={cn('flex items-baseline gap-2 rounded-md py-1', onRow && '-mx-1.5 cursor-pointer px-1.5 hover:bg-muted')}
          onClick={onRow && (() => onRow(r.key))}
        >
          <i className={cn('type-caption grid h-5 w-5 shrink-0 place-items-center rounded-full not-italic font-semibold', i === 0 ? 'bg-warning-subtle text-warning-foreground' : 'bg-background-sunken text-foreground-secondary')}>{i + 1}</i>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="type-body block truncate">{r.name}</span>
            <span className="type-caption block truncate text-foreground-tertiary">{r.sub}</span>
          </span>
          <b className="type-price-sm">{r.value}</b>
        </div>
      ))}
    </div>
  );
}
