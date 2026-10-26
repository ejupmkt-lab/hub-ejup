#!/usr/bin/env python3
"""Leva as imagens geradas no Higgsfield a 1080x1440 e mede o papel da cortiça."""
import json, pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
GER, OUT = HERE.parent / "gerado", HERE / "img"
W, H = 1080, 1440
NOMES = ["capa", "aeroporto", "banco", "cdb", "celular", "plenario",
         "cadeira", "reuniao", "contrato", "sala"]


def ajustar(im, m=.015):
    w, h = im.size
    dx, dy = int(w * m), int(h * m)
    return im.crop((dx, dy, w - dx, h - dy)).resize((W, H), Image.LANCZOS)


def main():
    OUT.mkdir(exist_ok=True)
    for i, n in enumerate(NOMES):
        m = .03 if n in ("plenario", "sala") else .015
        ajustar(Image.open(GER / f"v{i}.png").convert("RGB"), m).save(OUT / f"{n}.jpg", quality=90)
    ajustar(Image.open(GER / "v0-recorte.png").convert("RGBA")).save(OUT / "objetos.png")
    a = Image.open(OUT / "objetos.png").split()[-1].getbbox()
    print("objetos:", a)


if __name__ == "__main__":
    main()
