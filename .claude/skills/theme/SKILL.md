---
name: theme
description: Change colors, typography, spacing, or other design tokens. Examine every affected application and theme.
---

# Change design tokens

Use the [repository instructions](../../../CLAUDE.md).

## Find the token owner

| Change | Files to examine |
| --- | --- |
| Mobile values | `packages/design-tokens/src/tokens.ts` and `packages/design-tokens/theme.css` |
| Desktop values | `packages/web-tokens/src/tokens.ts` and `packages/web-tokens/theme.css` |
| External brand shell | Named Paytm variables in `apps/frontend/qwipo-buyer-paytm-app/src/index.css` |

The application CSS entry points are `apps/frontend/qwipo-buyer-paytm-app/src/index.css` and `apps/frontend/seller-store/src/index.css`.
Mobile theme state comes from `packages/ui/src/theme.tsx`.
Seller configures `next-themes` in `apps/frontend/seller-store/src/main.tsx` with `attribute="class"`.
Both CSS themes use the `.dark` class on the document root.

For typography, trace `--font-sans` and any font-loading references in the application's `index.html`.
For desktop colors, trace variables such as `--primary` through `@theme inline` to utilities such as `bg-primary`.
Update the applicable example in `apps/frontend/seller-store/src/app/pages/design-system.tsx` after a desktop design change.

The desktop TypeScript module re-exports some mobile values.
The desktop CSS contains separate literal values.
A TypeScript change does not automatically update that CSS.
Keep documented differences between mobile and desktop values.
Some density and surface values differ by design.

## Change the token

1. Find the actual TypeScript and CSS consumers.
2. Make sure that the light and dark values agree with the request.
3. Update each applicable representation in the same change.
4. Keep deliberate differences between the design kits.
5. Update the affected examples and reference tables.
6. Use [design-language](../design-language/SKILL.md).
7. Examine each affected application in both themes.
8. Use [verify](../verify/SKILL.md).

Use semantic names in components.
Keep shared token definitions out of component packages.
Import one CSS token layer in each application.
Keep external brand values in one named block. Do not replace shared tokens with those values.

Synchronize the token files manually.
Compare corresponding values explicitly. There is no automatic guarantee that they agree.
After a color change, examine contrast and focus visibility.
