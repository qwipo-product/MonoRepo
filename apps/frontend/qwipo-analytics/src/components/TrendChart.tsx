// Daily trend line: current (primary), optional delivered (success, shaded)
// and previous period (dashed, border-strong). All colours are token classes
// so the chart follows the theme. Extrema are labelled; hovering shows a guide
// line + tooltip. Defaults are the Overview/Sales world (₹L, 22 Aug days);
// the optional props let other pages (Ops Orders) reuse it with their own
// units, dates and scale.

import { useState } from 'react';

function extrema(vals: number[]) {
  const out: { i: number; peak: boolean }[] = [];
  for (let i = 1; i < vals.length - 1; i++) {
    if (vals[i] > vals[i - 1] && vals[i] >= vals[i + 1]) out.push({ i, peak: true });
    else if (vals[i] < vals[i - 1] && vals[i] <= vals[i + 1]) out.push({ i, peak: false });
  }
  return out;
}
const lakh = (v: number, d = 1) => `₹${v.toFixed(d)}L`;
const poly = (a: readonly (readonly [number, number])[]) => a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

export function TrendChart({
  current, previous, delivered, onPoint,
  yMax,
  grid = [{ v: 1, label: '₹1L' }, { v: 2, label: '₹2L' }],
  fmt = lakh,
  seriesLabel = 'Order value',
  tooltipTitle = (i) => `${i + 1} Aug 2026`,
  prevLabel = (i) => `${i + 1} Jul`,
  xTicks = [0, 5, 10, 15, 21],
  xLabel = (i) => `${i + 1} Aug`,
  extremaMode = 'all',
  compact = false,
}: {
  current: number[]; previous?: number[]; delivered?: number[]; onPoint?: (i: number) => void;
  /** value that maps near the top of the chart; default keeps the fixed ₹L scale */
  yMax?: number;
  grid?: { v: number; label: string }[];
  fmt?: (v: number, d?: number) => string;
  seriesLabel?: string;
  tooltipTitle?: (i: number) => string;
  prevLabel?: (i: number) => string;
  xTicks?: number[];
  xLabel?: (i: number) => string;
  /** 'minmax' labels only the highest and lowest day — for noisy daily series */
  extremaMode?: 'all' | 'minmax';
  /** half-size viewBox so the chart stays legible in a half-width panel */
  compact?: boolean;
}) {
  const W = compact ? 500 : 1000, H = compact ? 230 : 400;
  const X0 = compact ? 40 : 50, X1 = W - 30, Y0 = H - 20;
  const scale = yMax ? (compact ? 160 : 320) / yMax : 105;
  const pts = (vals: number[]) =>
    vals.map((v, i) => [X0 + (i * (X1 - X0)) / (vals.length - 1), Y0 - v * scale] as const);
  const c = pts(current), p = previous && pts(previous), d = delivered && pts(delivered);
  const gridY = (v: number) => Y0 - v * scale;
  const [hover, setHover] = useState<number | null>(null);
  const n = current.length;
  const marks = extremaMode === 'all'
    ? extrema(current)
    : [current.indexOf(Math.max(...current)), current.indexOf(Math.min(...current))]
        .map((i) => ({ i, peak: current[i] === Math.max(...current) }));

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - X0) / (X1 - X0)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div className="relative">
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-2 shadow-md"
          style={{ left: `${Math.min(Math.max((c[hover][0] / W) * 100, 12), 88)}%` }}
        >
          <div className="type-label whitespace-nowrap">{tooltipTitle(hover)}</div>
          <div className="type-caption mt-0.5 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0.5 whitespace-nowrap text-foreground-secondary">
            <i className="h-2 w-2 rounded-full bg-primary" /><span>{seriesLabel} <b className="ml-1 text-foreground tabular-nums">{fmt(current[hover])}</b></span>
            {delivered && <><i className="h-2 w-2 rounded-full bg-success" /><span>Delivered <b className="ml-1 text-foreground tabular-nums">{fmt(delivered[hover], 2)}</b></span></>}
            {previous && <><i className="h-2 w-2 rounded-full bg-border-strong" /><span>{prevLabel(hover)} <b className="ml-1 text-foreground tabular-nums">{fmt(previous[hover], 2)}</b></span></>}
          </div>
        </div>
      )}
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      role="img"
      aria-label={`${seriesLabel} per day`}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      {grid.map((g) => (
        <g key={g.v}>
          <line x1={X0} y1={gridY(g.v)} x2={X1} y2={gridY(g.v)} className="stroke-border" />
          <text x={14} y={gridY(g.v) + 4} className="fill-foreground-secondary text-[10px]">{g.label}</text>
        </g>
      ))}
      <line x1={X0} y1={Y0} x2={X1} y2={Y0} className="stroke-border" />
      {d && <path d={`M${poly(d).replace(/ /g, ' L')} L${X1},${Y0} L${X0},${Y0} Z`} className="fill-success/10" />}
      {d && <polyline points={poly(d)} className="fill-none stroke-success" strokeWidth={1.8} />}
      {p && <polyline points={poly(p)} className="fill-none stroke-border-strong" strokeWidth={1.6} strokeDasharray="4 3" />}
      <polyline points={poly(c)} className="fill-none stroke-primary" strokeWidth={2.2} />
      {marks.map(({ i, peak }) => (
        <g key={`c${i}`} className={cn(onPoint && 'cursor-pointer')} onClick={onPoint && ((e) => { e.stopPropagation(); onPoint(i); })}>
          {onPoint && <circle cx={c[i][0]} cy={c[i][1]} r={12} className="fill-transparent" />}
          <circle cx={c[i][0]} cy={c[i][1]} r={3} className="fill-primary" />
          <text x={c[i][0]} y={c[i][1] + (peak ? -9 : 18)} textAnchor="middle" className={cn(peak ? 'fill-foreground font-medium' : 'fill-foreground-secondary', 'text-[10px]')}>
            {fmt(current[i])}
          </text>
        </g>
      ))}
      {d && extrema(delivered!).map(({ i, peak }) => (
        <g key={`d${i}`}>
          <circle cx={d[i][0]} cy={d[i][1]} r={3} className="fill-success" />
          <text x={d[i][0]} y={d[i][1] + (peak ? -9 : 18)} textAnchor="middle" className="fill-success-foreground text-[10px]">
            {fmt(delivered![i], 2)}
          </text>
        </g>
      ))}
      {xTicks.map((i) => (
        <text key={i} x={c[i][0]} y={H - 4} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="fill-foreground-secondary text-[10px]">
          {xLabel(i)}
        </text>
      ))}
      {hover !== null && (
        <g className="pointer-events-none">
          <line x1={c[hover][0]} y1={compact ? 20 : 40} x2={c[hover][0]} y2={Y0} className="stroke-border-strong" strokeDasharray="3 3" />
          <circle cx={c[hover][0]} cy={c[hover][1]} r={4.5} className="fill-primary stroke-card" strokeWidth={2} />
          {d && <circle cx={d[hover][0]} cy={d[hover][1]} r={4} className="fill-success stroke-card" strokeWidth={2} />}
          {p && <circle cx={p[hover][0]} cy={p[hover][1]} r={3.5} className="fill-border-strong stroke-card" strokeWidth={2} />}
        </g>
      )}
    </svg>
    </div>
  );
}

function cn(...a: (string | false | undefined)[]) { return a.filter(Boolean).join(' '); }
