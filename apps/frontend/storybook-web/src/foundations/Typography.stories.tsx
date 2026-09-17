import type { Meta, StoryObj } from '@storybook/react-vite';
import { font, fontWeight, typography } from '@mockups/web-tokens';

const meta: Meta = {
  title: 'Foundations/Typography',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Inter, two weights in product chrome (400 / 600), nine roles. Denser than the mobile scale — body is 14px and the ladder bottoms out at 10px for table mini-headers. Never reach for `text-3xl` or larger.',
      },
    },
  },
};
export default meta;

export const TypeScale: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4">
        <p className="text-xs text-muted-foreground">Family</p>
        <p className="mt-1 font-mono text-xs text-foreground">{font.sans}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Base {font.baseSize}px · weights {fontWeight.regular} / {fontWeight.medium} /{' '}
          {fontWeight.semibold}
        </p>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        {Object.entries(typography).map(([role, spec]) => (
          <div key={role} className="flex flex-wrap items-baseline gap-x-6 gap-y-2 p-4">
            <div className="w-20 flex-shrink-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {role}
              </p>
            </div>
            <p className={`${spec.class} min-w-[200px] flex-1 text-foreground`}>
              Retailer identity resolved
            </p>
            <div className="text-right">
              <p className="font-mono text-[11px] text-muted-foreground">{spec.class}</p>
              <p className="text-[11px] text-muted-foreground">
                {spec.size}/{spec.lineHeight} · {spec.use}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const VoiceAndTone: StoryObj = {
  name: 'Voice & tone',
  render: () => (
    <div className="max-w-2xl space-y-3">
      {[
        ['Sentence case everywhere', 'Create offer', 'Create Offer'],
        ['Imperative buttons', 'Save', 'Click to save'],
        ['Indian currency grouping', '₹12,450', '₹12450'],
        ['Compact on tiles', '₹12.4L', '₹1,240,000'],
        ['ISO dates in tables', '2026-05-04', '04/05/26'],
        ['No exclamation points', 'Order cancelled', 'Order cancelled!'],
      ].map(([rule, good, bad]) => (
        <div
          key={rule}
          className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto_auto]"
        >
          <p className="text-sm font-medium text-foreground">{rule}</p>
          <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
            ✓ {good}
          </span>
          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
            ✕ {bad}
          </span>
        </div>
      ))}
    </div>
  ),
};
