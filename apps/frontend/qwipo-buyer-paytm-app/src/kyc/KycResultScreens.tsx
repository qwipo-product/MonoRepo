import { useState, type ReactNode } from 'react';
import { Bell, Clock, Search, ShieldCheck, ShoppingBag } from 'lucide-react';
import { Button } from '@mockups/ui';
import { KycFooter, Mark } from './kycBits';
import { CustomerCareCard } from '../components/CustomerCareCard';
import { TermsAgree } from '../components/TermsAgree';
import { CRITERIA, MAX_ATTEMPTS } from './kycData';

/* The two KYC outcome screens: KYC Active (AI accepted all three) and
   Manual Review Required (a field was rejected MAX_ATTEMPTS times). */

/* ---- KYC Active --------------------------------------------------------- */

export function KycActiveScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <div className="no-scrollbar flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-success-subtle text-success">
          <ShieldCheck size={40} strokeWidth={2.2} />
        </div>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-subtle px-3 py-1 text-xs font-bold text-success-foreground">
          <Mark ok size="sm" /> KYC Active
        </span>
        <h1 className="mt-3 text-2xl font-bold">Your shop is verified! 🎉</h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
          All 3 details are accepted. You can now place orders.
        </p>

        <div className="mt-6 w-full space-y-2 text-left">
          {CRITERIA.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
              <Mark ok size="sm" />
              <span className="flex-1 text-sm font-medium">{c.title}</span>
              <span className="text-xs font-semibold text-success-foreground">Accepted</span>
            </div>
          ))}
        </div>
      </div>
      <KycFooter>
        <Button size="lg" className="w-full" onClick={onContinue}>
          Continue Using Application
        </Button>
      </KycFooter>
    </div>
  );
}

/* ---- Manual review (after 5 attempts) ---------------------------------- */

export function KycManualReviewScreen({
  onContinue,
  remaining = 0,
  onFinishKyc,
}: {
  onContinue: () => void;
  /** Mandatory fields still to add — they must be added before the app. */
  remaining?: number;
  onFinishKyc?: () => void;
}) {
  // The buyer agrees to the terms here too, before going into the app.
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* justify-center, the same as KYC Active: an outcome screen centres its
          content rather than stacking it at the top over empty space. */}
      <div className="no-scrollbar flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-warning-subtle text-warning">
          <Clock size={38} strokeWidth={2.2} />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Manual Review Required</h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
          Your KYC could not be verified automatically after {MAX_ATTEMPTS} attempts. We have sent your KYC for manual review.
        </p>

        <div className="mt-5 flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-foreground">KYC Status</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-border bg-warning-subtle px-3 py-1 text-xs font-bold text-warning-foreground">
            <Clock className="h-3.5 w-3.5" /> Pending
          </span>
        </div>

        <div className="mt-4 w-full space-y-3 rounded-lg border border-border bg-card p-4 text-left shadow-sm">
          <NextStep icon={<Search className="h-4 w-4" />}>Our team will check your details by hand</NextStep>
          <NextStep icon={<ShoppingBag className="h-4 w-4" />}>
            You can continue using the application while we check
          </NextStep>
          <NextStep icon={<Bell className="h-4 w-4" />}>We will notify you as soon as your KYC is approved</NextStep>
        </div>

        {/* Support sits with the content, not in the footer: it is something
            to reach for while reading this screen, not the action that leaves
            it. Same card the account's Contact Us shows. */}
        <CustomerCareCard className="mt-4 w-full" />
      </div>
      <KycFooter>
        {remaining > 0 && onFinishKyc ? (
          <>
            <p className="text-center text-sm text-foreground-secondary">
              {remaining} more required {remaining === 1 ? 'item' : 'items'} to add
            </p>
            <Button size="lg" className="w-full" onClick={onFinishKyc}>
              Complete Remaining Details
            </Button>
          </>
        ) : (
          <>
            <TermsAgree agreed={agreed} onChange={setAgreed} />
            <Button size="lg" className="w-full" disabled={!agreed} onClick={onContinue}>
              Continue to Application
            </Button>
          </>
        )}
      </KycFooter>
    </div>
  );
}

function NextStep({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">{icon}</span>
      <span className="pt-1 text-sm leading-snug text-foreground">{children}</span>
    </div>
  );
}
