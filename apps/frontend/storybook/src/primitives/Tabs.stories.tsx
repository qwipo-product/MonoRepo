import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@mockups/ui';

const meta: Meta = { title: 'Primitives/Tabs', tags: ['!autodocs'] };
export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Tabs defaultValue="orders" className="w-80 gap-3">
      <TabsList>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="reorder">Reorder</TabsTrigger>
      </TabsList>
      <TabsContent value="orders" className="text-sm text-foreground-secondary">
        Your recent orders appear here.
      </TabsContent>
      <TabsContent value="reorder" className="text-sm text-foreground-secondary">
        Items you buy often, ready to reorder.
      </TabsContent>
    </Tabs>
  ),
};
