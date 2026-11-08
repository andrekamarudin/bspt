#!/usr/bin/env python3
"""Extract six individual transparent PNGs from the committed ImageGen atlas.

The atlas is the raw binary source. Character crops remain separate from the
SVG logo, typography, text, arrow placement and animation code.
"""
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets'/'collaboration-avatars'/'character-atlas.png'
DEST=SOURCE.parent
NAMES=('lead-listening','lead-presenting','data','design','legal','ops')
CELL_W,CELL_H=120,120

def main():
    if not SOURCE.is_file():
        raise FileNotFoundError(f'Missing ImageGen character atlas: {SOURCE}')
    im=Image.open(SOURCE).convert('RGBA')
    if im.size!=(360,240):
        raise ValueError(f'Atlas dimensions {im.size}; expected 360x240')
    for i,name in enumerate(NAMES):
        x=(i%3)*CELL_W; y=(i//3)*CELL_H
        crop=im.crop((x,y,x+CELL_W,y+CELL_H))
        bounds=crop.getbbox()
        if bounds is None:
            raise ValueError(f'No visible pixels in cell {name}')
        crop=crop.crop(bounds)
        out=DEST/(name+'.png')
        crop.save(out,optimize=True)
        print(f'{name}: {crop.size}, {out.stat().st_size:,} bytes')
    assert len(NAMES)==6

if __name__=='__main__':
    main()
