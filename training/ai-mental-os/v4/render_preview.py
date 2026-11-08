#!/usr/bin/env python3
"""Render and contact-sheet every slide of the committed BSPT v4 generator.

Uses LibreOffice and Poppler. GIF first frames are static in PDF; native
PowerPoint slideshow animation must still be checked on target hardware.
"""
from __future__ import annotations
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess
from PIL import Image, ImageOps, ImageDraw

ROOT=Path(__file__).resolve().parent
PPTX=ROOT/'BSPT_AI_Mental_OS_Training_v4.pptx'
DEST=ROOT/'BSPT_AI_Mental_OS_v4_preview.png'
assert PPTX.exists(), 'Run bash build.sh first.'
with TemporaryDirectory(prefix='bspt-render-') as temp:
    t=Path(temp)
    subprocess.run(['libreoffice','-env:UserInstallation=file:///tmp/bspt_lo_preview_v4',
                    '--headless','--convert-to','pdf','--outdir',str(t),str(PPTX)],
                   check=True, capture_output=True, text=True)
    pdf=t/(PPTX.stem+'.pdf')
    assert pdf.exists(),'LibreOffice did not create a PDF'
    subprocess.run(['pdftoppm','-png','-r','65',str(pdf),str(t/'slide')],
                   check=True,capture_output=True,text=True)
    rendered=sorted(t.glob('slide-*.png'))
    assert len(rendered)==30, f'Expected 30 rendered slides, got {len(rendered)}'
    thumb=(560,315);gap=16;cols=5;rows=6
    sheet=Image.new('RGB',(cols*(thumb[0]+gap)+gap,rows*(thumb[1]+gap)+gap),'#e8ded0')
    for i,file in enumerate(rendered):
        img=Image.open(file).convert('RGB')
        img=ImageOps.fit(img,thumb,Image.Resampling.LANCZOS)
        x=gap+(i%cols)*(thumb[0]+gap);y=gap+(i//cols)*(thumb[1]+gap)
        sheet.paste(img,(x,y))
    sheet.save(DEST,optimize=True)
    print(f'PASS: rendered {len(rendered)} slides to {DEST}, {DEST.stat().st_size:,} bytes')
