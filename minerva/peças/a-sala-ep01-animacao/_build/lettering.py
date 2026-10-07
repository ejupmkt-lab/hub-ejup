#!/usr/bin/env python3
"""Lettering "LIQUIDAÇÃO / EXTRAJUDICIAL" para ficar atrás do Roberto.

Tipografia pura: Gotham Black, as duas palavras com a mesma largura, uma
embaixo da outra. Entrada em piscada de tela (quase glitch): a palavra
acende e apaga em quadros alternados, com fatias deslocadas e eco em dourado
e prata; primeiro LIQUIDAÇÃO, depois EXTRAJUDICIAL. Um tremor curto no meio
e a palavra fica parada até o fim.

Saídas em entrega/lettering/:
- liquidacao-extrajudicial-chroma.mp4: fundo verde para chroma key;
- liquidacao-extrajudicial-alfa.mov: QuickTime Animation com transparência real
  (abre no Premiere, DaVinci e After Effects).
"""
import pathlib, subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from motor import FF, W, H, FPS

HERE = pathlib.Path(__file__).resolve().parent
FONTE = HERE.parents[2] / "skills" / "ejup-design" / "assets" / "fonts" / "Gotham-Black.otf"
SAIDA = HERE.parent / "entrega" / "lettering"
DUR = 6.0
LARG = 1840                      # largura comum das duas palavras
BRANCO = np.float32([255, 255, 255]) / 255
OURO = np.float32([240, 184, 85]) / 255
PRATA = np.float32([209, 211, 212]) / 255
VERDE = np.float32([0, 177, 64]) / 255


def palavra(txt):
    """Máscara da palavra na largura LARG, com tracking levemente negativo."""
    tam = 400
    f = ImageFont.truetype(str(FONTE), tam)
    tmp = Image.new("L", (4000, 800), 0)
    d = ImageDraw.Draw(tmp)
    x = 20
    for c in txt:
        d.text((x, 200), c, font=f, fill=255)
        x += d.textlength(c, font=f) - tam * .02
    caixa = tmp.getbbox()
    m = tmp.crop(caixa)
    esc = LARG / m.width
    return np.asarray(m.resize((LARG, int(m.height * esc)), Image.LANCZOS)).astype(np.float32) / 255


def montar():
    a, b = palavra("LIQUIDAÇÃO"), palavra("EXTRAJUDICIAL")
    gap = 34
    total = a.shape[0] + gap + b.shape[0]
    y0 = (H - total) // 2
    x0 = (W - LARG) // 2
    ma = np.zeros((H, W), np.float32); mb = np.zeros((H, W), np.float32)
    ma[y0:y0 + a.shape[0], x0:x0 + LARG] = a
    y1 = y0 + a.shape[0] + gap
    mb[y1:y1 + b.shape[0], x0:x0 + LARG] = b
    return ma, mb


def fatias(m, rng, forca):
    """Desloca faixas horizontais da máscara (o rasgo do glitch)."""
    out = m.copy()
    y = 0
    while y < H:
        h = int(rng.integers(8, 70))
        if rng.random() < .55:
            dx = int(rng.normal(0, 60 * forca))
            out[y:y + h] = np.roll(m[y:y + h], dx, axis=1)
        y += h
    return out


# estado de cada palavra quadro a quadro: 0 apagada, 1 acesa, 2 acesa com glitch
PISCA = [2, 0, 0, 2, 0, 2, 2, 0, 0, 0, 2, 0, 2, 2, 2, 1]   # ~0,7 s de entrada


def estado(t, inicio):
    i = int(round((t - inicio) * FPS))
    if i < 0:
        return 0
    if i < len(PISCA):
        return PISCA[i]
    return 1


def quadro(i, ma, mb, rng):
    t = i / FPS
    cor = np.zeros((H, W, 3), np.float32)
    alfa = np.zeros((H, W), np.float32)
    tremor = 3.0 <= t < 3.0 + 3 / FPS                      # tremor curto no meio
    for m, c, ini in ((ma, BRANCO, .35), (mb, OURO, 1.25)):
        e = estado(t, ini)
        if e == 0:
            continue
        if e == 2 or tremor:
            forca = 1.0 if e == 2 else .45
            g = fatias(m, rng, forca)
            dx = int(rng.integers(10, 26) * forca)
            for eco, ce, k in ((np.roll(g, -dx, axis=1), OURO, .55), (np.roll(g, dx, axis=1), PRATA, .45)):
                a = eco * k
                cor = cor * (1 - a[..., None]) + ce * a[..., None]
                alfa = np.maximum(alfa, a)
            m = g
        cor = cor * (1 - m[..., None]) + c * m[..., None]
        alfa = np.maximum(alfa, m)
    return cor, alfa


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    ma, mb = montar()
    rng = np.random.default_rng(21)
    chroma = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                               "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "14", "-preset", "slow",
                               "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                               str(SAIDA / "liquidacao-extrajudicial-chroma.mp4")], stdin=subprocess.PIPE)
    alfa_p = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}",
                               "-r", str(FPS), "-i", "-", "-c:v", "qtrle", "-pix_fmt", "argb",
                               str(SAIDA / "liquidacao-extrajudicial-alfa.mov")],
                              stdin=subprocess.PIPE)
    for i in range(int(DUR * FPS)):
        cor, a = quadro(i, ma, mb, rng)
        verde = VERDE[None, None, :] * (1 - a[..., None]) + cor * a[..., None]
        chroma.stdin.write((np.clip(verde, 0, 1) * 255).astype(np.uint8).tobytes())
        # no arquivo com transparência a cor vai "despremultiplicada"
        rgb = np.where(a[..., None] > 1e-3, cor / np.maximum(a[..., None], 1e-3), 0)
        rgba = np.dstack([np.clip(rgb, 0, 1), a])
        alfa_p.stdin.write((rgba * 255).astype(np.uint8).tobytes())
    for p in (chroma, alfa_p):
        p.stdin.close(); p.wait()
    print("ok")


if __name__ == "__main__":
    main()
