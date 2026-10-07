#!/usr/bin/env python3
"""Vídeos só com a frase: as três perguntas da Parte 4 e a mensagem do dia da
prisão. Fundo de mesa escura de A Sala, câmera que se aproxima devagar, frase
que sobe linha a linha, fio dourado que se desenha embaixo, grão e vinheta.

Saída: entrega/frases/NOME.mp4, 1920x1080, 24 fps.
Uso: python3 frases.py [pergunta-1 ...]
"""
import pathlib, subprocess, sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from motor import FF, W, H, FPS, suave, janela

HERE = pathlib.Path(__file__).resolve().parent
FONTS = HERE.parents[2] / "skills" / "ejup-design" / "assets" / "fonts"
SAIDA = HERE.parent / "entrega" / "frases"
OURO = (240, 184, 85)

# cada linha: (texto, dourada?)
FRASES = {
    "pergunta-1": dict(linhas=[("Se ele está preso,", False), ("ele é culpado?", True)], dur=6.0),
    "pergunta-2": dict(linhas=[("Um juiz que conhece", False), ("uma das partes", False),
                               ("pode julgar o caso?", True)], dur=6.0),
    "pergunta-3": dict(linhas=[("Quem julga", False), ("um ministro do Supremo?", True)], dur=6.0),
    "mensagem": dict(linhas=[("“Conseguiu ter notícia", True), ("ou bloquear?”", True)], dur=7.0,
                     rotulo="Mensagem atribuída pela PF a Vorcaro, no dia da prisão",
                     nota="Moraes nega ter recebido. Fontes: Agência Pública, Metrópoles"),
}


def fonte(peso, tam):
    return ImageFont.truetype(str(FONTS / f"Gotham-{peso}.otf"), tam)


def mesa(rng):
    CW, CH = int(W * 1.1), int(H * 1.1)
    yy, xx = np.mgrid[0:CH, 0:CW].astype(np.float32)
    cor = np.float32([34, 48, 54])                 # azul petróleo da mesa de A Sala
    luz = 1.2 - .85 * np.clip(((xx - CW * .5) / CW) ** 2 * 2.4 + ((yy - CH * .38) / CH) ** 2 * 2.2, 0, 1)
    r = cv2.GaussianBlur(rng.normal(0, 1, (CH, CW)).astype(np.float32), (0, 0), 2.0) * 8
    r += cv2.GaussianBlur(rng.normal(0, 1, (CH, CW)).astype(np.float32), (0, 0), 22) * 11
    return np.clip(cor[None, None, :] * luz[..., None] + r[..., None], 0, 255) / 255


def camadas(f):
    """Uma camada RGBA por linha (para entrarem em sequência) e a do rodapé."""
    tam = 96 if len(f["linhas"]) <= 2 else 84
    fn = fonte("Black", tam)
    alt = int(tam * 1.12)
    bloco = alt * len(f["linhas"])
    y0 = (H - bloco) // 2 - (30 if "rotulo" in f else 10)
    linhas = []
    for i, (txt, ouro) in enumerate(f["linhas"]):
        im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        x = (W - d.textlength(txt, font=fn)) / 2
        d.text((x, y0 + i * alt), txt, font=fn, fill=(*(OURO if ouro else (255, 255, 255)), 255))
        linhas.append(np.asarray(im).astype(np.float32) / 255)
    extra = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(extra)
    if "rotulo" in f:
        t = f["rotulo"].upper()
        fr = fonte("Medium", 22)
        d.text(((W - d.textlength(t, font=fr) - 3 * len(t)) / 2, y0 - 70), t, font=fr, fill=(209, 211, 212, 235))
    if "nota" in f:
        fr = fonte("Book", 26)
        d.text(((W - d.textlength(f["nota"], font=fr)) / 2, y0 + bloco + 70), f["nota"], font=fr, fill=(209, 211, 212, 220))
    y_fio = y0 + bloco + 34
    return linhas, np.asarray(extra).astype(np.float32) / 255, y_fio


def render(nome):
    f = FRASES[nome]
    rng = np.random.default_rng(9)
    fundo = mesa(rng)
    linhas, extra, y_fio = camadas(f)
    graos = [rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32) for _ in range(6)]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    vinheta = (1 - .38 * np.clip(((xx - W / 2) / (W / 2)) ** 2 * .7 + ((yy - H / 2) / (H / 2)) ** 2 - .25, 0, 1.4))[..., None]
    SAIDA.mkdir(parents=True, exist_ok=True)
    p = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                          "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "18", "-preset", "medium",
                          "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(SAIDA / f"{nome}.mp4")],
                         stdin=subprocess.PIPE)
    n = int(f["dur"] * FPS)
    ch, cw = fundo.shape[:2]
    for i in range(n):
        t = i / FPS
        k = suave(t / f["dur"])
        z = W / cw * 1.0 + .06 * k                   # aproximação lenta
        M = np.float32([[z * cw / W * (W / cw), 0, 0], [0, z * cw / W * (W / cw), 0]])
        s = 1.0 + .06 * k
        M = np.float32([[s, 0, W / 2 - s * cw / 2], [0, s, H / 2 - s * ch / 2]])
        img = cv2.warpAffine(fundo, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        # rótulo e nota entram primeiro, depois as linhas, escalonadas
        ke = janela(t, .3, 1.0)
        if ke > 0:
            a = extra[..., 3] * ke
            img = img * (1 - a[..., None]) + extra[..., :3] * a[..., None]
        for j, cam in enumerate(linhas):
            kl = janela(t, .7 + j * .45, 1.4 + j * .45)
            if kl <= 0:
                continue
            dy = int(round(16 * (1 - kl)))
            c = np.roll(cam, dy, axis=0)
            a = c[..., 3] * kl
            sombra = cv2.GaussianBlur(a, (0, 0), 12) * .5
            img = img * (1 - sombra[..., None])
            img = img * (1 - a[..., None]) + c[..., :3] * a[..., None]
        # fio dourado que se desenha da esquerda para a direita
        kf = janela(t, 1.2 + .45 * len(linhas), 2.6 + .45 * len(linhas))
        if kf > 0:
            camada = np.zeros((H, W), np.float32)
            x0, x1 = W // 2 - 260, W // 2 + 260
            cv2.line(camada, (x0, y_fio), (int(x0 + (x1 - x0) * kf), y_fio), 1.0, 3, cv2.LINE_AA)
            brilho = cv2.GaussianBlur(camada, (0, 0), 8) * 1.2 + camada
            img = img * (1 - camada[..., None] * .9) + brilho[..., None] * (np.float32(OURO) / 255)[None, None, :]
        img = img * vinheta
        g = cv2.resize(graos[i % 6], (W, H), interpolation=cv2.INTER_LINEAR)
        img = np.clip(img + g[..., None] * .02, 0, 1)
        p.stdin.write((img * 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()
    print("ok", nome, flush=True)


if __name__ == "__main__":
    for k in (sys.argv[1:] or FRASES):
        render(k)
