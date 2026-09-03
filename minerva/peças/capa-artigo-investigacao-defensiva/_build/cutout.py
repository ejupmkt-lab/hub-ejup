#!/usr/bin/env python3
"""Recorta os dois autores da capa original, gerando PNG com alpha.

Keying por cor não resolve aqui: o bege do fundo encosta no tom de pele e o
navy do fundo encosta no cinza-escuro dos ternos. Então a separação é feita por
GrabCut, semeado com regiões que sabemos serem fundo (o painel bege longe dos
corpos, o navy à esquerda) e frente (rostos, camisas, ternos).
"""
import pathlib

import cv2
import numpy as np
from PIL import Image, ImageFilter

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / "foto-autores-original.jpg"

# Os dois homens vivem à direita do quadro; à esquerda é só arte de fundo.
RECT = (900, 40, 700, 800)          # x, y, w, h

# Retângulos de FUNDO garantido (x0, y0, x1, y1)
SURE_BG = [
    (900, 0, 1600, 40),             # faixa de topo, acima das cabeças
    (900, 40, 960, 840),            # coluna à esquerda do homem da esquerda
    (1180, 40, 1270, 300),          # bege entre as duas cabeças
    (1500, 40, 1600, 260),          # bege no alto à direita
    (1148, 140, 1240, 305),         # navy remanescente entre as duas cabeças
    (1170, 300, 1255, 455),         # cunha bege atrás do ombro esquerdo
    (1500, 300, 1585, 445),         # cunha bege à direita da cabeça
    (0, 0, 900, 840),               # todo o lado do texto
]
# Retângulos de FRENTE garantida
SURE_FG = [
    (1020, 180, 1140, 460),         # rosto do homem da esquerda
    (1330, 200, 1450, 430),         # rosto do homem da direita
    (1000, 520, 1150, 830),         # terno do homem da esquerda
    (1280, 500, 1520, 830),         # terno do homem da direita
    (1060, 470, 1120, 540),         # gravata/camisa esquerda
    (1350, 460, 1410, 560),         # gravata/camisa direita
]


def main() -> None:
    bgr = cv2.imread(str(SRC))
    h, w = bgr.shape[:2]

    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    x, y, rw, rh = RECT
    mask[y:y + rh, x:x + rw] = cv2.GC_PR_FGD
    for x0, y0, x1, y1 in SURE_BG:
        mask[y0:y1, x0:x1] = cv2.GC_BGD
    for x0, y0, x1, y1 in SURE_FG:
        mask[y0:y1, x0:x1] = cv2.GC_FGD

    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(bgr, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)

    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # limpa ilhas soltas e fecha buracos internos
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, k)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, k)

    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
    if n > 1:
        keep = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 12000]
        fg = np.isin(lab, keep).astype(np.uint8) * 255
        print("componentes mantidos:", len(keep))

    alpha = Image.fromarray(fg).filter(ImageFilter.GaussianBlur(1.3))

    out = Image.open(SRC).convert("RGBA")
    out.putalpha(alpha)
    bbox = out.getbbox()
    out = out.crop(bbox)
    out.save(ROOT / "foto-autores.png")
    print("bbox:", bbox, "->", out.size, f"| frente {fg.mean()/255*100:.1f}%")

    prev = Image.new("RGB", out.size, (255, 0, 170))
    prev.paste(out, (0, 0), out)
    prev.save(HERE / "preview-recorte.png")


if __name__ == "__main__":
    main()
