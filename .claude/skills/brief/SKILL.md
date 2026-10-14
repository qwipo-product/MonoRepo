---
name: brief
description: Grill before building — turn a vague or expensive request into a one-page brief the work is checked against. Invoked by new-mockup, import-mockup and build-screen when the ask is under-specified; use directly for "I have an idea", "I want to mock up X", "can we show Y", or any request where different readings would produce materially different screens.
---

# Brief — grill first, build second

A mockup exists to answer a question in front of someone. If you don't know
the question, the audience, and the moment it gets shown, you will build the
wrong screens beautifully. Ask now; it is cheaper than a rebuild.

## How hard to grill

Proportional to what a wrong answer costs:

| The ask | Rounds | Output |
| --- | --- | --- |
| A new mockup, or importing one | up to two rounds, every question below | `docs/briefs/<app>.md` |
| A new flow or several screens in an existing mockup | one round, only the questions still open | a five-line mini-brief in chat, then build |
| A tweak on one screen (copy, colour, an extra field) | none — do it | — |

Ask in one batch, not one at a time. Skip anything the request or the repo
already answers — never ask what you can read (`bun run ls`, the app's
README, the fixtures).

## The questions

1. **The demo moment.** Who is it shown to, when, and what should they say
   afterwards? A client pitch, a usability round, an internal decision and a
   handoff to engineering each want different screens.
2. **Whose hands.** Who is the mockup's user: a kirana owner on a phone in a
   WebView, a distributor's ops person on a laptop, a Qwipo admin? This
   decides mobile kit vs web kit — the one answer that can't change later
   without a rebuild.
3. **The flows.** Two to five things the user accomplishes, as sentences
   ("retailer searches a company and claims their ID"). Screens fall out of
   flows; don't ask for a screen list.
4. **The states that must be shown.** Empty (day one), loading, error, and
   the edge that matters for this demo (MOV not met, KYC under review, out
   of stock). Every list screen gets an empty state regardless.
5. **New or existing.** A new app, or screens inside `seller-store`,
   or `qwipo-buyer-paytm-app`? Screens that belong
   to an existing product go in that app.
6. **Source material.** Screenshots, a Figma export, a PRD, an old repo, a
   competitor? Paths on disk, not descriptions.
7. **Data.** Do the app’s existing fixture modules already have what the screens need,
   or does the demo need something it doesn't (a new entity, Telugu names, a
   specific city)? Extending fixtures is `mock-data`'s job; know now.
8. **Where it will live.** `bun dev` on a laptop, the Network URL on a
   phone, or a lasting demo URL? Deploying has prerequisites outside this
   repo, so a deadline changes the order of work.
9. **What "done" looks like.** The one screen or moment that, if wrong,
   makes the demo fail.

## Write it down

For a new or imported mockup, write `docs/briefs/<app>.md`:

```md
# <App name> — brief
date: <YYYY-MM-DD>
kit: mobile | web
audience: <who sees the demo, when>
user: <who the mockup pretends to be>
flows:
  - <sentence>
  - <sentence>
states: <empty | loading | error | the edge that matters>
source: <paths to screenshots / figma export / old repo>
data: <fixtures cover it | extend with …>
share: laptop | phone via Network URL | deployed URL by <date>
done-when: <the one moment that must land>
out of scope: <what we are deliberately not mocking>
```

Nothing speculative — no component lists, no architecture, no timeline
beyond the demo date. The brief is what the user reviews before any code
exists; show it and get a yes.

## Then route

- New app → `new-mockup`. Importing → `import-mockup`. Existing app →
  `build-screen`.
- If the answers reveal it isn't a mockup at all (needs a real backend, real
  auth, real customers), say so: this repo bundles fake data and talks to
  nothing. The nearest thing that fits is the same screens over
  the app’s existing demo fixtures.
