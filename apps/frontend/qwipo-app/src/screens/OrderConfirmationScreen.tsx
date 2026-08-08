import { Check } from 'lucide-react';
import { Button } from '@mockups/ui';

/* Order Confirmation — success badge + Back to Home. */
export default function OrderConfirmationScreen({ onBackToHome }: any) {
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-emerald-600">
          <Check className="h-14 w-14 text-white" strokeWidth={2.6} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Order Confirmation</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your order has been placed successfully!</p>
      </div>
      <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button size="lg" className="w-full" onClick={onBackToHome}>Back to Home</Button>
      </div>
    </div>
  );
}
