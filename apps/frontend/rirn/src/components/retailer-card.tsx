import { Lock, MapPin, ShieldCheck, Copy } from 'lucide-react';
import { Card, CardContent, StatusBadge, type StatusTone } from '@mockups/web-ui';
import { cn } from '@mockups/web-ui';
import {
  VERIFICATION_LABEL,
  type Retailer,
  type VerificationLevel,
} from '../lib/retailer-base';
import { isUnlocked, mappingFor } from '../lib/company-session';

/** Verification maps onto the shared status tones — one status, one colour. */
export const VERIFICATION_TONE: Record<VerificationLevel, StatusTone> = {
  trusted: 'success',
  multi: 'success',
  company: 'info',
  business: 'info',
  registered: 'neutral',
  unverified: 'warning',
};

interface RetailerCardProps {
  retailer: Retailer;
  selected?: boolean;
  onClick: () => void;
}

/**
 * The rail card — everything a company sees before spending anything.
 *
 * Level 1 only: business name, what kind of shop, roughly where, and how well
 * verified. No address, no GSTIN, no owner, no phone. The lock icon is there
 * so it's obvious that detail exists and is being withheld, rather than the
 * record simply looking thin.
 */
export function RetailerCard({ retailer, selected, onClick }: RetailerCardProps) {
  const mappedId = mappingFor(retailer.nrid);
  const unlocked = isUnlocked(retailer.nrid);

  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer gap-0 py-0 transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-blue-600',
      )}
    >
      <CardContent className="space-y-2.5 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900">{retailer.businessName}</p>
          {mappedId ? (
            <StatusBadge tone="success" size="sm">
              Mapped
            </StatusBadge>
          ) : unlocked ? (
            <StatusBadge tone="warning" size="sm">
              Unlocked
            </StatusBadge>
          ) : (
            <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          )}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-gray-600">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          {retailer.category} · {retailer.locality}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={VERIFICATION_TONE[retailer.verification]} size="sm">
            <ShieldCheck className="h-3 w-3" />
            {VERIFICATION_LABEL[retailer.verification]}
          </StatusBadge>

          {/* The duplicate warning is the one signal worth surfacing before an
              unlock — it's what stops them creating a second DMS record, and
              it's the clearest reason to spend an unlock at all. */}
          {retailer.duplicateInDms && (
            <StatusBadge tone="warning" size="sm">
              <Copy className="h-3 w-3" />
              Possible duplicate
            </StatusBadge>
          )}
        </div>

        {mappedId && (
          <p className="font-mono text-[11px] text-gray-500">{mappedId}</p>
        )}
      </CardContent>
    </Card>
  );
}
