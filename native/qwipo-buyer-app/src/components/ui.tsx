// RN mirrors of the @mockups/ui + @mockups/components primitives, on NativeWind.
// Same token class names as the web design system. Recreated (not imported) —
// the web primitives are DOM/Tailwind-v4 and can't run in React Native.
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch as RNSwitch,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type ViewProps,
} from 'react-native';
import { cn } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronLeft, Search as SearchIcon } from '../lib/icons';

/* ---- Button --------------------------------------------------------------- */
export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'destructive' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const BTN_BOX: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'border border-border bg-card',
  soft: 'bg-primary-soft',
  ghost: 'bg-transparent',
  destructive: 'bg-error',
  success: 'bg-success',
  warning: 'bg-warning',
};
const BTN_TEXT: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-foreground',
  soft: 'text-primary-soft-foreground',
  ghost: 'text-foreground',
  destructive: 'text-white',
  success: 'text-white',
  warning: 'text-white',
};
const BTN_SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 px-3',
  md: 'h-11 px-4',
  lg: 'h-12 px-6',
  icon: 'h-11 w-11',
};
const BTN_TEXT_SIZE: Record<ButtonSize, string> = { sm: 'text-xs', md: 'text-sm', lg: 'text-base', icon: 'text-sm' };
const SPINNER_COLOR: Record<ButtonVariant, string> = {
  primary: colors.primaryForeground,
  secondary: colors.foreground,
  soft: colors.primarySoftForeground,
  ghost: colors.foreground,
  destructive: colors.white,
  success: colors.white,
  warning: colors.white,
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  loading,
  className,
  textClassName,
  ...props
}: Omit<PressableProps, 'children'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  children: ReactNode;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      disabled={off}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-md active:opacity-80',
        BTN_SIZE[size],
        // Disabled reads as a muted gray fill (matches web disabled:bg-muted),
        // not a dimmed brand color.
        off ? 'bg-muted' : BTN_BOX[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={SPINNER_COLOR[variant]} />}
      {typeof children === 'string' ? (
        <Text className={cn('font-bold', BTN_TEXT_SIZE[size], off ? 'text-foreground-secondary' : BTN_TEXT[variant], textClassName)}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

/* ---- Card ----------------------------------------------------------------- */
export type CardVariant = 'default' | 'highlighted' | 'flat' | 'compact' | 'interactive';
const CARD: Record<CardVariant, string> = {
  default: 'rounded-lg border border-border bg-card shadow-sm',
  highlighted: 'rounded-lg border border-primary bg-primary-soft shadow-sm',
  flat: 'rounded-lg border border-border bg-card',
  compact: 'rounded-md border border-border bg-background-subtle',
  interactive: 'rounded-lg border border-border bg-card shadow-sm active:opacity-95',
};
export function Card({ className, variant = 'default', style, ...props }: ViewProps & { className?: string; variant?: CardVariant }) {
  const elevated = variant === 'default' || variant === 'highlighted' || variant === 'interactive';
  return <View className={cn(CARD[variant], className)} style={elevated ? [shadows.sm, style] : style} {...props} />;
}

/* ---- Badge ---------------------------------------------------------------- */
export type BadgeVariant = 'default' | 'neutral' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'destructive';
const BADGE_BOX: Record<BadgeVariant, string> = {
  default: 'bg-primary',
  neutral: 'bg-muted border border-border',
  secondary: 'bg-muted',
  success: 'bg-success-subtle border border-success/30',
  warning: 'bg-warning-subtle border border-warning/30',
  danger: 'bg-error-subtle border border-error/30',
  info: 'bg-info-subtle border border-info/30',
  accent: 'bg-info-subtle border border-info/30',
  destructive: 'bg-destructive',
};
const BADGE_TEXT: Record<BadgeVariant, string> = {
  default: 'text-primary-foreground',
  neutral: 'text-foreground-secondary',
  secondary: 'text-foreground',
  success: 'text-success-foreground',
  warning: 'text-warning-foreground',
  danger: 'text-error-foreground',
  info: 'text-info-foreground',
  accent: 'text-info-foreground',
  destructive: 'text-white',
};
export function Badge({ children, variant = 'default', className }: { children: ReactNode; variant?: BadgeVariant; className?: string }) {
  return (
    <View className={cn('self-start rounded-md px-2 py-0.5', BADGE_BOX[variant], className)}>
      <Text className={cn('text-[10px] font-semibold uppercase tracking-wider', BADGE_TEXT[variant])}>{children}</Text>
    </View>
  );
}

/* ---- Chip ----------------------------------------------------------------- */
export function Chip({
  children,
  selected,
  onPress,
  icon,
  className,
}: {
  children: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1.5 rounded-full border px-3 py-1.5',
        selected ? 'border-primary bg-primary-soft' : 'border-border bg-card',
        className
      )}
    >
      {icon}
      <Text className={cn('text-xs font-medium', selected ? 'text-primary-soft-foreground' : 'text-foreground')}>
        {children}
      </Text>
    </Pressable>
  );
}

/* ---- Input ---------------------------------------------------------------- */
export function Input({ className, editable = true, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      editable={editable}
      placeholderTextColor={colors.foregroundSecondary}
      className={cn(
        'h-11 w-full rounded-md border border-border px-3 text-sm text-foreground',
        editable ? 'bg-card' : 'bg-background-subtle text-foreground-secondary',
        className
      )}
      {...props}
    />
  );
}

/* ---- SearchField ---------------------------------------------------------- */
// Display mode (onPress → navigate) or editable (value + onChangeText).
export function SearchField({
  placeholder = 'Search',
  value,
  onChangeText,
  onPress,
  autoFocus,
  className,
}: {
  placeholder?: string;
  value?: string;
  onChangeText?: (t: string) => void;
  onPress?: () => void;
  autoFocus?: boolean;
  className?: string;
}) {
  const inner = (
    <View className={cn('h-11 flex-row items-center gap-2 rounded-lg border border-border bg-card px-3', className)}>
      <SearchIcon size={18} color={colors.primary} />
      {onChangeText ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.foregroundSecondary}
          autoFocus={autoFocus}
          className="flex-1 text-sm text-foreground"
        />
      ) : (
        <Text className="flex-1 text-sm text-foreground-secondary">{placeholder}</Text>
      )}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

/* ---- EmptyState ----------------------------------------------------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-16">
      {icon != null && (
        <View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          {typeof icon === 'string' ? <Text className="text-3xl">{icon}</Text> : icon}
        </View>
      )}
      <Text className="text-base font-semibold text-foreground">{title}</Text>
      {description && <Text className="mt-1 max-w-xs text-center text-sm text-foreground-secondary">{description}</Text>}
      {action && <View className="mt-5">{action}</View>}
    </View>
  );
}

/* ---- SelectableCard ------------------------------------------------------- */
export function SelectableCard({
  selected,
  radio,
  onPress,
  children,
  className,
}: {
  selected?: boolean;
  radio?: boolean;
  onPress?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'w-full rounded-lg border p-3',
        selected ? 'border-primary bg-primary-soft' : 'border-border bg-card',
        className
      )}
    >
      {radio && (
        <View
          className={cn(
            'absolute right-3 top-3 h-5 w-5 items-center justify-center rounded-full border-2',
            selected ? 'border-primary' : 'border-border'
          )}
        >
          {selected && <View className="h-2.5 w-2.5 rounded-full bg-primary" />}
        </View>
      )}
      {children}
    </Pressable>
  );
}

/* ---- SegmentedControl ----------------------------------------------------- */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <View className={cn('flex-row gap-1 rounded-lg bg-muted p-1', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={cn('flex-1 flex-row items-center justify-center gap-1.5 rounded-md py-2', active && 'bg-card shadow-sm')}
          >
            {opt.icon}
            <Text className={cn('text-sm font-medium', active ? 'text-foreground' : 'text-foreground-secondary')}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---- Switch --------------------------------------------------------------- */
export function Switch({ checked, onCheckedChange, disabled }: { checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <RNSwitch
      value={checked}
      onValueChange={onCheckedChange}
      disabled={disabled}
      trackColor={{ true: colors.primary, false: '#d1d5db' }}
      thumbColor={colors.white}
    />
  );
}

/* ---- QtyStepper ----------------------------------------------------------- */
export function QtyStepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  tone = 'neutral',
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  tone?: 'neutral' | 'soft';
  className?: string;
}) {
  const soft = tone === 'soft';
  return (
    <View className={cn('h-9 flex-row items-center overflow-hidden rounded-md', soft ? 'bg-primary-soft' : 'border border-border bg-card', className)}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn('h-9 flex-1 items-center justify-center', value <= min && 'opacity-40')}
      >
        <Text className={cn('text-lg font-medium', soft ? 'text-primary-soft-foreground' : 'text-primary')}>−</Text>
      </Pressable>
      <Text className="min-w-8 text-center text-sm font-semibold text-foreground">{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn('h-9 flex-1 items-center justify-center', value >= max && 'opacity-40')}
      >
        <Text className={cn('text-lg font-medium', soft ? 'text-primary-soft-foreground' : 'text-primary')}>+</Text>
      </Pressable>
    </View>
  );
}

/* ---- PriceLabel ----------------------------------------------------------- */
import { formatInr } from '../lib/format';
export function PriceLabel({
  price,
  mrp,
  suffix,
  size = 'sm',
  align = 'end',
}: {
  price: number;
  mrp?: number;
  suffix?: string;
  size?: 'sm' | 'lg';
  align?: 'start' | 'end';
}) {
  const showMrp = mrp != null && mrp > price;
  return (
    <View className={align === 'end' ? 'items-end' : 'items-start'}>
      {showMrp && (
        <Text className="text-xs text-foreground-secondary">
          MRP <Text className="line-through">{formatInr(mrp)}</Text>
        </Text>
      )}
      <Text className={cn('font-bold text-foreground', size === 'lg' ? 'text-lg' : 'text-sm')}>
        {formatInr(price)}
        {suffix && <Text className="text-xs font-normal text-foreground-secondary">{suffix}</Text>}
      </Text>
    </View>
  );
}

/* ---- ScreenHeader --------------------------------------------------------- */
// Standard pushed-screen header: back chevron + title/subtitle + optional right slot.
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3" style={shadows.sm}>
      {onBack && (
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70" accessibilityLabel="Back">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
      )}
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-xs text-foreground-secondary" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}

export { ScrollView };
