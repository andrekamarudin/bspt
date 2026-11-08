# AI Mental OS, Version 4: full reproducible source

**This folder owns the entire editable BSPT 30-slide, 150-minute training deck.** It contains the original PptxGenJS generator, Python motion renderer, speaker-note metadata generation, all required image and BSPT motif assets, the synthetic verification fixture, and build checks. All sources must be committed before a slide deck is considered delivered.

## Rebuild

From `training/ai-mental-os/v4` in a clean checkout:

```bash
npm install --no-audit --no-fund
python -m pip install -r requirements.txt
bash build.sh
```

Outputs: `BSPT_AI_Mental_OS_Training_v4.pptx`, `slides_meta.json`, `human-value-knowledge-frontier-rebuilt.gif`, and first/last frame PNGs. The authoritative BSPT frontier GIF is separately tracked at [`motion/human-value-knowledge-frontier.gif`](../../../motion/human-value-knowledge-frontier.gif). This *local rebuild* uses a source-derived logo raster, so pixel-level GIF detail can differ from the authoritative asset. See [canonical renderer](../../../scripts/render_knowledge_frontier.py).

**The deck and every supporting source asset are versioned in this repository.** Generated intermediates are ignored. CI runs the build and publishes its actual `.pptx` as a workflow artifact. A release copy of the PPTX may also be committed as a tracked deliverable. Exact byte-for-byte PPTX comparison is not expected because ZIP package timestamps and PowerPoint metadata can vary. Verification checks slide count, notes, duration, presence of animated media, and known-answer fixture behavior.

## Ownership rule

1. No delivered asset without its *owning source code, original editable elements, fonts/dependency declaration, image sources, and build command* committed to GitHub.
2. Vendor/generated binaries can be omitted only when reproducible from committed sources; never ignore the **only** copy of an image, sound, video, font reference, or generator.
3. Verify a **fresh checkout build** plus rendered visual inspection when presentation quality matters. Passing CI alone does not prove learner comprehension or native PowerPoint GIF playback.
4. Commit source changes *and* the updated verification tests together. Record exact commit SHA and live/download URLs on delivery.
5. If a binary is too large for GitHub, use an explicitly named versioned asset store with an immutable URL, checksum and documented retrieval command. No undocumented `/mnt/data` dependency.

## Input assets and provenance

`base/assets/mei.jpg` and `cover.jpg` are fictional generated illustrations, **not** pictures of real customers. The raster SVG derivatives and brush animation are derived from BSPT's canonical identity. Three SVG motif originals are kept here for rebuild even when the live root brand assets change. The visual storyboard and evidence rules live in [`content/paid-training/`](../../../content/paid-training/README.md).

## Limitations

The known-answer checker is **not** general semantic verification. This build does not claim independently tested GIF playback in Microsoft PowerPoint, projector legibility, or actual participant learning gains. The animation's frontier is a conceptual metaphor, not a measured AI capability.
