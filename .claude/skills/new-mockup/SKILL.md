---
name: new-mockup
description: Scaffold pathway — create a brand-new mockup app in apps/frontend with the right kit, port, packages and first real screen. Use for "start a new mockup", "new app for X", "set up a project for Y". Needs a brief; without one, route to brief first.
---

# New mockup

Precondition: a brief in `docs/briefs/<app>.md` (the `brief` skill). The
brief decides the kit, and the kit can't change later without a rebuild — so
no brief, no scaffold.

## 1. Name it

Kebab-case, saying what it *is*: `distributor-portal`, `rirn-admin`,
`ops-console`. The folder name becomes the package name (`@mockups/<name>`),
the dev filter, and — if it is ever deployed — the service name
`mockups-<name>` and the demo URL. So:

- no `qwipo-` prefix (everything here is Qwipo);
- no `-app` / `-mockup` suffix (everything here is one);
- not a person's name, not a version number, not `new-`.

If a hostname is already reserved for it (`mockups-rirn-distributor`,
`mockups-rirn-admin`), the name is decided — use it.

## 2. Branch, then scaffold

Invoke `start-work`; the branch is `<name>/scaffold`. Then:

```bash
bun run new <name>          # phone frame — @mockups/ui + design-tokens
bun run new <name> --web    # full-width — @mockups/web-ui + web-tokens
```

`--web` or not comes from the brief's `kit:` line. The generator picks a
free port, wires the shared packages, adds the Tailwind `@source` lines,
mounts the version badge and runs `bun install`. Don't hand-roll any of
that, and don't copy another app's folder as a starting point — it drags
that app's quirks along.

## 3. Make it that app, not the template

- `package.json` → `description`: one sentence saying what the mockup is.
  `bun run ls` prints it and the deploy generator reads it.
- `README.md` in the app folder: audience, user, flows and any demo login
  from the brief, in the shape `apps/frontend/rirn-retailer/README.md`
  uses. Every app has one; it is the first thing anyone — including you,
  next session — reads before touching the app.
- Replace `src/screens/Home.tsx` with the first real screen from the
  brief's first flow. Delete the placeholder copy; nobody should see
  "Delete this screen" in a demo.
- Mobile apps: keep the 390×844 frame in `App.tsx` and the `relative` on it
  — bottom sheets position against it.
- Add a row to the apps table in `CLAUDE.md` and the layout block in
  `README.md` so the next person can find it.

Screens beyond the first are `build-screen` work; don't build the whole
brief inside the scaffold step.

## 4. Verify and land

Invoke `verify`. Then `land-work` to put it on `dev`, which is what makes
it visible to anyone else. Deploying is a separate decision —
`deploy-mockup`, only when the brief says a lasting URL is needed.

## Report

"Created the <name> mockup (phone frame, port 5177) with the <first screen>
screen; it's on the `<name>/scaffold` branch, verified, ready to land on
dev." Name the port and the screen, not the files.
