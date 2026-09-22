import { Moon, Sun, UserRound, Camera, PackageOpen } from 'lucide-react';
import { cn } from '@mockups/ui';
import { visibleGroups, type ScreenId } from './screenIndex';
import { ShellSwitcher, type Shell } from './ShellSwitcher';
import { RoleSwitcher, type Role } from './RoleSwitcher';
import { DeviceSwitcher, type Device, type Orientation } from './DeviceSwitcher';

/* Review-only navigator: switch mockup surface (Buyer App / Paytm Mini) at the
   top, then click any screen to jump to it. The URL tracks ?shell= & ?screen=
   for shareable links. Not shipped in either surface. */
export default function FlowIndex({
  active,
  built,
  onPick,
  shell,
  onShellChange,
  role,
  onRoleChange,
  device,
  onDeviceChange,
  orientation,
  onOrientationChange,
  frameScale,
  isDark,
  onToggleTheme,
  onCapture,
  emptyDemo,
  onEmptyDemoChange,
}: {
  active: ScreenId;
  built: Set<ScreenId>;
  onPick: (id: ScreenId) => void;
  shell: Shell;
  onShellChange: (s: Shell) => void;
  role: Role;
  onRoleChange: (r: Role) => void;
  device: Device;
  onDeviceChange: (d: Device) => void;
  orientation: Orientation;
  onOrientationChange: (o: Orientation) => void;
  frameScale: number;
  isDark: boolean;
  onToggleTheme: () => void;
  /** Snapshot the phone bezel to a PNG download. */
  onCapture: () => void;
  /** Force every list empty, to review the zero-data designs. */
  emptyDemo: boolean;
  onEmptyDemoChange: (v: boolean) => void;
}) {
  let n = 0;
  // Paytm mini is customer-only — no salesperson persona there.
  const effectiveRole = shell === 'paytm' ? 'customer' : role;
  return (
    <aside className="no-scrollbar max-h-dvh w-80 shrink-0 overflow-y-auto p-6">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ShellSwitcher value={shell} onChange={onShellChange} />
        </div>
        <button
          onClick={onCapture}
          aria-label="Download screenshot"
          title="Screenshot the phone → Downloads"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground hover:bg-muted"
        >
          <Camera size={16} />
        </button>
        <button
          onClick={() => onEmptyDemoChange(!emptyDemo)}
          aria-label="Toggle empty states"
          aria-pressed={emptyDemo}
          title="Show every screen with no data"
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-md border text-foreground hover:bg-muted',
            emptyDemo ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-card'
          )}
        >
          <PackageOpen size={16} />
        </button>
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground hover:bg-muted"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {emptyDemo && (
        <p className="mt-2 rounded-md border border-primary-soft bg-primary-soft px-2.5 py-1.5 text-xs text-primary">
          Empty-state mode: every list renders with no data.
        </p>
      )}

      {/* persona: Customer vs Salesperson (Qwipo app only — Paytm is customer-only) */}
      {shell !== 'paytm' && (
        <div className="mt-2">
          <RoleSwitcher value={role} onChange={onRoleChange} />
        </div>
      )}

      {/* device: pick a frame size + rotate, to review phone & tablet layouts */}
      <div className="mt-2">
        <DeviceSwitcher
          device={device}
          orientation={orientation}
          scale={frameScale}
          onDeviceChange={onDeviceChange}
          onOrientationChange={onOrientationChange}
        />
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {shell === 'paytm' ? 'Qwipo · Paytm Mini' : 'Qwipo Buyer App'}
      </h1>
      <p className="mt-1 text-sm text-foreground-secondary">
        {shell === 'paytm'
          ? 'Same screens, inside the Paytm WebView container.'
          : 'Click any screen to jump to it.'}
      </p>

      {/* Demo credentials — jumps straight to the sign-in screen. Shown on
          both surfaces now that the Paytm mini signs in too. */}
      <button
        onClick={() => onPick('login')}
        className="mt-3 flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left hover:bg-muted"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
          <UserRound size={15} />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-foreground-secondary">
            {effectiveRole === 'salesperson' ? 'Salesperson login' : 'Customer login'}
          </span>
          <span className="block font-mono text-sm font-semibold tabular-nums text-foreground">
            {effectiveRole === 'salesperson' ? '9000000001' : '9876543210'}
          </span>
        </span>
      </button>

      <div className="mt-5 space-y-5">
        {visibleGroups(shell, effectiveRole)
          .map((group) => (
          <div key={group.title}>
            <div className="px-1 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
              {group.title}
            </div>
            <div className="mt-2 space-y-2">
              {group.items.map((item) => {
                n += 1;
                const isActive = active === item.id;
                const isBuilt = built.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => onPick(item.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                      isActive ? 'border-primary bg-primary-soft' : 'border-border bg-card hover:bg-muted',
                      !isBuilt && 'opacity-60'
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-semibold',
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground-secondary'
                      )}
                    >
                      {n}
                    </span>
                    <span className={cn('text-sm font-medium', isActive ? 'text-primary' : 'text-foreground')}>
                      {item.label}
                    </span>
                    {!isBuilt && (
                      <span className="ml-auto text-[10px] uppercase tracking-wider text-foreground-secondary">
                        soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
