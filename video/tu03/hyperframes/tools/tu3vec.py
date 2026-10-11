import cv2,numpy as np,json
fr=lambda f: cv2.imread(f"tu3/f/f{f:03d}.png")
im=fr(36).astype(float); hsv=cv2.cvtColor(fr(36),cv2.COLOR_BGR2HSV)
# halo centre: centroid of near-white non-sand pixels
white=(im.min(2)>245)
ys,xs=np.where(white); cx,cy=xs.mean(),ys.mean(); print("halo centre",round(cx),round(cy))
sandm=(hsv[...,0]>=5)&(hsv[...,0]<=25)&(hsv[...,1]>25)
yy,xx=np.mgrid[0:1080,0:1920]; r=np.hypot(xx-cx,yy-cy)
prof=[]
for R in range(0,1200,50):
    m=(np.abs(r-R)<12)&~sandm&(im.max(2)>120)
    if m.sum()>50: c=np.median(im[m],axis=0); prof.append((R,'#%02x%02x%02x'%tuple(int(v) for v in c[::-1])))
print(prof)
paths={}; leaves={}
for f in range(19,50):
    o=fr(f); h=cv2.cvtColor(o,cv2.COLOR_BGR2HSV).astype(int)
    s=((h[...,0]>=5)&(h[...,0]<=28)&(h[...,1]>=12)&(h[...,2]>150)).astype(np.uint8)*255
    P=40; s=cv2.copyMakeBorder(s,P,P,P,P,cv2.BORDER_REPLICATE); s=cv2.morphologyEx(s,cv2.MORPH_CLOSE,np.ones((25,25),np.uint8)); s=cv2.morphologyEx(s,cv2.MORPH_OPEN,np.ones((9,9),np.uint8)); s=s[P:-P,P:-P]; s=cv2.GaussianBlur(s,(0,0),6); s=((s>127)*255).astype(np.uint8)
    n,lab,st,_=cv2.connectedComponentsWithStats(s)
    keep=np.zeros_like(s)
    if n>1:
        i=1+np.argmax(st[1:,4]); keep[lab==i]=255
    cnts,_=cv2.findContours(keep,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    d=""
    for c in cnts:
        c=cv2.approxPolyDP(c,2.5,True).reshape(-1,2).copy()
        c[c[:,0]<=1,0]=-20; c[c[:,0]>=1918,0]=1940; c[c[:,1]>=1078,1]=1100; c[c[:,1]<=1,1]=-20
        d+="M"+" L".join(f"{x} {y}" for x,y in c)+"Z"
    sat=float(np.median(h[...,1][keep>0])) if keep.any() else 0
    col=np.median(o[keep>0],axis=0) if keep.any() else np.array([150,200,235])
    paths[f]={"d":d,"c":'#%02x%02x%02x'%tuple(int(v) for v in col[::-1])}
    # leaves: solid green, small
    g=((h[...,0]>27)&(h[...,0]<92)&(h[...,1]>45)&(h[...,2]>60)).astype(np.uint8)
    n,lab,st,cen=cv2.connectedComponentsWithStats(g); L=[]
    for i in range(1,n):
        x,y,w,hh,a=st[i]
        if a<40 or a>6000: continue
        if f>=37 and np.hypot(cen[i][0]-960,cen[i][1]-535)<60+(f-36)*60: continue
        ys,xs=np.where(lab==i); ang=cv2.minAreaRect(np.c_[xs,ys].astype(np.float32))[2]
        L.append([round(float(cen[i][0]),1),round(float(cen[i][1]),1),round(float(np.sqrt(a)),1),round(float(ang),1),1])
    leaves[f]=L
json.dump({"paths":paths,"leaves":leaves},open("tu3/vec.json","w"))
print("leaves",[len(leaves[f]) for f in range(19,50)])
print("path colours",[paths[f]["c"] for f in range(25,50,4)])
