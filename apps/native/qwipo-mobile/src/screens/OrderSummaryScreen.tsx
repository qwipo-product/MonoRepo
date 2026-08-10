import { ScrollView, View, Text, Pressable } from 'react-native';
import { ChevronRight, Tag } from 'lucide-react-native';
import { Header } from '../components/Header';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatInr, formatInrExact } from '../ui/PriceLabel';
import { PRODUCTS } from '../data/products';
import type { Coupon } from './CouponsScreen';

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <View className="mt-1.5 flex-row items-center justify-between">
      <Text className="text-sm text-foreground-secondary">{label}</Text>
      <Text className={good ? 'text-sm font-medium text-success-foreground' : 'text-sm text-foreground'}>{value}</Text>
    </View>
  );
}

export function OrderSummaryScreen({
  qty,
  coupon,
  onBack,
  onPlaceOrder,
  onOpenCoupons,
}: {
  qty: Record<string, number>;
  coupon: Coupon | null;
  onBack: () => void;
  onPlaceOrder: () => void;
  onOpenCoupons: () => void;
}) {
  const lines = PRODUCTS.filter((p) => (qty[p.id] ?? 0) > 0).map((p) => ({ p, q: qty[p.id], total: p.price * qty[p.id] }));
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const discount = coupon?.amount ?? 0;
  const delivery = 0;
  const total = Math.max(0, subtotal - discount + delivery);

  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Order Summary" onBack={onBack} />
      <ScrollView contentContainerClassName="gap-3 p-3">
        <Card className="p-3">
          <Text className="text-sm font-semibold text-foreground">Items</Text>
          <View className="mt-2 gap-2">
            {lines.map((l) => (
              <View key={l.p.id} className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                  {l.p.shortName} × {l.q}
                </Text>
                <Text className="text-sm font-medium text-foreground">{formatInr(l.total)}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Pressable onPress={onOpenCoupons}>
          <Card className="flex-row items-center gap-3 p-3">
            <Tag size={18} color="#2563eb" />
            <Text className="flex-1 text-sm font-medium text-foreground">
              {coupon ? `Coupon ${coupon.code} applied` : 'Apply a coupon'}
            </Text>
            {coupon ? (
              <Text className="text-sm font-semibold text-success-foreground">-{formatInr(coupon.amount)}</Text>
            ) : (
              <ChevronRight size={18} color="#717182" />
            )}
          </Card>
        </Pressable>

        <Card className="p-3">
          <Text className="text-sm font-semibold text-foreground">Bill details</Text>
          <Row label="Item total" value={formatInrExact(subtotal)} />
          {discount > 0 ? <Row label="Coupon discount" value={`-${formatInrExact(discount)}`} good /> : null}
          <Row label="Delivery" value={delivery === 0 ? 'Free' : formatInrExact(delivery)} />
          <View className="mt-2 flex-row items-center justify-between border-t border-border pt-2">
            <Text className="text-sm font-bold text-foreground">To pay</Text>
            <Text className="text-lg font-bold text-foreground">{formatInrExact(total)}</Text>
          </View>
        </Card>
      </ScrollView>

      <View className="flex-row items-center justify-between border-t border-border bg-card px-4 py-3">
        <View>
          <Text className="text-[10px] uppercase tracking-wide text-foreground-secondary">To pay</Text>
          <Text className="text-lg font-bold text-foreground">{formatInrExact(total)}</Text>
        </View>
        <View className="w-44">
          <Button onPress={onPlaceOrder}>Place order</Button>
        </View>
      </View>
    </View>
  );
}
