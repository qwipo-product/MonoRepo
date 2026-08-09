import { Button } from '@mockups/ui';

/* Order Confirmation — success state after Place Order. Concentric success
   badge (light ring + filled circle + white check), confirmation copy, a subtle
   order reference, and the next actions. */
export function OrderConfirmationScreen({
  orderId = 'QW-4827',
  onBackToHome,
}: {
  orderId?: string;
  onBackToHome: () => void;
}) {
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

        <h1 className="mt-6 text-2xl font-bold text-foreground">Order Confirmation</h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Your order has been placed successfully!
        </p>
        <div className="mt-4 rounded-full bg-background-subtle px-3 py-1 text-xs font-medium text-foreground-secondary">
          Order ID · #{orderId}
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
