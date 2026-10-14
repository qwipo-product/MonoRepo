# @mockups/qwipo-buyer-paytm-app

The Qwipo buyer and salesperson browser prototype, with Qwipo and Paytm shells.
It includes sign-in, three-step KYC, distributor registration, catalog, product
details, cart, checkout, orders, account screens and salesperson workflows.

```bash
bun dev --filter=@mockups/qwipo-buyer-paytm-app   # http://localhost:5175
```

Use the review sidebar to switch screens, shells, device sizes, theme and empty
states. Screen definitions live in `src/review/screenIndex.ts`; `src/App.tsx`
connects the flows. Demo fixtures live in `src/data/` and related app modules.
No backend is required.

## Shared design system

- `@mockups/design-tokens/theme.css` provides mobile tokens in light and dark mode.
- `@mockups/ui` provides primitives and the theme provider.
- `@mockups/components` provides product, price, quantity and status components.
- `@mockups/types` supplies the shared order status.
- `@mockups/version-badge` displays the deployed build version.

`src/index.css` must retain its `@source` entries for `packages/ui/src` and
`packages/components/src`: Tailwind does not scan workspace links in
`node_modules`. See `BUILD-NOTES.md` before adding or changing a screen.
