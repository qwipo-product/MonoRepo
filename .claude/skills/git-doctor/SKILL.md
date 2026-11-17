---
name: git-doctor
description: Diagnose Git errors and recover work. Keep local files before a corrective operation.
---

# Diagnose a Git problem

Use the [repository instructions](../../../CLAUDE.md).
Without the user's explicit commit command, do not commit changes.
Without the user's explicit push command, do not push changes.

## Collect evidence

Run these read-only commands from the repository root:

```bash
git status --short --branch
git branch -vv
git log --oneline --graph -15
git stash list
git reflog -20
```

Give the observed state before a correction.
The reflog records reference history. It does not protect every uncommitted or untracked file.

## Keep work

1. Find tracked changes, untracked files, and necessary ignored files.
2. Tell the user what the proposed recovery can change or remove.
3. Keep affected work in a separate location before a destructive operation.
4. Make sure that the user authorized each remaining destructive action.

Do not use `reset --hard`, `clean`, or forced deletion as an initial diagnostic step.
Do not stash unrelated work merely to make another task continue.

When a stash is applicable, tell the user its effect before use.
`git stash push -u` includes untracked files but excludes ignored files.
Keep necessary ignored files independently.
Examine the saved content before any later deletion.

## Select a recovery

| Condition | Procedure |
| --- | --- |
| Detached HEAD | Keep the current commit with a new task branch. |
| Work committed on the wrong branch | Keep the commit on a new branch before any reset. |
| Divergent branches | Fetch references. Compare both histories. Select an approved merge or recovery. |
| Rejected push | Read the rejection. Examine authorization before another push. |
| Changes appear missing | Examine the reflog, stashes, local files, and available backups. |
| Incomplete merge | Examine conflicts and saved work before completion or abort. |
| App fails after a branch switch | Compare dependencies and run the applicable checks. |

Use a nonconflicting name such as `feature/<app>-recovery` for a new branch.
Do not use `dev/<name>` while the `dev` branch exists.

A merge abort can fail to restore changes that existed before the merge.
Do not record an abort as an unconditional recovery guarantee.
A plain `git pull` follows local configuration and might not merge divergent branches.
After inspection, select the intended operation explicitly.

A Turbo run with `--force` bypasses cached task results.
It does not delete the cache or prove the cause of an application failure.

## Examine lockfile changes

A branch switch can expose dependency differences.
An installation can also correct workspace entries or change dependency resolutions.
Read the diff. Then decide if a lockfile change belongs in the task.

Inspect the root `package.json`, affected workspace manifests, and `bun.lock`.
Compare installed workspace entries with actual folders under `apps/frontend/` and `packages/`.
Use `git status --short --untracked-files=all` to find untracked manifests before another installation.
The repository's Bun version is in `packageManager`.
Bun installation settings are in `bunfig.toml`.
For an application failure after a branch switch, compare these files before blaming the cache.

Use [add-dependency](../add-dependency/SKILL.md) for dependency work.
Do not automatically commit or push a correction.

Record recovered work, remaining uncertainty, and the final branch state.
