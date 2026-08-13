import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, EmptyState, ScreenHeader, SegmentedControl } from '../../components/ui';
import { Sheet } from '../../components/Sheet';
import { OrdersPanel, RecoPanel } from './customerPanels';
import { colors, shadows } from '../../lib/theme';
import { Phone, MapPin, CheckCircle2, LogIn, LogOut, MessageSquarePlus, Plus } from '../../lib/icons';
import type { Order } from '../../data/orders';
import { formatDate } from '../../lib/date';
import { TASKS, INTERACTIONS, TASK_STATUS_LABEL, type Task, type TaskStatus, type Interaction } from '../../data/salesperson';

type Tab = 'info' | 'orders' | 'reco' | 'interaction';

export function TaskDetailsScreen({
  taskId,
  onBack,
  onCreateInteraction,
  onOpenOrder,
}: {
  taskId: string;
  onBack: () => void;
  onCreateInteraction: (taskId: string) => void;
  onOpenOrder: (order: Order) => void;
}) {
  const task = TASKS.find((t) => t.id === taskId) ?? TASKS[0];
  const [tab, setTab] = useState<Tab>('info');
  const [status, setStatus] = useState<TaskStatus>(task.status);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={`Stop ${task.stop} · ${task.customer.businessName}`} onBack={onBack} />
      <View className="border-b border-border bg-card px-3 py-2.5">
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[{ value: 'info', label: 'Info' }, { value: 'orders', label: 'Orders' }, { value: 'reco', label: 'Reco' }, { value: 'interaction', label: 'Visits' }]}
        />
      </View>

      {tab === 'info' && <InfoTab task={task} status={status} setStatus={setStatus} onCreateInteraction={() => onCreateInteraction(task.id)} />}
      {tab === 'orders' && <OrdersPanel customerId={task.customer.id} businessName={task.customer.businessName} onOpenOrder={onOpenOrder} />}
      {tab === 'reco' && <RecoPanel customerId={task.customer.id} />}
      {tab === 'interaction' && <InteractionTab customerId={task.customer.id} onCreate={() => onCreateInteraction(task.id)} />}
    </View>
  );
}

function InfoTab({ task, status, setStatus, onCreateInteraction }: { task: Task; status: TaskStatus; setStatus: (s: TaskStatus) => void; onCreateInteraction: () => void }) {
  const c = task.customer;
  return (
    <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="rounded-lg border border-border bg-card p-4" style={shadows.sm}>
        <Text className="text-sm font-semibold text-foreground">{c.businessName}</Text>
        <Text className="mt-0.5 text-xs text-foreground-secondary">{c.ownerName}</Text>
        <View className="mt-2 flex-row items-start gap-2">
          <MapPin size={14} color={colors.foregroundSecondary} />
          <Text className="flex-1 text-xs text-foreground-secondary">{c.address}</Text>
        </View>
        <View className="mt-3 flex-row gap-2">
          <View className="flex-1 flex-row items-center justify-center gap-1.5 rounded-md bg-muted py-2">
            <Phone size={14} color={colors.foreground} />
            <Text className="text-xs font-medium text-foreground">{c.mobile}</Text>
          </View>
          <View className="flex-1 flex-row items-center justify-center gap-1.5 rounded-md bg-muted py-2">
            <MapPin size={14} color={colors.foreground} />
            <Text className="text-xs font-medium text-foreground">Navigate</Text>
          </View>
        </View>
      </View>

      <View className="rounded-lg border border-border bg-card p-4" style={shadows.sm}>
        <View className="flex-row items-center gap-2 rounded-md bg-primary-soft p-2.5">
          <CheckCircle2 size={16} color={colors.primary} />
          <Text className="text-sm font-medium text-primary">{TASK_STATUS_LABEL[status]}</Text>
        </View>
        <View className="mt-3">
          {status === 'none' ? (
            <Button fullWidth onPress={() => setStatus('checked_in')}>
              <LogIn size={16} color={colors.primaryForeground} />
              <Text className="text-sm font-bold text-primary-foreground">Check-in</Text>
            </Button>
          ) : status === 'checked_in' ? (
            <Button fullWidth onPress={onCreateInteraction}>
              <MessageSquarePlus size={16} color={colors.primaryForeground} />
              <Text className="text-sm font-bold text-primary-foreground">Add interaction</Text>
            </Button>
          ) : status === 'interaction_added' ? (
            <Button fullWidth onPress={() => setStatus('checked_out')}>
              <LogOut size={16} color={colors.primaryForeground} />
              <Text className="text-sm font-bold text-primary-foreground">Check-out</Text>
            </Button>
          ) : (
            <Button fullWidth variant="secondary" disabled>Visit complete</Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function InteractionTab({ customerId, onCreate }: { customerId: string; onCreate: () => void }) {
  const [detail, setDetail] = useState<Interaction | null>(null);
  const list = INTERACTIONS[customerId] ?? [];
  return (
    <View className="flex-1">
      {list.length === 0 ? (
        <EmptyState icon={<MessageSquarePlus size={28} color={colors.foregroundSecondary} />} title="No Interactions Found" />
      ) : (
        <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 12, gap: 12 }}>
          {list.map((i) => (
            <Pressable key={i.id} onPress={() => setDetail(i)} className="rounded-lg border border-border bg-card p-3" style={shadows.sm}>
              <View className="flex-row items-center justify-between gap-2">
                <Text className="min-w-0 flex-1 text-sm font-medium text-foreground" numberOfLines={1}>{i.category}</Text>
                <Text className="text-xs text-foreground-secondary">{formatDate(i.date)}</Text>
              </View>
              <Text className="mt-1 text-xs text-foreground-secondary" numberOfLines={2}>{i.comments}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View className="border-t border-border bg-card p-3" style={shadows.barTop}>
        <Button fullWidth onPress={onCreate}>
          <Plus size={16} color={colors.primaryForeground} />
          <Text className="text-sm font-bold text-primary-foreground">Create interaction</Text>
        </Button>
      </View>

      <Sheet open={!!detail} onClose={() => setDetail(null)} title="Interaction details" subtitle={detail ? formatDate(detail.date) : undefined}>
        {detail && (
          <View className="gap-3">
            <Field label="Category" value={detail.category} />
            <Field label="Comments" value={detail.comments} />
          </View>
        )}
      </Sheet>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-xs font-medium text-foreground-secondary">{label}</Text>
      <Text className="mt-0.5 text-sm text-foreground">{value}</Text>
    </View>
  );
}
