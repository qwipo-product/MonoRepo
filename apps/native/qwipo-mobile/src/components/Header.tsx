import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';

export function Header({
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
    <SafeAreaView edges={['top']} className="bg-card">
      <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
        {onBack ? (
          <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-80">
            <ChevronLeft size={18} color="#1f2024" />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">{title}</Text>
          {subtitle ? <Text className="text-xs text-foreground-secondary">{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </SafeAreaView>
  );
}
