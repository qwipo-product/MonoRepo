import { ChevronLeft, AlertCircle } from 'lucide-react';
import { EmptyState } from '@mockups/ui';

/** The retained empty-state counterpart for payment. */
export function PaymentGatewaysScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Payment</h1>
      </header>
      <div className="grid flex-1 place-items-center bg-background-subtle">
        <EmptyState
          icon={<AlertCircle strokeWidth={1.75} />}
          title="No payment options available"
          description="This seller hasn’t enabled online payment yet. Pay on delivery instead."
        />
      </div>
    </div>
  );
}
