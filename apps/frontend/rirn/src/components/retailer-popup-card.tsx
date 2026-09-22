import { Lock, MapPin, Phone, Receipt, ShieldCheck, Unlock } from 'lucide-react';
import { Button, StatusBadge } from '@mockups/web-ui';
import { VERIFICATION_LABEL, type Retailer } from '../lib/retailer-base';
import { isUnlocked, mappingFor } from '../lib/company-session';
import { VERIFICATION_TONE } from './retailer-card';

/**
 * The card that pops out of a map pin.
 *
 * Business name is the ONLY identifying value shown before an unlock.
 * Everything else is listed by field name with the value obscured — the point
 * being that a company can see exactly what the network holds and what it
 * would get, without getting any of it for free. A card that simply omitted
 * those rows would read as missing data; showing the labels makes the
 * withholding deliberate and legible.
 *
 * IMPORTANT: the blurred rows render a DECOY string, never the real value.
 * A CSS blur is a visual effect, not a security boundary — blurring the true
 * address would still ship it in the DOM for anyone who opened devtools, which
 * would quietly undo the whole privacy model this mockup exists to argue for.
 */

const DECOY = {
  address: '8-2/145, Road No 12, Hyderabad',
  phone: '+91 98765 43210',
  gstin: '36AABC1234D1ZX',
};

function MaskedRow({
  icon,
  label,
  decoy,
}: {
  icon: React.ReactNode;
  label: string;
  decoy: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        {icon}
        {label}
      </span>
      <span className="relative">
        <span
          aria-hidden
          className="select-none text-xs text-gray-700 blur-[4.5px]"
        >
          {decoy}
        </span>
        <span className="sr-only">Hidden until you map this retailer</span>
      </span>
    </div>
  );
}

function RealRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="flex flex-shrink-0 items-center gap-1.5 text-xs text-gray-500">
        {icon}
        {label}
      </span>
      <span className="text-right text-xs text-gray-900">{value}</span>
    </div>
  );
}

interface Props {
  retailer: Retailer;
  onOpenDetail: () => void;
}

export function RetailerPopupCard({ retailer, onOpenDetail }: Props) {
  const mappedId = mappingFor(retailer.nrid);
  const unlocked = isUnlocked(retailer.nrid);

  return (
    <div className="w-[300px] overflow-hidden bg-white">
      {/* Header strip — the one thing always visible is who they are. */}
      <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-4 pb-3 pt-3.5">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight text-gray-900">
            {retailer.businessName}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {retailer.category} · {retailer.locality}
          </p>
        </div>
        {mappedId ? (
          <StatusBadge tone="success" size="sm">
            Mapped
          </StatusBadge>
        ) : unlocked ? (
          <StatusBadge tone="warning" size="sm">
            Unlocked
          </StatusBadge>
        ) : (
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
            <Lock className="h-3.5 w-3.5 text-gray-500" />
          </span>
        )}
      </div>

      <div className="space-y-0.5 px-4 py-3">
        <div className="pb-1.5">
          <StatusBadge tone={VERIFICATION_TONE[retailer.verification]} size="sm">
            <ShieldCheck className="h-3 w-3" />
            {VERIFICATION_LABEL[retailer.verification]}
          </StatusBadge>
        </div>

        {unlocked ? (
          <>
            <RealRow
              icon={<MapPin className="h-3 w-3" />}
              label="Address"
              value={retailer.address}
            />
            <RealRow
              icon={<Receipt className="h-3 w-3" />}
              label="GSTIN"
              value={retailer.gstin}
            />
            {/* Never revealed, at any state — §15.4 marks phone "Controlled"
                even for the company that maps the retailer. */}
            <div className="flex items-center justify-between gap-3 py-1">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                Contact number
              </span>
              <span className="text-xs italic text-gray-400">Not shared</span>
            </div>
          </>
        ) : (
          <>
            <MaskedRow
              icon={<MapPin className="h-3 w-3" />}
              label="Address"
              decoy={DECOY.address}
            />
            <MaskedRow
              icon={<Receipt className="h-3 w-3" />}
              label="GSTIN"
              decoy={DECOY.gstin}
            />
            <MaskedRow
              icon={<Phone className="h-3 w-3" />}
              label="Contact number"
              decoy={DECOY.phone}
            />
          </>
        )}
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <Button size="sm" className="w-full" onClick={onOpenDetail}>
          {mappedId ? (
            'View details'
          ) : unlocked ? (
            'Add my retailer ID'
          ) : (
            <>
              <Unlock /> Unlock details
            </>
          )}
        </Button>
        {!unlocked && (
          <p className="mt-2 text-center text-[11px] text-gray-500">
            Costs 1 unlock · mapping earns 5 back
          </p>
        )}
      </div>
    </div>
  );
}
