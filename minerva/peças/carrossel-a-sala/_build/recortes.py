#!/usr/bin/env python3
"""Recortes dos frames gravados no set da Sala.

Leve correção de cor para aproximar do navy da marca sem apagar o look do
set: saturação um pouco abaixo e 18% de duotone navy por cima.
"""
import pathlib
from PIL import Image, ImageEnhance, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
FOTOS = HERE.parent / "fotos"
OUT = HERE / "recortes"
SOMBRA, LUZ = (3, 12, 24), (170, 188, 204)

# nome → (arquivo, caixa x0,y0,x1,y1 em px do original 2576x1449, saída)
CORTES = {
    "capa": ("sala-confissao.jpg", (744, 0, 1831, 1449), (1080, 1440)),
    "vazia": ("sala-vazia.jpg", (744, 0, 1831, 1449), (1080, 1440)),
    "detalhe": ("sala-vazia.jpg", (644, 900, 1956, 1449), (1080, 452)),
    "rosto": ("sala-confissao.jpg", (919, 40, 1619, 973), (1080, 1440)),
    "maos": ("sala-confissao.jpg", (700, 900, 1876, 1449), (1080, 504)),
    "simbolo": ("sala-vazia.jpg", (1000, 170, 1620, 610), (620, 440)),
    "fr-maos": ("sala-confissao.jpg", (880, 1060, 1700, 1449), (620, 440)),
    "fr-vazia": ("sala-vazia.jpg", (500, 300, 2076, 1419), (620, 440)),
    "vazia-43": ("sala-vazia.jpg", (650, 100, 1930, 1060), (720, 540)),
    "maos-43": ("sala-confissao.jpg", (820, 720, 1796, 1449), (640, 478)),
}


def tratar(im):
    im = ImageEnhance.Color(im).enhance(0.82)
    im = ImageEnhance.Brightness(im).enhance(1.12)
    duo = ImageOps.colorize(ImageOps.grayscale(im), black=SOMBRA, white=LUZ)
    return Image.blend(im, duo, 0.18)


def main():
    OUT.mkdir(exist_ok=True)
    for nome, (arq, caixa, tam) in CORTES.items():
        im = Image.open(FOTOS / arq).convert("RGB").crop(caixa)
        im = tratar(im.resize(tam, Image.LANCZOS))
        im.save(OUT / f"{nome}.jpg", quality=88)
        print(nome, tam)


if __name__ == "__main__":
    main()
