import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '../components/ui';
import { formatInr } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronLeft, ChevronRight, MapPin, Tag } from '../lib/icons';
import { buildCart, type CartSeller } from '../data/cart';
import { ADDRESSES, DEFAULT_ADDRESS_ID } from '../data/addresses';

const brandOf = (name: string) => name.split(' ')[0];

export function OrderSummaryScreen({
  onBack,
  onPlaceOrder,
  onOpenCoupons,
  onViewItems,
}: {
  onBack: () => void;
  onPlaceOrder: () => void;
  onOpenCoupons: () => void;
  onViewItems: (sellerId: string) => void;
}) {
  const { sellers, grandTotal } = buildCart();
  const deliveryFee = sellers.reduce((n, s) => n + s.deliveryFee, 0);
  const totalItems = sellers.reduce((n, s) => n + s.items.reduce((a, i) => a + i.quantity, 0), 0);
  const grandSavings = sellers.reduce((n, s) => n + s.savings, 0);
  const toPay = grandTotal + deliveryFee;
  const address = ADDRESSES.find((a) => a.id === DEFAULT_ADDRESS_ID) ?? ADDRESSES[0];

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3" style={shadows.sm}>
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <Text className="min-w-0 flex-1 text-base font-semibold text-foreground" numberOfLines={1}>Order Summary</Text>
      </View>

      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
        {sellers.map((s) => (
          <SellerBill key={s.id} seller={s} onViewItems={() => onViewItems(s.id)} />
        ))}

        <Pressable onPress={onOpenCoupons} className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-4" style={shadows.sm}>
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary-soft">
            <Tag size={16} color={colors.primary} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-semibold text-foreground">Apply coupon</Text>
            <Text className="text-xs text-foreground-secondary">Offers available — tap to view & apply</Text>
          </View>
          <ChevronRight size={16} color={colors.foregroundSecondary} />
        </Pressable>

        <View className="rounded-lg border border-border bg-card p-4" style={shadows.sm}>
          <Text className="mb-2 text-sm font-semibold text-foreground">Bill details</Text>
          <BillRow label="Total items" value={String(totalItems)} />
          <BillRow label="Item total" value={formatInr(grandTotal)} />
          {grandSavings > 0 && <BillRow label="You save" value={`− ${formatInr(grandSavings)}`} good />}
          <BillRow label="Delivery fee" value={deliveryFee === 0 ? 'Free' : formatInr(deliveryFee)} />
          <View className="mt-2 flex-row items-center justify-between border-t border-border pt-2.5">
            <Text className="text-sm font-semibold text-foreground">To pay</Text>
            <Text className="text-lg font-bold text-foreground">{formatInr(toPay)}</Text>
          </View>
        </View>

        <View className="rounded-lg border border-border bg-card p-4" style={shadows.sm}>
          <Text className="mb-2 text-sm font-semibold text-foreground">Delivery address</Text>
          <View className="flex-row gap-2.5">
            <MapPin size={20} color={colors.primary} />
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-medium text-foreground">{address.title}</Text>
              <Text className="text-xs text-foreground-secondary">{address.locality} – {address.pincode}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-border bg-card px-4 py-3" style={shadows.barTop}>
        <View className="flex-row items-center justify-between gap-3">
          <View>
            <Text className="text-[10px] uppercase tracking-wide text-foreground-secondary">To pay</Text>
            <Text className="text-lg font-bold text-foreground">{formatInr(toPay)}</Text>
          </View>
          <Button className="shrink-0 px-8" onPress={onPlaceOrder}>
            Place order
          </Button>
        </View>
      </View>
    </View>
  );
}

function SellerBill({ seller, onViewItems }: { seller: CartSeller; onViewItems: () => void }) {
  const brands = [...new Set(seller.items.map((i) => brandOf(i.product.shortName)))];
  const summary = brands.length > 3 ? `${brands.slice(0, 3).join(', ')} +${brands.length - 3} more` : brands.join(', ');

  return (
    <View className="rounded-lg border border-border bg-card p-3" style={shadows.sm}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{seller.name}</Text>
          <Text className="text-xs text-foreground-secondary">{seller.items.length} {seller.items.length === 1 ? 'product' : 'products'}</Text>
        </View>
        <View className="items-end">
          <Text className="text-sm text-foreground"><Text className="text-foreground-secondary">Total: </Text><Text className="font-bold">{formatInr(seller.subtotal)}</Text></Text>
          {seller.savings > 0 && <Text className="text-xs font-medium text-success-foreground">You save {formatInr(seller.savings)}</Text>}
        </View>
      </View>

      <View className="mt-2.5 flex-row items-center justify-between gap-3 rounded-md bg-background-subtle p-2.5">
        <Text className="min-w-0 flex-1 text-xs text-foreground" numberOfLines={1}>{summary}</Text>
        <Pressable onPress={onViewItems}>
          <Text className="text-sm font-semibold text-primary">View items</Text>
        </Pressable>
      </View>

      <View className="mt-3 flex-row items-center justify-between border-t border-border pt-2.5">
        <Text className="text-sm text-foreground-secondary">Delivery by</Text>
        <Text className="text-sm font-semibold text-foreground">{seller.windows[0]}</Text>
      </View>
    </View>
  );
}

function BillRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-0.5">
      <Text className="text-sm text-foreground-secondary">{label}</Text>
      <Text className={good ? 'text-sm font-medium text-success-foreground' : 'text-sm text-foreground'}>{value}</Text>
    </View>
  );
}
