---
name: start-work
description: Branch pathway — begin a piece of work on a fresh branch from up-to-date dev, keep it in sync, and commit as you go. Invoked by every pathway that edits; use directly for "I'm starting on X", "make me a branch", "save my work", "commit this", "pull the latest".
---

# Starting work

`dev` is where finished work lands and what the dev demo URLs are built
from. It is not where work is made. Every change — a scaffold, an import, a
screen, a colour — happens on a branch, so a half-done cart never rebuilds
the dev URL for the person demoing it that afternoon.

## Branch names

`<app>/<what-changes>`: `buyer-app/cod-checkout`,
`seller-store/kyc-empty-state`, `rirn-admin/scaffold`. Short, kebab-case,
saying what will be different when it lands.

Not a person's name (`vikas`, `Omkar_prototype`) — a branch outlives the
session and nobody can tell what's in it. Not a date, not `test`, not
`new-branch`.

## Start

```bash
git status --short                                     # 1. uncommitted edits? see below
git fetch origin
git switch dev && git pull --ff-only origin dev        # 2. dev is current
git switch -c <app>/<what> && git push -u origin HEAD  # 3. branch from it, tracked from the start
```

Step 1 matters: switching branches with uncommitted edits either carries
them along or refuses, and both surprise people. If the edits belong to
this new work, they come along — say so. If they belong to something else,
commit them there first.

`--ff-only` refuses rather than inventing a merge commit on `dev`. If it
refuses, local `dev` has commits that aren't on origin — that's
`git-doctor`.

## Commit as you go

Small commits, one thing each, message in product terms:

```
Buyer app: COD payment mode on checkout
Seller store: empty state for the offers list
```

Not `.`, not `#`, not `Update HomeScreen.tsx`, not `wip` — those are in
the history already and nobody can find anything in them. Commit before any
risky step (a merge, a big refactor, a branch switch). Push after each
commit; an unpushed branch lives on one laptop.

## Keep in sync

When `dev` moves while the branch is open, bring it **into the branch**,
not the other way round:

```bash
git fetch origin && git merge origin/dev
```

Conflicts here are resolved on the branch, where only this work is at risk
— `land-work` has the rules. Never rebase a branch that has been pushed; a
merge is fine here and nobody reads the graph.

## Report

"On `seller-store/kyc-empty-state`, branched from today's dev, pushed." If
uncommitted work came along, say what it was.
