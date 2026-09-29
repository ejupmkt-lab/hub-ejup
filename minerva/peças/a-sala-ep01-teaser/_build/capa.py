#!/usr/bin/env python3
"""Capa do Reels de expectativa de A Sala, ep. 01 (1080x1920), sem revelar o tema.
Imagem: a sala vazia da vinheta (quadro 7, mural com luz sobre ele, cadeira de frente).
Texto: a frase de abertura do quadro. Tudo que é essencial fica no recorte 3:4 do feed."""
import base64, io, pathlib
from PIL import Image, ImageEnhance
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
V = RAIZ / "docs" / "formatos" / "a-sala-vinheta"
FON = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"

def b64img(im, q=90):
    buf = io.BytesIO(); im.convert("RGB").save(buf, "JPEG", quality=q)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

sala = Image.open(V / "quadros-chave" / "q7-v2-recorte.png").convert("RGB")
esc = 1240 / sala.height
sala = sala.resize((round(sala.width * esc), 1240), Image.LANCZOS)
x = (sala.width - 1080) // 2
sala = ImageEnhance.Brightness(sala.crop((x, 0, x + 1080, 1240))).enhance(.92)

logo = Image.open(V / "logo" / "a-sala-logo-a-transparente.png").convert("RGBA")
logo = logo.crop(logo.getbbox())
lb = io.BytesIO(); logo.save(lb, "PNG"); LOGO = "data:image/png;base64," + base64.b64encode(lb.getvalue()).decode()
f = lambda n: base64.b64encode((FON / f"Gotham-{n}.otf").read_bytes()).decode()

HTML = f"""<html><head><meta charset="utf-8"><style>
@font-face{{font-family:G;font-weight:300;src:url(data:font/otf;base64,{f('Light')})}}
@font-face{{font-family:G;font-weight:500;src:url(data:font/otf;base64,{f('Medium')})}}
@font-face{{font-family:G;font-weight:900;src:url(data:font/otf;base64,{f('Black')})}}
*{{margin:0;box-sizing:border-box}}
body{{width:1080px;height:1920px;background:#07090c;position:relative;overflow:hidden;font-family:G;color:#fff}}
.foto{{position:absolute;left:0;top:-10px;width:1080px;height:1400px;background:url({b64img(sala)}) center/cover}}
.veu{{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(7,9,12,.7) 0%,rgba(7,9,12,0) 8%,rgba(7,9,12,0) 42%,rgba(7,9,12,.5) 55%,rgba(7,9,12,.9) 66%,#07090c 74%),
  radial-gradient(90% 60% at 50% 38%,rgba(0,0,0,0) 50%,rgba(0,0,0,.5) 100%)}}
.grao{{position:absolute;inset:0;opacity:.28;mix-blend-mode:overlay}}
.logo{{height:92px;display:block}}
.scrim{{position:absolute;left:-100px;right:-100px;top:800px;height:600px;background:radial-gradient(50% 50% at 50% 50%,rgba(7,9,12,.88) 0%,rgba(7,9,12,.7) 45%,rgba(7,9,12,0) 100%)}}
.bloco{{position:absolute;left:70px;right:70px;top:890px;display:flex;flex-direction:column;align-items:center;gap:44px;text-align:center}}
.logo{{width:620px;display:block;filter:drop-shadow(0 6px 30px rgba(0,0,0,.6))}}
.fr{{font-size:64px;line-height:1.08;letter-spacing:-.02em;max-width:880px;text-wrap:balance}}
.l{{font-weight:300}} .b{{font-weight:900}} .o{{color:#f0b855}}
.ep{{display:flex;gap:20px;font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:#d1d3d4;
  border-top:1.5px solid rgba(209,211,212,.35);padding-top:30px;margin-top:-6px}}
.ep .em{{color:#f0b855}}
</style></head><body>
<div class="foto"></div><div class="veu"></div>
<svg class="grao" width="1080" height="1920"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
<div class="scrim"></div>
<div class="bloco">
  <img class="logo" src="{LOGO}">
  <p class="fr"><span class="l">Eu preciso</span> <span class="b">confessar uma <span class="o">coisa.</span></span></p>
  <p class="ep"><span>Episódio 01</span><span>·</span><span class="em">Em breve</span></p>
</div>
</body></html>"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1080, "height": 1920})
    pg.set_content(HTML); pg.wait_for_timeout(500)
    pg.screenshot(path=str(OUT / "capa-reels-expectativa.png"))
    b.close()
print("ok")
