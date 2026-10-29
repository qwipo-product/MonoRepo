# Mirrored hero tilt and paired route arrows

26 October 2026

The hero phone keeps its 0.8-second vertical-axis spin and hidden halfway screenshot swap. The spin now also changes the phone's planar tilt to the opposite sign. If the outer scroll angle is S and the settled inner angle is I, the next inner angle is -2S-I, so the combined angle becomes -(S+I). The existing scroll animation remains independent and continues if the visitor scrolls during the turn. Only a ref stores the settled pose; no per-frame React state was added. Pause and off-screen cleanup finish on the committed readable pose.

Two arrows follow the hero route, spaced half a cycle apart. The rail still extends beyond the artwork, but the travelling arrows stay within its horizontally visible portion. The compact desktop and mobile route shapes give the phone enough clearance for an arrow to remain visible while its companion passes behind it. Route nodes follow the responsive rail. Both arrows use the existing ticker and visibility/pause controls.

Production browser checks at 1280px, 900px and 390px cover repeated mirrored tilts, separate scroll motion, pause, arrow count and route coverage. The local review panel samples 1,000 positions around the complete path at each tested pose and records any positions at which both arrow centres are obscured or outside the viewport. The final desktop, compact desktop and mobile reports have no blocked pairs when the hero artwork is in view. This is a geometry check at the captured poses, not a claim that content remains onscreen after scrolling past it. The mobile record also confirms a composed -6.4941-degree angle becoming +6.4941 degrees while scrolled.

Evidence is saved in `.shots/hero-tilt/`. The audits reported no accessibility violations or horizontal overflow. Performance measurements are from local, unthrottled Chromium and do not establish field performance. QA-only instrumentation is excluded from the normal production build.

The final normal build, TypeScript, lint and formatting checks passed. No browser warnings or errors were observed in desktop, compact desktop or mobile previews. Clean final screenshots are in `.shots/hero-tilt/final/`.

An independent evidence-only critic scored the visible hero 7.1/10 and found no overflow or CTA legibility issue. It noted that one arrow is partly obscured at the positive tilt. That occlusion is intentional in this request: the second arrow remains visible while its companion travels behind the phone. The review did not rate subjective motion quality or field performance from still images.
