import { Banknote } from 'lucide-react';
import { Button } from '@mockups/ui';

/* Order Confirmation — success state after Place Order. Concentric success
   badge (light ring + filled circle + white check), confirmation copy, and the
   next actions. */
export function OrderConfirmationScreen({ onBackToHome }: { onBackToHome: () => void }) {
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* success badge */}
        <div className="grid h-28 w-28 place-items-center rounded-full bg-success/15">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-success text-white">
            <svg
              viewBox="0 0 24 24"
              width="52"
              height="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-foreground">Order Confirmed</h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Thanks for placing your order — it has been confirmed!
        </p>

        {/* COD reminder */}
        <div className="mt-6 w-full rounded-lg border border-border bg-card p-4 text-left shadow-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <Banknote className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="text-xs text-foreground-secondary">Payment mode</div>
              <div className="text-sm font-semibold text-foreground">Cash on Delivery (COD)</div>
            </div>
          </div>
          <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-foreground-secondary">
            Please keep the payment ready and hand it over to the seller at the time of delivery.
          </p>
        </div>
      </div>

      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button size="lg" fullWidth onClick={onBackToHome}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
