import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable className="flex-1 bg-overlay" onPress={onClose} />
      <View className="absolute bottom-0 max-h-[90%] w-full rounded-t-xl bg-card">
        <View className="mx-auto mt-2 h-1 w-9 rounded-full bg-muted" />
        {title ? (
          <View className="flex-row items-center gap-3 border-b border-border p-4">
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">{title}</Text>
              {subtitle ? <Text className="text-xs text-foreground-secondary">{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} className="h-9 w-9 items-center justify-center rounded-md">
              <X size={18} color="#717182" />
            </Pressable>
          </View>
        ) : null}
        <ScrollView contentContainerClassName="p-4">{children}</ScrollView>
        {footer ? (
          <View className="border-t border-border p-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            {footer}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
