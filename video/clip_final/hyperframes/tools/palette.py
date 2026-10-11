import cv2,numpy as np
def hx(s): return np.array([int(s[i:i+2],16) for i in (1,3,5)],float)  # RGB
def ramp(L, cols):
    # L in 0..1 -> interpolate through cols (RGB) sorted dark->light
    cols=np.array([hx(c) for c in cols]); k=len(cols)-1
    p=np.clip(L,0,1)*k; i=np.clip(np.floor(p).astype(int),0,k-1); t=(p-i)[...,None]
    return cols[i]*(1-t)+cols[i+1]*t
im=cv2.imread("assets/letrao.png",cv2.IMREAD_UNCHANGED)
rgb=im[...,:3][...,::-1].astype(float); a=im[...,3]
hsv=cv2.cvtColor(im[...,:3],cv2.COLOR_BGR2HSV).astype(float); H,S,V=hsv[...,0],hsv[...,1],hsv[...,2]
lum=cv2.cvtColor(im[...,:3],cv2.COLOR_BGR2LAB)[...,0].astype(float)/255
out=rgb.copy()
def apply(mask,cols,lo,hi,mix=1.0):
    Ln=(lum-lo)/max(hi-lo,1e-3); tgt=ramp(Ln,cols)
    w=cv2.GaussianBlur(mask.astype(np.float32),(5,5),0)[...,None]*mix
    global out; out=out*(1-w)+tgt*w
green=(H>=30)&(H<=90)&(S>45)&(V>40)&(a>250)
green=cv2.morphologyEx(green.astype(np.uint8),cv2.MORPH_OPEN,np.ones((5,5),np.uint8))>0   # solid areas only, no 1-2 px rims
apply(green,["#003e22","#004f30","#00633a","#00712b","#037a2c","#04a316","#2fb900"],0.18,0.72)
sky=(H>=92)&(H<=112)&(S>55)&(V>150)
apply(sky,["#3ab6e8","#3ab8e8","#46c6f0","#79c6ee","#9fd6f1"],0.55,0.9)
sun=(H>=8)&(H<=24)&(S>120)&(V>200); box=np.zeros_like(sun); box[270:530,1150:1580]=True; sun&=box; sun=(cv2.dilate(sun.astype(np.uint8),np.ones((7,7),np.uint8))>0)&box&(S>60)
apply(sun,["#d97f12","#d97f12"],0,1)
pathc=np.linalg.norm(rgb-np.array([233,214,178]),axis=2)<30
apply(pathc,["#ecdbbd","#f8d297","#fae8d2"],0.78,0.96,0.85)
cloudsh=(S<40)&(V>200)&(H>=90)&(H<=115)
apply(cloudsh,["#acdcf3","#c5e6f8","#e8f4f9"],0.75,0.98,0.7)
res=np.dstack([np.clip(out,0,255)[...,::-1].astype(np.uint8),a])
cv2.imwrite("assets/letrao_pal.png",res)
prev=np.hstack([cv2.resize(im[...,:3],(550,530)),cv2.resize(res[...,:3],(550,530))]); cv2.imwrite("_pal.jpg",prev)
