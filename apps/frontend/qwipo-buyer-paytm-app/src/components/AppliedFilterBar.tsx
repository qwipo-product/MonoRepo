import { X } from 'lucide-react';
import { APPLIED_LABEL, type AppliedFilter } from '../data/filters';

/* AppliedFilterBar — the removable chip row a product list shows when it was
   opened from a category / brand / distributor selection. Each chip clears its
   own filter; clearing all restores the full list. */
export function AppliedFilterBar({
  applied,
  onRemove,
}: {
  applied: AppliedFilter[];
  onRemove: (index: number) => void;
}) {
  if (applied.length === 0) return null;
  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-border bg-card px-4 py-2">
      <span className="shrink-0 text-xs text-foreground-secondary">Filtered by</span>
      {applied.map((a, i) => (
        <button
          key={`${a.type}-${a.value}`}
          onClick={() => onRemove(i)}
          aria-label={`Remove ${APPLIED_LABEL[a.type]} filter ${a.value}`}
          className="flex shrink-0 items-center gap-1 rounded-full border border-primary bg-primary-soft py-1 pl-2.5 pr-2 text-xs font-medium text-primary active:scale-[0.98]"
        >
          <span className="text-primary/70">{APPLIED_LABEL[a.type]}:</span>
          <span>{a.value}</span>
          <X className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
