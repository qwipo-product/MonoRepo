---
name: add-dependency
description: Add or update a dependency through the root catalog. Examine its effect on all consumers.
---

# Change a dependency

Use the [repository instructions](../../../CLAUDE.md).

The catalog is `workspaces.catalog` in the root `package.json`.
Application manifests are under `apps/frontend/<app>/package.json`.
Shared package manifests are under `packages/<package>/package.json`.

Before adding a dependency, examine these existing options:

| Need | Existing package or implementation |
| --- | --- |
| Desktop charts | `recharts` and `packages/web-ui/src/components/chart.tsx` |
| Searchable selection | `cmdk`, `command.tsx`, and `popover.tsx` in `packages/web-ui/src/components/` |
| Forms and date selection | `react-hook-form`, `react-day-picker`, and the desktop form/calendar components |
| Maps | `leaflet`, `react-leaflet`, and existing Seller map consumers |
| Carousels, notifications, and motion | `embla-carousel-react`, `sonner`, and `motion` |

For an existing catalog dependency, use a workspace declaration such as:

```json
{
  "dependencies": {
    "react": "catalog:"
  }
}
```

Use `workspace:*` for an internal package such as `@mockups/ui`.
Do not copy a source application's version ranges into the destination manifest.

1. Find if an existing package already supplies the required function.
2. Examine the root dependency catalog.
3. If the dependency exists, use `catalog:` in the application's manifest.
4. Otherwise, select a compatible stable version from the package's official documentation.
5. Add that exact version to the root catalog.
6. Add the dependency to each workspace that imports it directly.
7. Run `bun install` with the repository's Bun version.
8. Examine the manifest and lockfile differences.
9. Use [verify](../verify/SKILL.md) for the affected consumers.

For a catalog upgrade, find all consumers before the change.
Keep the upgrade in the requested scope.
Examine compatibility with the installed toolchain before selection of the latest version.

A lockfile-only update can be intentional, including a corrected resolution or format migration.
Record its cause. Examine the resolved dependency changes.
An install error can result from network access, credentials, tool versions, or dependency declarations.
Read the error before a correction.
Do not delete the lockfile merely to get a successful install.

If the dependency supplies CSS, examine its import order against the token layer.
For example, Seller imports `leaflet/dist/leaflet.css` after its shared theme in `apps/frontend/seller-store/src/index.css`.
Examine `bun.lock` together with the changed manifests and the workspace globs in the root `package.json`.
Until the user tells you to commit, keep changes uncommitted.
