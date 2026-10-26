#!/usr/bin/env python3
"""Prancha 01 · abertura e personagens. Uma função por tela, com o movimento
pedido na legenda da prancha. Uso: python3 cenas_p1.py [01 02 ...]"""
import math, sys
import cv2
import numpy as np
from motor import Cena, janela, suave, luminaria, foco_que_acende, fio_dourado


def prof(c, fx, fy):
    return float(c.dep[int(fy * c.h), int(fx * c.w)])


def t01():
    """Confissão · aproximação lenta até o celular sobre o envelope."""
    c = Cena("01", 6.0)
    luminaria(c, .58, .05, r=.10, forca=.22)
    f_cel = prof(c, .41, .70)
    def cam(t):
        k = suave(t / c.dur)
        return dict(cx=.5 - .07 * k, cy=.52 + .12 * k, zoom=1 + .22 * k, pz=.10,
                    foco=f_cel, desf=.6 + 1.6 * k)
    c.render(cam)


def t02():
    """Aeroporto · travelling lateral, luzes da pista cintilando."""
    c = Cena("02", 6.0, margem=1.12)
    lum = c.src.mean(axis=2)
    brilho = np.clip((lum - .55) * 4, 0, 1).astype(np.float32)
    brilho = cv2.GaussianBlur(brilho, (0, 0), 4)
    fase = np.random.default_rng(3).uniform(0, 6.28, (c.h // 40 + 1, c.w // 40 + 1)).astype(np.float32)
    fase = cv2.resize(fase, (c.w, c.h), interpolation=cv2.INTER_NEAREST)
    c.luzes.append(lambda t: (brilho * (.5 + .5 * np.sin(fase + t * 2.4)), .25))
    f_cad = prof(c, .25, .62)
    def cam(t):
        k = suave(t / c.dur)
        return dict(cx=.44 + .12 * k, cy=.52, zoom=1.04, px=-90 + 180 * k, pz=.05,
                    foco=f_cad, desf=.9)
    c.render(cam)


def t03():
    """Dinheiro preso · o foco sai do banco na redoma e vem para as contas."""
    c = Cena("03", 6.0)
    f_banco, f_contas = prof(c, .55, .40), prof(c, .45, .85)
    def cam(t):
        k = suave(t / c.dur)
        r = janela(t, 1.2, 4.2)
        return dict(cx=.5, cy=.44 + .12 * k, zoom=1 + .12 * k, pz=.08,
                    foco=f_banco + (f_contas - f_banco) * r, desf=2.2)
    c.render(cam)


def t04():
    """Três nomes · três entradas: um foco acende sobre cada porta-retrato."""
    c = Cena("04", 6.0)
    for i, (x, t0) in enumerate([(.20, .9), (.47, 2.0), (.74, 3.1)]):
        m = c.elipse(x, .70, .12, .26, pena=.7)
        foco_que_acende(c, m, t0, t0 + .6, forca=1.1)
    foco_que_acende(c, c.elipse(.55, .25, .35, .25, pena=.9), 4.0, 5.0, forca=.25)
    f = prof(c, .47, .68)
    def cam(t):
        k = suave(t / c.dur)
        return dict(cx=.5, cy=.56 - .05 * k, zoom=1.02 + .10 * k, pz=.06, foco=f, desf=.8,
                    base=.36 + .04 * k)
    c.render(cam)


def t06():
    """Vorcaro · a câmera vai do espaço da foto (fica escuro, foto na pós) até o nome."""
    c = Cena("06", 6.0)
    f_foto, f_nome = prof(c, .30, .43), prof(c, .72, .31)
    faixa = lambda t: c.elipse(.45 + .45 * janela(t, 2.2, 4.6), .32, .10, .22, pena=.9)
    c.luzes.append(lambda t: (faixa(t), .35 * math.sin(math.pi * janela(t, 2.2, 4.6))))
    def cam(t):
        k = suave(t / c.dur)
        return dict(cx=.36 + .30 * k, cy=.44 - .06 * k, zoom=1.10 + .10 * k, pz=.08,
                    foco=f_foto + (f_nome - f_foto) * janela(t, 1.5, 4.0), desf=1.4)
    c.render(cam)


def t08():
    """Mesmo dia · avião, data e PF acendem em sequência e o fio dourado os liga."""
    c = Cena("08", 6.0)
    itens = [(.15, .25, .9), (.48, .25, 1.8), (.80, .27, 2.7)]
    for x, y, t0 in itens:
        foco_que_acende(c, c.elipse(x, y, .14, .22, pena=.8), t0, t0 + .6, forca=.6)
    alfinetes = [(.16, .17), (.48, .18), (.80, .105)]
    fio = [alfinetes[0], (.32, .205), alfinetes[1], (.64, .17), alfinetes[2]]
    fio_dourado(c, fio, 3.3, 4.8, esp=3)
    def pinos(t, img, conv):
        for (x, y), (_, _, t0) in zip(alfinetes, itens):
            k = janela(t, t0 + .3, t0 + .6)
            if k <= 0:
                continue
            px, py = conv(x, y)
            m = np.zeros(img.shape[:2], np.float32)
            cv2.circle(m, (int(px), int(py)), 9, 1.0, -1, cv2.LINE_AA)
            g = cv2.GaussianBlur(m, (0, 0), 6) * .8
            ouro = np.float32([240, 184, 85]) / 255
            img = img * (1 - m[..., None] * k) + (m + g)[..., None] * ouro * k
        return img
    c.desenhos.append(pinos)
    f = prof(c, .48, .25)
    def cam(t):
        k = suave(t / c.dur)
        return dict(cx=.5, cy=.36 + .04 * k, zoom=1.02 + .08 * k, pz=.05, foco=f, desf=.7,
                    base=.55 + .1 * k)
    c.render(cam)


if __name__ == "__main__":
    todos = {"01": t01, "02": t02, "03": t03, "04": t04, "06": t06, "08": t08}
    for n in (sys.argv[1:] or todos):
        todos[n]()
