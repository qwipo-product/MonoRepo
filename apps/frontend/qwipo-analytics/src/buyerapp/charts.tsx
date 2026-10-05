import { useState } from 'react';
import { cn } from '@mockups/ui';
import type { DatePoint } from './engine';
import { SERIES } from './seriesColors';


/* ── Sparkline ──────────────────────────────────────────────────────── */

/**
 * A tiny trend line; green when the change is good, red when bad.
 * With `labels` and `fmt`, hovering shows the value at each point.
 */
export function Sparkline({
  points,
  good,
  width = 88,
  height = 28,
  labels,
  fmt,
}: {
  points: number[];
  good: boolean;
  width?: number;
  height?: number;
  labels?: string[];
  fmt?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const span = hi - lo || 1;
  const xy = points.map((v, i) => [(i / (points.length - 1)) * width, height - 3 - ((v - lo) / span) * (height - 6)]);
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const color = good ? SERIES.good : SERIES.bad;
  const [ex, ey] = xy[xy.length - 1];
  const interactive = !!(labels && fmt);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rc = e.currentTarget.getBoundingClientRect();
    const f = (e.clientX - rc.left) / (rc.width || 1);
    setHover(Math.max(0, Math.min(points.length - 1, Math.round(f * (points.length - 1)))));
  };

  return (
    <span className="relative inline-block align-middle" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={cn('block overflow-visible', interactive && 'cursor-crosshair')}
        aria-hidden
        onMouseMove={interactive ? onMove : undefined}
        onMouseLeave={interactive ? () => setHover(null) : undefined}
      >
        <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={color} fillOpacity={0.1} />
        <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        {hover === null ? (
          <circle cx={ex} cy={ey} r={2.5} fill={color} />
        ) : (
          <>
            <line x1={xy[hover][0]} x2={xy[hover][0]} y1={0} y2={height} stroke="currentColor" strokeOpacity={0.25} />
            <circle cx={xy[hover][0]} cy={xy[hover][1]} r={3} fill={color} stroke="var(--color-card)" strokeWidth={1.5} />
          </>
        )}
      </svg>
      {interactive && hover !== null && (
        <span
          className="pointer-events-none absolute bottom-full z-30 mb-1.5 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-[11px] text-foreground shadow-md"
          style={{ left: xy[hover][0], transform: `translateX(${hover > points.length / 2 ? '-100%' : '0'})` }}
        >
          <span className="text-foreground-secondary">{labels![hover]}</span> · <span className="font-semibold tabular-nums">{fmt!(points[hover])}</span>
        </span>
      )}
    </span>
  );
}

/* ── LineChart ──────────────────────────────────────────────────────── */

export interface LineSeries {
  name: string;
  color: string;
  values: number[];
}

export function LineChart({
  series,
  dates,
  height,
  fmt,
  filled = true,
  narrow = false,
}: {
  series: LineSeries[];
  dates: DatePoint[];
  height: number;
  fmt: (v: number, tick: boolean) => string;
  filled?: boolean;
  /** thins the 7-day axis to every other label, for charts in a narrow panel */
  narrow?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = dates.length;
  const max = Math.max(...series.flatMap((s) => s.values));
  const raw = max / 4 || 1;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const r = raw / p;
  const step = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * p;
  const top = step * Math.ceil(max / step);
  const Y = (v: number) => height - (v / top) * height;
  const X = (i: number) => (n === 1 ? 50 : (i * 100) / (n - 1));

  const ticks: { label: string; top: number }[] = [];
  for (let i = 0; i * step <= top + step / 2; i++) ticks.push({ label: fmt(i * step, true), top: Y(i * step) });

  const lines = series.map((s) => {
    const line = 'M' + s.values.map((v, i) => X(i).toFixed(2) + ' ' + Y(v).toFixed(1)).join(' L');
    return { ...s, line, area: line + ` L100 ${height} L0 ${height} Z`, yEnd: Y(s.values[n - 1]) };
  });
  const showEnd = lines.length < 2 || Math.abs(lines[0].yEnd - lines[1].yEnd) >= 18;

  const idx = n <= 7 ? (narrow ? [0, 2, 4, 6] : dates.map((_, i) => i)) : n === 30 ? [0, 7, 14, 21, 29] : [0, 4, 8, 12];

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rc = e.currentTarget.getBoundingClientRect();
    const f = (e.clientX - rc.left) / (rc.width || 1);
    setHover(Math.max(0, Math.min(n - 1, Math.round(f * (n - 1)))));
  };

  return (
    <div className="grid grid-cols-[56px_1fr_64px] text-[11px] text-foreground-secondary">
      <div className="relative" style={{ height }}>
        {ticks.map((t) => (
          <div key={t.label} className="absolute right-2 -translate-y-1/2 tabular-nums" style={{ top: t.top }}>
            {t.label}
          </div>
        ))}
      </div>
      <div className="relative" style={{ height }}>
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          width="100%"
          height={height}
          className="absolute left-0 top-0 block overflow-visible"
        >
          <path
            d={ticks.map((t) => `M0 ${t.top} H100`).join(' ')}
            stroke="var(--color-border)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            fill="none"
          />
          {filled &&
            lines.map((s) => <path key={s.name + 'a'} d={s.area} fill={s.color} fillOpacity={0.07} stroke="none" />)}
          {lines.map((s) => (
            <path
              key={s.name}
              d={s.line}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {lines.map((s) => (
          <span
            key={s.name + 'd'}
            className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
            style={{ left: '100%', top: s.yEnd, background: s.color }}
          />
        ))}
        {hover !== null && (
          <>
            <div className="absolute top-0 w-px bg-foreground/25" style={{ left: `${X(hover)}%`, height }} />
            {lines.map((s) => (
              <span
                key={s.name + 'h'}
                className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
                style={{ left: `${X(hover)}%`, top: Y(s.values[hover]), background: s.color }}
              />
            ))}
            <div
              className="pointer-events-none absolute top-1 z-10 flex min-w-28 flex-col gap-0.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground shadow-md"
              style={{
                left: `${X(hover)}%`,
                transform: X(hover) > 58 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
              }}
            >
              <div className="text-foreground-secondary">{dates[hover].label}</div>
              {lines.map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                  <span className="font-semibold tabular-nums">{fmt(s.values[hover], false)}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="absolute inset-0" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </div>
      <div className="relative" style={{ height }}>
        {showEnd &&
          lines.map((s) => (
            <div
              key={s.name}
              className="absolute left-3 -translate-y-1/2 font-semibold tabular-nums"
              style={{ top: s.yEnd, color: s.color }}
            >
              {fmt(s.values[n - 1], false)}
            </div>
          ))}
      </div>
      <div />
      <div className="relative mt-2 h-4">
        {idx.map((i, j) => (
          <span
            key={i}
            className="absolute whitespace-nowrap"
            style={{
              left: `${X(i)}%`,
              transform: `translateX(${j === 0 ? '0%' : j === idx.length - 1 ? '-100%' : '-50%'})`,
            }}
          >
            {dates[i].label}
          </span>
        ))}
      </div>
      <div />
    </div>
  );
}

export function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <div className="flex items-center gap-4 text-xs text-foreground-secondary">
      {items.map((i) => (
        <span key={i.name} className="flex items-center gap-1.5">
          <span className="h-0.5 w-3.5 rounded" style={{ background: i.color }} />
          {i.name}
        </span>
      ))}
    </div>
  );
}
