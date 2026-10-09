---
name: git-doctor
description: Recovery pathway — git is in a state the user didn't intend: detached HEAD, a merge half-done, work committed on dev by mistake, "my changes disappeared", "pull says divergent", a branch that won't push, a blank page after switching branches. Use whenever a git command surprised someone.
---

# Git doctor

First, facts. Nothing is lost in git until the reflog expires, so there is
no reason to rush and every reason to look before acting.

```bash
git status
git branch -vv
git log --oneline --graph -15
git stash list
```

Say what state the repo is in, in one sentence, before proposing anything.
Anything that discards work (`reset --hard`, `checkout -- .`, `clean`,
`stash drop`, `branch -D`) is confirmed with the user first, naming what
will be discarded.

## "I have changes I don't want"

`git stash push -m "<what>"` — reversible, and the default. `git checkout
-- <file>` per file only when the user has named the file and confirmed.
Never `git checkout -- .` or `reset --hard` as a first move.

## "I committed on dev / testing / main by mistake"

Not pushed yet: move the commits to a branch and put dev back.

```bash
git branch dev/<app>-<what>            # the branch now holds the commits
git reset --hard origin/dev        # dev back to what origin has — confirm first
git switch dev/<app>-<what>
```

Pushed already: it's on the dev URL now. Don't force-push. Either it was
finished work — say so and move on — or land a fix-forward commit through
`land-work`.

## "detached HEAD"

Usually from checking out a tag or a commit. Work done here is safe but
unnamed:

```bash
git switch -c dev/<app>-<what>        # names it; carries any commits along
```

Then carry on with `start-work`.

## "A merge is half done" / "unmerged paths"

Either finish it (`land-work` → Conflicts) or `git merge --abort`, which
is safe and complete. Same for `git rebase --abort`. Don't start a second
merge on top of a first.

## "pull says divergent branches"

Local `dev` has commits origin doesn't. Look at them:

```bash
git log --oneline origin/dev..dev
```

The user's work → move it to a branch (above). A stale merge →
`git reset --hard origin/dev` after confirming. Then set
`git config pull.ff only` in this clone so the next pull refuses instead of
inventing a merge commit.

## "My changes disappeared"

```bash
git reflog -20
```

Every commit and branch tip the clone has pointed at recently is there.
Find the entry, `git switch -c recovered/<what> <sha>`, and look. Also
`git stash list` — a stash from a hurried branch switch is the usual
culprit.

## "The branch won't push" / "no upstream"

`git push -u origin HEAD`. Rejected as non-fast-forward means someone else
pushed to the same branch: `git pull` (a merge), resolve, push. Never
`--force` a branch anyone else might have; a branch that exists only on
one laptop is the one exception, and even then say so.

## "Everything broke after I switched branches"

`bun install`. Branches with different `package.json` files leave
`node_modules` matching the other one. A blank page after a switch:
`bunx turbo run build --filter=@mockups/<app> --force` clears a stale Turbo
cache.

If that install also rewrites `bun.lock` — `git diff --stat bun.lock` —
read the diff before calling it noise. A whole workspace block gone
(`"apps/frontend/<name>": { … }` plus hundreds of resolved lines) for a
folder that exists on no branch is the lockfile being corrected: someone
installed with that folder sitting untracked on their laptop and committed
the result. Commit the shrink, say why, push. Don't revert it — the "never
regenerate `bun.lock`" rule is about deleting the file to dodge an error,
not about this; reverting exactly this shrink is how the Sep 2026 lockfile
breakage outlived its fix. The reverse — a workspace block *appearing* —
means the untracked folder is on this laptop: `start-work`, step 1.

## "There are branches I don't recognise"

`git branch -vv` shows which local branches track nothing (no
`[origin/…]`). One with no commits ahead of dev can be deleted; one with
commits gets looked at first.

## Report

Say what state it was in, what was done, and — explicitly — whether
anything was discarded. "Your three commits were on dev by mistake; they're
now on `seller-store/offers-filter`, dev matches origin again, nothing
lost."
