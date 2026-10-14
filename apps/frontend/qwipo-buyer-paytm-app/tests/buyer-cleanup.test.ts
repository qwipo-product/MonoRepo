import { describe, expect, test } from 'bun:test';
import { buildCart, INITIAL_QTY } from '../src/data/cart';
import { OFFERS } from '../src/data/coupons';
import { ORDERS } from '../src/data/orders';
import { resolveScreenId, visibleScreens } from '../src/review/screenIndex';

describe('Purchased cart lines', () => {
  test('keeps the seeded payable total while excluding reward units from counts and weight', () => {
    const cart = buildCart(INITIAL_QTY);
    const items = cart.sellers.flatMap((seller) => seller.items);
    expect(cart.grandTotal).toBe(7973);
    expect(cart.totalItems).toBe(7);
    expect(items.reduce((sum, item) => sum + item.quantity, 0)).toBe(82);
    expect(items.every((item) => item.lineTotal > 0)).toBe(true);
    expect(cart.sellers.find((seller) => seller.name === 'Sri Sai Krishna Traders')?.weight).toBeCloseTo(57.2);
  });

  for (const offer of OFFERS.filter((offer) => offer.automatic && offer.reward)) {
    test(`qualifying for ${offer.code} does not add a reward SKU`, () => {
      const purchased: Record<string, number> = {};
      const wholesale: Record<string, number> = {};
      for (const need of offer.needs ?? []) {
        (need.productId.startsWith('wp') ? wholesale : purchased)[need.productId] = need.qty;
      }
      const requested = { ...purchased, ...wholesale };
      const cart = buildCart(purchased, wholesale);
      const items = cart.sellers.flatMap((seller) => seller.items);
      expect(items.length).toBe(Object.keys(requested).length);
      for (const item of items) {
        expect(item.quantity).toBe(requested[item.product.id]);
        expect(item.lineTotal).toBeGreaterThan(0);
      }
    });
  }

  test('keeps the existing percentage discount on paid lines', () => {
    const cart = buildCart({ p3: 20, p10: 2 });
    const besan = cart.sellers.flatMap((seller) => seller.items).find((item) => item.product.id === 'p3');
    expect(besan?.lineTotal).toBe(935);
    expect(besan?.offerTags).toEqual([{ label: '15% Off — Combo', amount: 165 }]);
    expect(cart.grandTotal).toBe(1205);
  });

  test('an empty cart stays empty', () => {
    expect(buildCart({})).toMatchObject({ sellers: [], grandTotal: 0, totalItems: 0, freightTotal: 0 });
  });
});

test('order history counts only purchased items and preserves the payable amounts', () => {
  expect(ORDERS.map((order) => order.total)).toEqual([4200, 7128, 2890, 3640, 2260]);
  for (const order of ORDERS) {
    expect(order.itemCount).toBe(order.items.length);
    expect(order.items.every((item) => item.price > 0)).toBe(true);
  }
});

describe('Retired account destinations', () => {
  for (const id of ['sub:payment', 'sub:payment-orders', 'sub:payment-gateways', 'sub:credit']) {
    test(`${id} resolves to its registered empty-state counterpart in both shells`, () => {
      const destination = resolveScreenId(id);
      expect(destination).toBe(`empty:${id}`);
      expect(resolveScreenId(destination)).toBe(destination);
      for (const shell of ['buyer', 'paytm']) {
        const ids = visibleScreens(shell, 'customer').map((screen) => screen.id);
        expect(ids).toContain(destination);
        expect(ids).not.toContain(id);
        expect(ids).not.toContain('offer-skus');
      }
    });
  }

  test('other IDs are unchanged', () => {
    for (const id of ['listing', 'cart', 'empty:cart', 'constructor', 'toString']) {
      expect(resolveScreenId(id)).toBe(id);
    }
  });
});
