import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { EmptyState, ScreenHeader, SearchField } from '../../components/ui';
import { ShopCard } from './ShopCard';
import { cn } from '../../lib/format';
import { colors } from '../../lib/theme';
import { ClipboardList } from '../../lib/icons';
import { TASKS, TASK_STATUS_LABEL, type TaskStatus } from '../../data/salesperson';

const STATUS_TONE: Record<TaskStatus, string> = {
  none: 'bg-muted text-foreground-secondary',
  checked_in: 'bg-primary-soft text-primary',
  interaction_added: 'bg-warning-subtle text-warning-foreground',
  checked_out: 'bg-success-subtle text-success-foreground',
};

export function TaskListScreen({ onBack, onOpenTask }: { onBack: () => void; onOpenTask: (taskId: string) => void }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const tasks = query ? TASKS.filter((t) => t.customer.businessName.toLowerCase().includes(query) || t.customer.mobile.includes(query)) : TASKS;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Tasks" onBack={onBack} right={<Text className="text-xs text-foreground-secondary">{TASKS.length} shops</Text>} />
      <View className="border-b border-border bg-card px-3 py-2.5">
        <SearchField value={q} onChangeText={setQ} placeholder="Search by shop or mobile" />
      </View>
      {tasks.length === 0 ? (
        <EmptyState icon={<ClipboardList size={28} color={colors.foregroundSecondary} />} title="No Shops Found" description="No assigned shop matches your search." />
      ) : (
        <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
          {tasks.map((t) => (
            <ShopCard
              key={t.id}
              badge={t.stop}
              title={t.customer.businessName}
              subtitle={t.customer.ownerName}
              address={t.customer.address}
              mobile={t.customer.mobile}
              lat={t.customer.lat}
              lng={t.customer.lng}
              topRight={
                <View className={cn('rounded-md px-2 py-0.5', STATUS_TONE[t.status].split(' ')[0])}>
                  <Text className={cn('text-[11px] font-medium', STATUS_TONE[t.status].split(' ')[1])}>{TASK_STATUS_LABEL[t.status]}</Text>
                </View>
              }
              onOpen={() => onOpenTask(t.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
