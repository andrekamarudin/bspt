# BSPT Ink: generative handwritten annotation system

**Purpose:** A small cross-site rendering engine to make meaningful hand-drawn annotations at will, instead of storing dozens of rigid PNG/SVG stickers.

The implementation is **real HTML handwriting + calculated SVG ink paths**. Text remains editable and searchable. Positions are computed against rendered DOM targets, so annotations adapt to fonts and viewport changes.

## Source files

- `components/ink.js`: runtime and geometry/placement engine
- `components/ink.css`: canonical handwriting, line and stroke treatment
- `components/ink-init.js`: current site-level configurations. This file is declarative and safe to edit without retracing shapes.
- `components/field-notes.css`: notebook and editorial structural treatment
- `logos/brush-slash.svg`: unchanged canonical brush logo

## Adding an annotation

Place the scripts once in the page, **after** the normal site CSS:

```html
<link rel="stylesheet" href="/ink.css">
<script defer src="/ink.js"></script>
<script defer src="/ink-init.js"></script>
```

Then add a semantic anchor:

```html
<h2 id="lesson-title">Find the critical few</h2>
```

And declare the annotation:

```js
BSPTInk.mount({
  stage: '.lesson-section',
  annotations: [
    {
      id: 'lesson-note', kind: 'note',
      target: '#lesson-title',
      text: 'This is the important bit.', // arbitrary text, including newlines
      color: 'orange', size: 28, rotation: -4,
      placement: 'above-right',
      fallback: ['right-top','above-left'],
      avoid: ['.primary-cta', '.customer-photo'],
      minWidth: 760,
      motion: 'reveal' // optional one-shot animation
    },
    {
      kind: 'underline', target:'#lesson-title',
      color:'yellow', width:6, mobile:true
    },
    {
      kind: 'circle', target:'#lesson-title',
      color:'orange', pad:12, mobile:true
    }
  ]
});
```

A *pointer* is opt-in. **It will not draw unless both ends are valid:**

```js
{ kind:'note', target:'#explanation', text:'Try this first.',
  placement:'left-top', arrow:{target:'#real-action-button'} }
```

If there is no clean placement, the annotation is omitted rather than covering content. Use a handwritten phrase without an arrow when the writing is merely expressive.

## Rules learned from visual QA

1. **No decorative arrows without an actual semantic target.** An arrow is functional, not a brand ornament.
2. **No hard-coded screenshot coordinates.** All coordinates are derived from current DOM bounds, and recalculated on resize, late font loading and dynamic content replacement.
3. **One handwritten annotation per meaningful area.** Prefer one strong note rather than five bits of noise.
4. **The visitor remains the visual protagonist.** Avoid covering photography, faces, text, and form controls.
5. **Motion is optional, one-shot and disabled for reduced-motion visitors.** The canonical brush-logo draw animation remains one-shot in the header.
6. **Small screens hide optional floating notes.** Underlines can remain if they fit; no clipped scribbles.
7. **Editable text and SVG paths stay separate from photographs and clickable UI.** The ink layer does not capture pointer events.

## Media and animation

For websites, the source is the declarative annotation configuration. Use the optional `motion:'reveal'` to create a one-time handwriting appearance. This is a left-to-right wipe, **not a physically accurate pen-stroke animation**. True letter-by-letter pen paths would require a single-line stroke font or manually authored paths and a separate animation/export pipeline.

The geometry is generated as vector SVG paths at runtime. For decks/videos, use the same text and layout specification but recreate the lettering in Figma (editable text) or render a browser capture. Avoid embedding editable UI or real text in a flattened image.

## Deployment

The main and About pages run from `andrekamarudin/self_hosting` on the VPS hosts. The AI survey runs from a file-based Vercel project. Keep all three copies of `ink.js`, `ink.css` and `ink-init.js` identical. Never mutate survey question logic when shipping typography changes.

Use responsive screenshot QA at 390, 768, 1024 and 1440px. Visual acceptance is mandatory for any annotation.
