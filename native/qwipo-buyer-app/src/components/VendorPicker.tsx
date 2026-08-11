import { ScrollView, Text, View, Pressable } from 'react-native';
import { formatInr, cn } from '../lib/format';
import type { WholesalerVendor } from '../data/wholesaler';

/* Choose-vendor picker — labelled header + horizontal rail of selectable vendor
   cards (price · name · fee), cheapest tagged "Best". */
export function VendorPicker({
  vendors,
  value,
  onChange,
  cheapestId,
}: {
  vendors: WholesalerVendor[];
  value: string;
  onChange: (id: string) => void;
  cheapestId: string;
}) {
  return (
    <View>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-xs font-medium text-foreground">Choose vendor</Text>
        <Text className="text-xs text-foreground-secondary">{vendors.length} options</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {vendors.map((vn) => {
          const on = vn.id === value;
          return (
            <Pressable
              key={vn.id}
              onPress={() => onChange(vn.id)}
              className={cn('w-40 rounded-lg border p-2.5', on ? 'border-primary bg-primary' : 'border-border bg-card')}
            >
              {vn.id === cheapestId && (
                <View
                  className={cn(
                    'absolute right-2 top-2 rounded-full px-1.5 py-0.5',
                    on ? 'bg-white/20' : 'bg-success-subtle'
                  )}
                >
                  <Text className={cn('text-[10px] font-semibold', on ? 'text-primary-foreground' : 'text-success-foreground')}>
                    Best
                  </Text>
                </View>
              )}
              <Text className={cn('text-xs font-bold', on ? 'text-primary-foreground' : 'text-foreground')}>
                {formatInr(vn.price)}
              </Text>
              <Text className={cn('text-xs font-medium', on ? 'text-primary-foreground' : 'text-foreground')} numberOfLines={1}>
                {vn.name}
              </Text>
              <Text className={cn('text-xs', on ? 'text-primary-foreground/80' : 'text-foreground-secondary')}>
                Fee: {vn.fee}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
