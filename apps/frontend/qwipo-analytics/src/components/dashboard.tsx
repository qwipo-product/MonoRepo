// Dashboard-specific pieces composed from @mockups/ui. They live in this app
// until a second app needs them (CLAUDE.md: promote only on a second use).

import { Card, CardContent, CardHeader, CardTitle, CardDescription, cn } from '@mockups/ui';
import type { Trend } from '../data/overview';

/** Grey uppercase question label above a panel or KPI row. */
export function Question({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">{children}</div>;
}

/** A card that opens a page on click. Hover ring is the only affordance, per the agreed design. */
export function Panel({
  question, title, subtitle, onOpen, className, children, right,
}: {
  question: string; title: string; subtitle?: string; onOpen?: () => void;
  className?: string; children: React.ReactNode; right?: React.ReactNode;
}) {
  return (
    <Card
      variant={onOpen ? 'interactive' : 'default'}
      className={cn('flex flex-col', onOpen && 'hover:border-primary/40', className)}
      onClick={onOpen}
    >
      <CardHeader className="pb-3">
        <Question>{question}</Question>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
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
  target?: 'warn' | 'risk'; onOpen?: () => void;
}) {
  return (
    <Card
      variant={onOpen ? 'interactive' : 'default'}
      onClick={onOpen}
      className={cn('px-4 py-3.5', target === 'warn' && 'border-l-[3px] border-l-warning', target === 'risk' && 'border-l-[3px] border-l-error')}
    >
      <div className="text-xs text-foreground-secondary">{label}</div>
      <div className="my-0.5 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      <div className="flex flex-wrap gap-1.5 text-xs text-foreground-secondary">
        <Delta trend={trend} inverse={inverse}>{change}</Delta>
        <span>{note}</span>
      </div>
    </Card>
  );
}

/** Horizontal ranked bar: rank · name · bar · value · change. Decliners hatched. */
export function RankedRow({
  rank, name, value, max, change, hue, other,
}: { rank?: number; name: string; value: string; max: number; change: number; hue: string; other?: boolean }) {
  const pct = Math.min((parseFloat(value.replace(/[^\d.]/g, '')) / max) * 100, 100);
  const down = change < 0;
  return (
    <div className="grid grid-cols-[150px_1fr_108px] items-center gap-2.5 text-[12.5px]">
      <span className={cn('flex gap-2 truncate', down && 'text-error-foreground')}>
        <i className="w-3.5 text-right not-italic tabular-nums text-foreground-tertiary">{other ? '' : rank}</i>
        {name}
      </span>
      <div className="h-2.5 overflow-hidden rounded bg-background-sunken">
        <div
          className="h-full rounded"
          style={{
            width: `${pct}%`,
            background: other ? 'var(--border-strong)' : down ? `repeating-linear-gradient(135deg, ${hue} 0 5px, transparent 5px 8px)` : hue,
          }}
        />
      </div>
      <span className="text-right tabular-nums">
        {value}
        <small className={cn('ml-1', change === 0 ? 'text-foreground-tertiary' : down ? 'text-error-foreground' : 'text-success-foreground')}>
          {change === 0 ? '—' : `${down ? '↓' : '↑'} ${Math.abs(change)}%`}
        </small>
      </span>
    </div>
  );
}

/** Vertical bars with the value on top and the label underneath. */
export function Columns({ items, height = 130 }: { items: { label: string; n: number; color: string }[]; height?: number }) {
  const max = Math.max(...items.map((i) => i.n));
  return (
    <div className="flex items-end gap-2.5" style={{ height }}>
      {items.map((it) => (
        <div key={it.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <b className="text-[13px] font-semibold tabular-nums">{it.n.toLocaleString('en-IN')}</b>
          <i className="block w-full rounded-t" style={{ height: `${(it.n / max) * 100}%`, background: it.color }} />
          <small className="whitespace-nowrap text-[11.5px] text-foreground-secondary">{it.label}</small>
        </div>
      ))}
    </div>
  );
}
