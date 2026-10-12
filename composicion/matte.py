# Reads rgb24 frames on stdin, writes rgba frames on stdout.
# Background = near-white pixels CONNECTED to the frame border (flood fill),
# so white regions enclosed by the figure (hair, collar, cuffs) are never keyed.
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
W, H = int(sys.argv[1]), int(sys.argv[2])
HARD = 14   # whiteness deficit below this = candidate background
LO, HI = 6, 40  # soft-edge ramp in the boundary band
n = W*H*3
while True:
    b = sys.stdin.buffer.read(n)
    if len(b) < n: break
    rgb = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.float32)
    d = (255 - rgb).max(axis=2)
    cand = Image.fromarray(np.where(d < HARD, 255, 0).astype(np.uint8))
    # pad with a background border so a single seed reaches the whole outside
    pad = Image.new('L', (W+2, H+2), 255); pad.paste(cand, (1, 1))
    ImageDraw.floodfill(pad, (0, 0), 128)
    # enclosed background holes (e.g. between walker bars and arms): pure-white
    # regions at least 5px thick; thin/small white details stay opaque
    inner = Image.fromarray(np.where(np.asarray(pad)[1:-1, 1:-1] == 255, 255, 0).astype(np.uint8))
    core = np.asarray(inner.filter(ImageFilter.MinFilter(5)))
    ys, xs = np.nonzero(core)
    arr = np.asarray(pad)
    for y, x in zip(ys, xs):
        if arr[y+1, x+1] == 255:
            ImageDraw.floodfill(pad, (int(x)+1, int(y)+1), 128)
            arr = np.asarray(pad)
    bg = (arr[1:-1, 1:-1] == 128)
    # band = pixels near the background: only there do we apply a soft ramp
    bgimg = Image.fromarray((bg*255).astype(np.uint8))
    band = np.asarray(bgimg.filter(ImageFilter.MaxFilter(5))) > 0
    a = np.ones((H, W), np.float32)
    # alpha of a mixed edge pixel = its whiteness deficit relative to the
    # deficit of the nearby solid colour (local max), not an absolute ramp
    dmax = np.asarray(Image.fromarray(d.astype(np.uint8)).filter(ImageFilter.MaxFilter(5))).astype(np.float32)
    ramp = np.clip((d - LO) / np.maximum(dmax - LO, HI), 0, 1)
    a[band] = ramp[band]
    a[bg] = 0
    # remove white fringe: un-mix the white background from edge colours
    am = np.maximum(a, 1e-3)[..., None]
    col = np.clip((rgb - (1 - a[..., None]) * 255) / am, 0, 255)
    col = np.where(a[..., None] > 0.999, rgb, col)
    out = np.dstack([col, a*255]).round().astype(np.uint8)
    sys.stdout.buffer.write(out.tobytes())
