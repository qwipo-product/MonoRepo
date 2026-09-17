// Entity-grain drill-through drawer (outlets, brands, distributors): a list of
// entities behind an attention item or funnel stage — same surface language as
// the orders RecordsDrawer, different record type.
import { X } from 'lucide-react';
import { Button, cn } from '@mockups/ui';
import type { EntityRow } from '../data/entityRows';
import type { Page } from '../nav';

export function EntityDrawer({
  title, total, rows, onClose, go,
}: {
  title: string; total: string; rows: EntityRow[]; onClose: () => void; go: (p: Page) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-overlay animate-overlay" onClick={onClose} role="presentation">
      <aside
        className="animate-slide-in-right fixed right-0 top-0 flex h-dvh w-[560px] flex-col border-l border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex-1 leading-tight">
            <span className="type-h3 block">{title}</span>
            <span className="type-caption block text-foreground-secondary">{total} · current scope and period</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-foreground-secondary hover:bg-muted">
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {rows.map((r) => (
            <div key={r.name} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border-subtle py-2.5">
              <span>
                <span className="type-label block">{r.name}</span>
                <span className="type-caption block text-foreground-secondary">{r.sub}</span>
                <span className={cn('type-caption block', r.tone === 'error' ? 'text-error-foreground' : r.tone === 'warning' ? 'text-warning-foreground' : 'text-foreground-secondary')}>{r.mid}</span>
              </span>
              <span className="text-right">
                <span className="type-price-sm block">{r.right}</span>
                {r.rightSub && <span className={cn('type-caption block', r.tone === 'error' ? 'text-error-foreground' : 'text-foreground-secondary')}>{r.rightSub}</span>}
              </span>
            </div>
          ))}
        </div>

        <footer className="flex items-center gap-2 border-t border-border p-4">
          <span className="type-caption flex-1 text-foreground-secondary">Showing {rows.length} of {total.split(' ')[0]}</span>
          <Button size="sm" onClick={() => go('reports')}>Full list in Reports</Button>
        </footer>
      </aside>
    </div>
  );
}
