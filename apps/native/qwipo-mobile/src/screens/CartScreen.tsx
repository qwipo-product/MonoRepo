import { ScrollView, View, Text } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { QtyStepper } from '../ui/QtyStepper';
import { EmptyState } from '../ui/EmptyState';
import { formatInr } from '../ui/PriceLabel';
import { PRODUCTS } from '../data/products';

export function CartScreen({
  qty,
  onQty,
  onBack,
  onCheckout,
  onAddMore,
}: {
  qty: Record<string, number>;
  onQty: (id: string, n: number) => void;
  onBack?: () => void;
  onCheckout: () => void;
  onAddMore: () => void;
}) {
  const lines = PRODUCTS.filter((p) => (qty[p.id] ?? 0) > 0).map((p) => ({ p, q: qty[p.id], total: p.price * qty[p.id] }));
  const total = lines.reduce((s, l) => s + l.total, 0);
  const sellers = [...new Set(lines.map((l) => l.p.seller))];

  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Cart Summary" subtitle={lines.length ? `${lines.length} items · ${sellers.length} sellers` : undefined} onBack={onBack} />

      {lines.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Add products to see them here."
          action={
            <View className="w-48">
              <Button variant="secondary" onPress={onAddMore}>
                Browse products
              </Button>
            </View>
          }
        />
      ) : (
        <>
          <ScrollView contentContainerClassName="gap-3 p-3">
            {sellers.map((s) => (
              <Card key={s} className="p-3">
                <Text className="text-xs text-foreground-secondary">Buying from</Text>
                <Text className="text-sm font-semibold text-foreground">{s}</Text>
                <View className="mt-2 gap-3">
                  {lines
                    .filter((l) => l.p.seller === s)
                    .map((l) => (
                      <View key={l.p.id} className="flex-row items-center gap-3">
                        <View className="h-12 w-12 items-center justify-center rounded-lg bg-muted">
                          <Text className="text-xl">{l.p.image}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                            {l.p.shortName}
                          </Text>
                          <Text className="text-xs text-foreground-secondary">{formatInr(l.total)}</Text>
                        </View>
                        <QtyStepper value={l.q} onChange={(n) => onQty(l.p.id, n)} tone="soft" />
                      </View>
                    ))}
                </View>
              </Card>
            ))}
          </ScrollView>

          <View className="flex-row items-center justify-between border-t border-border bg-card px-4 py-3">
            <View>
              <Text className="text-[10px] uppercase tracking-wide text-foreground-secondary">Total Cart Value</Text>
              <Text className="text-lg font-bold text-foreground">{formatInr(total)}</Text>
            </View>
            <View className="w-40">
              <Button onPress={onCheckout}>Checkout</Button>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
