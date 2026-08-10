import { useState } from 'react';
import { ChevronLeft, CalendarClock, CheckCircle2, LogIn, LogOut, CalendarDays } from 'lucide-react';
import { Button, Sheet, Input, cn } from '@mockups/ui';
import {
  ATTENDANCE,
  LEAVES,
  LEAVE_STATUS_LABEL,
  SALESPERSON,
  type AttendanceStatus,
  type Leave,
} from '../../data/salesperson';

/* Salesperson · Attendance — the day's check-in/out with a live status line, a
   month summary, plus Apply Leave and Leave List sheets. Mock: check-in/out and
   leave submission mutate local state so the flow clicks through. */

const now = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

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

  const checkIn = () => {
    setCheckInTime(now());
    setStatus('checked_in');
  };
  const checkOut = () => {
    setCheckOutTime(now());
    setStatus('checked_out');
  };

  const submitLeave = () => {
    if (!reason.trim() || !leaveDate) return;
    setLeaves((prev) => [{ id: `lv${prev.length + 1}`, appliedOn: leaveDate, reason: reason.trim(), status: 'pending' }, ...prev]);
    setReason('');
    setLeaveDate('');
    setApplyOpen(false);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-foreground active:scale-[0.98]"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight">Attendance</h1>
        <button
          onClick={() => setListOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground active:scale-[0.98]"
        >
          <CalendarDays size={14} /> Leave list
        </button>
      </header>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto bg-background-subtle p-4">
        {/* status */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarClock className="h-4 w-4 text-primary" />
            {SALESPERSON.name}
          </div>
          <div
            className={cn(
              'mt-3 flex items-center gap-2 rounded-md p-2.5 text-sm font-medium',
              done ? 'bg-success-subtle text-success-foreground' : 'bg-primary-soft text-primary'
            )}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {STATUS_LINE[status]({ checkInTime, checkOutTime })}
          </div>

          {/* check-in / check-out timeline */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stamp label="Check-in" time={checkInTime} />
            <Stamp label="Check-out" time={checkOutTime} />
          </div>

          <div className="mt-3">
            {canCheckIn ? (
              <Button fullWidth onClick={checkIn}>
                <LogIn size={16} /> Check-in
              </Button>
            ) : done ? (
              <Button fullWidth variant="secondary" disabled>
                Day complete
              </Button>
            ) : (
              <Button fullWidth onClick={checkOut}>
                <LogOut size={16} /> Check-out
              </Button>
            )}
          </div>
        </div>

        {/* month summary */}
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">
            {ATTENDANCE.month}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            <Stat label="Working" value={ATTENDANCE.workingDays} />
            <Stat label="Present" value={ATTENDANCE.presentDays} tone="success" />
            <Stat label="Absent" value={ATTENDANCE.absentDays} tone="error" />
            <Stat label="Leave" value={ATTENDANCE.leaveDays} tone="warning" />
          </div>
        </div>

        <Button fullWidth variant="secondary" onClick={() => setApplyOpen(true)}>
          Apply leave
        </Button>
      </div>

      {/* apply leave */}
      <Sheet
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title="Apply leave"
        footer={
          <Button fullWidth disabled={!reason.trim() || !leaveDate} onClick={submitLeave}>
            Submit request
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="leave-date" className="text-sm font-medium text-foreground">Leave date</label>
            <Input id="leave-date" type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="leave-reason" className="text-sm font-medium text-foreground">Reason</label>
            <Input
              id="leave-reason"
              placeholder="Reason for leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
      </Sheet>

      {/* leave list */}
      <Sheet open={listOpen} onClose={() => setListOpen(false)} title="Leave requests">
        <div className="space-y-2">
          {leaves.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{l.appliedOn}</div>
                <div className="truncate text-xs text-foreground-secondary">{l.reason}</div>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium',
                  l.status === 'accepted'
                    ? 'bg-success-subtle text-success-foreground'
                    : l.status === 'rejected'
                      ? 'bg-error-subtle text-error'
                      : 'bg-muted text-foreground-secondary'
                )}
              >
                {LEAVE_STATUS_LABEL[l.status]}
              </span>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function Stamp({ label, time }: { label: string; time: string | null }) {
  return (
    <div className="rounded-md bg-background-subtle p-2.5">
      <div className="text-[11px] text-foreground-secondary">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{time ?? '—'}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'error' | 'warning' }) {
  const color =
    tone === 'success'
      ? 'text-success-foreground'
      : tone === 'error'
        ? 'text-error'
        : tone === 'warning'
          ? 'text-warning-foreground'
          : 'text-foreground';
  return (
    <div>
      <div className={cn('text-lg font-bold tabular-nums', color)}>{value}</div>
      <div className="text-[11px] text-foreground-secondary">{label}</div>
    </div>
  );
}
