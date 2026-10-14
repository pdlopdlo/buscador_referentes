# Builds the continuous 4-scene animation: elements scroll right->left behind a
# fixed walking man; the curtain (scene 4) passes in front and holds over him.
import subprocess, sys
U = '/root/.claude/uploads/c8ce976c-fbba-5e0e-80ec-cfb40d39b790/'
OUT = sys.argv[1]
TLIM = float(sys.argv[2]) if len(sys.argv) > 2 else None
W, H, FPS = 1920, 1080, 24
FLOOR = 1045          # common baseline for elements
V = 300.0             # scroll speed px/s
GAP, SCENE_GAP = 40, 360
LEAD = 200            # first element appears this far after start
EASE, HOLD = 0.8, 2.2 # curtain decel/accel seconds and hold seconds
MAN_X, MAN_Y, MAN_H, MAN_CX = 127, 615, 432, 300

# (kind, path, filter to final size, width, height, gap_after)
def img(p, sc, w, h, gap=GAP): return ('img', p, f'scale={round(w*sc)}:{round(h*sc)}:flags=lanczos', round(w*sc), round(h*sc), gap)
def vid(p, pre, w, h, gap=GAP): return ('vid', p, pre, w, h, gap)
items = [
  # Escenario 1: espera, baños, cama, botiquín
  img('recursos/r1_c.png', 1.4, 1120, 265, SCENE_GAP),
  # Escenario 2: ventanillas de atención + conversación
  img('recursos/r2a_c.png', 1.4, 190, 275),
  vid(U+'86c3685d-ventanilla01.mp4', 'scale=288:385', 288, 385, 20),
  vid(U+'faf17df6-ventanilla02.mp4', 'scale=298:385', 298, 385),
  img('recursos/r2b_c.png', 1.4, 165, 275, SCENE_GAP),
  # Escenario 3: TENS + insumos
  vid('tens_a.mov', 'crop=400:600:0:20,scale=288:432', 288, 432),
  img('recursos/r3_c.png', 1.3, 906, 330, SCENE_GAP),
  # Escenario 4: enfermera, doctora, insumos, cortina (delante)
  vid('enf_a.mov', 'crop=220:490:80:80,scale=166:368', 166, 368, 10),
  vid('dra_a.mov', 'crop=220:545:110:62,scale=166:410', 166, 410),
  img('recursos/r4b_c.png', 1.4, 255, 262, 120),
  ('curtain', 'recursos/curtain_a.png', 'scale=533:520:flags=lanczos', 533, 520, 0),
]
x = LEAD; pos = []
for it in items:
    pos.append(x); x += it[3] + it[5]
L = x
ci = [i for i, it in enumerate(items) if it[0] == 'curtain'][0]
curtain_cx = pos[ci] + items[ci][3] / 2
S = curtain_cx + W - MAN_CX          # scroll distance at which curtain is centred on man
t1 = S / V - EASE / 2
t2 = t1 + EASE + HOLD
D = (L + W) / V + EASE + HOLD + 0.3
lost = (f"if(lt(t,{t1}),0,if(lt(t,{t1+EASE}),pow(t-{t1},2)/{2*EASE},"
        f"if(lt(t,{t2}),{EASE/2}+t-{t1+EASE},"
        f"if(lt(t,{t2+EASE}),{EASE/2+HOLD}+(t-{t2})-pow(t-{t2},2)/{2*EASE},{EASE+HOLD}))))")
P = f"({V}*(t-({lost})))"

args = ['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f'color=c=white:s={W}x{H}:r={FPS}:d={D}',
        '-stream_loop', '-1', '-i', 'man_loop.mov']
fc = [f'[1:v]scale=-2:{MAN_H}:flags=lanczos[man]']
n = 2
for i, it in enumerate(items):
    kind, path, flt, w, h, _ = it
    if kind == 'vid': args += ['-stream_loop', '-1', '-i', path]
    else: args += ['-loop', '1', '-framerate', str(FPS), '-i', path]
    fc.append(f'[{n}:v]{flt},setsar=1,fps={FPS},format=rgba[e{i}]'); n += 1
prev = '0:v'
for i, it in enumerate(items):
    if it[0] == 'curtain': continue
    fc.append(f"[{prev}][e{i}]overlay=x='{pos[i]}+{W}-{P}':y={FLOOR - it[4]}:eof_action=pass:shortest=0[b{i}]")
    prev = f'b{i}'
fc.append(f'[{prev}][man]overlay=x={MAN_X}:y={MAN_Y}:format=auto,format=yuv420p[m]')
c = items[ci]
fc.append(f"[m][e{ci}]overlay=x='{pos[ci]}+{W}-{P}':y={FLOOR + 15 - c[4]},format=yuv420p[v]")
open('graph.txt', 'w').write(';\n'.join(fc))
args += ['-filter_complex_script', 'graph.txt', '-map', '[v]', '-t', f'{TLIM or D:.3f}', '-r', str(FPS),
         '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', OUT]
print(f'strip={L}px duration={D:.2f}s curtain hold {t1+EASE:.2f}-{t2:.2f}s', flush=True)
subprocess.run(args, check=True)
