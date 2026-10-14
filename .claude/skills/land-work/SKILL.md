---
name: land-work
description: Prepare an integration or release. Merge or push only within the user's explicit authorization.
---

# Integrate changes

Use the [repository instructions](../../../CLAUDE.md).
A development task does not authorize a commit, merge, push, deployment, or branch deletion.
Before a Git history change or remote operation, make sure that the user authorized the action and target.
If existing authorization clearly includes that action, use it.

## Prepare the integration

1. Examine local changes and branch references.
2. Make sure that the proposed source contains the intended work.
3. Use [review](../review/SKILL.md).
4. Use [verify](../verify/SKILL.md).
5. Fetch the current target reference.
6. Examine the final difference against that reference.

If the work is uncommitted, record that condition.
Wait for an explicit commit command before a commit.
If a check fails, resolve the failure or record the blocked integration.

## Select the integration method

If the project supports pull requests, use one for integration into shared branches.
Examine the live Azure branch policies before an approved remote integration.
For protected development and release branches, get an independent code review and successful validation.
Do not use documentation alone as proof that these controls exist.

The current build pipeline runs the application build only.
Server-side enforcement of lint and type checks is not available without a separate validation step.
Until that step exists, provide the local verification results and record the enforcement gap.

For an explicitly approved local merge, examine the source and target first.
If the working tree is clean, use `git merge --no-commit --no-ff <source>`.
This prepares a merge for inspection. The command does not create a commit.
After the user's explicit commit command, complete the merge commit.
Without the user's explicit push command, do not push.

Do not delete local or remote task branches as an automatic completion step.
A request to merge does not authorize branch deletion.

## Resolve conflicts

1. Read the base and both changed versions.
2. Establish the intended combined behavior.
3. Resolve each conflict from that intent.
4. Examine removed code as well as added code.
5. After resolution, repeat the affected checks.

Do not retain both entries automatically.
A removed route or dependency can be an intentional change.

For a lockfile conflict, resolve the dependency declarations first.
Keep intentional dependency updates from both branches.
Use the specified Bun version to produce a consistent lockfile.
Examine the resolved versions before the frozen-install check.
If a valid update disappears, restore its intended resolution before completion.

| Conflict | Files to reconcile together |
| --- | --- |
| Dependencies | Root `workspaces.catalog`, affected workspace `package.json` files, and `bun.lock` |
| Buyer navigation | `src/review/screenIndex.ts`, `src/nav.ts`, and `src/App.tsx` in the Buyer application |
| Seller navigation | `src/app/routes.tsx`, `src/app/components/root-layout.tsx`, and `src/app/lib/admin-navigation.ts` |
| Shared design tokens | The affected package's `src/tokens.ts`, `theme.css`, and consumers |
| Shared component exports | Implementation files and the package's `src/index.ts` |

For navigation conflicts, preserve the intended route and its data context instead of concatenating both lists.
For token conflicts, use [theme](../theme/SKILL.md) to trace CSS and TypeScript values.

## Prepare a promotion

The current branch mapping is `dev`, `testing`, `staging`, then `main`.
Examine the exact source commit, target commit, release artifact, and requested environment.
Run commands independently.
If a fetch, switch, pull, merge, or validation fails, stop.
Do not hide error output.

Use [deploy-mockup](../deploy-mockup/SKILL.md) for deployment checks.
Before a production action, make sure that the live production approval control exists.
Record the actual completion state. Preparation is not a completed merge or deployment.
