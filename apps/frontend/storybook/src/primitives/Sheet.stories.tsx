import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sheet, Button, Chip } from '@mockups/ui';

/* Sheet renders `absolute inset-0` inside the nearest positioned ancestor, so
   stories host it in a relative phone frame (as the app's phone frame does). */
const meta: Meta = { title: 'Primitives/Sheet', parameters: { layout: 'centered' }, tags: ['!autodocs'] };
export default meta;
type Story = StoryObj;

export const InPhoneFrame: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [pack, setPack] = useState('1l');
    return (
      <div className="relative h-[560px] w-[300px] overflow-hidden rounded-2xl border border-border bg-background">
        <div className="p-4">
          <Button onClick={() => setOpen(true)}>Open sheet</Button>
        </div>
        <Sheet
          open={open}
          onClose={() => setOpen(false)}
          title="Add to cart"
          subtitle="Choose a selling unit"
          footer={
            <Button fullWidth onClick={() => setOpen(false)}>
              Continue
            </Button>
          }
        >
          <div className="flex flex-wrap gap-2">
            {['1l', '5l', '15kg'].map((v) => (
              <Chip key={v} selected={v === pack} onClick={() => setPack(v)}>
                {v}
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-sm text-foreground-secondary">
            The one bottom-sheet shell — header, scroll body and sticky footer. Replaces the five hand-rolled sheets.
          </p>
        </Sheet>
      </div>
    );
  },
};
