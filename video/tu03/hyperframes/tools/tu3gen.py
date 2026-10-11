import cv2,numpy as np,json
IMG="/tmp/claude-0/-home-user-buscador-referentes/a88e330b-2530-58ae-a7a9-d3ba132f0c38/images/"
def load_hosp(i):
    im=cv2.imread(IMG+f"{i}.jpg")
    m=np.zeros(im.shape[:2],np.uint8)
    cv2.circle(m,(24,745),24,255,-1); cv2.circle(m,(1333,735),26,255,-1)
    im=cv2.inpaint(im,m,7,cv2.INPAINT_TELEA)
    im=cv2.resize(im,(1927,1080),interpolation=cv2.INTER_LANCZOS4)[:,3:1923]
    bl=cv2.GaussianBlur(im,(0,0),1.2); im=cv2.addWeighted(im,1.35,bl,-0.35,0)
    return im
H=[load_hosp(i) for i in range(4,9)]
for k,im in enumerate(H): cv2.imwrite(f"tu3/out/pasillo{k:02d}.jpg",im,[cv2.IMWRITE_JPEG_QUALITY,93])
def layer(a,b,box,name,thr=28):
    d=cv2.absdiff(a,b).max(2)>thr
    m=np.zeros(d.shape,np.uint8); x0,y0,x1,y1=box; m[y0:y1,x0:x1]=d[y0:y1,x0:x1]
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((3,3),np.uint8)); m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((15,15),np.uint8))
    cnts,_=cv2.findContours(m,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    f=np.zeros_like(m)
    for c in cnts:
        if cv2.contourArea(c)>2500: cv2.drawContours(f,[c],-1,255,-1)
    f=cv2.dilate(f,np.ones((5,5),np.uint8)); f=cv2.GaussianBlur(f,(5,5),0)
    cv2.imwrite(f"tu3/out/{name}.png",np.dstack([b,f])); return f
# box coords in 1920 space (scale 1.4063, x shift -3)
sx=1080/768
B=lambda x0,y0,x1,y1:(int(x0*sx-3),int(y0*sx),int(x1*sx-3),int(y1*sx))
pm=layer(H[0],H[4],B(900,380,1345,725),"people_nurse_elder")
tm=layer(H[3],H[4],B(140,235,400,705),"people_tens")
prev=np.vstack([cv2.resize(np.dstack([H[4],pm])[...,:3]*(pm[...,None]/255.0),(960,540)).astype(np.uint8),cv2.resize((H[4]*(tm[...,None]/255.0)).astype(np.uint8),(960,540))])
cv2.imwrite("tu3/_layers.jpg",prev)
