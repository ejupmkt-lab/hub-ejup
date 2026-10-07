#!/usr/bin/env python3
"""Um vídeo por pessoa citada no episódio, cada um com a foto individual.

Base: a ficha de dossiê da tela 06 sem foto (up/06-base.png), recortada
sozinha sobre a mesa escura (sem o cartão de nome e sem a maquete do banco).
Para cada pessoa, a foto entra na moldura, o nome é impresso na etiqueta logo
abaixo e, à direita, aparecem nome, papel no caso e crédito da foto. A câmera
se aproxima devagar.
No vídeo do Gilmar Mendes entra a frase dita em sessão.

Saída: entrega/pessoas/NOME.mp4, 1920x1080, 6 s (7 s no do Gilmar).
Uso: python3 pessoas.py [toffoli mendonca ...]
"""
import math, pathlib, shutil, subprocess, sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from motor import Cena, BASE, FF, W, H, FPS, suave, janela, foco_que_acende
from fotos_nas_telas import aplica

HERE = pathlib.Path(__file__).resolve().parent
FONTS = HERE.parents[2] / "skills" / "ejup-design" / "assets" / "fonts"
SAIDA = HERE.parent / "entrega" / "pessoas"
QUAD_FOTO = [(408, 303), (830, 340), (762, 738), (305, 692)]
QUAD_ETIQ = [(338, 752), (692, 784), (684, 906), (308, 878)]

PESSOAS = {
    "vorcaro": dict(foto="vorcaro.jpg", caixa=(.0, .02, 1.0), nome="Daniel Vorcaro",
                    papel="Dono do Banco Master. Preso, investigado pela Polícia Federal. Ainda não julgado.",
                    credito="Foto: Márcio Gustavo Vasconcelos (CC0)"),
    "toffoli": dict(foto="toffoli.png", caixa=(.02, .0, .96), nome="Dias Toffoli",
                    papel="Primeiro relator do caso no Supremo. Deixou a relatoria em fevereiro de 2026.",
                    credito="Foto: Nelson Jr./STF"),
    "mendonca": dict(foto="mendonca.jpg", caixa=(.0, .0, 1.0), nome="André Mendonça",
                     papel="Relator do caso depois da saída de Toffoli. Confirma a reunião de 2025 com Vorcaro.",
                     credito="Foto: Rosinei Coutinho/STF"),
    "moraes": dict(foto="moraes.png", caixa=(.12, .0, .76), nome="Alexandre de Moraes",
                   papel="Citado no relatório da PF de setembro de 2026. Nega qualquer relação com Vorcaro.",
                   credito="Foto: Isac Nóbrega/PR (CC BY 2.0)"),
    "viviane": dict(foto="novas/viviane.jpg", caixa=(.0, .0, 1.0), nome="Viviane Barci de Moraes",
                    papel="Advogada, mulher do ministro Alexandre de Moraes. Segundo o relatório da PF, o escritório dela tinha contrato com o Banco Master.",
                    credito="Foto: Lula Oficial, agosto de 2022 (CC BY-SA 4.0)"),
    "gilmar": dict(foto="gilmar.png", caixa=(.0, .0, 1.0), nome="Gilmar Mendes",
                   papel="Ministro do Supremo Tribunal Federal.",
                   credito="Foto: Alejandro Zambrana/Secom/TSE",
                   frase="“Até a máfia tem ética.”", fonte_frase="Em sessão do STF · Fontes: Metrópoles, Terra"),
}


def fonte(peso, tam):
    return ImageFont.truetype(str(FONTS / f"Gotham-{peso}.otf"), tam)


def etiqueta(img, texto):
    """Nome impresso na etiqueta de papel, em perspectiva, por multiplicação."""
    q = np.float32(QUAD_ETIQ)
    w, h = 720, 220
    plano = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(plano)
    f = fonte("Medium", 58)
    t = texto.upper()
    rastreio = 6
    larg = sum(d.textlength(c, font=f) for c in t) + rastreio * (len(t) - 1)
    while larg > w - 60:
        f = fonte("Medium", f.size - 2)
        larg = sum(d.textlength(c, font=f) for c in t) + rastreio * (len(t) - 1)
    x = (w - larg) / 2
    asc, desc = f.getmetrics()
    y = (h - asc - desc) / 2 + desc * .3
    for c in t:
        d.text((x, y), c, font=f, fill=255)
        x += d.textlength(c, font=f) + rastreio
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), q)
    a = cv2.warpPerspective(np.array(plano), M, (img.shape[1], img.shape[0]), flags=cv2.INTER_CUBIC)
    a = cv2.GaussianBlur(a.astype(np.float32) / 255 * .88, (0, 0), .7)
    tinta = np.float32([26, 30, 36]) / 255          # BGR
    out = img.astype(np.float32) / 255 * (1 - a[..., None] * (1 - tinta[None, None, :]))
    return (out * 255).round().astype(np.uint8)


def legenda(p):
    """Camada RGBA com nome, papel e crédito (e a frase, no do Gilmar)."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x0, larg = 1130, 680

    def quebra(txt, f, largura):
        linhas, atual = [], ""
        for pal in txt.split():
            t = (atual + " " + pal).strip()
            if d.textlength(t, font=f) <= largura:
                atual = t
            else:
                linhas.append(atual); atual = pal
        return linhas + [atual]

    y = 300 if "frase" not in p else 210
    d.text((x0, y), p["nome"], font=fonte("Black", 66), fill=(255, 255, 255, 255))
    y += 92
    d.rectangle((x0, y, x0 + 70, y + 3), fill=(240, 184, 85, 255))
    y += 30
    for l in quebra(p["papel"], fonte("Light", 32), larg):
        d.text((x0, y), l, font=fonte("Light", 32), fill=(209, 211, 212, 255)); y += 44
    if "frase" in p:
        y += 40
        for l in quebra(p["frase"], fonte("Black", 60), larg):
            d.text((x0, y), l, font=fonte("Black", 60), fill=(240, 184, 85, 255)); y += 68
        y += 14
        d.text((x0, y), p["fonte_frase"], font=fonte("Book", 22), fill=(209, 211, 212, 220))
    d.text((x0, H - 96), p["credito"], font=fonte("Book", 20), fill=(209, 211, 212, 200))
    a = np.asarray(im).astype(np.float32) / 255
    # sombra macia para o texto ler sobre o papel pardo
    sombra = cv2.GaussianBlur(a[..., 3], (0, 0), 14) * .75
    return a[..., :3], a[..., 3], sombra


def preparar(chave, p):
    """Monta a cena: só a ficha (foto e etiqueta) sobre a mesa escura, sem o
    cartão de nome nem a maquete do banco da tela 06. Gera também a
    profundidade (ficha perto, mesa longe)."""
    up = BASE / "up"
    base = cv2.imread(str(up / "06-base.png"))
    img = aplica(base, p["foto"], QUAD_FOTO, p["caixa"], np.random.default_rng(11))
    img = etiqueta(img, p["nome"])
    ficha = img[80:1080, 140:1020]
    CW, CH = 2304, 1296
    rng = np.random.default_rng(3)
    # mesa: o mesmo azul petróleo do fundo da tela 06, com textura e luz de cima
    cor = base[10:150, 1300:1900].reshape(-1, 3).mean(axis=0)
    yy, xx = np.mgrid[0:CH, 0:CW].astype(np.float32)
    luz = 1.15 - .75 * np.clip(((xx - CW * .32) / CW) ** 2 * 2.2 + ((yy - CH * .42) / CH) ** 2 * 2.0, 0, 1)
    ruido = cv2.GaussianBlur(rng.normal(0, 1, (CH, CW)).astype(np.float32), (0, 0), 2.2) * 9
    ruido += cv2.GaussianBlur(rng.normal(0, 1, (CH, CW)).astype(np.float32), (0, 0), 18) * 10
    mesa = np.clip(cor[None, None, :] * luz[..., None] + ruido[..., None], 0, 255)
    # recorte só das folhas claras (sem a pasta parda e sem a mesa original)
    cinza = cv2.cvtColor(ficha, cv2.COLOR_BGR2GRAY)
    claro = (cinza > 105).astype(np.uint8)
    claro = cv2.morphologyEx(claro, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    cs, _ = cv2.findContours(claro, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    folha = np.zeros_like(claro)
    cv2.drawContours(folha, [max(cs, key=cv2.contourArea)], -1, 1, -1)
    folha = cv2.morphologyEx(folha, cv2.MORPH_OPEN, np.ones((15, 15), np.uint8)).astype(np.float32)
    folha[ficha[..., 0].astype(int) > ficha[..., 2].astype(int) + 6] = 0       # tira a mesa azul que sobrou
    folha = cv2.morphologyEx(folha, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    # a ficha, um pouco girada, com sombra macia
    esc = 1080 / ficha.shape[0]
    f = cv2.resize(ficha, None, fx=esc, fy=esc, interpolation=cv2.INTER_CUBIC)
    folha = cv2.resize(folha, (f.shape[1], f.shape[0]), interpolation=cv2.INTER_LINEAR)
    fh, fw = f.shape[:2]
    x0, y0 = 120, 110
    M = cv2.getRotationMatrix2D((fw / 2, fh / 2), 2.5, 1.0)
    M[0, 2] += x0; M[1, 2] += y0
    fr = cv2.warpAffine(f, M, (CW, CH), flags=cv2.INTER_CUBIC)
    m = cv2.warpAffine(folha, M, (CW, CH), flags=cv2.INTER_LINEAR)
    m = cv2.GaussianBlur(cv2.erode(m, np.ones((3, 3), np.uint8)), (0, 0), 1.0)
    sombra = cv2.GaussianBlur(np.roll(np.roll(m, 26, 0), 18, 1), (0, 0), 28) * .7
    out = mesa * (1 - sombra[..., None])
    out = out * (1 - m[..., None]) + fr.astype(np.float32) * m[..., None]
    nome = f"p-{chave}"
    cv2.imwrite(str(up / f"{nome}.png"), np.clip(out, 0, 255).astype(np.uint8))
    prof = .28 + .1 * (1 - yy / CH) * 0 + .42 * cv2.GaussianBlur(m, (0, 0), 6)
    cv2.imwrite(str(BASE / "profundidade" / f"{nome}.png"), (np.clip(prof, 0, 1) * 255).astype(np.uint8))
    return nome


def render(chave):
    p = PESSOAS[chave]
    nome = preparar(chave, p)
    dur = 7.0 if "frase" in p else 6.0
    c = Cena(nome, dur)
    foco_que_acende(c, c.elipse(.33, .40, .17, .30, pena=.8), .3, 1.4, forca=.3)
    cor, alfa, sombra = legenda(p)
    t_frase = 2.2

    def texto(t, img, conv):
        k = janela(t, .9, 1.7)
        if "frase" in p:
            # nome e papel entram primeiro; a frase sobe um pouco depois
            k = janela(t, .7, 1.5)
        if k <= 0:
            return img
        # véu escuro à direita, para o texto ler sobre o papel
        a = alfa * k
        if "frase" in p:
            kf = janela(t, t_frase, t_frase + .8)
            corte = np.ones((H, 1), np.float32)
            corte[470:] = kf
            a = a * corte
        img = img * (1 - (sombra * k)[..., None]) + 0
        return img * (1 - a[..., None]) + cor * a[..., None]

    c.desenhos.append(texto)
    f_foto = float(c.dep[int(.40 * c.h), int(.33 * c.w)])

    def cam(t):
        k = suave(t / dur)
        return dict(cx=.47 - .02 * k, cy=.47, zoom=1.0 + .1 * k, pz=.06, foco=f_foto, desf=1.4, base=.95)

    SAIDA.mkdir(parents=True, exist_ok=True)
    c.render(cam, saida=SAIDA / f"{chave}.mp4")


if __name__ == "__main__":
    for k in (sys.argv[1:] or PESSOAS):
        render(k)
