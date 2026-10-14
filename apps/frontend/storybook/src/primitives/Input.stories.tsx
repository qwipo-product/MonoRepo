import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '@mockups/ui';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  args: { placeholder: 'Search products' },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="w-72">
      <Input {...args} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <Input placeholder="Editable — white surface" />
      <Input defaultValue="Read-only value" readOnly />
      <Input placeholder="Disabled" disabled />
    </div>
  ),
};
