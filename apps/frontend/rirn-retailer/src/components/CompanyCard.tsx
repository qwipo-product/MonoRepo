import { Check, ChevronRight, Clock, Plus } from 'lucide-react';
import { Badge, buttonVariants, cn } from '@mockups/ui';
import type { Company } from '../lib/companies';
import type { Connection } from '../lib/retailer-session';

/**
 * One company in the retailer's list, in one of three states.
 *
 * The states are deliberately different *shapes*, not just different badge
 * colours — a shop owner glancing at this on a phone should be able to tell
 * "I've given this one my ID" from across the counter, without reading.
 *
 *   connected  tinted surface, coloured edge, the ID shown large
 *   pending    same shape, amber, with a waiting note
 *   new        plain white card with an Add button and nothing else
 */

interface Props {
  company: Company;
  connection?: Connection;
  onPress: () => void;
}

export function CompanyCard({ company, connection, onPress }: Props) {
  const connected = connection?.status === 'verified';
  const pending = connection?.status === 'pending';

  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
        // The coloured left edge is the at-a-glance cue.
        connected && 'border-success-border bg-success-subtle/50 border-l-4 border-l-success',
        pending && 'border-warning-border bg-warning-subtle/40 border-l-4 border-l-warning',
        !connection && 'border-border bg-card active:bg-muted',
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold',
          company.tint,
        )}
      >
        {company.initials}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate type-label text-foreground">{company.name}</span>

        {connection ? (
          <span className="mt-0.5 flex items-center gap-1.5">
            <span className="type-caption text-foreground-secondary">Your ID</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {connection.retailerId}
            </span>
          </span>
        ) : (
          <span className="mt-0.5 block truncate type-caption text-foreground-secondary">
            {company.brands}
          </span>
        )}

        {connected && (
          <span className="mt-1.5 inline-flex">
            <Badge variant="success">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          </span>
        )}
        {pending && (
          <span className="mt-1.5 inline-flex">
            <Badge variant="warning">
              <Clock className="mr-1 h-3 w-3" />
              Awaiting confirmation
            </Badge>
          </span>
        )}
      </span>

      {connection ? (
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-foreground-tertiary" />
      ) : (
        <span className={cn(buttonVariants({ size: 'sm', variant: 'secondary' }), 'flex-shrink-0')}>
          <Plus className="mr-1 h-4 w-4" />
          Add ID
        </span>
      )}
    </button>
  );
}
