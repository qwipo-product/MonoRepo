// BottomSheet — the one sheet shell (mirrors @mockups/ui Sheet). RN Modal +
// slide-up panel, backdrop tap-to-close, safe-area footer inset, keyboard-aware.
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '../lib/format';
import { colors, shadows } from '../lib/theme';
import { X } from '../lib/icons';

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  icon,
  footer,
  size = 'auto',
  showHandle = true,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  size?: 'auto' | 'tall';
  showHandle?: boolean;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  // Cap the panel to a pixel height (percentage would resolve against the
  // content-sized keyboard wrapper, i.e. be ignored → tall sheets overflow).
  const maxH = Math.round((winH - insets.top) * (size === 'tall' ? 0.9 : 0.85));
  const y = useRef(new Animated.Value(40)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      y.setValue(40);
      fade.setValue(0);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(y, { toValue: 0, damping: 22, stiffness: 240, useNativeDriver: true }),
      ]).start();
    }
  }, [open, y, fade]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={{ flex: 1, backgroundColor: colors.overlay, opacity: fade, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View
            style={[{ transform: [{ translateY: y }], maxHeight: maxH }, shadows.xl]}
            className="overflow-hidden rounded-t-xl bg-card"
          >
            {showHandle && <View className="mx-auto mt-2 h-1 w-9 rounded-full bg-muted" />}

            {(title || icon) && (
              <View className="flex-row items-center gap-3 border-b border-border p-4">
                {icon && <View className="h-9 w-9 items-center justify-center rounded-lg bg-primary-soft">{icon}</View>}
                <View className="min-w-0 flex-1">
                  {title && <Text className="text-base font-semibold text-foreground" numberOfLines={1}>{title}</Text>}
                  {subtitle && <Text className="text-xs text-foreground-secondary" numberOfLines={1}>{subtitle}</Text>}
                </View>
                <Pressable onPress={onClose} className="h-9 w-9 items-center justify-center rounded-md active:bg-muted" accessibilityLabel="Close">
                  <X size={18} color={colors.foregroundSecondary} />
                </Pressable>
              </View>
            )}

            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ padding: 16, paddingBottom: footer ? 16 : Math.max(16, insets.bottom + 8) }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            {footer && <View className="border-t border-border p-4" style={{ paddingBottom: Math.max(16, insets.bottom) }}>{footer}</View>}
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
