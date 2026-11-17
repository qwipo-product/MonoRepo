import type { Meta, StoryObj } from '@storybook/react-vite';

/* Landing page for the design-system Storybook. Not autodoc'd. */
function Introduction() {
  const Layer = ({ n, pkg, what }: { n: string; pkg: string; what: string }) => (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-xs font-bold text-primary">{n}</span>
      <div>
        <div className="text-sm font-semibold text-foreground">{pkg}</div>
        <div className="text-sm text-foreground-secondary">{what}</div>
      </div>
    </div>
  );
  return (
    <div className="mx-auto max-w-2xl bg-background p-8 text-foreground">
      <h1 className="text-2xl font-bold">Qwipo Design System</h1>
      <p className="mt-2 text-sm text-foreground-secondary">
        The mobile kit for Buyer, RIRN Retailer, and Analytics. Components here are token-driven —
        the shape is shared, the tokens define the look, and dark mode is a token swap (toggle it in the toolbar).
        Use Desktop Storybook for Seller Store and RIRN Console components.
      </p>

      <h2 className="mt-6 text-base font-semibold">The layers</h2>
      <div className="mt-3 flex flex-col gap-2">
        <Layer n="1" pkg="@mockups/design-tokens" what="Colour, spacing, type and radius as semantic tokens (light + dark). Web binding: theme.css." />
        <Layer n="2" pkg="@mockups/ui" what="Primitives — Button, Card, Input, Chip, Sheet, Badge, Switch, SegmentedControl, QtyStepper, SelectableCard, EmptyState, Tabs." />
        <Layer n="3" pkg="@mockups/components" what="Composed, product-aware components — ProductCard, PriceLabel, StatusBadge." />
        <Layer n="4" pkg="apps/*" what="Screens compose tokens + primitives. No per-screen CSS, no raw hex, no inline styles." />
      </div>

      <h2 className="mt-6 text-base font-semibold">How to read it</h2>
      <p className="mt-2 text-sm text-foreground-secondary">
        Foundations shows the tokens themselves. Primitives and Components each have a Playground (live controls) plus
        galleries of every variant and state. Use the Light/Dark toolbar to verify both themes, and the Accessibility
        panel to check contrast and roles.
      </p>
    </div>
  );
}

const meta = {
  title: 'Introduction',
  component: Introduction,
  parameters: { layout: 'fullscreen' },
  tags: ['!autodocs'],
} satisfies Meta<typeof Introduction>;
export default meta;

export const Overview: StoryObj<typeof meta> = {};
