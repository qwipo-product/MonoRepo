# @mockups/components

Buyer product components composed from `@mockups/ui` and `@mockups/types`.
The package exports `StatusBadge`, `PriceLabel`, `ProductImage`, `ProductCard`
and `QtyPill`, along with their related types and formatting helpers.

These components are used by `apps/frontend/qwipo-buyer-paytm-app`. They ship
raw TypeScript, so the app compiles them directly. Keep its Tailwind `@source`
entry for this package and verify component changes in both app themes.
