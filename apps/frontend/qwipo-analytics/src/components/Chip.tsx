// The one chip shape every filter surface uses — the ScopeBar, and the
// per-run filter record in report History. Read-only when no handlers given.
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@mockups/ui';

export function Chip({
  label, value, active, tone, onClick, onRemove, noCaret,
}: {
  label?: string; value: string; active?: boolean; tone?: 'drill';
  onClick?: () => void; onRemove?: () => void;
  /** multi-select toggle chips: no dropdown caret */
  noCaret?: boolean;
}) {
  return (
    <span
      className={cn(
        'type-caption flex items-center gap-1.5 rounded-full py-1.5 pl-3',
        onRemove ? 'pr-1.5' : 'pr-3',
        tone === 'drill'
          ? 'border border-info-border bg-info-subtle font-medium text-info-foreground'
          : active
            ? 'bg-primary-soft font-medium text-primary-soft-foreground'
            : 'bg-background-sunken text-foreground',
        onClick && !active && tone !== 'drill' && 'cursor-pointer hover:bg-muted',
        onClick && 'cursor-pointer',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {label && <span className={cn(!active && tone !== 'drill' && 'text-foreground-secondary')}>{label} ·</span>}
      {value}
      {onClick && !onRemove && !noCaret && <ChevronDown size={12} className={cn(tone !== 'drill' && !active && 'text-foreground-tertiary')} />}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${value}`}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="grid h-4 w-4 place-items-center rounded-full hover:bg-primary/15"
        >
          <X size={11} />
        </button>
      )}
    </span>
  );
}
