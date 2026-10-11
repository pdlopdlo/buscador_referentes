import cv2, numpy as np
im=cv2.imread("ajustes/Data/MUJERYANCIANO01-29.jpeg"); H,W=im.shape[:2]
w=cv2.imread("assets/_w_mask.png",0); o=cv2.imread("assets/_o_mask.png",0)
hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV)
# --- old man cleanup: drop background O at right, add cap/hair
o[:, 1016:]=0
o[300:462, 948:]=0
head=np.zeros_like(o); head[318:362,862:930]=1
o[(head==1)&(hsv[...,1]>70)]=255
cane=np.zeros_like(o); cane[455:650,955:1015]=1
o[(cane==1)&(hsv[...,1]>80)&(hsv[...,2]<170)]=255
def add_white(img,alpha,ellipses):
    for (cx,cy,rx,ry,ang) in ellipses:
        m=np.zeros_like(alpha); cv2.ellipse(m,(cx,cy),(rx,ry),ang,0,360,255,-1)
        sel=(m>0)&(alpha<128)
        img[sel]=(250,252,252); alpha[sel]=255
img=im.copy()
add_white(img,w,[(152,485,32,36,0),(620,485,17,29,0),(452,338,21,27,-10)])
add_white(img,o,[(894,348,14,15,0),(987,465,10,11,0)])
def split_legs(alpha,top,name,bbox):
    x0,y0,x1,y1=bbox
    a=alpha.copy()
    pants=np.zeros_like(a,bool); pants[top:,:]=True; pants&=(a>0)
    # cane/shoes excluded by hue: pants are blue-violet low-mid sat
    h=hsv[...,0].astype(int); pants&=(h>100)&(h<140)
    L=cv2.cvtColor(im,cv2.COLOR_BGR2LAB)[...,0].astype(np.float32)
    v=L[pants].reshape(-1,1)
    _,lab,cent=cv2.kmeans(v,2,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,50,0.2),5,cv2.KMEANS_PP_CENTERS)
    lab=lab.ravel(); dark=int(np.argmin(cent.ravel()))
    legD=np.zeros_like(a); legL=np.zeros_like(a)
    ys,xs=np.where(pants)
    legD[ys[lab==dark],xs[lab==dark]]=255; legL[ys[lab!=dark],xs[lab!=dark]]=255
    k=np.ones((5,5),np.uint8)
    for m in (legD,legL):
        m[:]=cv2.morphologyEx(m,cv2.MORPH_OPEN,k); m[:]=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))
        # keep largest component
        n,l2,st,_=cv2.connectedComponentsWithStats(m); 
        if n>1:
            b=1+int(np.argmax(st[1:,4])); m[:]=np.where(l2==b,255,0)
    legs=cv2.dilate(((legD>0)|(legL>0)).astype(np.uint8)*255,np.ones((5,5),np.uint8))
    body=a.copy(); low=np.zeros_like(body,bool); low[top+6:,:]=True
    body[(legs>0)&low&(hsv[...,0]>95)]=0
    body[(legD>0)|(legL>0)]=0
    back,front=(legD,legL) if name=="woman" else (legL,legD)
    vk=np.zeros((31,1),np.uint8); vk[15:,0]=1   # extend upward
    def ext(m,allowed):
        e=cv2.dilate(m,vk); return np.where((e>0)&(allowed|(m>0)),255,0).astype(np.uint8)
    backE=ext(back,(body>0)|(front>0)); frontE=ext(front,(body>0))
    for nm,m,src in (("body",body,None),("back",backE,back),("front",frontE,front)):
        layer=img.copy()
        if src is not None:
            col=np.median(img[src>0],axis=0); add=(m>0)&(src==0); layer[add]=col
        rgba=np.dstack([layer,cv2.GaussianBlur(m,(3,3),0)])[y0:y1,x0:x1]
        cv2.imwrite(f"assets/{name}_{nm}.png",rgba)
    full=np.dstack([img,cv2.GaussianBlur(alpha,(3,3),0)])[y0:y1,x0:x1]
    cv2.imwrite(f"assets/{name}_full.png",full)
    print(name,"crop",bbox)
split_legs(w,520,"woman",(60,280,660,840))
split_legs(o,462,"oldman",(745,310,1025,655))
