// Sheet — the one bottom-sheet shell. Replaces the five hand-rolled sheet
// forks (AddToCart, CartValidation, Discounts, Filters, ProductImage) that each
// re-declared a backdrop + panel + header + close button with drifting max-h
// and a missing drag handle.
//
// Renders `absolute inset-0`, so it fills the nearest positioned ancestor —
// the phone frame in these mockups. Give the frame `position: relative`.
//
//   <Sheet open={open} onClose={close} title="Add to cart" subtitle="Pick a pack"
//          icon={<CartIcon/>} footer={<Button fullWidth>Continue</Button>}>
//     …body…
//   </Sheet>

import * as React from 'react';
import { cn } from './cn';

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Small icon chip shown left of the title. */
  icon?: React.ReactNode;
  /** Override the icon chip tint (default `bg-primary-soft`); e.g. a semantic
   *  warning/error badge on an alerts sheet. */
  iconClassName?: string;
  /** Sticky footer (e.g. a primary Button). Safe-area inset is handled here. */
  footer?: React.ReactNode;
  /** 'auto' grows to content up to 90%; 'tall' pins to 90%. */
  size?: 'auto' | 'tall';
  showHandle?: boolean;
  className?: string;
  /* Override the body's own padding. The default suits a form; a sheet whose
     content is one big picture wants it tighter so the picture can be wider. */
  bodyClassName?: string;
  /* Same for the title row, for the same reason: the picture sheet wants the
     heading to take less height so more of the sheet is the picture. */
  headerClassName?: string;
  children?: React.ReactNode;
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconClassName,
  footer,
  size = 'auto',
  showHandle = true,
  className,
  bodyClassName,
  headerClassName,
  children,
}: SheetProps) {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex items-end bg-overlay animate-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          'flex w-full flex-col rounded-t-xl bg-card text-foreground shadow-xl animate-sheet',
          size === 'tall' ? 'h-[90%]' : 'max-h-[90%]',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {showHandle && <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-muted" />}

        {(title || icon) && (
          <div className={cn('flex items-center gap-3 border-b border-border p-4', headerClassName)}>
            {icon && (
              <div
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-soft-foreground',
                  iconClassName
                )}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && <div className="truncate text-base font-semibold leading-tight">{title}</div>}
              {subtitle && <div className="truncate text-xs text-foreground-secondary">{subtitle}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-foreground-secondary hover:bg-muted"
            >
              <XIcon />
            </button>
          </div>
        )}

        <div className={cn('no-scrollbar min-h-0 flex-1 overflow-y-auto p-4', bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
