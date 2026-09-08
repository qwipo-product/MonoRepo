import { Bell, Clock, FileCheck2, Search, ShoppingBag } from 'lucide-react';
import { Button } from '@mockups/ui';

/* KYC Submitted — shown right after the customer submits KYC. Deliberately NOT
   an approval screen (Paytm review feedback): KYC still goes through a 24–48 h
   review, and ordering unlocks only after approval. So: no green "confirmed"
   check, no Place Order CTA — an under-review status with what happens next,
   and Explore Products as the primary action. */
export function KycSuccessScreen({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="no-scrollbar flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center">
        {/* submitted badge — primary (not success green) so it doesn't read as approved */}
        <div className="grid h-20 w-20 place-items-center rounded-full bg-primary-soft text-primary">
          <FileCheck2 size={36} strokeWidth={2.2} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-foreground">KYC Submitted Successfully! 🎉</h1>

        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-warning-border bg-warning-subtle px-3 py-1 text-xs font-semibold text-warning-foreground">
          <Clock className="h-3.5 w-3.5" />
          Under review · 24–48 hours
        </span>

        <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
          Thanks for submitting your KYC details. Our team is reviewing them now — this usually
          takes 24 to 48 hours.
        </p>

        {/* what happens next */}
        <div className="mt-6 w-full space-y-3 rounded-lg border border-border bg-card p-4 text-left shadow-sm">
          <NextStep icon={<ShoppingBag className="h-4 w-4" />}>
            You&apos;ll be able to place orders once your KYC is approved
          </NextStep>
          <NextStep icon={<Search className="h-4 w-4" />}>
            Meanwhile, feel free to explore, search and view products
          </NextStep>
          <NextStep icon={<Bell className="h-4 w-4" />}>
            We&apos;ll notify you as soon as your KYC is approved
          </NextStep>
        </div>

        <p className="mt-4 text-xs text-foreground-secondary">
          We&apos;re working to activate your profile as soon as possible.
        </p>
      </div>

      <div className="space-y-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button variant="secondary" className="w-full">
          Call Customer Support
        </Button>
        <Button className="w-full" onClick={onExplore}>
          Explore Products
        </Button>
      </div>
    </div>
  );
}

function NextStep({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        {icon}
      </span>
      <span className="pt-1 text-sm leading-snug text-foreground">{children}</span>
    </div>
  );
}
