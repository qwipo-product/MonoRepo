---
name: new-mockup
description: Create a frontend prototype when the user requests a new application. Use the existing application generator.
---

# Create an application

Use the [repository instructions](../../../CLAUDE.md).
Without a user instruction to create another application, do not create one.
The current branch retains Buyer/Paytm and Seller Store.

## Prepare

1. Establish the scope with [brief](../brief/SKILL.md).
2. Select the mobile or desktop design kit.
3. Select a descriptive folder name with lowercase words and hyphens.
4. If a new task branch is necessary, use [start-work](../start-work/SKILL.md).
5. Examine existing workspace folders before installation.

If the user's selected name is valid, use it.
Do not change an existing service identity to enforce a new naming convention.

## Generate the application

Select one command. Replace `<name>` with the application name.

```bash
bun run new <name>
```

For a desktop application, use this command instead:

```bash
bun run new <name> --web
```

The generator creates configuration files and runs dependency installation.
The generator source is `scripts/new-mockup.ts`.
It writes `apps/frontend/<name>/` and names the package `@mockups/<name>`.

| Generated file | Responsibility |
| --- | --- |
| `package.json` | Description, scripts, catalog dependencies, and shared package dependencies |
| `tsconfig.json` | Extension of `@mockups/tsconfig/react-app.json` |
| `eslint.config.js` | Shared React lint preset |
| `vite.config.ts` | React/Tailwind plugins, port, and relative preview base |
| `src/main.tsx` | Root providers and version display |
| `src/App.tsx` | Initial application shell |
| `src/screens/Home.tsx` | Example screen to replace |
| `src/index.css` | Tailwind source entries and the selected token theme |
| `index.html`, `src/vite-env.d.ts` | Browser entry and Vite types |

These generated paths are relative to the new application folder.
The mobile variant selects `@mockups/ui`.
The `--web` variant selects `@mockups/web-ui`.
Keep the selected token package consistent with that kit.

The generator selects a port from the application configurations.
Examine active listeners before the server starts. A configured port is not proof of an available port.

The generator writes application files before dependency installation.
If installation fails, record the incomplete result.
Examine the new folder and lockfile before another command.
After correction of the installation failure, run `bun install` from the repository root.
Do not repeat the generator command over the existing folder.

For cancellation, remove only files that this attempt created. Keep other local work.

## Complete the application

1. Set the package description.
2. Replace the example screen with the requested initial screen.
3. Keep the theme provider and version display.
4. Keep the generated Tailwind source entries.
5. Write the application README with its flows and simulated behavior.
6. Update the root application tables.
7. Use [verify](../verify/SKILL.md).

If sheets depend on the mobile frame's positioning context, keep that context.
Build only the flows in the agreed scope.

Set the description in `apps/frontend/<name>/package.json` and confirm the listing with `bun run ls`.
Use `apps/frontend/seller-store/README.md` as an example for persona and simulation documentation.
If a saved launch entry is necessary, update `.claude/launch.json` with the correct command and port.
Keep the root `README.md` and `CLAUDE.md` application tables consistent with the authorized addition.

Record the branch, application, port, and verification results.
Do not automatically commit, push, merge, or deploy the new application.
