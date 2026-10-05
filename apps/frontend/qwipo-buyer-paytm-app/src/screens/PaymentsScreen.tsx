import { useState } from 'react';
import { ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { EmptyState, Sheet, Button } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { PAYMENT_VENDORS, GATEWAY_LABEL, type PaymentVendor } from '../data/payments';
import { useEmptyable } from '../review/demoState';

/* Account · Payments — vendors with an outstanding balance. Tap a vendor to
   see its orders + transactions; vendors with no gateway show a warning. */
export function PaymentsScreen({
  onBack,
  onOpenVendor,
}: {
  onBack: () => void;
  onOpenVendor: (vendorId: string) => void;
}) {
  const [noGateway, setNoGateway] = useState<PaymentVendor | null>(null);
  const vendors = useEmptyable(PAYMENT_VENDORS);

  const open = (v: PaymentVendor) => {
    if (v.gateways.length === 0) {
      setNoGateway(v);
      return;
    }
    onOpenVendor(v.id);
  };

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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Payments</h1>
      </header>

      {vendors.length === 0 ? (
        <div className="grid flex-1 place-items-center bg-background-subtle">
          <EmptyState
            icon={<CreditCard strokeWidth={1.75} />}
            title="No payments due"
            description="Outstanding payments to your sellers will appear here."
          />
        </div>
      ) : (
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
          {vendors.map((v) => (
            <button
              key={v.id}
              onClick={() => open(v)}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-sm active:scale-[0.99]"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft text-lg font-bold text-primary">
                {v.logo}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{v.name}</span>
                <span className="mt-0.5 block text-xs text-foreground-secondary">
                  Outstanding{' '}
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatInrExact(v.outstandingAmount)}
                  </span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {v.gateways.length ? (
                    v.gateways.map((g) => (
                      <span
                        key={g}
                        className="rounded-md bg-muted px-2 py-0.5 text-2xs font-medium text-foreground-secondary"
                      >
                        {GATEWAY_LABEL[g]}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-medium text-warning-foreground">
                      No gateways configured
                    </span>
                  )}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 self-center text-foreground-secondary" />
            </button>
          ))}
        </div>
      )}

      <Sheet
        open={!!noGateway}
        onClose={() => setNoGateway(null)}
        title="No gateways found"
        subtitle={noGateway?.name}
        footer={
          <Button fullWidth onClick={() => setNoGateway(null)}>
            OK
          </Button>
        }
      >
        <p className="text-sm text-foreground-secondary">
          No payment gateways are configured for this vendor yet. Please try another vendor.
        </p>
      </Sheet>
    </div>
  );
}
