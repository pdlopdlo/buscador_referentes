import cv2,numpy as np,json
N=134
fr=lambda f: cv2.imread(f"tu2/f/f{f:03d}.png")
stack=np.stack([fr(f) for f in range(1,N+1,4)])
bg=np.median(stack,axis=0).astype(np.uint8); del stack
cv2.imwrite("tu2/bg.jpg",bg)
chars=np.zeros((1080,1920),bool)
chars[470:1070,1040:1720]=True   # woman + man (walk in place)
chars[470:700,780:960]=True      # waver
ui=np.zeros((1080,1920),bool); cv2.circle(ui.view(np.uint8),(36,1040),40,1,-1); cv2.circle(ui.view(np.uint8),(1872,1032),40,1,-1); ui[100:160,1570:1620]=True
leaves={}; bird={}
for f in range(1,N+1):
    im=fr(f); d=cv2.absdiff(im,bg).max(2)>28
    d&=~ui
    hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV).astype(int)
    green=(hsv[...,0]>28)&(hsv[...,0]<95)&(hsv[...,1]>40)
    lm=(d&green&~chars).astype(np.uint8)
    lm=cv2.morphologyEx(lm,cv2.MORPH_OPEN,np.ones((3,3),np.uint8)); lm=cv2.morphologyEx(lm,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    n,lab,st,cen=cv2.connectedComponentsWithStats(lm); L=[]
    for i in range(1,n):
        x,y,w,h,a=st[i]
        if a<40: continue
        ys,xs=np.where(lab==i); ang=cv2.minAreaRect(np.c_[xs,ys].astype(np.float32))[2]
        sat=float(hsv[...,1][lab==i].mean())
        L.append([round(float(cen[i][0]),1),round(float(cen[i][1]),1),round(float(np.sqrt(a)),1),round(float(ang),1),round(min(1,max(.3,(sat-30)/90)),2)])
    leaves[f]=L
    bm=(d&~green&~chars).astype(np.uint8)
    bm=cv2.morphologyEx(bm,cv2.MORPH_OPEN,np.ones((3,3),np.uint8)); bm=cv2.morphologyEx(bm,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))
    n,lab,st,cen=cv2.connectedComponentsWithStats(bm)
    if n>1:
        i=1+np.argmax(st[1:,4])
        if st[i][4]>150: bird[f]=[round(float(cen[i][0]),1),round(float(cen[i][1]),1),int(st[i][4]),int(st[i][2]),int(st[i][3])]
json.dump({"leaves":leaves,"bird":bird},open("tu2/data.json","w"))
print("leaves/frame",[len(leaves[f]) for f in range(1,N+1,4)])
print("bird",[(f,bird[f][:3]) for f in sorted(bird)[::6]])
