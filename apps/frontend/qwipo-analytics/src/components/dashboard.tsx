// Dashboard pieces composed from @mockups/ui and the token classes only.
// No hex, no arbitrary text sizes: type comes from the .type-* roles, colour
// from semantic tokens or the design-system chart palette. Generic chart
// primitives (RankedRow, Columns, StackBar, HBars, Stat) live in
// @mockups/components; these are the page-grammar pieces.

import { Card, CardContent, CardHeader, CardTitle, CardDescription, cn } from '@mockups/ui';
import type { Trend } from '../data/overview';

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
