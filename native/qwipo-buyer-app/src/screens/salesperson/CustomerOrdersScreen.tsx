import { ScrollView, Text, View } from 'react-native';
import { EmptyState, ScreenHeader } from '../../components/ui';
import { OrderListCard } from '../../components/OrderListCard';
import { formatInrExact } from '../../lib/format';
import { colors, shadows } from '../../lib/theme';
import { ShoppingBag } from '../../lib/icons';
import { buildOrder, type Order } from '../../data/orders';
import { SP_ORDERS, SP_ORDER_SUMMARY, type SpOrder } from '../../data/salesperson';
import { formatDate } from '../../lib/date';

export function CustomerOrdersScreen({ onBack, onOpenOrder }: { onBack: () => void; onOpenOrder: (order: Order) => void }) {
  const s = SP_ORDER_SUMMARY;
  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Customer Orders" onBack={onBack} />
      {SP_ORDERS.length === 0 ? (
        <EmptyState icon={<ShoppingBag size={28} color={colors.foregroundSecondary} />} title="No Orders Found" />
      ) : (
        <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
          <View className="rounded-lg border border-border bg-card p-3" style={shadows.sm}>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-foreground-secondary">Today's revenue</Text>
              <Text className="text-lg font-bold text-foreground">{formatInrExact(s.revenue)}</Text>
            </View>
            <View className="mt-3 flex-row gap-2">
              <SummaryCell label="Task orders" count={s.tasksCustomerCount} amount={s.tasksRevenue} />
              <SummaryCell label="Unassigned" count={s.unassignedCustomerCount} amount={s.unassignedRevenue} />
            </View>
          </View>

          {SP_ORDERS.map((o) => (
            <OrderListCard
              key={o.id}
              title={o.business}
              orderId={o.orderNo}
              status={o.cancelled ? 'cancelled' : 'placed'}
              statusLabel={o.status}
              meta={o.seller}
              total={o.total}
              rightLabel="Order date"
              rightValue={formatDate(o.date)}
              onOpenDetails={() => onOpenOrder(toOrder(o))}
              hint={o.discount ? `Coupon −${formatInrExact(o.discount)}` : undefined}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function toOrder(o: SpOrder): Order {
  return buildOrder({ id: o.id, orderId: o.orderNo, seller: o.business, placedAt: o.date, total: o.total, deliveryFee: o.deliveryFee, statusLabel: o.status });
}

function SummaryCell({ label, count, amount }: { label: string; count: number; amount: number }) {
  return (
    <View className="flex-1 rounded-md bg-background-subtle p-2.5">
      <Text className="text-[11px] text-foreground-secondary">{label}</Text>
      <Text className="mt-0.5 text-sm font-semibold text-foreground">{formatInrExact(amount)}</Text>
      <Text className="text-[11px] text-foreground-secondary">{count} {count === 1 ? 'customer' : 'customers'}</Text>
    </View>
  );
}
