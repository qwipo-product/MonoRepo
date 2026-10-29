# Network sequence refinement

26 October 2026

The route has no arrowhead. Its growing violet line and inline lime highlight share one timeline with the four stages. Each stage scales up when the leading edge reaches its layout position, with a lime underline beneath the name. Desktop scale is 1.045; phone scale is 1.035. Visited stages stay emphasized until the line completes the 7.2-second pass, then all reset together over 0.65 seconds. Measurements are refreshed when the layout changes, including across the horizontal and vertical breakpoints.

The full-journey CTA keeps its wording and destination, with a higher-contrast pill treatment and a 1.4-second shimmer separated by a 3.2-second rest. The line and shimmer pause off screen. The existing motion control reverts the route, stage scales, underlines and shimmer to their complete static state. Both effects are scoped to the page lifecycle and use GSAP's existing clock, without frame-by-frame React renders.

Production validation covered desktop at 1280px and phone at 390px, cumulative stage activation, the shared reset, motion pause, keyboard focus, keyboard activation, phone navigation and return navigation. The DOM showed only one route and one shimmer after returning. Lint, TypeScript, build and formatting checks passed. The automated accessibility scan found no violations or undersized targets; incomplete automated checks remain in the saved audit. The section's ink on paper contrast is 14.48:1. No console warnings/errors or horizontal overflow were observed. This is local browser validation, not a throttled-device benchmark.

Evidence: `.shots/network-stages/pass-1/` and `pass-2/`. Pass 2 includes the unchanged-build accessibility report and phone stage captures from pass 1, plus final CTA, focus, cumulative desktop stage and navigation evidence. Two independent screenshot reviews were requested for this scoped revision; neither is a formal award or full-site evaluation.

The final independent critic scored this section 7.4/10 and found no concrete visual or functional defect requiring another change within the requested scope. Motion feel cannot be established from still screenshots. The normal production build was regenerated without the local review panel after testing.
