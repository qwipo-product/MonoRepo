import type { Meta, StoryObj } from '@storybook/react-vite';

/* The type scale, expressed through Tailwind utilities the components use. */
function Row({ cls, note }: { cls: string; note: string }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-border py-2">
      <span className={`${cls} text-foreground`}>Qwipo B2B</span>
      <span className="text-xs text-foreground-secondary">{cls} · {note}</span>
    </div>
  );
}

function TypeScale() {
  return (
    <div className="max-w-2xl bg-background p-2">
      <Row cls="text-2xl font-bold" note="display / page title" />
      <Row cls="text-lg font-bold" note="section / price" />
      <Row cls="text-base font-semibold" note="card title" />
      <Row cls="text-sm font-medium" note="body / label" />
      <Row cls="text-xs" note="secondary / caption" />
      <Row cls="text-[10px] font-semibold uppercase tracking-wide" note="micro / badge" />
      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        <div className="text-sm text-foreground-secondary">Tabular numerals (prices, quantities)</div>
        <div className="text-lg font-bold tabular-nums text-foreground">₹1,65,420.00</div>
      </div>
    </div>
  );
}

const meta = {
  title: 'Foundations/Typography',
  component: TypeScale,
  parameters: { layout: 'fullscreen' },
  tags: ['!autodocs'],
} satisfies Meta<typeof TypeScale>;
export default meta;

export const Scale: StoryObj<typeof meta> = {};
