import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QtyStepper } from '@mockups/ui';

const meta = {
  title: 'Primitives/QtyStepper',
  component: QtyStepper,
  // `value` / `onChange` are required props, so Storybook's types demand args
  // somewhere. The stories below are render-only and drive their own state,
  // so these are never actually read.
  args: { value: 1, onChange: () => {} },
} satisfies Meta<typeof QtyStepper>;
export default meta;
type Story = StoryObj;

export const Neutral: Story = {
  render: () => {
    const [n, setN] = useState(1);
    return <QtyStepper value={n} onChange={setN} />;
  },
};

export const Soft: Story = {
  render: () => {
    const [n, setN] = useState(2);
    return <QtyStepper value={n} onChange={setN} tone="soft" />;
  },
};
