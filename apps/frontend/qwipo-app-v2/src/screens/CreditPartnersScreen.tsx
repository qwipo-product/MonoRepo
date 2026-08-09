import { ChevronLeft, Users } from 'lucide-react';
import { EmptyState } from '@mockups/ui';

/* Account · Credit Partners — none linked yet (empty state). */
export function CreditPartnersScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Credit Partners</h1>
      </header>

      <div className="grid flex-1 place-items-center">
        <EmptyState
          icon={<Users className="h-7 w-7 text-foreground-secondary" />}
          title="No Credit Partners Found"
          description="You don't have any credit partners available at this time."
        />
      </div>
    </div>
  );
}
