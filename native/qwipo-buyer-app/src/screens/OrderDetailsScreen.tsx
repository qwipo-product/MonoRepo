import { type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { PriceLabel } from '../components/ui';
import { StatusBadge } from '../components/StatusBadge';
import { CopyChip } from '../components/OrderListCard';
import { formatInrExact } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronLeft, MapPin } from '../lib/icons';
import type { Order } from '../data/orders';
import { ADDRESSES, DEFAULT_ADDRESS_ID } from '../data/addresses';
import { formatDate } from '../lib/date';

/* Order Details — seller + status, the bill, the item list, delivery address. */
export function OrderDetailsScreen({ order, onBack }: { order: Order; onBack: () => void }) {
  const itemsTotal = order.total - order.deliveryFee;
  const address = ADDRESSES.find((a) => a.id === DEFAULT_ADDRESS_ID) ?? ADDRESSES[0];
  const initials = order.seller.replace(/[^a-zA-Z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3" style={shadows.sm}>
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-foreground" numberOfLines={1}>Order Details</Text>
          <Text className="text-xs text-foreground-secondary">{order.orderId}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3" style={shadows.sm}>
          <View className="h-11 w-11 items-center justify-center rounded-lg bg-primary-soft">
            <Text className="text-sm font-bold text-primary">{initials}</Text>
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{order.seller}</Text>
            <StatusBadge status={order.status} label={order.statusLabel} />
          </View>
        </View>

        <Section title="Order Summary">
          <View className="rounded-lg border border-border bg-card p-3" style={shadows.sm}>
            <SumRow label="Order ID" value={<CopyChip value={order.orderId} />} />
            <SumRow label="Order date" value={formatDate(order.placedAt)} />
            <SumRow label="Expected delivery" value={formatDate(order.eta)} />
            <SumRow label="Order status" value={order.statusLabel} />
            <SumRow label="Items total" value={formatInrExact(itemsTotal)} />
            <SumRow label="Delivery fee" value={formatInrExact(order.deliveryFee)} />
            <View className="mt-1 flex-row items-center justify-between border-t border-border pt-2.5">
              <Text className="text-sm font-semibold text-foreground">Total amount</Text>
              <Text className="text-base font-bold text-foreground">{formatInrExact(order.total)}</Text>
            </View>
          </View>
        </Section>

        {order.items.length > 0 && (
          <Section title={`Items (${order.items.length})`}>
            <View className="gap-2">
              {order.items.map((item, i) => (
                <View key={i} className="flex-row gap-3 rounded-lg border border-border bg-card p-3" style={shadows.sm}>
                  <View className="h-14 w-14 items-center justify-center rounded-lg border border-border bg-card">
                    <Text className="text-2xl">{item.image}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-[10px] font-semibold uppercase tracking-wide text-foreground-secondary">{item.brand}</Text>
                    <Text className="text-sm font-medium text-foreground">{item.name}</Text>
                    <Text className="text-xs text-foreground-secondary">{item.pack}</Text>
                  </View>
                  <PriceLabel price={item.price} mrp={item.mrp} />
                </View>
              ))}
            </View>
          </Section>
        )}

        <Section title="Delivery Address">
          <View className="flex-row gap-2.5 rounded-lg border border-border bg-card p-3" style={shadows.sm}>
            <MapPin size={20} color={colors.primary} />
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-medium text-foreground">{address.title}</Text>
              <Text className="text-xs text-foreground-secondary">{address.locality} – {address.pincode}</Text>
            </View>
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-foreground">{title}</Text>
      {children}
    </View>
  );
}

function SumRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-sm text-foreground-secondary">{label}</Text>
      {typeof value === 'string' ? <Text className="text-sm font-medium text-foreground">{value}</Text> : value}
    </View>
  );
}
