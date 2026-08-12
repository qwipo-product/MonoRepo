import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { cn, formatInrExact } from '../lib/format';
import { colors } from '../lib/theme';
import { ChevronDown, Gift, Percent, Truck } from '../lib/icons';

const SLABS = [
  { qty: '> 5 Cases', margin: 17, price: 153.45 },
  { qty: '3 - 4 Cases', margin: 14, price: 160.05 },
  { qty: '1 - 2 Cases', margin: 12, price: 165 },
];

const OFFERS = [
  { Icon: Gift, box: 'bg-warning-subtle', color: colors.warning, title: 'Buy 10 Cases Get 1 Free', sub: 'On purchases of 16 Pcs/Case', detail: 'Add 10 cases of this product and 1 case is added free at checkout.' },
  { Icon: Percent, box: 'bg-primary-soft', color: colors.primary, title: '5% Off', sub: 'Get 5% off on your order above ₹500 upto ₹100', detail: 'Applies to the seller subtotal above ₹500. Maximum discount ₹100 per order.' },
  { Icon: Truck, box: 'bg-success-subtle', color: colors.success, title: 'Free Delivery', sub: 'Free shipping on orders above ₹3,000', detail: "Delivery fee is waived once this seller's subtotal crosses ₹3,000." },
];

export function DiscountsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <Sheet open={open} onClose={onClose} icon={<Percent size={18} color={colors.primary} />} title="Offer & Schemes" subtitle="Please review the following before proceeding">
      <View>
        <Text className="mb-2 text-sm font-semibold text-foreground">Quantity Price Slab</Text>
        <View className="overflow-hidden rounded-lg border border-border">
          <View className="flex-row bg-muted px-3 py-2.5">
            <Text className="flex-1 text-xs font-medium text-foreground-secondary">Quantity</Text>
            <Text className="flex-1 text-xs font-medium text-foreground-secondary">Margin %</Text>
            <Text className="flex-1 text-right text-xs font-medium text-foreground-secondary">Unit Price</Text>
          </View>
          {SLABS.map((s) => (
            <View key={s.qty} className="flex-row items-center border-t border-border px-3 py-3.5">
              <Text className="flex-1 text-sm font-medium text-foreground">{s.qty}</Text>
              <Text className="flex-1 text-sm font-semibold text-success-foreground">{s.margin} %</Text>
              <Text className="flex-1 text-right text-sm font-bold text-foreground">{formatInrExact(s.price)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-5">
        <Text className="mb-2 text-sm font-semibold text-foreground">Other Offers</Text>
        <View className="gap-3">
          {OFFERS.map((o, i) => {
            const expanded = openIdx === i;
            const Icon = o.Icon;
            return (
              <View key={o.title} className="overflow-hidden rounded-lg border border-border bg-card">
                <Pressable onPress={() => setOpenIdx(expanded ? null : i)} className="flex-row items-center gap-3 p-3">
                  <View className={cn('h-10 w-10 items-center justify-center rounded-lg', o.box)}>
                    <Icon size={20} color={o.color} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-semibold text-foreground">{o.title}</Text>
                    <Text className="text-xs text-foreground-secondary">{o.sub}</Text>
                  </View>
                  <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                    <ChevronDown size={16} color={colors.foregroundSecondary} />
                  </View>
                </Pressable>
                {expanded && (
                  <View className="border-t border-border p-3">
                    <Text className="text-sm text-foreground-secondary">{o.detail}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </Sheet>
  );
}
