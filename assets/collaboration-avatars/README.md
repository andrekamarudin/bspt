# Collaboration animation: ImageGen character components

**Purpose:** Preserve the illustration quality of AI-generated people without asking ImageGen to render logos, exact typography, arrows, data, or timing.

## Tracked source and reproducibility

- `character-atlas.png`: approved ImageGen-derived, transparent six-character atlas, 360×240 pixels.
- `scripts/extract_collaboration_avatars.py`: deterministic segmentation, creating six individual PNGs: `lead-listening.png`, `lead-presenting.png`, `data.png`, `design.png`, `legal.png`, `ops.png`.
- `scripts/render_collaboration_motion.py`: composites the individual PNGs into editable Python-authored diagrams and renders `motion/collaboration-with-ai.gif`.
- `logos/brush-slash.svg`: canonical, *unchanged* BSPT logo. The logo is NEVER taken from the generated artwork.
- `motifs/paperclip.svg` and `motifs/marker-swash.svg`: canonical motifs, also outside the generated images.

The project lead has two natural gestures, selected programmatically at a deliberate story beat. Experts remain distinct characters. These are **illustrative people**, not actual employees.

**Provenance:** The images were generated for the user by ImageGen (2026-11-08) and cropped/isolated from its transparent character output and concept illustrations. The atlas preserves the selected cutouts as source; regenerating identical pixels from the model is not deterministic. Source assets and layout/render code are tracked in Git so every subsequent build is reproducible.

## Rebuild

```bash
pip install Pillow CairoSVG
python scripts/extract_collaboration_avatars.py
python scripts/render_collaboration_motion.py
```

## Rules and tests

1. Generate only art that benefits from illustration: faces, body language, character texture.
2. Isolate each character into a transparent PNG at sufficient resolution and check the alpha channel.
3. Use real SVG assets for identity, labels, lines and UI. Never request ImageGen to copy the corporate logo.
4. Stitch components with deterministic coordinates, not a flattened AI illustration. Keep image-derived hands clear of explanatory text and avoid circular-crop artifacts.
5. Render a contact sheet of meaningful moments and inspect **actual final frames** before publishing. Keep the long final hold for projector reading.
6. Fail the production build if an expected character asset or canonical SVG is missing.

See the corresponding `style-bspt-design` skill in `andrekamarudin/skills`.
