import cv2,numpy as np
H=lambda s: np.array([int(s[i:i+2],16) for i in (5,3,1)],float)  # hex -> BGR
def mapc(img,mask,s10,s90,t10,t90):
    s10,s90,t10,t90=map(H,(s10,s90,t10,t90))
    sl=np.where(np.abs(s90-s10)>3,(t90-t10)/np.maximum(np.abs(s90-s10),1e-3)*np.sign(s90-s10),1.0)
    out=img.astype(float); px=out[mask]; out[mask]=np.clip(t10+(px-s10)*sl,0,255); return out.astype(np.uint8)
def flat(img,mask,src,dst,k=0.6):
    src,dst=H(src),H(dst); out=img.astype(float); out[mask]=np.clip(dst+(out[mask]-src)*k,0,255); return out.astype(np.uint8)
def load(n): s=cv2.imread(f"assets/{n}.png",cv2.IMREAD_UNCHANGED); return s
def save(n,s): cv2.imwrite(f"assets/{n}.png",s)
def hsv(s): return cv2.cvtColor(s[...,:3],cv2.COLOR_BGR2HSV).astype(int)
dil=lambda m: cv2.dilate(m.astype(np.uint8),np.ones((3,3),np.uint8))>0
# woman body
s=load("woman_body"); h=hsv(s); a=s[...,3]>0
sw=dil(a&(h[...,0]<=20)&(h[...,1]>60))&a&(h[...,1]>25)&~((h[...,0]>90)&(h[...,0]<140))
hair=dil(a&(h[...,0]>100)&(h[...,0]<140)&(h[...,2]<160))&a&(s[...,:3].min(2)<200)
rgb=mapc(s[...,:3],sw,"#da805d","#e79d69","#c64a1e","#dc6f2b"); rgb=flat(rgb,hair,"#565a77","#151a3c",0.5)
s[...,:3]=rgb; save("woman_body_c",s)
# back view (final scene): no face
b=s.copy(); m=np.zeros(a.shape,np.uint8); cv2.ellipse(m,(392,58),(26,32),-10,0,360,255,-1)
b[...,3][(m>0)&(b[...,:3].min(2)>200)]=0; save("woman_body_back_c",b)
for nm,src,dst in (("woman_back","#545976","#111738"),("woman_front","#677091","#2b3160"),("oldman_back","#697292","#2b3160"),("oldman_front","#565a78","#111738")):
    s=load(nm); a=s[...,3]>0; s[...,:3]=flat(s[...,:3],a,src,dst,0.5); save(nm+"_c",s)
s=load("oldman_body"); h=hsv(s); a=s[...,3]>0
bl=dil(a&(h[...,0]>=95)&(h[...,0]<=125)&(h[...,1]>60))&a&(s[...,:3].min(2)<235)
s[...,:3]=mapc(s[...,:3],bl,"#7193d8","#7aaae7","#335dc8","#386fdc"); save("oldman_body_c",s)
for nm in ("nurse_body","nurse_arm"):
    s=load(nm); h=cv2.cvtColor(s[...,:3],cv2.COLOR_BGR2HSV).astype(float); h[...,1]=np.clip(h[...,1]*1.15,0,255)
    s[...,:3]=cv2.cvtColor(h.astype(np.uint8),cv2.COLOR_HSV2BGR); save(nm+"_c",s)
# preview on sand
def comp(names,W,Hh):
    can=np.full((Hh,W,3),(150,200,236),np.uint8)
    for n in names:
        s=load(n); al=s[...,3:]/255.0; can[:s.shape[0],:s.shape[1]]=(s[...,:3]*al+can[:s.shape[0],:s.shape[1]]*(1-al)).astype(np.uint8)
    return can
a=comp(["woman_back_c","woman_front_c","woman_body_back_c"],600,560); b=comp(["oldman_back_c","oldman_front_c","oldman_body_c"],280,345)
c=np.full((560,900,3),(150,200,236),np.uint8); c[:,:600]=cv2.flip(a,1); c[:345,610:890]=cv2.flip(b,1); cv2.imwrite("_recol.jpg",c)
