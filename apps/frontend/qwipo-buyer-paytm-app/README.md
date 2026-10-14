# Buyer/Paytm

This browser prototype contains buyer and salesperson flows in Qwipo and Paytm shells.
The flows include sign-in, KYC, distributor registration, catalog, cart, checkout, orders, and account screens.
The application uses local fixtures without a backend server.

## Run the application

From the repository root, run:

```bash
bun dev --filter=@mockups/qwipo-buyer-paytm-app
```

The configured URL is `http://localhost:5175`.
Examine the actual URL in the server output.
The build preview uses port `6175`.

## Examine a screen

1. Open the review sidebar.
2. Select the screen and shell.
3. Examine the applicable device sizes.
4. Examine light and dark themes.
5. Examine the supported empty states.

The screen definitions are in `src/review/screenIndex.ts`.
`src/App.tsx` connects the screens and reads review query parameters.
Fixtures are in `src/data/` and related application modules.
Read [BUILD-NOTES.md](BUILD-NOTES.md) before a screen change.

## Source map

These paths are relative to this application folder.

| File or directory | Responsibility |
| --- | --- |
| `src/screens/` | Buyer screens, with authentication in `auth/` and salesperson screens in `salesperson/` |
| `src/review/screenIndex.ts` | Screen IDs, review groups, labels, and empty-state entries |
| `src/App.tsx` | Screen rendering, `BUILT`, `ROOT_SCREENS`, navigation history, query parameters, and shared flow state |
| `src/nav.ts` | `Navigate` and `NavOpts` types for screen, filter, tab, and distributor context |
| `src/review/FlowIndex.tsx` | Review sidebar and screen selection |
| `src/review/demoState.tsx` | Empty-state context for supported screen demonstrations |
| `src/review/DeviceSwitcher.tsx` | Review device and orientation selection |
| `src/shells/ShellChrome.tsx` | Qwipo and Paytm frame controls |
| `src/data/cart.ts`, `src/data/products.ts`, `src/data/orders.ts` | Cart construction, product fixtures, and order fixtures |
| `src/data/dmsPartners.ts`, `src/data/tcpl.ts` | Distributor registration and TCPL demonstration data |
| `src/main.tsx` | Root providers, stylesheet import, and version display |
| `src/index.css` | Shared CSS imports, Tailwind source entries, and named Paytm colors |
| `public/` | Product artwork and application assets |

Adding a file under `src/screens/` does not register a working screen.
Update the applicable screen entry, rendering branch, and `BUILT` set.
Keep `NavOpts` context and the navigation history consistent with the new flow.
If a destination is a root screen, examine `ROOT_SCREENS` before changing the bottom navigation.

For a direct review, use the configured local server with a screen query:

```text
http://localhost:5175/?screen=cart&shell=buyer
http://localhost:5175/?screen=cart&shell=paytm
http://localhost:5175/?screen=empty:cart&shell=buyer
```

Use a registered screen ID from `src/review/screenIndex.ts`.
Empty entries use `empty:<id>` and resolve through `baseScreenOf` in `src/App.tsx`.
Examine the actual screen's empty-state support before adding another review entry.

## Shared packages

| Package | Purpose |
| --- | --- |
| `@mockups/design-tokens` | Mobile token values and CSS theme |
| `@mockups/ui` | Primitives and theme provider |
| `@mockups/components` | Product, price, image, quantity, and status components |
| `@mockups/types` | Shared order status |
| `@mockups/version-badge` | Build version display |

Keep the Tailwind source entries for `packages/ui/src` and `packages/components/src` in `src/index.css`.

```css
@import "tailwindcss";
@source "../../../../packages/ui/src";
@source "../../../../packages/components/src";
@import "../../../../packages/design-tokens/theme.css";
```

Use relative public-asset URLs or imported asset modules for prefix-hosted previews.
Use the [repository instructions](../../../CLAUDE.md) for verification and authorization.
