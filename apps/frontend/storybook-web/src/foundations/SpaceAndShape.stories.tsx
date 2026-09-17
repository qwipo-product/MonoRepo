import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  breakpoints,
  component,
  density,
  elevation,
  motion,
  radius,
  space,
  zIndex,
} from '@mockups/web-tokens';

const meta: Meta = {
  title: 'Foundations/Space & shape',
  parameters: { layout: 'padded' },
};
export default meta;

export const Spacing: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Spacing scale (4px base)</h3>
        <p className="text-xs text-muted-foreground">
          Shared with the mobile layer — re-exported from @mockups/design-tokens.
        </p>
        <div className="space-y-1.5">
          {Object.entries(space).map(([step, px]) => (
            <div key={step} className="flex items-center gap-3">
              <span className="w-10 font-mono text-xs text-muted-foreground">{step}</span>
              <span className="h-4 bg-primary" style={{ width: px || 1 }} />
              <span className="text-xs text-muted-foreground">{px}px</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Density recipes</h3>
        <p className="text-xs text-muted-foreground">
          The application norm — deliberately denser than Material, and denser than the mobile
          layer.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(density).map(([role, cls]) => (
            <div
              key={role}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <span className="text-sm text-foreground">{role}</span>
              <code className="font-mono text-xs text-primary">{cls}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Radii: StoryObj = {
  render: () => (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Tighter than the mobile scale on purpose — a table-cell pill at mobile&apos;s 6px radius
        reads as a lozenge at 20px tall.
      </p>
      <div className="flex flex-wrap gap-4">
        {Object.entries(radius).map(([name, px]) => (
          <div key={name} className="space-y-1 text-center">
            <div
              className="h-20 w-20 border border-border bg-primary/10"
              style={{ borderRadius: px }}
            />
            <p className="text-xs font-medium text-foreground">{name}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {px === 9999 ? 'full' : `${px}px`}
            </p>
          </div>
        ))}
      </div>
    </div>
  ),
};

/* Written out rather than built as `shadow-${name}` — Tailwind only sees
   complete class strings in the source, so an interpolated name generates
   nothing and the swatch renders flat with no error. */
const SHADOW_CLASS: Record<keyof typeof elevation, string> = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
};

export const Elevation: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {Object.entries(elevation).map(([name, use]) => (
        <div key={name} className="space-y-2 text-center">
          <div
            className={`h-24 w-32 rounded-lg border border-border bg-card ${
              SHADOW_CLASS[name as keyof typeof elevation]
            }`}
          />
          <p className="font-mono text-xs text-foreground">shadow-{name}</p>
          <p className="max-w-32 text-[11px] text-muted-foreground">{use}</p>
        </div>
      ))}
      <p className="w-full text-xs text-muted-foreground">
        Never combine shadow + ring + border on the same element. Pick one elevation cue.
      </p>
    </div>
  ),
};

export const MotionLayeringViewport: StoryObj = {
  name: 'Motion, layering & viewport',
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <TokenTable
        title="Motion (ms)"
        note="Anything over 200ms must honour prefers-reduced-motion."
        rows={Object.entries(motion.duration).map(([k, v]) => [k, String(v)])}
      />
      <TokenTable
        title="Z-index"
        note="Shared with the mobile layer. Use these, never ad-hoc z-values."
        rows={Object.entries(zIndex).map(([k, v]) => [k, String(v)])}
      />
      <TokenTable
        title="Breakpoints (min-width)"
        note="Tailwind defaults. Design mobile-first even on an admin surface."
        rows={Object.entries(breakpoints).map(([k, v]) => [k, `${v}px`])}
      />
      <TokenTable
        title="Controls & icons"
        note="36px controls vs the mobile layer's 44px. Lucide stroke stays at 1.5 — never override."
        rows={[
          ['button.height.md', `${component.button.height.md}px`],
          ['input.height.md', `${component.input.height.md}px`],
          ['shell.topBarHeight', `${component.shell.topBarHeight}px`],
          ['shell.sidebarWidth', `${component.shell.sidebarWidth}px`],
          ['tapTargetPreferred', `${component.tapTargetPreferred}px`],
          ['icon.default', `${component.icon.default}px`],
        ]}
      />
    </div>
  ),
};

function TokenTable({
  title,
  note,
  rows,
}: {
  title: string;
  note?: string;
  rows: [string, string][];
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      <div className="divide-y divide-border rounded-lg border border-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between px-3 py-1.5">
            <span className="text-sm text-foreground">{k}</span>
            <code className="font-mono text-xs text-muted-foreground">{v}</code>
          </div>
        ))}
      </div>
    </section>
  );
}
