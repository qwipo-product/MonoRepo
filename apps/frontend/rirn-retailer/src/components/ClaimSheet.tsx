import { useEffect, useState } from 'react';
import { Check, Clock, Loader2, ShieldCheck } from 'lucide-react';
import { Badge, Button, FieldError, InlineMessage, Input, Sheet } from '@mockups/ui';
import type { Company } from '../lib/companies';
import { submitClaim, type ClaimResult } from '../lib/dms';
import {
  claimedIds,
  connectionFor,
  saveConnection,
  useRetailerSession,
} from '../lib/retailer-session';

/**
 * "Tell us your customer ID at this company."
 *
 * One field, because that's the entire ask. The important copy is underneath
 * it: the retailer needs to know we're checking with the company rather than
 * just believing them, and that a pending result is normal rather than a
 * failure.
 */

interface Props {
  company: Company | null;
  open: boolean;
  onClose: () => void;
}

export function ClaimSheet({ company, open, onClose }: Props) {
  useRetailerSession();
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);

  useEffect(() => {
    setId('');
    setResult(null);
    setBusy(false);
  }, [company?.id]);

  if (!company) return null;

  const existing = connectionFor(company.id);

  const handleSubmit = async () => {
    setBusy(true);
    setResult(null);
    const res = await submitClaim({
      retailerId: id,
      companyName: company.name,
      claimed: claimedIds(),
    });
    setBusy(false);
    setResult(res);
    if (res.outcome === 'verified' || res.outcome === 'pending') {
      saveConnection({
        companyId: company.id,
        retailerId: id.trim().toUpperCase(),
        status: res.outcome,
        proof: res.outcome === 'verified' ? 'gstin' : 'approval',
      });
    }
  };

  const failed =
    result &&
    result.outcome !== 'verified' &&
    result.outcome !== 'pending';
  const done = result?.outcome === 'verified' || result?.outcome === 'pending';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={existing ? company.name : `Add your ID at ${company.name}`}
      subtitle={existing ? 'Your connection' : company.brands}
      icon={<span className="text-sm font-bold">{company.initials}</span>}
      iconClassName={company.tint}
      footer={
        done ? (
          <Button fullWidth size="lg" onClick={onClose}>
            Done
          </Button>
        ) : existing ? (
          <Button fullWidth size="lg" variant="secondary" onClick={onClose}>
            Close
          </Button>
        ) : (
          <Button fullWidth size="lg" onClick={handleSubmit} disabled={busy || !id.trim()}>
            {busy ? 'Checking…' : 'Submit'}
          </Button>
        )
      }
    >
      <div className="space-y-4 px-4 pb-2">
        {existing && !result ? (
          <ExistingConnection
            retailerId={existing.retailerId}
            status={existing.status}
            proof={existing.proof}
            companyName={company.name}
          />
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="claim-id" className="type-label block text-foreground">
                Your customer ID at {company.name}
              </label>
              <Input
                id="claim-id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="RET-1234"
                disabled={busy || done}
                className="h-12 font-mono text-base"
                inputMode="text"
                autoCapitalize="characters"
              />
              <p className="type-caption text-foreground-secondary">
                It&apos;s printed on your invoice, or your distributor can tell you.
              </p>
              {failed && <FieldError>{result.message}</FieldError>}
            </div>

            {busy && (
              <p className="flex items-center gap-2 type-caption text-foreground-secondary">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking with {company.name}…
              </p>
            )}

            {result?.outcome === 'verified' && (
              <InlineMessage variant="success" title="Connected">
                {result.message}
              </InlineMessage>
            )}
            {result?.outcome === 'pending' && (
              <InlineMessage variant="warning" title="Waiting for confirmation">
                {result.message}
              </InlineMessage>
            )}

            {!result && !busy && (
              // Why this isn't taken on trust. Without it, a rejected or
              // pending claim looks arbitrary.
              <InlineMessage variant="info" title="We check before connecting">
                We confirm this ID with {company.name}. If it matches your GSTIN you&apos;re
                connected straight away, otherwise they confirm it themselves.
              </InlineMessage>
            )}
          </>
        )}
      </div>
    </Sheet>
  );
}

function ExistingConnection({
  retailerId,
  status,
  proof,
  companyName,
}: {
  retailerId: string;
  status: 'verified' | 'pending';
  proof: 'gstin' | 'approval';
  companyName: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background-subtle p-4 text-center">
        <p className="type-caption text-foreground-secondary">Your customer ID</p>
        <p className="mt-1 font-mono text-2xl font-bold text-foreground">{retailerId}</p>
        <div className="mt-2 flex justify-center">
          {status === 'verified' ? (
            <Badge variant="success">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="warning">
              <Clock className="mr-1 h-3 w-3" />
              Awaiting confirmation
            </Badge>
          )}
        </div>
      </div>

      <InlineMessage
        variant={status === 'verified' ? 'success' : 'warning'}
        title={proof === 'gstin' ? 'Matched on your GSTIN' : `Sent to ${companyName}`}
      >
        {proof === 'gstin'
          ? 'Your GST number matched their records, so this was confirmed automatically.'
          : 'Someone at the company is confirming this. You can keep ordering meanwhile.'}
      </InlineMessage>

      <p className="flex items-start gap-2 type-caption text-foreground-secondary">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
        Qwipo stores only the link between your shop and this ID — never your prices, orders
        or credit.
      </p>
    </div>
  );
}
