# Desktop design system

Use this reference for Seller Store and its shared desktop components.
Use the Buyer instructions for mobile product screens.
The Seller Design System persona opens the component handbook at `/#/design`.

## Principles

1. Use clear labels and predictable layouts.
2. Make available actions agree with the data state.
3. Give the meaning of each empty state and its next available action.
4. Use the applicable design tokens.
5. Keep keyboard access, visible focus, and sufficient contrast.

A visual reference does not override accessible operation.
The current stack uses React 19, Tailwind v4, Radix, Lucide, Sonner, Motion, and Recharts.
Examine the root catalog before a dependency change.

## Sources

| Information | Source |
| --- | --- |
| Runtime CSS values | `packages/web-tokens/theme.css` |
| Typed desktop values | `packages/web-tokens/src/tokens.ts` |
| Shared TypeScript color exports | `packages/design-tokens/src/tokens.ts` |
| Public component exports | `packages/web-ui/src/index.ts` |
| Component code | `packages/web-ui/src/components/` |
| Examples | Seller Store at `/#/design` |
| Handbook implementation | `apps/frontend/seller-store/src/app/pages/design-system.tsx` |
| Generic desktop shell | `packages/web-ui/src/components/app-shell.tsx` |
| Seller persona-specific shell | `apps/frontend/seller-store/src/app/components/root-layout.tsx` |
| Brand assets | `packages/web-ui/src/assets/logos/` |
| Mobile counterpart | `packages/ui/src/` and `packages/design-tokens/theme.css` |

These paths are relative to the repository root.
Synchronize the TypeScript module and CSS file manually.
Some surface and density values differ intentionally between the mobile and desktop kits.
A TypeScript re-export does not change the desktop CSS.
If a rendered value differs, examine the actual CSS binding.

## Import the kit

```tsx
import { Button, Card, StatusBadge, AppShell } from '@mockups/web-ui';
import { chartPalette } from '@mockups/web-tokens';
```

In an application's `src/index.css`, use:

```css
@import "tailwindcss";
@source "../../../../packages/web-ui/src";
@import "../../../../packages/web-tokens/theme.css";
```

Do not import the mobile CSS token layer into the same application.
Use complete Tailwind class names.

## Colors and themes

Use semantic utilities such as `bg-card`, `text-foreground`, `border-border`, and `bg-primary`.
Make sure that the selected utility exists in the theme.
Use named token exports for chart or canvas values.
Keep shared color literals in the token package.

Use status text or icons with status colors.
Do not use color alone to show an error, selection, or status.
If a series has the same meaning in different charts, keep its colors consistent.
Examine contrast in both themes. A palette name does not prove sufficient contrast.

The `.dark` class selects the dark theme.
Use the applicable light or dark logo asset.
Do not invert a logo with CSS as a substitute for its theme variant.

The generic `AppShell` selects logo variants in `src/components/app-shell.tsx`.
Its `themeReady` guard prevents an incorrect first-render theme selection.
Import shared logo assets through `@mockups/web-ui/assets/logos/`.
For Seller's own layout, examine its existing logo and theme handling before changing the shared shell.

Existing Seller pages depend on compatibility rules for raw Tailwind palette classes.
Until their consumers use a verified replacement, keep those rules.
Use semantic utilities for new screen code.

## Typography

Use Inter through the shared font configuration.
The configured system fonts provide a fallback.
Use the existing typography roles instead of arbitrary sizes.

| Role | Typical utility | Use |
| --- | --- | --- |
| Page title | `text-2xl font-semibold` | Main page title |
| Section title | `text-xl font-semibold` | Large section heading |
| Subsection title | `text-base font-semibold` | Subsection heading |
| Compact heading | `text-sm font-semibold` | Cards and list items |
| Body | `text-sm` | Main desktop text |
| Helper | `text-xs` | Help and captions |
| Footnote | `text-[11px]` | The defined `typography.tiny` role |
| Micro label | `text-[10px] uppercase tracking-wider` | The defined `typography.micro` role |
| Identifier | `font-mono text-xs` | SKU and order identifiers |

The desktop TypeScript values include weights 400, 500, and 600.
The heading examples intentionally use weight 600.
Do not impose a conflicting limit of 500.
If text is not readable at the intended scale, do not use the smallest roles.
Before a text-size reduction, examine browser zoom and long labels.

## Layout and density

Use the shared spacing and component scales.
Desktop toolbars commonly use `h-9` controls.
If hit areas remain sufficient, dense card headers can use compact controls.
Use the selected component's radius rather than a copied numeric value.
The CSS radius bindings can differ from similarly named TypeScript values.

| Surface | Layout guidance |
| --- | --- |
| List | Header, toolbar, scrollable data region, and pagination |
| Detail | Back action, title, status, metadata, and main content |
| Form | Labeled sections with related actions |
| Settings | Groups of related options |
| Wizard | Clear current step and available next action |
| Empty state | Explanation and a related available action |
| Bulk actions | Selection count and actions for that selection |
| Filter panel | Current values, apply action, and clear action |

Keep the list toolbar available while its data region scrolls.
Before you set fixed container heights, examine small viewports and zoom.
Even if a surface has a border or shadow, use a visible focus indicator.
A preference for fewer decoration layers does not justify removal of focus styles.

Use the existing breakpoint names: `sm`, `md`, `lg`, `xl`, and `2xl`.
Examine the actual Tailwind configuration before reliance on a numeric breakpoint.

## Component source map

All filenames below are under `packages/web-ui/src/components/`, relative to the repository root.
The public export file is `packages/web-ui/src/index.ts`.
Use this map to inspect an existing component before implementing another version.

| Public component or pattern | Implementation files | Use |
| --- | --- | --- |
| `Button` | `button.tsx` | Actions with shared variants and sizes |
| `Input`, `Textarea`, `Label` | `input.tsx`, `textarea.tsx`, `label.tsx` | Text entry and control labels |
| `Select` | `select.tsx` | Single-option selection |
| Searchable selection | `command.tsx`, `popover.tsx` | `Command` inside `Popover` |
| `MultiSelect` | `multi-select.tsx` | Multiple selections with removable chips |
| `RadioGroup`, `Checkbox`, `Switch` | `radio-group.tsx`, `checkbox.tsx`, `switch.tsx` | Choice and setting controls |
| `Toggle`, `ToggleGroup` | `toggle.tsx`, `toggle-group.tsx` | Toggle and segmented controls |
| `Slider`, `Calendar` | `slider.tsx`, `calendar.tsx` | Numeric and date selection |
| `InputOTP` | `input-otp.tsx` | OTP entry |
| `ImageUploader` | `image-uploader.tsx` | Image selection and previews |
| `Form`, `FormField` | `form.tsx` | React Hook Form integration |
| `LabeledField` | `form-field.tsx` | Standalone label, control, and message wrapper |
| `Badge`, `StatusBadge` | `badge.tsx`, `status-badge.tsx` | Generic and semantic status displays |
| `Card` family | `card.tsx` | Header, title, description, content, and footer composition |
| `Avatar`, `Progress` | `avatar.tsx`, `progress.tsx` | Identity and progress displays |
| `Separator`, `Skeleton` | `separator.tsx`, `skeleton.tsx` | Content separation and loading placeholders |
| `AspectRatio`, `Carousel` | `aspect-ratio.tsx`, `carousel.tsx` | Media sizing and carousel behavior |
| `EmptyState`, `ErrorState` | `empty-state.tsx`, `error-state.tsx` | Empty and failed content |
| `CopyOnHover` | `copy-on-hover.tsx` | Existing copy interaction |
| `PageHeader`, `PageTitle`, `SectionTitle` | `page-header.tsx` | Shared page and section headings |
| `RouteProgress`, `PageLoader` | `page-loader.tsx` | Route and page loading feedback |
| `Dialog`, `AlertDialog` | `dialog.tsx`, `alert-dialog.tsx` | Modal content and confirmation |
| `Sheet`, `Drawer` | `sheet.tsx`, `drawer.tsx` | Side panels and bottom panels |
| `Popover`, `HoverCard`, `Tooltip` | `popover.tsx`, `hover-card.tsx`, `tooltip.tsx` | Anchored secondary content |
| `DropdownMenu`, `ContextMenu`, `Menubar` | `dropdown-menu.tsx`, `context-menu.tsx`, `menubar.tsx` | Action menus |
| `Toaster`, `toast` | `sonner.tsx`, `../index.ts` | Notification host and Sonner export |
| `Tabs`, `Accordion`, `Breadcrumb` | `tabs.tsx`, `accordion.tsx`, `breadcrumb.tsx` | Section navigation and location |
| `Pagination` | `pagination.tsx` | Pagination markup primitives |
| `ListPagination`, `paginate` | `list-pagination.tsx` | List footer and page slicing |
| `Sidebar`, `NavigationMenu` | `sidebar.tsx`, `navigation-menu.tsx` | Application navigation |
| `Table` family | `table.tsx` | Table markup primitives |
| `DataTable` family | `data-table-shell.tsx` | Styled table markup |
| `DataGrid` | `data-table.tsx` | Column-based table |
| `ChartContainer` and chart helpers | `chart.tsx` | Recharts configuration, tooltips, and legends |
| Resizable panels | `resizable.tsx` | Adjustable split regions |
| `ScrollArea`, `Collapsible` | `scroll-area.tsx`, `collapsible.tsx` | Scrollable and expandable content |
| `AppShell`, `ThemeToggle` | `app-shell.tsx`, `theme-toggle.tsx` | Generic desktop layout and theme selection |
| `cn`, `useIsMobile` | `utils.ts`, `use-mobile.ts` | Class composition and viewport helper |

Examine the current exports before use.
If source exports have different public names, use the names in the [package README](README.md).
Compare the props of table or field components, including components with similar names.

`form-field.tsx` exports `FormField` locally, but the package exports it as `LabeledField`.
`data-table.tsx` exports `DataTable` locally, but the package exports it as `DataGrid`.
Keep these names distinct from `form.tsx` and `data-table-shell.tsx` exports.

The desktop `Button` supports `default`, `destructive`, `outline`, `secondary`, `ghost`, and `link` variants.
Its sizes are `default`, `sm`, `lg`, and `icon`.
The default height is `h-9`.
The `sm` size uses `h-8`, and `lg` uses `h-10`.
Use the public props before adding a second set of button styles.

Use `Card`, `CardHeader`, `CardTitle`, and `CardContent` for the existing card structure.
Use `Label` with a matching control ID, or the applicable field wrapper.
Keep field error associations correct.
Visual wrapper composition alone does not establish accessibility.

If a long option list makes selection difficult, use a search control.
Show the selected value and validation state clearly.
Use destructive styling for destructive actions.
If an action can remove user data, get the applicable confirmation.
Do not use hover-only content for an essential action.

Use the existing application pagination behavior.
Select a default page size from the product requirement and data volume.
Do not impose a universal page size or infinite scroll without a usability reason.

`ListPagination` currently defaults to `pageSize={10}`.
Unless the task changes it, keep an existing screen's explicit page size.
Use the component's `page`, `total`, and `onPageChange` props with the same filtered data shown in the table.

## Page implementation references

These files are under `apps/frontend/seller-store/`, relative to the repository root.
Use the route's implementation as the functional reference.
Use semantic classes for new code instead of copying legacy raw palette values.

| Pattern | Route | Implementation |
| --- | --- | --- |
| Order list and detail | `/#/orders`, `/#/orders/:orderId` | `src/app/pages/orders/list.tsx`, `src/app/pages/orders/detail.tsx` |
| Current customer flow | `/#/customers`, `/#/customers/:customerId` | `src/app/pages/customers/list.tsx`, `src/app/pages/customers/detail.tsx` |
| SKU list | `/#/products/my-sku` | `src/app/pages/products/my-sku.tsx` |
| SKU creation choices | `/#/products/add-sku` | `src/app/pages/products/add-sku/index.tsx` |
| SKU form | `/#/products/add-sku/manual` | `src/app/pages/products/add-sku/manual.tsx` |
| Settings hub and store form | `/#/settings`, `/#/settings/store` | `src/app/pages/settings.tsx`, `src/app/pages/settings/store-settings.tsx` |
| Component handbook | `/#/design` | `src/app/pages/design-system.tsx` |

For a desktop list, use a `flex h-full flex-col` container.
Keep the toolbar and pagination outside the `flex-1 overflow-auto` data region.
Use `shrink-0` where those fixed sections must retain their height.
For small viewports and zoom, preserve access to every action and column.

For a detail page, keep the back action, title, status, metadata, and main content in a predictable order.
For a form page, group related fields in cards and keep their actions next to the relevant section.
If a list supports bulk actions, show the selected count and apply actions to that selection.
For a filter panel, retain current values and provide clear apply and reset actions.

## Forms and errors

1. Where possible, give each control a visible label.
2. Connect the label to the control's identifier.
3. If a specific input format is necessary, show that format before submission.
4. Set `aria-invalid` on invalid controls.
5. Connect error text with `aria-describedby` or another supported accessible relationship.
6. Provide a useful correction message.
7. If focus does not move to the submission result, announce that result.

An error label or red border alone is insufficient.
Examine the wrapper's actual behavior. Make sure that the control has the necessary accessible relationship.
Where applicable, keep entered values after a validation failure.

## Responsive and touch behavior

Use the existing mobile design kit for Buyer product screens.
For desktop screens on touch devices, enlarge hit areas as necessary.
Aim for at least 44 CSS pixels for mobile web targets.
For native implementation, use the platform's units and target requirements.
Do not use CSS pixels, iOS points, and Android density-independent pixels as interchangeable.

If cards make the task clearer, replace the wide table with cards.
Otherwise, provide accessible horizontal navigation and visible column context.
Select a sheet, dialog, or full-screen flow according to the content and required interaction.
Do not rely on hover or long press as the only route to an essential action.

Account for safe areas around notches and home indicators.
Examine the on-screen keyboard with fixed action bars.
Keep a usable back action and expected history behavior.

## Motion and layers

If the component supports the shared motion and stacking values, use them.
Examine the actual component styles. Make sure that the token controls the intended layer.
Make sure that dialogs, menus, toasts, and tooltips remain visible in the intended order.

Respect the user's reduced-motion preference for nonessential motion.
Do not apply an arbitrary duration threshold to that preference.
Use an instant or applicable reduced-motion alternative.
Avoid repeated motion that interferes with reading or operation.

## Charts

If the palette fits the data, use `chartPalette` from `@mockups/web-tokens`.
Keep meaning across charts and themes.
Provide labels or another accessible representation of important values.
Do not make a pointer tooltip the only way to get a value.

| Purpose | Common choice |
| --- | --- |
| Change over time | Line chart |
| Magnitude over time | Area chart |
| Category comparison | Bar chart |
| Composition over time | Stacked bar chart with a limited series count |
| Simple part-to-whole comparison | Pie or donut chart with few categories |
| Progress toward a limit | Progress indicator or radial chart |
| Compact trend | Sparkline with a text value |

Use a responsive container with a defined parent height.
Use `ChartContainer` from `src/components/chart.tsx`, or Recharts `ResponsiveContainer` with an explicitly sized parent.
The exported palette is `chartPalette` in `packages/web-tokens/src/tokens.ts`, relative to the repository root.
Do not introduce a separate page-level `CHART_PALETTE` copy.
Examine narrow layouts and long labels.
Examine adjacent series for sufficient visual distinction.

## Product text

Use sentence case for ordinary labels.
For references, keep official product names and exact interface labels.
Use clear action verbs for buttons.
Tell the user what an empty state means and what the user can do next.

Use the application's Indian currency formatting.
Use a consistent date format within each context.
Use clear labels for compact amounts such as lakh and crore.
Avoid decorative punctuation in operational messages.

## Cross-platform handoff

Give the required behavior and token meaning before platform-specific implementation details.
Use the applicable platform controls and accessibility conventions.
Do not copy a static token table into another platform without an update process.
Record intentional differences and the owner of each platform binding.
A web component does not prove native behavior or native accessibility.

## Verification

1. Examine the normal and unusual states affected by the change.
2. Examine keyboard navigation, activation, focus order, and overlay dismissal.
3. Examine accessible names and form error relationships.
4. Examine text and control contrast in both themes.
5. Examine narrow viewports, touch interaction, and browser zoom.
6. Examine reduced-motion behavior.
7. Use an accessibility checker for detectable issues.
8. Complete manual checks that an automated tool cannot perform.
9. Use the repository [verification procedure](../../.claude/skills/verify/SKILL.md).

Use WCAG 2.2 AA as the web accessibility target for new or changed work.
Record each unresolved failure. Do not use a single automated score as proof of conformance.

## Update this reference

If the component contract or design policy changes, update this file.
Where possible, keep implementation-specific values in their source files.
Update the corresponding Seller handbook example.
Examine all affected consumers before completion.
