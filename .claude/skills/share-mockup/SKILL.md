---
name: share-mockup
description: Prepare a local or hosted demonstration link. Open the link. Give its access and retention limits.
---

# Share a prototype

Use the [repository instructions](../../../CLAUDE.md).
Prepare the link in this conversation.
Do not send it to another person without the user's authorization.
Do not commit or push merely to get a link.

## Select the demonstration method

| Need | Method |
| --- | --- |
| Demonstration on this computer | Use the application development URL. |
| Demonstration on another local device | Use the verified Network URL. |
| Demonstration of an existing branch build | Use its verified preview URL. |
| Keep a stable hosted demonstration | Use [deploy-mockup](../deploy-mockup/SKILL.md). |

## Use a local server

Start only the necessary application:

```bash
bun dev --filter=@mockups/<app>
```

Record the process and actual URL.
If Vite selects another port, use the displayed port.
Do not use the application configuration alone as proof that a port is available.

For another device, make sure that the device can reach the computer on the permitted network.
The current development configuration listens on network interfaces.
Do not expose the server through a public tunnel without authorization.

If the server is necessary for the user's demonstration, keep it active.
Otherwise, stop the server after verification.

## Use a preview

The current pipelines create previews for `feature/*` when the path filters match.
A custom branch such as `dev-cleanup` does not receive an automatic preview.
Examine the pipeline output for the exact URL. Do not invent a successful run.

The URL structure is:

```text
https://<service>.dev.bms.qwipo.com/builds/<branch-slug>/<sha>/
https://<service>.dev.bms.qwipo.com/builds/<branch-slug>/latest/
```

Use the commit URL for a specific build.
For a review of the most recent upload, use `latest/`.
The current retention policy removes older builds beyond five per branch.
A commit URL is therefore not a permanent archive.

Keep the hash or query parameters that find the requested screen.
Before you give the link as a working URL, open the complete link.

## Supply review details

For Seller Store, include the selected persona and demonstration OTP `1234`.
For Buyer/Paytm, include the starting screen and selected shell.
State if the link is local, a preview, or a stable deployment.
Record each access problem or unverified condition.
