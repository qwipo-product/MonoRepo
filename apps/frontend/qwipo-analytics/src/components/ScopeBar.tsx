import { ChevronDown, Lock } from 'lucide-react';
import { Card } from '@mockups/ui';

export interface ScopeChip { label: string; value: string; locked?: boolean }

export function ScopeBar({ chips, line, refreshed = 'Data refreshed 22 Aug, 06:15 IST' }: { chips: ScopeChip[]; line: string; refreshed?: string }) {
  return (
    <Card className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {chips.map((c) => (
          <div key={c.label} className="flex min-w-[150px] items-center justify-between gap-3 rounded-md border border-border bg-card px-2.5 py-1.5">
            <div className="leading-tight">
              <div className="text-[11px] text-foreground-secondary">{c.label}</div>
              <div className="text-[13px] font-medium">{c.value}</div>
            </div>
            {c.locked ? <Lock size={13} className="text-foreground-tertiary" /> : <ChevronDown size={14} className="text-foreground-secondary" />}
          </div>
        ))}
        <span className="ml-auto text-[13px] font-medium text-link">Reset</span>
      </div>
      <div className="mt-2.5 flex flex-wrap justify-between gap-2 text-xs text-foreground-secondary">
        <span>{line}</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {refreshed}
        </span>
      </div>
    </Card>
  );
}
