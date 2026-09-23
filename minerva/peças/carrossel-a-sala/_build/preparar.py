#!/usr/bin/env python3
"""Prepara as imagens geradas no Higgsfield (gpt_image_2_5, 880x1168).

Corta 1,5% de borda (algumas saem com filete escuro), leva a 1080x1440 e
salva em JPEG. O recorte da cadeira (PNG com alfa) segue o mesmo corte para
casar pixel a pixel com o fundo da capa.
"""
import pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
GER = HERE.parent / "gerado"
OUT = HERE / "img"
W, H = 1080, 1440


def ajustar(im):
    w, h = im.size
    m = int(w * 0.015)
    im = im.crop((m, int(m * h / w), w - m, h - int(m * h / w)))
    return im.resize((W, H), Image.LANCZOS)


def main():
    OUT.mkdir(exist_ok=True)
    for i in range(10):
        ajustar(Image.open(GER / f"g{i}.png").convert("RGB")).save(OUT / f"g{i}.jpg", quality=90)
    ajustar(Image.open(GER / "g0-recorte.png").convert("RGBA")).save(OUT / "cadeira.png")
    print("ok")


if __name__ == "__main__":
    main()
