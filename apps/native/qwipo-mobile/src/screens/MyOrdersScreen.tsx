import { ScrollView, View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Header } from '../components/Header';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { formatInrExact } from '../ui/PriceLabel';
import { ORDERS, STEP_INDEX, TRACK_STEPS, type Order } from '../data/orders';

export function MyOrdersScreen({ onBack, onOpenDetails }: { onBack: () => void; onOpenDetails: (id: string) => void }) {
  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="My Orders" onBack={onBack} />
      <ScrollView contentContainerClassName="gap-3 p-3">
        {ORDERS.map((o) => (
          <OrderCard key={o.id} order={o} onOpenDetails={() => onOpenDetails(o.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function OrderCard({ order, onOpenDetails }: { order: Order; onOpenDetails: () => void }) {
  const done = STEP_INDEX[order.status];
  return (
    <Card className="p-3">
      <Pressable onPress={onOpenDetails} className="flex-row items-center gap-2">
        <Text className="text-sm font-bold text-foreground">{order.id}</Text>
        <ChevronRight size={14} color="#717182" />
        <View className="flex-1" />
        <StatusBadge status={order.status} />
      </Pressable>
      <Text className="mt-0.5 text-xs text-foreground-secondary">
        {order.date} · {order.seller}
      </Text>

      {order.status !== 'delivered' && order.status !== 'cancelled' ? (
        <View className="mt-3 flex-row">
          {TRACK_STEPS.map((label, i) => {
            const stepDone = i + 1 <= done;
            const current = i + 1 === done;
            return (
              <View key={label} className="flex-1 items-center">
                <View className="flex-row items-center">
                  <View className={i === 0 ? 'flex-1' : 'flex-1 ' + (stepDone ? 'bg-success' : 'bg-muted') + ' h-0.5'} />
                  <View
                    className={
                      'h-3 w-3 rounded-full ' +
                      (current ? 'bg-success' : stepDone ? 'bg-success' : 'bg-muted')
                    }
                  />
                  <View className={i === TRACK_STEPS.length - 1 ? 'flex-1' : 'flex-1 ' + (i + 1 < done ? 'bg-success' : 'bg-muted') + ' h-0.5'} />
                </View>
                <Text className={'mt-1 text-center text-[9px] ' + (stepDone ? 'text-foreground' : 'text-foreground-secondary')}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}

      <View className="mt-3 flex-row items-center justify-between border-t border-border pt-2">
        <Text className="text-xs text-foreground-secondary">{order.items.length} items</Text>
        <Text className="text-sm font-bold text-foreground">{formatInrExact(order.total)}</Text>
      </View>
    </Card>
  );
}
