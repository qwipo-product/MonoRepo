import { ScrollView, View, Text } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { formatInr, formatInrExact } from '../ui/PriceLabel';
import { BUSINESS } from '../data/account';
import type { Order } from '../data/orders';

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <View className="mt-1.5 flex-row items-center justify-between">
      <Text className="text-sm text-foreground-secondary">{label}</Text>
      <Text className={good ? 'text-sm font-medium text-success-foreground' : 'text-sm text-foreground'}>{value}</Text>
    </View>
  );
}

export function OrderDetailsScreen({ order, onBack }: { order: Order; onBack: () => void }) {
  const subtotal = order.items.reduce((s, it) => s + it.price * it.qty, 0);
  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Order Details" subtitle={order.id} onBack={onBack} />
      <ScrollView contentContainerClassName="gap-3 p-3">
        <Card className="flex-row items-center justify-between p-3">
          <View>
            <Text className="text-sm font-semibold text-foreground">{order.seller}</Text>
            <Text className="text-xs text-foreground-secondary">Placed on {order.date}</Text>
          </View>
          <StatusBadge status={order.status} />
        </Card>

        <Card className="p-3">
          <Text className="text-sm font-semibold text-foreground">Items</Text>
          <View className="mt-2 gap-2">
            {order.items.map((it) => (
              <View key={it.name} className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                  {it.name} × {it.qty}
                </Text>
                <Text className="text-sm font-medium text-foreground">{formatInr(it.price * it.qty)}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card className="p-3">
          <Text className="text-sm font-semibold text-foreground">Bill details</Text>
          <Row label="Item total" value={formatInrExact(subtotal)} />
          <Row label="Delivery" value={order.deliveryFee === 0 ? 'Free' : formatInrExact(order.deliveryFee)} />
          <View className="mt-2 flex-row items-center justify-between border-t border-border pt-2">
            <Text className="text-sm font-bold text-foreground">Total paid</Text>
            <Text className="text-lg font-bold text-foreground">{formatInrExact(order.total)}</Text>
          </View>
        </Card>

        <Card className="p-3">
          <Text className="text-sm font-semibold text-foreground">Delivery address</Text>
          <Text className="mt-1 text-sm text-foreground">{BUSINESS.name}</Text>
          <Text className="text-xs text-foreground-secondary">{BUSINESS.address}</Text>
        </Card>
      </ScrollView>
    </View>
  );
}
