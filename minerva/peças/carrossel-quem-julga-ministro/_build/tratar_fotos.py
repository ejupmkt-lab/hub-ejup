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
FORTE = {"stf-fachada": 0.72, "senado-plenario": 0.88, "stf-plenario": 0.85}

USOS = {
    "stf-fachada": ("stf-fachada.jpg", (0.02, 0.10, 0.98, 0.86), 1080, 680),
    "oab-sede": ("antigo-stf.jpg", (0.00, 0.08, 1.00, 0.92), 1080, 700),
    "stf-plenario": ("stf-plenario.jpg", (0.00, 0.00, 1.00, 1.00), 1080, 640),
    "senado-plenario": ("senado-plenario.jpg", (0.00, 0.10, 1.00, 1.00),
                        1080, 700),
    "colunata": ("colunata.jpg", (0.00, 0.10, 1.00, 0.98), 2160, 700),
    "oab-conselho": ("antigo-stf-2.jpg", (0.00, 0.10, 1.00, 0.88), 1080, 660),
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
    for nome, (arq, jan, w, h) in USOS.items():
        origem = FOTOS / arq
        if not origem.exists():
            print(f"  (falta {arq})")
            continue
        out = tingir(recortar(Image.open(origem).convert("RGB"), jan, w, h),
                     FORTE.get(nome, MISTURA))
        if out.width > 1080:
            for lado, x in (("esq", 0), ("dir", 1080)):
                saida = DEST / f"{nome}-{lado}.webp"
                out.crop((x, 0, x + 1080, out.height)).save(
                    saida, "WEBP", quality=86, method=6)
                print(f"{saida.name}: {saida.stat().st_size/1024:.0f} KB")
            continue
        saida = DEST / f"{nome}.webp"
        out.save(saida, "WEBP", quality=86, method=6)
        print(f"{saida.name}: {out.size} ({saida.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
