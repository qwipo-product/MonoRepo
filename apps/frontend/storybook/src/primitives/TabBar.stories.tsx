import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Home, ClipboardList, Package, Users, Menu } from 'lucide-react';
import { StatusBar, TabBar } from '@mockups/ui';

const meta = {
  title: 'Primitives/TabBar',
  component: TabBar,
  parameters: {
    docs: {
      description: {
        component:
          "The phone's bottom tab bar, on root screens only — pushed screens carry their own header. Each app passes its own tabs; `badge` puts a count on an icon. StatusBar is the 9:41 row at the top of the phone frame.",
      },
    },
  },
  args: { tabs: [], active: '', onSelect: () => {} },
} satisfies Meta<typeof TabBar>;
export default meta;
type Story = StoryObj;

export const SellerApp: Story = {
  render: () => {
    const [active, setActive] = useState('orders');
    return (
      <div className="flex h-96 w-[390px] flex-col justify-between rounded-xl border border-border bg-background">
        <StatusBar />
        <TabBar
          tabs={[
            { id: 'home', label: 'Home', icon: Home },
            { id: 'orders', label: 'Orders', icon: ClipboardList, badge: 5 },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'more', label: 'More', icon: Menu },
          ]}
          active={active}
          onSelect={setActive}
        />
      </div>
    );
  },
};
