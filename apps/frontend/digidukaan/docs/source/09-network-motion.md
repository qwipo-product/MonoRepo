# A network in motion: icon and route revision

26 October 2026

The Discover, Connect, Order and Deliver icons now appear directly on the section background. Their circular border and fill are removed, and the glyphs use a consistent 32px size. The 11px supporting labels are more legible than the previous 7–8px labels.

The previous 2px scroll-driven line is replaced by a 6px violet route, a lime directional marker, and a trailing highlight. Its 7.2-second forward pass continues at rest, fades at the end, and repeats. Desktop uses a horizontal route; mobile uses a vertical route beside the icons and copy. Animation runs on the existing GSAP clock, pauses outside the viewport, and is reverted by the page lifecycle and motion control. Paused motion retains the complete route and all content.

The detailed order-journey page's tab icons are unchanged. The summary CTA has additional desktop clearance so the fixed motion control does not overlap its arrow.

Validation: production build, TypeScript, lint and formatting checks passed. Two visual passes covered desktop, 390px mobile, active motion and paused motion. DOM snapshots confirmed all four badges have zero border and transparent backgrounds. Repeated snapshots showed horizontal and vertical movement, an unchanged transform while off screen, and the expected static state after pausing. Navigation to the full journey and back restored a single working route. No browser console errors or horizontal overflow were found. The first production accessibility scan returned zero axe violations; incomplete automated checks remain recorded for manual review. These are local browser checks, not throttled-device performance measurements.

Evidence is in `.shots/network-revision/pass-1/` and `pass-2/`. `prior-audit.json` in pass 2 is explicitly the first-pass report; `runtime.json` and the second-pass screenshots describe the final revision.
