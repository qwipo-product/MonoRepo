import { useState, type ComponentType } from 'react';
import { Text, View } from 'react-native';
import { Button, Input, SelectableCard, ScrollView } from '../components/ui';
import { cn, formatInr } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronLeft, Ticket, Percent, Truck, Wallet } from '../lib/icons';
import { Pressable } from 'react-native';
import { COUPONS, savingsText, type Coupon, type CouponType } from '../data/coupons';
import { buildCart } from '../data/cart';

const ICONS: Record<CouponType, ComponentType<{ size?: number; color?: string }>> = {
  flat: Ticket,
  percent: Percent,
  free: Truck,
  cashback: Wallet,
};

export function CouponsScreen({ onBack, onApply }: { onBack: () => void; onApply: () => void }) {
  const { grandTotal } = buildCart();
  const [code, setCode] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = COUPONS.find((c) => c.id === selectedId) ?? null;
  const canApply = !!selected && grandTotal >= selected.minOrder;

  const check = () => {
    const match = COUPONS.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    if (match) setSelectedId(match.id);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3" style={shadows.sm}>
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <Text className="min-w-0 flex-1 text-base font-semibold text-foreground" numberOfLines={1}>Apply Coupon</Text>
      </View>

      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16 }}>
        <Text className="mb-2 text-sm font-medium text-foreground">Have a coupon code?</Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input value={code} onChangeText={(t) => setCode(t.toUpperCase())} placeholder="Enter coupon code" autoCapitalize="characters" />
          </View>
          <Button variant={code.trim() ? 'primary' : 'secondary'} disabled={!code.trim()} onPress={check}>
            Check
          </Button>
        </View>

        <Text className="mb-2 mt-5 text-sm font-semibold text-foreground">Available offers</Text>
        <View className="gap-3">
          {COUPONS.map((c) => (
            <OfferCard
              key={c.id}
              coupon={c}
              eligible={grandTotal >= c.minOrder}
              shortfall={c.minOrder - grandTotal}
              selected={selectedId === c.id}
              onSelect={() => grandTotal >= c.minOrder && setSelectedId(c.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View className="flex-row items-center justify-between gap-3 border-t border-border bg-card px-4 py-3" style={shadows.barTop}>
        {selected ? (
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{selected.code}</Text>
            <Text className="text-xs text-foreground-secondary" numberOfLines={1}>You save <Text className="font-medium text-success-foreground">{savingsText(selected)}</Text></Text>
          </View>
        ) : (
          <Text className="flex-1 text-sm text-foreground-secondary">Select a coupon to apply</Text>
        )}
        <Button className="shrink-0 px-8" disabled={!canApply} onPress={onApply}>
          Apply
        </Button>
      </View>
    </View>
  );
}

function OfferCard({
  coupon,
  eligible,
  shortfall,
  selected,
  onSelect,
}: {
  coupon: Coupon;
  eligible: boolean;
  shortfall: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = ICONS[coupon.type];
  return (
    <SelectableCard selected={selected} radio onPress={onSelect} className={cn('p-3', !eligible && 'opacity-60')}>
      <View className="flex-row gap-3 pr-7">
        <View className="w-10 items-center gap-1">
          <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
            <Icon size={20} color={colors.primary} />
          </View>
          {coupon.tag && (
            <View className="rounded bg-warning-subtle px-1 py-0.5">
              <Text className="text-center text-[10px] font-semibold uppercase tracking-wide text-warning-foreground">{coupon.tag}</Text>
            </View>
          )}
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-foreground">{coupon.title}</Text>
          <Text className="text-xs text-foreground-secondary">{coupon.sub}</Text>
          <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
            <View className="rounded border border-dashed border-border px-1.5 py-0.5">
              <Text className="text-xs font-medium text-foreground">{coupon.code}</Text>
            </View>
            <Text className="text-xs text-foreground-secondary">Expires {coupon.expires}</Text>
          </View>
          {!eligible && <Text className="mt-1 text-xs font-medium text-warning-foreground">Add {formatInr(shortfall)} more to use</Text>}
        </View>
      </View>
    </SelectableCard>
  );
}
