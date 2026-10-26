#!/usr/bin/env python3
"""Envelhece uma foto como cópia antiga de arquivo, manuseada.

Preto e branco frio (sem sépia, que o mapa imagético veta), preto lavado,
foco macio, grão pesado, exposição irregular, manchas de umidade, poeira,
poucos riscos finos e trêmulos, uma dobra suave, orelha num canto e borda
fina de papel com desgaste. Tudo desenhado em camadas com desfoque e
opacidade parcial, para não parecer carimbo digital.
"""
import math
import random

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

SOMBRA, LUZ = (18, 22, 28), (226, 225, 220)
PAPEL = (234, 232, 226)


def _camada(tam):
    return Image.new("L", tam, 0)


def envelhecer(im, w, h, semente, borda=34, centro=(.5, .4), rosto=False,
               preto=40, branco=212, vinheta=.58, grao=.13, macio=.7):
    """rosto=True (foto de pessoa real): dobra e riscos ficam fora da faixa
    central, para o desgaste nunca passar pelo rosto."""
    rnd = random.Random(semente)
    pw, ph = w - 2 * borda, h - 2 * borda
    g = ImageOps.grayscale(ImageOps.fit(im.convert("RGB"), (pw, ph), Image.LANCZOS, centering=centro))
    g = ImageOps.autocontrast(g, cutoff=(1, 1))
    g = g.point(lambda v: int(preto + v * (branco - preto) / 255))    # preto lavado
    g = g.filter(ImageFilter.GaussianBlur(macio))                      # foco macio de cópia
    g = Image.blend(g, Image.effect_noise(g.size, 64).filter(ImageFilter.GaussianBlur(.9)), grao)

    # exposição irregular: um lado mais lavado que o outro
    grad = Image.linear_gradient("L").rotate(rnd.choice([0, 90, 180, 270])).resize(g.size, Image.BILINEAR)
    g = ImageChops.add(g, grad.point(lambda v: int(v * .1)))
    # vinheta
    m = _camada(g.size)
    ImageDraw.Draw(m).ellipse((-pw * .3, -ph * .25, pw * 1.3, ph * 1.2), fill=255)
    g = Image.composite(g, ImageEnhance.Brightness(g).enhance(vinheta), m.filter(ImageFilter.GaussianBlur(170)))

    # manchas de umidade: halos claros com borda levemente mais escura
    for _ in range(rnd.randint(2, 3)):
        x, y, r = rnd.uniform(0, pw), rnd.uniform(0, ph), rnd.uniform(120, 300)
        claro = _camada(g.size); ImageDraw.Draw(claro).ellipse((x - r, y - r * .75, x + r, y + r * .75), fill=22)
        g = ImageChops.add(g, claro.filter(ImageFilter.GaussianBlur(40)))
        aro = _camada(g.size); ImageDraw.Draw(aro).ellipse((x - r, y - r * .75, x + r, y + r * .75), outline=16, width=6)
        g = ImageChops.subtract(g, aro.filter(ImageFilter.GaussianBlur(5)))

    # poeira: pontos pequenos, uns claros outros escuros
    po_c, po_e = _camada(g.size), _camada(g.size)
    dc, de = ImageDraw.Draw(po_c), ImageDraw.Draw(po_e)
    for _ in range(rnd.randint(140, 220)):
        x, y = rnd.uniform(0, pw), rnd.uniform(0, ph); r = rnd.choice([.5, .8, 1.1, 1.6, 2.2])
        (dc if rnd.random() < .7 else de).ellipse((x - r, y - r, x + r, y + r), fill=rnd.randint(90, 170))
    for _ in range(rnd.randint(6, 12)):                               # fiapos
        x, y = rnd.uniform(0, pw), rnd.uniform(0, ph)
        pts = [(x, y)]
        for _k in range(rnd.randint(4, 8)):
            x += rnd.uniform(-9, 9); y += rnd.uniform(-9, 9); pts.append((x, y))
        dc.line(pts, fill=120, width=1)
    g = ImageChops.add(g, po_c.filter(ImageFilter.GaussianBlur(.5)))
    g = ImageChops.subtract(g, po_e.filter(ImageFilter.GaussianBlur(.5)))

    # riscos: poucos, finos, trêmulos e parciais
    rs = _camada(g.size); dr = ImageDraw.Draw(rs)
    for _ in range(rnd.randint(3, 5)):
        x = (rnd.choice([rnd.uniform(pw * .04, pw * .2), rnd.uniform(pw * .8, pw * .96)]) if rosto
             else rnd.uniform(pw * .1, pw * .9))
        y = rnd.uniform(0, ph * .5); comp = rnd.uniform(ph * .1, ph * .4)
        pts = []
        for k in range(24):
            pts.append((x + math.sin(k * .7 + semente) * 1.5 + k * rnd.uniform(-.4, .4), y + comp * k / 23))
        dr.line(pts, fill=rnd.randint(60, 110), width=1)
    g = ImageChops.add(g, rs.filter(ImageFilter.GaussianBlur(.4)))

    # dobra suave: linha clara desfocada + sombra, e um lado 4% mais escuro
    ang = rnd.uniform(-.25, .25)
    cx = (rnd.choice([pw * .1, pw * .9]) if rosto else rnd.uniform(pw * .3, pw * .7))
    if rosto:
        ang = rnd.uniform(-.06, .06)
    x0, x1 = cx - math.tan(ang) * ph / 2, cx + math.tan(ang) * ph / 2
    lado = _camada(g.size); ImageDraw.Draw(lado).polygon([(x0, 0), (pw, 0), (pw, ph), (x1, ph)], fill=10)
    g = ImageChops.subtract(g, lado.filter(ImageFilter.GaussianBlur(3)))
    luz = _camada(g.size); ImageDraw.Draw(luz).line((x0, 0, x1, ph), fill=70, width=3)
    g = ImageChops.add(g, luz.filter(ImageFilter.GaussianBlur(1.6)))
    sombra = _camada(g.size); ImageDraw.Draw(sombra).line((x0 + 5, 0, x1 + 5, ph), fill=40, width=4)
    g = ImageChops.subtract(g, sombra.filter(ImageFilter.GaussianBlur(3)))

    # orelha num canto: vinco diagonal e o triângulo mais lavado
    c = rnd.choice(["tl", "tr", "bl", "br"]); t = rnd.uniform(110, 170)
    X = 0 if c[1] == "l" else pw; Y = 0 if c[0] == "t" else ph
    sx = 1 if X == 0 else -1; sy = 1 if Y == 0 else -1
    tri = _camada(g.size); ImageDraw.Draw(tri).polygon([(X, Y), (X + sx * t, Y), (X, Y + sy * t)], fill=34)
    g = ImageChops.add(g, tri.filter(ImageFilter.GaussianBlur(2)))
    vinco = _camada(g.size); ImageDraw.Draw(vinco).line((X + sx * t, Y, X, Y + sy * t), fill=80, width=2)
    g = ImageChops.add(g, vinco.filter(ImageFilter.GaussianBlur(1)))

    img = ImageOps.colorize(g, black=SOMBRA, white=LUZ)

    # papel: borda fina, encardido frio e desgaste irregular nas arestas da foto
    folha = Image.new("RGB", (w, h), PAPEL)
    folha.paste(img, (borda, borda))
    desg = _camada((w, h)); dd = ImageDraw.Draw(desg)
    for _ in range(rnd.randint(90, 150)):
        lado = rnd.choice("tblr"); r = rnd.uniform(1, 3.5)
        if lado in "tb":
            x = rnd.uniform(borda, w - borda); y = borda + (rnd.uniform(-2, 4) if lado == "t" else -rnd.uniform(-2, 4) + ph)
        else:
            y = rnd.uniform(borda, h - borda); x = borda + (rnd.uniform(-2, 4) if lado == "l" else -rnd.uniform(-2, 4) + pw)
        dd.ellipse((x - r, y - r, x + r, y + r), fill=rnd.randint(60, 170))
    folha = Image.composite(Image.new("RGB", (w, h), (228, 226, 220)), folha, desg.filter(ImageFilter.GaussianBlur(1.6)))
    sujo = _camada((w, h)); ImageDraw.Draw(sujo).rectangle((0, 0, w, h), outline=70, width=26)
    folha = Image.composite(Image.new("RGB", (w, h), (196, 195, 190)), folha, sujo.filter(ImageFilter.GaussianBlur(18)))
    alfa = _camada((w, h)); ImageDraw.Draw(alfa).rounded_rectangle((0, 0, w - 1, h - 1), radius=14, fill=255)
    folha.putalpha(alfa)
    return folha
