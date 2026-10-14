import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState, Button } from '@mockups/ui';

const meta = {
  title: 'Primitives/EmptyState',
  component: EmptyState,
  args: { icon: '🛒', title: 'Your cart is empty', description: 'Add products to see them here.' },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithAction: Story = {
  args: { action: <Button>Browse products</Button> },
};
