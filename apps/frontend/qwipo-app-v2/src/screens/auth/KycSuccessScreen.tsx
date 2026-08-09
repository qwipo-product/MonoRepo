import { Check } from 'lucide-react';
import { Button } from '@mockups/ui';

export function KycSuccessScreen({ onPlaceOrder }: { onPlaceOrder: () => void }) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-success text-white">
          <Check size={40} strokeWidth={3} />
        </div>
        <div className="mt-5 text-2xl font-bold text-foreground">Congratulations! 🎉</div>
        <div className="mt-2 text-sm leading-relaxed text-foreground-secondary">
          Your KYC is confirmed
          <br />
          You are all set and you&apos;re now eligible to place orders seamlessly on our app
          <br />
          Start shopping now!
        </div>
      </div>

      <div className="space-y-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button variant="secondary" className="w-full">
          Call Customer Support
        </Button>
        <Button className="w-full" onClick={onPlaceOrder}>
          Place Order
        </Button>
      </div>
    </div>
  );
}
