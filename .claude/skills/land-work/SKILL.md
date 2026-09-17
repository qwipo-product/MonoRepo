---
name: land-work
description: Merge pathway — land a branch on dev, resolve conflicts safely, and promote dev → testing → staging → main. Use for "merge this", "put it on dev", "promote to testing / staging / production", "I have conflicts", "release it".
---

# Landing work

This repo has no branch policies in Azure DevOps, so a merge is a push, not
a pull request, and "safe" is a procedure rather than a button. Builds
auto-trigger on the four branches and the branch decides the environment:

| Branch | Becomes | Gate |
| --- | --- | --- |
| `dev` | `mockups-<app>.dev.bms.qwipo.com` | `verify` green on the branch |
| `testing` | `mockups-<app>.test.bms.qwipo.com` | dev has been looked at |
| `staging` | `mockups-<app>.staging.bms.qwipo.com` | a demo needs a stable URL |
| `main` | production, `mockups-<app>.bms.qwipo.com` | someone approves the deploy in Azure |

A push to any of them redeploys every app the commit touched, and a commit
to `packages/**` touches all of them.

## Landing a branch on dev

1. `git status --short` clean. Invoke `review` — the shallow tidy pass,
   which runs `design-language` — then `verify`. A red gate ends the
   conversation about merging until it's fixed.
2. Bring `dev` into the branch first, so conflicts are resolved where only
   this work is at risk:
   ```bash
   git fetch origin
   git merge origin/dev
   ```
   Conflicts → the section below. Then `verify` again — a clean merge can
   still break a screen.
3. Land:
   ```bash
   git switch dev && git pull --ff-only origin dev
   git merge --no-ff <app>/<what>
   git push origin dev
   ```
   `--no-ff` keeps one merge commit per piece of work, so a whole feature
   can be reverted as one.
4. Say what happens next: the build fires on its own, the dev URL updates
   in a few minutes, and the badge in the corner will read `dev-<sha>`. If
   the app isn't on the deploy path, nothing deploys — `deploy-mockup` is a
   separate decision.
5. Delete the branch (`git branch -d` locally, `git push origin --delete`
   remotely) once it's on dev. Stale branches are how a prototype branch
   ends up merged twice.

## Promoting

Always a merge of the branch below into the branch above; never a
cherry-pick, never a force push, never a commit made directly on
`testing`, `staging` or `main`:

```bash
git switch testing 2>/dev/null || git switch -c testing origin/testing 2>/dev/null || git switch -c testing dev
git pull --ff-only origin testing 2>/dev/null
git merge --no-ff dev && git push -u origin testing
```

Same for `staging` ← `testing` and `main` ← `staging` (or `main` ← `dev`
when the middle rungs aren't in use — say which). `testing` and `staging`
may not exist on origin yet; the first promotion creates them, which is why
the push carries `-u`.

Promotions carry no review of their own: everything on `testing`, `staging`
and `main` went through `review` when it landed on `dev`, which is why
nothing lands there any other way.

`main` cuts a semver tag per app and deploys production only after an
approval in Azure — say so, and don't promise a production URL until
someone has approved it. **Before a new app's first promotion to `main`**,
its GitOps manifest must exist in all four `bms-chart/<env>/` folders, or
the release exits 1 — `deploy-mockup` has the detail.

## Conflicts

A conflict is two honest answers to the same question. Read both sides;
decide what the screen should show; never take one side wholesale without
reading the other. The common ones here:

| File | Resolution |
| --- | --- |
| `bun.lock` | don't hand-merge it — take either side, then `bun install`, which rewrites it from every `package.json`. That is fixing the cause, not regenerating to dodge an install error |
| root `package.json` `catalog` | keep both added lines, sorted |
| an app `package.json` | keep both dependencies |
| `routes.tsx`, `nav.ts`, a screen index | keep both routes / entries |
| `mockData.ts`, `packages/types` | keep both fixtures; if both changed the same row, ask |
| `CLAUDE.md`, `README.md`, an app README | keep both additions |
| an `index.css` `@theme` block | both sides changed a token — a `theme` decision; ask |
| the same screen edited two ways | open both, build the screen that does both things; if they contradict, ask — the one conflict you don't resolve alone |

Procedure:

```bash
git status                       # lists "both modified"
# edit each file: remove <<<<<<< ======= >>>>>>> and keep the right content
git add <file>
git merge --continue
```

Then `verify`. If it has gone wrong, `git merge --abort` returns the branch
to before the merge, nothing lost.

## Never

- `git push --force` to `dev`, `testing`, `staging` or `main`. Someone
  else's clone is built on those commits.
- Rebase a shared branch.
- Merge a branch whose `verify` is red "to fix it on dev".
- Land a branch that skipped `review`.
- Merge a feature branch straight to `main` — it goes through `dev`.

## Report

"Landed `buyer-app/cod-checkout` on dev (merge `abc1234`); the buyer app
rebuilds and mockups-buyer-app.dev.bms.qwipo.com updates in a few minutes.
Two conflicts in `mockData.ts`, kept both sets of orders." Name what's live
where and what's waiting on whom.
