---
name: verify
description: Gate — the definition-of-done checks for a mockup. Invoked by every pathway when work completes; use directly for "check my work", "does it build", "is it done", "run the checks".
---

# Verify

Nothing is done until this has run. Report each failure with its output,
fix, re-run; report what passed and what you couldn't check.

## 1. Lockfile, lint, typecheck, build — scoped to the app

```bash
bun install --frozen-lockfile                                # what every Dockerfile runs
bunx turbo run lint typecheck build --filter=@mockups/<app>
```

The frozen install is the gate Turbo doesn't run: it refuses when
`bun.lock` disagrees with the `package.json` files on disk, and a Docker
build refuses the same way. Red means a manifest was edited without an
install (install, commit the lockfile with it) or the lockfile names a
workspace this checkout doesn't have (step 4). Never delete the lockfile to
turn it green.

Not `bun run check`: `@mockups/qwipo-buyer-paytm-app#lint` has a known
pre-existing failure (a stale `eslint-disable` for `jsx-a11y/no-autofocus`,
a plugin this repo doesn't install), and without `--filter` or `--continue`
Turbo cancels everything still queued when it fails. It isn't yours; don't
chase it, and don't fix it without asking — it's someone else's app.

Touched a shared package? Run the filter for every app that imports it, or
`bunx turbo run lint typecheck build --continue` for all of them.

## 2. The dev server compiles it

Typecheck passes a missing Tailwind `@source` and a bad asset path; only
the page tells you.

```bash
bun dev --filter=@mockups/<app>       # port from `bun run ls`
```

Look at the actual screen: no Vite error overlay, styled (not naked)
components, images present.

## 3. The screen, in the states the demo will hit

- Light **and** dark.
- Empty state on every list screen — under the Empty personas where the
  app has them (`seller-store`: `8888888888` / `9999999999`, OTP `1234`).
- Loading and error where the screen pretends to fetch.
- Mobile apps: the **Network** URL Vite prints, opened on a phone. For a
  phone mockup that's the only review that counts.

## 4. Nothing left behind

```bash
git status --short
```

No stray `dist/` in a package, no `_to_delete/` folders, no placeholder
copy ("Delete this screen"), no bare version in a `package.json`, no
second token import or app-owned `@theme` block in an `index.css`.

Two lines in that output are stops, not tidies:

- `?? apps/<kit>/<something>/` or `?? packages/<something>/`. An untracked
  folder with a `package.json` is already a workspace to `bun install`
  (the root glob is `apps/*/*`, `packages/*`): the next install writes it
  into `bun.lock` while the folder itself stays on one laptop, and every
  other checkout's frozen install fails from then on. Either it's a mockup
  — `new-mockup` / `import-mockup`, on its own branch — or it moves out of
  the repo. Not "later".
- ` M bun.lock` with no ` M …/package.json` beside it. The install above
  already happened. Same cause: account for the folder, then `bun install`
  once more and the lockfile drops it. That is fixing the cause, not
  regenerating.

## Report

State plainly what was verified — "lint/typecheck/build green for
seller-store, dev server renders Orders in light and dark, empty state
checked under the Empty Seller persona" — and what wasn't ("not opened on
a phone"). A gate you skipped is reported as skipped, not as passed.
