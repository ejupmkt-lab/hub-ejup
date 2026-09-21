#!/usr/bin/env python3
"""Capa de feed 1080×1440 para o artigo sobre a responsabilização de ministros
do STF. Foto: a Justiça de Ceschiatti diante do Supremo, em duotone navy."""
import base64, pathlib, sys
from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills/ejup-design/assets/fonts"
LOGO = RAIZ / "skills/ejup-design/assets/logo/ejup-horizontal-white.svg"
FACES = [("Gotham-Light.otf", 300), ("Gotham-Medium.otf", 500), ("Gotham-Black.otf", 900)]

def foto():
    im = Image.open(OUT / "fotos/estatua.jpg").convert("RGB")
    # janela: estátua à direita, prédio atrás; corte alto para caber 1080×1440
    w, h = im.size
    im = im.crop((int(w*.30), 0, int(w*.98), h))
    esc = max(1080/im.width, 1440/im.height)
    im = im.resize((round(im.width*esc), round(im.height*esc)), Image.LANCZOS)
    x = (im.width-1080)//2; im = im.crop((x, 0, x+1080, 1440))
    cinza = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=(1, 3))
    duo = ImageOps.colorize(cinza, black=(3, 14, 26), white=(126, 156, 186))
    im = Image.blend(im, duo, .78)
    dest = HERE / "foto.webp"; im.save(dest, "WEBP", quality=88, method=6)
    return "data:image/webp;base64," + base64.b64encode(dest.read_bytes()).decode()

def fontes():
    return "\n".join("@font-face{font-family:'Gotham';font-weight:%d;src:url(data:font/otf;base64,%s) format('opentype')}"
                     % (p, base64.b64encode((FONTS/n).read_bytes()).decode()) for n, p in FACES)

html = (HERE / "template.html").read_text()
for k, v in (("__FONTS__", fontes()), ("__FOTO__", foto()), ("__LOGO__", LOGO.read_text())):
    if k not in html: sys.exit("marcador ausente: " + k)
    html = html.replace(k, v)
(OUT / "capa.html").write_text(html)
print("gerado capa.html")
