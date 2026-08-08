import { Check } from 'lucide-react';
import { Button } from '@mockups/ui';
import ScreenFooter from '../components/ScreenFooter';

export default function KycSuccessScreen({
  onCallSupport,
  onPlaceOrder,
}: {
  onCallSupport: () => void;
  onPlaceOrder: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-600">
          <Check className="h-11 w-11 text-white" strokeWidth={2.6} />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Congratulations! 🎉</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your KYC is confirmed
          <br />
          You are all set and you're now eligible to place orders seamlessly on our app
          <br />
          Start shopping now!
        </p>
      </div>

      <ScreenFooter>
        <div className="space-y-3">
          <Button variant="outline" size="lg" className="w-full" onClick={onCallSupport}>
            Call Customer Support
          </Button>
          <Button size="lg" className="w-full" onClick={onPlaceOrder}>
            Place Order
          </Button>
        </div>
      </ScreenFooter>
    </div>
  );
}
