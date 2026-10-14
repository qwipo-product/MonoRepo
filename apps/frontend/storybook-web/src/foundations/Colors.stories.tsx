import type { Meta, StoryObj } from '@storybook/react-vite';
import { chartPalette, colorLight } from '@mockups/web-tokens';
import type { ReactNode } from 'react';

const meta: Meta = {
  title: 'Foundations/Colors',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Read live from `@mockups/web-tokens`. Brand and status values are re-exported from `@mockups/design-tokens`, so these swatches are the same physical values the mobile layer uses — not a copy that agrees today.',
      },
    },
  },
};
export default meta;

function Swatch({ name, value, note }: { name: string; value: string; note?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-11 w-11 flex-shrink-0 rounded-md border border-border"
        style={{ background: value }}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="font-mono text-xs text-muted-foreground">{value}</p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}

function Section({ title, blurb, children }: { title: string; blurb?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {blurb && <p className="text-xs text-muted-foreground">{blurb}</p>}
      </div>
      {children}
    </section>
  );
}

export const Brand: StoryObj = {
  render: () => (
    <Section
      title="Brand & core surfaces"
      blurb="Change --primary once and Button, Badge, Switch, Checkbox, focus rings and active tabs all recolor together."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Swatch name="brand.primary" value={colorLight.brand.primary} note="Tailwind blue-600" />
        <Swatch name="brand.primaryHover" value={colorLight.brand.primaryHover} />
        <Swatch name="text.primary" value={colorLight.text.primary} />
        <Swatch name="text.secondary" value={colorLight.text.secondary} />
        <Swatch name="background.subtle" value={colorLight.background.subtle} />
        <Swatch name="surface.input" value={colorLight.surface.input} />
      </div>
    </Section>
  ),
};

export const Status: StoryObj = {
  render: () => (
    <Section
      title="Status palette"
      blurb="Each tone is a {solid, fg, bg, border} quad, so the same status can't drift between two shades of green in two places."
    >
      <div className="space-y-3">
        {Object.entries(colorLight.status).map(([tone, slots]) => (
          <div
            key={tone}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
          >
            <span className="w-20 text-sm font-medium capitalize text-foreground">{tone}</span>
            {Object.entries(slots).map(([slot, value]) => (
              <div key={slot} className="flex items-center gap-2">
                <span
                  className="h-7 w-7 rounded border border-border"
                  style={{ background: value }}
                />
                <span className="font-mono text-[11px] text-muted-foreground">{slot}</span>
              </div>
            ))}
            <span
              className="ml-auto inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
              style={{ background: slots.bg, borderColor: slots.border, color: slots.fg }}
            >
              Example pill
            </span>
          </div>
        ))}
      </div>
    </Section>
  ),
};

export const Charts: StoryObj = {
  render: () => (
    <Section
      title="Chart palette"
      blurb="Eight 600-level shades, semantically ordered. A series meaning 'Active' reads green wherever it appears — don't reassign roles between charts. Web-only; the mobile layer has no chart surface."
    >
      <div className="flex flex-wrap gap-3">
        {chartPalette.map((hex, i) => (
          <div key={hex} className="space-y-1">
            <div
              className="h-16 w-24 rounded-md border border-border"
              style={{ background: hex }}
            />
            <p className="font-mono text-[11px] text-muted-foreground">
              {i + 1}. {hex}
            </p>
          </div>
        ))}
      </div>
    </Section>
  ),
};
