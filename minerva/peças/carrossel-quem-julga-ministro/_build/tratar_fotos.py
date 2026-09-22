#!/usr/bin/env python3
"""Recorta e tinge as fotografias do carrossel, uma por uso.

Duotone navy misturado com o original, para a imagem continuar reconhecível
e ainda assim ficar como fundo. A colunata sai em dobro (2160 de largura) e
é fatiada em duas telas consecutivas: passar o dedo percorre a mesma imagem.
"""
import pathlib

from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
FOTOS = HERE.parent / "fotos"
DEST = HERE / "duotone"
SOMBRA, LUZ = (3, 14, 26), (126, 156, 186)
MISTURA = 0.5
FORTE = {"stf-fachada": 0.72, "senado-plenario": 0.88,
         "stf-plenario": 0.95, "colunata": 1.0}

# nome → (arquivo, janela x0,y0,x1,y1, largura, altura, fatias)
# Fatias maiores que a tela escorrem para a vizinha: o pedaço além de 1080
# vira o "rabo" que entra pela borda esquerda da tela seguinte.
USOS = {
    "stf-fachada": ("stf-fachada.jpg", (0.00, 0.12, 1.00, 0.80), 1440, 900,
                    [("stf-fachada", 0, 1080), ("stf-fachada-rabo", 1080, 1440)]),
    "oab-sede": ("antigo-stf.jpg", (0.00, 0.08, 1.00, 0.92), 1440, 900,
                 [("oab-sede", 0, 1080), ("oab-sede-rabo", 1080, 1440)]),
    "stf-plenario": ("stf-plenario.jpg", (0.12, 0.00, 0.64, 0.58), 1080, 900,
                     [("stf-plenario", 0, 1080)]),
    "senado-plenario": ("senado-plenario.jpg", (0.00, 0.10, 1.00, 1.00),
                        1440, 900,
                        [("senado-plenario", 0, 1080),
                         ("senado-plenario-rabo", 1080, 1440)]),
    "colunata": ("colunata.jpg", (0.00, 0.04, 1.00, 0.72), 2880, 900,
                 [("colunata-cabeca", 0, 360), ("colunata-esq", 360, 1440),
                  ("colunata-dir", 1440, 2520), ("colunata-rabo", 2520, 2880)]),
    "oab-conselho": ("antigo-stf-2.jpg", (0.18, 0.30, 0.82, 0.64), 1080, 900,
                     [("oab-conselho", 0, 1080)]),
}


def tingir(im, mistura=MISTURA):
    cinza = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=(1, 3))
    duo = ImageOps.colorize(cinza, black=SOMBRA, white=LUZ)
    return Image.blend(im, duo, mistura)


def recortar(im, jan, w, h):
    x0, y0, x1, y1 = jan
    im = im.crop((int(im.width * x0), int(im.height * y0),
                  int(im.width * x1), int(im.height * y1)))
    esc = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * esc), round(im.height * esc)),
                   Image.LANCZOS)
    ex, ey = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((ex, ey, ex + w, ey + h))


def main():
    DEST.mkdir(exist_ok=True)
    for nome, (arq, jan, w, h, fatias) in USOS.items():
        origem = FOTOS / arq
        if not origem.exists():
            print(f"  (falta {arq})")
            continue
        out = tingir(recortar(Image.open(origem).convert("RGB"), jan, w, h),
                     FORTE.get(nome, MISTURA))
        for fn, x0, x1 in fatias:
            saida = DEST / f"{fn}.webp"
            out.crop((x0, 0, x1, h)).save(saida, "WEBP", quality=86, method=6)
            print(f"{saida.name}: {x1 - x0}x{h} ({saida.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
