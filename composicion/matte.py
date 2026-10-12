# Reads rgb24 frames on stdin, writes rgba frames on stdout.
# usage: matte.py W H [MIN_HOLE] [PROTECT_Y] [debug]
# Background = near-white regions touching the frame border, plus enclosed
# near-white regions of at least MIN_HOLE px (e.g. gaps inside the walker).
# Smaller enclosed whites stay opaque, and enclosed whites lying entirely
# above PROTECT_Y (head: hair, mustache) are never removed.
import sys, numpy as np
from scipy import ndimage as ndi
W, H = int(sys.argv[1]), int(sys.argv[2])
MIN_HOLE = int(sys.argv[3]) if len(sys.argv) > 3 else 400
PROTECT_Y = int(sys.argv[4]) if len(sys.argv) > 4 else 0
DEBUG = len(sys.argv) > 5
HARD = 14       # whiteness deficit below this = candidate background
LO, HI = 6, 40  # soft-edge parameters in the boundary band
n = W*H*3
while True:
    b = sys.stdin.buffer.read(n)
    if len(b) < n: break
    rgb = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.float32)
    d = (255 - rgb).max(axis=2)
    lab, k = ndi.label(d < HARD)
    area = np.bincount(lab.ravel(), minlength=k+1)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    keep = area >= MIN_HOLE
    if PROTECT_Y:
        bottoms = ndi.maximum(np.indices((H, W))[0], lab, np.arange(k+1))
        keep &= np.asarray(bottoms) >= PROTECT_Y
    keep[border] = True
    keep[0] = False
    if DEBUG:
        sys.stderr.write(" ".join(f"{a}" for a in sorted(area[1:]) if a > 30) + "\n")
    bg = keep[lab]
    band = ndi.maximum_filter(bg, size=5)
    # alpha of a mixed edge pixel = its whiteness deficit relative to the
    # deficit of the nearby solid colour (local max)
    dmax = ndi.maximum_filter(d, size=5)
    ramp = np.clip((d - LO) / np.maximum(dmax - LO, HI), 0, 1)
    a = np.ones((H, W), np.float32)
    a[band] = ramp[band]
    a[bg] = 0
    # remove white fringe: un-mix the white background from edge colours
    am = np.maximum(a, 1e-3)[..., None]
    col = np.clip((rgb - (1 - a[..., None]) * 255) / am, 0, 255)
    col = np.where(a[..., None] > 0.999, rgb, col)
    sys.stdout.buffer.write(np.dstack([col, a*255]).round().astype(np.uint8).tobytes())
