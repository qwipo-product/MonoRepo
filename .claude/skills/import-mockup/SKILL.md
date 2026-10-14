---
name: import-mockup
description: Import an authorized application from a local source. Adapt its code to the repository. Keep the required behavior.
---

# Import an application

Use the [repository instructions](../../../CLAUDE.md).
Get the source path and requested flows from the user or existing task context.
Use [brief](../brief/SKILL.md) only for missing decisions.

## Examine the source

1. Read the source manifest and related documentation.
2. Find its framework, dependencies, routes, assets, and tests.
3. Find backend calls and simulated behavior.
4. Select the target design kit from the intended user and device.
5. Decide which source code can transfer. Find the code that must be replaced.

Keep the source outside this repository's workspace directories during inspection.
An extra package manifest inside a workspace directory can change dependency resolution.

Inspect `package.json`, `src/`, `public/`, and the source's route and style configuration.
Search for `fetch`, `axios`, and client creation calls before selecting a simulation strategy.
Search for `@/` imports and relative image imports before changing directory depth.
The active workspace globs are `apps/frontend/*` and `packages/*` in the root `package.json`.
Do not stage a raw export under those directories during inspection.

## Prepare the target

Use an applicable task branch.
For an explicitly requested new application, use [new-mockup](../new-mockup/SKILL.md).
Unless a configuration change is necessary, keep the existing target configuration.

For a new target, keep the generated `package.json`, `tsconfig.json`, `vite.config.ts`, and `eslint.config.js`.
Keep the generated `src/main.tsx` and `src/index.css` as the integration starting point.
Do not replace the repository's toolchain with the export's configuration.
If the agreed behavior needs source configuration, adapt the relevant parts.

Seller preserves `src/app/` beside `src/imports/` for asset imports such as `../../imports/categories/<file>.png`.
Before flattening that layout, examine every affected import.
For a Buyer screen rebuild, use [BUILD-NOTES.md](../../../apps/frontend/qwipo-buyer-paytm-app/BUILD-NOTES.md) and the supplied visual references.

Do not copy the source Git directory, credentials, environment files, dependency installation, or generated build output.
Examine useful tests and documentation before adaptation. Do not discard them solely because they came from another repository.

## Transfer the required behavior

1. If relative imports depend on directory depth, keep that depth.
2. Copy only the required source files and assets.
3. Replace duplicate primitives with the applicable shared components.
4. Reconcile dependencies with [add-dependency](../add-dependency/SKILL.md).
5. Adapt source aliases and framework-specific code to the target configuration.
6. If the agreed result is a local prototype, replace production calls with explicit fixtures.
7. Keep useful validation and error states.

Do not silently replace a required real integration with simulated behavior.
Record that scope difference before dependent work.

The retained applications do not configure an `@/` alias.
Adapt imported `@/` paths to the target's existing relative-import convention.
Use `src/app/lib/*-data.ts` and existing stores for Seller fixtures.
Use `src/data/` for Buyer fixtures.
For a type-only import, use `import type` instead of disabling `verbatimModuleSyntax` after a `TS1484` error.

## Adapt styles and routes

Import the selected shared token layer.
Keep the Tailwind source entries for every shared component package in use.
For Buyer, scan `packages/ui/src` and `packages/components/src` from `src/index.css`.
For Seller, scan `packages/web-ui/src` from `src/index.css`.
Use the exact relative entries in the applicable application README.

Adapt old `@tailwind` directives to the target's existing `@import "tailwindcss"` setup.
If the source has `tailwind.config.js` or `globals.css`, inspect their tokens and overrides before transferring styles.
Move necessary shared values into the selected token package instead of copying those files over the target setup.
The desktop theme already imports `tw-animate-css`.
Before adding another animation stylesheet, examine that theme.

Put shared token additions in the token package.
For external brand colors, use one named application block as described in [design-language](../design-language/SKILL.md).

Use imported asset modules or preview-compatible relative URLs for public assets.
Do not introduce root-relative asset strings such as `/images/item.png` into prefix-hosted previews.
Keep `base: './'` for the existing preview deployment.
Use hash routes or the existing Buyer query navigation.
After a routing change, examine the actual preview prefix.

## Examine the import

1. Correct compiler errors from their reported cause.
2. Keep `import type` for TypeScript types.
3. Use [design-language](../design-language/SKILL.md) for changed styles.
4. Use [verify](../verify/SKILL.md).
5. Compare each imported flow with its approved reference.
6. Record any remaining difference in the application README.

Record verified flows and unresolved differences.
Do not automatically commit, push, merge, or deploy the import.
