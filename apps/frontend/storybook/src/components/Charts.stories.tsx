import type { Meta, StoryObj } from '@storybook/react-vite';
import { RankedRow, Columns, StackBar, HBars, Stat } from '@mockups/components';

const meta = {
  title: 'Components/Charts',
  component: RankedRow,
  args: { rank: 1, name: 'Sri Balaji Agencies', value: 7.9, max: 7.9, change: 21, barClass: 'bg-chart-blue' },
} satisfies Meta<typeof RankedRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Ranked: Story = {
  render: () => (
    <div className="flex w-[420px] flex-col gap-1.5">
      <RankedRow rank={1} name="Sri Balaji Agencies" value={7.9} max={7.9} change={21} barClass="bg-chart-blue" />
      <RankedRow rank={2} name="S R Enterprises" value={5.6} max={7.9} change={8} barClass="bg-chart-blue" />
      <RankedRow rank={3} name="Vijaya Distributors" value={4.4} max={7.9} change={-9} barClass="bg-chart-blue" />
      <RankedRow name="12 others" value={10.8} max={7.9} change={6} barClass="bg-chart-blue" other />
    </div>
  ),
};

export const ColumnsChart: Story = {
  render: () => (
    <div className="w-[360px]">
      <Columns items={[
        { label: 'Open', n: 392, bg: 'bg-chart-blue-soft' },
        { label: 'Delivered', n: 454, bg: 'bg-success' },
        { label: 'Cancelled', n: 284, bg: 'bg-error' },
        { label: 'Returned', n: 12, bg: 'bg-warning' },
      ]} />
    </div>
  ),
};

export const Stacked: Story = {
  render: () => (
    <div className="w-[520px]">
      <StackBar parts={[
        { key: 'created', pct: 8.1, label: '92', bg: 'bg-chart-gray' },
        { key: 'accepted', pct: 10, label: '114', bg: 'bg-chart-blue' },
        { key: 'packed', pct: 7.4, label: '85', bg: 'bg-chart-indigo' },
        { key: 'shipped', pct: 8.8, label: '101', bg: 'bg-chart-cyan' },
        { key: 'delivered', pct: 39.8, label: '454', bg: 'bg-success' },
        { key: 'cancelled', pct: 24.9, label: '284', bg: 'bg-error' },
        { key: 'returned', pct: 1.1, label: '', bg: 'bg-warning' },
      ]} />
    </div>
  ),
};

export const HorizontalBars: Story = {
  render: () => (
    <div className="w-[420px]">
      <HBars rows={[
        { label: 'Out of stock at distributor', n: 98, value: '₹3.6L', barClass: 'bg-error' },
        { label: 'Retailer cancelled', n: 71, value: '₹2.7L', barClass: 'bg-error' },
        { label: 'Duplicate order', n: 18, value: '₹0.6L', barClass: 'bg-border-strong' },
      ]} />
    </div>
  ),
};

export const AgeRamp: Story = {
  render: () => (
    <div className="w-[360px]">
      <Columns items={[
        { label: 'D0', n: 118, bg: 'bg-chart-age-0' },
        { label: 'D1', n: 94, bg: 'bg-chart-age-1' },
        { label: 'D2', n: 57, bg: 'bg-chart-age-2' },
        { label: 'D3', n: 32, bg: 'bg-chart-age-3' },
        { label: 'D4+', n: 91, bg: 'bg-error' },
      ]} />
    </div>
  ),
};

export const Stats: Story = {
  render: () => (
    <div className="flex gap-8">
      <Stat label="Delivery rate" value="61.5%" note="454 ÷ 738 closed" />
      <Stat label="Cancellation rate" value="24.9%" note="of 1,142" />
    </div>
  ),
};
