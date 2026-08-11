import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { EmptyState } from '../components/ui';
import { colors, shadows } from '../lib/theme';
import { ChevronLeft, Bell } from '../lib/icons';
import { NOTIFICATIONS, type AppNotification } from '../data/notifications';

export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [notifs, setNotifs] = useState<AppNotification[]>(NOTIFICATIONS);
  const unread = notifs.filter((n) => n.unread).length;
  const markAll = () => setNotifs((list) => list.map((n) => ({ ...n, unread: false })));
  const markRead = (id: string) => setNotifs((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)));

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3" style={shadows.sm}>
        <Pressable onPress={onBack} className="h-9 w-9 items-center justify-center rounded-md bg-muted active:opacity-70">
          <ChevronLeft size={18} color={colors.foreground} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-foreground">Notifications</Text>
          <Text className="text-xs text-foreground-secondary">{unread} unread</Text>
        </View>
        {unread > 0 && (
          <Pressable onPress={markAll}>
            <Text className="text-sm font-semibold text-primary">Mark all read</Text>
          </Pressable>
        )}
      </View>

      {notifs.length === 0 ? (
        <EmptyState icon="🔕" title="All caught up" description="You have no notifications." />
      ) : (
        <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 8 }}>
          {notifs.map((n) => (
            <Pressable key={n.id} onPress={() => markRead(n.id)} className="flex-row gap-3 rounded-lg border border-border bg-card p-3" style={shadows.sm}>
              <View className="h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Bell size={16} color={colors.foregroundSecondary} />
              </View>
              <View className="min-w-0 flex-1">
                <View className="flex-row items-start justify-between gap-2">
                  <Text className="flex-1 text-sm font-semibold text-foreground">{n.title}</Text>
                  {n.unread && (
                    <View className="rounded-full bg-primary px-2 py-0.5">
                      <Text className="text-[10px] font-semibold text-primary-foreground">New</Text>
                    </View>
                  )}
                </View>
                <Text className="mt-0.5 text-[11px] text-foreground-secondary">{n.time}</Text>
                <Text className="mt-1 text-xs text-foreground-secondary">{n.body}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
