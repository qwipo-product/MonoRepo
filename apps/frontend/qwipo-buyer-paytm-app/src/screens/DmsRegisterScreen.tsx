import { useState } from 'react';
import { ChevronLeft, Check, Clock, FileCheck2, FileSearch, XCircle, BadgeCheck } from 'lucide-react';
import { Button } from '@mockups/ui';
import { Field, controlClass } from '../components/formbits';
import type { DmsPartner, DmsStatus } from '../data/dmsPartners';

/* DMS registration for one gated company. Two paths:
   – already a customer → enter the customer ID → linked (registered) instantly;
   – new customer → KYC form pre-filled from the Qwipo profile → "Request
     Registration" → pending approval at the company's distributor. */

// Same shop profile shown in Account · Business Details — the pre-fill source.
const KYC_PREFILL = {
  shopName: 'Lit Box',
  ownerName: 'Rajesh Kumar',
  mobile: '9876543210',
  address: 'Rai Durg, Hitech City, Hyderabad',
  gstin: '36ABCDE1234F1Z5',
};

const SHARED_DOCS = ['Shop Image', 'Shop Owner Photo ID', 'GST Certificate'];

type Step = 'choose' | 'form' | 'sent' | 'linked';

export function DmsRegisterScreen({
  partner,
  status,
  onBack,
  onComplete,
}: {
  partner: DmsPartner;
  /** The partner's current registration status — drives the status views. */
  status: DmsStatus;
  onBack: () => void;
  /** Called from the end states — sets the partner's status and returns to the list. */
  onComplete: (status: DmsStatus) => void;
}) {
  const [step, setStep] = useState<Step>('choose');
  const [customerId, setCustomerId] = useState('');
  const [form, setForm] = useState(KYC_PREFILL);
  const set = (k: keyof typeof KYC_PREFILL) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const header = (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
      <button
        onClick={() => (step === 'form' ? setStep('choose') : onBack())}
        aria-label="Back"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold leading-tight">{partner.company}</h1>
        <p className="text-xs text-foreground-secondary">via {partner.distributor}</p>
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted text-xl">
        {partner.emoji}
      </span>
    </header>
  );

  // Already in the pipeline (opened from a Pending / Under review / Rejected /
  // Registered card) — show where the request stands instead of the entry form.
  if (step === 'choose' && status !== 'none') {
    if (status === 'registered') {
      return (
        <div className="flex h-full flex-col">
          {header}
          <div className="grid flex-1 place-items-center bg-background-subtle p-6">
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-success-border bg-success-subtle text-success-foreground">
                <BadgeCheck className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">Registered</h2>
              <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-foreground-secondary">
                Your shop is registered with {partner.company}. Their full catalogue is unlocked
                and products appear in your feed.
              </p>
            </div>
          </div>
          <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <Button size="lg" className="w-full" onClick={onBack}>
              Back to Distributors
            </Button>
          </div>
        </div>
      );
    }

    if (status === 'rejected') {
      return (
        <div className="flex h-full flex-col">
          {header}
          <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
            <div className="rounded-lg border border-error-border bg-error-subtle p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-error-foreground">
                <XCircle className="h-5 w-5 shrink-0" /> Registration rejected
              </div>
              <p className="mt-2 text-xs leading-relaxed text-error-foreground">
                {partner.rejectedReason ??
                  'The distributor could not verify your shop details.'}
              </p>
            </div>
            <p className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-foreground-secondary shadow-sm">
              Update the flagged details and re-apply — or contact {partner.distributor} if you
              believe this was a mistake.
            </p>
          </div>
          <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <Button size="lg" className="w-full" onClick={() => setStep('form')}>
              Re-apply with Updated Details
            </Button>
          </div>
        </div>
      );
    }

    // pending / review — request timeline with the current stage highlighted.
    const stages = [
      {
        icon: Check,
        label: 'Request sent',
        desc: `Your KYC was shared with ${partner.distributor}.`,
        state: 'done' as const,
      },
      {
        icon: FileSearch,
        label: 'Under review',
        desc:
          status === 'review'
            ? `${partner.distributor} is verifying your shop details.`
            : `Waiting for ${partner.distributor} to pick up your request.`,
        state: status === 'review' ? ('current' as const) : ('upcoming' as const),
      },
      {
        icon: BadgeCheck,
        label: 'Approval',
        desc: `${partner.company} confirms your outlet — usually within 24–48 hrs.`,
        state: 'upcoming' as const,
      },
    ];
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
          <div
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium ${
              status === 'review'
                ? 'border-primary/30 bg-primary-soft text-primary-soft-foreground'
                : 'border-warning-border bg-warning-subtle text-warning-foreground'
            }`}
          >
            {status === 'review' ? <FileSearch className="h-5 w-5 shrink-0" /> : <Clock className="h-5 w-5 shrink-0" />}
            {status === 'review' ? 'Registration under review' : 'Registration pending approval'}
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Request status</h2>
            <ol className="mt-4 space-y-5">
              {stages.map((s) => (
                <li key={s.label} className="flex gap-3">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border ${
                      s.state === 'done'
                        ? 'border-success-border bg-success-subtle text-success-foreground'
                        : s.state === 'current'
                          ? 'border-primary/30 bg-primary-soft text-primary-soft-foreground'
                          : 'border-border bg-muted text-foreground-secondary'
                    }`}
                  >
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-medium ${
                        s.state === 'upcoming' ? 'text-foreground-secondary' : 'text-foreground'
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-foreground-secondary">
                      {s.desc}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Button size="lg" className="w-full" onClick={onBack}>
            Back to Distributors
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'sent' || step === 'linked') {
    const linked = step === 'linked';
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="grid flex-1 place-items-center bg-background-subtle p-6">
          <div className="text-center">
            <div
              className={`mx-auto grid h-16 w-16 place-items-center rounded-full border ${
                linked
                  ? 'border-success-border bg-success-subtle text-success-foreground'
                  : 'border-warning-border bg-warning-subtle text-warning-foreground'
              }`}
            >
              {linked ? <Check className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              {linked ? 'Customer ID linked' : 'Request sent'}
            </h2>
            <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-foreground-secondary">
              {linked
                ? `${partner.company}'s catalogue is now unlocked for your shop. New products will appear in your feed.`
                : `Your registration is pending approval at ${partner.distributor}. We'll notify you once ${partner.company} approves — usually within 24–48 hrs.`}
            </p>
          </div>
        </div>
        <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Button size="lg" className="w-full" onClick={() => onComplete(linked ? 'registered' : 'pending')}>
            {linked ? 'Start Ordering' : 'Back to Distributors'}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
          <p className="rounded-lg border border-primary/30 bg-primary-soft p-3 text-xs leading-relaxed text-foreground">
            Pre-filled from your Qwipo KYC — review the details and send your registration request
            to {partner.distributor}.
          </p>

          <Field label="Shop Name" required>
            <input value={form.shopName} onChange={set('shopName')} className={controlClass} />
          </Field>
          <Field label="Owner Name" required>
            <input value={form.ownerName} onChange={set('ownerName')} className={controlClass} />
          </Field>
          <Field label="Mobile Number" required>
            <input value={form.mobile} onChange={set('mobile')} className={controlClass} />
          </Field>
          <Field label="Shop Address" required>
            <input value={form.address} onChange={set('address')} className={controlClass} />
          </Field>
          <Field label="GSTIN Number">
            <input value={form.gstin} onChange={set('gstin')} className={controlClass} />
          </Field>

          <Field label="Documents shared from Qwipo KYC">
            <div className="space-y-2">
              {SHARED_DOCS.map((d) => (
                <div key={d} className={`${controlClass} justify-between`}>
                  <span className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-success-foreground" /> {d}
                  </span>
                  <span className="text-xs font-medium text-success-foreground">Attached</span>
                </div>
              ))}
            </div>
          </Field>
        </div>
        <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Button size="lg" className="w-full" onClick={() => setStep('sent')}>
            Request Registration
          </Button>
        </div>
      </div>
    );
  }

  // step === 'choose'
  return (
    <div className="flex h-full flex-col">
      {header}
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">
            Already a {partner.company} customer?
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">
            Enter the customer ID from your {partner.distributor} bills to link your shop instantly.
          </p>
          <div className="mt-3">
            <Field label="Customer ID">
              <input
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder={partner.idHint}
                className={`${controlClass} placeholder:text-foreground-secondary`}
              />
            </Field>
          </div>
          <Button
            size="lg"
            className="mt-3 w-full"
            disabled={!customerId.trim()}
            onClick={() => setStep('linked')}
          >
            Link Customer ID
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-foreground-secondary">OR</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">New to {partner.company}?</h2>
          <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">
            Send a registration request with your shop's KYC — we pre-fill everything from your
            Qwipo profile. {partner.company} approves new outlets in 24–48 hrs.
          </p>
          <Button variant="secondary" size="lg" className="mt-3 w-full" onClick={() => setStep('form')}>
            Proceed to Registration
          </Button>
        </div>
      </div>
    </div>
  );
}
