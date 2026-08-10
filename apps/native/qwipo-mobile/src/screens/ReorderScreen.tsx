import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { QtyStepper } from '../ui/QtyStepper';

/* Reorder — past purchases with the seller name + Distributor/Wholesaler badge,
   mirroring the web mockup. Adding pushes into the shared cart. */
const ITEMS = [
  { id: 'p1', name: 'Freedom Refined Sunflower Oil', seller: 'Sri Sai Krishna Traders', source: 'distributor', price: 165, last: '3 days ago' },
  { id: 'p10', name: 'Red Label Tea', seller: 'Omkar Enterprises', source: 'wholesaler', price: 135, last: '1 week ago' },
  { id: 'p2', name: 'Aashirvaad Atta', seller: 'Sri Sai Krishna Traders', source: 'distributor', price: 420, last: '1 week ago' },
] as const;

export function ReorderScreen({ qty, onQty }: { qty: Record<string, number>; onQty: (id: string, n: number) => void }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background-subtle">
      <View className="border-b border-border bg-card px-4 py-3">
        <Text className="text-base font-semibold text-foreground">Reorder</Text>
        <Text className="text-xs text-foreground-secondary">{ITEMS.length} items you buy often</Text>
      </View>
      <ScrollView contentContainerClassName="gap-3 p-3">
        {ITEMS.map((it) => {
          const q = qty[it.id] ?? 0;
          return (
            <Card key={it.id} className="p-3">
              <Text className="text-sm font-semibold text-foreground">{it.name}</Text>
              <View className="mt-1 flex-row items-center gap-2">
                <Text className="text-sm text-foreground">{it.seller}</Text>
                <Badge variant={it.source === 'distributor' ? 'info' : 'warning'}>
                  {it.source === 'distributor' ? 'Distributor' : 'Wholesaler'}
                </Badge>
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-foreground">
                  ₹{it.price.toLocaleString('en-IN')}
                  <Text className="text-xs font-normal text-foreground-secondary"> /pc</Text>
                </Text>
                {q > 0 ? (
                  <QtyStepper value={q} onChange={(n) => onQty(it.id, n)} tone="soft" />
                ) : (
                  <View className="w-24">
                    <Button size="sm" onPress={() => onQty(it.id, 1)}>
                      + Add
                    </Button>
                  </View>
                )}
              </View>
              <Text className="mt-2 text-xs text-foreground-secondary">Last ordered {it.last}</Text>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
