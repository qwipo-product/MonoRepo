import { useState } from 'react';
import { ChevronLeft, Receipt } from 'lucide-react';
import { SegmentedControl, EmptyState, Button, cn } from '@mockups/ui';
import { formatInrExact } from '@mockups/components';
import { OrderListCard } from '@mockups/components';
import { statusFromLabel } from '../data/orders';
import { formatDate } from '../date';
import {
  PAYMENT_VENDORS,
  PAYMENT_ORDERS,
  PAYMENT_TXNS,
  type PaymentTxn,
} from '../data/payments';
import { useEmptyable } from '../review/demoState';

type Tab = 'payments' | 'transactions';

/* Account · Payments · Orders — outstanding orders + past transactions for one
   vendor. Qwipo-fulfilled pays all orders via a single Continue; vendor orders
   each carry a Pay. Both route to the gateway screen with an amount. */
export function PaymentOrdersScreen({
  vendorId,
  onBack,
  onPay,
}: {
  vendorId: string;
  onBack: () => void;
  onPay: (amount: number) => void;
}) {
  const [tab, setTab] = useState<Tab>('payments');
  const vendor = PAYMENT_VENDORS.find((v) => v.id === vendorId) ?? PAYMENT_VENDORS[0];
  const orders = useEmptyable(PAYMENT_ORDERS[vendor.id] ?? []);
  const txns = useEmptyable(PAYMENT_TXNS[vendor.id] ?? []);
  const isQwipo = vendor.fulfilment === 'qwipo';
  const total = orders.reduce((s, o) => s + o.outstandingAmount, 0);

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
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">
          {vendor.name}
        </h1>
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

      {tab === 'payments' ? (
        orders.length === 0 ? (
          <div className="grid flex-1 place-items-center bg-background-subtle">
            <EmptyState
              icon={<Receipt strokeWidth={1.75} />}
              title="No orders to pay for"
              description="Orders awaiting payment for this seller will appear here."
            />
          </div>
        ) : (
          <>
            <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
              {/* Same card as My Orders, minus Order Details / Cancel / Track /
                  cancel-hint. Vendor-fulfilled orders keep the Pay action. */}
              {orders.map((o) => (
                <OrderListCard
                  key={o.id}
                  title={vendor.name}
                  orderId={o.orderNumber}
                  status={statusFromLabel(o.status)}
                  statusLabel={o.status}
                  meta={`Placed ${formatDate(o.orderDate)}`}
                  total={o.outstandingAmount}
                  totalLabel="Outstanding"
                  rightLabel="Order amount"
                  rightValue={formatInrExact(o.orderAmount)}
                  actions={
                    !isQwipo ? (
                      <Button fullWidth onClick={() => onPay(o.outstandingAmount)}>
                        Pay
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </div>

            {isQwipo && (
              <div className="border-t border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-foreground-secondary">Total outstanding</span>
                  <span className="text-base font-semibold tabular-nums text-foreground">
                    {formatInrExact(total)}
                  </span>
                </div>
                <Button fullWidth onClick={() => onPay(total)}>
                  Continue
                </Button>
              </div>
            )}
          </>
        )
      ) : txns.length === 0 ? (
        <div className="grid flex-1 place-items-center bg-background-subtle">
          <EmptyState
            icon={<Receipt strokeWidth={1.75} />}
            title="No transactions yet"
            description="Payments you make to this seller will appear here."
          />
        </div>
      ) : (
        <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto bg-background-subtle p-3">
          <div className="px-1 text-xs font-medium text-foreground-secondary">History</div>
          {txns.map((t) => (
            <TxnRow key={t.id} txn={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TxnRow({ txn }: { txn: PaymentTxn }) {
  const tone =
    txn.status === 'Success'
      ? 'text-success-foreground'
      : txn.status === 'Failed'
        ? 'text-error'
        : 'text-warning-foreground';
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">Ref: {txn.ref}</div>
        <div className="mt-0.5 text-xs text-foreground-secondary">{formatDate(txn.date)}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold tabular-nums text-foreground">
          {formatInrExact(txn.amount)}
        </div>
        <div className={cn('mt-0.5 text-xs font-medium', tone)}>{txn.status}</div>
      </div>
    </div>
  );
}
