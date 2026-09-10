#!/usr/bin/env python3
"""Converte as fotos para duotone navy e grava em WebP.

A foto entra na peça como matéria da marca, não como imagem crua: vira duotone
sobre a primária. É o mesmo tratamento do carrossel de superendividamento, que
foi aprovado, e é o que permite foto de banco conviver com a paleta de oito
cores sem inventar cor nova.
"""
import pathlib

from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
FOTOS = HERE.parent / "fotos"
DEST = HERE / "duotone"

# sombra e luz do duotone: navy profundo até um azul-prata claro
SOMBRA, LUZ = (3, 16, 30), (168, 198, 224)

# largura de saída por uso: fundo sangrado precisa cobrir 1080 de largura;
# caixa de imagem ocupa a coluna útil de 920
# tudo sangrado agora: no sistema aprovado a foto ocupa a tela inteira e o
# scrim escurece só a parte de baixo
ALVOS = {"colunas": (1080, 1440), "congresso": (1080, 1440),
         "congresso2": (1080, 1440), "acervo": (1080, 1440)}

# recorte relativo aplicado ANTES do enquadramento, quando a foto inteira não
# serve. `declaracao` precisa: o formulário original está de cabeça para baixo
# e em inglês, então fecha-se na mão e na caneta, onde não se lê texto.
RECORTE = {}

# quanto do duotone entra. 1 = duotone puro. A vegetação fica irreconhecível
# em duotone cheio (parece floresta congelada), então ela mistura com o
# original e mantém o verde suficiente para ler como mata.
MISTURA = {}


def duotone(im: Image.Image, mistura: float = 1.0) -> Image.Image:
    cinza = ImageOps.grayscale(im)
    # leve compressão de contraste antes de tingir: duotone em imagem muito
    # contrastada estoura a luz e perde o meio-tom
    cinza = ImageOps.autocontrast(cinza, cutoff=(1, 3))
    tingida = ImageOps.colorize(cinza, black=SOMBRA, white=LUZ)
    if mistura >= 1:
        return tingida
    return Image.blend(im, tingida, mistura)


def cobrir(im: Image.Image, w: int, h: int) -> Image.Image:
    escala = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * escala), round(im.height * escala)),
                   Image.LANCZOS)
    esq = (im.width - w) // 2
    topo = int((im.height - h) * 0.35)      # 0.35: privilegia o terço superior
    return im.crop((esq, topo, esq + w, topo + h))


def main() -> None:
    DEST.mkdir(exist_ok=True)
    for nome, (w, h) in ALVOS.items():
        orig = FOTOS / f"{nome}.jpg"
        if not orig.exists():
            print(f"ausente: {orig.name}")
            continue
        im = Image.open(orig).convert("RGB")
        if nome in RECORTE:
            x0, y0, x1, y1 = RECORTE[nome]
            im = im.crop((int(im.width * x0), int(im.height * y0),
                          int(im.width * x1), int(im.height * y1)))
        im = duotone(im, MISTURA.get(nome, 1.0))
        im = cobrir(im, w, h)
        saida = DEST / f"{nome}.webp"
        im.save(saida, "WEBP", quality=86, method=6)
        print(f"{saida.name}: {w}×{h} ({saida.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
