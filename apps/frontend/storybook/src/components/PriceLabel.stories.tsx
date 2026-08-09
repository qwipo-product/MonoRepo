import type { Meta, StoryObj } from '@storybook/react-vite';
import { PriceLabel } from '@mockups/components';

const meta = {
  title: 'Components/PriceLabel',
  component: PriceLabel,
  args: { price: 165, mrp: 185, suffix: '/pc', size: 'lg', align: 'start' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'lg'] },
    align: { control: 'inline-radio', options: ['start', 'end'] },
  },
} satisfies Meta<typeof PriceLabel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-10">
      <PriceLabel price={165} mrp={185} suffix="/pc" size="sm" align="start" />
      <PriceLabel price={165} mrp={185} suffix="/pc" size="lg" align="start" />
    </div>
  ),
};

export const NoMrp: Story = {
  args: { mrp: undefined },
};
