import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SelectableCard } from '@mockups/ui';

const meta = {
  title: 'Primitives/SelectableCard',
  component: SelectableCard,
} satisfies Meta<typeof SelectableCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const RadioList: Story = {
  render: () => {
    const items = [
      { id: 'a', t: 'Flat ₹500 OFF', s: 'On orders above ₹6,000' },
      { id: 'b', t: '10% OFF up to ₹400', s: 'First 3 orders' },
      { id: 'c', t: 'Free delivery', s: 'On all orders above ₹3,500' },
    ];
    const [sel, setSel] = useState('a');
    return (
      <div className="flex w-80 flex-col gap-2">
        {items.map((i) => (
          <SelectableCard key={i.id} selected={sel === i.id} radio onClick={() => setSel(i.id)} className="p-3">
            <div className="text-sm font-semibold text-foreground">{i.t}</div>
            <div className="text-xs text-foreground-secondary">{i.s}</div>
          </SelectableCard>
        ))}
      </div>
    );
  },
};
