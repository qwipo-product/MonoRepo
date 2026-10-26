import { useState } from 'react';
import { Clock, Lock, XCircle } from 'lucide-react';
import { Button, Input, Sheet, cardVariants, cn } from '@mockups/ui';
import { Field } from '../components/formbits';
import {
  REGISTERED_MOBILE,
  describeLink,
  dmsShortName,
  formatMobile,
  type DmsCompany,
  type DmsLinkRequest,
} from '../data/dmsPartners';

const OPTIONS: { by: DmsLinkRequest['by']; label: string; hint: (name: string) => string }[] = [
  { by: 'customerId', label: 'Customer ID', hint: (name) => `Printed on your ${name} bill` },
  { by: 'mobile', label: 'Mobile number', hint: (name) => `Registered with ${name}` },
];

/* Register with <company> — the pop-up a `linksExisting` company (HUL) opens
   from Register to Order. The shop already buys from the company, so instead
   of a form it says how the company knows it: a customer ID (free text) or
   its mobile number. Phase 1 pre-fills the mobile number registered on Qwipo
   and does not let it be changed; typing a different number, verified, is
   phase 2.

   Continue sends the request — `onSend` puts the company at Pending behind
   the sheet — and the sheet turns into the Request sent confirmation.

   Opened from a Failed card (story 21545) it is the Rejected by distributor
   pop-up: the message quotes what was sent last, and Retry sends again with no
   limit. Retry is by customer ID only — the Mobile number option is greyed
   out, since the shop's Qwipo number can't be changed in phase 1 — so it opens
   on Customer ID, holding the ID that failed. No reason is shown — the company
   sends none in phase 1. */
export function DmsLinkSheet({
  company,
  initial,
  rejected = false,
  onSend,
  onClose,
}: {
  company: DmsCompany;
  /** The last request, to correct and resend. */
  initial?: DmsLinkRequest;
  /** The company rejected `initial`: open as the Rejected pop-up with Retry. */
  rejected?: boolean;
  onSend: (request: DmsLinkRequest) => void;
  onClose: () => void;
}) {
  const name = dmsShortName(company);
  const failed = rejected && initial ? initial : null;
  const [by, setBy] = useState<DmsLinkRequest['by']>(failed ? 'customerId' : (initial?.by ?? 'customerId'));
  const [customerId, setCustomerId] = useState(initial?.by === 'customerId' ? initial.value : '');
  const [sent, setSent] = useState<DmsLinkRequest | null>(null);

  const request: DmsLinkRequest | null =
    by === 'mobile'
      ? { by, value: REGISTERED_MOBILE }
      : customerId.trim()
        ? { by, value: customerId.trim() }
        : null;

  if (sent) {
    return (
      <Sheet
        open
        onClose={onClose}
        title={`Register with ${name}`}
        subtitle={company.company}
        icon={<span className="text-lg">{company.emoji}</span>}
        footer={
          <Button size="lg" fullWidth onClick={onClose}>
            OK
          </Button>
        }
      >
        <div className="py-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-warning-border bg-warning-subtle text-warning-foreground">
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Request sent</h2>
          <p className="mx-auto mt-2 max-w-[280px] text-sm leading-relaxed text-foreground-secondary">
            Your {describeLink(sent)} has been shared with {name}. We'll notify you once {name}{' '}
            confirms your shop — usually within 24–48 hrs.
          </p>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={failed ? 'Rejected by distributor' : `Register with ${name}`}
      subtitle={company.company}
      icon={
        failed ? <XCircle className="h-5 w-5" /> : <span className="text-lg">{company.emoji}</span>
      }
      iconClassName={failed ? 'bg-error-subtle text-error-foreground' : undefined}
      footer={
        <Button
          size="lg"
          fullWidth
          disabled={!request}
          onClick={() => {
            if (!request) return;
            onSend(request);
            setSent(request);
          }}
        >
          {failed ? 'Retry' : 'Continue'}
        </Button>
      }
    >
      {failed ? (
        <div className="flex gap-2.5 rounded-lg border border-error-border bg-error-subtle p-3">
          <XCircle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-error-foreground" />
          <p className="text-sm leading-relaxed text-error-foreground">
            Your onboarding request with the distributor has been rejected. Please review the
            entered {failed.by === 'customerId' ? 'customer ID' : 'mobile number'} ‘
            {failed.by === 'customerId' ? failed.value : formatMobile(failed.value)}’ and re-submit
            the correct customer ID to proceed with purchasing products from this seller.
          </p>
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-foreground-secondary">
          This brand requires registration before you can place orders from {name}. You can enter
          your {name} Customer ID or the mobile number registered with {name}.
        </p>
      )}

      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium text-foreground">Register using</legend>
        <div className="grid grid-cols-2 gap-2">
          {OPTIONS.map((o) => {
            const selected = by === o.by;
            // Retry is by customer ID only.
            const off = !!failed && o.by === 'mobile';
            return (
              // `relative` keeps the sr-only radio inside this label, so
              // focusing it never scrolls the sheet (see DmsRegisterScreen).
              <label
                key={o.by}
                className={cn(
                  'relative flex items-start gap-2 p-3',
                  off
                    ? cn(cardVariants({ variant: 'flat' }), 'cursor-not-allowed bg-input opacity-60')
                    : cn(cardVariants({ variant: selected ? 'highlighted' : 'interactive' }), 'cursor-pointer')
                )}
              >
                <input
                  type="radio"
                  name="dms-link-by"
                  value={o.by}
                  checked={selected}
                  disabled={off}
                  onChange={() => setBy(o.by)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
                    selected ? 'border-primary' : 'border-border'
                  )}
                >
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-sm font-semibold',
                      off ? 'text-foreground-secondary' : 'text-foreground'
                    )}
                  >
                    {o.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-foreground-secondary">
                    {off ? 'Not available on retry' : o.hint(name)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4">
        {by === 'customerId' ? (
          <Field label={`${name} Customer ID`} required>
            <Input
              id="dms-link-customer-id"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder={company.idHint}
              autoComplete="off"
              aria-label={`${name} Customer ID`}
              aria-describedby="dms-link-help"
            />
          </Field>
        ) : (
          <Field label="Mobile number">
            <div className="relative">
              <Input
                id="dms-link-mobile"
                value={formatMobile(REGISTERED_MOBILE)}
                readOnly
                aria-label="Mobile number"
                aria-describedby="dms-link-help"
                className="pr-10"
              />
              <Lock
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-secondary"
              />
            </div>
          </Field>
        )}
        <p id="dms-link-help" className="mt-1.5 text-xs leading-relaxed text-foreground-secondary">
          {by === 'customerId'
            ? `Enter the ID exactly as it appears on your ${name} invoice.`
            : `Your mobile number on Qwipo. ${name} will use it to find your shop.`}
        </p>
      </div>
    </Sheet>
  );
}
