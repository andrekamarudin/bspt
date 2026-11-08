#!/usr/bin/env python3
"""Build the one-shot BSPT left/right knowledge-frontier explainer.

The concentric circles are conceptual and do not represent measured AI knowledge.
The animation's final frame holds for seven seconds to allow presenter narration.
"""
from __future__ import annotations
from pathlib import Path
from io import BytesIO
import math
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'motion' / 'human-value-knowledge-frontier.gif'
OUT.parent.mkdir(parents=True, exist_ok=True)
W, H = 1280, 720
FOREST = '#082E24'; DEEP = '#051C17'; ORANGE = '#FF6433'
CREAM = '#F7F2E8'; YELLOW = '#FFD65A'; SAGE = '#8DAB99'; STONE = '#E8DED0'; INK = '#17372C'


def font(n: int, *, serif=False, bold=False, note=False):
    files = (["/usr/share/fonts/truetype/msttcorefonts/Georgia.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"] if serif else
             ["/usr/share/fonts/truetype/lato/Lato-Italic.ttf"] if note else
             [f"/usr/share/fonts/opentype/inter/Inter-{'Bold' if bold else 'Regular'}.otf",
              f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if bold else ''}.ttf"])
    for path in files:
        if Path(path).exists():
            return ImageFont.truetype(path, n)
    return ImageFont.load_default()

F_TITLE = font(47, serif=True)
F_PANEL = font(35, serif=True)
F_CAP = font(19, bold=True)
F_TEXT = font(24)
F_SMALL = font(17)
F_VALUE = font(27, bold=True)
F_FINAL = font(34, serif=True)
F_NOTE = font(23, note=True)


def ease(t):
    t = max(0.0, min(1.0, t))
    return t*t*(3.0-2.0*t)


def source_svg(relpath: str, width: int, height: int):
    """No synthetic replacement of canonical source assets."""
    source = ROOT / relpath
    if not source.exists():
        return None  # source layout QA can run without repo assets
    import cairosvg
    png = cairosvg.svg2png(url=str(source), output_width=width, output_height=height)
    return Image.open(BytesIO(png)).convert('RGBA')


def paste_svg(im, svg_image, xy):
    if svg_image is not None:
        im.paste(svg_image, xy, svg_image)


LOGO = source_svg('logos/brush-slash.svg', 115, 75)
CLIP = source_svg('motifs/paperclip.svg', 31, 45)
SWASH = source_svg('motifs/marker-swash.svg', 439, 34)


def line_arrow(d, origin, tip, color=ORANGE, width=8):
    x0, y0 = origin; x1, y1 = tip
    d.line((x0,y0,x1,y1), fill=color, width=width, joint='curve')
    theta = math.atan2(y1-y0,x1-x0)
    a = 21
    d.polygon([(x1,y1),
               (x1-a*math.cos(theta-.47), y1-a*math.sin(theta-.47)),
               (x1-a*math.cos(theta+.47), y1-a*math.sin(theta+.47))], fill=color)


def ring(d, cx, cy, radius, color, width=4):
    d.ellipse((cx-radius,cy-radius,cx+radius,cy+radius), outline=color, width=width)


def frame(t):
    im = Image.new('RGB', (W,H), FOREST)
    d = ImageDraw.Draw(im)
    d.text((49,25), 'WHEN KNOWLEDGE STOPS BEING THE EDGE', font=F_TITLE, fill=CREAM)
    d.text((51,88), 'One frontier, two eras. The outer ring is the reference boundary.', font=F_SMALL, fill=STONE)
    paste_svg(im, LOGO, (1108,10))

    # Cream working paper on the left; deliberately darker, unadorned AI stage on the right.
    d.rounded_rectangle((40,124,624,578), radius=10, fill=CREAM)
    d.rounded_rectangle((656,124,1240,578), radius=10, fill=DEEP, outline=SAGE, width=2)
    d.text((75,146), 'BEFORE AI', font=F_CAP, fill=INK)
    d.text((692,146), 'AFTER AI', font=F_CAP, fill=CREAM)
    d.text((75,184), 'Learn. Specialize. Push.', font=F_PANEL, fill=INK)
    d.text((692,184), 'AI covers the map.', font=F_PANEL, fill=CREAM)

    # The paperclip is used only on the actual paper surface.
    paste_svg(im, CLIP, (557,115))
    d = ImageDraw.Draw(im)
    lc,rc,cy,R = 313,953,371,129
    ring(d,lc,cy,R,INK,4);ring(d,rc,cy,R,CREAM,4)
    # Directional perimeter guide marks distinguish the common reference frontier.
    for x,fg in [(lc,INK),(rc,CREAM)]:
        d.line((x-12,cy-R-11,x+12,cy-R-11),fill=fg,width=2)
        d.line((x-12,cy+R+11,x+12,cy+R+11),fill=fg,width=2)

    # Left: compressed learning period followed by forty years of one-dimensional frontier push.
    r=4+32*ease((t-.55)/2.4)
    d.ellipse((lc-r,cy-r,lc+r,cy+r),fill=ORANGE)
    if t < 3.2:
        d.text((88,515),'0–20 YEARS   Build your foundation',font=F_TEXT,fill=INK)
    else:
        p=ease((t-3.15)/2.45)
        if p>0:
            start=lc+r-3
            end=start+157*p
            d.rounded_rectangle((start,cy-15,end,cy+15),radius=8,fill=ORANGE)
            if end>lc+R:
                d.arc((lc+R-7,cy-34,lc+R+11,cy+34),270,90,fill=ORANGE,width=4)
        d.text((88,515),'20–60 YEARS   Push one narrow edge',font=F_TEXT,fill=INK)
        if t>=5.05:
            # Precise callout: thin line ends at the far end of the specialized rectangle.
            d.text((411,288),'one direction',font=F_NOTE,fill=INK)
            d.line((475,319,479,341),fill=INK,width=2)

    # Right: near-frontier AI knowledge, then a symbolic widening, not a literal capability measurement.
    if t >= 4.75:
        reveal=ease((t-4.75)/1.15)
        outer=116+33*ease((t-5.8)/2.35)
        over=Image.new('RGBA',(W,H),(0,0,0,0))
        o=ImageDraw.Draw(over)
        o.ellipse((rc-outer,cy-outer,rc+outer,cy+outer),
                  fill=(141,171,153,int(48*reveal)),
                  outline=(255,100,51,int(255*reveal)),width=9)
        im=Image.alpha_composite(im.convert('RGBA'),over).convert('RGB')
        d=ImageDraw.Draw(im)
        if t < 7.65:
            d.text((697,515),'Starts near the frontier; then broadens',font=F_TEXT,fill=CREAM)
        else:
            d.text((697,515),'Human: direct capability to outcomes',font=F_TEXT,fill=CREAM)
    else:
        d.text((697,515),'AI starts with broad learned knowledge',font=F_TEXT,fill=CREAM)

    # Real agency: a human-directed goal. The arrow lands on its visible target.
    if t>=7.65:
        d=ImageDraw.Draw(im)
        p=ease((t-7.73)/1.52)
        d.ellipse((rc-12,cy-12,rc+12,cy+12),fill=YELLOW)
        ox,oy=1140,353
        if p>0.02:
            line_arrow(d,(rc+17,cy),(rc+17+(ox-rc-17)*p, cy+(oy-cy)*p),color=YELLOW,width=8)
        if t>=9.25:
            ring(d,1147,353,24,YELLOW,5)
            d.ellipse((1139,345,1155,361),fill=YELLOW)
            d.text((1092,394),'OUTCOME',font=F_CAP,fill=CREAM)

    # Permanent comparison cue, then the deliberate editorial conclusion with one semantic swash.
    d=ImageDraw.Draw(im)
    d.line((40,589,1240,589),fill=SAGE,width=2)
    d.text((63,609),'OLD EDGE',font=F_CAP,fill=STONE)
    d.text((660,609),'NEW EDGE',font=F_CAP,fill=STONE)
    if t>=9.65:
        d.rounded_rectangle((40,598,1240,703),radius=8,fill=CREAM)
        d.text((70,604),'Knowledge becomes abundant.',font=F_FINAL,fill=INK)
        paste_svg(im, SWASH, (67,648))
        d=ImageDraw.Draw(im)
        d.text((75,652),'Human edge: choose goals. Align people. Own outcomes.',
               font=F_VALUE,fill=INK)
    else:
        d.text((171,612),'WHAT YOU KNOW',font=F_VALUE,fill=CREAM)
        d.text((787,612),'WHAT YOU MAKE HAPPEN',font=F_VALUE,fill=CREAM)
        d.text((50,672),'Conceptual metaphor: circle areas are not measured knowledge.',font=F_SMALL,fill=SAGE)

    return im


def build():
    # 10-second motion sequence. Last image holds for seven seconds.
    fps=9
    ts=[i/fps for i in range(87)] + [9.8]
    rgb=[frame(t) for t in ts]
    # Palette anchored to the final frame keeps small text consistent.
    palette=rgb[-1].quantize(colors=180,method=Image.Quantize.FASTOCTREE)
    indexed=[fr.quantize(palette=palette,dither=Image.Dither.NONE) for fr in rgb]
    intervals=[round(1000/fps)]*(len(indexed)-1)+[7000]
    indexed[0].save(OUT,save_all=True,append_images=indexed[1:],duration=intervals,
                    optimize=True,disposal=2)
    check=Image.open(OUT)
    assert check.n_frames >= 70 and check.size==(W,H)
    # Preview and contact sheet remain local; CI commits only GIF.
    if os.getenv('BSPT_MOTION_PREVIEW'):
        preview=OUT.parent / 'frontier-review'
        preview.mkdir(exist_ok=True)
        indices=[0,15,29,42,55,71,82,len(rgb)-1]
        for i in indices:rgb[i].save(preview / f'frame-{i:03d}.png')
        sheet=Image.new('RGB',(W*2,H*4),CREAM)
        for j,i in enumerate(indices):sheet.paste(rgb[i],((j%2)*W,(j//2)*H))
        sheet.resize((1280,1440),Image.Resampling.LANCZOS).save(preview/'contact.png')
    print(f'PASS {OUT} {check.n_frames} frames {OUT.stat().st_size} bytes, final hold 7 seconds')


if __name__=='__main__':build()
