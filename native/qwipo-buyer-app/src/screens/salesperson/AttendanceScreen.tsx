import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Input, ScreenHeader } from '../../components/ui';
import { Sheet } from '../../components/Sheet';
import { cn } from '../../lib/format';
import { colors } from '../../lib/theme';
import { CalendarClock, CheckCircle2, LogIn, LogOut, CalendarDays } from '../../lib/icons';
import { formatDate } from '../../lib/date';
import { ATTENDANCE, LEAVES, LEAVE_STATUS_LABEL, SALESPERSON, type AttendanceStatus, type Leave } from '../../data/salesperson';

// Hermes-safe time (no Intl options).
const now = () => {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};

const STATUS_LINE: Record<AttendanceStatus, (a: { checkInTime: string | null; checkOutTime: string | null }) => string> = {
  none: () => 'Not checked in yet',
  checked_in: (a) => `Checked in at ${a.checkInTime}`,
  checked_out: (a) => `Checked out at ${a.checkOutTime}`,
  early_logout_pending: () => 'Awaiting sales lead approval',
  early_logout_accepted: () => 'Early check-out approved by sales lead',
  early_logout_rejected: () => 'Early check-out rejected by sales lead',
  leave_accepted: () => 'Leave granted by sales lead',
};

export function AttendanceScreen({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<AttendanceStatus>(ATTENDANCE.status);
  const [checkInTime, setCheckInTime] = useState<string | null>(ATTENDANCE.checkInTime);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(ATTENDANCE.checkOutTime);
  const [leaves, setLeaves] = useState<Leave[]>(LEAVES);
  const [applyOpen, setApplyOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [leaveDate, setLeaveDate] = useState('');

  const done = status === 'checked_out';
  const canCheckIn = status === 'none';

  const submitLeave = () => {
    if (!reason.trim() || !leaveDate) return;
    setLeaves((prev) => [{ id: `lv${prev.length + 1}`, appliedOn: leaveDate, reason: reason.trim(), status: 'pending' }, ...prev]);
    setReason('');
    setLeaveDate('');
    setApplyOpen(false);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Attendance"
        onBack={onBack}
        right={
          <Pressable onPress={() => setListOpen(true)} className="flex-row items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5">
            <CalendarDays size={14} color={colors.foreground} />
            <Text className="text-xs font-medium text-foreground">Leave list</Text>
          </Pressable>
        }
      />

      <ScrollView className="flex-1 bg-background-subtle" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="rounded-lg border border-border bg-card p-4">
          <View className="flex-row items-center gap-2">
            <CalendarClock size={16} color={colors.primary} />
            <Text className="text-sm font-semibold text-foreground">{SALESPERSON.name}</Text>
          </View>
          <View className={cn('mt-3 flex-row items-center gap-2 rounded-md p-2.5', done ? 'bg-success-subtle' : 'bg-primary-soft')}>
            <CheckCircle2 size={16} color={done ? colors.successForeground : colors.primary} />
            <Text className={cn('text-sm font-medium', done ? 'text-success-foreground' : 'text-primary')}>{STATUS_LINE[status]({ checkInTime, checkOutTime })}</Text>
          </View>

          <View className="mt-3 flex-row gap-2">
            <Stamp label="Check-in" time={checkInTime} />
            <Stamp label="Check-out" time={checkOutTime} />
          </View>

          <View className="mt-3">
            {canCheckIn ? (
              <Button fullWidth onPress={() => { setCheckInTime(now()); setStatus('checked_in'); }}>
                <LogIn size={16} color={colors.primaryForeground} />
                <Text className="text-sm font-bold text-primary-foreground">Check-in</Text>
              </Button>
            ) : done ? (
              <Button fullWidth variant="secondary" disabled>Day complete</Button>
            ) : (
              <Button fullWidth onPress={() => { setCheckOutTime(now()); setStatus('checked_out'); }}>
                <LogOut size={16} color={colors.primaryForeground} />
                <Text className="text-sm font-bold text-primary-foreground">Check-out</Text>
              </Button>
            )}
          </View>
        </View>

        <View className="rounded-lg border border-border bg-card p-4">
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">{ATTENDANCE.month}</Text>
          <View className="mt-3 flex-row gap-2">
            <Stat label="Working" value={ATTENDANCE.workingDays} />
            <Stat label="Present" value={ATTENDANCE.presentDays} tone="success" />
            <Stat label="Absent" value={ATTENDANCE.absentDays} tone="error" />
            <Stat label="Leave" value={ATTENDANCE.leaveDays} tone="warning" />
          </View>
        </View>

        <Button fullWidth variant="secondary" onPress={() => setApplyOpen(true)}>Apply leave</Button>
      </ScrollView>

      <Sheet open={applyOpen} onClose={() => setApplyOpen(false)} title="Apply leave" footer={<Button fullWidth disabled={!reason.trim() || !leaveDate} onPress={submitLeave}>Submit request</Button>}>
        <View className="gap-3">
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Leave date</Text>
            <Input placeholder="YYYY-MM-DD" value={leaveDate} onChangeText={setLeaveDate} />
          </View>
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Reason</Text>
            <Input placeholder="Reason for leave" value={reason} onChangeText={setReason} />
          </View>
        </View>
      </Sheet>

      <Sheet open={listOpen} onClose={() => setListOpen(false)} title="Leave requests">
        <View className="gap-2">
          {leaves.map((l) => (
            <View key={l.id} className="flex-row items-center justify-between rounded-lg border border-border bg-card p-3">
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-medium text-foreground">{formatDate(l.appliedOn)}</Text>
                <Text className="text-xs text-foreground-secondary" numberOfLines={1}>{l.reason}</Text>
              </View>
              <View className={cn('rounded-md px-2 py-0.5', l.status === 'accepted' ? 'bg-success-subtle' : l.status === 'rejected' ? 'bg-error-subtle' : 'bg-muted')}>
                <Text className={cn('text-[11px] font-medium', l.status === 'accepted' ? 'text-success-foreground' : l.status === 'rejected' ? 'text-error' : 'text-foreground-secondary')}>{LEAVE_STATUS_LABEL[l.status]}</Text>
              </View>
            </View>
          ))}
        </View>
      </Sheet>
    </View>
  );
}

function Stamp({ label, time }: { label: string; time: string | null }) {
  return (
    <View className="flex-1 rounded-md bg-background-subtle p-2.5">
      <Text className="text-[11px] text-foreground-secondary">{label}</Text>
      <Text className="mt-0.5 text-sm font-semibold text-foreground">{time ?? '—'}</Text>
    </View>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'error' | 'warning' }) {
  const color = tone === 'success' ? 'text-success-foreground' : tone === 'error' ? 'text-error' : tone === 'warning' ? 'text-warning-foreground' : 'text-foreground';
  return (
    <View className="flex-1 items-center">
      <Text className={cn('text-lg font-bold', color)}>{value}</Text>
      <Text className="text-[11px] text-foreground-secondary">{label}</Text>
    </View>
  );
}
