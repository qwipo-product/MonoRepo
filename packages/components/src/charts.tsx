/**
 * Chart primitives for dashboard mockups. Token-bound like everything else:
 * colour always arrives as a token class (`bg-chart-blue`, `bg-success`) from
 * the caller — components here never name a colour. The only inline styles are
 * data-driven geometry (bar widths/heights as percentages), which Tailwind
 * cannot express because the values exist only at runtime.
 */
import { cn } from '@mockups/ui';

/** Horizontal ranked bar: rank · name · bar · value · change. Decliners hatched. */
export function RankedRow({
  rank, name, value, max, change, barClass, other,
}: {
  rank?: number; name: string; value: number; max: number; change: number;
  /** token class for the bar fill, e.g. `bg-chart-blue` */
  barClass: string;
  /** catch-all row ("12 others"): muted bar, no rank */
  other?: boolean;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const down = change < 0;
  return (
    <div className="type-caption grid grid-cols-[150px_1fr_108px] items-center gap-2.5 text-foreground">
      <span className={cn('flex gap-2 truncate', down && 'text-error-foreground')}>
        <i className="w-3.5 text-right not-italic tabular-nums text-foreground-tertiary">{other ? '' : rank}</i>
        {name}
      </span>
      <div className="h-2.5 overflow-hidden rounded-sm bg-background-sunken">
        <div
          className={cn('h-full rounded-sm', other ? 'bg-border-strong' : barClass, down && 'hatched')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-right tabular-nums">
        ₹{value}L
        <small className={cn('ml-1', change === 0 ? 'text-foreground-tertiary' : down ? 'text-error-foreground' : 'text-success-foreground')}>
          {change === 0 ? '—' : `${down ? '↓' : '↑'} ${Math.abs(change)}%`}
        </small>
      </span>
    </div>
  );
}

/** Vertical bars with the value on top and the label underneath. `bg` is a token class.
 *  `onBar` makes each column a drill-through click target. */
export function Columns({ items, height = 130, onBar }: { items: { label: string; n: number; bg: string }[]; height?: number; onBar?: (label: string) => void }) {
  const max = Math.max(...items.map((i) => i.n));
  return (
    <div className="flex items-end gap-2.5" style={{ height }}>
      {items.map((it) => (
        <div
          key={it.label}
          className={cn('flex h-full flex-1 flex-col items-center justify-end gap-1', onBar && 'cursor-pointer rounded-md hover:bg-muted')}
          onClick={onBar && ((e: React.MouseEvent) => { e.stopPropagation(); onBar(it.label); })}
        >
          <b className="type-price-sm">{it.n.toLocaleString('en-IN')}</b>
          <i className={cn('block w-full rounded-t-sm', it.bg)} style={{ height: `${(it.n / max) * 100}%` }} />
          <small className="type-caption whitespace-nowrap text-foreground-secondary">{it.label}</small>
        </div>
      ))}
    </div>
  );
}

/** 100% horizontal stacked bar; labels sit inside segments wide enough to hold them. */
export function StackBar({ parts, onPart }: { parts: { key: string; pct: number; label: string; bg: string }[]; onPart?: (key: string) => void }) {
  return (
    <div className="flex h-8 w-full overflow-hidden rounded-md">
      {parts.map((p) => (
        <div
          key={p.key}
          className={cn('grid place-items-center overflow-hidden', p.bg, onPart && 'cursor-pointer hover:opacity-85')}
          style={{ width: `${p.pct}%` }}
          onClick={onPart && ((e: React.MouseEvent) => { e.stopPropagation(); onPart(p.key); })}
        >
          {p.pct >= 5 && <span className="type-micro normal-case tracking-normal text-primary-foreground">{p.label}</span>}
        </div>
      ))}
    </div>
  );
}

/** Label · track · count+value rows; `barClass` is a token class per row. */
export function HBars({
  rows, wideLabel, onRow,
}: {
  rows: { label: string; n: number; value: string; barClass: string }[];
  wideLabel?: boolean;
  onRow?: (label: string) => void;
}) {
  const max = Math.max(...rows.map((r) => r.n));
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div
          key={r.label}
          className={cn('type-caption grid items-center gap-2.5 text-foreground', wideLabel ? 'grid-cols-[210px_1fr_84px]' : 'grid-cols-[170px_1fr_84px]', onRow && 'cursor-pointer rounded-md px-1 -mx-1 hover:bg-muted')}
          onClick={onRow && ((e: React.MouseEvent) => { e.stopPropagation(); onRow(r.label); })}
        >
          <span className="truncate">{r.label}</span>
          <div className="h-2.5 overflow-hidden rounded-sm bg-background-sunken">
            <div className={cn('h-full rounded-sm', r.barClass)} style={{ width: `${(r.n / max) * 100}%` }} />
          </div>
          <span className="text-right tabular-nums">
            {r.n} <small className="text-foreground-tertiary">{r.value}</small>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Label · big number · note, used for rates under a chart. `onClick` = drill-through. */
export function Stat({ label, value, note, onClick }: { label: string; value: string; note: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      className={cn(onClick && '-mx-1.5 cursor-pointer rounded-md px-1.5 hover:bg-muted')}
      onClick={onClick && ((e: React.MouseEvent) => { e.stopPropagation(); onClick(); })}
    >
      <div className="type-caption text-foreground-secondary">{label}</div>
      <div className="type-h1 tabular-nums">{value}</div>
      <div className="type-caption text-foreground-secondary">{note}</div>
    </div>
  );
}
