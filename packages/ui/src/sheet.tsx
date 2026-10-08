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
  /* Hide the ✕. For a sheet there is no way out of — a required update — a
     close button that does nothing is worse than none at all. */
  showClose?: boolean;
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
  showClose = true,
  className,
  bodyClassName,
  headerClassName,
  children,
}: SheetProps) {
  /* Drag the grab area down to dismiss. The handle used to be a picture of an
     affordance — it looked draggable and wasn't. A sheet with no handle is one
     there is no way out of (a required update), so it does not drag either. */
  const [dragY, setDragY] = React.useState(0);
  const dragFrom = React.useRef<number | null>(null);
  const DISMISS_AT = 96;

  const onDragStart = (e: React.PointerEvent) => {
    // A press on a control is that control's, not the start of a drag.
    if (!showHandle || (e.target as HTMLElement).closest('button')) return;
    dragFrom.current = e.clientY;
    /* Capture, or the drag ends the moment the pointer leaves the grab area —
       which is a few pixels down, long before the sheet has been pulled far
       enough to mean anything. */
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (dragFrom.current === null) return;
    setDragY(Math.max(0, e.clientY - dragFrom.current));
  };
  const onDragEnd = () => {
    if (dragFrom.current === null) return;
    const far = dragY > DISMISS_AT;
    dragFrom.current = null;
    setDragY(0);
    if (far) onClose();
  };

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
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
      >
        {/* The grab area: handle plus header, so a sheet can be pulled down
            from either. The handle's row is always this tall — otherwise a
            sheet without one (a required update) sat its heading higher than
            every other sheet. */}
        <div
          className={cn('shrink-0 pt-2', showHandle && 'cursor-grab touch-none active:cursor-grabbing')}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className={cn('mx-auto h-1 w-9 rounded-full bg-muted', !showHandle && 'invisible')} />

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
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-foreground-secondary hover:bg-muted"
              >
                <XIcon />
              </button>
            )}
          </div>
        )}
        </div>

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
