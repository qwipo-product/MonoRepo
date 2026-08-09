import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from '@mockups/ui';

const variants = ['default', 'highlighted', 'interactive', 'flat', 'compact'] as const;

const meta = {
  title: 'Primitives/Card',
  component: Card,
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Composed: Story = {
  render: () => (
    <Card className="w-72">
      <CardHeader>
        <CardTitle>Sri Sai Krishna Traders</CardTitle>
        <CardDescription>Authorised distributor</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-foreground-secondary">
        Minimum order ₹5,000 · Delivery tomorrow
      </CardContent>
      <CardFooter>
        <Button size="sm">Visit store</Button>
      </CardFooter>
    </Card>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {variants.map((v) => (
        <Card key={v} variant={v} className="grid h-20 w-40 place-items-center text-sm font-medium">
          {v}
        </Card>
      ))}
    </div>
  ),
};
