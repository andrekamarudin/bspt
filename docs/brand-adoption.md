# BSPT brand adoption: live sites

**Approved system:** Insider's Edge (premium forest/orange) + Expert's Field Notes (human, legible paper highlights).

## Where the brand is implemented

| Site | Runtime source | Brand treatment |
|---|---|---|
| [Homepage](https://www.bytesizeprotip.com/) | `andrekamarudin/self_hosting/infra/www/` | hero customer foreground; static brush in hero; one-shot animated brush in header; handwritten annotation; taped notebook brief; highlighted offer cards |
| [About](https://about.bytesizeprotip.com/) | `andrekamarudin/self_hosting/infra/about/` | same hero layers; handwritten margin note; paperclip + taped brief; static motif elsewhere |
| [AI survey](https://ai-learning-discovery.vercel.app/) | Vercel project `ai-learning-discovery` (deployed from files; not yet Git-connected) | one-shot animated header brush; perforated notebook paper on all survey steps; yellow imperfect highlighter on intro; one intro margin annotation on desktop; functional survey unchanged |

## Brand building blocks

**Canonical source:** `brand/tokens.json`, `logos/brush-slash.svg`, `motion/brush-slash-draw.svg`, `motifs/{marker-swash,hand-arrow,paperclip}.svg`, `components/field-notes.css`.

**Editable Figma specimens:** https://www.figma.com/design/hpKg4rZiyQJYwQ7TVBAnft

### Motion rule: use once, not everywhere

The brand animation is **animated SVG**, equivalent to the requested motion-GIF experience, but resolution-independent and lightweight. It is *non-looping*. Place it **once in the header** using this accessible picture element:

```html
<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="/brand-mark.svg">
  <img src="/brand-mark-animated.svg" alt="" width="62" height="49">
</picture>
```

Always use the static `/brand-mark.svg` on cards, badges, hero brushes, presentations and print. Do not animate background, article briefs, icon grids or form inputs.

### Character of the system

- One handwritten margin note per significant composition, never one per card.
- Yellow imperfect highlighter marks the decision-changing phrase, not every heading.
- Torn/taped notebook motif on actual *content* surfaces such as expert briefs and survey pages. Buttons/controls stay standard accessible HTML.
- Editorial serif headlines and clear sans-serif body copy.
- `#082E24` forest, `#FF6433` orange, `#F7F2E8` cream, `#FFD65A` yellow. No ad-hoc near-matching shades.
- SVG logo geometry is never redrawn with CSS polygons.
- Customer visual stays in front of the supportive brand strokes.
- On mobile, exclude ornamental margin notes that could cover interactive controls.

## Change propagation

For the two marketing sites, copy `components/field-notes.css` and `motifs/` to both `infra/www/` and `infra/about/`, review a PR in `self_hosting`, merge, and ensure both GitHub Actions deployments succeed.

For the AI survey, keep `app.js`, `admin.js`, `config.js`, and existing forms unmodified during design-only releases. Add the shared motif assets, `field-notes.css`, and annotated `index.html` to the deployment files. Validate all production aliases and one survey-step click, but do not submit fake registrations.

**Technical debt:** The survey production deployment is currently file-based, so a later manual deployment can overwrite the brand. Put the entire survey source under version control and connect Vercel to its reviewed branch as a separate migration. Do not expose credentials or private admin tokens in Git.

## Acceptance checklist

Run `node scripts/verify-live-brand.mjs` after rollout and verify representative desktop/mobile screenshots.

- Header contains the one-shot animated mark with reduced-motion fallback.
- Canonical static mark and all motif SVG URLs respond.
- Homepage and About contain a real notebook brief and the visible hand annotation.
- Survey shows notebook/perforation/highlight without obscuring inputs.
- Registration logic and admin functionality are not changed by brand-only deployments.

Approved reference concept board is creative direction only. **Never deploy a single flattened generated screenshot as a website.**
