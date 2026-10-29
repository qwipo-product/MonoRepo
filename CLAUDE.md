# Repository instructions

## Scope and authority

Use these instructions for work in this repository.
The repository contains frontend prototypes for product review.
Keep the demonstrated behavior correct.
Record simulated behavior in the result.

If these files disagree with the user's instructions, obey the user's instructions.
Without the user's explicit commit command, do not commit changes.
Without the user's explicit push command, do not push changes.
Permission to edit files does not give permission to commit or push them.

Do not merge branches, delete remote branches, or deploy applications without the user's authorization.
Do not send messages to other people without the user's authorization.
Existing permission applies to the agreed task. Do not ask for the same permission again.

## Start the work

1. Read the user's request and the applicable application README.
2. Examine the current branch and local changes.
3. Keep changes that belong to other work.
4. State the intended result in plain language.
5. Select the applicable procedure from the table below.

If an existing task branch is applicable, use it.
For new work on a shared branch, use [start-work](.claude/skills/start-work/SKILL.md).
If the user supplies a branch name, use that exact name.
If Git rejects that name, stop.
If the user does not supply a branch name, use `feature/<app>-<change>`.
Do not use `dev/<name>` while the `dev` branch exists.

## Procedures

Use only the procedures necessary for the request.
A reference to another procedure does not authorize its external actions.
For an unmatched request, use the specified scope. Do not add a screen change without a related requirement.

| Request | Procedure |
| --- | --- |
| Clarify an incomplete product request | [brief](.claude/skills/brief/SKILL.md) |
| Create an application | [new-mockup](.claude/skills/new-mockup/SKILL.md) |
| Import an application | [import-mockup](.claude/skills/import-mockup/SKILL.md) |
| Change a screen or flow | [build-screen](.claude/skills/build-screen/SKILL.md) |
| Change demonstration data | [mock-data](.claude/skills/mock-data/SKILL.md) |
| Change design tokens | [theme](.claude/skills/theme/SKILL.md) |
| Extend a component package | [share-component](.claude/skills/share-component/SKILL.md) |
| Add or update a dependency | [add-dependency](.claude/skills/add-dependency/SKILL.md) |
| Examine an implementation | [verify](.claude/skills/verify/SKILL.md) |
| Code review | [review](.claude/skills/review/SKILL.md) |
| Examine design consistency | [design-language](.claude/skills/design-language/SKILL.md) |
| Create or update a task branch | [start-work](.claude/skills/start-work/SKILL.md) |
| Prepare or do an approved merge | [land-work](.claude/skills/land-work/SKILL.md) |
| Recover from a Git problem | [git-doctor](.claude/skills/git-doctor/SKILL.md) |
| Prepare a demonstration link | [share-mockup](.claude/skills/share-mockup/SKILL.md) |
| Prepare or do an approved deployment | [deploy-mockup](.claude/skills/deploy-mockup/SKILL.md) |
| Diagnose a deployment problem | [deploy-doctor](.claude/skills/deploy-doctor/SKILL.md) |
| Remove an application | [retire-mockup](.claude/skills/retire-mockup/SKILL.md) |
| Prepare an engineering specification | [handoff](.claude/skills/handoff/SKILL.md) |

## Applications and packages

| Application | Development port | Preview port | Design kit |
| --- | --- | --- | --- |
| `qwipo-buyer-paytm-app` | 5175 | 6175 | Mobile |
| `seller-store` | 5174 | 6174 | Desktop |
| `rirn` | 5173 | 6173 | Desktop |
| `rirn-retailer` | 5176 | 6176 | Mobile |
| `qwipo-analytics` | 5177 | 6177 | Mobile kit in a desktop layout |
| `digidukaan` | 5178 | 6178 | Imported website design; public site at digidukaan.qwipo.com |
| `storybook` | 6006 | — | Mobile component catalog |
| `storybook-web` | 6007 | — | Desktop component catalog |
| `mock-api` | 8787 | — | Bun HTTP service |

The frontend applications use local demonstration data.
Mock API is optional. It serves shared fixtures over HTTP.
Buyer and Seller Store do not require it.
Use each application's README for its routes and demonstration inputs.

| Purpose | Location |
| --- | --- |
| Mobile tokens | `packages/design-tokens` |
| Mobile primitives | `packages/ui` |
| Buyer product and analytics chart components | `packages/components` |
| Desktop tokens | `packages/web-tokens` |
| Desktop primitives and handbook | `packages/web-ui` |
| Shared domain types | `packages/types` |
| Shared demonstration fixtures | `packages/mock-data` |
| Translation provider and dictionaries | `packages/i18n` |
| Version display | `packages/version-badge` |
| Buyer fixtures | `apps/frontend/qwipo-buyer-paytm-app/src/data` |
| Seller fixtures and stores | `apps/frontend/seller-store/src/app/lib` |
| Analytics fixtures | `apps/frontend/qwipo-analytics/src/data` |
| DigiDukaan website content and images | `apps/frontend/digidukaan/src/data` |
| RIRN company session and fixtures | `apps/frontend/rirn/src/lib` |
| RIRN retailer session and fixtures | `apps/frontend/rirn-retailer/src/lib` |
| Mock API routes and collection map | `apps/backend/mock-api/src` |

### Read the implementation references

Before a Buyer screen change, read [BUILD-NOTES.md](apps/frontend/qwipo-buyer-paytm-app/BUILD-NOTES.md).
Use the [Buyer source map](apps/frontend/qwipo-buyer-paytm-app/README.md#source-map) for screen registration, navigation, and shells.
Use the [Seller source map](apps/frontend/seller-store/README.md#source-layout) for routes, role guards, layouts, and stores.
Before a desktop component change, read the [design reference](packages/web-ui/DESIGN-SYSTEM.md).

| Need | Package and public entry point |
| --- | --- |
| Mobile buttons, inputs, cards, sheets, quantity controls, and theme provider | `@mockups/ui`: `packages/ui/src/index.ts` |
| Buyer product cards, prices, images, quantity pills, and order status | `@mockups/components`: `packages/components/src/index.ts` |
| Desktop forms, tables, overlays, charts, and application shell | `@mockups/web-ui`: `packages/web-ui/src/index.ts` |
| Mobile TypeScript token values | `@mockups/design-tokens`: `packages/design-tokens/src/tokens.ts` |
| Desktop TypeScript token values and chart palette | `@mockups/web-tokens`: `packages/web-tokens/src/tokens.ts` |
| Shared `OrderStatus` type | `@mockups/types`: `packages/types/src/index.ts` |
| Shared product, order, address, and seller fixtures | `@mockups/mock-data`: `packages/mock-data/src/index.ts` |
| Translation provider and hooks | `@mockups/i18n`: `packages/i18n/src/index.tsx` |
| `VersionBadge`, `APP_VERSION`, and `APP_COMMIT` | `@mockups/version-badge`: `packages/version-badge/src/index.ts` |

Import components through their public package exports.
For available component names and source files, use the applicable package README.
Mount `VersionBadge` once in the application's `src/main.tsx`.

### Find shared configuration

These paths are relative to the repository root.
Before a shared configuration change, examine its consumers and the authorized scope.

| File or directory | Responsibility |
| --- | --- |
| `package.json` | Bun version, workspace globs, dependency catalog, and root commands |
| `bun.lock`, `bunfig.toml` | Resolved dependencies and Bun installation settings |
| `flake.nix`, `flake.lock`, `.envrc` | Optional Nix and direnv environment |
| `turbo.json` | Task dependencies, cache outputs, and build environment variables |
| `packages/tsconfig/base.json` | Shared TypeScript options |
| `packages/tsconfig/react-app.json`, `packages/tsconfig/react-library.json` | Application and package TypeScript presets |
| `packages/tsconfig/bun-app.json` | Bun service TypeScript preset |
| `packages/eslint-config/base.js`, `packages/eslint-config/react.js` | Shared lint presets |
| `.claude/launch.json` | Local application launch commands and ports |
| `scripts/new-mockup.ts`, `scripts/list-apps.ts` | Application generation and workspace listing |
| `scripts/add-deploy.ts` | Deployment file generation |
| `azure-cicd/templates/mockup-docker-template.yaml` | Image builds, version tags, and static previews |
| `azure-cicd/templates/mockup-release-template.yaml` | Release artifacts, GitOps updates, and ArgoCD synchronization |
| `.dockerignore` | Files excluded from the container build context |

For new product briefs, use `docs/briefs/<app>.md`.
For engineering handoffs, use `docs/handoffs/<app>-<flow>.md`.
If the task needs these documents, create them at those locations.

## Implementation rules

- Use the Bun version in the root `package.json`.
- Use the root catalog for new dependency versions.
- Use `import type` for TypeScript types.
- Import one CSS token layer for each application.
- Keep the applicable Tailwind `@source` entries for shared components.
- Use complete Tailwind class names. Do not construct class names from fragments.
- If existing components and fixtures satisfy the request, use them.
- Keep changes to shared configuration in the approved scope.
- Tell the user the effect of a shared change on the affected applications.

Use Bun for workspace commands. Do not introduce an npm or Yarn lockfile.
The dependency catalog is `workspaces.catalog` in the root `package.json`.
In a consuming workspace, use a declaration such as `"react": "catalog:"`.

Tailwind does not scan workspace dependencies through `node_modules` automatically.
In the application's `src/index.css`, point `@source` at each shared component package's actual `src` directory.
The [Buyer README](apps/frontend/qwipo-buyer-paytm-app/README.md#shared-packages) and [Seller README](apps/frontend/seller-store/README.md#design-and-themes) contain the exact CSS entries.
Missing entries can produce unstyled components without a compiler error.

`packages/tsconfig/base.json` enables `verbatimModuleSyntax`.
For a type-only import, use `import type { Foo }` or `import { value, type Foo }`.
If TypeScript reports `TS1484`, correct the import instead of disabling that option.

Shared packages currently export TypeScript source without a separate build step.
Unless a change is necessary for the task, keep this arrangement.
For a separate build step, use a working development watch process. Examine the cache configuration.

The current TypeScript configuration is permissive.
Do not disable a shared rule merely to remove an error.
Correct the cause. If an exception is necessary, record its scope and reason.
Where necessary for the changed behavior, add stronger checks.
Avoid unrelated changes to the entire toolchain.

## Verification and completion

Use [verify](.claude/skills/verify/SKILL.md) before completion.
For a documentation change, examine the instructions, links, paths, and command examples.
For an implementation change, run the applicable code checks and behavior tests.
Record failed or omitted checks explicitly.

Record each server process that you start.
Unless the user tells you to keep that process active, stop it after verification.
Do not stop unrelated processes to get a port.

Give the user the changed behavior, verification results, and remaining limitations.
Until the user tells you to commit, keep the changes uncommitted.
Deployment preparation does not prove that a remote service or approval check exists.
Use [deploy-mockup](.claude/skills/deploy-mockup/SKILL.md) to examine those conditions.
