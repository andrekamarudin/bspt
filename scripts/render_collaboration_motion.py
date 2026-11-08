#!/usr/bin/env python3
"""BSPT: side-by-side, human-first collaboration with AI animation.

One-shot GIF: long readable pacing and an 11-second final hold.
Rebuild in the BSPT repo root: python scripts/render_collaboration_motion.py
The exact BSPT SVG and motifs are loaded, not regenerated.
"""
from __future__ import annotations

from io import BytesIO
from pathlib import Path
import math
import os

import cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'motion' / 'collaboration-with-ai.gif'
OUT.parent.mkdir(parents=True, exist_ok=True)
W, H = 1400, 788
COLORS = {
    'forest': '#082E24', 'deep': '#051C17', 'orange': '#FF6433',
    'cream': '#F7F2E8', 'yellow': '#FFD65A', 'stone': '#E8DED0',
    'sage': '#8DAB99', 'ink': '#17372C',
}
F, D, O, C, Y, S, I = [COLORS[k] for k in ('forest','deep','orange','cream','yellow','sage','ink')]


def font(px: int, *, serif: bool=False, bold: bool=False, note: bool=False):
    if serif:
        candidates = ['/usr/share/fonts/truetype/msttcorefonts/Georgia.ttf',
                      '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf']
    elif note:
        candidates = ['/usr/share/fonts/truetype/lato/Lato-Italic.ttf',
                      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf']
    else:
        candidates = [f'/usr/share/fonts/opentype/inter/Inter-{"Bold" if bold else "Regular"}.otf',
                      f'/usr/share/fonts/truetype/dejavu/DejaVuSans{"-Bold" if bold else ""}.ttf']
    for p in candidates:
        if Path(p).exists(): return ImageFont.truetype(p, px)
    raise RuntimeError('No supported font installed')

DISPLAY=font(43,serif=True); PANEL=font(33,serif=True); BODY=font(21); SMALL=font(17)
LABEL=font(19,bold=True); BADGE=font(16,bold=True); PAYOFF=font(30,serif=True)
NOTE=font(21,note=True); SUPER=font(15,bold=True)


def vector(rel: str, size: tuple[int,int], required: bool=True):
    path=ROOT/rel
    if not path.exists():
        if os.getenv('BSPT_PREVIEW_ALLOW_MISSING_SVG')=='1':
            return None
        if required: raise FileNotFoundError(f'Canonical BSPT source asset required: {path}')
        return None
    png=cairosvg.svg2png(url=str(path),output_width=size[0],output_height=size[1])
    return Image.open(BytesIO(png)).convert('RGBA')

LOGO=vector('logos/brush-slash.svg',(103,67))
CLIP=vector('motifs/paperclip.svg',(30,46))
SWASH=vector('motifs/marker-swash.svg',(630,37))


def paste(base, piece, pos):
    if piece is not None:base.paste(piece,pos,piece)


def ease(v):
    v=max(0.0,min(1.0,v))
    return v*v*(3-2*v)


def alpha_rgb(hexval, alpha):
    h=hexval.lstrip('#');return tuple(int(h[i:i+2],16) for i in (0,2,4))+(int(alpha),)


def draw_avatar(d, cx,cy, label, fill, dark=False, r=31):
    d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=fill)
    inner=D if dark else I
    b=d.textbbox((0,0),label,font=LABEL)
    d.text((cx-(b[2]-b[0])/2,cy-(b[3]-b[1])/2-3),label,font=LABEL,fill=inner)


def arrow(d,x1,y1,x2,y2,fill,width=4,head=10):
    d.line((x1,y1,x2,y2), fill=fill,width=width)
    a=math.atan2(y2-y1,x2-x1)
    d.polygon([(x2,y2),(x2-head*math.cos(a-.48),y2-head*math.sin(a-.48)),
               (x2-head*math.cos(a+.48),y2-head*math.sin(a+.48))],fill=fill)


def text_fit(d, box, value, preferred, color, bold=False):
    for size in range(preferred,13,-1):
        f=font(size,bold=bold)
        b=d.textbbox((0,0),value,font=f)
        if b[2]-b[0]<=box[2]-box[0] and b[3]-b[1]<=box[3]-box[1]:
            d.text((box[0],box[1]),value,font=f,fill=color);return
    raise RuntimeError(f'Text will not fit: {value}')


def draw(t: float):
    # Avoid changing the comparison layout across time; only reveal meaning.
    im=Image.new('RGB',(W,H),F);d=ImageDraw.Draw(im)
    d.text((56,24),'AI MAKES COLLABORATION FASTER',font=DISPLAY,fill=C)
    d.text((59,88),'Same project. Same colleagues. Less waiting for routine answers.',font=BODY,fill='#E8DED0')
    paste(im,LOGO,(1250,16))
    d=ImageDraw.Draw(im)
    # Authentically notebook-ish only where it carries the old workflow as a field note.
    d.rounded_rectangle((45,140,687,653),radius=9,fill=C)
    d.rounded_rectangle((713,140,1355,653),radius=9,fill=D,outline=S,width=2)
    # light perforations on the actual paper, not every card
    for x in range(76,649,23):d.ellipse((x-3,145,x+3,151),fill=F)
    paste(im,CLIP,(633,128))
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((78,175,217,211),radius=5,fill=O)
    d.text((95,180),'BEFORE AI',font=LABEL,fill=D)
    d.rounded_rectangle((745,175,876,211),radius=5,fill=S)
    d.text((766,180),'WITH AI',font=LABEL,fill=D)
    d.text((78,232),'Every question is a handoff.',font=PANEL,fill=I)
    d.text((746,232),'A first pass is always nearby.',font=PANEL,fill=C)

    # Lead is the same person in both halves; no robotic "AI replaces the team" framing.
    draw_avatar(d,143,432,'ME',O, r=43)
    d.text((90,485),'Project lead',font=BODY,fill=I)
    draw_avatar(d,809,432,'ME',O,r=43)
    d.text((753,485),'Project lead',font=BODY,fill=C)

    expert=[('DA','Data',321),('DE','Design',409),('LE','Legal',497),('OP','Ops',585)]
    for j,(initial,name,y) in enumerate(expert):
        p=ease((t-(4+j*3.3))/.95)
        if p<.001:continue
        overlay=Image.new('RGBA',(W,H),(0,0,0,0));od=ImageDraw.Draw(overlay)
        xx=487
        od.line((192,432,xx-38,y),fill=alpha_rgb(F,int(p*170)),width=3)
        od.ellipse((xx-30,y-30,xx+30,y+30),fill=alpha_rgb(S,int(p*245)))
        od.text((xx-14,y-12),initial,font=BADGE,fill=alpha_rgb(D,int(p*255)))
        od.text((537,y-17),name,font=LABEL,fill=alpha_rgb(I,int(p*255)))
        if t>=17:
            od.rounded_rectangle((542,y+13,652,y+38),radius=5,fill=alpha_rgb('#E6D3C4',int(p*255)))
            od.text((551,y+17),'2–3 days',font=SMALL,fill=alpha_rgb(I,int(p*255)))
        im=Image.alpha_composite(im.convert('RGBA'),overlay).convert('RGB')
    d=ImageDraw.Draw(im)
    if t>=17.7:
        d.rounded_rectangle((79,552,399,633),radius=4,fill='#E8DED0')
        d.text((93,558),'Even a routine question',font=NOTE,fill=I)
        d.text((93,590),'waits behind their main work.',font=NOTE,fill=I)

    # Right side: exact same lead, a laptop that contains a cross-domain first pass.
    if t>=21:
        p=ease((t-21)/1.3)
        # actual laptop on the table; orange accent is a status cue, not a fake logo
        overlay=Image.new('RGBA',(W,H),(0,0,0,0));o=ImageDraw.Draw(overlay)
        o.rounded_rectangle((887,383,1082,486),radius=8,
                            fill=alpha_rgb('#184F3D',int(255*p)),outline=alpha_rgb(S,int(255*p)),width=3)
        o.rounded_rectangle((904,397,1066,463),radius=4,
                            fill=alpha_rgb(Y,int(255*p)))
        o.text((945,414),'AI',font=font(29,bold=True),fill=alpha_rgb(I,int(255*p)))
        o.line((870,487,1101,487),fill=alpha_rgb(S,int(p*255)),width=7)
        im=Image.alpha_composite(im.convert('RGBA'),overlay).convert('RGB')
        d=ImageDraw.Draw(im)
        d.text((919,503),'Good-enough helper',font=SMALL,fill=C)

    tasks=[('Analysis',24.5),('Mockup',27),('First draft',29.5),('Checklist',32)]
    for j,(name,onset) in enumerate(tasks):
        p=ease((t-onset)/1.0)
        if p<.001:continue
        y=296+j*71
        overlay=Image.new('RGBA',(W,H),(0,0,0,0));od=ImageDraw.Draw(overlay)
        od.rounded_rectangle((1130,y,1326,y+52),radius=7,
                             fill=alpha_rgb('#183F34',int(p*255)),
                             outline=alpha_rgb(S,int(p*255)),width=2)
        od.ellipse((1144,y+15,1166,y+37),fill=alpha_rgb(Y,int(p*255)))
        od.text((1149,y+18),'✓',font=SMALL,fill=alpha_rgb(D,int(p*255)))
        od.text((1176,y+12),name,font=LABEL,fill=alpha_rgb(C,int(p*255)))
        im=Image.alpha_composite(im.convert('RGBA'),overlay).convert('RGB')

    d=ImageDraw.Draw(im)
    if t>=34.3:
        p=ease((t-34.3)/1.3)
        overlay=Image.new('RGBA',(W,H),(0,0,0,0));o=ImageDraw.Draw(overlay)
        o.line((923,577,1320,577),fill=alpha_rgb(S,int(p*190)),width=2)
        o.ellipse((930,587,974,631),fill=alpha_rgb(O,int(p*245)))
        o.text((939,594),'H',font=LABEL,fill=alpha_rgb(D,int(p*245)))
        o.text((985,584),'Human experts',font=LABEL,fill=alpha_rgb(C,int(p*255)))
        o.text((985,610),'For high-stakes / frontier decisions',font=SMALL,fill=alpha_rgb(C,int(p*255)))
        im=Image.alpha_composite(im.convert('RGBA'),overlay).convert('RGB')

    d=ImageDraw.Draw(im)
    # Brand annotation is an interpretation attached to the routine wait, never an arbitrary arrow.
    # Outro is held for 11 seconds, and remains readable as the static thumbnail.
    if t>=37.7:
        d.rounded_rectangle((47,665,1354,776),radius=8,fill=C)
        d.text((79,671),'AI does not replace collaboration.',font=PAYOFF,fill=I)
        paste(im,SWASH,(66,727))
        d=ImageDraw.Draw(im)
        d.text((78,725),'It removes the routine waiting between people.',font=font(29,bold=True),fill=I)
    else:
        d.line((45,665,1355,665),fill=S,width=2)
        d.text((86,685),'Routine asks queue behind priorities.',font=LABEL,fill=C)
        d.text((752,685),'Routine asks get an immediate first pass.',font=LABEL,fill=C)
        d.text((49,750),'Illustrative workflow. Real expert review remains essential where stakes require it.',font=SMALL,fill=S)
    return im


def main():
    # 8 fps feels smooth during reveals; the last frame sits completely still.
    fps=8
    times=[round(i/fps,5) for i in range(int(38*fps))]
    frames=[draw(t) for t in times]+[draw(38.1)]
    palette=frames[-1].quantize(colors=120,method=Image.Quantize.FASTOCTREE)
    pix=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
    durations=[125]*(len(pix)-1)+[11000]
    pix[0].save(OUT,save_all=True,append_images=pix[1:],duration=durations,
                disposal=2,optimize=True)
    check=Image.open(OUT)
    assert check.size==(W,H) and check.n_frames>40
    print(f'BUILT {OUT}: {check.n_frames} frames, {OUT.stat().st_size:,} bytes, 11s ending hold')
    if os.getenv('BSPT_MOTION_PREVIEW'):
        dest=ROOT/'motion'/'collaboration-review';dest.mkdir(exist_ok=True)
        select=[0,50,120,155,184,217,258,295,304]
        sheet=Image.new('RGB',(W*3,H*3),'#F7F2E8')
        for idx,n in enumerate(select):
            frm=frames[n]
            frm.save(dest/f'frame-{n:03d}.png')
            sheet.paste(frm,((idx%3)*W,(idx//3)*H))
        sheet.resize((1680,945)).save(dest/'contact.png')

if __name__=='__main__':main()
