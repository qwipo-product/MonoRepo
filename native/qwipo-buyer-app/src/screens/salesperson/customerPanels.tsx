import { ScrollView, Text, View } from 'react-native';
import { EmptyState } from '../../components/ui';
import { OrderListCard } from '../../components/OrderListCard';
import { formatInrExact } from '../../lib/format';
import { colors, shadows } from '../../lib/theme';
import { CheckCircle2 } from '../../lib/icons';
import { buildOrder, statusFromLabel, type Order } from '../../data/orders';
import { CUSTOMER_ORDERS, RECOMMENDATIONS } from '../../data/salesperson';
import { formatDate } from '../../lib/date';

/* Read-only panels for a customer — reused by Task Details + Customer Details. */

export function OrdersPanel({ customerId, businessName, onOpenOrder }: { customerId: string; businessName: string; onOpenOrder: (order: Order) => void }) {
  const orders = CUSTOMER_ORDERS[customerId] ?? [];
  if (orders.length === 0) return <PanelEmpty title="No Orders Found" />;
  return (
    <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
      {orders.map((o) => (
        <OrderListCard
          key={o.id}
          title={businessName}
          orderId={o.orderNo}
          status={statusFromLabel(o.status)}
          statusLabel={o.status}
          meta={`Placed ${formatDate(o.date)}`}
          total={o.amount}
          onOpenDetails={() => onOpenOrder(buildOrder({ id: o.id, orderId: o.orderNo, seller: businessName, placedAt: o.date, total: o.amount, statusLabel: o.status }))}
        />
      ))}
    </ScrollView>
  );
}

export function RecoPanel({ customerId }: { customerId: string }) {
  const reco = RECOMMENDATIONS[customerId];
  if (!reco) return <PanelEmpty title="No Recommendations" description="No recent order to reorder from." />;
  return (
    <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 16 }}>
      <View className="rounded-lg border border-border bg-card p-3" style={shadows.sm}>
        <Text className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">Last order</Text>
        <View className="mt-2 flex-row gap-2">
          <Mini label="Date" value={formatDate(reco.lastOrderDate)} />
          <Mini label="Value" value={formatInrExact(reco.lastOrderValue)} />
          <Mini label="Days ago" value={String(reco.daysSince)} />
        </View>
      </View>
      <View className="gap-2">
        <Text className="px-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">Suggested reorder</Text>
        {reco.products.map((p) => (
          <View key={p.id} className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3" style={shadows.sm}>
            <View className="h-11 w-11 items-center justify-center rounded-lg bg-background-subtle">
              <Text className="text-xl">{p.image}</Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{p.name}</Text>
              <Text className="mt-0.5 text-xs text-foreground-secondary">{p.pack} · Qty {p.qty}</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm font-semibold text-foreground">{formatInrExact(p.price)}</Text>
              <Text className="text-[11px] text-foreground-secondary line-through">{formatInrExact(p.mrp)}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function PanelEmpty({ title, description }: { title: string; description?: string }) {
  return <EmptyState icon={<CheckCircle2 size={28} color={colors.foregroundSecondary} />} title={title} description={description} />;
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-md bg-background-subtle p-2">
      <Text className="text-sm font-semibold text-foreground">{value}</Text>
      <Text className="text-[11px] text-foreground-secondary">{label}</Text>
    </View>
  );
}
