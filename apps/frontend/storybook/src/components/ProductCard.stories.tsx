import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductCard, type ProductCardProps } from '@mockups/components';

const meta = {
  title: 'Components/ProductCard',
  component: ProductCard,
  // `name` / `price` are required props, so Storybook's types demand args
  // somewhere. The stories below render <Demo /> with their own props, so
  // these are never actually read.
  args: { name: 'Product', price: 0 },
} satisfies Meta<typeof ProductCard>;
export default meta;
type Story = StoryObj;

const base = {
  name: 'Freedom Refined Sunflower Oil - 1 L Packet X 16 Nos',
  caseLabel: 'Case: 16 pc',
  image: '🛢️',
  variants: [
    { id: '1l', label: '1 L' },
    { id: '5l', label: '5 L' },
    { id: '15kg', label: '15 kg' },
  ],
  price: 165,
  mrp: 185,
  margin: '12% Margin',
};

/* Stateful wrapper so variant selection is interactive. Quantity is set by the
   selling-units sheet in the app, so here onAdd just stands in for it. */
function Demo(props: Partial<ProductCardProps>) {
  const [variant, setVariant] = useState('1l');
  const [qty, setQty] = useState(0);
  return (
    <div className="w-80">
      <ProductCard
        {...(base as ProductCardProps)}
        {...props}
        selectedVariant={variant}
        onSelectVariant={setVariant}
        qty={qty}
        onAdd={() => setQty((n) => (n > 0 ? 0 : 1))}
      />
    </div>
  );
}

export const Distributor: Story = {
  render: () => <Demo seller="Sri Sai Krishna Traders" delivery="Free Delivery" />,
};

export const Wholesaler: Story = {
  render: () => <Demo seller="Omkar Enterprises" delivery="Delivery by Tomorrow" />,
};

export const InCart: Story = {
  render: () => {
    const [variant, setVariant] = useState('1l');
    const [qty, setQty] = useState(3);
    return (
      <div className="w-80">
        <ProductCard
          {...(base as ProductCardProps)}
          seller="Sri Sai Krishna Traders"

          delivery="Free Delivery"
          selectedVariant={variant}
          onSelectVariant={setVariant}
          qty={qty}
          onAdd={() => setQty((n) => (n > 0 ? 0 : 3))}
        />
      </div>
    );
  },
};
