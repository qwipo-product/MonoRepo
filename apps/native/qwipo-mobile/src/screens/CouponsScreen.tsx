import { ScrollView, View, Text, Pressable } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../ui/Card';

export type Coupon = { id: string; code: string; title: string; detail: string; amount: number };

const COUPONS: Coupon[] = [
  { id: 'c1', code: 'QWIPO500', title: 'Flat ₹500 OFF', detail: 'On orders above ₹6,000', amount: 500 },
  { id: 'c2', code: 'WELCOME10', title: '10% OFF up to ₹400', detail: 'First 3 orders', amount: 400 },
  { id: 'c3', code: 'FREESHIP', title: 'Free delivery', detail: 'On all orders above ₹3,500', amount: 0 },
];

export function CouponsScreen({ onBack, onApply }: { onBack: () => void; onApply: (c: Coupon) => void }) {
  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Apply Coupon" onBack={onBack} />
      <ScrollView contentContainerClassName="gap-3 p-3">
        {COUPONS.map((c) => (
          <Pressable key={c.id} onPress={() => onApply(c)}>
            <Card className="flex-row items-center gap-3 p-3">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary-soft">
                <Text className="text-base">🏷️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">{c.title}</Text>
                <Text className="text-xs text-foreground-secondary">
                  {c.detail} · {c.code}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-primary">Apply</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
