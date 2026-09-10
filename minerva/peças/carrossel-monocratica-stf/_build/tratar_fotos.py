#!/usr/bin/env python3
"""Corta UMA fotografia em cinco fatias, uma por tela escura.

O carrossel inteiro roda sobre uma imagem só. As telas escuras são recortes
consecutivos dela, na ordem, então passar o dedo é **percorrer a fotografia**:
a arcada continua de uma tela para a seguinte, e o ponto de fuga cai no meio
do argumento. As telas claras entram como pausas, e quando o escuro volta a
imagem retoma de onde parou.

É o mesmo princípio da tela única de 15.120px do carrossel de
superendividamento, que foi aprovado, mas resolvido de outro jeito: lá uma
curva desenhada atravessava as telas; aqui é a própria fotografia que
atravessa.

A conta que torna isso possível: cinco telas escuras somam 5400×1440. O
original tem 6000×4000, então a faixa sai por **redução**, sem esticar pixel.
"""
import pathlib

from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
FOTOS = HERE.parent / "fotos"
DEST = HERE / "duotone"

# luz baixa de propósito: a faixa é fundo, e o texto vive por cima
SOMBRA, LUZ = (3, 14, 26), (126, 156, 186)

ORIGEM = "arcada.jpg"
FATIAS = 5                      # telas escuras
LARG, ALT = 1080, 1440
# Janela recortada do original, em fração (x0, x1, y0, y1). O corte em x
# termina antes da borda direita para deixar de fora a grade com um crucifixo:
# símbolo religioso não entra em peça sobre o Supremo. O corte em y mantém as
# arcadas e o ponto de fuga e descarta o piso vazio.
JANELA = (0.00, 0.84, 0.05, 0.52)


def duotone(im: Image.Image) -> Image.Image:
    cinza = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=(1, 3))
    return ImageOps.colorize(cinza, black=SOMBRA, white=LUZ)


def main() -> None:
    DEST.mkdir(exist_ok=True)
    im = Image.open(FOTOS / ORIGEM).convert("RGB")
    x0, x1, y0, y1 = JANELA
    faixa = im.crop((int(im.width * x0), int(im.height * y0),
                     int(im.width * x1), int(im.height * y1)))

    alvo_l, alvo_a = LARG * FATIAS, ALT
    escala = max(alvo_l / faixa.width, alvo_a / faixa.height)
    faixa = faixa.resize((round(faixa.width * escala),
                          round(faixa.height * escala)), Image.LANCZOS)
    esq = (faixa.width - alvo_l) // 2
    topo = (faixa.height - alvo_a) // 2
    faixa = faixa.crop((esq, topo, esq + alvo_l, topo + alvo_a))
    faixa = duotone(faixa)
    print(f"faixa contínua: {faixa.width}×{faixa.height}")

    for i in range(FATIAS):
        pedaco = faixa.crop((i * LARG, 0, (i + 1) * LARG, ALT))
        saida = DEST / f"pan{i + 1}.webp"
        pedaco.save(saida, "WEBP", quality=88, method=6)
        print(f"  {saida.name}: {pedaco.size} "
              f"({saida.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
