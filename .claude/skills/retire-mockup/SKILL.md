---
name: retire-mockup
description: Sunset pathway — remove a mockup, or a stale leftover folder, cleanly: the app, its port, its deploy files, its rows in the docs, and the out-of-repo pieces to hand off. Use for "delete this mockup", "we're done with X", "clean up the old folders", "retire qwipo-app".
---

# Retiring a mockup

An app nobody demos still costs a pipeline run on every shared-package
commit and a row in every table. Remove it whole, in one commit, so history
keeps it and the tree doesn't.

## 1. Confirm it's the right thing

- Name the folder and what it was; check
  `git log --oneline -5 -- apps/frontend/<app>` for recent activity. If
  someone else touched it this month, ask them, not the requester.
- Stale leftovers — folders with no `package.json`, only an orphaned
  `node_modules` or `dist` — are ignored by Bun and Turbo. Check whether any
  retained app references them before removal.
- This is destructive: state what will be deleted and get a yes.

## 2. Remove it, on a branch

Invoke `start-work` (`<app>/retire`). Then:

```bash
git rm -r apps/frontend/<app>
bun install                        # the lockfile drops the workspace
```

Then every mention:

- the apps table in `CLAUDE.md`, the layout block and deploy table in
  `README.md`, `.claude/launch.json` if it's there;
- `@source` lines or imports in other apps that pointed at it (there
  shouldn't be any — apps don't import apps);
- reserved-hostname notes, if its service name was one.

`verify` the repo still builds
(`bunx turbo run lint typecheck build --continue`), then `land-work`.

## 3. Hand off what this repo can't do

If the app was on the deploy path, three things live elsewhere and linger
until someone removes them — say so rather than implying the URL is gone:

1. The GitOps manifests `bms-chart/<env>/<service>.yaml` in the
   `Qwipo B2B/k8s` repo — deleting them deletes the ArgoCD apps and the URL.
2. The two pipelines in the `Mockups Lab` folder in Azure DevOps.
3. The images in the registry (harmless; leave them).

## Report

"Removed the qwipo-app leftover — no package.json, nothing built it — on
branch `qwipo-app/retire`. Nothing was deployed, so nothing to remove
elsewhere." For a deployed one, list the three hand-offs by name.
