---
name: start-work
description: Create or update a task branch. Use this procedure before implementation on a shared branch.
---

# Start work

Use the [repository instructions](../../../CLAUDE.md).
Without the user's explicit commit command, do not commit changes.
Without the user's explicit push command, do not push changes.

## Examine the checkout

1. Run `git status --short --branch`.
2. Run `git branch -vv`.
3. Examine any existing changes.
4. Find changes that belong to the task.

Keep unrelated changes on their current branch.
Do not delete, stash, or commit them to make a branch switch succeed.
If a branch switch would affect unrelated work, use a separate checkout or ask how to keep it.

An untracked folder can contain valuable work.
A folder with a package manifest inside a workspace path can also affect dependency installation.
Examine such folders before installation. Do not remove them solely because Git does not track them.

## Select the branch

If an applicable task branch exists, use it.
If the user supplies a branch name, use that name.
Otherwise, use `feature/<app>-<change>`.
Do not create `dev/<name>` while `dev` exists.
These names conflict in Git's branch namespace.

The current pipelines accept `feature/*` for previews.
A custom branch name can be valid without an automatic preview.
Do not rename a user-specified branch merely to get a preview.

## Create a branch from dev

Before this procedure, make sure that local changes are safe.
Run each command independently. If a command fails, stop the sequence.
Replace `<branch>` with the selected name.

```bash
git fetch origin
git switch -c <branch> origin/dev
```

This uses the current remote dev commit. The local dev branch does not change.
If the remote is unavailable, record that the base cannot be refreshed.
If the user permits the local dev branch as the base, use it.

## Update an existing task branch

1. Fetch the remote references.
2. Examine the difference between the task branch and `origin/dev`.
3. Tell the user about each conflict that affects the requested behavior.
4. If the current request does not authorize a merge, get that authorization.
5. Use [land-work](../land-work/SKILL.md) for conflict resolution and verification.

## Complete the work

Record the branch name and base commit.
Until the user tells you to commit, keep edits uncommitted.
A command to commit does not give permission to push.
