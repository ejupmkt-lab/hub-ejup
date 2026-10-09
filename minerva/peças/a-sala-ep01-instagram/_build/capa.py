#!/usr/bin/env python3
"""Capa do vídeo completo de A Sala, ep. 01, no Instagram (1080x1920): O Caso Vorcaro.

Imagem gerada no Higgsfield (GPT Image 2.5, aprovada pelo Victor em 09/10/2026,
2 variações, 2,75 créditos; escolhida a segunda): sala de embarque vazia à noite, uma mala sozinha e o
avião na janela. Nenhuma pessoa na imagem. Título em cartaz de cinema, logo de
A Sala pequeno embaixo. Tudo que é essencial fica no recorte 3:4 do feed (y 240 a 1680).
"""
import base64, io, pathlib
from PIL import Image
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
V = RAIZ / "docs" / "formatos" / "a-sala-vinheta"
DS = RAIZ / "skills" / "ejup-design" / "assets"
FON = DS / "fonts"


def b64(im, fmt="JPEG"):
    buf = io.BytesIO()
    im.save(buf, fmt, quality=92) if fmt == "JPEG" else im.save(buf, fmt)
    return f"data:image/{fmt.lower()};base64," + base64.b64encode(buf.getvalue()).decode()


foto = Image.open(OUT / "fotos" / "higgsfield-embarque-b.png").convert("RGB").resize((1080, 1910), Image.LANCZOS)
logo = Image.open(V / "logo" / "a-sala-logo-a-transparente.png").convert("RGBA")
logo = logo.crop(logo.getbbox())
FOTO, LOGO_SALA = b64(foto), b64(logo, "PNG")
LOGO_EJUP = (DS / "logo" / "ejup-horizontal-white.svg").read_text()
f = lambda n: base64.b64encode((FON / f"Gotham-{n}.otf").read_bytes()).decode()

HTML = f"""<html><head><meta charset="utf-8"><style>
@font-face{{font-family:G;font-weight:400;src:url(data:font/otf;base64,{f('Book')})}}
@font-face{{font-family:G;font-weight:900;src:url(data:font/otf;base64,{f('Black')})}}
*{{margin:0;box-sizing:border-box}}
body{{width:1080px;height:1920px;position:relative;overflow:hidden;font-family:G;color:#fff;background:#020a14}}
.foto{{position:absolute;left:0;top:-150px;width:1080px;height:1910px;background:url({FOTO}) center/cover}}
.veu{{position:absolute;inset:0;background:
  linear-gradient(180deg,#020a14 0%,rgba(2,10,20,.35) 6%,rgba(2,10,20,0) 16%,rgba(2,10,20,0) 36%,rgba(2,10,20,.3) 46%,rgba(2,10,20,.4) 62%,rgba(2,10,20,.7) 78%,#020a14 92%),
  radial-gradient(80% 50% at 50% 35%,rgba(2,10,20,0) 55%,rgba(2,10,20,.7) 100%)}}
.foco{{position:absolute;left:-80px;right:-80px;top:700px;height:560px;background:radial-gradient(50% 50% at 50% 50%,rgba(2,10,20,.75) 0%,rgba(2,10,20,.4) 55%,rgba(2,10,20,0) 100%)}}
.grao{{position:absolute;inset:0;opacity:.15;mix-blend-mode:overlay}}
.bloco{{position:absolute;left:0;right:0;top:0;height:1920px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:70px;padding-top:40px}}
.titulo{{text-align:center;text-shadow:0 6px 40px rgba(0,0,0,.85)}}
.titulo p{{font-weight:900;font-size:150px;line-height:.96;letter-spacing:.02em;text-transform:uppercase;padding-left:.02em}}
.titulo p + p{{color:#f0b855}}
.sala img{{width:340px;display:block;opacity:.95}}
.ejup{{position:absolute;left:0;right:0;bottom:76px;display:flex;justify-content:center}}
.ejup svg{{height:40px;width:auto;opacity:.8}}
</style></head><body>
<div class="foto"></div><div class="veu"></div><div class="foco"></div>
<svg class="grao" width="1080" height="1920"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="9"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
<div class="bloco">
  <div class="titulo"><p>O caso</p><p>Vorcaro</p></div>
  <div class="sala"><img src="{LOGO_SALA}"></div>
</div>
<div class="ejup">{LOGO_EJUP}</div>
</body></html>"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1080, "height": 1920})
    pg.set_content(HTML)
    pg.wait_for_timeout(900)
    saida = OUT / "capa-instagram-caso-vorcaro.png"
    pg.screenshot(path=str(saida))
    pos = pg.evaluate("[...document.querySelectorAll('.titulo,.sala img')].map(e=>{const r=e.getBoundingClientRect();return Math.round(r.top)+'-'+Math.round(r.bottom)}).join(' ')")
    b.close()
print(saida.name, "título e logo em y =", pos)
