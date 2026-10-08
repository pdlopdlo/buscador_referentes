"""Generate the 3-step "live preview" window clip in horizontal and vertical layouts."""
import json, sys

STEPS = [
    {"title": "PROCESO ATENCIÓN", "lead": "PROCESO", "accent": "ATENCIÓN", "typed": "Saludar y presentarse"},
    {"title": "INFRAESTRUCTURA Y COMODIDAD", "lead": "INFRAESTRUCTURA Y", "accent": "COMODIDAD", "typed": "Espacios limpios y ordenados"},
    {"title": "RESULTADO Y TIEMPO", "lead": "RESULTADO Y", "accent": "TIEMPO", "typed": "Espacios limpios y ordenados"},
]
SEG = 5.0

LAYOUTS = {
    "h": {
        "W": 1920, "H": 1080, "title": "Ventana 3 pasos",
        "win": (470, 200, 1180, 720), "canvas": (22, 60, 1136, 560), "scrub": (30, 660, 1120), "time": (1080, 646),
        "lightTitle": (90, 150, 740), "circle": (860, 70, 180), "lines": (96, 280),
        "darkTitle": (70, 110, 720), "darkCircle": (860, 60, 200), "darkLines": (780, 400),
        "swatchTop": 100, "swatchLefts": (600, 880, 1160), "swatchSize": (54, 24, 16),
        "input": (60, 560, 24, 60), "tagFont": 22,
        "esc": (1390, 290), "inf": (520, 900), "res": (1420, 880),
        "crs": (300, 650), "crsTarget": (1010, 122), "winFrom": (0.45, 260),
    },
    "v": {
        "W": 1080, "H": 1920, "title": "Ventana 3 pasos · Vertical",
        "win": (50, 700, 980, 640), "canvas": (22, 60, 936, 490), "scrub": (30, 590, 920), "time": (885, 562),
        "lightTitle": (60, 230, 820), "circle": (720, 40, 160), "lines": (66, 360),
        "darkTitle": (60, 200, 600), "darkCircle": (700, 40, 190), "darkLines": (680, 400),
        "swatchTop": 590, "swatchLefts": (80, 445, 810), "swatchSize": (64, 30, 18),
        "input": (50, 1420, 32, 72), "tagFont": 30,
        "esc": (800, 790), "inf": (600, 1380), "res": (820, 1440),
        "crs": (480, 1530), "crsTarget": (545, 612), "winFrom": (0.55, 0),
    },
}

TEMPLATE = open(sys.argv[1]).read()

for key, L in LAYOUTS.items():
    out = TEMPLATE
    for k, v in {
        "__W__": L["W"], "__H__": L["H"], "__TITLE__": L["title"], "__DUR__": int(SEG * len(STEPS)),
        "__CFG__": json.dumps({"L": L, "steps": STEPS, "seg": SEG}, ensure_ascii=False),
    }.items():
        out = out.replace(k, str(v))
    sections = []
    for i in range(len(STEPS)):
        sections.append(
            f'      <section id="p{i}" class="clip" data-start="{i * SEG:g}" data-duration="{SEG:g}" data-track-index="{i % 2}"></section>'
        )
    out = out.replace("__SECTIONS__", "\n".join(sections))
    dest = sys.argv[2] if key == "h" else sys.argv[3]
    open(dest, "w").write(out)
    print("wrote", dest)
