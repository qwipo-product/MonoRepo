# Hero phone screen-change spin

26 October 2026

The hero phone now makes a full 360-degree vertical-axis turn over 0.8 seconds on each automatic screenshot change. The screenshot changes halfway through, while the front faces away. A shaded rear face prevents mirrored app content. The next screenshot starts loading only after the current one is decoded and while the hero is visible; the cycle waits until it is ready before spinning. Embedded previews continue to provide the first image without another request.

The spin uses a nested wrapper, separate from the existing scroll transform and idle float. `src/components/Motion.tsx` was not changed; its SHA-256 remains `73729ac19a76edb750a49e634063393c87478d16eef9cc081a7d0d90a1ae8ed2`. The product exhibit and detailed journey retain their fade transitions. GSAP drives the turn, and React state updates only at the screenshot swap. Pause, off-screen and route cleanup revert the spin without removing the currently displayed screenshot.

Production checks covered desktop 1280px and mobile 390px. QA-only DOM observation recorded screenshot changes at exactly 180 degrees on both layouts, with each new image already decoded. Samples show intermediate angles, completion at 360 degrees, and a cleared spin transform at rest. Browser snapshots also confirmed that scrolling still changes the separate outer phone transform. The pause control, route navigation and return path were exercised. No console warnings/errors or horizontal overflow were observed, and desktop/mobile accessibility scans reported zero violations. The audit retains incomplete automated checks. Local performance numbers are not a constrained-device or field benchmark.

Evidence is in `.shots/hero-spin/pass-1/` and `pass-2/`. The second pass reuses unchanged desktop captures and its first-pass audit, adding mobile timing, paused/mobile captures and navigation checks. Still frames and transform samples do not establish subjective smoothness. The normal production build excludes the local review panel and motion recorder.

Lint, TypeScript, formatting and the normal production build passed. The independent final hero review scored 7.6/10 and reported no blocking defect in the phone revision. It noted the existing fixed mobile motion control can overlap page content at some scroll positions; this utility was outside the requested phone change. The user-requested motion-on default is preserved.
