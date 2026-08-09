import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

/* Account · Business Details — the shop's KYC profile as read-only labelled
   fields (matches the mock). */

const BUSINESS = {
  shopName: 'Lit Box',
  ownerName: 'Rajesh Kumar',
  mobile: '9876543210',
  address: 'Rai Durg, Hitech City, Hyderabad',
  gstin: '36ABCDE1234F1Z5',
};

export function BusinessDetailsScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Business Details</h1>
      </header>

      <dl className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-4">
        <DetailField label="Shop Name" required value={BUSINESS.shopName} />
        <DetailField label="Owner Name" value={BUSINESS.ownerName} />
        <DetailField label="Mobile Number" required value={BUSINESS.mobile} />
        <DetailField label="Address" required value={BUSINESS.address} />
        <DetailField label="GSTIN Number (optional)" value={BUSINESS.gstin} />
      </dl>
    </div>
  );
}

function DetailField({
  label,
  value,
  required,
}: {
  label: string;
  value: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <dt className="text-xs text-foreground-secondary">
        {label}
        {required && <span className="text-error"> *</span>}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
