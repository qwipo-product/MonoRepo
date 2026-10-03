import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '@mockups/ui';
import { Field, SelectField, controlClass } from '@mockups/components';

const meta = {
  title: 'Components/FormFields',
  component: Field,
  parameters: {
    docs: {
      description: {
        component:
          'Form rhythm for mobile forms: Field puts a label (and a red * when required) over any control; SelectField is a select that opens a bottom sheet of options; controlClass is the shared 44px white control style for custom controls.',
      },
    },
  },
  args: { label: 'Shop name', children: null },
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TextField: Story = {
  render: () => (
    <div className="w-80">
      <Field label="Shop name" required>
        <Input placeholder="e.g. Sri Lakshmi Kirana" />
      </Field>
    </div>
  ),
};

export const Select: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      // Sheet positions against the nearest relative box, like the phone frame.
      <div className="relative h-[520px] w-[390px] overflow-hidden rounded-xl border border-border bg-background p-4">
        <SelectField
          label="Business type"
          required
          placeholder="Pick one"
          value={value}
          options={['Kirana store', 'Supermarket', 'Medical store', 'Bakery']}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const ReadOnlyControl: Story = {
  render: () => (
    <div className="w-80">
      <Field label="SKU code">
        <div className={`${controlClass} bg-input text-foreground-secondary`}>FRD-SUN-1L</div>
      </Field>
    </div>
  ),
};
