#!/usr/bin/env python3
"""Fotos reais tratadas como cópia impressa de dossiê.

Preto e branco frio (sem sépia, que o mapa imagético veta), contraste de
cópia, grão de papel fotográfico e leve vinheta. O rosto não é alterado:
só cor, contraste e textura.
"""
import pathlib
import random
from PIL import Image, ImageOps, ImageEnhance, ImageFilter

HERE = pathlib.Path(__file__).resolve().parent
F = HERE.parent / "fotos"
OUT = HERE / "img"
FOTOS = {"toffoli": "toffoli.png", "moraes": "moraes.png", "gilmar": "gilmar.png",
         "mendonca": "mendonca.jpg", "vorcaro": "vorcaro.jpg"}
LARG = 900


def copia(im):
    w, h = im.size
    if w / h > .75:
        nw = int(h * .75); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / .75); im = im.crop((0, 0, w, nh))
    im = im.resize((LARG, int(LARG / .75)), Image.LANCZOS)
    g = ImageOps.grayscale(im)
    g = ImageOps.autocontrast(g, cutoff=(2, 1))
    g = ImageEnhance.Contrast(g).enhance(1.18)
    # grão de papel fotográfico
    random.seed(7)
    ruido = Image.effect_noise(g.size, 38).filter(ImageFilter.GaussianBlur(.6))
    g = Image.blend(g, ruido, .09)
    # vinheta
    mask = Image.new("L", g.size, 0)
    from PIL import ImageDraw
    ImageDraw.Draw(mask).ellipse((-g.width * .25, -g.height * .2, g.width * 1.25, g.height * 1.2), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(120))
    escuro = ImageEnhance.Brightness(g).enhance(.62)
    g = Image.composite(g, escuro, mask)
    # tinta fria de cópia: sombra navy, luz papel
    return ImageOps.colorize(g, black=(10, 16, 24), white=(236, 234, 228))


def recorte(im):
    w, h = im.size
    if w / h > .75:
        nw = int(h * .75); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / .75); im = im.crop((0, 0, w, nh))
    return im.resize((LARG, int(LARG / .75)), Image.LANCZOS)


def main():
    """Quando existe a versão texturizada no Higgsfield (*-ia.png, rosto
    preservado e conferido), ela entra só com recorte e o mesmo tom frio.
    Sem ela, o tratamento é todo em código."""
    for nome, arq in FOTOS.items():
        ia = F / f"{nome}-ia.png"
        if ia.exists():
            g = ImageOps.grayscale(recorte(Image.open(ia).convert("RGB")))
            out = ImageOps.colorize(g, black=(10, 16, 24), white=(236, 234, 228))
        else:
            out = copia(Image.open(F / arq).convert("RGB"))
        out.save(OUT / f"foto-{nome}.jpg", quality=90)
        print(nome, "higgsfield" if ia.exists() else "código")


if __name__ == "__main__":
    main()
