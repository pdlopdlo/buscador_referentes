import cv2, numpy as np
exec(open("chars.py").read().split("def split_legs")[0])
L=cv2.cvtColor(im,cv2.COLOR_BGR2LAB)[...,0].astype(int)
def build(alpha,top,name,bbox,polys,order,keep_low=None):
    x0,y0,x1,y1=bbox
    pants=(alpha>0); pants[:top,:]=False
    if keep_low is not None: pants&=~keep_low
    masks={}
    for k,p in polys.items():
        m=np.zeros_like(alpha); cv2.fillPoly(m,[np.array(p,np.int32)],255)
        masks[k]=cv2.dilate(m,np.ones((9,9),np.uint8))>0
    both=masks["D"]&masks["L"]; med=np.median(L[pants])
    D=pants&masks["D"]&(~both|(L<med)); Lg=pants&masks["L"]&(~both|(L>=med))
    D=D.astype(np.uint8)*255; Lg=Lg.astype(np.uint8)*255
    body=alpha.copy(); body[pants]=0
    back,front=(D,Lg) if order=="D_back" else (Lg,D)
    vk=np.zeros((41,1),np.uint8); vk[20:,0]=1
    def ext(m,allowed):
        e=cv2.dilate(m,vk); return np.where((e>0)&(allowed|(m>0)),255,0).astype(np.uint8)
    out={"body":(body,None),"back":(ext(back,(body>0)|(front>0)),back),"front":(ext(front,body>0),front)}
    for nm,(m,src) in out.items():
        layer=img.copy()
        if src is not None:
            col=np.median(img[src>0],axis=0); layer[(m>0)&(src==0)]=col
        cv2.imwrite(f"assets/{name}_{nm}.png",np.dstack([layer,cv2.GaussianBlur(m,(3,3),0)])[y0:y1,x0:x1])
    cv2.imwrite(f"assets/{name}_full.png",np.dstack([img,cv2.GaussianBlur(alpha,(3,3),0)])[y0:y1,x0:x1])
wD=[(283,524),(300,524),(375,600),(418,640),(400,700),(322,712),(160,770),(118,822),(75,680),(200,645),(240,575)]
wL=[(300,524),(415,524),(470,600),(530,680),(555,690),(610,700),(545,770),(480,805),(455,760),(415,670),(375,600)]
build(w,524,"woman",(60,280,660,840),{"D":wD,"L":wL},"D_back")
oL=[(818,466),(884,466),(872,540),(838,590),(822,612),(840,640),(800,648),(756,603),(790,560),(805,520)]
oD=[(884,466),(915,466),(940,530),(948,600),(950,628),(978,645),(895,648),(885,600),(870,545)]
cane=(((hsv[...,0]<30)|(hsv[...,0]>160))&(hsv[...,1]>60)&(np.arange(img.shape[1])[None,:]>950)); cane[452:480,974:1002]=True
build(o,466,"oldman",(745,310,1025,655),{"D":oD,"L":oL},"L_back",keep_low=cane)
