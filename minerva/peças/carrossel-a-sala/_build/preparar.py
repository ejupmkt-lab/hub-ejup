#!/usr/bin/env python3
"""Prepara as imagens geradas no Higgsfield para as telas 1080x1440.

Duas famílias de imagem:
- g*.png (gpt_image_2_5, 880x1168): cenas genéricas (porta, feixe, livro,
  projetor);
- r*.png (gpt_image_2_5 com a foto real da Sala como referência, 1744x2336):
  tudo o que precisa bater com o set gravado. As versões *e.png são edições
  que tiraram da mesa os objetos de cena da gravação de teste.

Corta a borda lateral (algumas saem com filete de película), leva a 1080x1440
e mede onde está o papel preso na cortiça, para o símbolo da EJUP entrar ali.
"""
import json
import pathlib
from PIL import Image, ImageDraw, ImageFilter

HERE = pathlib.Path(__file__).resolve().parent
GER = HERE.parent / "gerado"
OUT = HERE / "img"
W, H = 1080, 1440

FONTES = {  # nome na tela → (arquivo, fração cortada em cada lado)
    "capa": ("r0.png", .015), "cadeira": ("r0-recorte.png", .015),
    "porta": ("g1.png", .015), "sala": ("r1e.png", .035),
    "feixe": ("g3.png", .015), "assinatura": ("r4e.png", .02),
    "livro": ("g5.png", .015), "projetor": ("g6.png", .015),
    "provas": ("r3.png", .02), "contraplano": ("r2e.png", .035),
    "cortica": ("r5.png", .02),
}
PAPEL = ("sala", "contraplano", "cortica")


def ajustar(im, m):
    w, h = im.size
    dx, dy = int(w * m), int(h * m)
    return im.crop((dx, dy, w - dx, h - dy)).resize((W, H), Image.LANCZOS)


def achar_papel(im):
    """Maior mancha clara e neutra na metade de cima: o papel na cortiça."""
    px = im.convert("RGB").load()
    xs, ys = [], []
    for y in range(int(H * .08), int(H * .62), 2):
        for x in range(int(W * .2), int(W * .8), 2):
            r, g, b = px[x, y]
            if r > 150 and g > 150 and b > 150 and max(r, g, b) - min(r, g, b) < 45:
                xs.append(x); ys.append(y)
    if not xs:
        return None
    xs.sort(); ys.sort()
    k = len(xs) // 50  # descarta pontas isoladas
    return [xs[k], ys[k], xs[-1 - k], ys[-1 - k]]


def main():
    OUT.mkdir(exist_ok=True)
    papeis = {}
    for nome, (arq, m) in FONTES.items():
        im = Image.open(GER / arq)
        im = ajustar(im.convert("RGBA" if nome == "cadeira" else "RGB"), m)
        if nome == "cadeira":
            im.save(OUT / "cadeira.png")
            continue
        if nome == "provas":
            # o documento saiu com texto em espanhol: desfoca o miolo e
            # deixa só a folha e as tarjas pretas legíveis como forma
            mask = Image.new("L", im.size, 0)
            ImageDraw.Draw(mask).polygon([(440, 820), (1010, 750), (1066, 1300), (505, 1330)], fill=255)
            im = Image.composite(im.filter(ImageFilter.GaussianBlur(4)), im, mask.filter(ImageFilter.GaussianBlur(6)))
        im.save(OUT / f"{nome}.jpg", quality=90)
        if nome in PAPEL:
            papeis[nome] = achar_papel(im)
    (OUT / "papeis.json").write_text(json.dumps(papeis))
    print(papeis)


if __name__ == "__main__":
    main()
