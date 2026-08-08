import type { ReactNode } from 'react';
import { X } from 'lucide-react';

/* Bottom sheet — the mobile-first overlay (DESIGN-SYSTEM.md §6.7: pickers and
   >2-field forms use a bottom sheet, never a centered dialog). Dismisses on
   backdrop tap or the close button.
   ponytail: no swipe-to-dismiss; backdrop/X cover it. Add drag if a screen needs it. */
export default function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-end bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[78%] w-full flex-col rounded-t-xl bg-card text-card-foreground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-muted" />
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-6">{children}</div>
      </div>
    </div>
  );
}
