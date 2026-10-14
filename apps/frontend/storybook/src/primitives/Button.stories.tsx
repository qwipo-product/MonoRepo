import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@mockups/ui';

const variants = ['primary', 'secondary', 'ghost', 'soft', 'success', 'warning', 'destructive'] as const;

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: { children: 'Add to cart', variant: 'primary', size: 'md' },
  argTypes: {
    variant: { control: 'select', options: variants },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'icon'] },
    fullWidth: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {variants.map((v) => (
        <Button key={v} variant={v}>
          {v}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
      <div className="w-64">
        <Button fullWidth>Full width</Button>
      </div>
    </div>
  ),
};
