# qwipo-buyer-paytm-app — build notes & standards (read me before adding a screen)

We are rebuilding the Qwipo buyer app screen-by-screen, **strictly matching the
screenshots**, on the shared design system. Follow this every time.

## Source of truth
- **Screenshots:** `/Users/apple/Qwipo/mockups-lab/screenshots/` — each numbered
  file maps to a screen in the FlowIndex (`src/review/screenIndex.ts`). Build to
  the screenshot; when a bottom-sheet/popup has its own reference (e.g.
  `BusinessTypes_bottom_popup.png`, `kyc_section_2.png`) match that too.
- **Assets:** copied from `qwipo-app/public/` into `qwipo-buyer-paytm-app/public/`
  (brand SVGs, banners, category images, brand logos, illustrations). Reference
  by `/path` (Vite serves `public/`). If a screen needs an asset, it's there.
- **Original code:** `qwipo-app/src/**` is the functional reference — reproduce
  its content/flow, re-skinned onto the design system.

## Design-system standards (non-negotiable)
- **Tokens, never arbitrary values.** No `h-[52px]`, `rounded-[24px]`, off-scale
  `text-[9px]`. Use the scale: spacing 4px steps; radius `rounded-md`(8, inputs)
  / `rounded-lg`(12, cards/tiles) / `rounded-t-2xl`(sheets) / `rounded-full`;
  type sizes from the roles. Smallest label size is 10px (micro).
- **Semantic color tokens only.** `bg-card`, `bg-background`, `bg-muted`,
  `text-foreground`, `text-foreground-secondary`, `border-border`, `bg-primary`,
  `text-primary-foreground`, `bg-primary-soft`, and the status set
  (`bg-success-subtle text-success-foreground border-success-border`, etc.).
  No raw hex, no raw Tailwind palette (`bg-blue-50`…). Brand-external colors
  (e.g. Paytm `#00BAF2`) are the only exception.
- **Typography.** Font family is a global default — never write `font-sans` on an
  element. Button text weight comes from the `Button` primitive (bold). Use DS
  sizes/weights; don't re-declare family/size ad hoc.
- **Inputs.** Editable = **white** (`bg-card`); disabled/read-only = **gray**
  (`bg-input`) + muted text. Height 44 (`h-11`), radius `rounded-md`. Use the
  `Input` primitive or the shared `controlClass`.
- **Buttons.** Use `@mockups/ui` `Button`. Disabled styling lives in the
  primitive — never override `disabled:*` per screen.
- **Elevation.** `shadow-sm` resting cards; `shadow-xl` sheets/dialogs;
  `shadow-[var(--shadow-bar-top)]` for sticky bottom bars.
- **Accessibility.** `aria-label` on icon-only buttons and on inputs without a
  visible `<label>`; visible focus ring
  (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`);
  aim for 44px tap targets.
- **Dark mode.** Everything themes via tokens — check light **and** dark.
- **Compose, don't hand-roll.** Build from `@mockups/ui` primitives +
  `@mockups/components`. If a pattern repeats, extract a component; no
  page-specific style soup. Keep screens consistent with each other.

## Per-screen flow
1. Open the screenshot(s). 2. Confirm needed assets exist in `public/`.
3. Build with primitives/components, tokens only. 4. Add to `BUILT` in
   `App.tsx` so the navigator lights it up. 5. Verify live in both shells + dark;
   compare to the screenshot pixel-by-pixel. 6. Run the DS checklist above.

## Shells
- **Buyer:** iOS status bar; root screens (home/reorder/profile) get the bottom
  tab bar; pushed/detail screens carry their own header, no tab bar.
- **Paytm:** the WebView container bar over the same screen; no bottom nav.
