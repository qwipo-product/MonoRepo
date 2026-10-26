---
name: review
description: Examine a change for defects, regressions, and maintenance risks. Keep fixes within the requested scope.
---

# Examine changes

Use the [repository instructions](../../../CLAUDE.md).
For a review-only request, record findings without changes.
For a request that includes fixes, correct confirmed defects in that scope.
Without the user's explicit commit command, do not commit code-review corrections.

## Establish the comparison

1. Find the requested branch, files, or change.
2. Before you select a comparison base, examine local changes.
3. Read the applicable application README and affected shared interfaces.
4. Read the full changed behavior, including its callers.

Examine the effects of the change regardless of its size.

## Examine the change

| Area | Examine |
| --- | --- |
| Behavior | Examine the requested flow and its failure states. |
| Data | Examine calculations, validation, state changes, and fixture consistency. |
| Dependencies | Examine manifest changes and resolved dependency changes. |
| Shared code | Examine every affected application. |
| Design | Use [design-language](../design-language/SKILL.md) for affected tokens and components. |
| Accessibility | Examine labels, keyboard access, focus, contrast, and error associations. |
| Tests | Examine regression protection for important changed behavior. |
| Configuration | Examine build inputs, ports, asset paths, and deployment identities. |
| Documentation | Examine commands, current facts, and authorization boundaries. |

Evaluate `any`, logging, and performance in context.
Record a concrete risk, rather than a stylistic preference.
Do not ask for an unrelated architecture change.

### Inspect concrete integration files

| Change | Files or references to examine |
| --- | --- |
| Buyer navigation | `src/review/screenIndex.ts`, `src/App.tsx`, and `src/nav.ts` in the Buyer application |
| Seller navigation | `src/app/routes.tsx`, `src/app/components/root-layout.tsx`, and `src/app/lib/admin-navigation.ts` |
| Shared component | Its implementation, the package's `src/index.ts`, and consumer `src/index.css` entries |
| Dependency | Root and affected workspace `package.json` files, plus `bun.lock` |
| New or removed application | Root workspace globs, `.claude/launch.json`, application tables, and deployment references |
| Assets | Consumer imports and the owning application's `public/` or `src/imports/` directory |

Use `git status --short --untracked-files=all` to include local work outside the tracked diff.
Examine apparent leftovers such as `_to_delete/`, `old/`, `backup/`, `*.bak`, or duplicate screen implementations.
Confirm ownership and consumers before deletion. A suspicious name alone does not prove that a file is obsolete.
Do not retain a second component implementation merely because it has a different filename.

## Examine results

Use [verify](../verify/SKILL.md) for approved implementation changes.
List findings in order of impact.
For each finding, give the trigger, consequence, file location, and proposed correction.
If you find no defect, give the checks and remaining limits.
Do not imply that a review proves the absence of defects.
