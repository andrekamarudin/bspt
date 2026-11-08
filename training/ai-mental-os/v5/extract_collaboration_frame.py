#!/usr/bin/env python3
"""Create the authoritative static ending from the canonical collaboration GIF."""
from pathlib import Path
from PIL import Image

here = Path(__file__).resolve().parent
source = here.parents[2] / "motion" / "collaboration-with-ai.gif"
out = here / "collaboration-final.png"
if not source.is_file():
    raise FileNotFoundError(f"Missing canonical asset: {source}")
with Image.open(source) as gif:
    assert gif.format == "GIF", "Not a GIF"
    assert gif.n_frames >= 40, "Animation seems truncated"
    assert gif.size == (1400, 788), f"Unexpected resolution: {gif.size}"
    total = 0
    for n in range(gif.n_frames):
        gif.seek(n)
        total += gif.info.get("duration", 0)
    assert 40_000 <= total <= 60_000, f"Expected ~49s animation, got {total}ms"
    gif.seek(gif.n_frames - 1)
    gif.convert("RGB").save(out)
print(f"Extracted canonical last frame to {out} ({gif.n_frames} frames, {total/1000:.1f}s)")
