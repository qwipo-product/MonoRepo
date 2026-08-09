import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from '@mockups/ui';

const meta = {
  title: 'Primitives/Chip',
  component: Chip,
  args: { children: 'Rice & Pulses', selected: false },
} satisfies Meta<typeof Chip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SelectableGroup: Story = {
  render: () => {
    const opts = ['All', 'Oils & Ghee', 'Rice', 'Snacks', 'Beverages'];
    const [sel, setSel] = useState('Rice');
    return (
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <Chip key={o} selected={o === sel} onClick={() => setSel(o)}>
            {o}
          </Chip>
        ))}
      </div>
    );
  },
};
