import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from '@mockups/components';

const statuses = ['placed', 'processing', 'in_transit', 'delivered', 'cancelled'] as const;
// The seller app's statuses — the seller platform's real enum.
const sellerStatuses = ['CREATED', 'ACCEPTED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'] as const;

const meta = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  args: { status: 'processing' },
  argTypes: { status: { control: 'select', options: [...statuses, ...sellerStatuses] } },
} satisfies Meta<typeof StatusBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => (
        <StatusBadge key={s} status={s} />
      ))}
    </div>
  ),
};

export const SellerStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {sellerStatuses.map((s) => (
        <StatusBadge key={s} status={s} />
      ))}
    </div>
  ),
};
