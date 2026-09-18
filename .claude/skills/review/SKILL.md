---
name: review
description: Sanity review before a branch lands on dev — a short, shallow pass that organises the code, not a critique. Invoked by land-work; use directly for "review this", "tidy before merging", "is this branch clean". Fixes the mechanical findings on the branch and lists the judgement calls.
---

# Review — sanity, not depth

One pass over the branch's diff, sized to the diff, before `land-work`
merges it into `dev`. The point is that the next person — or the next
session — finds things where they expect them. It is not a design review,
not a performance review, and not an argument about types; this repo is
loose on purpose.

Scope is the diff and nothing else:

```bash
git fetch origin
git diff --stat origin/dev...HEAD
git diff origin/dev...HEAD -- . ':!bun.lock'
git log --oneline origin/dev..HEAD
```

## Look for

1. **Things in the wrong place.** Screens under `screens/` (or `pages/` +
   `routes.tsx` in seller-store), reusable pieces under `components/`, data
   and state under `lib/` or `data/`, assets under `public/` or `imports/`.
   No new top-level folders the app didn't already have. No `_to_delete/`,
   `old/`, `backup/`, `*.bak`, `Copy of …`, `Screen2`, `HomeNew`.
2. **Dead code.** Commented-out blocks longer than a few lines, a screen no
   route or nav entry reaches, an import the linter flagged unused, a
   component nothing renders. Delete; git remembers.
3. **Copy-paste.** The same JSX block in three screens → one component in
   the app's `components/`. A fixture array inline in a screen →
   `mock-data`. A component the package already has → the package's.
4. **Design language.** Invoke `design-language` on the diff.
5. **Leftovers.** Placeholder copy ("Delete this screen", "Do the thing",
   lorem ipsum), `alert(…)` stand-ins, `debugger`, a `TODO` with no owner,
   screenshots or large binaries under `src/`, a bare version in a
   `package.json`, an `.env` file.
6. **One thing per branch.** A `buyer-app/…` branch that also edits
   seller-store, or a shared-package change that wasn't in the brief — ask
   whether it belongs here or on its own branch. A shared-package edit
   redeploys every mockup.
7. **Files that grew into several things.** A 1,500-line screen that is a
   screen plus three sheets plus a data store → split by what each piece
   is. Only when it's obviously several things; a long screen is fine.
8. **Naming follows the neighbours.** PascalCase components; file naming
   matches the app (kebab-case in seller-store, PascalCase in the mobile
   apps); names say what the thing is, not when it was made.
9. **Commit messages** read in product terms (`start-work` rules). Don't
   squash; do reword a `.` or `wip` if it's the only commit.

## Not looked for

`any`, `console.log`, missing tests, strictness, memoisation, abstractions
for a second use case, render performance, folder-architecture opinions.
If a finding starts with "it would be cleaner to…", drop it.

## Do, then hand back

- Fix the mechanical findings (1, 2, 3, 5, 8) directly on the branch and
  commit them as one `Tidy: <app> — <what>` commit.
- List the judgement calls (4 when it needs a new token, 6, 7) for the user
  in one short list, each with a one-line recommendation. Don't block on
  them unless one changes what lands (a shared-package edit that should be
  its own branch).
- `verify` after tidying — moving a file can break an import.
- Return to `land-work`.

## Report

"Tidied `seller-store/offers-filter` before landing: moved the filter drawer
into `components/`, removed a commented-out copy of the old list, pointed
the chart palette at the shared tokens. One call for you: the branch also
changes `packages/mock-data` — fine to land together, or split it if you
want the other mockups not to rebuild." A review with nothing to fix says
so in one line.
