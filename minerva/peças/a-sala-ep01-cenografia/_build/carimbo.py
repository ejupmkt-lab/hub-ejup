#!/usr/bin/env python3
"""Etiquetas "CONFIDENCIAL" em fundo preto para imprimir em A4 e recortar.
Três tamanhos: envelope A4 (16 x 4,4 cm), pasta (12 x 3,3 cm) e foto ou folha (8 x 2,2 cm).
Letra em Gotham Black, moldura dupla de carimbo e desgaste de tinta em SVG.
Marcas de corte nos cantos, com 3 mm de sangria preta fora da linha de corte."""
import base64, pathlib
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
FON = HERE.parents[2] / "skills" / "ejup-design" / "assets" / "fonts"
black = base64.b64encode((FON / "Gotham-Black.otf").read_bytes()).decode()
med = base64.b64encode((FON / "Gotham-Medium.otf").read_bytes()).decode()

def etiqueta(w, h, i):
    """w, h em mm (tamanho de corte). SVG com 3 mm de sangria em volta."""
    s = 3; W, H = w + 2 * s, h + 2 * s
    fs = h * 0.46; ins = h * 0.09
    return f"""<div class="et" style="width:{W}mm;height:{H}mm">
<svg viewBox="0 0 {W} {H}" width="{W}mm" height="{H}mm">
  <defs>
    <filter id="gasto{i}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="{i * 7}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.7 1.95" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in"/>
    </filter>
  </defs>
  <rect width="{W}" height="{H}" fill="#0d0d0d"/>
  <g filter="url(#gasto{i})" fill="none" stroke="#ece8df">
    <rect x="{s + ins}" y="{s + ins}" width="{w - 2 * ins}" height="{h - 2 * ins}" stroke-width="{h * 0.035:.2f}"/>
    <rect x="{s + ins * 1.9}" y="{s + ins * 1.9}" width="{w - 3.8 * ins}" height="{h - 3.8 * ins}" stroke-width="{h * 0.012:.2f}"/>
    <text x="{W / 2}" y="{H / 2 + fs * 0.36}" text-anchor="middle" fill="#c1272d" stroke="none"
      font-family="GB" font-weight="900" font-size="{fs:.2f}" letter-spacing="{fs * 0.08:.2f}"
      textLength="{w - 6.2 * ins:.2f}" lengthAdjust="spacingAndGlyphs">CONFIDENCIAL</text>
  </g>
  <g stroke="#fff" stroke-width=".18">
    <line x1="0" y1="{s}" x2="{s - .8}" y2="{s}"/><line x1="{s}" y1="0" x2="{s}" y2="{s - .8}"/>
    <line x1="{W}" y1="{s}" x2="{W - s + .8}" y2="{s}"/><line x1="{W - s}" y1="0" x2="{W - s}" y2="{s - .8}"/>
    <line x1="0" y1="{H - s}" x2="{s - .8}" y2="{H - s}"/><line x1="{s}" y1="{H}" x2="{s}" y2="{H - s + .8}"/>
    <line x1="{W}" y1="{H - s}" x2="{W - s + .8}" y2="{H - s}"/><line x1="{W - s}" y1="{H}" x2="{W - s}" y2="{H - s + .8}"/>
  </g>
</svg><p>{f"{w / 10:g}".replace(".", ",")} × {f"{h / 10:g}".replace(".", ",")} cm</p></div>"""

itens = [(160, 44, 1), (120, 33, 2), (120, 33, 3), (80, 22, 4), (80, 22, 5), (80, 22, 6), (80, 22, 7), (80, 22, 8), (80, 22, 9)]
corpo = "".join(etiqueta(*t) for t in itens)
HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:GB;font-weight:900;src:url(data:font/otf;base64,{black})}}
@font-face{{font-family:GM;font-weight:500;src:url(data:font/otf;base64,{med})}}
@page{{size:A4;margin:0}} *{{margin:0;box-sizing:border-box}}
body{{width:210mm;height:297mm;background:#fff;padding:14mm 15mm;font-family:GM}}
h1{{font-size:8pt;letter-spacing:.14em;color:#5f6062;font-weight:500;margin-bottom:6mm}}
.grade{{display:flex;flex-wrap:wrap;gap:6mm 8mm;align-items:flex-start}}
.et svg{{display:block}}
.et p{{font-size:6.5pt;color:#8a8a8a;letter-spacing:.08em;margin-top:1.2mm}}
</style></head><body>
<h1>A SALA · EP. 01 · ETIQUETAS "CONFIDENCIAL" · IMPRIMIR EM 100%, SEM AJUSTAR À PÁGINA · RECORTAR NAS MARCAS</h1>
<div class="grade">{corpo}</div></body></html>"""
(OUT / "carimbo-confidencial.html").write_text(HTML, encoding="utf-8")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 794, "height": 1123}, device_scale_factor=3.125)
    pg.set_content(HTML); pg.wait_for_timeout(400)
    pg.pdf(path=str(OUT / "carimbo-confidencial-A4.pdf"), format="A4", print_background=True)
    pg.screenshot(path=str(OUT / "carimbo-confidencial-A4.png"))
    b.close()
print("ok")
