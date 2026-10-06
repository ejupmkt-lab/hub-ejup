#!/usr/bin/env python3
"""Prepara o retrato para entrar na capa.

Dois caminhos, escolhidos pelo próprio arquivo:

* **`foto.png` com recorte** (fundo já removido): apara pela silhueta, reduz e
  esfuma **só a base**, para o busto se dissolver no piso escuro da capa em vez
  de terminar num corte reto. É o caso atual.
* **`foto.jpg` sem recorte**: entra inteira com alpha em degradê nas quatro
  bordas. Serve porque o fundo do estúdio é quase preto e se funde ao navy —
  recortar terno escuro sobre fundo escuro é justamente onde GrabCut falha.

Em ambos reduz para 2100px de altura: o original tem 6000 e vai embutido em
base64 nos três formatos do mesmo arquivo.
"""
import pathlib
import sys

from PIL import Image, ImageFilter

HERE = pathlib.Path(__file__).resolve().parent
PASTA = HERE.parent
DEST = HERE / "foto-tratada.webp"

ALTURA = 2100
FADE_BASE = 0.09                       # recortada: a base
FADE_DIR = 0.10                        # e as laterais onde o corpo encosta na borda
FADE_INTEIRA = {"esq": .20, "dir": .12, "topo": .06, "base": .16}


def tem_recorte(im: Image.Image) -> bool:
    if im.mode not in ("RGBA", "LA"):
        return False
    h = im.getchannel("A").histogram()
    return h[0] / (im.size[0] * im.size[1]) > 0.10


def faixa(alpha: Image.Image, n: int, eixo: str, inicio: bool) -> None:
    if n <= 0:
        return
    w, h = alpha.size
    px = alpha.load()
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


def main() -> None:
    origem = next((PASTA / f"foto.{e}" for e in ("png", "jpg", "jpeg")
                   if (PASTA / f"foto.{e}").exists()), None)
    if origem is None:
        sys.exit("nenhuma foto.png/.jpg na pasta da peça")

    im = Image.open(origem)
    recortada = tem_recorte(im)
    im = im.convert("RGBA")

    if recortada:
        im = im.crop(im.getchannel("A").point(lambda v: 255 if v > 8 else 0)
                     .getbbox())
    else:
        w, h = im.size
        im = im.crop((int(w * .10), int(h * .05), int(w * .95), h))

    im = im.resize((round(im.width * ALTURA / im.height), ALTURA), Image.LANCZOS)

    a = im.getchannel("A")
    if recortada:
        faixa(a, int(ALTURA * FADE_BASE), "y", False)
        # onde o ensaio cortou o corpo na borda do quadro (manga, cabelo,
        # ombro), esfuma esse lado para não terminar numa linha reta
        w, h = a.size
        for lado, caixa, eixo, ini in (("esq", (0, 0, 3, h), "x", True),
                                       ("dir", (w - 3, 0, w, h), "x", False)):
            if a.crop(caixa).getextrema()[1] > 200:
                faixa(a, int(w * FADE_DIR), eixo, ini)
    else:
        for lado, eixo, ini in (("esq", "x", True), ("dir", "x", False),
                                ("topo", "y", True), ("base", "y", False)):
            n = int((im.width if eixo == "x" else ALTURA) * FADE_INTEIRA[lado])
            faixa(a, n, eixo, ini)
    im.putalpha(a.filter(ImageFilter.GaussianBlur(4 if recortada else 6)))

    im.save(DEST, "WEBP", quality=90, method=6)
    print(f"{DEST.name}: {im.size[0]}×{im.size[1]}, "
          f"{'com recorte' if recortada else 'sem recorte'} "
          f"({DEST.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
