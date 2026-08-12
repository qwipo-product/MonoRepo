import { useState } from 'react';
import { ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { SelectableCard, EmptyState, Button, Input, Sheet } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { GATEWAYS_BY_VENDOR, PAYMENT_VENDORS, type GatewayOption } from '../data/payments';

/* Account · Payments · Pay — enter the amount and pick a gateway. UPI has no
   limit; BNPL (Rupifi / ePay Later) validates against the available limit and a
   gateway minimum. Continue confirms (mock — real app hands off to the PSP). */
export function PaymentGatewaysScreen({
  vendorId,
  amount,
  onBack,
  onDone,
}: {
  vendorId: string;
  amount: number;
  onBack: () => void;
  onDone: () => void;
}) {
  const vendor = PAYMENT_VENDORS.find((v) => v.id === vendorId) ?? PAYMENT_VENDORS[0];
  const gateways = GATEWAYS_BY_VENDOR[vendor.id] ?? [];
  const [amountStr, setAmountStr] = useState(String(amount));
  const [selected, setSelected] = useState<string>(gateways[0]?.id ?? '');
  const [warning, setWarning] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  const gateway = gateways.find((g) => g.id === selected);
  const value = Number(amountStr);

  const pay = () => {
    const msg = validate(value, amount, gateway);
    if (msg) {
      setWarning(msg);
      return;
    }
    setPaid(true);
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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Payment</h1>
      </header>

      {gateways.length === 0 ? (
        <div className="grid flex-1 place-items-center bg-background-subtle">
          <EmptyState
            icon={<AlertCircle className="h-7 w-7 text-foreground-secondary" />}
            title="No Payment Options Found"
            description="You have no payment gateways available at this time."
          />
        </div>
      ) : (
        <>
          <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
            {/* amount */}
            <div className="space-y-2">
              <label htmlFor="pay-amount" className="text-sm font-medium text-foreground">
                Enter the amount
              </label>
              <Input
                id="pay-amount"
                inputMode="numeric"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value.replace(/[^\d]/g, ''))}
                className="text-center text-lg font-semibold"
              />
              <p className="text-xs text-foreground-secondary">
                Outstanding {formatInrExact(amount)} — you can pay any amount up to this.
              </p>
            </div>

            {/* gateway options */}
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">
                Pay using
              </div>
              {gateways.map((g) => (
                <SelectableCard
                  key={g.id}
                  radio
                  selected={selected === g.id}
                  onClick={() => setSelected(g.id)}
                  className="p-3"
                >
                  <div className="pr-7">
                    <div className="text-sm font-semibold text-foreground">{g.title}</div>
                    {g.subtitle && (
                      <div className="mt-0.5 text-xs text-foreground-secondary">{g.subtitle}</div>
                    )}
                    {g.kind === 'bnpl' && (
                      <div className="mt-2 flex gap-4">
                        <Limit label="Available" value={g.availableLimit ?? 0} />
                        <Limit label="Current" value={g.currentLimit ?? 0} />
                      </div>
                    )}
                  </div>
                </SelectableCard>
              ))}
            </div>
          </div>

          <div className="border-t border-border bg-card p-3">
            <Button fullWidth onClick={pay}>
              Continue · {formatInrExact(value || 0)}
            </Button>
          </div>
        </>
      )}

      {/* validation warning */}
      <Sheet
        open={!!warning}
        onClose={() => setWarning(null)}
        title="Check the amount"
        footer={
          <Button fullWidth onClick={() => setWarning(null)}>
            OK
          </Button>
        }
      >
        <p className="text-sm text-foreground-secondary">{warning}</p>
      </Sheet>

      {/* success */}
      <Sheet
        open={paid}
        onClose={onDone}
        title="Payment successful"
        footer={
          <Button fullWidth onClick={onDone}>
            Done
          </Button>
        }
      >
        <div className="flex flex-col items-center py-2 text-center">
          <CheckCircle2 className="h-14 w-14 text-success" />
          <div className="mt-3 text-lg font-bold tabular-nums text-foreground">
            {formatInrExact(value)}
          </div>
          <p className="mt-1 text-sm text-foreground-secondary">
            Paid to {vendor.name} via {gateway?.title}.
          </p>
        </div>
      </Sheet>
    </div>
  );
}

function Limit({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[11px] text-foreground-secondary">{label} limit</div>
      <div className="text-xs font-semibold tabular-nums text-foreground">{formatInrExact(value)}</div>
    </div>
  );
}

/** Mirrors the source validation: numeric, ≤ outstanding, ≥ min, within limit. */
function validate(value: number, outstanding: number, gateway?: GatewayOption): string | null {
  if (!gateway) return 'Please select a payment option.';
  if (!Number.isFinite(value) || value <= 0) return 'Please enter a valid amount.';
  if (value > outstanding) return `Amount cannot exceed the outstanding ${formatInrExact(outstanding)}.`;
  if (gateway.kind === 'bnpl') {
    const avail = gateway.availableLimit ?? 0;
    if (avail === 0) return `Insufficient ${gateway.title} available limit.`;
    if (value > avail) return `Enter an amount within your ${formatInrExact(avail)} available limit.`;
  }
  if (value < gateway.minAmount) return `Please enter a minimum amount of ${formatInrExact(gateway.minAmount)}.`;
  return null;
}
