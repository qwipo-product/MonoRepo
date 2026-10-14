---
name: share-mockup
description: Show pathway — get a mockup in front of someone right now: on a phone, across the office, in a meeting, as a link. Use for "show it to my boss", "open it on my phone", "send a link", "how do I demo this", "can they see it".
---

# Sharing a mockup

Three ways, from quickest to most durable. Pick by how long the link has to
live.

| Need | Use | Lives for |
| --- | --- | --- |
| Look at it on my phone / show the person next to me | the **Network** URL | while `bun dev` runs |
| A link for a meeting today, same Wi-Fi | the Network URL | while `bun dev` runs |
| A link that works next week, from anywhere, for a client or a test round | a deployed URL → `deploy-mockup` | until it's retired |
| A screenshot or recording for a doc | the browser, on the deployed URL if there is one | forever |

## The Network URL

```bash
bun dev --filter=@mockups/<app>
```

Vite prints two lines; the **Network:** one (`http://192.168.x.x:<port>`)
works from any device on the same Wi-Fi. For a mobile mockup, opening that
on a phone is the only review that counts — the 390px frame in a desktop
browser lies about tap targets and keyboards.

It stops when the terminal closes and changes as you edit, which is right
for "look at this now" and wrong for anything else.

## Demo logins

Say them with the link, every time. `seller-store`: five personas, OTP
`1234` (its README has the table). For Buyer/Paytm, include the starting
screen and selected shell. Do not make the reviewer guess.

## A link to a branch, right now

Every push to a `dev/*` or `feature/*` branch is built and kept at

    https://mockups-<service>.dev.bms.qwipo.com/builds/<branch>/<sha>/
    https://mockups-<service>.dev.bms.qwipo.com/builds/<branch>/latest/

with `<branch>` slugged (`dev/rahul-cart` → `dev-rahul-cart`) and `<sha>`
the short commit. `/builds/` on any mockup host lists its branches and
commits. The newest five builds of a branch are kept, older ones are
pruned on the next push; `latest/` always survives. It is live a few minutes
after the push — the build pipeline run
prints the exact URLs at its end — and nothing is redeployed: the files sit
in the DigitalOcean Space `qwipo-mockups` and the mockup's own nginx proxies
them. Routes are on the hash (`/builds/…/#/orders/123`), so the full link
including the hash is the thing to send. Share the `<sha>` form for "this
exact build", the `latest/` form for "whatever I push next".

Not for `dev` itself — that still redeploys the plain host URL.

## A link that lasts

`deploy-mockup`. Set expectations honestly: the first deploy of a new app
needs two things outside this repo (a k8s manifest, pipeline registration)
and isn't same-hour. Once an app is on the path, every push to `dev`
updates its URL in a few minutes with nobody opening a pipeline.

If the mockup is already deployed, the dev URL is
`https://mockups-<service>.dev.bms.qwipo.com` — the README's deploy table
lists them. Check the badge in the corner says the build you expect
(`dev-<sha>`), not `local` or last week's.

## Report

Give the URL, the login, and how long it lives. "Open
http://192.168.1.24:5175 on your phone — same Wi-Fi, Buyer shell — it works
while my dev server is up. For something that lasts, say the word and I'll
put it on the deploy path."
