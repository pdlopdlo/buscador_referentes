# Whiten the mockup's dotted canvas: small grey specks -> white, near-white -> 255.
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
for p in sys.argv[1:]:
    a = np.asarray(Image.open(p).convert('RGB')).astype(int)
    mn, mx = a.min(2), a.max(2)
    grey = (mx - mn < 14) & (mn < 247)
    lab, k = ndi.label(grey)
    area = np.bincount(lab.ravel())
    small = (area < 60); small[0] = False
    out = a.copy()
    out[small[lab]] = 255
    out[(out.min(2) >= 247)] = 255
    Image.fromarray(out.astype(np.uint8)).save(p.replace('.png', '_c.png'))
