import { View, Text } from 'react-native';
import { cn } from './cn';

export const formatInr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
export const formatInrExact = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PriceLabel({
  price,
  mrp,
  suffix,
  size = 'sm',
  align = 'end',
  className,
}: {
  price: number;
  mrp?: number;
  suffix?: string;
  size?: 'sm' | 'lg';
  align?: 'start' | 'end';
  className?: string;
}) {
  const showMrp = mrp != null && mrp > price;
  return (
    <View className={cn('flex-col', align === 'end' ? 'items-end' : 'items-start', className)}>
      {showMrp && (
        <Text className="text-xs text-foreground-secondary">
          MRP <Text className="line-through">{formatInr(mrp!)}</Text>
        </Text>
      )}
      <Text className={cn('font-bold text-foreground', size === 'lg' ? 'text-lg' : 'text-sm')}>
        {formatInr(price)}
        {suffix ? <Text className="text-xs font-normal text-foreground-secondary">{suffix}</Text> : null}
      </Text>
    </View>
  );
}
