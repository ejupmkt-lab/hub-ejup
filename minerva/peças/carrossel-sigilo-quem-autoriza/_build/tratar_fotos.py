#!/usr/bin/env python3
"""Recorta e tinge as fotografias, uma por uso.

Cada tela recebe o próprio recorte, já na medida em que entra. Tom: duotone
navy misturado meio a meio com o original, para a imagem continuar
reconhecível e ainda assim ficar como fundo.

Uma das fotografias sai em dobro (2160 de largura) e é cortada ao meio: cada
metade vai para uma tela consecutiva, e passar o dedo percorre a imagem.
"""
import pathlib

from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
FOTOS = HERE.parent / "fotos"
DEST = HERE / "duotone"
SOMBRA, LUZ = (3, 14, 26), (126, 156, 186)
MISTURA = 0.5
# fotos com luz colorida fora da paleta entram com duotone quase puro
FORTE = {"stf-lateral": 0.92, "biblioteca": 0.7}

# nome → (arquivo, janela em fração x0,y0,x1,y1, largura, altura)
USOS = {
    "arquivo-galeria": ("arquivo-galeria.jpg", (0.00, 0.10, 1.00, 0.92),
                        1080, 700),
    "stf-lateral": ("stf-lateral.jpg", (0.00, 0.10, 1.00, 0.96), 1080, 680),
    "senado-comissao": ("senado-comissao.jpg", (0.00, 0.00, 1.00, 1.00),
                        1080, 640),
    "banco-central": ("banco-central.jpg", (0.00, 0.18, 1.00, 1.00),
                      1080, 700),
    # esta sai em dobro e é fatiada em duas telas
    "arquivo-caixas": ("arquivo-caixas.jpg", (0.00, 0.06, 1.00, 1.00),
                       2160, 700),
    "biblioteca": ("biblioteca.jpg", (0.00, 0.00, 1.00, 1.00), 1080, 640),
}


def tingir(im: Image.Image, mistura: float = MISTURA) -> Image.Image:
    cinza = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=(1, 3))
    duo = ImageOps.colorize(cinza, black=SOMBRA, white=LUZ)
    return Image.blend(im, duo, mistura)


def recortar(im: Image.Image, jan, w, h) -> Image.Image:
    x0, y0, x1, y1 = jan
    im = im.crop((int(im.width * x0), int(im.height * y0),
                  int(im.width * x1), int(im.height * y1)))
    esc = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * esc), round(im.height * esc)),
                   Image.LANCZOS)
    ex, ey = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((ex, ey, ex + w, ey + h))


def main() -> None:
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
