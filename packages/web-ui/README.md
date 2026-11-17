# Desktop components

This package supplies desktop primitives, shared patterns, and Qwipo brand assets.
It uses Radix components and the desktop token layer.
The consuming application compiles its TypeScript source directly.

## Contents

| Location | Purpose |
| --- | --- |
| `src/components/` | Primitives and shared patterns |
| `src/assets/logos/` | Light and dark brand assets |
| `src/index.ts` | Public exports |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Design and accessibility instructions |

The Seller Store Design System persona opens the handbook at `/#/design`.
Keep product artwork in the application that uses it.

The handbook implementation is `apps/frontend/seller-store/src/app/pages/design-system.tsx`, relative to the repository root.
Use the [component source map](DESIGN-SYSTEM.md#component-source-map) for exact implementation filenames.
Use the [page references](DESIGN-SYSTEM.md#page-implementation-references) for existing list, detail, and form patterns.

## Import components

```tsx
import { Button, Card, StatusBadge, AppShell } from '@mockups/web-ui';
```

A supported component subpath is also available:

```tsx
import { Button } from '@mockups/web-ui/button';
```

For a logo, use the applicable theme variant:

```tsx
import logo from '@mockups/web-ui/assets/logos/Qwipo_Secondary_Logo_for_Light_BG@4x-8.png';
```

Keep these entries in the application's `src/index.css`:

```css
@source "../../../../packages/web-ui/src";
@import "../../../../packages/web-tokens/theme.css";
```

## Export names

| Source export | Package export | Purpose |
| --- | --- | --- |
| `form.tsx`: `FormField` | `FormField` | React Hook Form field |
| `form-field.tsx`: `FormField` | `LabeledField` | Label, control, and message wrapper |
| `data-table-shell.tsx`: `DataTable` | `DataTable` | Table markup primitives |
| `data-table.tsx`: `DataTable` | `DataGrid` | Column-based table |

Examine the actual props before replacement of an existing component.
If a field wrapper does not connect the control to its error description, add that connection explicitly.

## Application shell

`AppShell` supplies common navigation, a header, a mobile drawer, and theme-aware brand assets.
Its navigation items support `subItems`, `externalUrl`, and `disabled`.
Use the applicable router context and a theme provider with `attribute="class"`.

The implementation is `src/components/app-shell.tsx`.
It uses `react-router` for navigation and `next-themes` for theme state.
Related shared controls include `ThemeToggle`, `PageHeader`, `PageTitle`, `SectionTitle`, `EmptyState`, and `ErrorState`.

Seller Store uses a separate persona-based layout.
Its file is `apps/frontend/seller-store/src/app/components/root-layout.tsx`, relative to the repository root.
Unless the task includes its replacement, keep that layout.

## Change a component

Use [share-component](../../.claude/skills/share-component/SKILL.md).
Use semantic token utilities in component code.
If JavaScript token values are necessary, import them from `@mockups/web-tokens`.
Keep token definitions in their token package.
Examine affected consumers and update the handbook example.
