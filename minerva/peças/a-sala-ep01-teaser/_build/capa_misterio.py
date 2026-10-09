#!/usr/bin/env python3
"""Capa do Reels do teaser de A Sala, ep. 01 (1080x1920), com o nome do caso tarjado.

O nome só aparece no YouTube. A capa mostra uma folha de dossiê com as pistas
(data, número de pessoas, ministros) e as palavras que entregariam o caso
cobertas por tarja. Diferente das capas anteriores: nada de mural, luminária
ou cadeira. Tudo que é essencial fica no recorte 3:4 do feed (y 240 a 1680).
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

logo = Image.open(V / "logo" / "a-sala-logo-a-transparente.png").convert("RGBA")
logo = logo.crop(logo.getbbox())
lb = io.BytesIO(); logo.save(lb, "PNG")
LOGO_SALA = "data:image/png;base64," + base64.b64encode(lb.getvalue()).decode()
LOGO_EJUP = (DS / "logo" / "ejup-horizontal-white.svg").read_text()
f = lambda n: base64.b64encode((FON / f"Gotham-{n}.otf").read_bytes()).decode()


def tarja(w):
    return f'<span class="t" style="width:{w}px"></span>'


HTML = f"""<html><head><meta charset="utf-8"><style>
@font-face{{font-family:G;font-weight:300;src:url(data:font/otf;base64,{f('Light')})}}
@font-face{{font-family:G;font-weight:400;src:url(data:font/otf;base64,{f('Book')})}}
@font-face{{font-family:G;font-weight:900;src:url(data:font/otf;base64,{f('Black')})}}
*{{margin:0;box-sizing:border-box}}
body{{width:1080px;height:1920px;position:relative;overflow:hidden;font-family:G;color:#fff;
  background:radial-gradient(70% 45% at 50% 46%,#123150 0%,#031c37 45%,#0d131a 100%)}}
.grao{{position:absolute;inset:0;opacity:.22;mix-blend-mode:overlay}}
.sala{{position:absolute;top:110px;left:0;right:0;display:flex;justify-content:center}}
.sala img{{width:330px}}
.folha{{position:absolute;left:110px;top:345px;width:860px;height:985px;background:linear-gradient(170deg,#fbfaf6 0%,#efebe2 70%,#e4dfd3 100%);
  transform:rotate(-2.4deg);box-shadow:0 40px 90px rgba(1,8,18,.75),0 8px 18px rgba(1,8,18,.5);padding:84px 84px 0;color:#031c37}}
.caso{{font-weight:900;font-size:132px;line-height:.95;letter-spacing:-.035em}}
.nome{{display:block;height:150px;width:690px;background:#0b0f14;margin:26px 0 0 -6px;transform:rotate(.6deg);
  box-shadow:inset 0 0 0 2px rgba(255,255,255,.04)}}
.pistas{{margin-top:64px;border-top:2px solid rgba(3,28,55,.25)}}
.p{{font-weight:400;font-size:34px;line-height:1.3;padding:22px 0;border-bottom:2px solid rgba(3,28,55,.25);color:#414042}}
.p b{{display:block;font-weight:900;font-size:50px;letter-spacing:-.02em;color:#031c37;margin-bottom:4px}}
.t{{display:inline-block;height:34px;background:#0b0f14;vertical-align:-6px;margin-left:6px}}
.cta{{position:absolute;left:96px;right:96px;top:1420px;text-align:center}}
.cta h2{{font-weight:900;font-size:72px;line-height:1.04;letter-spacing:-.025em}}
.cta h2 em{{font-style:normal;color:#f0b855}}
.cta p{{font-weight:300;font-size:36px;color:#d1d3d4;margin-top:22px}}
.ejup{{position:absolute;left:0;right:0;bottom:70px;display:flex;justify-content:center}}
.ejup svg{{height:46px;width:auto}}
</style></head><body>
<svg class="grao" width="1080" height="1920"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
<div class="sala"><img src="{LOGO_SALA}"></div>
<div class="folha">
  <div class="caso">O caso</div>
  <span class="nome"></span>
  <div class="pistas">
    <div class="p"><b>18.11.2025</b>preso no aeroporto de {tarja(230)}</div>
    <div class="p"><b>1,6 milhão de pessoas</b>com dinheiro preso no {tarja(230)}</div>
    <div class="p"><b>3 ministros</b>do Supremo na investigação: {tarja(150)}</div>
  </div>
</div>
<div class="cta"><h2>O nome está <em>no YouTube</em>.</h2><p>Episódio 01 completo no canal da EJUP</p></div>
<div class="ejup">{LOGO_EJUP}</div>
</body></html>"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1080, "height": 1920})
    pg.set_content(HTML)
    pg.wait_for_timeout(800)
    saida = OUT / "capa-reels-caso-tarjado.png"
    pg.screenshot(path=str(saida))
    b.close()
print(saida.name)
