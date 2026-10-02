import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@mockups/ui';
import { OrderListCard } from '@mockups/components';

const meta = {
  title: 'Components/OrderListCard',
  component: OrderListCard,
  parameters: {
    docs: {
      description: {
        component:
          'The one order-list card for buyer and seller apps. Actions, the details link and the tick box (for bulk actions) are optional slots — turn on only what the screen needs.',
      },
    },
  },
  args: { title: 'Sri Lakshmi Kirana', orderId: 'QW-240871', status: 'CREATED', total: 7524 },
} satisfies Meta<typeof OrderListCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Buyer: Story = {
  args: { title: 'Sri Sai Krishna Traders', orderId: 'ORD-10231', status: 'processing', statusLabel: 'Being packed', total: 4280, onOpenDetails: () => {} },
};

export const SellerNewOrder: Story = {
  render: (args) => {
    const [selected, setSelected] = useState(false);
    return (
      <div className="w-[358px]">
        <OrderListCard
          {...args}
          meta="Kukatpally · 3 items · COD"
          onOpenDetails={() => {}}
          selected={selected}
          onToggleSelect={() => setSelected((s) => !s)}
          actions={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm">Cancel</Button>
              <Button size="sm">Confirm</Button>
            </div>
          }
        />
      </div>
    );
  },
};
