#!/usr/bin/env python3
"""Recorta e tinge as gravuras, uma por uso, já na medida da tela.

Gravura em papel claro vira duotone navy → prata: some o tom de papel antigo
(sépia é vetado no mapa imagético) e a imagem fica como fundo da marca.
"""
import pathlib

from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
FOTOS = HERE.parent / "fotos"
DEST = HERE / "duotone"
SOMBRA, LUZ = (2, 12, 24), (150, 172, 194)

# área útil de cada gravura (sem margem de papel), em pixels do original
PLACA = {
    "manet": ("manet-maximiliano.jpg", (70, 70, 3820, 2940)),
    "goya": ("goya-no-se-puede-mirar.jpg", (880, 645, 2805, 1890)),
    "hogarth": ("hogarth-tyburn.jpg", (200, 180, 3450, 2090)),
    "venda-a": ("higgsfield-venda-a.png", None),
    "venda-b": ("higgsfield-venda-b.png", None),
}
# imagem gerada (Higgsfield): só esfria a cor, sem virar gravura
GERADAS = {"venda-a", "venda-b"}

# nome → (placa, janela em fração x0,y0,x1,y1 da placa, largura, altura)
USOS = {
    "capa": ("manet", (0.08, 0.00, 0.80, 1.00), 1080, 1440),
    "pelotao": ("manet", (0.00, 0.12, 1.00, 0.80), 1080, 760),
    "muro": ("manet", (0.00, 0.00, 1.00, 0.42), 1080, 640),
    "botas": ("manet", (0.10, 0.55, 1.00, 1.00), 1080, 620),
    "goya": ("goya", (0.00, 0.00, 1.00, 1.00), 1080, 1440),
    "baionetas": ("goya", (0.45, 0.05, 1.00, 0.95), 1080, 700),
    "tyburn": ("hogarth", (0.00, 0.00, 1.00, 1.00), 1080, 1440),
    "arquibancada": ("hogarth", (0.55, 0.00, 1.00, 0.75), 1080, 760),
    # fundos de página inteira para as telas de texto (marca d'água)
    "fundo-manet-a": ("manet", (0.00, 0.05, 0.55, 1.00), 1080, 1440),
    "fundo-manet-b": ("manet", (0.40, 0.00, 1.00, 1.00), 1080, 1440),
    "fundo-hogarth-a": ("hogarth", (0.00, 0.10, 0.55, 1.00), 1080, 1440),
    "fundo-hogarth-b": ("hogarth", (0.45, 0.00, 1.00, 1.00), 1080, 1440),
    "fundo-goya": ("goya", (0.05, 0.00, 0.85, 1.00), 1080, 1440),
    # versão 3
    "capa-venda": ("venda-a", (0.00, 0.00, 1.00, 1.00), 1080, 1440),
    "faixa-venda": ("venda-b", (0.00, 0.02, 1.00, 0.52), 1080, 600),
    "panorama": ("hogarth", (0.00, 0.00, 1.00, 0.66), 2160, 620),
}
# versão clara (traço navy sobre papel), para as telas de fundo papel
CLARAS = {"fundo-manet-a", "fundo-hogarth-a", "fundo-goya"}
PAPEL = (243, 240, 233)


def tingir(im, luz=LUZ, sombra=SOMBRA):
    cinza = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=(1, 1))
    return ImageOps.colorize(cinza, black=sombra, white=luz)


def recortar(im, jan, w, h):
    x0, y0, x1, y1 = jan
    im = im.crop((int(im.width * x0), int(im.height * y0), int(im.width * x1), int(im.height * y1)))
    esc = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * esc), round(im.height * esc)), Image.LANCZOS)
    ex, ey = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((ex, ey, ex + w, ey + h))


def main():
    DEST.mkdir(exist_ok=True)
    placas = {}
    for k, (arq, box) in PLACA.items():
        im = Image.open(FOTOS / arq).convert("RGB")
        placas[k] = im.crop(box) if box else im
    for nome, (pl, jan, w, h) in USOS.items():
        rec = recortar(placas[pl], jan, w, h)
        if pl in GERADAS:
            duo = ImageOps.colorize(ImageOps.grayscale(rec), black=(1, 8, 18), white=(222, 230, 238))
            variantes = [(nome, Image.blend(rec, duo, 0.45))]
        else:
            variantes = [(nome, tingir(rec))]
        if nome in CLARAS:
            variantes.append((nome + "-claro", tingir(rec, PAPEL, (3, 28, 55))))
        for n, out in variantes:
            saida = DEST / f"{n}.jpg"
            out.save(saida, quality=86, optimize=True)
            print(f"{saida.name}: {out.size} ({saida.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
