#!/usr/bin/env python3
"""Thumbnail do YouTube · EJUPcast #019, com Marco Bruno. 1280x720.

Estilo de thumb da EJUP no YouTube (referência do Victor, 01/10/2026, episódio
"O comando oculto"): plano aberto do estúdio em toda a largura, logo EJUP
branco no canto superior direito, faixa navy embaixo com a frase em duas
linhas centradas: a primeira em branco, Medium, caixa alta; a segunda em
dourado, Black, caixa alta e maior.
Frame: prints/conversa.jpg do carrossel, os dois de boca fechada.
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
CAR = HERE.parents[1] / "carrossel-ejupcast-019"
sys.path.insert(0, str(CAR / "_build"))
import gerar as g  # noqa: E402

W, H = 1280, 720
FAIXA = 220  # faixa navy embaixo, como na thumb de referência ("O comando oculto")
# plano aberto do estúdio, centrado na TV, com os dois no quadro e de boca fechada
FOTO = g.foto("conversa", (0.0, 0.03, 1.0, 0.03 + (H - FAIXA + 40) / 1280 * 2000 / 1125), 1600)

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
{g.fontes()}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:{W}px;height:{H}px;background:#031c37;font-family:'Gotham',Montserrat,system-ui,sans-serif}}
.t{{position:relative;width:{W}px;height:{H}px;overflow:hidden}}
.foto{{position:absolute;left:0;top:0;width:{W}px;height:{H - FAIXA + 40}px;
   background-size:cover;background-position:center top}}
.logo{{position:absolute;right:56px;top:44px;width:230px}}
.logo svg{{width:100%;height:auto;display:block}}
.faixa{{position:absolute;left:0;bottom:0;width:{W}px;height:{FAIXA}px;background:#031c37;
   display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}}
.l1{{color:#fff;font-weight:500;font-size:50px;line-height:1;letter-spacing:.02em;text-transform:uppercase}}
.l2{{color:#f0b855;font-weight:900;font-size:98px;line-height:1;letter-spacing:-.01em;text-transform:uppercase;margin-top:12px}}
</style></head><body><div class="t">
<div class="foto" style="background-image:url({FOTO})"></div>
<div class="logo">{g.LOGO_B}</div>
<div class="faixa"><div class="l1">Existe inovação na</div><div class="l2">Justiça Federal?</div></div>
</div></body></html>"""

(OUT / "thumb.html").write_text(html, encoding="utf-8")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": W, "height": H})
    pg.goto((OUT / "thumb.html").as_uri()); pg.wait_for_timeout(600)
    pg.screenshot(path=str(OUT / "thumbnail-1280x720.png"))
    b.close()
print("ok")
