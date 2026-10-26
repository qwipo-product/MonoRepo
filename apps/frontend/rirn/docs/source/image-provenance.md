# Product image sources

Active screens: `screens/marketplace.png` (590 × 1055) and `screens/search.png` (590 × 1153), extracted without content edits from `ONDC DigiDukaan 2.0.pptx` on 27 October 2026. The home image is `ppt/media/image5.png` on slide 1; search is `ppt/media/image4.png` on slides 1 and 6. Prices, margins and offers are illustrative rather than live quotations.

`npm run images:prepare` produces 390/590px AVIF/WebP variants and embedded low-resolution previews. It does not upscale beyond the source resolution. Both full source screens are fitted inside the device so seller labels and terms are not cropped out.

The older six `screens/*.jpg` files are retained as historical evidence from the 26 October mockup review. They are no longer displayed because they include beat-day terms, ₹2,000 minimums and 24–48-hour delivery that conflict with the 2.0 deck. See `docs/16-content-fact-check.md`.
