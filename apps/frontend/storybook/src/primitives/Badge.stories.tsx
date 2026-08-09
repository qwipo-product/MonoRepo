import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@mockups/ui';

const variants = ['default', 'neutral', 'secondary', 'outline', 'success', 'warning', 'danger', 'info', 'accent'] as const;

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  args: { children: '12% margin', variant: 'success' },
  argTypes: { variant: { control: 'select', options: variants } },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {variants.map((v) => (
        <Badge key={v} variant={v}>
          {v}
        </Badge>
      ))}
    </div>
  ),
};
