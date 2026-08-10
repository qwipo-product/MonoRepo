import { View, Text } from 'react-native';
import type { ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral';

const map: Record<Variant, { bg: string; fg: string; bd: string }> = {
  success: { bg: 'bg-success-subtle', fg: 'text-success-foreground', bd: 'border-success-border' },
  warning: { bg: 'bg-warning-subtle', fg: 'text-warning-foreground', bd: 'border-warning-border' },
  danger: { bg: 'bg-error-subtle', fg: 'text-error-foreground', bd: 'border-error-border' },
  info: { bg: 'bg-info-subtle', fg: 'text-info-foreground', bd: 'border-info-border' },
  accent: { bg: 'bg-accent-subtle', fg: 'text-accent-foreground', bd: 'border-accent-border' },
  neutral: { bg: 'bg-muted', fg: 'text-foreground-secondary', bd: 'border-border' },
};

export function Badge({
  children,
  variant = 'neutral',
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  const c = map[variant];
  return (
    <View className={cn('self-start rounded-md border px-2 py-0.5', c.bg, c.bd, className)}>
      <Text className={cn('text-[10px] font-semibold uppercase tracking-wide', c.fg)}>{children}</Text>
    </View>
  );
}
