#!/usr/bin/env python3
"""Process generated sprite art into transparent PNGs for TREETOP.

Two routes:
- Magenta-keyed subjects (sprout, fruit): border flood fill with
  tolerance, edge feather, magenta despill via un-compositing.
- Black-background glows (orb, wisp): alpha derived from luminance,
  which composites like a glow over any background.
Output sizes stay <= 512 px on the long edge; palette quantization
keeps the embedded weight low.
"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, "..", "sprites-final")
os.makedirs(OUT, exist_ok=True)


def key_colour(img):
    """Median colour of the four corner patches (the flat backdrop)."""
    a = np.asarray(img).astype(np.int32)
    h, w, _ = a.shape
    patches = [a[:24, :24], a[:24, -24:], a[-24:, :24], a[-24:, -24:]]
    med = np.median(np.concatenate([p.reshape(-1, 3) for p in patches]), axis=0)
    return med


def flood_background(img, key, thresh=64):
    """Flood fill from the whole border; returns a boolean bg mask."""
    work = img.copy()
    sentinel = (0, 254, 1)  # a colour the art never uses
    h, w = img.size[1], img.size[0]
    seeds = []
    for x in range(0, w, 32):
        seeds += [(x, 0), (x, h - 1)]
    for y in range(0, h, 32):
        seeds += [(0, y), (w - 1, y)]
    for s in seeds:
        ImageDraw.floodfill(work, s, sentinel, thresh=thresh)
    arr = np.asarray(work)
    return np.all(arr == np.array(sentinel), axis=2)


def keyed_sprite(path, out_name, max_edge):
    img = Image.open(path).convert("RGB")
    key = key_colour(img)
    bg = flood_background(img, key)
    print(f"{out_name}: key={key} bg covers {bg.mean() * 100:.1f}%")
    rgb = np.asarray(img).astype(np.float32)
    dist = np.sqrt(((rgb - key) ** 2).sum(axis=2))
    # pixels that ARE the key colour are background even when the flood
    # could not reach them (enclosed pockets, e.g. between stem and leaf)
    bg = bg | (dist < 30.0)
    # alpha: 0 in the background, ramping up with colour distance so
    # watercolour edge bleed feathers instead of fringing
    alpha = np.where(bg, 0.0, np.clip((dist - 26.0) / 90.0, 0.0, 1.0))
    alpha[~bg] = np.maximum(alpha[~bg], 0.92)  # interior stays solid
    a_img = Image.fromarray((alpha * 255).astype(np.uint8), "L")
    a_img = a_img.filter(ImageFilter.GaussianBlur(1.1))  # slight feather
    alpha = np.asarray(a_img).astype(np.float32) / 255.0
    alpha[bg & (alpha < 0.5)] = 0.0
    # magenta purge before despill: no subject colour is magenta, so
    # any surviving magenta cast fades out instead of showing pink
    mag = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]
    purge = np.clip(1.0 - (mag - 40.0) / 110.0, 0.0, 1.0)
    alpha = alpha * np.where(mag > 40.0, purge, 1.0)
    # despill last, with the final alpha: undo the magenta composite
    # on translucent edge pixels so their stored colour is plausible
    a = np.clip(alpha, 0.0, 1.0)[..., None]
    fixed = np.where(
        a < 0.985,
        np.clip((rgb - key * (1.0 - a)) / np.maximum(a, 0.08), 0, 255),
        rgb,
    )
    out = np.dstack([fixed, alpha * 255.0]).astype(np.uint8)
    im = Image.fromarray(out, "RGBA")
    bbox = im.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
    if bbox:
        pad = 10
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(im.width, bbox[2] + pad),
            min(im.height, bbox[3] + pad),
        )
        im = im.crop(bbox)
    im.thumbnail((max_edge, max_edge), Image.LANCZOS)
    save_quantized(im, out_name)
    return im


def glow_sprite(path, out_name, max_edge, lift=16):
    img = Image.open(path).convert("RGB")
    rgb = np.asarray(img).astype(np.float32)
    lum = rgb.max(axis=2)
    alpha = np.clip((lum - lift) / (255.0 - lift), 0.0, 1.0)
    alpha = np.power(alpha, 1.12)
    out = np.dstack([rgb, alpha * 255.0]).astype(np.uint8)
    im = Image.fromarray(out, "RGBA")
    im.thumbnail((max_edge, max_edge), Image.LANCZOS)
    save_quantized(im, out_name)
    return im


def save_quantized(im, out_name):
    path = os.path.join(OUT, out_name)
    # PNG-8 with full alpha via fast octree; far smaller than RGBA PNG
    # and still a plain PNG for the data URI.
    q = im.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.FLOYDSTEINBERG)
    q.save(path, optimize=True)
    print(f"  -> {out_name}: {im.size[0]}x{im.size[1]}, {os.path.getsize(path)} bytes")


def main():
    names = {
        "sprout": "media-generation-spr-sprout-0-bf74e19b-2f2c-4327-a8d5-dc800fd2d0ab.png",
        "orb": "media-generation-spr-orb-0-bb05e89c-63b1-4275-b5ac-6013e162d6cb.png",
        "wisp": "media-generation-spr-wisp-0-6d429966-4e18-4474-9810-7d6d4ffd95d7.png",
        "fruit": "media-generation-spr-fruit-0-9b480fce-b5ec-4f5f-adea-7472fedb6d0e.png",
    }
    keyed_sprite(os.path.join(SRC, names["sprout"]), "sprout.png", 160)
    keyed_sprite(os.path.join(SRC, names["fruit"]), "fruit.png", 128)
    glow_sprite(os.path.join(SRC, names["orb"]), "orb.png", 160)
    glow_sprite(os.path.join(SRC, names["wisp"]), "wisp.png", 160)


if __name__ == "__main__":
    sys.exit(main())
