# Qwipo App — Buyer & Paytm mini (mockup)

One codebase, two chrome shells, one design system. Shared buyer screens render
inside the **Buyer App** shell (own header + bottom tabs) or the **Paytm mini**
shell (no chrome — the Paytm container owns it). Dev port **5174**.

```bash
bun dev --filter=@mockups/qwipo-app     # http://localhost:5174
```

Flip surface with the top toggle or `?shell=paytm`.

---

## Design system — the source of truth

**The design system is not defined in this README. It lives in the handbook and
the token file — read those, don't re-document them here.**

| What | Where | Rule |
|---|---|---|
| Full design-system spec (tokens, type scale, components, mobile rules, a11y, voice) | [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md) | Canonical. Copied verbatim from `ONDC-Seller-Store`. Change a token there + in `theme.css` in the same change. |
| Token values (colors, radii, fonts, light + dark) | [`src/styles/theme.css`](./src/styles/theme.css) | The only place a hex/oklch value is allowed to live. |
| Mobile-specific overlays (44pt targets, safe areas, bottom sheets, tab bar) | `DESIGN-SYSTEM.md` §6 | Applies to every screen here — this is a mobile surface. |
| Cross-platform token contract | `DESIGN-SYSTEM.md` §9 | Web binding = Tailwind v4 tokens from `theme.css`. |

If a value you need isn't in the scale, **propose adding it to `theme.css`** (and
`DESIGN-SYSTEM.md`) — never reach for an arbitrary class or inline hex.

---

## CSS rules (hard constraints)

1. **Exactly two CSS files exist, and no more may be created:**
   - `src/index.css` — plumbing only: `@import "tailwindcss"`, the `@source`
     line, the `theme.css` import, and the one `--color-shell` review token.
   - `src/styles/theme.css` — the design tokens.

   **Do not add a third CSS file.** No `screen-name.css`, no CSS modules, no
   per-component stylesheet. The old `qwipo-buyer-app` had 20 screen CSS files
   (13k lines) — that structure is explicitly not carried over.

2. **Style with Tailwind utilities bound to DS tokens** — `bg-primary`,
   `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`,
   `rounded-lg`, etc. These resolve from `theme.css`. Reuse `@mockups/ui`
   (`Button`, `Card`, `Badge`, `Input`, `Tabs`, `cn()`) before hand-rolling.

3. **Tokens, never hex.** No `#2563eb`, no `style={{ color: '#...' }}`, no
   `text-[#...]`, no arbitrary spacing like `mt-[13px]` where a scale step fits.

4. **No one-off styling outside the DS.** Duplicate a pattern? Extract it to a
   shared component under `src/components/`, not a copy-pasted class soup.

5. **Light + dark both work** — `theme.css` ships both. Don't hard-code a light
   value that breaks dark.

---

## Structure

```
src/
├── shells/
│   ├── BuyerShell.tsx        # app header + 5-tab bottom bar
│   └── PaytmShell.tsx        # no chrome (Paytm container owns it)
├── screens/                  # SHARED — render in both shells
├── screens-buyer-only/       # Splash, Login, OTP, Profile, Settings…
├── screens-paytm-only/       # MiniAppEntry, PaymentHandoff
├── components/               # shared sheets, dialogs, cards (create as needed)
├── review/ShellSwitcher.tsx  # review-only shell toggle
├── styles/theme.css          # DS tokens
├── App.tsx                   # picks shell, mounts screens
└── index.css                 # plumbing
```

A screen used by both surfaces goes in `screens/`. Surface-specific chrome or
flows (login, native profile) go in the `*-only` folders.

---

## Migrating from `qwipo-buyer-app`

`../qwipo-buyer-app` is the **functional source of truth** — its content, data,
flows, and behaviour must be reproduced here with **zero loss**, only re-skinned
onto this design system. Mock data comes from `@mockups/mock-data` (shared);
don't invent fixtures.

Work proceeds in phases. **Each phase must reach full functional parity** with
the corresponding screens in `qwipo-buyer-app` before it's considered done.

### Per-change workflow (required)

- Reuse `@mockups/ui` + DS tokens; add no CSS file, no inline hex, no one-off style.
- Audit every change with **`/ponytail:ponytail-review`** (kill over-engineering, duplicate styles).
- Run **`/caveman:caveman`** as part of implementation.
- Verify parity against the original screen, then `bun run build --filter=@mockups/qwipo-app`.

### Screen tracker

Status: ⬜ not started · 🟨 in progress · ✅ parity reached

**Auth & onboarding** (buyer-only) — ✅ Phase 1 complete
| Screen | Source | Status |
|---|---|---|
| Splash | `SplashScreen.tsx` | ✅ |
| Onboarding | `OnboardingScreen.tsx` | ✅ |
| Login | `LoginScreen.tsx` | ✅ |
| OTP | `OTPScreen.tsx` | ✅ |
| Complete KYC | `CompleteKycScreen.tsx` | ✅ |
| KYC success | `KycSuccessScreen.tsx` | ✅ |

**Browse & shop** (shared)
| Screen | Source | Status |
|---|---|---|
| Home (both / distributors-only / wholesalers-only) | `HomeScreen.tsx` | ✅ |
| Global search | `GlobalSearchScreen.tsx` | ✅ |
| All brands | `AllBrandsScreen.tsx` | ✅ |
| Wholesalers categories | `WholesalersCategoriesScreen.tsx` | ✅ |
| Wholesaler product list | `WholesalerProductListScreen.tsx` | ✅ |
| Distributors list | `DistributorsListScreen.tsx` | ✅ |
| Selling units (distributor / wholesaler) | `AddToCartSheet.tsx` — the Add flow | ✅ |
| Seller storefront | `SellerStorefront.tsx` | ✅ |
| Product listing | `ProductListingV2.tsx` | ✅ |
| View items | `ViewItemsScreen.tsx` | ✅ |
| Coupons | `CouponsScreen.tsx` | ✅ |
| Reorder | `ReorderScreen.tsx` | ✅ |

**Cart & checkout** (shared) — ✅ Phase 4 complete
| Screen | Source | Status |
|---|---|---|
| Multi-seller cart | `MultiSellerCartV2.tsx` | ✅ |
| Order summary | `OrderSummaryScreen.tsx` | ✅ |
| Order confirmation | `OrderConfirmationScreen.tsx` | ✅ |

**Orders** (shared) — ✅ Phase 5 complete
| Screen | Source | Status |
|---|---|---|
| My orders (+ tracking sheet, cancel dialog) | `MyOrdersScreen.tsx` | ✅ |
| Order details | `OrderDetailsScreen.tsx` | ✅ |

**Profile & settings** (buyer-only)
| Screen | Source | Status |
|---|---|---|
| Profile | `ProfileScreen.tsx` | ⬜ |
| Notifications | `NotificationsScreen.tsx` | ⬜ |
| Settings | `sub/SettingsScreen.tsx` | ⬜ |
| Addresses | `sub/AddressesScreen.tsx` | ⬜ |
| Business details | `sub/BusinessDetailsScreen.tsx` | ⬜ |
| Credit | `sub/CreditScreen.tsx` | ⬜ |
| Payment | `sub/PaymentScreen.tsx` | ⬜ |
| Language | `sub/LanguageScreen.tsx` | ⬜ |
| Help | `sub/HelpScreen.tsx` | ⬜ |
| Terms & conditions | `sub/TermsConditionsScreen.tsx` | ⬜ |

**Shared overlays** (sheets/dialogs — build as their screen needs them)
`AddToCartSheet`, `FiltersSheet`, `DiscountsSheet`, `CartValidationSheet`,
`ProductImageSheet`, `AddAddressSheet`, `CancelOrderDialog`,
`ConfirmChangesDialog`, `CouponAppliedDialog`, `BannerCarousel`, `VendorSummary`.
