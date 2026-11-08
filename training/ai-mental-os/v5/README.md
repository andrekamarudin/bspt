# BSPT AI Mental OS v5 | Collaboration-first paid workshop

**Promise:** Learn AI so you can get useful cross-functional first passes sooner, without replacing the human experts who own difficult decisions.

This is an editable **30-slide, 150-minute** workshop. It replaces v4's knowledge-frontier opening with the user-approved, human-first [collaboration GIF](../../../motion/collaboration-with-ai.gif). Version 4 is preserved alongside this directory and remains rebuildable.

## The 70/30 story

1. **What's in it for you?** AI reduces many of the routine delays between people. First passes across analysis, design, writing and operations can begin before the next specialist meeting.
2. **What it is NOT:** AI does not remove collaboration, expert review, responsibility or approval for consequential decisions. The GIF's **2–3 day wait is illustrative**, not empirical.
3. **Why learn now?** Work tasks are changing, but productivity gains vary. A first pass helps only if it is useful and can be checked. Research caveats are in speaker notes.
4. **Two ideas to take away:** Human above the loop, with precise limits and approval gates. **Outcome + Proof + Boundaries**, so safe routine work can be checked without repeated prompting.
5. **Proof of learning:** Participants independently design their 25th use case, including a test and an exception path. Mere excitement is not enough.

## Build from a clean checkout

From `training/ai-mental-os/v5`:

```bash
npm install --no-audit --no-fund
python -m pip install -r requirements.txt
bash build.sh
python render_preview.py
```

The build reads the **canonical committed binary** from `motion/collaboration-with-ai.gif`. It checks that the GIF is 1400×788, contains at least 40 frames and runs 40–60 seconds, then extracts its actual final frame for slide 2. The GIF is embedded unchanged into slide 1. No reconstructed approximation or local substitute is allowed in production.

Outputs:
- `BSPT_AI_Mental_OS_Training_v5.pptx` (editable)
- `BSPT_AI_Mental_OS_v5_preview.png` (static contact sheet)
- `slides_meta.json` (slide-by-slide timings, objective, speaker notes)
- `collaboration-final.png` (generated exact GIF last-frame fallback)

The CI workflow rebuilds from committed GitHub sources, runs structural/media/notes/demo checks, renders all 30 slides, and publishes the PPTX and contact sheet as downloadable workflow artifacts. Generated outputs are ignored, not unique input sources.

## Source dependency map

- **Current owned code:** `v5/generate.js`, `extract_collaboration_frame.py`, `verify_build.py`, `render_preview.py`, `build.sh`, `package.json`, `requirements.txt`.
- **Original motion and artwork:** `motion/collaboration-with-ai.gif`, `scripts/render_collaboration_motion.py`, `assets/collaboration-avatars/`, brand `logos/` and `motifs/` in the repo root.
- **Reused immutable training assets and toy fixture:** `../v4/base/assets/` and `../v4/demo/`. No copied duplicate originals. If a future change alters those, test both builds.
- **Companion story and editorial framing:** `content/paid-training/workforce-story-v5.md`.

## Verification scope

- **Automatic:** exact canonical GIF bytes embedded; its first-slide relation; 30 slides; 30 notes; timing 150 minutes; source-derived final-frame image; expected FAIL/PASS known-answer demo; successful 30-slide LibreOffice rendering.
- **Still requires a real presentation machine:** animated GIF playback in native Microsoft PowerPoint slideshow and projector readability. LibreOffice/PDF shows a still frame and is **not** a native animation test.
- **Still requires a pilot:** comprehension and transfer with real learners. All illustrative fictional examples must be labeled as such.

The GIF uses an 11-second ending hold to let learners read the payoff. Run it **once**, do not loop it as wallpaper or interrupt it with narration before the key comparison appears.
