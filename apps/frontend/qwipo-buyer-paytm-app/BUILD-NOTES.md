# Buyer screen instructions

Use the [repository instructions](../../../CLAUDE.md) and the current task's visual references.
Keep the requested behavior and accessible operation.
If a screenshot conflicts with accessibility, tell the user the necessary adjustment.

## References

| Item | Reference |
| --- | --- |
| Working flow | `src/App.tsx` |
| Screen definitions | `src/review/screenIndex.ts` |
| Assets | The application's `public/` directory |
| Mobile primitives | `packages/ui/src/`, relative to the repository root |
| Product components | `packages/components/src/`, relative to the repository root |
| Token definitions | `packages/design-tokens/`, relative to the repository root |

For screen registration and review URLs, use the [application source map](README.md#source-map).
For navigation changes, read `src/nav.ts`, `fallbackBack`, and the history handling in `src/App.tsx`.
When the user returns to a previous screen, restore its filter, distributor, and tab context.

Use only visual references that apply to the current task.
Historical code is evidence of earlier behavior, not an automatic requirement.

## Components and styles

- Use existing mobile primitives and product components.
- Use semantic colors such as `bg-card`, `text-foreground`, and `border-border`.
- Use the token scale for spacing, typography, and radius.
- Keep external brand colors in one named CSS block.
- Use the shared input styles and button variants.
- Keep the disabled styles of shared controls.
- Examine input surfaces in both themes. Use the actual theme values for editable inputs.
- Use the theme provider for the `.dark` class.

### Concrete component and token choices

The shared paths in this table are relative to the repository root.

| Need | Implementation or token |
| --- | --- |
| Buttons and disabled/loading behavior | `packages/ui/src/button.tsx`: `Button`, `buttonVariants` |
| Editable, read-only, disabled, and invalid inputs | `packages/ui/src/input.tsx`: `Input` |
| Form labels and composed controls | Application file `src/components/formbits.tsx`: `Field`, `controlClass` |
| Bottom sheets | `packages/ui/src/sheet.tsx`: `Sheet` |
| Product cards, prices, and images | `packages/components/src/index.ts` |
| Typography roles and CSS dimensions | `packages/design-tokens/theme.css` |
| Typed colors, spacing, radius, and component values | `packages/design-tokens/src/tokens.ts` |

The mobile `Input` uses `h-11`, `rounded-md`, and `bg-card` for editable fields.
Read-only and disabled fields use `bg-input` and muted text.
Keep these semantic surfaces in both themes. Do not replace them with fixed white or gray colors.
Use `FieldError` from `@mockups/ui` where its behavior fits the form.

The default mobile `Button` uses a 44-pixel height and bold text.
Use its `variant`, `size`, `fullWidth`, and `loading` interface before adding screen-specific styles.
Keep disabled behavior in the primitive instead of adding conflicting `disabled:*` classes.

Use `rounded-md` for 8-pixel mobile input corners and `rounded-lg` for 12-pixel card corners.
The current `Sheet` uses `rounded-t-xl`.
Unless the task changes the radius, keep the primitive's value.
Use `shadow-sm` for resting cards and `shadow-xl` for sheets where applicable.
For a raised bottom bar, use the defined `--shadow-bar-top` token.
Use existing spacing and typography roles instead of arbitrary values such as `h-[52px]` or `text-[9px]`.

The theme sets the font family globally.
Use roles such as `type-h2`, `type-body`, and `type-price` without repeating the font family on each element.
The `type-micro` role is 10 pixels. Use it only for suitable short labels that remain readable.
Use semantic status combinations such as `bg-success-subtle text-success-foreground border-success-border`.

The named Paytm block is in `src/index.css`.
Use existing utilities such as `text-paytm-navy`, `text-paytm-link`, and `bg-paytm-cyan`.
Do not copy their hexadecimal values into individual screens.

Where possible, use visible labels for form controls.
Give icon-only buttons an accessible name.
Associate each error message with its control through `aria-describedby` or another supported relationship.
If a control has an error, set `aria-invalid`.
Keep a visible keyboard focus indicator.
Where practical, use a target size of at least 44 CSS pixels for mobile web controls.

## Change a screen

1. Read the related flow and screen definition.
2. Open the supplied visual reference.
3. Make sure that the required assets exist.
4. Implement the screen with the shared components.
5. Where necessary, register the screen in the actual navigation and `BUILT` set.
6. Examine the screen in each applicable shell.
7. Examine light, dark, empty, and error states.
8. Use [verify](../../../.claude/skills/verify/SKILL.md).

Compare the result with the reference. Keep accessibility support.
Do not record simulated KYC or payment behavior as a live integration.

## Shell behavior

The Qwipo shell uses the application-defined root screen set for its bottom navigation.
Detail screens use the applicable screen header.
The Paytm shell adds its WebView container bar without the Qwipo bottom navigation.
Examine `ROOT_SCREENS` in `src/App.tsx` before a navigation change.

The phone frame in `src/App.tsx` supplies the `relative` positioning context for mobile sheets.
`Sheet` renders with `absolute inset-0`.
Removing that context can make the overlay cover the browser viewport.
Keep the existing `ShellChrome` behavior in `src/shells/ShellChrome.tsx`.
