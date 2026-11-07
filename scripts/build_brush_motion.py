from __future__ import annotations
from pathlib import Path
from io import BytesIO
import math
import numpy as np
from PIL import Image
import cairosvg

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'motion'
OUT.mkdir(parents=True,exist_ok=True)
SVGPATH=ROOT/'logos'/'brush-slash.svg'
SIZE=(930,600) # 6x canonical SVG viewBox 155x100
raw=cairosvg.svg2png(url=str(SVGPATH),output_width=SIZE[0],output_height=SIZE[1])
base=Image.open(BytesIO(raw)).convert('RGBA')
W,H=base.size
np_rgba=np.array(base).astype(np.uint8)
rgba_alpha=np_rgba[:,:,3].astype(np.float32)/255
# Render canonical source, unchanged: derive two stroke classifications from the
# projected coordinate perpendicular to the diagonal stroke's center line.
y,x=np.mgrid[:H,:W].astype(np.float32)
xu=x/6.;yu=y/6.
perp=xu+0.78*yu
stroke1=(perp<118)
stroke2=~stroke1
# each stroke is revealed at its tip moving bottom-left -> top-right.
# subtle rippled front line models the uneven bristle advance, but never changes final vector.
progress=(97.-yu)/90.
ripple=(np.sin(xu*.58+yu*.16)*.014 + np.sin(xu*.29-yu*.31)*.008)
front=progress+ripple
smooth=lambda t: (np.clip(t,0,1)**2)*(3-2*np.clip(t,0,1))
# Loop over timed frames; left paint starts first; right begins while first moves.
times=list(np.arange(0,2.05,.06))+[2.05,2.05,2.05,2.05,2.05,2.05] +list(np.arange(2.09,2.42,.075))
# ordered dithering for alpha so GIF transparency retains dry-brush grain, instead of a solid sticker.
bayer=np.array([[0,48,12,60,3,51,15,63],[32,16,44,28,35,19,47,31],[8,56,4,52,11,59,7,55],[40,24,36,20,43,27,39,23],[2,50,14,62,1,49,13,61],[34,18,46,30,33,17,45,29],[10,58,6,54,9,57,5,53],[42,26,38,22,41,25,37,21]],dtype=np.float32)/64
threshold=np.tile(bayer,(math.ceil(H/8), math.ceil(W/8)))[:H,:W]
# palette: color #FF6433 fixed, 0 = transparent
palette=[0,0,0,255,100,51] + [0,0,0]*(256-2)

fg_frames=[]
bg_frames=[]
durations=[]
for i,t in enumerate(times):
    # 1.30s left, 1.28s right offset 0.26; fade out over last .3s.
    left=smooth((t-.10)/1.36)
    right=smooth((t-.36)/1.31)
    # smooth clip at advancing bristle front (about 1.0% image width)
    # full visible where brush has reached, partial just ahead of it.
    frac1=np.clip((left-front)*38+.60,0,1)
    frac2=np.clip((right-front)*38+.60,0,1)
    alpha=rgba_alpha * np.where(stroke1,frac1,frac2)
    if t>2.08:
        alpha*=max(0,1-(t-2.08)/.35)
    mask=alpha>threshold
    # transparent version: true GIF transparency
    arr=np.where(mask,1,0).astype(np.uint8)
    im=Image.fromarray(arr,'P')
    im.putpalette(palette)
    im.info['transparency']=0
    fg_frames.append(im)
    # composite on official forest green for reliable anti-aliased texture in brand use
    op=(alpha*255).astype(np.uint8)
    new=np_rgba.copy();new[:,:,3]=op
    canvas=Image.new('RGBA',(W,H),(8,46,36,255))
    canvas.alpha_composite(Image.fromarray(new,'RGBA'))
    # palette quantization preserving fine orange vs green levels, no extra dither
    bg_frames.append(canvas.convert('RGB').quantize(colors=96,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE))
    durations.append(60)
# Consolidate end hold by adding duration to last full-draw before fade
# create GIF with no duplicate palette conversion
fg_path=OUT/'brush-slash-draw-transparent.gif'
bg_path=OUT/'brush-slash-draw-forest.gif'
fg_frames[0].save(fg_path,save_all=True,append_images=fg_frames[1:],duration=durations,loop=0,transparency=0,disposal=2,optimize=False)
bg_frames[0].save(bg_path,save_all=True,append_images=bg_frames[1:],duration=durations,loop=0,disposal=2,optimize=True)
print('Generated:')
for path in (fg_path,bg_path):
    im=Image.open(path)
    print(f'  {path} ({path.stat().st_size:,} bytes, {im.n_frames} frames)')