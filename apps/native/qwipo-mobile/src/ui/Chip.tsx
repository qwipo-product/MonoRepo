import { Pressable, Text } from 'react-native';
import type { ReactNode } from 'react';
import { cn } from './cn';

export function Chip({
  children,
  selected,
  onPress,
  className,
}: {
  children: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-full border px-3 py-1.5',
        selected ? 'border-primary bg-primary-soft' : 'border-border bg-card',
        className
      )}
    >
      <Text className={cn('text-xs font-medium', selected ? 'text-primary-soft-foreground' : 'text-foreground')}>
        {children}
      </Text>
    </Pressable>
  );
}
