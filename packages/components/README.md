# @mockups/components

Layer 5 of the Qwipo design system — **product components** composed from
`@mockups/ui` primitives and `@mockups/types`. Where a primitive (`Button`,
`Card`, `Badge`) knows nothing about the product, a component here does: a
`StatusBadge` knows order statuses, a `ProductCard` knows a product's price and
pack tiers.

```
Tokens → UI primitives → components (here) → screens
```

Shared across every mockup (Paytm WebView + React Native). The component
**contract** — names, props — is shared; platform rendering can differ via
`Name.tsx` (web) and `Name.native.tsx` (React Native) as the set grows.

## Today

| Component | Composes | Replaces |
|---|---|---|
| `StatusBadge` | `Badge` + `OrderStatus` | the `STATUS_TINT` map duplicated in MyOrders + OrderDetails |

Next up (per the analysis roadmap): `ProductCard` (merges ProductCard +
ShopProductCard), `OrderCard`, `PriceLabel`, `QtyStepper`, `DetailRow`,
`EmptyState`, `SelectableCard`.

No build step — raw TypeScript, consumed directly by the apps.
