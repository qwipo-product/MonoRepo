import { Link2 } from 'lucide-react';
import { Link } from 'react-router';
import {
  Button,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  EmptyState,
  PageTitle,
  StatusBadge,
} from '@mockups/web-ui';
import { RETAILERS_BY_NRID, VERIFICATION_LABEL } from '../lib/retailer-base';
import {
  UNLOCKS_EARNED_PER_MAPPING,
  allMappings,
  useCompanySession,
} from '../lib/company-session';
import { VERIFICATION_TONE } from '../components/retailer-card';

/**
 * What this company has contributed, and what it bought them.
 *
 * Worth its own screen because the mapping list *is* the company's side of
 * the bargain — it's the thing they can point at when asked what the network
 * cost them, and the thing that keeps their allowance topped up.
 */
export function MappingsPage() {
  const session = useCompanySession();
  const rows = allMappings();

  return (
    <div className="space-y-6 p-6">
      <div>
        <PageTitle size="lg">My mappings</PageTitle>
        <p className="mt-1 text-sm text-gray-600">
          Retailer IDs you&apos;ve linked, each confirmed against your DMS before it was
          committed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Retailers mapped" value={String(session.mappedCount)} />
        <Tile
          label="Unlocks earned"
          value={`+${session.unlocksEarned}`}
          note={`${UNLOCKS_EARNED_PER_MAPPING} per mapping`}
        />
        <Tile
          label="Unlocks remaining"
          value={`${session.remaining} / ${session.allowance}`}
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white">
          <EmptyState
            icon={Link2}
            title="No mappings yet"
            description="Find a retailer in your area and attach your DMS ID. Each confirmed mapping earns you more unlocks."
            action={
              <Button asChild>
                <Link to="/">Discover retailers</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeader>Business</DataTableHeader>
                <DataTableHeader>Locality</DataTableHeader>
                <DataTableHeader>Network ID</DataTableHeader>
                <DataTableHeader>Your DMS ID</DataTableHeader>
                <DataTableHeader>Verification</DataTableHeader>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {rows.map((m) => {
                const r = RETAILERS_BY_NRID.get(m.nrid);
                if (!r) return null;
                return (
                  <DataTableRow key={m.nrid}>
                    <DataTableCell>{r.businessName}</DataTableCell>
                    <DataTableCell>{r.locality}</DataTableCell>
                    <DataTableCell>
                      <span className="font-mono text-xs">{m.nrid}</span>
                    </DataTableCell>
                    <DataTableCell>
                      <span className="font-mono text-xs">{m.retailerId}</span>
                    </DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone={VERIFICATION_TONE[r.verification]} size="sm">
                        {VERIFICATION_LABEL[r.verification]}
                      </StatusBadge>
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {note && <p className="text-xs text-gray-500">{note}</p>}
    </div>
  );
}
