import cv2, numpy as np, sys
O=sys.argv[1]
def load(f): return cv2.imread(f"{O}/f{f:03d}.png")
def fitcircle(pts):
    x=pts[:,0].astype(float); y=pts[:,1].astype(float)
    A=np.c_[2*x,2*y,np.ones_like(x)]; b=x*x+y*y
    c=np.linalg.lstsq(A,b,rcond=None)[0]; r=np.sqrt(c[2]+c[0]**2+c[1]**2); return c[0],c[1],r
prev=(825,348)
for f in range(1,40):
    im=load(f); hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV)
    sat=hsv[...,1]>90
    # ring mask: saturated green/blue
    m=(sat & (hsv[...,0]>35)&(hsv[...,0]<115)).astype(np.uint8)
    n,lab,st,cen=cv2.connectedComponentsWithStats(m)
    # choose component with largest area whose bbox contains prev center
    best=None
    for i in range(1,n):
        x,y,w,h,a=st[i]
        if x<=prev[0]<=x+w and y<=prev[1]<=y+h and (best is None or a>st[best][4]): best=i
    if best is None: print(f,"none"); continue
    comp=(lab==best).astype(np.uint8)
    # hole = holes in component: fill
    cnts,hier=cv2.findContours(comp,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE)
    # outer contour largest
    outer=max([c for i,c in enumerate(cnts) if hier[0][i][3]==-1],key=cv2.contourArea)
    inner=[c for i,c in enumerate(cnts) if hier[0][i][3]!=-1]
    H,W=comp.shape
    def interior(c):
        p=c.reshape(-1,2); k=(p[:,0]>2)&(p[:,0]<W-3)&(p[:,1]>2)&(p[:,1]<H-3); return p[k]
    po=interior(outer); ox,oy,orr=fitcircle(po)
    s=f"{(f-1)/24:.3f} outer c=({ox:.0f},{oy:.0f}) R={orr:.0f}"
    if inner:
        ic=max(inner,key=cv2.contourArea)
        if cv2.contourArea(ic)>500:
            ix,iy,ir=fitcircle(interior(ic)); s+=f" hole c=({ix:.0f},{iy:.0f}) r={ir:.0f}"; prev=(int(ix),int(iy))
    print(s)
