import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from '@mockups/ui';

const meta = {
  title: 'Primitives/Switch',
  component: Switch,
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: () => {
    const [on, setOn] = useState(true);
    return <Switch checked={on} onCheckedChange={setOn} aria-label="Notifications" />;
  },
};

export const Row: Story = {
  render: () => {
    const [dark, setDark] = useState(false);
    const [push, setPush] = useState(true);
    return (
      <div className="flex w-72 flex-col gap-3">
        {[
          { label: 'Dark mode', v: dark, set: setDark },
          { label: 'Push notifications', v: push, set: setPush },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <span className="text-sm font-medium text-foreground">{r.label}</span>
            <Switch checked={r.v} onCheckedChange={r.set} aria-label={r.label} />
          </div>
        ))}
      </div>
    );
  },
};
