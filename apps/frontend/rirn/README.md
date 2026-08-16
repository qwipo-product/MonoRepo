# @mockups/rirn

**Retailer Identity & Relationship Network** — a trusted identity layer for
B2B commerce. Scaffold only so far: wired to the web design system and
building, with no screens designed yet.

```bash
bun dev --filter=@mockups/rirn
```

http://localhost:5173

## The problem it mocks

The same retailer has a different ID in every system — `ITC-RET-1234` at one
company, `HUL-RET-7821` at another, `DIST-9281` at a distributor, plus one per
buyer app. Nothing can assert those are the same legitimate business.

The catch is that companies and distributors won't fix this by pooling their
customer masters — they fear competitors harvesting retailer lists and buyer
platforms approaching their retailers directly. So the product has to solve
identity fragmentation **without** becoming the central customer database
nobody will contribute to.

The answer in the PRD is an *authorization-aware identity graph*: a network ID
(`NRID-…`) that maps to each participant's existing IDs rather than replacing
them, with four concepts kept deliberately separate —

| Layer | Question | Owner |
|---|---|---|
| Identity | Who is this retailer? | Network / Retailer |
| Relationship | Does a company/distributor link exist? | Company / Distributor |
| Authorization | May this retailer transact? | Company / Distributor |
| Commercial terms | What price, MOQ, credit? | Company / Distributor (never the network) |

Knowing who a retailer is grants nothing. That separation is what makes the
network safe to join.

North star metric: verified retailer identities with **two or more** trusted
participant relationships — a single-relationship retailer proves no network
effect.

## Intended information architecture

Identity (retailers, mappings, resolution queue) · Participants (companies,
distributors, buyer & seller apps) · Relationships · Authorization · Consent ·
Audit · Settings.

## Building here

Right now this is the untouched `bun run new --web` scaffold: a single
placeholder `src/screens/Home.tsx`, wired to `@mockups/web-ui` and
`@mockups/web-tokens` and building. Delete that screen and start.

For the chrome, reach for `AppShell` from `@mockups/web-ui` — navigation is a
`NavItem[]`, where items carry `subItems` for collapsible groups and
`disabled` to grey out screens that aren't built yet. That last one is a good
way to show the whole intended IA while filling it in one screen at a time.

Browse the available components at `bun dev --filter=@mockups/storybook-web`
(:6007) before writing your own.

The source PRD lives outside this repo at `/Users/apple/Qwipo/rirn/RIRN PRD.pdf`.
