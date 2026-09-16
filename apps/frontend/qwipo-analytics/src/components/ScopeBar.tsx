import { ChevronDown, Lock, X } from 'lucide-react';
import { Button, Card, cn } from '@mockups/ui';

export interface ScopeChip { label: string; value: string; locked?: boolean; drill?: boolean }

export function ScopeBar({
  chips, line, refreshed = 'Data refreshed 22 Aug, 06:15 IST', action = 'Reset', onAction,
}: {
  chips: ScopeChip[]; line: React.ReactNode; refreshed?: string; action?: string; onAction?: () => void;
}) {
  return (
    <Card className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {chips.map((c) => (
          <Card
            key={c.label}
            variant="flat"
            className={cn(
              'flex min-w-[150px] items-center justify-between gap-3 rounded-md px-2.5 py-1.5',
              c.drill && 'border border-info-border bg-info-subtle',
            )}
          >
            <div className="leading-tight">
              <div className={cn('type-micro normal-case tracking-normal', c.drill ? 'text-info-foreground' : 'text-foreground-secondary')}>{c.label}</div>
              <div className={cn('type-label', c.drill && 'text-info-foreground')}>{c.value}</div>
            </div>
            {c.drill ? <X size={13} className="text-info-foreground" /> : c.locked ? <Lock size={13} className="text-foreground-tertiary" /> : <ChevronDown size={14} className="text-foreground-secondary" />}
          </Card>
        ))}
        <Button variant="ghost" size="sm" className="ml-auto text-link" onClick={onAction}>{action}</Button>
      </div>
      <div className="type-caption mt-2.5 flex flex-wrap justify-between gap-2 text-foreground-secondary">
        <span>{line}</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {refreshed}
        </span>
      </div>
    </Card>
  );
}
