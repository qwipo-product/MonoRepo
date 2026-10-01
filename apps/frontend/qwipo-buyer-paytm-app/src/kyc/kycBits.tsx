import type { ReactNode } from 'react';
import { AlertTriangle, Check, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Button, Sheet, cn } from '@mockups/ui';
import { MAX_ATTEMPTS } from './kycData';

/* Small pieces every KYC screen shares, so "Accepted", "Needs Correction" and
   "Attempt 2 of 5" look identical wherever they appear. */

/** Sticky bottom bar holding the screen's main CTA(s). */
export function KycFooter({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 space-y-3 border-t border-border bg-background px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-bar-top)]">
      {children}
    </div>
  );
}

/** Round ✓ / ✕ mark — the one symbol a buyer needs to read an example. */
export function Mark({ ok, size = 'md' }: { ok: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';
  const icon = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const Icon = ok ? Check : X;
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full text-white ring-2 ring-card',
        ok ? 'bg-success' : 'bg-error',
        box
      )}
    >
      <Icon className={icon} strokeWidth={3} />
    </span>
  );
}

/** "✓ Accepted" / "✕ Not Accepted" section label. */
export function Verdict({ ok, children }: { ok: boolean; children?: ReactNode }) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold',
        ok
          ? 'border-success-border bg-success-subtle text-success-foreground'
          : 'border-error-border bg-error-subtle text-error-foreground'
      )}
    >
      {ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}
      {children ?? (ok ? 'Accepted' : 'Not Accepted')}
    </div>
  );
}

/** "Attempt 2 of 5" with one dot per attempt — used dots are filled. */
export function AttemptPill({ attempt, className }: { attempt: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-warning-border bg-card px-2.5 py-1 text-xs font-semibold text-warning-foreground',
        className
      )}
    >
      <span className="flex gap-1">
        {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
          <span key={i} className={cn('h-2 w-2 rounded-full', i < attempt ? 'bg-warning' : 'bg-muted')} />
        ))}
      </span>
      Attempt {attempt} of {MAX_ATTEMPTS}
    </span>
  );
}

/** The AI's "not accepted" message. Full width, large type, the rejected
    photo big on top — never squeezed beside a thumbnail. Two plain rows:
    what went wrong, and what to do now. */
export function AiAlert({
  title,
  why,
  fix,
  steps,
  attempt,
  art,
  action,
}: {
  title: string;
  why: string;
  fix?: string;
  /** Numbered how-to-fix steps. */
  steps?: string[];
  attempt?: number;
  /** What the buyer sent, shown large with a ✕. */
  art?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div role="alert" className="overflow-hidden rounded-lg border-2 border-error-border bg-card shadow-sm">
      <div className="flex items-center gap-3 bg-error-subtle px-4 py-3">
        <Mark ok={false} />
        <h2 className="min-w-0 flex-1 text-lg font-bold leading-tight text-error-foreground">{title}</h2>
      </div>
      {art && (
        <div className="relative border-b border-border">
          {art}
          <span className="absolute right-2 top-2">
            <Mark ok={false} size="lg" />
          </span>
        </div>
      )}
      <div className="space-y-3 px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-error-subtle text-error">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground-secondary">Problem</div>
            <p className="text-base font-semibold leading-snug text-foreground">{why}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-success-subtle text-success">
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground-secondary">How to fix</div>
            {fix && <p className="text-base leading-snug text-foreground">{fix}</p>}
            {steps && steps.length > 0 && (
              <ol className="mt-2 space-y-2">
                {steps.map((s, i) => (
                  <li key={s} className="flex items-start gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-base leading-snug text-foreground">{s}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
        {attempt ? <AttemptPill attempt={attempt} /> : null}
        {action}
      </div>
    </div>
  );
}

/* ---- Edit / Delete / Update -------------------------------------------- */

type ActionKind = 'edit' | 'delete' | 'update' | 'add';
const ACTION = {
  edit: { label: 'Edit', icon: Pencil, cls: 'border-border bg-card text-foreground' },
  update: { label: 'Update', icon: RefreshCw, cls: 'border-primary bg-primary-soft text-primary' },
  delete: { label: 'Delete', icon: Trash2, cls: 'border-error-border bg-card text-error-foreground' },
  add: { label: 'Add', icon: Plus, cls: 'border-primary bg-primary text-primary-foreground' },
} as const;

/** A big labelled action button — icon + word, never an icon alone. */
export function ActionButton({
  kind,
  label,
  onClick,
  className,
}: {
  kind: ActionKind;
  label?: string;
  onClick: () => void;
  className?: string;
}) {
  const a = ACTION[kind];
  const Icon = a.icon;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border px-3 text-sm font-bold active:scale-[0.98]',
        a.cls,
        className
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2.5} />
      {label ?? a.label}
    </button>
  );
}

/** "Delete this photo?" — one confirm so nothing vanishes by mistake. */
export function DeleteConfirm({
  open,
  what,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  /** "photo", "location", "document" */
  what: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={open} onClose={onCancel} showHandle>
      <div className="flex flex-col items-center px-2 pb-2 pt-2 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-error-subtle text-error">
          <Trash2 className="h-8 w-8" />
        </span>
        <h2 className="mt-3 text-xl font-bold">Delete this {what}?</h2>
        <p className="mt-1 text-base text-foreground-secondary">You will need to add it again.</p>
        <div className="mt-5 grid w-full grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" onClick={onCancel}>
            No, Keep
          </Button>
          <Button variant="destructive" size="lg" onClick={onConfirm}>
            Yes, Delete
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

