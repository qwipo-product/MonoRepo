# DigiDukaan and Qwipo: separate product and company stories

Implemented 28 October 2026 from the confirmed scope.

- DigiDukaan owns the homepage, header and product exhibit. Qwipo is retained in the About Qwipo link, footer credit and contact recipient disclosure.
- About Qwipo explains the company/product relationship and the DMS and Logistics Tech capabilities from the existing document research.
- The complete homepage logistics explainer remains, with distributor-fleet and approved 3PL modes. Product screenshots, progressive loading, phone choreography and the paired hero arrows are unchanged.
- Decorative photo, heading, audience and footer arrows have been removed. Action and scroll indicators remain.
- Contact roles use title case. Email and phone remain beside one another when the form has enough width; labels and guidance have stronger readability.
- Journey metadata now matches the visible ordering and delivery flow, rather than the previously reverted 2.0 content.

## Routing

The source adds `/about-qwipo`. The deployment uses `?page=about-qwipo` to preserve `/builds/<branch>/<commit>/` preview paths. About Qwipo is available from both header and footer. Native fragment links preserve the current query page when navigating to its contact form. The company page links back to the DigiDukaan product section.

## Verification

Next.js lint, TypeScript and production build passed. The Vite mirror passed scoped lint, typecheck and production build; only unchanged version-badge checks were cached. The frozen Bun install made no dependency changes. All 16 existing contact API tests passed using mocked responses. No live enquiry was sent.

Browser review covered 320px, 390px, 768px and 1440px layouts; no horizontal overflow was found in checked states. Company/product navigation, current-page indication, contact anchors, mobile menu, journey navigation and Back navigation were checked. Empty-form submission presents errors and focuses the first invalid field. Email and phone share a desktop row.

Automated axe review reported zero violations for the company page on desktop and mobile, and for the revised mobile homepage. The updated brand target is 44px high; the checked pages reported no small targets. Some existing action/back-to-top contrast checks remain incomplete. Keyboard entry reaches a visible skip link. The hero's two route arrows were observed moving with motion enabled.

Screenshots and detailed local reports: `docs/verification/company-split/final/` in the original source workspace. Two independent visual reviews were used. No throttled field-performance benchmark was performed. The Vite preview remains a client-rendered, noindex mockup; its page-specific metadata is updated in the browser.

The final independent visual review scored the shown refinement 7.29/10 and found no material visual blocker. Its remaining suggestions were a sharper source photograph and richer verified customer evidence, outside this structural change. The unthrottled homepage audit recorded a late LCP candidate around 16.4 seconds; performance is not claimed as validated, and no screenshot/loading/motion implementation was changed in this pass.
