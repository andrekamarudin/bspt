# Asset handling

- **Vector source:** `logos/brush-slash.svg` is the only approved geometry for the two orange brush strokes.
- **Motion:** `motion/brush-slash-draw.svg` animates the same vector artwork, drawing bottom-left to top-right.
- **Copy to live static websites:** place identical source SVG at `/brand-mark.svg`; do not trace a second copy.
- **Hero artwork:** use `mask-image: url('/brand-mark.svg')`, not `clip-path` or gradients cut into parallelograms.
- **Colour:** `brand/tokens.json`, not arbitrary values.
- **Provenance:** brush-stroke shape faithfully vector-traced from the two painted strokes in the approved BSPT concept-board design. Each mark is independently irregular, but proportions and angle closely match.
- **Large media:** Cloudflare R2 bucket `bspt-brand-assets` will be private; not provisioned yet because the Cloudflare account needs R2 enabled. No guessed public bucket URLs.
- **Reproducibility:** SVG is self-contained vector markup with no raster or font dependency. Source assets and code are in Git; no LFS needed. Run the validation script before release.
- **Publication:** Update the `self_hosting` repository copies via PR, then deploy and verify the actual site asset response.

## Source-first publishing gate

Before telling someone an artifact is ready: (1) commit every generator, editable source, unique image, configuration, dependency and test to `andrekamarudin/bspt`; (2) build from a clean checkout; (3) verify expected output and inspect the actual visual result; (4) push and read back the commit; (5) link the GitHub source and the artifact, with any unverified limitations. A ChatGPT sandbox or OneDrive file alone is not the repository of record. Generated caches and other outputs that are *fully reproducible* may be excluded; the only copy of a source asset may not be.
