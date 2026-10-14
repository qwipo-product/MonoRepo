import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedControl } from '@mockups/ui';

const meta: Meta = { title: 'Primitives/SegmentedControl', tags: ['!autodocs'] };
export default meta;
type Story = StoryObj;

export const TwoOptions: Story = {
  render: () => {
    const [v, setV] = useState('dist');
    return (
      <div className="w-72">
        <SegmentedControl
          options={[
            { value: 'dist', label: 'Distributors' },
            { value: 'whole', label: 'Wholesalers' },
          ]}
          value={v}
          onChange={setV}
        />
      </div>
    );
  },
};

export const ThreeOptions: Story = {
  render: () => {
    const [v, setV] = useState('today');
    return (
      <div className="w-80">
        <SegmentedControl
          options={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This week' },
            { value: 'month', label: 'This month' },
          ]}
          value={v}
          onChange={setV}
        />
      </div>
    );
  },
};
