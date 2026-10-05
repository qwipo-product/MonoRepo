// Chart pieces for the DigiDukaan · Buyer dashboards. Token classes only —
// beat business is chart-blue, non-beat chart-sky everywhere — and every mark
// is a drill target. Inline styles carry data geometry and nothing else.
import { useState } from 'react';
import { Card, cn } from '@mockups/ui';
import { lakh, num } from './buyerFormat';
import type { Bucket } from '../data/buyerMetrics';

export const BEAT_BG = 'bg-chart-blue';
export const NONBEAT_BG = 'bg-chart-sky';

export function BeatLegend({ beat, nonBeat }: { beat: string; nonBeat: string }) {
  return (
    <div className="type-caption mt-2 flex gap-4 text-foreground-secondary">
      <span className="flex items-center gap-1.5"><i className={cn('h-2.5 w-2.5 rounded-sm', BEAT_BG)} />Beat · {beat}</span>
      <span className="flex items-center gap-1.5"><i className={cn('h-2.5 w-2.5 rounded-sm', NONBEAT_BG)} />Non-beat · {nonBeat}</span>
    </div>
  );
}

/** Stacked value per bucket (beat under non-beat), hover tooltip, click = that bucket's orders. */
export function ValueBars({ data, onBar, height = 190 }: { data: Bucket[]; onBar?: (b: Bucket) => void; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((b) => b.beat + b.nonBeat));
  const every = Math.ceil(data.length / 8);
  const h = hover === null ? null : data[hover];
  return (
    <div className="relative">
      {h && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 shadow-md"
          style={{ left: `${Math.min(Math.max(((hover! + 0.5) / data.length) * 100, 14), 86)}%` }}
        >
          <div className="type-label whitespace-nowrap">{h.title}</div>
          <div className="type-caption mt-0.5 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0.5 whitespace-nowrap text-foreground-secondary">
            <i className={cn('h-2 w-2 rounded-full', BEAT_BG)} /><span>Beat <b className="ml-1 tabular-nums text-foreground">{lakh(h.beat)}</b></span>
            <i className={cn('h-2 w-2 rounded-full', NONBEAT_BG)} /><span>Non-beat <b className="ml-1 tabular-nums text-foreground">{lakh(h.nonBeat)}</b></span>
            <span /><span>{num(h.orders)} orders</span>
          </div>
        </div>
      )}
      <div className="relative" style={{ height }}>
        {[0.5, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-border-subtle" style={{ bottom: `${f * 100}%` }}>
            <span className="type-micro absolute -top-2 left-0 bg-card pr-1 normal-case tracking-normal text-foreground-tertiary">{lakh(max * f)}</span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end gap-[3px] pl-12">
          {data.map((b, i) => (
            <div
              key={b.title}
              className={cn('flex h-full flex-1 flex-col justify-end rounded-sm', onBar && b.orders > 0 && 'cursor-pointer', hover === i && 'bg-muted')}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={onBar && b.orders > 0 ? (e) => { e.stopPropagation(); onBar(b); } : undefined}
            >
              <i className={cn('block w-full rounded-t-sm', NONBEAT_BG)} style={{ height: `${(b.nonBeat / max) * 100}%` }} />
              <i className={cn('block w-full', BEAT_BG)} style={{ height: `${(b.beat / max) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 flex gap-[3px] pl-12">
        {data.map((b, i) => (
          <span key={b.title} className="type-micro flex-1 overflow-visible whitespace-nowrap text-center normal-case tracking-normal text-foreground-tertiary">
            {i % every === 0 ? b.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Beat vs non-beat share per row as a 100% bar, with the overall share as a dashed marker. */
export function SplitBars({ rows, avg, onRow }: {
  rows: { key: string; label: string; sub?: string; a: number; b: number }[];
  /** overall beat share, % */
  avg: number;
  onRow?: (key: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="type-micro grid grid-cols-[190px_1fr_92px] gap-2.5 pb-1 text-foreground-tertiary">
        <span>Distributor</span><span>Beat ← → Non-beat</span><span className="text-right">Orders</span>
      </div>
      {rows.map((r) => {
        const total = r.a + r.b;
        const pct = total ? (r.a / total) * 100 : 0;
        return (
          <div
            key={r.key}
            className={cn('type-caption grid grid-cols-[190px_1fr_92px] items-center gap-2.5 rounded-md py-1', onRow && '-mx-1 cursor-pointer px-1 hover:bg-muted')}
            onClick={onRow && ((e) => { e.stopPropagation(); onRow(r.key); })}
          >
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-foreground">{r.label}</span>
              {r.sub && <span className="block truncate text-foreground-tertiary">{r.sub}</span>}
            </span>
            <span className="relative flex h-3.5 overflow-hidden rounded-sm bg-background-sunken">
              {total > 0 && <>
                <i className={cn('block h-full', BEAT_BG)} style={{ width: `${pct}%` }} />
                <i className={cn('block h-full flex-1', NONBEAT_BG)} />
              </>}
              <i className="absolute inset-y-[-2px] border-l-2 border-dashed border-foreground/60" style={{ left: `${avg}%` }} />
            </span>
            <span className="text-right tabular-nums">
              <b className={cn('font-semibold', pct >= avg ? 'text-chart-blue' : 'text-foreground-secondary')}>{total ? `${pct.toFixed(0)}%` : '—'}</b>
              <span className="ml-1.5 text-foreground-tertiary">{num(total)}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Achievement meters on a 0–150% track with the target at 100%. */
export function TargetMeters({ rows, onRow, ok = 90, low = 70, head = true }: {
  rows: { key: string; label: string; sub?: string; pct: number; value: string }[];
  onRow?: (key: string) => void; ok?: number; low?: number;
  /** column captions — off for a single meter */
  head?: boolean;
}) {
  const at = (p: number) => `${(Math.min(p, 150) / 150) * 100}%`;
  return (
    <div className="flex flex-col gap-1">
      {head && (
        <div className="type-micro grid grid-cols-[170px_1fr_116px] gap-2.5 pb-1 text-foreground-tertiary">
          <span>Salesperson</span>
          <span className="relative">0%<span className="absolute -translate-x-1/2" style={{ left: at(100) }}>Target</span><span className="absolute right-0">150%</span></span>
          <span className="text-right">Achieved · value</span>
        </div>
      )}
      {rows.map((r) => (
        <div
          key={r.key}
          className={cn('type-caption grid grid-cols-[170px_1fr_116px] items-center gap-2.5 rounded-md py-1', onRow && '-mx-1 cursor-pointer px-1 hover:bg-muted')}
          onClick={onRow && ((e) => { e.stopPropagation(); onRow(r.key); })}
        >
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-foreground">{r.label}</span>
            {r.sub && <span className="block truncate text-foreground-tertiary">{r.sub}</span>}
          </span>
          <span className="relative h-3 rounded-sm bg-background-sunken">
            <i className={cn('absolute inset-y-0 left-0 block rounded-sm', r.pct >= ok ? 'bg-success' : r.pct >= low ? 'bg-warning' : 'bg-error')} style={{ width: at(r.pct) }} />
            <i className="absolute inset-y-[-3px] border-l-2 border-foreground/70" style={{ left: at(100) }} />
          </span>
          <span className="text-right tabular-nums">
            <b className="font-semibold">{r.pct.toFixed(0)}%</b>
            <span className="ml-1.5 text-foreground-tertiary">{r.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Dot label: the first word, or the first two when the first is an initial ("S R Enterprises"). */
const shortName = (l: string) => { const w = l.split(' '); return w[0].length <= 2 ? w.slice(0, 2).join(' ') : w[0]; };

/** Two-measure scatter with threshold lines and a caption in each quadrant. */
export function Quadrant({ points, xLabel, yLabel, xMid, yMid, xMax, yMax, yMin = 0, xMidLabel, yMidLabel, captions, onPick }: {
  points: { key: string; label: string; x: number; y: number; r: number; tone: 'success' | 'warning' | 'error' | 'info'; tip: string }[];
  xLabel: string; yLabel: string; xMid: number; yMid: number; xMax: number; yMax: number; yMin?: number;
  /** what the dashed lines stand for, e.g. "avg ₹1.8L", "target pace" */
  xMidLabel?: string; yMidLabel?: string;
  /** top-left, top-right, bottom-left, bottom-right */
  captions: [string, string, string, string];
  onPick?: (key: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const W = 640, H = 290, L = 26, R = 632, T = 10, B = 262;
  const x = (v: number) => L + (Math.min(v, xMax) / xMax) * (R - L);
  const y = (v: number) => B - ((Math.max(Math.min(v, yMax), yMin) - yMin) / (yMax - yMin)) * (B - T);
  const fill = { success: 'fill-success', warning: 'fill-warning', error: 'fill-error', info: 'fill-chart-blue' } as const;
  const hp = points.find((p) => p.key === hover);
  return (
    <div className="relative">
      {hp && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 shadow-md"
          style={{ left: `${Math.min(Math.max((x(hp.x) / W) * 100, 15), 85)}%`, top: `${(y(hp.y) / H) * 100 - 5}%` }}
        >
          <div className="type-label whitespace-nowrap">{hp.label}</div>
          <div className="type-caption whitespace-nowrap text-foreground-secondary">{hp.tip}</div>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={`${yLabel} against ${xLabel}`}>
        <rect x={x(xMid)} y={T} width={R - x(xMid)} height={y(yMid) - T} className="fill-success/5" />
        <rect x={L} y={y(yMid)} width={x(xMid) - L} height={B - y(yMid)} className="fill-error/5" />
        <line x1={x(xMid)} y1={T} x2={x(xMid)} y2={B} className="stroke-border-strong" strokeDasharray="5 4" />
        <line x1={L} y1={y(yMid)} x2={R} y2={y(yMid)} className="stroke-border-strong" strokeDasharray="5 4" />
        <line x1={L} y1={B} x2={R} y2={B} className="stroke-border" />
        <text x={L + 6} y={T + 14} className="fill-foreground-tertiary text-[11px] font-semibold">{captions[0]}</text>
        <text x={R - 6} y={T + 14} textAnchor="end" className="fill-success-foreground text-[11px] font-semibold">{captions[1]}</text>
        <text x={L + 6} y={B - 8} className="fill-error-foreground text-[11px] font-semibold">{captions[2]}</text>
        <text x={R - 6} y={B - 8} textAnchor="end" className="fill-foreground-tertiary text-[11px] font-semibold">{captions[3]}</text>
        {xMidLabel && <text x={x(xMid)} y={B + 13} textAnchor="middle" className="fill-foreground-secondary text-[10px]">{xMidLabel}</text>}
        {yMidLabel && <text x={R} y={y(yMid) - 4} textAnchor="end" className="fill-foreground-secondary text-[10px]">{yMidLabel}</text>}
        <text x={(L + R) / 2} y={H - 2} textAnchor="middle" className="fill-foreground-secondary text-[11px]">{xLabel} →</text>
        <text x={10} y={(T + B) / 2} textAnchor="middle" transform={`rotate(-90 10 ${(T + B) / 2})`} className="fill-foreground-secondary text-[11px]">{yLabel} →</text>
        {points.map((p) => (
          <g
            key={p.key}
            className={cn(onPick && 'cursor-pointer')}
            onClick={onPick && (() => onPick(p.key))}
            onMouseEnter={() => setHover(p.key)}
            onMouseLeave={() => setHover(null)}
          >
            <circle cx={x(p.x)} cy={y(p.y)} r={p.r} className={fill[p.tone]} opacity={hover === p.key ? 1 : 0.78} />
            <text x={x(p.x)} y={y(p.y) - p.r - 4} textAnchor="middle" className="fill-foreground text-[10px] font-medium">{shortName(p.label)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/** "Best at …" card: top three on one KPI, the average, and the one furthest behind. */
export function LeaderCard({ title, hint, accent, rows, avg, last, onRow, onOpen }: {
  title: string; hint: string; accent: string;
  rows: { key: string; name: string; sub: string; value: string; share: number }[];
  avg: string; last?: { key: string; name: string; value: string };
  onRow?: (key: string) => void; onOpen?: () => void;
}) {
  return (
    <Card variant={onOpen ? 'interactive' : 'default'} className="border border-border p-3.5" onClick={onOpen}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className={cn('type-micro', accent)}>{title}</span>
        <span className="type-caption text-foreground-secondary">{hint}</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.key}
          className={cn('flex items-baseline gap-2 rounded-md py-1', onRow && '-mx-1.5 cursor-pointer px-1.5 hover:bg-muted')}
          onClick={onRow && ((e) => { e.stopPropagation(); onRow(r.key); })}
        >
          <i className="type-caption w-3.5 shrink-0 not-italic text-foreground-tertiary">{i + 1}</i>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="type-body block truncate">{r.name}</span>
            <span className="type-caption block truncate text-foreground-tertiary">{r.sub}</span>
          </span>
          <b className="type-price-sm">{r.value}</b>
        </div>
      ))}
      <div className="type-caption mt-1.5 flex justify-between border-t border-dashed border-border pt-1.5 text-foreground-secondary">
        <span>Average</span><span className="tabular-nums">{avg}</span>
      </div>
      {last && (
        <div
          className={cn('type-caption flex justify-between rounded-md pt-1 text-error-foreground', onRow && 'cursor-pointer hover:underline')}
          onClick={onRow && ((e) => { e.stopPropagation(); onRow(last.key); })}
        >
          <span className="truncate">Lowest · {last.name}</span><span className="tabular-nums">{last.value}</span>
        </div>
      )}
      <div className="mt-2.5 flex h-1.5 gap-px overflow-hidden rounded-full bg-background-sunken">
        {rows.map((r, i) => (
          <i key={r.key} className={cn('block bg-current', accent, i === 1 && 'opacity-70', i === 2 && 'opacity-45')} style={{ width: `${r.share}%` }} />
        ))}
      </div>
    </Card>
  );
}
