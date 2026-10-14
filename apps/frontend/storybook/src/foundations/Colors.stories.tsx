import type { Meta, StoryObj } from '@storybook/react-vite';

/* Semantic colour tokens, rendered through their Tailwind utilities so they
   react to the Light/Dark toolbar. Never reference a hex — reference a token. */

type Sw = { label: string; className: string; ring?: boolean };

function Swatch({ label, className, ring }: Sw) {
  return (
    <div className="flex w-32 flex-col gap-1">
      <div className={`h-14 w-full rounded-lg ${ring ? 'border border-border' : ''} ${className}`} />
      <div className="text-[11px] font-medium text-foreground">{label}</div>
    </div>
  );
}

function Group({ title, items }: { title: string; items: Sw[] }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex flex-wrap gap-3">
        {items.map((s) => (
          <Swatch key={s.label} {...s} />
        ))}
      </div>
    </section>
  );
}

function Palette() {
  return (
    <div className="bg-background p-2">
      <Group
        title="Brand"
        items={[
          { label: 'primary', className: 'bg-primary' },
          { label: 'primary-hover', className: 'bg-primary-hover' },
          { label: 'primary-active', className: 'bg-primary-active' },
          { label: 'primary-soft', className: 'bg-primary-soft', ring: true },
        ]}
      />
      <Group
        title="Surfaces"
        items={[
          { label: 'background', className: 'bg-background', ring: true },
          { label: 'background-subtle', className: 'bg-background-subtle', ring: true },
          { label: 'card', className: 'bg-card', ring: true },
          { label: 'muted', className: 'bg-muted', ring: true },
        ]}
      />
      <Group
        title="Status — solid"
        items={[
          { label: 'success', className: 'bg-success' },
          { label: 'warning', className: 'bg-warning' },
          { label: 'error', className: 'bg-error' },
          { label: 'primary', className: 'bg-primary' },
        ]}
      />
      <Group
        title="Status — subtle (badges)"
        items={[
          { label: 'success-subtle', className: 'bg-success-subtle', ring: true },
          { label: 'warning-subtle', className: 'bg-warning-subtle', ring: true },
          { label: 'error-subtle', className: 'bg-error-subtle', ring: true },
          { label: 'info-subtle', className: 'bg-info-subtle', ring: true },
          { label: 'accent-subtle', className: 'bg-accent-subtle', ring: true },
        ]}
      />
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Text</h3>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-foreground">text-foreground — primary content</p>
          <p className="text-foreground-secondary">text-foreground-secondary — supporting</p>
          <p className="text-foreground-tertiary">text-foreground-tertiary — hints</p>
          <p className="text-primary">text-primary — links & emphasis</p>
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: 'Foundations/Colors',
  component: Palette,
  parameters: { layout: 'fullscreen' },
  tags: ['!autodocs'],
} satisfies Meta<typeof Palette>;
export default meta;

export const Tokens: StoryObj<typeof meta> = {};
