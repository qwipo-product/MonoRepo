---
name: verify
description: Examine changed instructions or implementation. Record evidence, failures, warnings, and omitted checks.
---

# Examine changes

Use the [repository instructions](../../../CLAUDE.md).
Verification does not authorize a commit, push, merge, or deployment.

## Select the checks

1. Examine the changed files and their consumers.
2. Select checks that exercise the changed behavior.
3. Record the command, result, and related limitations.

For documentation changes, examine file paths, links, examples, and conflicting instructions.
Use a temporary repository for procedures that modify Git history or deployment files.
Do not execute publication commands during a documentation test.

## Examine code changes

From the repository root, run each command independently:

```bash
bun install --frozen-lockfile
bun run check --continue --ui=stream
```

The first command checks the dependency declarations against the lockfile.
The second command runs lint, type checks, and builds.
The `--continue` option lets other tasks finish after a failure.
It does not convert a failed check into a successful result.

For an application-only change, a scoped check is also available:

```bash
bunx turbo run lint typecheck build --filter=@mockups/<app>...
```

The trailing dots include workspace dependencies.
For a shared-package change, examine every affected application.
If the consumer list is uncertain, use the full check.
There is no permanent exception for a known failure.
Record any unrelated failure with its current evidence and effect on verification.

## Examine behavior

1. Open the affected flow in the browser.
2. Examine the normal, empty, loading, and error states that the change affects.
3. Examine light and dark themes.
4. Examine keyboard access and form error messages.
5. If a shared Buyer screen changes, examine the two Buyer shells.
6. If list data changes, examine the Seller empty persona.

For changed calculations, validation, or state transitions, examine the need for regression protection.
If focused automated tests provide useful protection, add them.
Do not add tests that only repeat implementation details.
A successful build does not prove correct behavior.

### Use the repository's review entry points

| Change | Review entry point |
| --- | --- |
| Buyer screens and shells | `apps/frontend/qwipo-buyer-paytm-app/src/review/screenIndex.ts` and its README review URLs |
| Buyer empty states | Registered `empty:<id>` entries resolved by `src/App.tsx` in the Buyer application |
| Seller normal and empty states | The persona table in `apps/frontend/seller-store/README.md`; demonstration OTP `1234` |
| Desktop shared component | `apps/frontend/seller-store/src/app/pages/design-system.tsx`, opened through the Design System persona |
| Shared styles | Both application `src/index.css` files and the affected package's source |

For a Seller list change, use Seller and Seller (Empty) where applicable.
For an administrator list change, use Super Admin and Super Admin (Empty) where applicable.
Examine the actual route. Some empty-mode dashboard values remain seeded.
Use `bun run ls` to confirm the configured application name and port before starting a server.

## Diagnose an installation failure

Read the error before changes to manifests or lockfiles.
Examine the Bun version, network access, registry access, workspace folders, and dependency declarations.
Do not delete a lockfile to suppress a failure.
A lockfile-only change can be valid. Examine its cause and dependency changes.

Run these read-only inspections from the repository root:

```bash
git status --short --untracked-files=all
git diff -- package.json bun.lock
rg --files --hidden -g package.json -g '!node_modules' -g '!.git' apps packages
```

Compare discovered manifests with `workspaces.packages` in the root `package.json`.
An untracked `apps/frontend/<name>/package.json` can participate in installation before Git tracks it.
Keep unrelated application folders. Do not remove them merely to make the manifest list smaller.

## Complete the checks

Unless the user tells you to keep a temporary server active, stop it after verification.
Stop only the server processes that you started.
Record successful checks, failed checks, warnings, and checks that you could not perform.
If cached results affect the conclusion, identify those results.
The current deployment build does not run lint or type checks.
Do not use that build as a substitute for this procedure.
