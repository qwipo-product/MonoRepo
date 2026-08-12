import { Text, View } from 'react-native';
import { formatInr } from '../lib/format';
import { deliveryFor, dayLabel } from '../data/delivery';

/* Product-card footer: the distributor's delivery day(s) + per-day MOV. */
export function deliveryFooter(seller: string) {
  const d = deliveryFor(seller);
  return (
    <View className="w-full gap-1">
      {d.options.map((o, i) => (
        <View key={i} className="flex-row items-center justify-between">
          <Text className="text-xs text-foreground-secondary">{dayLabel(o)}</Text>
          {o.mov != null && <Text className="text-xs text-foreground-secondary">MOV {formatInr(o.mov)}</Text>}
        </View>
      ))}
    </View>
  );
}
