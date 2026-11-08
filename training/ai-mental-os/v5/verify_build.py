#!/usr/bin/env python3
"""Mechanical contract for BSPT v5. This does not prove native slideshow playback."""
from pathlib import Path
import hashlib, json, zipfile
from PIL import Image

here = Path(__file__).resolve().parent
root = here.parents[2]
asset = root / "motion/collaboration-with-ai.gif"
deck = here / "BSPT_AI_Mental_OS_Training_v5.pptx"
metadata = json.loads((here / "slides_meta.json").read_text())
assert len(metadata) == 30, f"Expected 30 slides, got {len(metadata)}"
assert sum(x['minutes'] for x in metadata) == 150
assert all(x['objective'] and x['say'] for x in metadata)
assert 'first pass' in metadata[0]['say'].lower()
assert '2–3 day waiting label' in metadata[0]['say']
assert 'What would become possible' in metadata[0]['ask']
assert 'specialist' in metadata[1]['say'].lower()
assert 'approval' in metadata[0]['safety'].lower() or 'not a measured' in metadata[0]['say'].lower()
with Image.open(asset) as im:
    assert im.format == 'GIF' and im.size == (1400, 788)
    assert im.n_frames >= 40
    total=0
    for frame in range(im.n_frames):
        im.seek(frame)
        total += im.info.get('duration', 0)
    assert 40_000 <= total <= 60_000, f"Unexpected motion duration: {total}ms"
with zipfile.ZipFile(deck) as p:
    names = p.namelist()
    slides = [x for x in names if x.startswith('ppt/slides/slide') and x.endswith('.xml')]
    notes = [x for x in names if x.startswith('ppt/notesSlides/notesSlide') and x.endswith('.xml')]
    gifs = [x for x in names if x.startswith('ppt/media/') and x.lower().endswith('.gif')]
    assert len(slides) == 30, len(slides)
    assert len(notes) == 30, len(notes)
    assert gifs, 'No animated GIFs embedded'
    asset_hash = hashlib.sha256(asset.read_bytes()).hexdigest()
    embedded_hashes = [hashlib.sha256(p.read(g)).hexdigest() for g in gifs]
    assert asset_hash in embedded_hashes, 'Canonical GIF was not embedded unchanged'
    slide1rels = p.read('ppt/slides/_rels/slide1.xml.rels').decode('utf8')
    assert any(g.rsplit('/',1)[-1] in slide1rels for g in gifs), 'Slide 1 lacks a GIF relationship'
    note = p.read('ppt/notesSlides/notesSlide1.xml').decode('utf8')
    assert 'routine' in note.lower() or 'first pass' in note.lower()
print(f"PASS: {len(slides)} slides, {len(notes)} notes, 150 minutes, canonical collaboration GIF ({total/1000:.1f}s, exact SHA256 match), first-slide relationship")
