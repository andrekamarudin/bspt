# Phoenix Rehab · Parallel Web Chatbot Pilot

Status: evaluatable, non-production web chatbot prototype. Built 10 Nov 2026 from Andre's WhatsApp discussion with Nigel Chua. Source of truth: this GitHub directory. Verify the live deployment before sharing externally.

## Goal
Let Nigel compare this prototype against his existing BotMD deployment, without switching off live patient systems. The goals are fewer no-shows, around-the-clock front-desk answers, and fewer missed follow-ups. This stage tests answer quality and handoff, not actual reminders or bookings.

## Implemented
- Responsive branded chat, with exact copies of the canonical BSPT brush-stroke logo and marker swash.
- Grounded, source-linked answers for fees, MC policy, cancellation, insurance and first visits.
- Guided clinic selection, five branch calendars plus official all-clinics calendar. No invented time slots.
- Preferred therapist and composite 60-minute requests, selected branch context preserved.
- Human escalation to the correct branch WhatsApp number. Clicking opens a prefilled draft, never sends automatically.
- Feedback modal, transcript export, email draft, start-over button, accessibility and reduced-motion support.
- Emergency and uncertainty fallbacks. Messages are kept in the browser tab, not persisted.

## Deliberately out of scope
- No connection to BotMD, WAHA, Sgimed live availability, patients' medical records, reminders, email, billing or EHR.
- Guided deterministic pilot, NOT an LLM-powered equivalent to BotMD.
- No appointment booking, modifications, outbound messages or clinically individualised recommendations.
- Not an official clinic service until Nigel approves the test and branding.

## Verify
From the repository root, run:
    node --test apps/phoenix-rehab-pilot/test/engine.test.mjs
    python3 -m http.server 8000 -d apps/phoenix-rehab-pilot

Open localhost:8000 on desktop and mobile. Test: “Can I book Shiv for 1 hour?”, “Can you issue an MC?”, “Any clinic”, “Tampines”, “Reschedule my visit”, “Insurance claims”, and “I can't breathe”. Inspect all booking URLs. Try feedback export.

## Sources and freshness
Public facts reviewed 2026-11-10 from:
- https://phoenixrehabgroup.com/about/patient-info-faq/
- https://phoenixrehabgroup.com/clinics/
- https://phoenixrehabgroup.com/programs/flexor-tendon-repair-recovery/
Official global and branch calendar links were directly provided by Nigel over WhatsApp. The clinic's website may change: refresh FAQs before production.

## Next production gates
1. Nigel provides previous BotMD feedback, sample conversations, explicit clinic approval and booking/CRM API access.
2. Establish consented, PDPA-compliant backend with encrypted data, audit and access controls.
3. Independently measure FAQ accuracy, resolution, missed handoffs and false confidence.
4. Only then enable booking and consented appointment reminders/follow-ups, with duplicate suppression, cancellation sync and alerts.

Deployment: set Vercel root directory to apps/phoenix-rehab-pilot. Static site, no secrets or build command. robots.txt blocks indexing and security headers restrict script execution.

## BSPT mobile design system (10 Nov 2026)

The original desktop-first prototype was corrected after mobile and motif review. The website uses two stylesheets: `style.css` for base UI and `responsive-brand.css` as the mobile-first BSPT composition layer.

- **Canonical, byte-identical art:** `brush-slash.svg` from `logos/brush-slash.svg`, `brand-mark-animated.svg` from `motion/brush-slash-draw.svg`, `marker-swash.svg` and `paperclip.svg` from the `motifs/` directory. The header runs the actual one-shot SVG motion; reduced-motion browsers load the static mark. Never approximate the logo with CSS polygons.
- **Handwriting:** genuine editable HTML, using Caveat font, for a brief purposeful margin note and the actual paper field-note. The highlighter is the canonical source SVG. No arrows without a verified semantic target.
- **Mobile:** at widths up to 980px, the functional chatbot moves **ahead** of editorial copy and notebook, with 16px input, safe-area padding and touch targets; landscape below 590px viewport height has a compact chat so the composer stays visible.
- **Privacy:** the design layer does not introduce new data storage, analytics, network calls or outbound customer messages.

Automated checks: `node --test apps/phoenix-rehab-pilot/test/*.test.mjs`. The GitHub workflow `.github/workflows/test-phoenix-pilot.yml` runs pinned Chromium tests on actual layout at 360×740, 390×844, 430×932, 768×1024, 891×411 landscape and 1440×900 desktop, tests interactions and uploads six screenshots as the `phoenix-responsive-qa` artifact.

The known Figma brand file (https://www.figma.com/design/hpKg4rZiyQJYwQ7TVBAnft) was referenced through the canonical GitHub design documentation, but Figma's Starter-plan MCP rate limit prevented a fresh Figma read/sync on 10 Nov 2026. The committed GitHub SVG geometry and the browser screenshots are the verified release evidence; **do not claim Figma sync** until a fresh read/write succeeds.
