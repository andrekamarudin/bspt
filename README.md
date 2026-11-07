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
