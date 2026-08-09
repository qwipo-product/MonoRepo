import { Moon, Sun } from 'lucide-react';
import { cn } from '@mockups/ui';
import { SCREEN_GROUPS, type ScreenId } from './screenIndex';

/* Review-only navigator: numbered, grouped index of every screen. Click any to
   jump straight to it (and the URL updates to ?screen=<id> for shareable
   links). Not shipped in either surface. */
export default function FlowIndex({
  active,
  built,
  onPick,
  isDark,
  onToggleTheme,
}: {
  active: ScreenId;
  built: Set<ScreenId>;
  onPick: (id: ScreenId) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  let n = 0;
  return (
    <aside className="max-h-dvh w-80 shrink-0 overflow-y-auto p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium">
          <span className="h-2 w-2 rounded-full bg-success" />
          Qwipo · B2B Commerce
        </div>
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card text-foreground hover:bg-muted"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <h1 className="mt-3 text-3xl font-bold tracking-tight">Qwipo Buyer App</h1>
      <p className="mt-1 text-sm text-foreground-secondary">Click any screen to jump to it.</p>

      <div className="mt-5 space-y-5">
        {SCREEN_GROUPS.map((group) => (
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
