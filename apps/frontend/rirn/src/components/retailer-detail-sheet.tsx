import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
  ShieldCheck,
  Truck,
  Unlock,
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  StatusBadge,
  toast,
} from '@mockups/web-ui';
import { VERIFICATION_LABEL, type Retailer } from '../lib/retailer-base';
import {
  commitMapping,
  isUnlocked,
  mappedIdsByRetailerId,
  mappingFor,
  spendUnlock,
  useCompanySession,
} from '../lib/company-session';
import { verifyWithDms, type DmsResult } from '../lib/dms';
import { VERIFICATION_TONE } from './retailer-card';

/**
 * The detail panel, and the place the whole thesis either works or doesn't.
 *
 * Three states:
 *
 *   LOCKED    — name, category, locality, verification. Plus an honest list of
 *               what's being withheld and what it costs to see it.
 *   UNLOCKED  — the signals a company cannot get from its own DMS: duplicate
 *               detection, verification provenance, distributor coverage,
 *               fraud flags. Contact detail is almost an afterthought, which
 *               is deliberate — if the unlock only returned an address, the
 *               company would rightly feel taxed rather than served.
 *   MAPPED    — their DMS ID is attached and confirmed.
 *
 * Phone number is never shown, at any state. §15.4 marks it "Controlled" even
 * for companies, and a mockup that leaks it would teach the wrong contract.
 */

interface Props {
  retailer: Retailer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

export function RetailerDetailSheet({ retailer, open, onOpenChange, onChanged }: Props) {
  const session = useCompanySession();
  const [idInput, setIdInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<DmsResult | null>(null);

  // Reset the form whenever a different retailer is opened, so a previous
  // failure doesn't bleed into the next one.
  useEffect(() => {
    setIdInput('');
    setResult(null);
    setVerifying(false);
  }, [retailer?.nrid]);

  if (!retailer) return null;

  const mappedId = mappingFor(retailer.nrid);
  const unlocked = isUnlocked(retailer.nrid);

  const handleUnlock = () => {
    if (!spendUnlock(retailer.nrid)) {
      toast.error('No unlocks left today. Map a retailer to earn more.');
      return;
    }
    onChanged();
  };

  const handleVerify = async () => {
    setVerifying(true);
    setResult(null);
    const res = await verifyWithDms({
      retailerId: idInput,
      nrid: retailer.nrid,
      alreadyMapped: mappedIdsByRetailerId(),
    });
    setVerifying(false);
    setResult(res);
    if (res.outcome === 'confirmed') {
      commitMapping(retailer.nrid, idInput);
      toast.success(`${retailer.businessName} mapped to ${idInput.toUpperCase()}`);
      onChanged();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="pr-6 text-left text-lg">{retailer.businessName}</SheetTitle>
          <SheetDescription className="text-left">
            {retailer.category} · {retailer.locality}, {retailer.city}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={VERIFICATION_TONE[retailer.verification]}>
              <ShieldCheck className="h-3 w-3" />
              {VERIFICATION_LABEL[retailer.verification]}
            </StatusBadge>
            {mappedId && <StatusBadge tone="success">Mapped · {mappedId}</StatusBadge>}
            {retailer.fraudFlag === 'flagged' && (
              <StatusBadge tone="danger">
                <AlertTriangle className="h-3 w-3" />
                Flagged
              </StatusBadge>
            )}
            {retailer.fraudFlag === 'watch' && (
              <StatusBadge tone="warning">
                <AlertTriangle className="h-3 w-3" />
                Under watch
              </StatusBadge>
            )}
          </div>

          {!unlocked ? (
            <LockedBody retailer={retailer} remaining={session.remaining} onUnlock={handleUnlock} />
          ) : (
            <>
              <UnlockedBody retailer={retailer} />
              <MapToDms
                mappedId={mappedId}
                idInput={idInput}
                setIdInput={setIdInput}
                verifying={verifying}
                result={result}
                onVerify={handleVerify}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ *
 * Locked
 * ------------------------------------------------------------------ */

function LockedBody({
  retailer,
  remaining,
  onUnlock,
}: {
  retailer: Retailer;
  remaining: number;
  onUnlock: () => void;
}) {
  return (
    <div className="space-y-4">
      {retailer.duplicateInDms && (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Copy className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800">
            This retailer looks like one already in your DMS. Unlock to see which record, before
            you create a duplicate.
          </p>
        </div>
      )}

      {/* Say plainly what is being withheld. A card that just looks empty
          reads as bad data; a card that says "held back" reads as a rule. */}
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <Lock className="h-4 w-4 text-gray-400" />
          Held back until you map this retailer
        </p>
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          <li>· Verified GSTIN and registered address</li>
          <li>· Which of your DMS records may already be this retailer</li>
          <li>· How many distributors already serve them</li>
          <li>· Exact location on the map</li>
        </ul>
        <p className="mt-3 text-[11px] text-gray-500">
          Contact numbers are never shared through the network.
        </p>
      </div>

      <Button className="w-full" onClick={onUnlock} disabled={remaining <= 0}>
        <Unlock /> Unlock details · costs 1 of {remaining}
      </Button>
      {remaining <= 0 && (
        <p className="text-center text-xs text-red-600">
          You&apos;ve used today&apos;s unlocks. Map a retailer to earn more.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Unlocked — lead with what they can't get elsewhere
 * ------------------------------------------------------------------ */

function UnlockedBody({ retailer }: { retailer: Retailer }) {
  return (
    <div className="space-y-4">
      {retailer.duplicateInDms && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
            <Copy className="h-4 w-4" />
            Already in your DMS
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Matches your record{' '}
            <span className="font-mono font-medium">{retailer.duplicateInDms}</span>. Map that ID
            below rather than creating a new customer.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Signal
          icon={<Truck className="h-4 w-4 text-blue-600" />}
          label="Distributors serving"
          value={String(retailer.distributorCount)}
          note="Names withheld"
        />
        <Signal
          icon={<Building2 className="h-4 w-4 text-purple-600" />}
          label="Monthly purchases"
          value={retailer.orderBand}
          note="Band only"
        />
      </div>

      <div className="space-y-2 rounded-lg border border-gray-200 p-4">
        <Row label="Network ID" value={retailer.nrid} mono />
        <Row label="GSTIN" value={retailer.gstin} mono />
        <Row label="Proprietor" value={retailer.ownerName} />
        <Row label="Address" value={retailer.address} />
        <Row label="Trading since" value={retailer.activeSince} />
      </div>
    </div>
  );
}

function Signal({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-500">{note}</p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-600">{label}</span>
      <span className={`text-right text-xs text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Map to DMS — the contribution half of the exchange
 * ------------------------------------------------------------------ */

function MapToDms({
  mappedId,
  idInput,
  setIdInput,
  verifying,
  result,
  onVerify,
}: {
  mappedId?: string;
  idInput: string;
  setIdInput: (v: string) => void;
  verifying: boolean;
  result: DmsResult | null;
  onVerify: () => void;
}) {
  if (mappedId) {
    return (
      <div className="flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-800">
            Mapped to <span className="font-mono">{mappedId}</span>
          </p>
          <p className="text-xs text-green-800">
            Confirmed against your DMS. Qwipo stores the link, not your customer record.
          </p>
        </div>
      </div>
    );
  }

  const failed = result && result.outcome !== 'confirmed';

  return (
    <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div>
        <p className="text-sm font-medium text-gray-900">Add your retailer ID</p>
        <p className="mt-0.5 text-xs text-gray-600">
          We check it against your DMS before committing anything, and earn you 5 more unlocks.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="retailer-id" className="text-xs">
          Your DMS retailer ID
        </Label>
        <Input
          id="retailer-id"
          value={idInput}
          placeholder="RET-1234"
          onChange={(e) => setIdInput(e.target.value)}
          disabled={verifying}
          aria-invalid={!!failed}
          className="bg-white font-mono"
        />
      </div>

      {verifying && (
        <p className="flex items-center gap-2 text-xs text-gray-600">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking with your DMS…
        </p>
      )}

      {failed && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2.5">
          <p className="text-xs font-medium text-red-800">{result.message}</p>
          {result.boundTo && (
            <p className="mt-1 font-mono text-[11px] text-red-700">Held by {result.boundTo}</p>
          )}
          {result.dmsGstin && (
            <p className="mt-1 text-[11px] text-red-700">
              Your DMS has <span className="font-mono">{result.dmsGstin}</span>. Raise a dispute
              rather than forcing the link.
            </p>
          )}
        </div>
      )}

      <Button className="w-full" onClick={onVerify} disabled={verifying || !idInput.trim()}>
        {verifying ? 'Verifying…' : 'Verify and map'}
      </Button>
    </div>
  );
}
