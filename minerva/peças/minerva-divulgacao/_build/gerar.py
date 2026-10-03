#!/usr/bin/env python3
"""Carrossel "Minerva, a guardiã da marca EJUP".

Sete telas 1080x1440 numa faixa única. A orbe de Minerva (a mesma da
interface de voz: esfera navy, aro dourado, anéis que abrem) aparece pequena
e fechada na capa e vai abrindo tela a tela; o fio dourado passa por dentro
de cada orbe e liga a sequência. A moeda da coruja de Atenas atravessa da
tela 2 para a 3. Depois a faixa é cortada em sete PNGs (render.py).

Imagens: domínio público ou CC BY, créditos em material/CREDITOS.md.
"""
import base64, io, pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
MAT = OUT / "material" / "web"
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"
W, H, N = 1080, 1440, 7
ESCURAS = set(range(7))


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def img(nome, larg=1600, caixa=None):
    im = Image.open(MAT / nome)
    if caixa:
        im = im.crop(caixa)
    png = im.mode in ("RGBA", "L")
    if im.width > larg:
        im = im.resize((larg, int(im.height * larg / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    if png:
        im.save(buf, "PNG"); mime = "image/png"
    else:
        im.convert("RGB").save(buf, "JPEG", quality=88); mime = "image/jpeg"
    return f"data:{mime};base64," + base64.b64encode(buf.getvalue()).decode()


def fontes():
    out = []
    for nome, peso in (("Light", 300), ("Book", 400), ("Medium", 500), ("Bold", 700), ("Black", 900)):
        out.append(f"@font-face{{font-family:'Gotham';font-weight:{peso};"
                   f"src:url({b64(FONTS / f'Gotham-{nome}.otf', 'font/otf')}) format('opentype')}}")
    return "\n".join(out)


def x(k):
    return k * W


# a orbe 3D de Minerva: quadros do vídeo de abertura, do fechado ao aberto
ORBES = [  # (tela, centro x, centro y, largura, quadro)
    (1, 540, 420, 700, "orbe-001.png"),
    (3, 900, 210, 250, "orbe-040.png"),
    (5, 900, 210, 270, "orbe-095.png"),
]


def orbes():
    return "".join(
        f'<img class="orbe" src="{img("../orbe-3d/" + q, 900)}" alt="" '
        f'style="left:{x(k) + cx - w / 2:.0f}px;top:{cy - w / 2:.0f}px;width:{w}px">'
        for k, cx, cy, w, q in ORBES)


PTS = [(749, 439), (900, 560), (1080, 560), (1320, 470), (1620, 420), (1950, 250), (2160, 110),
       (2700, 70), (3240, 120), (3700, 190), (4140, 210), (4560, 290), (5080, 364), (5500, 270),
       (6300, 210), (6700, 330), (7020, 430)]


def caminho(p):
    d = f"M{p[0][0]},{p[0][1]}"
    for i in range(len(p) - 1):
        p0 = p[i - 1] if i else p[i]
        p1, p2 = p[i], p[i + 1]
        p3 = p[i + 2] if i + 2 < len(p) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f" C{c1[0]:.0f},{c1[1]:.0f} {c2[0]:.0f},{c2[1]:.0f} {p2[0]},{p2[1]}"
    return d


def fio_e_orbes():
    d = caminho(PTS)
    claros = "".join(f'<rect x="{x(k)}" y="0" width="{W}" height="{H}"/>' for k in range(N) if k not in ESCURAS)
    escuros = "".join(f'<rect x="{x(k)}" y="0" width="{W}" height="{H}"/>' for k in ESCURAS)
    return f"""<svg class="fio" viewBox="0 0 {W*N} {H}" width="{W*N}" height="{H}">
  <defs><clipPath id="ce">{escuros}</clipPath><clipPath id="cc">{claros}</clipPath>
  <filter id="brilho" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>
  <g clip-path="url(#ce)"><path d="{d}" stroke="#f0b855" stroke-width="10" fill="none" opacity=".35" filter="url(#brilho)"/>
    <path d="{d}" stroke="#f0b855" stroke-width="2.6" fill="none"/></g>
  <g clip-path="url(#cc)"><path d="{d}" stroke="#9b6b26" stroke-width="2.6" fill="none"/></g>
</svg>"""


def tela(k, classe, miolo, fundo=""):
    return f'<section class="t {classe}" style="left:{x(k)}px">{fundo}{miolo}</section>'


def main():
    logo_b = b64(LOGOS / "ejup-horizontal-white.svg", "image/svg+xml")
    t = []
    # 1 · capa
    t.append(tela(0, "escura", f"""
  <h1 class="tit" style="top:880px">Antes de chegar até você, tudo passa <em>por&nbsp;ela.</em></h1>
  <p class="sub" style="top:1170px">Conheça Minerva, a guardiã da marca EJUP.</p>
  <img class="logo" src="{logo_b}" alt="">
  <p class="arraste">Arraste</p>""",
        f'<div class="bg" style="background:#05080c url({img("../orbe-3d/orbe-coruja.png", 1600)}) no-repeat -60px 40px/1600px auto"></div>'
        '<div class="veu" style="background:linear-gradient(180deg,rgba(13,19,26,.0) 40%,rgba(13,19,26,.8) 58%,#0d131a 70%)"></div>'))
    # 2 · quem é
    t.append(tela(1, "escura profunda", """
  <h2 class="tit" style="top:810px">Esta é <em>Minerva.</em></h2>
  <p class="txt" style="top:920px;width:720px">A inteligência que a EJUP criou para guardar a própria marca. Antes de qualquer peça existir em público, ela confere qualidade, segurança e coerência com a escola.</p>"""))
    # 3 · o nome
    t.append(tela(2, "escura profunda", """
  <h2 class="tit" style="top:210px">Por que <em>Minerva.</em></h2>
  <p class="txt" style="top:350px">Minerva é o nome romano de Atena, deusa da sabedoria. A coruja, seu símbolo, circulava nas moedas de Atenas há mais de dois mil anos.</p>
  <p class="txt" style="top:650px">Na tragédia de Ésquilo, Atena instala um tribunal e desempata o julgamento de Orestes. Vem daí o <b>voto de Minerva</b>: a decisão que pesa quando os lados se equilibram.</p>
  <p class="fonte dir">Ésquilo, <i>Eumênides</i> · Moeda: tetradracma de Atenas, 449–407 a.C., Cleveland Museum of Art</p>"""))
    # 4 · critério (papel)
    t.append(tela(3, "escura profunda", f"""
  <h2 class="tit" style="top:420px">Ela guarda<br><em>o critério.</em></h2>
  <p class="txt estreito" style="top:640px">Palavra, tom, cor, tipografia, imagem. Cada detalhe passa pela régua da marca, e o que destoa volta para ajuste.</p>
  <blockquote class="frase" style="top:1040px">A EJUP não grita.<br>A EJUP tem peso.</blockquote>""",
        f'<img class="gravura" src="{img("minerva-gravura-neg.png", 1024, (300, 40, 724, 1000))}" alt="">'))
    # 5 · fonte
    t.append(tela(4, "escura", """
  <h2 class="tit" style="top:700px">Ela guarda<br><em>a fonte.</em></h2>
  <p class="txt" style="top:910px">Número, citação, decisão e nome próprio só entram com origem rastreada, sustentada por fontes de naturezas diferentes.</p>
  <p class="txt" style="top:1170px">Afirmação sem fonte devolve a peça. Simplificação que distorce o Direito também.</p>""",
        f'<div class="bg" style="background:#05080c url({img("../orbe-3d/orbe-livros.png", 2600)}) no-repeat -489px 0/auto 1440px"></div>'
        '<div class="veu" style="background:linear-gradient(180deg,rgba(13,19,26,0) 35%,rgba(13,19,26,.82) 52%,rgba(13,19,26,.9) 100%)"></div>'))
    # 6 · confiança
    itens = ["Ética profissional da advocacia.",
             "Dados pessoais tratados conforme a LGPD.",
             "Direito de imagem e autoria verificados.",
             "Nenhuma promessa de resultado. Nenhuma urgência fabricada."]
    lis = "".join(f"<li>{i}</li>" for i in itens)
    t.append(tela(5, "escura", f"""
  <h2 class="tit" style="top:400px">Ela guarda<br><em>a confiança.</em></h2>
  <ul class="lista" style="top:640px">{lis}</ul>""",
        f'<div class="bg" style="background-image:url({img("atena-varv-up.jpg", 1600, (420, 0, 1366, 2048))});background-position:50% 20%;filter:brightness(.4) saturate(.4)"></div>'
        '<div class="veu" style="background:linear-gradient(90deg,rgba(13,19,26,.92),rgba(13,19,26,.6) 70%,rgba(13,19,26,.35)),linear-gradient(180deg,rgba(13,19,26,.6),rgba(13,19,26,0) 30%)"></div>'))
    # 7 · fecho
    t.append(tela(6, "escura", f"""
  <h2 class="tit" style="top:790px">Sabedoria também é saber <em>a quem cabe a palavra final.</em></h2>
  <p class="txt" style="top:1080px">Minerva confere, aponta e devolve. Quem decide é sempre uma pessoa da escola.</p>
  <p class="cta" style="top:1200px">Siga a EJUP</p>
  <img class="logo" src="{logo_b}" alt="">""",
        f'<div class="bg" style="background:#05080c url({img("../orbe-3d/orbe-arco.png", 2000)}) no-repeat -421px -89px/auto 1100px"></div>'
        '<div class="veu" style="background:linear-gradient(180deg,rgba(13,19,26,0) 45%,rgba(13,19,26,.85) 58%,#0d131a 72%)"></div>'))

    ponte = f'<img class="moeda" src="{img("moeda-recorte.png", 900)}" alt="" style="left:{x(2) - 250}px;top:1060px;width:480px">'

    html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Carrossel Minerva</title><style>
{fontes()}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#222;font-family:'Gotham',sans-serif}}
.faixa{{position:relative;width:{W*N}px;height:{H}px;overflow:hidden}}
.t{{position:absolute;top:0;width:{W}px;height:{H}px;overflow:hidden}}
.escura{{background:#0d131a;color:#fff}}
.profunda{{background:radial-gradient(80% 55% at 50% 30%,#0a2440 0%,#061a30 45%,#0d131a 100%)}}
.papel{{background:radial-gradient(90% 60% at 50% 30%,#f3f1ec 0%,#ecebe7 65%,#e4e2dd 100%);color:#031c37}}
.bg{{position:absolute;inset:0;background-size:cover}}
.veu{{position:absolute;inset:0}}
.tit{{position:absolute;left:96px;right:96px;font-weight:900;font-size:80px;line-height:1.04;letter-spacing:-.025em;z-index:3}}
h1.tit{{font-size:84px}}
.tit em{{font-style:normal;color:#f0b855}}
.papel .tit em{{color:#9b6b26}}
.sub{{position:absolute;left:96px;right:120px;font-weight:300;font-size:40px;line-height:1.35;color:#d1d3d4;z-index:3}}
.txt{{position:absolute;left:96px;width:860px;font-weight:300;font-size:40px;line-height:1.42;z-index:3}}
.txt b{{font-weight:500;color:#f0b855}}
.txt.estreito{{width:640px}}
.escura .txt{{color:#d1d3d4}}
.papel .txt{{color:#414042}}
.fonte{{position:absolute;left:96px;bottom:64px;font-weight:400;font-size:20px;line-height:1.4;letter-spacing:.02em;z-index:3;color:rgba(209,211,212,.7)}}
.fonte.dir{{left:330px;right:96px;text-align:right}}
.logo{{position:absolute;left:96px;bottom:64px;width:190px;z-index:3}}
.arraste{{position:absolute;right:96px;bottom:74px;font-weight:500;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#f0b855;z-index:3}}
.arraste::after{{content:"";display:inline-block;width:46px;height:2px;background:#f0b855;margin-left:14px;vertical-align:middle}}
.frase{{position:absolute;left:96px;right:96px;font-weight:900;font-size:60px;line-height:1.1;letter-spacing:-.02em;color:#fff;border-left:4px solid #f0b855;padding-left:36px;z-index:3}}
.gravura{{position:absolute;right:-150px;bottom:0;height:1100px;mix-blend-mode:screen;opacity:.22;z-index:1}}
.lista{{position:absolute;left:96px;right:150px;list-style:none;display:grid;gap:30px;z-index:3}}
.lista li{{position:relative;padding-left:44px;font-weight:300;font-size:40px;line-height:1.3;color:#ecebe7;border-bottom:1px solid rgba(209,211,212,.2);padding-bottom:28px}}
.lista li::before{{content:"";position:absolute;left:0;top:15px;width:16px;height:16px;border-radius:50%;background:#f0b855}}
.cta{{position:absolute;right:96px;bottom:70px;font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:#f0b855;z-index:3}}
.fio{{position:absolute;left:0;top:0;z-index:2;pointer-events:none}}
.orbe{{position:absolute;z-index:3;mix-blend-mode:screen}}
.moeda{{position:absolute;z-index:4;transform:rotate(-8deg);filter:drop-shadow(0 30px 40px rgba(0,0,0,.7)) saturate(.7)}}
</style></head><body><div class="faixa">
{''.join(t)}
{ponte}
{fio_e_orbes()}
{orbes()}
</div></body></html>"""
    (OUT / "carrossel.html").write_text(html, encoding="utf-8")
    print("ok")


if __name__ == "__main__":
    main()
