# Motion failure at 127.0.0.1:3000

Confirmed and fixed on 26 October 2026 against the user's running development server.

## Root cause

The Next.js 16.4.3 development server was started with its default `localhost`
hostname. Its development-origin checks rejected requests from `127.0.0.1`.
The server log explicitly reported blocked requests and recommended adding that
hostname to `allowedDevOrigins`.

At `http://127.0.0.1:3000/`, server-rendered content and the initial “Pause motion”
label were visible, but the client had not initialized: the pause button did not
change state, the phone had no animation styles, the route parcel had no position
and the first product screenshot never advanced. The equivalent
`http://localhost:3000/` initialized and responded normally. This distinguished a
development-host configuration failure from an animation preference or GSAP issue.

## Fix

Added only `allowedDevOrigins: ["127.0.0.1"]` in `next.config.ts`. No wildcard
origins, production headers or browser settings were changed. Next automatically
restarted the existing development server after the configuration edit.

## Verification

- Reloaded the exact reported URL, `http://127.0.0.1:3000/`.
- Confirmed motion defaults to `full`, the phone has changing GSAP transforms,
  the route parcel advances and the product carousel advances to other screens.
- Pause changes the label to “Enable motion” and sets `data-motion="reduced"`;
  Enable restores animation.
- “See how it works” moved through an intermediate scroll position (356.5 px),
  then settled at 2722.5 px with the destination 31.75 px below the viewport top
  and keyboard focus on `network`.
- The full journey opens on the same numeric-loopback origin.
- No browser warnings or errors in the corrected page review.
- ESLint and TypeScript pass. No additional test server was started.

The original development server was left running. The user only needs to reload
an already-open page to initialize its previously blocked client runtime.
