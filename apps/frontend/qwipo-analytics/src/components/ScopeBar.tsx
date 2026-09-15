import { ChevronDown, Lock } from 'lucide-react';
import { Button, Card } from '@mockups/ui';

export interface ScopeChip { label: string; value: string; locked?: boolean }

export function ScopeBar({ chips, line, refreshed = 'Data refreshed 22 Aug, 06:15 IST' }: { chips: ScopeChip[]; line: string; refreshed?: string }) {
  return (
    <Card className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {chips.map((c) => (
          <Card key={c.label} variant="flat" className="flex min-w-[150px] items-center justify-between gap-3 rounded-md px-2.5 py-1.5">
            <div className="leading-tight">
              <div className="type-micro normal-case tracking-normal text-foreground-secondary">{c.label}</div>
              <div className="type-label">{c.value}</div>
            </div>
            {c.locked ? <Lock size={13} className="text-foreground-tertiary" /> : <ChevronDown size={14} className="text-foreground-secondary" />}
          </Card>
        ))}
        <Button variant="ghost" size="sm" className="ml-auto text-link">Reset</Button>
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
