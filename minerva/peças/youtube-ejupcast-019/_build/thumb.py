#!/usr/bin/env python3
"""Thumbnail do YouTube · EJUPcast #019, com Marco Bruno. 1280x720.

Sistema do cartão do carrossel do #019 (painel navy com facetas, foto em
cartão, logo ejup/cast). Texto da arte: a frase curta da thumb; o nome do
convidado e o selo do episódio ficam como elementos à parte
(docs/minerva/prompts-conteudo.md, item 2).
Frame: prints/capa.jpg do carrossel, boca fechada, rosto centrado no cartão.
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
CAR = HERE.parents[1] / "carrossel-ejupcast-019"
sys.path.insert(0, str(CAR / "_build"))
import gerar as g  # noqa: E402

W, H = 1280, 720
# recorte centrado no rosto (x≈1100 no frame de 2000 px)
FOTO = g.foto("capa", (0.355, 0.10, 0.80, 0.93), 1000)

html = f"""<!doctype html><html><head><meta charset="utf-8"><style>
{g.fontes()}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:{W}px;height:{H}px;background:#0d131a;font-family:'Gotham',Montserrat,system-ui,sans-serif}}
.t{{position:relative;width:{W}px;height:{H}px;overflow:hidden}}
.facetas{{position:absolute;inset:0;width:100%;height:100%}}
.logo{{position:absolute;left:72px;top:60px;display:flex;align-items:center;gap:12px;color:#fff}}
.logo svg{{height:44px;width:auto}}
.logo span{{font-weight:300;font-size:30px;letter-spacing:.01em}}
h1{{position:absolute;left:72px;top:190px;width:640px;color:#fff;font-weight:900;
   font-size:84px;line-height:1.02;letter-spacing:-.025em}}
h1 em{{font-style:normal;color:#f0b855}}
.nome{{position:absolute;left:72px;bottom:72px;display:flex;align-items:center;gap:22px}}
.nome b{{color:#fff;font-weight:500;font-size:34px;letter-spacing:-.01em}}
.nome i{{width:1px;height:34px;background:rgba(209,211,212,.45)}}
.nome span{{color:#d1d3d4;font-weight:500;font-size:18px;letter-spacing:.14em;text-transform:uppercase}}
.foto{{position:absolute;right:64px;top:56px;width:470px;height:608px;border-radius:12px;
   background-size:cover;background-position:center;
   box-shadow:0 30px 60px rgba(3,28,55,.55),0 8px 18px rgba(3,28,55,.4)}}
</style></head><body><div class="t">
{g.facetas(W, H)}
<div class="logo">{g.LOGO_B}<span>/cast</span></div>
<h1>Existe <em>inovação</em> na Justiça Federal?</h1>
<div class="nome"><b>Marco Bruno</b><i></i><span>EJUPcast #019</span></div>
<div class="foto" style="background-image:url({FOTO})"></div>
</div></body></html>"""

(OUT / "thumb.html").write_text(html, encoding="utf-8")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": W, "height": H})
    pg.goto((OUT / "thumb.html").as_uri()); pg.wait_for_timeout(600)
    pg.screenshot(path=str(OUT / "thumbnail-1280x720.png"))
    b.close()
print("ok")
