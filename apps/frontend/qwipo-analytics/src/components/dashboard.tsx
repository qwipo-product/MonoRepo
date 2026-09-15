// Dashboard pieces composed from @mockups/ui and the token classes only.
// No hex, no arbitrary text sizes: type comes from the .type-* roles, colour
// from semantic tokens or the app's chart tokens (index.css). They stay in this
// app until a second app needs them.

import { Card, CardContent, CardHeader, CardTitle, CardDescription, cn } from '@mockups/ui';
import type { DimensionKey, Trend } from '../data/overview';
import { dimBg } from './chartClasses';

/** Grey uppercase question label above a panel or KPI row. */
export function Question({ children }: { children: React.ReactNode }) {
  return <div className="type-micro mb-1 text-foreground-tertiary">{children}</div>;
}

/** A card that opens a page on click; the interactive Card variant is the affordance. */
export function Panel({
  question, title, subtitle, onOpen, className, children, right,
}: {
  question: string; title: string; subtitle?: string; onOpen?: () => void;
  className?: string; children: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <Card variant={onOpen ? 'interactive' : 'default'} className={cn('flex flex-col', className)} onClick={onOpen}>
      <CardHeader className="pb-3">
        <Question>{question}</Question>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="type-label">{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
          {right}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">{children}</CardContent>
    </Card>
  );
}

export function Delta({ trend, inverse, children }: { trend: Trend; inverse?: boolean; children: React.ReactNode }) {
  const good = trend === 'flat' ? null : (trend === 'up') !== !!inverse;
  return (
    <span className={cn('font-medium tabular-nums', good === null ? 'text-foreground-secondary' : good ? 'text-success-foreground' : 'text-error-foreground')}>
      {children}
    </span>
  );
}

export function KpiCard({
  label, value, change, trend, inverse, note, target, onOpen,
}: {
  label: string; value: string; change: string; trend: Trend; inverse?: boolean; note: string;
  target?: 'warning' | 'error'; onOpen?: () => void;
}) {
  return (
    <Card
      variant={onOpen ? 'interactive' : 'default'}
      onClick={onOpen}
      className={cn('px-4 py-3.5', target === 'warning' && 'border-l-[3px] border-l-warning', target === 'error' && 'border-l-[3px] border-l-error')}
    >
      <div className="type-caption text-foreground-secondary">{label}</div>
      <div className="type-display my-0.5 tabular-nums tracking-tight">{value}</div>
      <div className="type-caption flex flex-wrap gap-1.5 text-foreground-secondary">
        <Delta trend={trend} inverse={inverse}>{change}</Delta>
        <span>{note}</span>
      </div>
    </Card>
  );
}

/** Horizontal ranked bar: rank · name · bar · value · change. Decliners hatched. */
export function RankedRow({
  rank, name, value, max, change, dim, other,
}: { rank?: number; name: string; value: number; max: number; change: number; dim: DimensionKey; other?: boolean }) {
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
          className={cn('h-full rounded-sm', other ? 'bg-border-strong' : dimBg[dim], down && 'hatched')}
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

/** Vertical bars with the value on top and the label underneath. `bg` is a token class. */
export function Columns({ items, height = 130 }: { items: { label: string; n: number; bg: string }[]; height?: number }) {
  const max = Math.max(...items.map((i) => i.n));
  return (
    <div className="flex items-end gap-2.5" style={{ height }}>
      {items.map((it) => (
        <div key={it.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <b className="type-price-sm">{it.n.toLocaleString('en-IN')}</b>
          <i className={cn('block w-full rounded-t-sm', it.bg)} style={{ height: `${(it.n / max) * 100}%` }} />
          <small className="type-caption whitespace-nowrap text-foreground-secondary">{it.label}</small>
        </div>
      ))}
    </div>
  );
}

/** Label · big number · note, used for rates under a chart. */
export function Stat({ label, value, note }: { label: string; value: string; note: React.ReactNode }) {
  return (
    <div>
      <div className="type-caption text-foreground-secondary">{label}</div>
      <div className="type-h1 tabular-nums">{value}</div>
      <div className="type-caption text-foreground-secondary">{note}</div>
    </div>
  );
}
