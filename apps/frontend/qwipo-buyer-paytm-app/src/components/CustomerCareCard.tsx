import { Headset, Phone } from 'lucide-react';
import { cn } from '@mockups/ui';
import { CUSTOMER_CARE } from '../data/support';

/* Customer care, as a card you can ring from: the number with a dial button
   beside it. A number you ring is a call to make, not a detail to read.

   Shared so Contact Us and Manual Review show the same thing — a retailer
   looking for help should see the same support details across screens. */
export function CustomerCareCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 text-left shadow-sm', className)}>
      <h2 className="text-sm font-semibold text-foreground">Customer Care</h2>
      <div className="mt-2.5 flex items-center gap-3">
        <Headset className="h-5 w-5 shrink-0 text-foreground-secondary" />
        <div className="min-w-0 flex-1 text-sm font-medium text-foreground">{CUSTOMER_CARE}</div>
        <a
          href={`tel:${CUSTOMER_CARE}`}
          aria-label={`Call customer care on ${CUSTOMER_CARE}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground active:scale-[0.98]"
        >
          <Phone className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
