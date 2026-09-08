#!/usr/bin/env python3
"""Prepara o retrato para entrar na capa sem borda dura.

Não há recorte aqui de propósito: o fundo do estúdio é quase preto e o terno é
azul-escuro — separar um do outro é justamente onde GrabCut falha. Em vez de
recortar, a foto entra inteira com **alpha em degradê nas quatro bordas**, e o
fundo escuro dela se dissolve no navy da capa.

Também reduz a resolução: o arquivo original é 4000×6000 (4,5 MB) e vai
embutido em base64 em três formatos; 2100px de altura já é o dobro do que a
maior aplicação usa.
"""
import pathlib

from PIL import Image, ImageDraw, ImageFilter

HERE = pathlib.Path(__file__).resolve().parent
ORIG = HERE.parent / "foto.jpg"
# WebP e não PNG: a mesma imagem com alpha sai ~10x menor, e ela vai
# embutida em base64 nos três formatos do mesmo arquivo
DEST = HERE / "foto-tratada.webp"

ALTURA = 2100
# fração de cada borda que vira degradê até o transparente
FADE = {"esq": 0.20, "dir": 0.12, "topo": 0.06, "base": 0.16}


def degrade(tam: tuple) -> Image.Image:
    w, h = tam
    a = Image.new("L", tam, 255)
    px = a.load()
    def faixa(n, eixo, inicio):
        if n <= 0:
            return
        for i in range(n):
            v = int(255 * (i / n) ** 1.4)
            if eixo == "x":
                x = i if inicio else w - 1 - i
                for y in range(h):
                    px[x, y] = min(px[x, y], v)
            else:
                y = i if inicio else h - 1 - i
                for x in range(w):
                    px[x, y] = min(px[x, y], v)
    faixa(int(w * FADE["esq"]), "x", True)
    faixa(int(w * FADE["dir"]), "x", False)
    faixa(int(h * FADE["topo"]), "y", True)
    faixa(int(h * FADE["base"]), "y", False)
    return a.filter(ImageFilter.GaussianBlur(6))


def main() -> None:
    im = Image.open(ORIG).convert("RGB")
    # o enquadramento original sobra à esquerda; aperta em volta do retratado
    w, h = im.size
    im = im.crop((int(w * .10), int(h * .05), int(w * .95), h))
    im = im.resize((round(im.width * ALTURA / im.height), ALTURA),
                   Image.LANCZOS)
    im = im.convert("RGBA")
    im.putalpha(degrade(im.size))
    im.save(DEST, "WEBP", quality=88, method=6)
    print(f"{DEST.name}: {im.size[0]}×{im.size[1]} "
          f"({DEST.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
