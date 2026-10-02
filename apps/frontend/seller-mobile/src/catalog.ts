import { useState } from 'react';
import { products, sellerCustomers, sellerSchemes, sellerSkus } from '@mockups/mock-data';
import type { SellerCustomer, SellerScheme, SellerSku } from '@mockups/types';

/* Products, customers and offers for this demo session — seeded from the
   shared fixtures, changed here as the seller edits. Same split as orders.ts. */

/* The shared photo bank is loose: some products borrow another product's
   photo (Tata Tea Gold shows Maggi), and some links are dead. A wrong
   picture misleads more than an emoji, so only products whose photo is
   really theirs, and loads, use it. */
const TRUE_PHOTOS = new Set([
  'freedom-sunflower', 'aashirvaad-atta', 'aashirvaad-multigrain',
  'aashirvaad-ghee', 'surf-excel', 'tata-salt', 'aashirvaad-salt', 'maggi-masala', 'parle-g', 'amul-butter',
]);

/** The product's photo where the catalogue has a true one, else its emoji. */
export const imageOf = (productId: string) => {
  const p = products.find((x) => x.id === productId);
  return (TRUE_PHOTOS.has(productId) && p?.images[0]) || p?.image;
};

/** The portal's "Non-compliant": listed, but nobody can buy it until the details are filled. */
export const isCompliant = (s: SellerSku) => s.missingFields.length === 0;

/** Price a buyer pays per unit in a slab. */
export const slabPrice = (price: number, pct: number) => Math.round(price * (1 - pct / 100) * 100) / 100;

export const TODAY = '2026-10-02';

export function useCatalog(empty = false) {
  const [skus, setSkus] = useState<SellerSku[]>(() => (empty ? [] : structuredClone(sellerSkus)));
  const [customers, setCustomers] = useState<SellerCustomer[]>(() => (empty ? [] : structuredClone(sellerCustomers)));
  const [schemes, setSchemes] = useState<SellerScheme[]>(() => (empty ? [] : structuredClone(sellerSchemes)));

  const editSkus = (codes: string[], patch: Partial<SellerSku>) =>
    setSkus((prev) => prev.map((s) => (codes.includes(s.code) ? { ...s, ...patch, updatedAt: TODAY } : s)));

  return {
    skus,
    customers,
    schemes,
    setActive: (codes: string[], active: boolean) => editSkus(codes, { active }),
    setStock: (codes: string[], inStock: boolean) => editSkus(codes, { inStock }),
    setPrice: (code: string, mrp: number, price: number) => editSkus([code], { mrp, price }),
    setCompanyStatus: (customerId: string, company: string, status: 'ACTIVE' | 'BLOCKED') =>
      setCustomers((prev) =>
        prev.map((c) =>
          c.customerId === customerId
            ? { ...c, companies: c.companies.map((co) => (co.name === company ? { ...co, status } : co)) }
            : c
        )
      ),
    addScheme: (s: SellerScheme) => setSchemes((prev) => [s, ...prev]),
    setSchemeStatus: (code: string, status: SellerScheme['status']) =>
      setSchemes((prev) => prev.map((s) => (s.code === code ? { ...s, status } : s))),
    updateScheme: (code: string, patch: Partial<SellerScheme>) =>
      setSchemes((prev) => prev.map((s) => (s.code === code ? { ...s, ...patch } : s))),
  };
}

export type Catalog = ReturnType<typeof useCatalog>;
