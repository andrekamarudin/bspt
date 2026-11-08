#!/usr/bin/env python3
"""Check generated BSPT v4 PPTX structure, notes, and embedded GIF animation.

Checks are mechanical, not a substitute for rendering slides or verifying live GIF playback.
"""
import json
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
from PIL import Image
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent
pptx = root / 'BSPT_AI_Mental_OS_Training_v4.pptx'
assert pptx.exists(), 'missing PPTX; run build.sh first'
with ZipFile(pptx) as arc:
    names = set(arc.namelist())
    slides = [n for n in names if n.startswith('ppt/slides/slide') and n.endswith('.xml')]
    notes = [n for n in names if n.startswith('ppt/notesSlides/notesSlide') and n.endswith('.xml')]
    gifs = [n for n in names if n.startswith('ppt/media/') and n.endswith('.gif')]
    assert len(slides) == 30, f'expected 30 slides, got {len(slides)}'
    assert len(notes) == 30, f'expected 30 speaker-note slides, got {len(notes)}'
    assert len(gifs) >= 3, f'expected >=3 GIF media placements, got {len(gifs)}'
    for name in gifs:
        gif = Image.open(BytesIO(arc.read(name)))
        assert gif.n_frames > 1, (name, gif.n_frames)
    for name in slides + notes:
        ET.fromstring(arc.read(name))
meta = json.loads((root / 'slides_meta.json').read_text())
assert len(meta) == 30
assert sum(x['minutes'] for x in meta) == 150
print(f'PASS: {len(slides)} slides; {len(notes)} note slides; 150 min; {len(gifs)} animated GIF placements')
