---
name: design-language
description: Examine design tokens and component use. Correct confirmed inconsistencies within the authorized scope.
---

# Examine design consistency

Use the [repository instructions](../../../CLAUDE.md).
For a review-only request, record findings without changes.

## Find the design kit

Buyer/Paytm uses `@mockups/ui` and `@mockups/design-tokens`.
Seller Store uses `@mockups/web-ui` and `@mockups/web-tokens`.
Import only the applicable CSS token layer.

Read the actual definitions before judging a match:

| Concern | Source |
| --- | --- |
| Mobile CSS and TypeScript values | `packages/design-tokens/theme.css`, `packages/design-tokens/src/tokens.ts` |
| Desktop CSS and TypeScript values | `packages/web-tokens/theme.css`, `packages/web-tokens/src/tokens.ts` |
| Buyer CSS imports and external brand names | `apps/frontend/qwipo-buyer-paytm-app/src/index.css` |
| Seller CSS imports | `apps/frontend/seller-store/src/index.css` |
| Desktop component examples | `apps/frontend/seller-store/src/app/pages/design-system.tsx` |

For example, `bg-shell` needs a corresponding `--color-shell` binding in the active theme.
Search that definition before replacing the class.
Compare arbitrary classes such as `h-[52px]` against the intended component scale.
Keep documented exceptions and accessibility adjustments that the task still needs.

## Examine the affected code

1. Examine token imports and Tailwind source entries.
2. Find copied component implementations.
3. Find repeated color values and undefined semantic classes.
4. Examine arbitrary sizes against the applicable token scale.
5. Compare corresponding TypeScript and CSS values.
6. Examine light and dark states in the actual component.

Use `rg` to find candidates. Read each match before a decision.
A search match alone does not prove a defect.

| Observation | Required decision |
| --- | --- |
| Copied shared component | Compare behavior before replacement. |
| Repeated shared color | Use the applicable semantic token. |
| Undefined utility | Find its definition or add the necessary token. |
| Arbitrary size | Find if a documented scale value meets the requirement. |
| CSS and TypeScript difference | Decide if the difference is intentional. |
| Existing Seller palette utility | If replacement is outside the task, keep the compatibility layer. |

Use semantic utilities for new screens.
Do not ask for an unrelated rewrite of existing Seller Store pages.
Do not remove an accessibility adjustment solely to enforce visual uniformity.

## External brand colors

Define external brand values once in a named application block.
The Buyer CSS already defines `--paytm-navy`, `--paytm-link`, and `--paytm-cyan`.
Use the existing utilities, including `text-paytm-navy`, instead of introducing synonyms for the same values.
If new utility names are necessary, expose them with `@theme inline`.
Do not redefine shared Qwipo tokens in that block.
Use the named values in screen code.

## Complete the review

For approved fixes, use [theme](../theme/SKILL.md) or [share-component](../share-component/SKILL.md) as applicable.
Examine changed colors for contrast and focus visibility.
Record intentional differences and unresolved design decisions.
