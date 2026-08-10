import { View, Text, Pressable } from 'react-native';
import { cn } from './cn';

export function QtyStepper({
  value,
  onChange,
  min = 0,
  tone = 'neutral',
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  tone?: 'neutral' | 'soft';
}) {
  const soft = tone === 'soft';
  const txt = cn('text-xl font-medium', soft ? 'text-primary-soft-foreground' : 'text-primary');
  return (
    <View className={cn('flex-row items-center overflow-hidden rounded-md', soft ? 'bg-primary-soft' : 'border border-border bg-card')}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} className="h-9 w-9 items-center justify-center">
        <Text className={txt}>−</Text>
      </Pressable>
      <Text className="w-8 text-center text-sm font-semibold text-foreground">{value}</Text>
      <Pressable onPress={() => onChange(value + 1)} className="h-9 w-9 items-center justify-center">
        <Text className={txt}>+</Text>
      </Pressable>
    </View>
  );
}
