---
name: share-component
description: Extend an existing shared component or move a reusable component into the appropriate design kit.
---

# Change a shared component

Use the [repository instructions](../../../CLAUDE.md).

## Select the location

| Component | Location |
| --- | --- |
| Mobile primitive | `packages/ui/src/` |
| Buyer product component | `packages/components/src/` |
| Desktop primitive or pattern | `packages/web-ui/src/components/` |
| Application-specific component | The owning application |

A second application is not necessary for an extension to an existing shared primitive.
A reusable pattern can serve several screens in one application.
Until shared ownership has a clear benefit, keep a new application-specific component local.
Do not add an abstraction solely for a possible future consumer.

Use the matching public entry point:

| Package | Export file |
| --- | --- |
| Mobile primitives | `packages/ui/src/index.ts` |
| Buyer product components | `packages/components/src/index.ts` |
| Desktop components | `packages/web-ui/src/index.ts` |

In the desktop package, keep the public names `LabeledField` and `DataGrid` for the existing colliding source exports.
Use the [desktop export map](../../../packages/web-ui/README.md#export-names) before adding an export.
Update examples in `apps/frontend/seller-store/src/app/pages/design-system.tsx` for desktop component changes.

## Change the component

1. Find current consumers and the required interface.
2. Unless the request changes existing behavior, keep that behavior.
3. Use tokens from the selected design kit.
4. Export the public interface from the package entry point.
5. Update affected consumers.
6. After all consumers use the replacement, remove the obsolete local copy.
7. Update the component documentation and applicable handbook example.
8. Use [verify](../verify/SKILL.md) for all affected consumers.

Unless a different build arrangement is necessary for the task, keep the existing direct TypeScript exports.
For a new build step, use a working watch process. Set the correct cache dependencies.

Examine each consumer's Tailwind source entries.
For Buyer, examine `apps/frontend/qwipo-buyer-paytm-app/src/index.css`.
For Seller, examine `apps/frontend/seller-store/src/index.css`.
Point each `@source` entry at the package's actual source directory, not its `node_modules` link.
Examine keyboard access and both themes.
