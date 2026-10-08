"""Genera el intro CRS — SAG (16:9 y 9:16) a partir del logo vectorizado (logo_paths.json)."""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEOS = os.path.abspath(os.path.join(HERE, "..", ".."))
P = json.load(open(os.path.join(HERE, "logo_paths.json")))
TPL = open(os.path.join(HERE, "plantilla.html.tmpl")).read()
CX, CY = P["center"]

FORMATS = {
    "intro-crs-sag": dict(W=1920, H=1080, title="Intro CRS — SAG", s1=1.75, s2=1.22, gapName=34, nameSize=76, gapBar=22, segW=56, tagFont=24, tagFrom=[320, 260], tagAside=[300, 220]),
    "intro-crs-sag-vertical": dict(W=1080, H=1920, title="Intro CRS — SAG · Vertical", s1=2.2, s2=1.75, gapName=56, nameSize=116, gapBar=30, segW=84, tagFont=34, tagFrom=[260, 360], tagAside=[340, 430]),
}


def pt(r, deg):
    a = math.radians(deg)
    return f"{CX + r * math.cos(a):.2f} {CY + r * math.sin(a):.2f}"


# Trazo-guía de la C: desde su extremo superior izquierdo, en sentido antihorario, hasta el extremo inferior derecho.
RING_ARC = f"M{pt(125, 228)} A125 125 0 1 0 {pt(125, 12)}"
# Círculo exterior completo, empezando abajo.
CIRCLE_ARC = f"M{pt(165.5, 90)} A165.5 165.5 0 1 1 {pt(165.5, 270)} A165.5 165.5 0 1 1 {pt(165.5, 90)}"

rays_svg, rays_cfg = [], []
for i, r in enumerate(P["rays"]):
    rays_svg.append(f'<path id="ray{i}" d="{r["d"]}" fill="#c4372a" />')
    # Origen de escala: el extremo interior del rayo (hacia el centro del símbolo).
    dx, dy = CX - r["cx"], CY - r["cy"]
    k = 22 / math.hypot(dx, dy)
    rays_cfg.append({"ox": round(r["cx"] + dx * k, 2), "oy": round(r["cy"] + dy * k, 2)})

lines = []
for i, ((a, b), d) in enumerate(zip(P["textRows"], P["text"])):
    y0, h = a - 4, (b - a) + 8
    lines.append(
        f'            <svg class="tline" id="tline{i}" viewBox="0 {y0} 455 {h}" style="top: {y0}px; height: {h}px">'
        f'<path d="{d}" fill="#1d1d1f" fill-rule="evenodd" /></svg>'
    )

for name, F in FORMATS.items():
    cfg = dict(F, center=[CX, CY], rays=rays_cfg)
    out = TPL
    for k, v in {
        "__W__": F["W"], "__H__": F["H"], "__TITLE__": F["title"],
        "__CX__": CX, "__CY__": CY,
        "__CIRCLE_ARC__": CIRCLE_ARC, "__RING_ARC__": RING_ARC,
        "__CIRCLE__": P["circle"], "__RING__": P["ring"], "__STAFF__": P["staff"], "__SERPENT__": P["serpent"],
        "__RAYS__": "".join(rays_svg), "__TEXT_LINES__": "\n".join(lines),
        "__CFG__": json.dumps(cfg),
    }.items():
        out = out.replace(k, str(v))
    dest = os.path.join(VIDEOS, name, "index.html")
    open(dest, "w").write(out)
    print("wrote", dest)
