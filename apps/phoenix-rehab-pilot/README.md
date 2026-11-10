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
