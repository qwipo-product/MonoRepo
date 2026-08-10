import { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Header } from '../components/Header';
import { Chip } from '../ui/Chip';
import { NOTIFICATIONS, type NotifKind } from '../data/notifications';

type Filter = 'all' | NotifKind;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'order', label: 'Orders' },
  { key: 'offer', label: 'Offers' },
];

export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<Filter>('all');
  const items = filter === 'all' ? NOTIFICATIONS : NOTIFICATIONS.filter((n) => n.kind === filter);

  return (
    <View className="flex-1 bg-background-subtle">
      <Header title="Notifications" onBack={onBack} />
      <View className="flex-row gap-2 bg-card px-4 pb-3">
        {FILTERS.map((f) => (
          <Chip key={f.key} selected={f.key === filter} onPress={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </View>
      <ScrollView contentContainerClassName="gap-2 p-3">
        {items.map((n) => (
          <View key={n.id} className="flex-row gap-3 rounded-lg border border-border bg-card p-3">
            <View className="h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Text className="text-lg">{n.icon}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 text-sm font-semibold text-foreground">{n.title}</Text>
                {n.unread ? <View className="h-2 w-2 rounded-full bg-primary" /> : null}
              </View>
              <Text className="mt-0.5 text-xs text-foreground-secondary">{n.body}</Text>
              <Text className="mt-1 text-[10px] text-foreground-tertiary">{n.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
