import { SCREEN_GROUPS, type ScreenId } from './screenIndex';

/* Review-only sidebar: numbered, grouped index of every screen. Click to jump
   straight to any screen (doc §7 FlowIndex). Not shipped in either surface. */
export default function FlowIndex({
  active,
  built,
  onPick,
}: {
  active: ScreenId;
  built: Set<ScreenId>;
  onPick: (id: ScreenId) => void;
}) {
  let n = 0;
  return (
    <aside className="max-h-dvh w-80 shrink-0 overflow-y-auto p-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Qwipo · B2B Commerce
      </div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Qwipo Buyer App</h1>

      <div className="mt-5 space-y-5">
        {SCREEN_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      isActive ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted'
                    } ${isBuilt ? '' : 'opacity-50'}`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-semibold ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {n}
                    </span>
                    <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {item.label}
                    </span>
                    {!isBuilt && (
                      <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
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
