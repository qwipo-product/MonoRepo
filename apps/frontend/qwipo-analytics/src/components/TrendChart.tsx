// Order value per day: current (primary), delivered (success, shaded), previous
// period (dashed, border-strong). All colours are token classes so the chart
// follows the theme. Peaks and troughs on both lines are labelled.

const W = 1000, H = 400, X0 = 50, X1 = 970, Y0 = 380, SCALE = 105;

function pts(vals: number[]) {
  return vals.map((v, i) => [X0 + (i * (X1 - X0)) / (vals.length - 1), Y0 - v * SCALE] as const);
}
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

export function TrendChart({ current, previous, delivered, onPoint }: { current: number[]; previous: number[]; delivered: number[]; onPoint?: (i: number) => void }) {
  const c = pts(current), p = pts(previous), d = pts(delivered);
  const gridY = (v: number) => Y0 - v * SCALE;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Order value per day with delivered value and previous period">
      {[1, 2].map((v) => (
        <g key={v}>
          <line x1={X0} y1={gridY(v)} x2={X1} y2={gridY(v)} className="stroke-border" />
          <text x={14} y={gridY(v) + 4} className="fill-foreground-secondary text-[10px]">₹{v}L</text>
        </g>
      ))}
      <line x1={X0} y1={Y0} x2={X1} y2={Y0} className="stroke-border" />
      <path d={`M${poly(d).replace(/ /g, ' L')} L${X1},${Y0} L${X0},${Y0} Z`} className="fill-success/10" />
      <polyline points={poly(d)} className="fill-none stroke-success" strokeWidth={1.8} />
      <polyline points={poly(p)} className="fill-none stroke-border-strong" strokeWidth={1.6} strokeDasharray="4 3" />
      <polyline points={poly(c)} className="fill-none stroke-primary" strokeWidth={2.2} />
      {extrema(current).map(({ i, peak }) => (
        <g key={`c${i}`} className={cn(onPoint && 'cursor-pointer')} onClick={onPoint && ((e) => { e.stopPropagation(); onPoint(i); })}>
          {onPoint && <circle cx={c[i][0]} cy={c[i][1]} r={12} className="fill-transparent" />}
          <circle cx={c[i][0]} cy={c[i][1]} r={3} className="fill-primary" />
          <text x={c[i][0]} y={c[i][1] + (peak ? -9 : 18)} textAnchor="middle" className={cn(peak ? 'fill-foreground font-medium' : 'fill-foreground-secondary', 'text-[10px]')}>
            {lakh(current[i])}
          </text>
        </g>
      ))}
      {extrema(delivered).map(({ i, peak }) => (
        <g key={`d${i}`}>
          <circle cx={d[i][0]} cy={d[i][1]} r={3} className="fill-success" />
          <text x={d[i][0]} y={d[i][1] + (peak ? -9 : 18)} textAnchor="middle" className="fill-success-foreground text-[10px]">
            {lakh(delivered[i], 2)}
          </text>
        </g>
      ))}
      {[0, 5, 10, 15, 21].map((i) => (
        <text key={i} x={c[i][0]} y={396} textAnchor={i === 0 ? 'start' : i === 21 ? 'end' : 'middle'} className="fill-foreground-secondary text-[10px]">
          {i + 1} Aug
        </text>
      ))}
    </svg>
  );
}

function cn(...a: (string | false | undefined)[]) { return a.filter(Boolean).join(' '); }
