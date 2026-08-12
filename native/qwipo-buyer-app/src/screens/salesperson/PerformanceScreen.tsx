import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ScreenHeader } from '../../components/ui';
import { cn, formatInrExact } from '../../lib/format';
import { colors } from '../../lib/theme';
import { CalendarDays } from '../../lib/icons';
import { dayPerformanceFor, MONTH_PERFORMANCE, PERFORMANCE_TODAY } from '../../data/salesperson';
import { formatDate } from '../../lib/date';

const DATES = [PERFORMANCE_TODAY, '2026-08-09'];

export function PerformanceScreen({ onBack }: { onBack: () => void }) {
  const [idx, setIdx] = useState(0);
  const date = DATES[idx];
  const p = dayPerformanceFor(date);
  const m = MONTH_PERFORMANCE;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Performance" onBack={onBack} />
      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Pressable onPress={() => setIdx((i) => (i + 1) % DATES.length)} className="flex-row items-center justify-between rounded-lg border border-border bg-card p-4" style={undefined}>
          <Text className="text-sm font-medium text-foreground">Selected date</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-semibold text-foreground">{formatDate(date)}</Text>
            <CalendarDays size={16} color={colors.primary} />
          </View>
        </Pressable>

        <View className="rounded-lg border border-border bg-card">
          <Group title="Revenue">
            <Pair label="Revenue" achieved={p.dayRevenueAchieved} target={p.dayRevenueTarget} money />
            <Pair label="Task revenue" achieved={p.taskRevenueAchieved} target={p.taskRevenueTarget} money />
          </Group>
          <Group title="Tasks">
            <Pair label="Tasks visited" achieved={p.visitedCount} target={p.assignedTasks} />
            <Pair label="Buying customers" achieved={p.buyingCountAchieved} target={p.buyingCountTarget} />
            <Pair label="Non-buying customers" achieved={p.nonBuyingAchieved} target={p.nonBuyingTarget} />
          </Group>
          <Group title="Revenue split">
            <Row label="Buying revenue" value={formatInrExact(p.buyingRevenueAchieved)} />
            <Row label="Non-buying revenue" value={formatInrExact(p.nonBuyingRevenueAchieved)} />
          </Group>
          <Group title="Allowances" last>
            <Row label="Petrol allowance" value={formatInrExact(p.petrolAllowance)} />
            <Row label="Incentive allowance" value={formatInrExact(p.incentiveAllowance)} />
          </Group>
        </View>

        <View className="rounded-lg border border-border bg-card">
          <Text className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">Monthly performance · {m.month} {m.year}</Text>
          <View className="p-4">
            <Row label="MTD incentive allowance" value={formatInrExact(m.mtdIncentiveAllowance)} />
            <Row label="MTD petrol allowance" value={formatInrExact(m.mtdPetrolAllowance)} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Group({ title, children, last }: { title: string; children: ReactNode; last?: boolean }) {
  return (
    <View className={cn('p-4', !last && 'border-b border-border')}>
      <Text className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">{title}</Text>
      <View className="mt-2 gap-2.5">{children}</View>
    </View>
  );
}

function Pair({ label, achieved, target, money }: { label: string; achieved: number; target: number; money?: boolean }) {
  const fmt = (n: number) => (money ? formatInrExact(n) : String(n));
  const pct = target ? Math.min(100, (achieved / target) * 100) : 0;
  const hit = achieved >= target && target > 0;
  return (
    <View>
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="text-sm text-foreground">{label}</Text>
        <Text className="text-xs text-foreground-secondary">
          <Text className={cn('text-sm font-semibold', hit ? 'text-success-foreground' : 'text-foreground')}>{fmt(achieved)}</Text> / {fmt(target)}
        </Text>
      </View>
      <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <View className={cn('h-full rounded-full', hit ? 'bg-success' : 'bg-primary')} style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between gap-3 py-0.5">
      <Text className="text-sm text-foreground-secondary">{label}</Text>
      <Text className="text-sm font-semibold text-foreground">{value}</Text>
    </View>
  );
}
