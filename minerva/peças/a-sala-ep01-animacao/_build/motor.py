#!/usr/bin/env python3
"""Motor de animação em código para as telas de A Sala (sem IA generativa).

Cada cena parte de um quadro (telas-codigo/up/NN.png) e do seu mapa de
profundidade (telas-codigo/profundidade/NN.png, claro = perto) e ganha:

- câmera 2,5D: aproximação, panorâmica e deslocamento lateral com paralaxe
  real (o que está perto anda mais que o fundo);
- foco que muda (desfoque proporcional à distância do plano de foco);
- luzes: pulsação da luminária, focos que acendem sobre objetos;
- poeira no ar visível só onde há luz, grão de filme e vinheta iguais em todas.

As coordenadas das cenas são frações do quadro (0 a 1), então a mesma
receita serve para o quadro pequeno da prancha e para uma versão em alta.
"""
import math, pathlib, subprocess
import cv2
import numpy as np
import imageio_ffmpeg

BASE = pathlib.Path(__file__).resolve().parent.parent / "telas-codigo"
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1920, 1080, 24


def suave(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def janela(t, a, b):
    """0 antes de a, 1 depois de b, suave entre os dois."""
    return suave((t - a) / max(1e-6, b - a))


class Cena:
    def __init__(self, nome, dur=6.0, margem=1.08):
        self.nome = nome
        self.dur = dur
        img = cv2.imread(str(BASE / "up" / f"{nome}.png"))
        self.src = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32) / 255
        d = cv2.imread(str(BASE / "profundidade" / f"{nome}.png"), cv2.IMREAD_GRAYSCALE)
        self.dep = cv2.GaussianBlur(d.astype(np.float32) / 255, (0, 0), 3)
        self.h, self.w = self.src.shape[:2]
        self.s0 = max(W / self.w, H / self.h) * margem
        gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
        self.gx, self.gy = gx, gy
        rng = np.random.default_rng(7)
        self.graos = [rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32) for _ in range(6)]
        yy, xx = (gy - H / 2) / (H / 2), (gx - W / 2) / (W / 2)
        self.vinheta = (1 - .32 * np.clip((xx ** 2 * .7 + yy ** 2) - .25, 0, 1.4))[..., None]
        n = 70
        self.pó = np.c_[rng.uniform(0, W, n), rng.uniform(0, H, n), rng.uniform(.6, 2.2, n),
                        rng.uniform(0, 6.28, n), rng.uniform(.3, 1, n)]
        # luzes extras: lista de funções t -> (mascara_fonte HxW, ganho)
        self.luzes = []
        self.desenhos = []      # funções (t, frame_out, conv) -> frame_out

    # ---------- utilidades em coordenadas da fonte (frações) ----------
    def elipse(self, cx, cy, rx, ry, pena=.6):
        y, x = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        r = ((x / self.w - cx) / rx) ** 2 + ((y / self.h - cy) / ry) ** 2
        return np.clip((1 - r) / pena, 0, 1).astype(np.float32)

    def retangulo(self, x0, y0, x1, y1, pena=.02):
        y, x = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
        x, y = x / self.w, y / self.h
        m = np.minimum.reduce([(x - x0), (x1 - x), (y - y0), (y1 - y)]) / pena
        return np.clip(m, 0, 1).astype(np.float32)

    # ---------- câmera ----------
    def quadro(self, t, cam):
        """cam(t) -> dict(cx, cy em frações; zoom; px, py paralaxe lateral em px;
        pz paralaxe de profundidade; foco 0..1; desf força do desfoque)."""
        c = cam(t)
        z = self.s0 * c.get("zoom", 1.0)
        cx, cy = c.get("cx", .5) * self.w, c.get("cy", .5) * self.h
        xb = cx + (self.gx - W / 2) / z
        yb = cy + (self.gy - H / 2) / z
        dep = cv2.remap(self.dep, xb, yb, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        rel = dep - c.get("foco", .5)
        k = 1 / z
        pz = c.get("pz", 0.0)
        xs = cx + (xb - cx) / (1 + pz * rel) - c.get("px", 0.0) * rel * k
        ys = cy + (yb - cy) / (1 + pz * rel) - c.get("py", 0.0) * rel * k
        img = cv2.remap(self.src, xs, ys, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        dep = cv2.remap(self.dep, xs, ys, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        # luzes (máscaras na fonte, levadas ao quadro pela mesma câmera)
        ganho = np.ones((H, W), np.float32) * c.get("base", 1.0)
        for f in self.luzes:
            m, g = f(t)
            if g == 0:
                continue
            ganho += cv2.remap(m, xs, ys, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * g
        img = img * ganho[..., None]
        # foco
        desf = c.get("desf", 0.0)
        if desf > 0:
            b = np.clip(np.abs(dep - c.get("foco", .5)) * desf, 0, 1)
            b1 = cv2.GaussianBlur(img, (0, 0), 2.2)
            b2 = cv2.GaussianBlur(img, (0, 0), 6.0)
            w1 = np.clip(b * 2, 0, 1)[..., None]
            w2 = np.clip(b * 2 - 1, 0, 1)[..., None]
            img = img * (1 - w1) + b1 * (w1 - w2) + b2 * w2
        conv = lambda fx, fy: (W / 2 + (fx * self.w - cx) * z, H / 2 + (fy * self.h - cy) * z)
        for d in self.desenhos:
            img = d(t, img, conv)
        return img

    def acabamento(self, img, i, t):
        # poeira: só aparece onde há luz
        lum = cv2.GaussianBlur(img.mean(axis=2), (0, 0), 25)
        camada = np.zeros((H, W), np.float32)
        for (x, y, r, fase, a) in self.pó:
            px = (x + 14 * t + 30 * math.sin(fase + t * .4)) % W
            py = (y - 9 * t + 20 * math.cos(fase * 1.3 + t * .3)) % H
            alfa = a * (.5 + .5 * math.sin(fase + t * 1.7))
            cv2.circle(camada, (int(px), int(py)), int(r + .5), alfa, -1, cv2.LINE_AA)
        camada = cv2.GaussianBlur(camada, (0, 0), 1.1)
        img = img + (camada * np.clip(lum * 1.6 - .15, 0, 1) * .55)[..., None]
        img = img * self.vinheta
        g = cv2.resize(self.graos[i % len(self.graos)], (W, H), interpolation=cv2.INTER_LINEAR)
        img = img + g[..., None] * .022
        return np.clip(img, 0, 1)

    def render(self, cam, saida=None):
        saida = saida or (BASE / "video" / f"{self.nome}.mp4")
        saida.parent.mkdir(exist_ok=True)
        n = int(round(self.dur * FPS))
        p = subprocess.Popen([FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                              "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "16",
                              "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(saida)],
                             stdin=subprocess.PIPE)
        for i in range(n):
            t = i / FPS
            img = self.acabamento(self.quadro(t, cam), i, t)
            p.stdin.write((img * 255).astype(np.uint8).tobytes())
        p.stdin.close(); p.wait()
        print("ok", self.nome, n, "quadros", flush=True)


# ---------- efeitos reaproveitáveis ----------
def luminaria(cena, cx, cy, r=.12, forca=.18):
    m = cena.elipse(cx, cy + r * .9, r * 1.6, r * 2.4)
    def f(t):
        g = forca * (.55 + .25 * math.sin(t * 7.1) + .2 * math.sin(t * 13.3 + 1)) - forca * .5
        return m, g
    cena.luzes.append(f)


def foco_que_acende(cena, mascara, inicio, fim, forca=.45):
    cena.luzes.append(lambda t: (mascara, forca * janela(t, inicio, fim)))


def fio_dourado(cena, pontos, inicio, fim, esp=3):
    """Linha dourada (o fio de A Sala) desenhada aos poucos entre pontos."""
    def d(t, img, conv):
        k = janela(t, inicio, fim)
        if k <= 0:
            return img
        pts = [conv(*p) for p in pontos]
        seg = [math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
        total, alvo = sum(seg), sum(seg) * k
        camada = np.zeros((H, W), np.float32)
        for i, s in enumerate(seg):
            if alvo <= 0:
                break
            f = min(1, alvo / s)
            a = pts[i]; b = (a[0] + (pts[i + 1][0] - a[0]) * f, a[1] + (pts[i + 1][1] - a[1]) * f)
            cv2.line(camada, (int(a[0]), int(a[1])), (int(b[0]), int(b[1])), 1.0, esp, cv2.LINE_AA)
            alvo -= s
        brilho = cv2.GaussianBlur(camada, (0, 0), 8) * 1.4 + camada
        ouro = np.float32([240, 184, 85]) / 255
        return img * (1 - camada[..., None] * .9) + brilho[..., None] * ouro[None, None, :]
    cena.desenhos.append(d)
