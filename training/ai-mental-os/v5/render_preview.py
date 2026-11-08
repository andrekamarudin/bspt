#!/usr/bin/env python3
"""Render every editable slide and produce a readable montage via LibreOffice."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, shutil

here=Path(__file__).resolve().parent
pptx=here/'BSPT_AI_Mental_OS_Training_v5.pptx'
outdir=here/'renders'
outdir.mkdir(exist_ok=True)
for command in ('libreoffice','pdftoppm'):
    if not shutil.which(command):
        raise SystemExit(f'Missing command: {command}')
subprocess.run(['libreoffice','-env:UserInstallation=file:///tmp/lo-bspt-v5', '--headless','--convert-to','pdf','--outdir',str(outdir),str(pptx)],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
pdf=outdir/pptx.with_suffix('.pdf').name
subprocess.run(['pdftoppm','-f','1','-l','30','-scale-to-x','1050','-scale-to-y','-1','-png','-r','110',str(pdf),str(outdir/'slide')],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
slides=sorted(outdir.glob('slide-*.png'))
assert len(slides)==30, f'Expected 30 rendered slides, got {len(slides)}'
cols=3; cell_w=560; cell_h=340; rows=(len(slides)+cols-1)//cols
canvas=Image.new('RGB',(cols*cell_w,rows*cell_h),(229,230,224))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
d=ImageDraw.Draw(canvas)
for i,p in enumerate(slides):
    im=Image.open(p).convert('RGB')
    im.thumbnail((cell_w-24,cell_h-44),Image.Resampling.LANCZOS)
    x=(i%cols)*cell_w+(cell_w-im.width)//2
    y=(i//cols)*cell_h+10
    canvas.paste(im,(x,y))
    d.text(((i%cols)*cell_w+14,(i//cols)*cell_h+cell_h-28),f'Slide {i+1:02d}',font=font,fill=(30,48,36))
out=here/'BSPT_AI_Mental_OS_v5_preview.png'
canvas.save(out,optimize=True)
print(f'RENDERED {len(slides)} slides to {out}')
