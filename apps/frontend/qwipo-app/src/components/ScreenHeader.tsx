import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

/* Pushed-screen top bar: back chevron + title + optional right action. */
export default function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex h-14 flex-shrink-0 items-center gap-1 px-2">
      {onBack && (
        <button onClick={onBack} aria-label="Back" className="grid h-11 w-11 place-items-center">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      <h1 className="flex-1 truncate px-1 text-base font-semibold">{title}</h1>
      {right}
    </div>
  );
}
