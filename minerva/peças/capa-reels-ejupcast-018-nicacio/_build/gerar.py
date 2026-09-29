#!/usr/bin/env python3
"""Capa de reels · corte do EJUPcast #018 com Nicácio Carvalho.

Versão 2 (referência do Victor, 29/09): foto sangrada e título em duas linhas,
Gotham Thin em caixa alta e Gotham Book Italic grande. O tema vem do corte:
a instabilidade das decisões do STF minando a confiança na Corte.

Versão 1 (logo ejup/CAST e aro), substituída:

Segue a capa já usada no feed do #018 (referência do Victor): foto sangrada,
logotipo "ejup ▶ /CAST" no centro, "EPISÓDIO #018" espaçado embaixo e um aro
fino com dois pontos dourados envolvendo o convidado. 1080×1920; o bloco
central fica dentro do recorte 3:4 que o perfil mostra na grade.

Foto: frame limpo do episódio (sem legenda queimada), prints/duo-conversa.webp
do carrossel do #018, recortado no Nicácio.

    python3 _build/gerar.py
"""
import base64, io, pathlib, re
from PIL import Image, ImageEnhance
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGO_B = (RAIZ / "skills" / "ejup-design" / "assets" / "logo" / "ejup-horizontal-white.svg").read_text(encoding="utf-8")
# só a palavra "ejup", como no selo do estúdio
MARCA = re.sub(r'viewBox="[^"]*"', 'viewBox="352 690 282 118"', LOGO_B, count=1)
FOTO = RAIZ / "peças" / "carrossel-ejupcast-018" / "prints" / "duo-conversa.webp"


def b64(p):
    return base64.b64encode(p.read_bytes()).decode()


def foto():
    im = Image.open(FOTO).convert("RGB").crop((1000, 0, 1633, 1125))
    im = im.resize((1080, 1920), Image.LANCZOS)
    im = ImageEnhance.Contrast(im).enhance(1.05)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=92)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


TITULO = ("A CONFIANÇA NO", "Supremo.")

HTML = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Gotham';font-weight:200;src:url(data:font/otf;base64,__T__)}
@font-face{font-family:'Gotham';font-weight:400;font-style:italic;src:url(data:font/otf;base64,__I__)}
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000}
.capa{position:relative;width:1080px;height:1920px;overflow:hidden;font-family:'Gotham'}
.capa>img{position:absolute;inset:0;width:100%;height:100%}
.veu{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(4,13,24,.2) 0%,rgba(4,13,24,0) 30%,rgba(4,13,24,.1) 50%,rgba(4,13,24,.5) 70%,rgba(4,13,24,.8) 100%)}
.titulo{position:absolute;left:0;right:0;top:1130px;text-align:center;color:#fff;text-shadow:0 4px 30px rgba(0,0,0,.45)}
.titulo .a{display:block;font-weight:200;font-size:92px;letter-spacing:.02em;line-height:1}
.titulo .b{display:block;font-weight:400;font-style:italic;font-size:200px;letter-spacing:-.02em;line-height:1.02}
</style></head><body><div class="capa" id="capa">
<img src="__FOTO__" alt="">
<div class="veu"></div>
<h1 class="titulo"><span class="a">__A__</span><span class="b">__B__</span></h1>
</div></body></html>"""


def main():
    html = (HTML.replace("__T__", b64(FONTS / "Gotham-Thin.otf")).replace("__I__", b64(FONTS / "Gotham-BookItalic.otf"))
            .replace("__FOTO__", foto()).replace("__A__", TITULO[0]).replace("__B__", TITULO[1]))
    (OUT / "capa.html").write_text(html, encoding="utf-8")
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = b.new_page(viewport={"width": 1080, "height": 1920}); pg.goto((OUT / "capa.html").as_uri()); pg.wait_for_timeout(600)
        pg.locator("#capa").screenshot(path=str(OUT / "capa-reels-1080x1920.png"))
        b.close()
    im = Image.open(OUT / "capa-reels-1080x1920.png")
    im.crop((0, 240, 1080, 1680)).save(OUT / "_prova-grade-3x4.png")
    print("ok")


if __name__ == "__main__":
    main()
