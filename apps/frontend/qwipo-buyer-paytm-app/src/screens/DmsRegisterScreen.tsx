import { useState } from 'react';
import { ChevronLeft, Check, Clock, FileCheck2, FileSearch, XCircle, BadgeCheck, Lock } from 'lucide-react';
import { Button } from '@mockups/ui';
import { Field, controlClass } from '../components/formbits';
import { NO_DETAILS, detailsMissing, type DmsStatus } from '../data/dmsPartners';
import { DmsDetailsForm } from './DmsDetailsForm';

/** The company the shop is registering with. */
export interface DmsTarget {
  /** Company name used in sentences — the one approving the registration. */
  name: string;
  /** Header sub-line — the company's full name. */
  via: string;
  emoji: string;
  /** Who receives the KYC — the company itself. */
  distributor: string;
  idHint?: string;
  dmsIntegrated?: boolean;
  collectsDetails?: boolean;
  rejectedReason?: string;
}

/* DMS registration with one company. Two paths:
   – already a customer → enter the customer ID → sent for approval;
   – new customer → read-only KYC summary + consent → "Request Registration".
   Both end pending approval and follow the same status tracking.

   A company whose DMS is wired into Qwipo (TCPL) offers only the second. Its
   existing customers never see this screen — their catalogue is already open
   when they arrive — so asking them for a customer ID would be asking a
   question that has no one to answer it, and its form lists no documents
   because the company reads them from Qwipo rather than being sent them.

   A company that needs details Qwipo doesn't hold (HUL) also opens straight
   on the form. Its pre-filled box lists the profile field by field, and the
   details it needs on top — email, WhatsApp OTP, shop photos, a business
   document — are collected below it (DmsDetailsForm). Request Registration
   waits for all of them as well as the consent. */

// Same shop profile shown in Account · Business Details — the pre-fill source.
// The field-by-field part (category, pincode, coordinates) matches the shop's
// saved address, Shop 14, Lit Box Complex.
const KYC_PREFILL = {
  shopName: 'Lit Box',
  ownerName: 'Rajesh Kumar',
  mobile: '9876543210',
  address: 'Rai Durg, Hitech City, Hyderabad',
  gstin: '36ABCDE1234F1Z5',
  category: 'Grocer',
  street: 'Shop 14, Lit Box Complex, Rai Durg, Hitech City',
  pincode: '500032',
  city: 'Hyderabad',
  state: 'Telangana',
  lat: '17.4296',
  lng: '78.3827',
};

const KYC_ROWS: [string, string][] = [
  ['Shop Name', KYC_PREFILL.shopName],
  ['Owner Name', KYC_PREFILL.ownerName],
  ['Mobile Number', `+91 ${KYC_PREFILL.mobile}`],
  ['Shop Address', KYC_PREFILL.address],
  ['GSTIN', KYC_PREFILL.gstin],
];

// What a company collecting its own details gets pre-filled, in the order of
// its field list (HUL's).
const KYC_ROWS_FULL: [string, string][] = [
  ['Owner Name', KYC_PREFILL.ownerName],
  ['Mobile Number', `+91 ${KYC_PREFILL.mobile}`],
  ['Shop Name', KYC_PREFILL.shopName],
  ['Shop Category', KYC_PREFILL.category],
  ['Pincode', KYC_PREFILL.pincode],
  ['Address', KYC_PREFILL.street],
  ['City', KYC_PREFILL.city],
  ['State', KYC_PREFILL.state],
  ['Store Latitude', KYC_PREFILL.lat],
  ['Store Longitude', KYC_PREFILL.lng],
];

const SHARED_DOCS =['Shop Image', 'Shop Owner Photo ID', 'GST Certificate'];

type Step = 'choose' | 'form' | 'sent' | 'linked';

export function DmsRegisterScreen({
  target,
  status,
  onBack,
  onComplete,
}: {
  target: DmsTarget;
  /** The target's current registration status — drives the status views. */
  status: DmsStatus;
  onBack: () => void;
  /** Called from the end states — sets the target's status and returns to the list. */
  onComplete: (status: DmsStatus) => void;
}) {
  /* Where the screen opens. A company whose DMS is wired into Qwipo has one
     path, so the choose step would be a single card asking the buyer to agree
     to the only thing on offer — it goes straight to the form instead. */
  const firstStep: Step = target.dmsIntegrated || target.collectsDetails ? 'form' : 'choose';
  const [step, setStep] = useState<Step>(firstStep);
  const [customerId, setCustomerId] = useState('');
  const [consent, setConsent] = useState(false);
  const [details, setDetails] = useState(NO_DETAILS);
  const missing = target.collectsDetails ? detailsMissing(details) : [];
  const jumpTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const header = (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
      <button
        onClick={() => (step === 'form' && firstStep !== 'form' ? setStep('choose') : onBack())}
        aria-label="Back"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold leading-tight">{target.name}</h1>
        <p className="truncate text-xs text-foreground-secondary">{target.via}</p>
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted text-xl">
        {target.emoji}
      </span>
    </header>
  );

  // Already in the pipeline (opened from a Pending / Under review / Rejected /
  // Registered card) — show where the request stands instead of the entry
  // screen, whichever entry screen this company opens on.
  if (step === firstStep && status !== 'none') {
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
                Your shop is registered with {target.name}. Their full catalogue is unlocked
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
                {target.rejectedReason ??
                  'The distributor could not verify your shop details.'}
              </p>
            </div>
            <p className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-foreground-secondary shadow-sm">
              Update the flagged details and re-apply — or contact {target.distributor} if you
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
        desc: target.collectsDetails
          ? `Your KYC, shop photos and document were shared with ${target.distributor}.`
          : `Your KYC was shared with ${target.distributor}.`,
        state: 'done' as const,
      },
      {
        icon: FileSearch,
        label: 'Under review',
        desc:
          status === 'review'
            ? `${target.distributor} is verifying your shop details.`
            : `Waiting for ${target.distributor} to pick up your request.`,
        state: status === 'review' ? ('current' as const) : ('upcoming' as const),
      },
      {
        icon: BadgeCheck,
        label: 'Approval',
        desc: `${target.name} confirms your outlet — usually within 24–48 hrs.`,
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

  // Both paths end pending approval — a linked customer ID is verified too.
  if (step === 'sent' || step === 'linked') {
    const linked = step === 'linked';
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
              {linked
                ? `Your customer ID ${customerId.trim()} has been sent to ${target.distributor} for approval. We'll notify you once ${target.name} confirms — usually within 24–48 hrs.`
                : `Your registration is pending approval at ${target.distributor}. We'll notify you once ${target.name} approves — usually within 24–48 hrs.`}
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

  if (step === 'form') {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
          <p className="rounded-lg border border-primary/30 bg-primary-soft p-3 text-xs leading-relaxed text-foreground">
            {target.collectsDetails
              ? `Most of this comes from your Qwipo KYC. ${target.name} needs a few more details — add them below and send your registration request.`
              : `These details come from your Qwipo KYC. Review them and send your registration request to ${target.distributor}.`}
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
              {(target.collectsDetails ? KYC_ROWS_FULL : KYC_ROWS).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2.5">
                  <dt className="shrink-0 text-xs text-foreground-secondary">{label}</dt>
                  <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
            {/* A company collecting details takes its documents in the form below. */}
            {!target.dmsIntegrated && !target.collectsDetails && (
              <div className="border-t border-border px-4 py-3">
                <div className="text-xs text-foreground-secondary">Documents shared</div>
                <ul className="mt-2 space-y-1.5">
                  {SHARED_DOCS.map((d) => (
                    <li key={d} className="flex items-center justify-between text-sm text-foreground">
                      <span className="flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4 text-success-foreground" /> {d}
                      </span>
                      <span className="text-xs font-medium text-success-foreground">Attached</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <p className="text-xs leading-relaxed text-foreground-secondary">
            Need to change something? Update it in My Account · Business Details first.
          </p>

          {target.collectsDetails && (
            <DmsDetailsForm
              company={target.name}
              mobile={`+91 ${KYC_PREFILL.mobile}`}
              value={details}
              onChange={setDetails}
            />
          )}

          <label
            id="dms-consent"
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-sm"
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="sr-only"
            />
            {/* Drawn box (not the native control) so the ticked state also shows in screenshots. */}
            <span
              aria-hidden
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${
                consent ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'
              }`}
            >
              {consent && <Check className="h-3.5 w-3.5" />}
            </span>
            <span className="text-xs leading-relaxed text-foreground">
              {target.distributor === target.name
                ? `I allow Qwipo to share my details with ${target.name} so they can create my account.`
                : `I allow Qwipo to share my details with ${target.distributor} so they can create my account with ${target.name}.`}
            </span>
          </label>
        </div>
        <div className="border-t border-border px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {/* Whenever the button is off, say exactly why — each missing field is
              a link that scrolls to it. A count alone ("1 more detail") left a
              buyer with a grey button and nothing to go on, and once every
              field was in, an unticked consent box said nothing at all. */}
          {(missing.length > 0 || !consent) && (
            <p className="mb-2 text-center text-xs leading-relaxed text-foreground-secondary">
              {missing.length > 0 ? (
                <>
                  Still needed:{' '}
                  {missing.map((m, i) => (
                    <span key={m.id}>
                      {i > 0 && ', '}
                      <button
                        type="button"
                        onClick={() => jumpTo(m.id)}
                        className="font-medium text-primary underline underline-offset-2"
                      >
                        {m.label}
                      </button>
                    </span>
                  ))}
                  {!consent && ', and the consent tick'}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => jumpTo('dms-consent')}
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Tick the consent box to send your request
                </button>
              )}
            </p>
          )}
          <Button size="lg" className="w-full" disabled={!consent || missing.length > 0} onClick={() => setStep('sent')}>
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
        {!target.dmsIntegrated && (
          <>
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">
                Already a customer of {target.name}?
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">
                Enter the customer ID from your {target.distributor} bills to link your shop.
              </p>
              <div className="mt-3">
                <Field label="Customer ID">
                  <input
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    placeholder={target.idHint}
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
          </>
        )}

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">New to {target.name}?</h2>
          <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">
            Send a registration request with your shop's KYC — we pre-fill everything from your
            Qwipo profile. {target.name} approves new outlets in 24–48 hrs.
          </p>
          <Button variant="secondary" size="lg" className="mt-3 w-full" onClick={() => setStep('form')}>
            Proceed to Registration
          </Button>
        </div>
      </div>
    </div>
  );
}
