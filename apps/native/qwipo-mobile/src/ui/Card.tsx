import { View, type ViewProps } from 'react-native';
import type { ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'default' | 'highlighted' | 'flat' | 'compact';

const variants: Record<Variant, string> = {
  default: 'rounded-lg border border-border bg-card',
  highlighted: 'rounded-lg border border-primary bg-primary-soft',
  flat: 'rounded-lg border border-border bg-card',
  compact: 'rounded-md border border-border bg-background-subtle',
};

export function Card({
  children,
  variant = 'default',
  className,
  ...rest
}: { children: ReactNode; variant?: Variant; className?: string } & ViewProps) {
  return (
    <View className={cn(variants[variant], className)} {...rest}>
      {children}
    </View>
  );
}
