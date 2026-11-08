# Publishing contract: source before artifact

**Deliverable:** `training/ai-mental-os/v4/BSPT_AI_Mental_OS_Training_v4.pptx`
**Build:** `cd training/ai-mental-os/v4 && bash build.sh`
**Expected:** 30 slides, 30 instructor-note pages, 150 minutes, three animation placements, fixture FAIL/PASS.

Rebuildable sources reside in this directory, including the images not available from generic sources. A CI artifact will be generated for each PR/push that touches this directory. If changed, the downloadable deck must be rebuilt before being claimed current.
