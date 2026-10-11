import cv2,numpy as np,json
src=cv2.imread("tu3/out/pasillo00.jpg").astype(np.float32)
R={31:41,32:50,33:65,34:78,35:108,36:144,37:159,38:207,39:258,40:298,41:359,42:440,43:525,44:600,45:670,46:790,47:940,48:1100}
C={f:(932+ (f-31)*1.6, 495+(f-31)*2.6) for f in R}
for f in range(41,49): C[f]=(960,537)
BLUE=np.array([242,195,79],np.float32)      # BGR #4fc3f2
LIGHT=np.array([250,225,150],np.float32)
meta={}
for f,r in R.items():
    cx,cy=C[f]; pad=4
    x0=int(max(0,cx-r-pad)); y0=int(max(0,cy-r-pad)); x1=int(min(1920,cx+r+pad)); y1=int(min(1080,cy+r+pad))
    yy,xx=np.mgrid[y0:y1,x0:x1].astype(np.float32)
    dx,dy=xx-cx,yy-cy; d=np.sqrt(dx*dx+dy*dy)+1e-6; u=d/r
    alpha=np.clip(r-d+0.5,0,1)
    out=np.zeros((y1-y0,x1-x0,3),np.float32)
    # scene inside (fisheye), fades in from f37
    scene_w=np.clip((f-37)/3,0,1)
    if scene_w>0:
        Rs=1150.0; g=1+1.3*np.clip((1150-r)/950,0,1)
        rho=Rs*np.power(np.clip(u,0,1),g)
        w_in=np.clip((900-r)/500,0,1)
        ui=0.56
        rho_in=Rs*ui**g*(u/ui)*0.62
        inner=u<ui
        rho=np.where(inner, rho*(1-w_in)+rho_in*w_in, rho)
        mx=(960+dx/d*rho).astype(np.float32); my=(540+dy/d*rho).astype(np.float32)
        sc=cv2.remap(src,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
        out=sc*scene_w+BLUE*(1-scene_w)
    else:
        out[:]=BLUE
        w_in=1.0
    # concentric rings (lens look), strongest while small
    ring_w=np.clip((700-r)/500,0,1)
    for rr,a in ((0.56,0.55),(0.3,0.35)):
        band=np.exp(-((u-rr)/0.035)**2)*a*ring_w
        out=out*(1-band[...,None])+LIGHT*band[...,None]
    # soft inner shading at the rim + white highlight crescent upper-left
    rim=np.clip((u-0.88)/0.12,0,1)**2*0.35*ring_w
    out=out*(1-rim[...,None])+np.array([235,180,60],np.float32)*rim[...,None]
    ang=np.degrees(np.arctan2(dy,dx))
    cres=np.exp(-((u-0.80)/0.045)**2)*((ang>-160)&(ang<-115))*0.85*ring_w
    out=out*(1-cres[...,None])+255*cres[...,None]
    if f<=33: alpha*= [0.45,0.65,0.85][f-31]
    rgba=np.dstack([np.clip(out,0,255),alpha*255]).astype(np.uint8)
    cv2.imwrite(f"tu3/out/bub/b{f:03d}.png",rgba,[cv2.IMWRITE_PNG_COMPRESSION,6])
    meta[f]=[x0,y0,x1-x0,y1-y0]
json.dump(meta,open("tu3/bubmeta.json","w"))
# preview
rows=[]
for f in (36,39,41,43,45,47):
    bg=np.full((1080,1920,3),245,np.uint8); b=cv2.imread(f"tu3/out/bub/b{f:03d}.png",cv2.IMREAD_UNCHANGED); x0,y0,w,h=meta[f]
    a=b[...,3:]/255.0; bg[y0:y0+h,x0:x0+w]=(b[...,:3]*a+bg[y0:y0+h,x0:x0+w]*(1-a)).astype(np.uint8)
    rows.append(cv2.resize(bg,(640,360)))
cv2.imwrite("tu3/_bub.jpg",np.vstack([np.hstack(rows[:3]),np.hstack(rows[3:])]))
