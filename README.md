# BSPT Brand System

**ByteSize ProTip (BSPT)** · canonical brand design assets and reproducible source code.

## Source of truth

1. **This repository** is the source of truth for SVG geometry, animation, design tokens, templates, and reproducible exports.
2. **Figma** is the editable visual design workspace. Do not hand-edit a master SVG in Figma and silently publish a divergent version.
3. **Cloudflare R2** will hold large, approved binary media after R2 activation. R2 is not active yet.
4. **Live websites** consume versioned assets from this repository (currently copies in `andrekamarudin/self_hosting`).

## Canonical brand

- Forest: `#082E24`
- Orange: `#FF6433`
- Cream: `#F7F2E8`
- Annotation yellow: `#FFD65A`
- Brand promise: *Know what matters. Do what works.*
- Style: premium editorial plus practical field notes, highlights, handwritten annotations.
- Primary mark: **two upward brush-stroke slashes**, bottom-left to top-right.

**Critical rule:** Use `logos/brush-slash.svg` for all manifestations of the brush slash, including large hero overlays, app icons, advertisements, and animations. Use CSS `mask-image` or embed the SVG. **Do not approximate it using `clip-path: polygon()`** or redraw the slash geometry in CSS. Derivative treatments may alter scale, colour and opacity, never geometry.

## Files

- `brand/tokens.json`: palette, typography and layout constants.
- `logos/`: scalable static and animated brush slash.
- `components/hero-overlay.css`: same SVG reused on photographs.
- `templates/`: repeatable expert brief visual language.
- `examples/`: source snapshots of live home and About sites.
- `scripts/verify-brand.mjs`: guardrail for assets and tokens.
- `docs/r2.md`: large-asset storage convention and activation steps.

## Usage

For hero backgrounds:

```html
<section class="hero hero--brush-overlay">
  <div class="hero-photo"></div>
  <!-- hero content -->
</section>
```

```css
/* Uses the exact brand asset; see components/hero-overlay.css */
.hero--brush-overlay::after {
  mask-image: url("/brand-mark.svg");
  -webkit-mask-image: url("/brand-mark.svg");
}
```

On a site, copy `logos/brush-slash.svg` unchanged to `/brand-mark.svg` or publish it under a versioned asset URL.

This repo intentionally avoids Git LFS. Store large GIF, PNG, MP4, and editable proprietary files in R2 or backup storage, with a manifest here.

## Training content: bite-size ProTip nugget vault

The content-first, survey-independent [GenAI nugget vault](content/nuggets/README.md) contains 24 modular human problems paired with teachable AI solutions, copy/paste safe demos, hands-on exercises, verification gates and mix-and-match metadata. **No slides or final story flow yet.** Validate with `node scripts/verify-nuggets.mjs`. Avoid assuming audience preferences before survey/pilot evidence exists.

## Paid training: AI Mental OS

The [AI Mental OS paid curriculum](content/paid-training/README.md) teaches two transferable principles: **human above the loop** and **well-defined outcomes with built-in proof**. It turns the free 24-nugget catalog into the ability to invent new, checkable AI workflows. Includes 120/150/180-minute plans, technical essentials, capstone rubric and first PPTX story outline. Content remains provisional until real audience testing. Validate via `node scripts/verify-paid-training.mjs`.

## Mandatory reproducible artifact delivery

**Every deliverable requires a GitHub commit before distribution.** Keep the owning generator/source, unique source assets, dependency versions, an exact build command, automated checks and enough context to rebuild. Do not leave the only source in ChatGPT's temporary `/mnt/data`, OneDrive, a ZIP download, Figma, or an unversioned computer folder.

For decks, the complete [AI Mental OS v4 source](training/ai-mental-os/v4/README.md) is the example. Build it from a clean checkout using `cd training/ai-mental-os/v4 && bash build.sh`. CI independently generates a downloadable PPTX. Generated caches and rebuildable outputs may be excluded; unique unrecoverable assets may not. If a binary exceeds a sensible Git size, track a checksum, immutable approved asset-store URL, and an automated retrieval step. Report the pushed SHA and test evidence.

## AI Mental OS v5: Collaboration-first opening

The [active 150-minute v5 deck source](training/ai-mental-os/v5/README.md) starts from the [original collaboration-with-AI animation](motion/collaboration-with-ai.gif) and answers **“What's in it for you?”**: useful cross-functional first passes without treating AI as a replacement for human specialists. v4 remains intact for reproduction and history. [Workflow](.github/workflows/build-ai-mental-os-v5.yml) builds the exact canonical GIF into the editable deck and uploads both PPTX and 30-slide preview.
