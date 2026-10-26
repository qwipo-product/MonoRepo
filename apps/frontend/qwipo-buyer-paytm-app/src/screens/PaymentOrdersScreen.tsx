import { useState } from 'react';
import { ChevronLeft, Receipt } from 'lucide-react';
import { SegmentedControl, EmptyState } from '@mockups/ui';

type Tab = 'payments' | 'transactions';

/** Keep both tabs from the Payment Orders empty-state review screen. */
export function PaymentOrdersScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('payments');

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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Qwipo</h1>
      </header>
      <div className="border-b border-border bg-card px-3 py-2.5">
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'payments', label: 'Payments' },
            { value: 'transactions', label: 'Transactions' },
          ]}
        />
      </div>
      <div className="grid flex-1 place-items-center bg-background-subtle">
        <EmptyState
          icon={<Receipt strokeWidth={1.75} />}
          title={tab === 'payments' ? 'No orders to pay for' : 'No transactions yet'}
          description={
            tab === 'payments'
              ? 'Orders awaiting payment for this seller will appear here.'
              : 'Payments you make to this seller will appear here.'
          }
        />
      </div>
    </div>
  );
}
