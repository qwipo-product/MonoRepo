import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge, StatusBadge, type StatusTone } from "@mockups/web-ui";

const meta = {
  title: "Primitives/Status badge",
  component: StatusBadge,
  parameters: {
    docs: {
      description: {
        component:
          "The single source of truth for status pills. Map a status string to a tone once, here — never re-pick a green at the call site.",
      },
    },
  },
  // Meta-level args satisfy StatusBadge's required props, so the
  // render-only stories below don't each have to restate them.
  args: { tone: "success", children: "Verified" },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

const TONE_MEANING: Record<StatusTone, string[]> = {
  success: ["Verified", "Approved", "Authorized", "Connected"],
  warning: ["Pending", "Needs verification", "Awaiting approval"],
  danger: ["Rejected", "Revoked", "Suspended", "Disputed"],
  info: ["New", "In review", "Human review"],
  neutral: ["Draft", "Not connected", "Unknown"],
};

export const Tones: Story = {
  render: () => (
    <div className="space-y-3">
      {(Object.keys(TONE_MEANING) as StatusTone[]).map((tone) => (
        <div key={tone} className="flex flex-wrap items-center gap-3">
          <span className="w-20 text-sm font-medium capitalize text-gray-900">
            {tone}
          </span>
          {TONE_MEANING[tone].map((label) => (
            <StatusBadge key={label} tone={tone}>
              {label}
            </StatusBadge>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <StatusBadge tone="success" size="sm">
        Small — dense table rows
      </StatusBadge>
      <StatusBadge tone="success">Medium — default</StatusBadge>
    </div>
  ),
};

export const VersusBadge: Story = {
  name: "StatusBadge vs Badge",
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm text-gray-600">
          <strong>StatusBadge</strong> — rounded-full, tinted, for data state.
        </p>
        <div className="flex gap-2">
          <StatusBadge tone="success">Authorized</StatusBadge>
          <StatusBadge tone="warning">Pending</StatusBadge>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm text-gray-600">
          <strong>Badge</strong> — rounded-md, solid brand, for counts and
          labels.
        </p>
        <div className="flex gap-2">
          <Badge>12</Badge>
          <Badge variant="secondary">Beta</Badge>
          <Badge variant="outline">Level 4</Badge>
          <Badge variant="destructive">Blocked</Badge>
        </div>
      </div>
    </div>
  ),
};
