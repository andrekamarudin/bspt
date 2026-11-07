# Layered BSPT hero implementation

**Purpose:** The visitor is the protagonist, while BSPT's paired brush strokes work invisibly behind the scenes.

## Layers, back to front

1. `media/hero-landscape.webp`: AI-generated mountain sunset with no words, person, or logo.
2. CSS gradients for controlled text contrast.
3. `logos/brush-slash.svg` applied via `mask-image` to retain the canonical paint geometry.
4. `media/hero-hiker.webp`: independently generated, transparent RGBA foreground subject.
5. Real HTML text, links and buttons.

Production CSS is `components/layered-hero.css`. The sites currently copy it inline as their static pages are a single HTML file.

### Accessibility and performance

- Foreground hiker is a separate `<img>`, not baked into the hero background.
- Background photograph is decorative; the person may have descriptive alt text.
- Headlines and controls remain live DOM elements for screen readers, translation and responsive layout.
- Source PNGs are retained in the original conversation artifacts; deploy optimised WebP versions to keep page weight low.
- Avoid hard-coded HTML text or brand logos in image-generation prompts.
- On mobile, move the hiker partially offscreen rather than covering the copy.

### Storage

Optimized versions are intentionally committed to Git (each under 150 KB), despite Cloudflare R2 not being active yet. R2 remains intended for larger original exports and videos, when available. No Git LFS required.
