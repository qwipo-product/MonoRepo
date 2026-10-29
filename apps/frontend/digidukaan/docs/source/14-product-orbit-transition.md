# Circular product phone transition

## Confirmed direction

For each screen change in the violet product exhibit, the old phone leaves to the right and down while the new phone enters from the left. Both move simultaneously and tilt with the same circular path. The circle's centre sits below the entire violet panel. This applies to automatic changes and screen buttons; headline, controls and attribution remain stationary.

## Implementation

`OrbitProductDevice.tsx` owns this section's choreography separately from the hero and detailed journey devices. Four lightweight handset frames retain the existing real screenshots and progressive-image component. Only the outgoing and incoming frames are visible during a transition; one remains visible at rest.

One 1.15-second GSAP timeline rotates the pair around the same origin. The geometry is measured on layout changes, with a radius of at least twice the panel width and a centre at least 72px below its bottom. Endpoint angles account for handset dimensions, tilt and clearance so the outgoing phone leaves the clipping area completely. A dedicated preview area protects the headline and fixed navigation.

Automatic changes wait approximately 4.20 seconds after a settled screen and its next image are ready. This makes uninterrupted automatic cycles 15% more frequent: the original 6.15-second cycle becomes approximately 5.35 seconds, while the handoff remains 1.15 seconds. Hover/focus suspends automatic progression. Manual selection can display the embedded preview immediately while the full image loads. Rapid clicks preserve the latest requested destination, which follows the current pair's natural completion. Pausing or leaving the viewport settles the selected screen; resizing also restores a composed resting state before remeasuring.

The transition uses transforms, with no per-frame React updates or layout reads. Completed transitions do not accumulate in the GSAP context. Unmount cleanup kills the active timeline, removes observers and restores styles. Local QA controls are omitted from the normal build.

## Verification

Evidence: `.shots/product-orbit/pass-1/` and `.shots/product-orbit/final/`.

| Check | Result |
| --- | --- |
| Production build and lint | Passed |
| Desktop 1280px, tablet 768px, phones 390px and 320px | No horizontal overflow; responsive controls remain usable |
| 25%, 50% and 75% desktop transition samples | Outgoing moves right/down, incoming moves left-to-centre; both rotate around the same point |
| Circle geometry | Eleven recorded checks place the pivot below the panel; measured radius deviations below 0.24px |
| Text/control clearance | Clipped motion area stays below the headline and above navigation in every recorded sample |
| Visible phone count | Exactly two during the handoff, one after completion |
| Four screen selectors | Each settles on its corresponding screenshot |
| Rapid selections | Last request wins after the current handoff; one final phone |
| Keyboard | Tab and Space select Choose; visible 2px focus outline |
| Pause during handoff | Selected phone restored to a readable upright position |
| Manual selection while paused | Changes immediately without orbit motion |
| Resize during handoff | Returns to one selected phone and remeasures the circle |
| Default automatic progression | Observed advancing screens without a selector action |
| Desktop/mobile axe | No reported violations or targets below 24px |
| Browser warnings/errors | None captured |
| Existing development server at port 3000 | Motion defaults to full; Track and paused Order selection verified without browser errors |

The first visual pass prompted a wider circle and a smaller angular separation, preserving more of the phone silhouettes during the handoff and removing the abrupt lower clipping of their bodies. The final independent, evidence-only section review found no demonstrated blockers and scored 7.25/10 overall (Design 7.5, Usability 7.0, Creativity 7.0, Content 7.5). This is a scoped estimate, not an award or a whole-site audit.

No throttled-device frame-rate or field-performance claim is made. The existing user-directed default keeps motion enabled on entry, with the global pause control available. Hero spin/tilt/arrows and the detailed order journey retain their own animations.
