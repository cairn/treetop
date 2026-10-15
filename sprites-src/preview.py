#!/usr/bin/env python3
"""Composite the processed sprites over game-like backgrounds at
gameplay sizes (and 2x) so edges and readability can be inspected."""
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FIN = os.path.join(HERE, "..", "sprites-final")

BGS = {
    "forest": (46, 74, 44),      # near-canopy green
    "sky": (196, 222, 204),      # pale mid sky
    "crown": (238, 200, 120),    # gilded Crown light
}
SPRITES = [  # name, gameplay draw size (px, long edge)
    ("sprout", 46),
    ("orb", 60),
    ("wisp", 62),
    ("fruit", 48),
]


def sheet(scale, fname):
    cell = 150 * scale // 2
    W = cell * len(BGS)
    H = cell * len(SPRITES)
    out = Image.new("RGB", (W, H), (20, 20, 20))
    for r, (name, size) in enumerate(SPRITES):
        im = Image.open(os.path.join(FIN, name + ".png")).convert("RGBA")
        im.thumbnail((size * scale, size * scale), Image.LANCZOS)
        for c, bg in enumerate(BGS.values()):
            cell_im = Image.new("RGB", (cell, cell), bg)
            cell_im.paste(im, ((cell - im.width) // 2, (cell - im.height) // 2), im)
            out.paste(cell_im, (c * cell, r * cell))
    out.save(os.path.join(HERE, fname))
    print(fname, out.size)


sheet(2, "preview-2x.png")   # 2x gameplay size: edge inspection
sheet(1, "preview-1x.png")   # true gameplay size: readability
