import cv2,glob,re,numpy as np,sys
snap=sys.argv[1]; out=sys.argv[2]
files=sorted(glob.glob(f"{snap}/frame-*.png"))
rows=[]
for fn in files:
    t=float(re.search(r"at-([\d.]+)s",fn).group(1)); f=min(112,int(round(t*24))+1)
    a=cv2.resize(cv2.imread(f"orig/f{f:03d}.png"),(640,360)); b=cv2.resize(cv2.imread(fn),(640,360))
    bar=np.full((22,1290,3),30,np.uint8); cv2.putText(bar,f"t={t:.3f}  ORIGINAL (izq) | NUEVO (der)",(6,16),0,.5,(255,255,255),1)
    rows.append(np.vstack([bar,np.hstack([a,np.full((360,10,3),30,np.uint8),b])]))
for k in range(0,len(rows),4):
    cv2.imwrite(f"{out}-{k//4+1}.jpg",np.vstack(rows[k:k+4]),[cv2.IMWRITE_JPEG_QUALITY,82])
print(len(rows))
