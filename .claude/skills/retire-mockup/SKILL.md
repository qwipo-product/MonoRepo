---
name: retire-mockup
description: Remove an application within the requested scope. Keep retained consumers and record separate hosted resources.
---

# Remove an application

Use the [repository instructions](../../../CLAUDE.md).
A clear removal request supplies authorization for the named local application.
If the target or necessary data preservation is uncertain, ask for clarification.
Do not contact another author without the user's authorization.

## Examine the application

1. Make sure that the application folder and package name agree with the removal request.
2. Examine tracked changes and untracked files in that folder.
3. Find retained applications that use its code or assets.
4. Find its launch configuration and development ports.
5. Find any deployment files and hosted resource references.

Keep unrelated or uncommitted work before deletion.
Git history keeps tracked committed files, not every local file.

Read the application's `package.json`, `vite.config.ts`, and deployment files before deletion.
Inspect `.claude/launch.json` for its launch entry and port.
Search the package name and folder name in retained source before removing shared files.
Inspect root `README.md` and `CLAUDE.md` application tables, consumer CSS `@source` entries, and `bun.lock` workspace entries.
The current workspace globs are in the root `package.json`.

## Remove the local application

1. Use an applicable task branch.
2. Remove only the approved application files.
3. Remove obsolete imports, launch entries, and documentation references.
4. If no retained consumer uses a dependency or shared file, remove it within the approved scope.
5. Run `bun install` with the repository's Bun version.
6. Examine the lockfile changes.
7. Use [verify](../verify/SKILL.md) for the retained applications.

To release a development port, first find the process and its owning application.
Stop only a confirmed process for the application in the removal request.
Do not stop an unrelated listener that uses the same port.

## Record hosted resources

Local file deletion does not remove Azure pipelines, registry images, DNS records, or GitOps manifests.
List each known external resource and its owner.
Relevant GitOps paths have the form `bms-chart/<env>/<service>.yaml` in the separate `Qwipo B2B/k8s` repository.
The deployment generator refers to the Azure pipeline folder `Mockups Lab`.
Confirm actual registered resources before preparing their removal.

Without user authorization for external resources, do not change them.
After manifest deletion, examine the actual reconciliation result. Make sure that the live service no longer exists.

Record removed files, retained applications, port checks, and pending external work.
Do not automatically commit, push, merge, or delete branches.
