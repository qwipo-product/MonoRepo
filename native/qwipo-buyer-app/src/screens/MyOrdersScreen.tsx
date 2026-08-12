import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { OrderListCard } from '../components/OrderListCard';
import { cn } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronLeft, FileText, Check } from '../lib/icons';
import { ORDERS, TRACKING_STEPS, completedSteps, type Order, type OrderStatus } from '../data/orders';
import { formatDate } from '../lib/date';

const CANCELLABLE: OrderStatus[] = ['placed', 'processing', 'in_transit'];

export function MyOrdersScreen({ onBack, onOpenDetails }: { onBack: () => void; onOpenDetails: (orderId: string) => void }) {
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());
  const [tracking, setTracking] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const orders = useMemo(
    () => ORDERS.map((o) => (cancelledIds.has(o.id) ? { ...o, status: 'cancelled' as OrderStatus, statusLabel: 'Cancelled' } : o)),
    [cancelledIds]
  );

  const confirmCancel = () => {
    if (cancelTarget) setCancelledIds((prev) => new Set(prev).add(cancelTarget.id));
    setCancelTarget(null);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3" style={shadows.sm}>
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <Text className="min-w-0 flex-1 text-base font-semibold text-foreground" numberOfLines={1}>My Orders</Text>
      </View>

      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} onOpen={() => onOpenDetails(o.id)} onTrack={() => setTracking(o)} onCancel={() => setCancelTarget(o)} />
        ))}
      </ScrollView>

      <Sheet
        open={!!tracking}
        onClose={() => setTracking(null)}
        title="Tracking details"
        subtitle={tracking?.orderId}
        footer={
          <View className="flex-row gap-3">
            <Button variant="secondary" className="flex-1" onPress={() => { const id = tracking?.id; setTracking(null); if (id) onOpenDetails(id); }}>
              Order details
            </Button>
            <Button className="flex-1" onPress={() => setTracking(null)}>
              Track order
            </Button>
          </View>
        }
      >
        {tracking && <Timeline status={tracking.status} />}
      </Sheet>

      <Sheet
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel this order?"
        subtitle={cancelTarget?.orderId}
        footer={
          <View className="flex-row gap-3">
            <Button variant="secondary" className="flex-1" onPress={() => setCancelTarget(null)}>
              Keep order
            </Button>
            <Button variant="destructive" className="flex-1" onPress={confirmCancel}>
              Cancel order
            </Button>
          </View>
        }
      >
        <Text className="text-sm text-foreground-secondary">
          This will cancel your order from <Text className="font-medium text-foreground">{cancelTarget?.seller}</Text>. You can't undo this.
        </Text>
      </Sheet>
    </View>
  );
}

function OrderCard({ order, onOpen, onTrack, onCancel }: { order: Order; onOpen: () => void; onTrack: () => void; onCancel: () => void }) {
  const cancelled = order.status === 'cancelled';
  const delivered = order.status === 'delivered';
  const cancellable = CANCELLABLE.includes(order.status);

  return (
    <OrderListCard
      title={order.seller}
      orderId={order.orderId}
      status={order.status}
      statusLabel={order.statusLabel}
      meta={`${order.itemCount} ${order.itemCount === 1 ? 'item' : 'items'} · Placed ${formatDate(order.placedAt)}`}
      total={order.total}
      rightLabel="Expected delivery"
      rightValue={formatDate(order.eta)}
      onOpenDetails={onOpen}
      actions={
        cancelled ? undefined : delivered ? (
          <Button variant="secondary" fullWidth onPress={onOpen}>
            <FileText size={16} color={colors.foreground} />
            <Text className="text-sm font-bold text-foreground">Invoice</Text>
          </Button>
        ) : (
          <View className="flex-row gap-2">
            <Button variant="secondary" className="flex-1 border border-destructive" textClassName="text-destructive" onPress={onCancel}>
              Cancel
            </Button>
            <Button className="flex-1" onPress={onTrack}>
              Track order
            </Button>
          </View>
        )
      }
      hint={cancellable && !cancelled ? `You can cancel this order before ${formatDate(order.eta)}` : undefined}
    />
  );
}

function Timeline({ status }: { status: OrderStatus }) {
  const done = completedSteps(status);
  return (
    <View className="ml-1">
      {TRACKING_STEPS.map((label, i) => {
        const isDone = i < done;
        const isCurrent = i === done && done < TRACKING_STEPS.length;
        const isLast = i === TRACKING_STEPS.length - 1;
        return (
          <View key={label} className="flex-row gap-3" style={{ paddingBottom: isLast ? 0 : 24 }}>
            <View className="items-center">
              {isDone ? (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-success">
                  <Check size={14} color={colors.white} />
                </View>
              ) : isCurrent ? (
                <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-success bg-success-subtle">
                  <View className="h-2 w-2 rounded-full bg-success" />
                </View>
              ) : (
                <View className="mt-1.5 h-3 w-3 rounded-full bg-muted" />
              )}
              {!isLast && <View className={cn('w-0.5 flex-1', isDone ? 'bg-success' : 'bg-border')} />}
            </View>
            <Text className={cn('pt-0.5 text-sm', isDone || isCurrent ? 'font-medium text-foreground' : 'text-foreground-secondary')}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}
