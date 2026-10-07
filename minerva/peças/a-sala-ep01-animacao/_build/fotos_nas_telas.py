#!/usr/bin/env python3
"""Coloca as fotos reais nas molduras vazias das telas 04 e 06.

04 · três porta-retratos: Toffoli, Mendonça e Moraes (ordem do roteiro).
06 · ficha de Vorcaro.

A foto é levada em perspectiva até o quadro escuro da moldura, vira
monocromática tingida pela luz da cena (para não parecer colada) e ganha o
mesmo grão. Lê up/NN-base.png (o quadro sem foto) e grava up/NN.png. O mapa
de profundidade não muda: a foto fica no plano da moldura.
Créditos das fotos: peças/carrossel-caso-vorcaro/fotos/CREDITOS.md.
"""
import pathlib, shutil
import cv2
import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
UP = HERE.parent / "telas-codigo" / "up"
FOTOS = HERE.parents[1] / "carrossel-caso-vorcaro" / "fotos"

# quadriláteros (TL, TR, BR, BL) no quadro ampliado; recorte quadrado da foto (x0, y0, lado) em frações
TELAS = {
    "04": [("toffoli.png", [(220, 573), (550, 570), (545, 902), (208, 904)], (.02, .0, .96)),
           ("mendonca.jpg", [(744, 606), (1094, 604), (1090, 934), (733, 932)], (.0, .0, 1.0)),
           ("moraes.png", [(1275, 615), (1618, 617), (1615, 958), (1271, 950)], (.12, .0, .76))],
    "06": [("vorcaro.jpg", [(408, 303), (830, 340), (762, 738), (305, 692)], (.0, .02, 1.0))],
}


def foto_quadrada(nome, caixa):
    im = cv2.imread(str(FOTOS / nome))
    h, w = im.shape[:2]
    x0, y0, lado = caixa
    s = int(lado * w)
    x, y = int(x0 * w), int(y0 * h)
    return im[y:y + s, x:x + s]


def aplica(base, nome, quad, caixa, rng):
    f = foto_quadrada(nome, caixa)
    q = np.float32(quad)
    lado = f.shape[0]
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [lado, 0], [lado, lado], [0, lado]]), q)
    H, W = base.shape[:2]
    cinza = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    cinza = np.clip((cinza - .05) * 1.08, 0, 1) ** 1.1          # contraste de cópia
    warp = cv2.warpPerspective(cinza, M, (W, H), flags=cv2.INTER_AREA)
    mask = cv2.warpPerspective(np.ones((lado, lado), np.float32), M, (W, H), flags=cv2.INTER_LINEAR)
    mask = cv2.GaussianBlur(cv2.erode(mask, np.ones((3, 3), np.uint8)), (0, 0), 1.0)
    # cor da luz: o papel da moldura logo em volta
    anel = cv2.dilate((mask > .5).astype(np.uint8), np.ones((31, 31), np.uint8)) - (mask > .5).astype(np.uint8)
    papel = base[anel > 0].reshape(-1, 3).astype(np.float32).mean(axis=0) / 255
    tinta = papel / papel.max()
    # luz da cena sobre a foto: a luminância suavizada do quadro original naquela região
    lum = cv2.GaussianBlur(cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255, (0, 0), 60)
    luz = np.clip(lum / max(1e-3, lum[mask > .5].max()), .55, 1.0)
    cor = (warp[..., None] * tinta[None, None, :] * .92 * luz[..., None])
    cor += rng.normal(0, .018, cor.shape[:2])[..., None]
    out = base.astype(np.float32) / 255
    out = out * (1 - mask[..., None]) + np.clip(cor, 0, 1) * mask[..., None]
    return (out * 255).round().astype(np.uint8)


def main():
    rng = np.random.default_rng(5)
    for n, itens in TELAS.items():
        base_p = UP / f"{n}-base.png"
        if not base_p.exists():
            shutil.copy(UP / f"{n}.png", base_p)
        img = cv2.imread(str(base_p))
        for nome, quad, caixa in itens:
            img = aplica(img, nome, quad, caixa, rng)
        cv2.imwrite(str(UP / f"{n}.png"), img)
        print("ok", n)


if __name__ == "__main__":
    main()
