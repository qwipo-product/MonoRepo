---
name: handoff
description: Handoff pathway — a mockup or flow is approved and engineering will build the real thing. Produces a spec derived from the mockup, in product terms, that the development team can build from. Use for "it's approved, hand it to engineering", "write the spec", "document this for the dev team".
---

# Handing off to engineering

A mockup is the clearest spec there is, until someone has to build it
without the person who made it in the room. The handoff captures what the
screens already say and what they can't.

Derive everything possible from the repo — never ask for what is readable:

- the flows and screens, from the app's README and its router or nav;
- the states each screen has (empty, loading, error, edges), from the code;
- the data each screen reads, from its existing fixture and state modules — that is the API the real thing needs;
- the demo URL and logins, from the README's deploy table.

Ask at most three questions, only the non-derivable:

1. What's in scope for this build — all of the mockup, or the flows that
   were approved?
2. What in the mockup is fake in a way engineering must know (a hard-coded
   outcome, a timer standing in for an approval, a persona that doesn't
   exist)?
3. Who on the development team receives it, and where (a ticket, a doc, a
   channel)?

Write `docs/handoffs/<app>-<flow>.md`:

```md
# Handoff: <App> — <flow>
date: <YYYY-MM-DD>
mockup: apps/frontend/<app> · <demo URL> · <logins>
approved by: <who, when>

## Flows in scope
- <sentence> — screens: <list>

## Screens
### <Screen>
- shows: …
- states: empty / loading / error / <edge>
- reads: <fixture → the entities the real API must return>
- writes: <what the user's action changes>
- fake here: <what the mockup hard-codes>

## Out of scope
- …

## Open questions for engineering
- …
```

Product terms throughout — a reader from engineering should be able to
open the mockup beside this file and see every line on a screen. No
component names, no hooks, no suggestions about their architecture.

Close with where it went and who owns the next step. The mockup stays where
it is; if it's deployed, the URL in the handoff must keep working until
engineering is done — don't `retire-mockup` it yet.
