import cv2, numpy as np, json
O="orig"
def fr(f): return cv2.imread(f"{O}/f{f:03d}.png")
def clean_ui(im, white_bg_cursor=True):
    m=np.zeros(im.shape[:2],np.uint8)
    cv2.rectangle(m,(1570,105),(1620,165),255,-1)        # cursor
    cv2.circle(m,(36,1040),38,255,-1)                       # bottom-left badge
    cv2.circle(m,(1872,1032),38,255,-1)                     # bottom-right badge
    return m
def leafmask(im):
    hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV).astype(int)
    g=(hsv[...,0]>28)&(hsv[...,0]<95)&(hsv[...,1]>18)&(hsv[...,2]>50)
    return g.astype(np.uint8)*255
# ---- dune still + blow-away frames
for f in [43]+list(range(46,59)):
    im=fr(f); m=clean_ui(im)
    if f>=46:
        hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV).astype(int)
        bgr=im.astype(int); gr=bgr[...,1]-bgr[...,2]
        bgm=cv2.medianBlur(im,31).astype(int); grb=bgm[...,1]-bgm[...,2]
        mn=bgr.min(2)
        loc=((((gr-grb)>3)&(mn<215)&(grb<-15)).astype(np.uint8))*255
        loc=cv2.morphologyEx(loc,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
        nn,ll,ss,_=cv2.connectedComponentsWithStats(loc)
        for j in range(1,nn):
            if ss[j][4]<60: loc[ll==j]=0
        lm=(((hsv[...,0]>27)&(hsv[...,0]<95)&(hsv[...,1]>16))|((gr>=2)&(mn<252))).astype(np.uint8)*255
        lm=cv2.morphologyEx(lm,cv2.MORPH_OPEN,np.ones((2,2),np.uint8)); lm=np.maximum(lm,loc)
        if f<=54:
            ref=fr(43).astype(float); sandm=ref.min(2)<200
            ratio=(255-bgr[...,0][sandm])/np.maximum(1,255-ref[...,0][sandm]); aa=float(np.median(ratio))
            pred=aa*ref+(1-aa)*255
            dg=(bgr[...,1]-bgr[...,2])-(pred[...,1]-pred[...,2])
            dev=((dg>5)&sandm&(bgr.min(2)<235)).astype(np.uint8)*255
            dev=cv2.morphologyEx(dev,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
            nn,ll,ss,_=cv2.connectedComponentsWithStats(dev)
            for j in range(1,nn):
                if ss[j][4]<40: dev[ll==j]=0
            lm=np.maximum(lm,dev)
        m=np.maximum(m,cv2.dilate(lm,np.ones((13,13),np.uint8)))
    out=cv2.inpaint(im,m,9,cv2.INPAINT_TELEA)
    cv2.imwrite(f"assets/dune/f{f:03d}.jpg",out,[cv2.IMWRITE_JPEG_QUALITY,93])
# ---- original O ring keyframes (for excluding ring greens in leaf detection)
ringk=[(3.10,1260,516,170),(3.208,1260,516,180),(3.292,1230,516,210),(3.375,1170,519,240),(3.458,1140,528,255),(3.542,1080,519,285),
       (3.625,1035,540,315),(3.708,1005,540,340),(3.792,990,545,365),(3.875,970,545,395),(4.0,958,548,435),(4.167,950,550,465),(4.333,948,550,480),(4.625,948,548,492)]
def ring_at(t):
    if t<ringk[0][0]: return None
    for a,b in zip(ringk,ringk[1:]):
        if a[0]<=t<=b[0]:
            u=(t-a[0])/(b[0]-a[0]); return tuple(a[i]+(b[i]-a[i])*u for i in (1,2,3))
    return ringk[-1][1:]
leaves={}
for f in range(46,113):
    t=(f-1)/24; im=fr(f); g=leafmask(im)
    gr=im[...,1].astype(int)-im[...,2].astype(int)
    if f<=68:
        bgm=cv2.medianBlur(im,31).astype(int); grb=bgm[...,1]-bgm[...,2]
        g=np.maximum(g,((gr>3)|((gr-grb)>6)).astype(np.uint8)*255)
    g[clean_ui(im)>0]=0
    r=ring_at(t)
    if r: cv2.circle(g,(int(r[0]),int(r[1])),int(r[2]+14),0,-1)
    if t>=3.45: g[690:1000,150:540]=0
    g=cv2.morphologyEx(g,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV)
    n,lab,st,cen=cv2.connectedComponentsWithStats(g)
    L=[]
    for i in range(1,n):
        x,y,w,h,a=st[i]
        if a<45: continue
        if r and np.hypot(cen[i][0]-r[0],cen[i][1]-r[1])<r[2]+75 and a>900: continue
        ys,xs=np.where(lab==i); pts=np.c_[xs,ys].astype(np.float32)
        ang=cv2.minAreaRect(pts)[2] if a>=5 else 0
        sat=float(np.mean(hsv[...,1][lab==i]))
        grm=float(np.mean(gr[lab==i]))
        op=min(1,max(.12,(sat-15)/110)) if f>68 else min(1,max(.15,grm/45))
        L.append([round(float(cen[i][0]),1),round(float(cen[i][1]),1),round(float(np.sqrt(a)),1),round(float(ang),1),round(op,2)])
    leaves[f]=L
json.dump(leaves,open("assets/leaves.json","w"))
print("leaves per frame",[len(leaves[f]) for f in range(46,113)])
# ---- sand path per frame
paths={}
for f in range(62,113):
    im=fr(f); hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV).astype(int)
    s=(hsv[...,0]>=6)&(hsv[...,0]<=28)&(hsv[...,1]>=9)&(hsv[...,1]<=135)&(hsv[...,2]>150)
    s=s.astype(np.uint8)*255
    ui=clean_ui(im)>0
    for (cx,cy) in [(36,1040),(1872,1032)]:
        ann=np.zeros(s.shape,np.uint8); cv2.circle(ann,(cx,cy),60,255,-1); cv2.circle(ann,(cx,cy),40,0,-1)
        frac=(s[ann>0]>0).mean() if (ann>0).any() else 0
        circ=np.zeros(s.shape,np.uint8); cv2.circle(circ,(cx,cy),41,255,-1)
        if frac>0.3: s[circ>0]=255
    s=cv2.morphologyEx(s,cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
    P=40; s=cv2.copyMakeBorder(s,P,P,P,P,cv2.BORDER_REPLICATE); s=cv2.morphologyEx(s,cv2.MORPH_CLOSE,np.ones((31,31),np.uint8)); s=s[P:-P,P:-P]
    n,lab,st,_=cv2.connectedComponentsWithStats(s)
    keep=np.zeros_like(s)
    for i in range(1,n):
        if st[i][4]>6000: keep[lab==i]=255
    # fill holes
    cnts,_=cv2.findContours(keep,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    filled=np.zeros_like(keep); cv2.drawContours(filled,cnts,-1,255,-1)
    sat=np.median(hsv[...,1][filled>0]) if filled.any() else 0
    d=""
    for c in cnts:
        c=cv2.approxPolyDP(c,2.0,True).reshape(-1,2)
        if len(c)<3: continue
        c=c.copy(); c[c[:,0]<=1,0]=-20; c[c[:,0]>=1918,0]=1940; c[c[:,1]<=1,1]=-20; c[c[:,1]>=1078,1]=1100
        d+="M"+" L".join(f"{x} {y}" for x,y in c)+"Z"
    paths[f]={"d":d,"op":round(float(min(1,sat/75)),2)}
json.dump(paths,open("assets/paths.json","w"))
print("path opacity",[paths[f]["op"] for f in range(62,113)])
# ---- bird sprite + positions
pos={}
for f in range(98,113):
    im=fr(f); hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV).astype(int)
    reg=np.zeros(im.shape[:2],bool); reg[380:700,1500:1920]=True
    b=reg&(hsv[...,1]<70)&(hsv[...,2]<215)&(hsv[...,2]>90)
    b=cv2.morphologyEx(b.astype(np.uint8),cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    n,lab,st,cen=cv2.connectedComponentsWithStats(b)
    if n>1:
        i=1+np.argmax(st[1:,4]);
        if st[i][4]>60: pos[f]=[float(cen[i][0]),float(cen[i][1]),int(st[i][4])]
print("bird",pos)
json.dump(pos,open("assets/bird.json","w"))
im=fr(112); hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV).astype(int)
if 112 in pos:
    cx,cy,_=pos[112]; x0,y0=int(cx-60),int(cy-45); crop=im[y0:y0+90,x0:x0+120].astype(float)
    sky=np.median(np.r_[crop[0],crop[-1],crop[:,0],crop[:,-1]],axis=0)
    dist=np.linalg.norm(crop-sky,axis=2); a=np.clip((dist-14)/45,0,1)
    col=np.clip((crop-(1-a[...,None])*sky)/np.maximum(a[...,None],1e-3),0,255)
    cv2.imwrite("assets/bird.png",np.dstack([col.astype(np.uint8),(a*255).astype(np.uint8)]))
