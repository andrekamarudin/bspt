#!/usr/bin/env python3
"""Rebuildable BSPT one-shot GIF: the frontier of human knowledge."""
from __future__ import annotations
from pathlib import Path
from io import BytesIO
import math
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'motion'/'human-value-knowledge-frontier.gif'
OUT.parent.mkdir(parents=True,exist_ok=True)
W,H=1200,675
FOREST='#082E24';DEEP='#051C17';CORAL='#FF6433';CREAM='#F7F2E8'
YELLOW='#FFD65A';SAGE='#8DAB99';STONE='#E8DED0'

def font(size,serif=False,bold=False):
    if serif:
        paths=['/usr/share/fonts/truetype/msttcorefonts/Georgia.ttf',
               '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf']
    else:
        name='Bold' if bold else 'Regular'
        paths=[f'/usr/share/fonts/opentype/inter/Inter-{name}.otf',
               '/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if bold else '')+'.ttf']
    for p in paths:
        if Path(p).exists():return ImageFont.truetype(p,size)
    return ImageFont.load_default()

TITLE=font(44,True);HERO=font(43,True);BODY=font(24)
SMALL=font(18);LABEL=font(21,bold=True);TINY=font(16)
def ease(v):
    v=max(0,min(1,v));return v*v*(3-2*v)

def arrow(d,x1,y1,x2,y2,color,width=9):
    d.line((x1,y1,x2,y2),fill=color,width=width,joint='curve')
    a=math.atan2(y2-y1,x2-x1)
    d.polygon([(x2,y2),
               (x2-25*math.cos(a-.48),y2-25*math.sin(a-.48)),
               (x2-25*math.cos(a+.48),y2-25*math.sin(a+.48))],fill=color)

def exact_logo():
    # Use the actual vector asset: do not approximate the logo paths.
    import cairosvg
    b=cairosvg.svg2png(url=str(ROOT/'logos'/'brush-slash.svg'),output_width=122,output_height=78)
    return Image.open(BytesIO(b)).convert('RGBA')
LOGO=exact_logo()

def frame(t):
    im=Image.new('RGB',(W,H),FOREST);d=ImageDraw.Draw(im)
    d.text((60,37),'THE KNOWLEDGE FRONTIER',font=TITLE,fill=CREAM)
    d.line((60,113,1140,113),fill=SAGE,width=2)
    im.paste(LOGO,(1032,18),LOGO)
    cx,cy,R=738,372,213
    d.ellipse((cx-R,cy-R,cx+R,cy+R),fill=DEEP,outline=CREAM,width=4)
    d.text((790,129),'COLLECTIVE KNOWLEDGE',font=TINY,fill=STONE)
    d.line((820,155,873,171),fill=SAGE,width=2)
    for a in [15,90,165,240,315]:
        x=cx+R*math.cos(math.radians(a))
        y=cy+R*math.sin(math.radians(a))
        d.ellipse((x-4,y-4,x+4,y+4),fill=SAGE)
    stages=[(0,2.25),(2.25,4.65),(4.65,6.85),(6.85,10.3)]
    idx=next((i for i,(s,e) in enumerate(stages) if s<=t<e),3)
    titles=['20 years to learn','40 years to push','AI starts near the edge','What is left for us?']
    detail=[['Build a small personal','map of what humanity knows.'],
            ['A career of specialization','pushes one narrow frontier.'],
            ['Broad knowledge becomes','cheap and widely accessible.'],
            ['Set direction. Align people.','Judge trade-offs. Own outcomes.']]
    bands=['BEFORE AI  /  00–20','BEFORE AI  /  20–60',
           'AFTER AI  /  KNOWLEDGE','AFTER AI  /  HUMAN VALUE']
    d.rounded_rectangle((60,158,337,197),radius=7,fill=CORAL if idx<2 else YELLOW)
    d.text((74,165),bands[idx],font=SMALL,fill=DEEP)
    d.text((60,229),titles[idx],font=HERO,fill=CREAM)
    for i,s in enumerate(detail[idx]):d.text((60,307+i*39),s,font=BODY,fill=STONE)
    tags=['LEARNING','SPECIALIZATION','THE DISRUPTION','THE HUMAN EDGE']
    notes=['The circle grows.','A rectangle breaks the rim.',
           'Knowledge alone loses scarcity.','Choose what is worth moving.']
    d.text((60,441),tags[idx],font=LABEL,fill=YELLOW)
    d.text((60,478),notes[idx],font=SMALL,fill=CREAM)
    g=ease((t-.18)/1.89) if t<2.25 else 1
    hr=4+58*g
    d.ellipse((cx-hr,cy-hr,cx+hr,cy+hr),fill=CORAL,outline=CREAM,width=2)
    if idx<2:d.text((cx-31,cy-11),'YOU',font=LABEL,fill=DEEP)
    if t>=2.25:
        prog=ease((t-2.34)/1.98) if t<4.65 else max(0,1-(t-4.65)/.35)
        end=int(cx+hr+(R+59-hr)*prog)
        if prog>0:
            d.rounded_rectangle((cx+hr-9,cy-14,end,cy+14),radius=7,fill=CORAL)
            if end>cx+R:d.ellipse((cx+R-3,cy-24,cx+R+6,cy+24),outline=YELLOW,width=4)
    if idx==1:d.text((cx+R+22,cy+46),'ONE NEW EDGE',font=TINY,fill=YELLOW)
    if t>=4.65:
        ar=66+(R-16-66)*ease((t-4.72)/1.58)
        overlay=Image.new('RGBA',(W,H),(0,0,0,0));od=ImageDraw.Draw(overlay)
        od.ellipse((cx-ar,cy-ar,cx+ar,cy+ar),fill=(141,171,153,38),
                   outline=(141,171,153,235),width=8)
        im=Image.alpha_composite(im.convert('RGBA'),overlay)
        d=ImageDraw.Draw(im)
        d.ellipse((cx-12,cy-12,cx+12,cy+12),fill=CORAL,outline=CREAM,width=2)
        if t>=5.35:d.text((cx-12,cy+27),'AI: BROAD COVERAGE',font=TINY,fill=STONE)
    if t>=6.85:
        p=ease((t-6.94)/1.10)
        end=(cx+(1040-cx)*p,cy+(206-cy)*p)
        arrow(d,cx,cy,*end,CORAL,10)
        if t>=7.92:
            ox,oy=1040,206
            d.ellipse((ox-20,oy-20,ox+20,oy+20),outline=YELLOW,width=5)
            d.ellipse((ox-6,oy-6,ox+6,oy+6),fill=YELLOW)
            d.text((978,252),'REAL-WORLD',font=SMALL,fill=YELLOW)
            d.text((997,282),'OUTCOME',font=SMALL,fill=YELLOW)
            d.text((60,532),'KNOWING ≠ DOING',font=LABEL,fill=CREAM)
            d.line((60,565,301,565),fill=YELLOW,width=6)
    d.line((60,605,1140,605),fill=SAGE,width=3)
    for k,lab in enumerate(['LEARN','PUSH','AI ARRIVES','DIRECT']):
        d.text((68+k*260,615),lab,font=TINY,fill=CREAM if idx==k else SAGE)
    d.line((60,605,60+1080*min(1,t/10.3),605),fill=CORAL,width=6)
    d.text((740,651),'Conceptual illustration, not a measure of model knowledge.',
           font=TINY,fill=SAGE)
    return im.convert('RGB')

fps=8;duration=10.3
frames=[frame(i/fps) for i in range(round(fps*duration)+1)]
palette=frames[-1].quantize(colors=90,method=Image.Quantize.FASTOCTREE)
indexed=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
# Omit GIF loop extension: animation plays once on supported viewers/slides.
indexed[0].save(OUT,save_all=True,append_images=indexed[1:],
                duration=round(1000/fps),optimize=True,disposal=2)
check=Image.open(OUT)
assert check.n_frames>50 and check.size==(W,H)
print(f'PASS {OUT} {check.n_frames} frames {OUT.stat().st_size} bytes')
