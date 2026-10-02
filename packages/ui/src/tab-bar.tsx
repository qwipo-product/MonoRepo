// TabBar — the phone's bottom tab bar. Shown on root screens only; pushed and
// detail screens carry their own header instead. Each app passes its own tabs.
//
//   <TabBar tabs={[{ id: 'home', label: 'Home', icon: Home }, …]}
//           active={screen} onSelect={go} />

import type { ComponentType } from 'react';
import { cn } from './cn';

export interface TabBarTab<Id extends string = string> {
  id: Id;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Count bubble on the icon (cart items, new orders). Hidden at 0. */
  badge?: number;
}

export interface TabBarProps<Id extends string = string> {
  tabs: readonly TabBarTab<Id>[];
  active: string;
  onSelect: (id: Id) => void;
}

export function TabBar<Id extends string>({ tabs, active, onSelect }: TabBarProps<Id>) {
  return (
    <nav
      className="grid flex-shrink-0 border-t border-border bg-card pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map(({ id, icon: Icon, label, badge = 0 }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={cn(
            // The colour eases rather than snapping, and the tab dips under
            // the thumb — the only feedback a tap on a flat icon can give.
            'relative flex min-h-14 flex-col items-center justify-center gap-1 transition-colors active:scale-95',
            active === id ? 'text-primary' : 'text-foreground-secondary'
          )}
        >
          <span className="relative">
            <Icon className="h-5 w-5" />
            {badge > 0 && (
              <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-semibold text-white">
                {badge}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
