#!/usr/bin/env python3
"""PDF A4 do mural para imprimir e recortar: duas peças por página, em tamanho real
(imprimir em 100%), com marcas de corte. Peças em pé giram 90° para caber duas por folha."""
import base64, io, pathlib
from PIL import Image
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).resolve().parent
M = HERE.parent / "mural"
PX_MM = 300 / 25.4

def uri(p):
    im = Image.open(p).convert("RGB")
    w, h = im.width / PX_MM, im.height / PX_MM            # mm reais
    if h > w: im = im.rotate(90, expand=True); w, h = h, w
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=92)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode(), round(w, 1), round(h, 1)

pecas = [uri(p) + (p.stem,) for p in sorted(M.glob("[0-9]*.png"))]
def marca(w, h):
    L = 5; o = 2  # comprimento e afastamento das marcas, em mm
    ls = []
    for x in (0, w):
        for y in (0, h):
            dx = -1 if x == 0 else 1; dy = -1 if y == 0 else 1
            ls.append(f'<line x1="{x + dx*o}" y1="{y}" x2="{x + dx*(o+L)}" y2="{y}"/>')
            ls.append(f'<line x1="{x}" y1="{y + dy*o}" x2="{x}" y2="{y + dy*(o+L)}"/>')
    return (f'<svg class="mc" viewBox="-8 -8 {w+16} {h+16}" style="width:{w+16}mm;height:{h+16}mm">'
            f'<g stroke="#000" stroke-width=".2">{"".join(ls)}</g></svg>')

paginas = []
for i in range(0, len(pecas), 2):
    blocos = "".join(
        f'<div class="bl"><div class="pc" style="width:{w}mm;height:{h}mm">'
        f'<img src="{u}" style="width:{w}mm;height:{h}mm">{marca(w, h)}</div>'
        f'<p>{n.replace("-", " ", 1)} · {w:g} × {h:g} mm</p></div>'
        for u, w, h, n in pecas[i:i + 2])
    paginas.append(f'<section class="pg"><header>A SALA · EP. 01 · MURAL · IMPRIMIR EM 100% · FOLHA {i // 2 + 1}/{(len(pecas) + 1) // 2}</header>{blocos}</section>')

HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@page{{size:A4;margin:0}} *{{margin:0;box-sizing:border-box}}
.pg{{width:210mm;height:297mm;page-break-after:always;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:12mm 0 10mm;position:relative}}
header{{position:absolute;top:7mm;font:7pt 'Liberation Mono',monospace;letter-spacing:.1em;color:#777}}
.bl{{display:flex;flex-direction:column;align-items:center}}
.pc{{position:relative}} .pc img{{display:block}}
.mc{{position:absolute;left:-8mm;top:-8mm;overflow:visible}}
.bl p{{font:6.5pt 'Liberation Mono',monospace;color:#888;margin-top:4mm}}
</style></head><body>{"".join(paginas)}</body></html>"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page()
    pg.set_content(HTML); pg.wait_for_timeout(800)
    pg.pdf(path=str(HERE.parent / "mural-para-recortar-A4.pdf"), format="A4", print_background=True)
    pg.set_viewport_size({"width": 794, "height": 1123}); pg.screenshot(path="/tmp/claude-0/-home-user-EJUPMinerva/3accb857-15e0-52db-afee-7de5f65db929/scratchpad/pdf1.png")
    b.close()
print(len(paginas), "páginas")
