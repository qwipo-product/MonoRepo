import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Phone, MapPin } from '../../lib/icons';
import { colors, shadows } from '../../lib/theme';

/* Shared shop/customer card — one look for Tasks + Customers lists. */
export function ShopCard({
  badge,
  title,
  subtitle,
  address,
  topRight,
  footer,
  onOpen,
}: {
  badge: ReactNode;
  title: string;
  subtitle: string;
  address: string;
  mobile: string;
  lat: number;
  lng: number;
  topRight?: ReactNode;
  footer?: ReactNode;
  onOpen: () => void;
}) {
  return (
    <View className="rounded-lg border border-border bg-card p-3" style={shadows.sm}>
      <Pressable onPress={onOpen} className="flex-row items-start gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary-soft">
          <Text className="text-sm font-bold text-primary">{badge}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="min-w-0 flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>{title}</Text>
            {topRight}
          </View>
          <Text className="mt-0.5 text-xs text-foreground-secondary" numberOfLines={1}>{subtitle}</Text>
          <Text className="mt-1 text-xs text-foreground-secondary">{address}</Text>
        </View>
      </Pressable>

      <View className="mt-2.5 flex-row gap-2 border-t border-border pt-2.5">
        <View className="flex-1 flex-row items-center justify-center gap-1.5 rounded-md bg-muted py-2">
          <Phone size={14} color={colors.foreground} />
          <Text className="text-xs font-medium text-foreground">Call</Text>
        </View>
        <View className="flex-1 flex-row items-center justify-center gap-1.5 rounded-md bg-muted py-2">
          <MapPin size={14} color={colors.foreground} />
          <Text className="text-xs font-medium text-foreground">Map</Text>
        </View>
        <Pressable onPress={onOpen} className="flex-1 items-center justify-center rounded-md bg-primary py-2 active:opacity-80">
          <Text className="text-xs font-semibold text-primary-foreground">Details</Text>
        </Pressable>
      </View>

      {footer && <View className="mt-2 border-t border-border pt-2">{footer}</View>}
    </View>
  );
}
