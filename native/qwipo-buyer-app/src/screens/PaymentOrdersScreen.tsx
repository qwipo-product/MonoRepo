import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, EmptyState, ScreenHeader, SegmentedControl } from '../components/ui';
import { OrderListCard } from '../components/OrderListCard';
import { cn, formatInrExact } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { Receipt } from '../lib/icons';
import { statusFromLabel } from '../data/orders';
import { formatDate } from '../lib/date';
import { PAYMENT_VENDORS, PAYMENT_ORDERS, PAYMENT_TXNS, type PaymentTxn } from '../data/payments';

type Tab = 'payments' | 'transactions';

export function PaymentOrdersScreen({ vendorId, onBack, onPay }: { vendorId: string; onBack: () => void; onPay: (amount: number) => void }) {
  const [tab, setTab] = useState<Tab>('payments');
  const vendor = PAYMENT_VENDORS.find((v) => v.id === vendorId) ?? PAYMENT_VENDORS[0];
  const orders = PAYMENT_ORDERS[vendor.id] ?? [];
  const txns = PAYMENT_TXNS[vendor.id] ?? [];
  const isQwipo = vendor.fulfilment === 'qwipo';
  const total = orders.reduce((s, o) => s + o.outstandingAmount, 0);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={vendor.name} onBack={onBack} />
      <View className="border-b border-border bg-card px-3 py-2.5">
        <SegmentedControl<Tab> value={tab} onChange={setTab} options={[{ value: 'payments', label: 'Payments' }, { value: 'transactions', label: 'Transactions' }]} />
      </View>

      {tab === 'payments' ? (
        orders.length === 0 ? (
          <EmptyState icon={<Receipt size={28} color={colors.foregroundSecondary} />} title="No Orders Found" />
        ) : (
          <>
            <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
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
                  actions={!isQwipo ? <Button fullWidth onPress={() => onPay(o.outstandingAmount)}>Pay</Button> : undefined}
                />
              ))}
            </ScrollView>
            {isQwipo && (
              <View className="border-t border-border bg-card p-3" style={shadows.barTop}>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-sm text-foreground-secondary">Total outstanding</Text>
                  <Text className="text-base font-semibold text-foreground">{formatInrExact(total)}</Text>
                </View>
                <Button fullWidth onPress={() => onPay(total)}>Continue</Button>
              </View>
            )}
          </>
        )
      ) : txns.length === 0 ? (
        <EmptyState icon={<Receipt size={28} color={colors.foregroundSecondary} />} title="No Transactions Found" />
      ) : (
        <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
          <Text className="px-1 text-xs font-medium text-foreground-secondary">History</Text>
          {txns.map((t) => (
            <TxnRow key={t.id} txn={t} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function TxnRow({ txn }: { txn: PaymentTxn }) {
  const tone = txn.status === 'Success' ? 'text-success-foreground' : txn.status === 'Failed' ? 'text-error' : 'text-warning-foreground';
  return (
    <View className="flex-row items-center justify-between rounded-lg border border-border bg-card p-3" style={shadows.sm}>
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>Ref: {txn.ref}</Text>
        <Text className="mt-0.5 text-xs text-foreground-secondary">{formatDate(txn.date)}</Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-semibold text-foreground">{formatInrExact(txn.amount)}</Text>
        <Text className={cn('mt-0.5 text-xs font-medium', tone)}>{txn.status}</Text>
      </View>
    </View>
  );
}
