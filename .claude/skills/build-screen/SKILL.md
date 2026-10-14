---
name: build-screen
description: Add or change a screen or flow in an existing application. Keep its design kit and behavior.
---

# Change a screen

Use the [repository instructions](../../../CLAUDE.md).

## Prepare

1. Read the application README and applicable design reference.
2. Find the current screen, navigation, fixtures, and shared components.
3. Resolve important missing requirements with [brief](../brief/SKILL.md).
4. Use an applicable task branch.

Buyer screens use the mobile kit.
Seller Store screens use the desktop kit.
Do not mix their CSS token layers.

### Find the actual screen files

Use paths relative to the selected application folder.

| Application | Files to read before a screen change |
| --- | --- |
| Buyer/Paytm | `README.md`, `BUILD-NOTES.md`, `src/screens/`, `src/review/screenIndex.ts`, `src/App.tsx`, and `src/nav.ts` |
| Seller Store | `README.md`, `src/app/pages/`, `src/app/routes.tsx`, and `src/app/components/root-layout.tsx` |

Buyer uses `@mockups/ui` and `@mockups/components`.
Seller Store uses `@mockups/web-ui`.
Read their `src/index.ts` exports before introducing a new component.
Use the [desktop component map](../../../packages/web-ui/DESIGN-SYSTEM.md#component-source-map) to find an existing implementation.

For Buyer, update the screen definition, rendering branch, and `BUILT` set together.
Keep navigation parameters from `src/nav.ts` and the history behavior in `src/App.tsx`.
For Seller, update the route and its navigation entry together.
Keep role guards and the persona-specific layout.

## Implement

1. If the existing component supplies the required behavior, use it.
2. If the new behavior belongs in an existing primitive, extend its public interface.
3. Keep application-specific components in the application.
4. Use semantic tokens for new styling.
5. Add the screen to the application's actual navigation structure.
6. Use existing fixtures and stores for simulated data.

Use [share-component](../share-component/SKILL.md) for a shared component change.
Use [theme](../theme/SKILL.md) for a token change.
Use [mock-data](../mock-data/SKILL.md) for new fixtures.
Use [add-dependency](../add-dependency/SKILL.md) for a necessary package.

A second application is not necessary for a new primitive variant.
Examine its effect on existing consumers.
Do not remove a useful type or lint check to make the screen compile.

### Keep the styling and state connections

Use `bg-primary`, `text-foreground`, `bg-muted`, and `border-border` where their meanings fit.
For TypeScript color values, use the selected token package's exports.
Keep Buyer brand exceptions in the named block in `src/index.css`.
Use existing names such as `text-paytm-navy` and `bg-paytm-surface`.

Buyer fixtures belong in `src/data/`.
Seller fixtures and stores belong in `src/app/lib/`.
For a new list, implement its empty state.
For simulated asynchronous behavior, include its applicable loading and error states.
Keep Indian currency formatting and the existing product terminology.

Examine `@source` entries in `src/index.css` after adding a shared package.
Use complete class strings instead of constructed fragments such as `shadow-${name}`.
For Buyer sheets, keep the phone frame's `relative` positioning in `src/App.tsx`.
Use the applicable `import type` declarations with `verbatimModuleSyntax`.

## Examine the result

Use [verify](../verify/SKILL.md).
Examine changed navigation, calculations, validation, and state transitions.
Examine the two themes and the applicable device sizes.
Keep accessible labels, keyboard operation, focus, and readable error messages.
If a screenshot conflicts with accessibility, tell the user the necessary adjustment.

Record the user-visible result and any simulated behavior.
Until the user tells you to commit, keep the changes uncommitted.
Until the user tells you to push, keep the changes unpushed.
