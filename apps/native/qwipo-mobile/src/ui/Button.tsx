import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import type { ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'success' | 'warning' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const surface: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-card border border-border',
  ghost: 'bg-transparent',
  soft: 'bg-primary-soft',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-error',
};
const label: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-foreground',
  ghost: 'text-foreground',
  soft: 'text-primary-soft-foreground',
  success: 'text-white',
  warning: 'text-white',
  destructive: 'text-white',
};
const box: Record<Size, string> = { sm: 'h-9 px-3', md: 'h-11 px-4', lg: 'h-[52px] px-6' };
const type: Record<Size, string> = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  loading,
  className,
}: {
  children: ReactNode;
  onPress?: PressableProps['onPress'];
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-md active:opacity-90',
        surface[variant],
        box[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50',
        className
      )}
    >
      {loading && <ActivityIndicator size="small" color="#ffffff" />}
      <Text className={cn('font-bold', type[size], label[variant])}>{children}</Text>
    </Pressable>
  );
}
