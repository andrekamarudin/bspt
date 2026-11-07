# AI Survey Light-Theme Contrast Guardrail

The original dark-theme stylesheet contains white-on-navy defaults. The survey switched to cream paper in November 2026, leaving dark-theme labels and inputs on light surfaces.

The separate, scoped `components/survey-contrast.css` fixes:
- **Topic review:** category-specific dark pink, blue and neutral accents, with dark ink on pale background; pink/blue remain recognisable without low-contrast pastel text.
- **Registration:** labels, helper text, examples, free-text inputs, errors and selected choices use dark ink on paper.
- **Sticky submit CTA:** forest for navigation, deep BSPT orange with white text for actual submission, without the inherited lime shadow.
- Focus and validation borders are legible.

## Contrast checks (WCAG AA, normal text)
- Love: `#902950` on `#FFF0F5`, 7.27:1
- Interested: `#185B7C` on `#EAF5FA`, 6.70:1
- Not for me: `#455563` on `#F0F1ED`, over 6:1
- Main ink: `#082E24` on `#F7F2E8`, 13.19:1
- Submit: white on `#C64B24`, 4.74:1

**Source of truth:** this CSS in `andrekamarudin/bspt`. The survey is deployed from Vercel files until a Git-based build is introduced. Load after `style.css`, `field-notes.css`, and `ink.css`. Do not alter survey JavaScript or registration behavior in a cosmetic release.

QA: test topic review with all three groups, registration fields/validation, CTA before/after reaching consent, desktop and mobile. No fake production submissions.
