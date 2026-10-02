#!/usr/bin/env python3
"""Finaliza os clipes de ação: texto nos cartões e zoom lento, em Full HD.

Sem Higgsfield. O texto é impresso no papel por multiplicação (a sombra da
mão escurece o papel e a tinta junto, como num cartão de verdade) e só depois
entra o zoom, para o texto acompanhar a imagem.

Saída: clipes-final/*.mp4, 1920x1080, 24 fps, H.264.
"""
import pathlib, subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

HERE = pathlib.Path(__file__).resolve().parent
BASE = HERE.parent
FONTS = HERE.parents[2] / "skills" / "ejup-design" / "assets" / "fonts"
FF = imageio_ffmpeg.get_ffmpeg_exe()
W_IN, H_IN, W_OUT, H_OUT = 1912, 1080, 1920, 1080


def camada_texto(texto, quad, fonte, tam, rastreio, tinta=(38, 32, 26), alpha=.9):
    """Texto centrado num retângulo e levado em perspectiva até o quadrilátero
    (TL, TR, BR, BL) do cartão. Devolve um mapa de multiplicação HxWx3."""
    q = np.float32(quad)
    w = int(max(np.linalg.norm(q[1] - q[0]), np.linalg.norm(q[2] - q[3])))
    h = int(max(np.linalg.norm(q[3] - q[0]), np.linalg.norm(q[2] - q[1])))
    plano = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(plano)
    f = ImageFont.truetype(str(FONTS / fonte), tam)
    larg = sum(d.textlength(c, font=f) for c in texto) + rastreio * (len(texto) - 1)
    x = (w - larg) / 2
    asc, desc = f.getmetrics()
    y = (h - (asc + desc)) / 2 + desc * .35
    for c in texto:
        d.text((x, y), c, font=f, fill=255)
        x += d.textlength(c, font=f) + rastreio
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), q)
    a = cv2.warpPerspective(np.array(plano), M, (W_IN, H_IN), flags=cv2.INTER_CUBIC).astype(np.float32) / 255 * alpha
    a = cv2.GaussianBlur(a, (0, 0), .6)
    tinta = np.float32(tinta) / 255
    return 1 - a[..., None] * (1 - tinta[None, None, :])


def suave(t):
    return t * t * (3 - 2 * t)


def processar(nome, zoom, c0, c1, textos=()):
    src = BASE / "clipes-acao" / f"{nome}.mp4"
    dst = BASE / "clipes-final" / f"{nome}.mp4"
    dst.parent.mkdir(exist_ok=True)
    mult = None
    for t in textos:
        m = camada_texto(*t)
        mult = m if mult is None else mult * m
    info = subprocess.run([FF, "-i", str(src)], capture_output=True, text=True).stderr
    hh, mm, ss = info.split("Duration: ")[1].split(",")[0].split(":")
    n = round((int(hh) * 3600 + int(mm) * 60 + float(ss)) * 24)
    ler = subprocess.Popen([FF, "-loglevel", "error", "-i", str(src), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                           stdout=subprocess.PIPE)
    gravar = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                               "-s", f"{W_OUT}x{H_OUT}", "-r", "24", "-i", "-", "-c:v", "libx264", "-crf", "15",
                               "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)],
                              stdin=subprocess.PIPE)
    s0 = W_OUT / W_IN
    for i in range(n):
        buf = ler.stdout.read(W_IN * H_IN * 3)
        if len(buf) < W_IN * H_IN * 3:
            break
        fr = np.frombuffer(buf, np.uint8).reshape(H_IN, W_IN, 3).astype(np.float32)
        if mult is not None:
            fr = fr * mult
        e = suave(i / max(1, n - 1))
        z = 1 + zoom * e
        s = s0 * z
        cx = c0[0] + (c1[0] - c0[0]) * e
        cy = c0[1] + (c1[1] - c0[1]) * e
        # mantém o recorte dentro do quadro
        hw, hh = W_OUT / (2 * s), H_OUT / (2 * s)
        cx = min(max(cx, hw), W_IN - hw)
        cy = min(max(cy, hh), H_IN - hh)
        M = np.float32([[s, 0, W_OUT / 2 - s * cx], [0, s, H_OUT / 2 - s * cy]])
        out = cv2.warpAffine(np.clip(fr, 0, 255).astype(np.uint8), M, (W_OUT, H_OUT),
                             flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        gravar.stdin.write(out.tobytes())
    gravar.stdin.close(); gravar.wait(); ler.wait()
    print("ok", nome, n, "quadros")


CENTRO = (W_IN / 2, H_IN / 2)

# 07 · cartões como na prancha: LIQUIDANTE junto à mão que recebe, BANCO CENTRAL sob o banco
processar("07-liquidacao", .12, CENTRO, (1000, 520), textos=[
    ("LIQUIDANTE", [(1283, 287), (1777, 267), (1816, 467), (1311, 487)], "Gotham-Medium.otf", 46, 12),
    ("BANCO CENTRAL", [(677, 768), (1240, 765), (1253, 955), (667, 957)], "Gotham-Medium.otf", 40, 9),
])
# 10 · a câmera acompanha as moedas até o banco
processar("10-emprestar", .15, CENTRO, (1150, 560))
# 12 · etiqueta FGC na tigela, aproximação até ela encher
processar("12-fundo-comum", .15, CENTRO, (975, 640), textos=[
    ("FGC", [(840, 696), (1111, 693), (1109, 811), (843, 808)], "Gotham-Bold.otf", 76, 18, (30, 26, 22), .85),
])
# 13 · aproximação enquanto a caixa desce
processar("13-teto", .12, CENTRO, (980, 600))
# 15 · já tem movimento; um empurrão leve a mais até o cofre
processar("15-fila", .06, CENTRO, (1100, 560))
