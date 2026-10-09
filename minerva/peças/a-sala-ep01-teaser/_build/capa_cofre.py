#!/usr/bin/env python3
"""Capa do Reels do teaser de A Sala, ep. 01 (1080x1920): o cofre entreaberto.

Imagem gerada no Higgsfield (GPT Image 2.5, aprovada pelo Victor em 09/10/2026,
2 variações, 2,75 créditos): porta de cofre entreaberta com luz vazando.
Logo de A Sala no centro e uma frase curta, que dá a ideia do caso sem dizer o
nome. O nome só aparece no YouTube. Tudo que é essencial fica no recorte 3:4 do feed (y 240 a 1680).
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
    buf = io.BytesIO(); im.save(buf, fmt, quality=92) if fmt == "JPEG" else im.save(buf, fmt)
    return f"data:image/{fmt.lower()};base64," + base64.b64encode(buf.getvalue()).decode()


cofre = Image.open(OUT / "fotos" / "higgsfield-cofre-a.png").convert("RGB").resize((1080, 1910), Image.LANCZOS)
logo = Image.open(V / "logo" / "a-sala-logo-a-transparente.png").convert("RGBA")
logo = logo.crop(logo.getbbox())
FOTO, LOGO_SALA = b64(cofre), b64(logo, "PNG")
LOGO_EJUP = (DS / "logo" / "ejup-horizontal-white.svg").read_text()
f = lambda n: base64.b64encode((FON / f"Gotham-{n}.otf").read_bytes()).decode()

HTML = f"""<html><head><meta charset="utf-8"><style>
@font-face{{font-family:G;font-weight:300;src:url(data:font/otf;base64,{f('Light')})}}
@font-face{{font-family:G;font-weight:900;src:url(data:font/otf;base64,{f('Black')})}}
*{{margin:0;box-sizing:border-box}}
body{{width:1080px;height:1920px;position:relative;overflow:hidden;font-family:G;color:#fff;background:#020a14}}
.foto{{position:absolute;left:0;top:-30px;width:1080px;height:1910px;background:url({FOTO}) center/cover}}
.veu{{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(2,10,20,.85) 0%,rgba(2,10,20,.15) 9%,rgba(2,10,20,0) 30%,rgba(2,10,20,.05) 55%,rgba(2,10,20,.75) 74%,#020a14 88%),
  radial-gradient(75% 55% at 50% 48%,rgba(2,10,20,0) 55%,rgba(2,10,20,.75) 100%)}}
.foco{{position:absolute;left:-60px;right:-60px;top:780px;height:520px;background:radial-gradient(50% 50% at 50% 50%,rgba(2,10,20,.72) 0%,rgba(2,10,20,.38) 55%,rgba(2,10,20,0) 100%)}}
.grao{{position:absolute;inset:0;opacity:.16;mix-blend-mode:overlay}}
.bloco{{position:absolute;left:0;right:0;top:90px;height:1920px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:46px}}
.tag{{font-weight:300;font-size:40px;letter-spacing:.34em;text-transform:uppercase;color:#e6e9ee;padding-left:.34em;text-shadow:0 2px 24px rgba(0,0,0,.9)}}
.tag b{{font-weight:900;color:#f0b855;letter-spacing:.3em}}
.sala img{{width:620px;display:block;filter:drop-shadow(0 6px 34px rgba(0,0,0,.85))}}
.estreia{{position:absolute;left:0;right:0;top:1560px;text-align:center;font-weight:300;font-size:28px;letter-spacing:.42em;text-transform:uppercase;color:#c9ced6;padding-left:.42em}}
.estreia b{{font-weight:900;color:#fff}}
.ejup{{position:absolute;left:0;right:0;bottom:76px;display:flex;justify-content:center}}
.ejup svg{{height:44px;width:auto;opacity:.85}}
</style></head><body>
<div class="foto"></div><div class="veu"></div><div class="foco"></div>
<svg class="grao" width="1080" height="1920"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
<div class="bloco">
  <div class="tag">Começou num banco.</div>
  <div class="sala"><img src="{LOGO_SALA}"></div>
  <div class="tag">Chegou ao <b>Supremo</b>.</div>
</div>
<div class="estreia">Episódio 01 · <b>no YouTube</b></div>
<div class="ejup">{LOGO_EJUP}</div>
</body></html>"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1080, "height": 1920})
    pg.set_content(HTML)
    pg.wait_for_timeout(900)
    saida = OUT / "capa-reels-cofre.png"
    pg.screenshot(path=str(saida))
    alt = pg.evaluate("[...document.querySelectorAll('.tag')].map(e=>Math.round(e.getBoundingClientRect().top)).join(',')")
    b.close()
print(saida.name, "frases em y =", alt)
