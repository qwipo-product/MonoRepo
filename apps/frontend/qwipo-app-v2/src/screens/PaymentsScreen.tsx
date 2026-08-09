import { ChevronLeft, CreditCard } from 'lucide-react';
import { EmptyState } from '@mockups/ui';

/* Account · Payments — no gateways configured yet (empty state). */
export function PaymentsScreen({ onBack }: { onBack: () => void }) {
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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Payments</h1>
      </header>

      <div className="grid flex-1 place-items-center">
        <EmptyState
          icon={<CreditCard className="h-7 w-7 text-foreground-secondary" />}
          title="No Payments Found"
          description="You have no payment gateways available at this time."
        />
      </div>
    </div>
  );
}
