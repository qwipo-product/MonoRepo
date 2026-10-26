import { useState } from 'react';
import { ChevronLeft, Check, Clock, FileSearch, XCircle, BadgeCheck, Lock } from 'lucide-react';
import { Button } from '@mockups/ui';
import {
  REGISTERED_MOBILE,
  describeLink,
  dmsShortName,
  formatMobile,
  type DmsCompany,
  type DmsLinkRequest,
  type DmsStatus,
} from '../data/dmsPartners';

/* Registration with one company, and where it stands afterwards.

   A new shop registering with a company whose DMS is wired into Qwipo (TCPL)
   opens on the form: the read-only KYC summary and a consent tick, then
   Request Registration. Its existing customers never see this screen — their
   catalogue is already open — and its form lists no documents because the
   company reads them from Qwipo.

   A company that takes existing customers only (HUL) never opens on this
   screen: its Register pop-up sits over the Register to Order list. It comes
   here once a request is in, for the status pages, which then say what was
   sent — the customer ID or the mobile number. */

// Same shop profile shown in Account · Business Details — the pre-fill source.
const KYC_ROWS: [string, string][] = [
  ['Shop Name', 'Lit Box'],
  ['Owner Name', 'Rajesh Kumar'],
  ['Mobile Number', formatMobile(REGISTERED_MOBILE)],
  ['Shop Address', 'Rai Durg, Hitech City, Hyderabad'],
  ['GSTIN', '36ABCDE1234F1Z5'],
];

// 'status' is where the request stands; Re-apply on a rejected one leaves it
// for the form.
type Step = 'status' | 'form' | 'sent';

export function DmsRegisterScreen({
  company,
  status,
  link,
  onBack,
  onComplete,
  onRelink,
}: {
  company: DmsCompany;
  /** The company's current registration status — drives the status views. */
  status: DmsStatus;
  /** What the shop last sent a `linksExisting` company, if anything. */
  link?: DmsLinkRequest;
  onBack: () => void;
  /** Called from the end states — sets the company's status and returns to the list. */
  onComplete: (status: DmsStatus) => void;
  /** Reopens the company's Register pop-up (a rejected `linksExisting` request). */
  onRelink: () => void;
}) {
  const [step, setStep] = useState<Step>(status === 'none' ? 'form' : 'status');
  const [consent, setConsent] = useState(false);
  const name = dmsShortName(company);

  const header = (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
      <button
        onClick={onBack}
        aria-label="Back"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold leading-tight">{name}</h1>
        <p className="truncate text-xs text-foreground-secondary">{company.company}</p>
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted text-xl">
        {company.emoji}
      </span>
    </header>
  );

  // Already in the pipeline (opened from a Pending / In review / Rejected /
  // Registered card) — show where the request stands instead of the form.
  if (step === 'status' && status !== 'none') {
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
                Your shop is registered with {name}. Their full catalogue is unlocked
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
                {company.linksExisting && link
                  ? `${name} could not find your shop with the ${describeLink(link)}.`
                  : `${name} could not verify your shop details.`}
              </p>
            </div>
            <p className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-foreground-secondary shadow-sm">
              {company.linksExisting
                ? `Check the details and try again — you can use your ${name} customer ID or your mobile number.`
                : `Update the flagged details and re-apply — or contact ${name} if you believe this was a mistake.`}
            </p>
          </div>
          <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {company.linksExisting ? (
              <Button size="lg" className="w-full" onClick={onRelink}>
                Try Again
              </Button>
            ) : (
              <Button size="lg" className="w-full" onClick={() => setStep('form')}>
                Re-apply with Updated Details
              </Button>
            )}
          </div>
        </div>
      );
    }

    // pending / review — request timeline with the current stage highlighted.
    const stages = [
      {
        icon: Check,
        label: 'Request sent',
        desc:
          company.linksExisting && link
            ? `Your ${describeLink(link)} was shared with ${name}.`
            : `Your KYC was shared with ${name}.`,
        state: 'done' as const,
      },
      {
        icon: FileSearch,
        label: 'Under review',
        desc:
          status === 'review'
            ? `${name} is verifying your shop details.`
            : `Waiting for ${name} to pick up your request.`,
        state: status === 'review' ? ('current' as const) : ('upcoming' as const),
      },
      {
        icon: BadgeCheck,
        label: 'Approval',
        desc: `${name} confirms your outlet — usually within 24–48 hrs.`,
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

  if (step === 'sent') {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="grid flex-1 place-items-center bg-background-subtle p-6">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-warning-border bg-warning-subtle text-warning-foreground">
              <Clock className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Request sent</h2>
            <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-foreground-secondary">
              Your registration is pending approval at {name}. We'll notify you once {name}{' '}
              approves — usually within 24–48 hrs.
            </p>
          </div>
        </div>
        <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Button size="lg" className="w-full" onClick={() => onComplete('pending')}>
            Back to Distributors
          </Button>
        </div>
      </div>
    );
  }

  // step === 'form'
  return (
    <div className="flex h-full flex-col">
      {header}
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        <p className="rounded-lg border border-primary/30 bg-primary-soft p-3 text-xs leading-relaxed text-foreground">
          These details come from your Qwipo KYC. Review them and send your registration request
          to {name}.
        </p>

        {/* Read-only summary — values come from Qwipo KYC and can't be edited here. */}
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted px-4 py-2.5">
            <span className="text-sm font-semibold text-foreground">Shop details</span>
            <span className="flex items-center gap-1 text-xs text-foreground-secondary">
              <Lock className="h-3.5 w-3.5" /> From Qwipo KYC
            </span>
          </div>
          <dl className="divide-y divide-border px-4">
            {KYC_ROWS.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-xs text-foreground-secondary">{label}</dt>
                <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="text-xs leading-relaxed text-foreground-secondary">
          Need to change something? Update it in My Account · Business Details first.
        </p>

        {/* `relative` is load-bearing: it keeps the hidden (sr-only) checkbox
            inside this card. Without it the checkbox was placed against the
            phone frame, far down a long form, and focusing it on a tap
            scrolled the whole frame out of view — a blank screen. */}
        <label className="relative flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="peer sr-only"
          />
          {/* Drawn box (not the native control) so the ticked state also shows in screenshots. */}
          <span
            aria-hidden
            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
              consent ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'
            }`}
          >
            {consent && <Check className="h-3.5 w-3.5" />}
          </span>
          <span className="text-xs leading-relaxed text-foreground">
            I allow Qwipo to share my details with {name} so they can create my account.
          </span>
        </label>
      </div>
      <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {!consent && (
          <p className="mb-2 text-center text-xs leading-relaxed text-foreground-secondary">
            Tick the consent box to send your request
          </p>
        )}
        <Button size="lg" className="w-full" disabled={!consent} onClick={() => setStep('sent')}>
          Request Registration
        </Button>
      </div>
    </div>
  );
}
