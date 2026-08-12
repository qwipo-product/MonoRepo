import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBadge, type OrderStatus } from './StatusBadge';
import { formatInrExact } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { ChevronRight, Copy, Check } from '../lib/icons';

/* The one order-list card (My Orders reference layout). Optional slots for
   details link, actions, and a hint line. */
export function OrderListCard({
  title,
  orderId,
  status,
  statusLabel,
  meta,
  total,
  totalLabel = 'Grand total',
  rightLabel,
  rightValue,
  onOpenDetails,
  actions,
  hint,
}: {
  title: string;
  orderId: string;
  status: OrderStatus;
  statusLabel: string;
  meta?: ReactNode;
  total: number;
  totalLabel?: string;
  rightLabel?: string;
  rightValue?: ReactNode;
  onOpenDetails?: () => void;
  actions?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <View className="rounded-lg border border-border bg-card p-3" style={shadows.sm}>
      <View className="flex-row items-center justify-between gap-2">
        {onOpenDetails ? (
          <Pressable className="min-w-0 flex-1" onPress={onOpenDetails}>
            <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{title}</Text>
          </Pressable>
        ) : (
          <Text className="min-w-0 flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>{title}</Text>
        )}
        <StatusBadge status={status} label={statusLabel} />
      </View>

      {meta != null && (typeof meta === 'string' ? <Text className="mt-1 text-xs text-foreground-secondary">{meta}</Text> : <View className="mt-1">{meta}</View>)}

      <View className="mt-2 flex-row items-center justify-between gap-2">
        <CopyChip value={orderId} />
        {onOpenDetails && (
          <Pressable className="flex-row items-center gap-0.5" onPress={onOpenDetails}>
            <Text className="text-sm font-semibold text-primary">Order details</Text>
            <ChevronRight size={15} color={colors.primary} />
          </Pressable>
        )}
      </View>

      <View className="mt-2 flex-row items-center justify-between rounded-md bg-background-subtle p-2.5">
        <View>
          <Text className="text-[11px] text-foreground-secondary">{totalLabel}</Text>
          <Text className="text-sm font-semibold text-foreground">{formatInrExact(total)}</Text>
        </View>
        {rightLabel && (
          <View className="items-end">
            <Text className="text-[11px] text-foreground-secondary">{rightLabel}</Text>
            {typeof rightValue === 'string' ? <Text className="text-sm font-medium text-foreground">{rightValue}</Text> : rightValue}
          </View>
        )}
      </View>

      {actions && <View className="mt-3">{actions}</View>}
      {hint && (typeof hint === 'string' ? <Text className="mt-2 text-[11px] text-foreground-secondary">{hint}</Text> : <View className="mt-2">{hint}</View>)}
    </View>
  );
}

/* Tap toggles a check for 1.5s (mockup — no real clipboard write). */
export function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Pressable
      onPress={() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex-row items-center gap-1.5 rounded-md bg-muted px-2 py-1"
    >
      <Text className="text-xs font-medium text-foreground">{value}</Text>
      {copied ? <Check size={13} color={colors.successForeground} /> : <Copy size={13} color={colors.foregroundSecondary} />}
    </Pressable>
  );
}
