import { View, Text } from 'react-native';
import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      {icon ? (
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Text className="text-3xl">{icon}</Text>
        </View>
      ) : null}
      <Text className="mt-3 text-base font-semibold text-foreground">{title}</Text>
      {description ? <Text className="mt-1 text-center text-sm text-foreground-secondary">{description}</Text> : null}
      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
}
