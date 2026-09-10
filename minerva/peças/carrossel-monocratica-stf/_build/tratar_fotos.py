#!/usr/bin/env python3
"""Recorta e tinge as fotografias, uma por uso.

Cada tela com foto recebe o próprio recorte, já na medida em que entra, para
não haver zoom no navegador: o que se vê é o enquadramento decidido aqui.
Tom: duotone navy misturado meio a meio com o original, para a foto ficar
reconhecível (a crítica ao carrossel anterior) e ainda assim fundo.
"""
import pathlib

from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
FOTOS = HERE.parent / "fotos"
DEST = HERE / "duotone"
SOMBRA, LUZ = (3, 14, 26), (126, 156, 186)
MISTURA = 0.5        # 0 = original · 1 = duotone puro

# nome → (arquivo, janela em fração x0,y0,x1,y1, largura, altura de saída)
USOS = {
    # tela 1: a Justiça de Ceschiatti diante do STF
    "estatua": ("estatua.jpg", (0.00, 0.00, 0.86, 1.00), 1080, 900),
    # tela 3: o Congresso, porque a frase popular aponta para outro Poder
    "congresso": ("congresso-alto.jpg", (0.08, 0.00, 0.92, 1.00), 1080, 860),
    # tela 4: duas caixas, uma por coluna
    "senado": ("senado-teto.jpg", (0.10, 0.05, 0.90, 0.95), 420, 460),
    "tribunal": ("plenario-vazio.jpg", (0.36, 0.10, 0.95, 0.95), 420, 460),
    # tela 7: sessão plenária, sem a parede da direita (crucifixo)
    "sessao": ("sessao.jpg", (0.00, 0.04, 0.76, 1.00), 1080, 780),
    # tela 8: dentro do painel dourado do Plenário
    "plenario": ("plenario-vazio.jpg", (0.05, 0.15, 0.95, 0.95), 560, 360),
    # tela 9: a fachada, ao fim do dia
    "fachada": ("fachada.jpg", (0.05, 0.00, 0.95, 1.00), 1080, 760),
}


def tingir(im: Image.Image) -> Image.Image:
    cinza = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=(1, 3))
    duo = ImageOps.colorize(cinza, black=SOMBRA, white=LUZ)
    return Image.blend(im, duo, MISTURA)


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
        im = Image.open(FOTOS / arq).convert("RGB")
        out = tingir(recortar(im, jan, w, h))
        saida = DEST / f"{nome}.webp"
        out.save(saida, "WEBP", quality=86, method=6)
        print(f"{saida.name}: {out.size} ({saida.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
