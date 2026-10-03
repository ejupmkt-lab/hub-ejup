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
ESCURAS = {0, 2, 3, 4, 6}           # 1 (verbete) e 5 (carta) são papel


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
# a orbe 3D aparece só em três momentos: capa, fonte e fecho (imagens de fundo)
PTS = [(749, 439), (900, 520), (1060, 560), (1176, 562), (1960, 562), (2110, 640), (2135, 900),
       (2160, 1250), (2300, 1385), (2700, 1395), (3100, 1360), (3330, 1170), (3700, 1170),
       (4230, 1170), (4275, 900), (4300, 560), (4600, 380), (5080, 364), (5500, 300), (5880, 360),
       (6060, 420), (6500, 480), (7020, 430)]


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


def regua():
    """A régua da marca: traço longo com marcas a cada 12 px e cinco medidas nomeadas."""
    marcas = "".join(
        f'<line x1="{i}" y1="0" x2="{i}" y2="{30 if i % 60 == 0 else 14}" />' for i in range(0, 889, 12))
    nomes = ["Palavra", "Tom", "Cor", "Tipografia", "Imagem"]
    pos = [0, 216, 432, 648, 888]
    rot = "".join(f'<text x="{p}" y="72" text-anchor="{"start" if i == 0 else "end" if i == 4 else "middle"}">{n}</text>'
                  for i, (p, n) in enumerate(zip(pos, nomes)))
    big = "".join(f'<line x1="{p}" y1="0" x2="{p}" y2="46" class="maior"/>' for p in pos)
    return f'<svg class="regua" viewBox="-4 -2 896 90" width="896" height="90">{marcas}{big}{rot}</svg>'


def main():
    logo_b = b64(LOGOS / "ejup-horizontal-white.svg", "image/svg+xml")
    t = []
    # 1 · capa: a coruja e a orbe
    t.append(tela(0, "escura", f"""
  <h1 class="tit" style="top:880px">Antes de chegar até você, tudo passa <em>por&nbsp;ela.</em></h1>
  <p class="sub" style="top:1170px">Conheça Minerva, a guardiã da marca EJUP.</p>
  <img class="logo" src="{logo_b}" alt="">
  <p class="arraste">Arraste</p>""",
        f'<div class="bg" style="background:#05080c url({img("../orbe-3d/orbe-coruja.png", 1600)}) no-repeat -60px 40px/1600px auto"></div>'
        '<div class="veu" style="background:linear-gradient(180deg,rgba(13,19,26,0) 40%,rgba(13,19,26,.8) 58%,#0d131a 70%)"></div>'))
    # 2 · verbete (papel)
    t.append(tela(1, "papel", """
  <p class="classe" style="top:300px">Substantivo próprio · feminino</p>
  <h2 class="verbete" style="top:352px">Mi·ner·va</h2>
  <ol class="acepcoes" style="top:680px">
    <li>Deusa romana da sabedoria, a Atena dos gregos. Seu símbolo é a coruja.</li>
    <li>Na EJUP, a guardiã da marca. Confere qualidade, segurança e coerência de tudo o que leva o nome da escola, antes de chegar a você.</li>
  </ol>"""))
    # 3 · voto de Minerva: a estátua
    t.append(tela(2, "escura", """
  <h2 class="tit" style="top:620px">Vem dela o<br><em>voto de Minerva.</em></h2>
  <p class="txt" style="top:830px;width:820px">Na tragédia de Ésquilo, Atena instala um tribunal e desempata o julgamento de Orestes. É a decisão que pesa quando os lados se equilibram.</p>
  <p class="fonte topo">Ésquilo, <i>Eumênides</i> · Atena Varvakeion, séc. III d.C.</p>""",
        f'<div class="bg" style="background-image:url({img("atena-varv2-up.jpg", 1400)});background-size:auto 112%;background-position:62% 0%;filter:brightness(.72) saturate(.5)"></div>'
        '<div class="veu" style="background:linear-gradient(180deg,rgba(13,19,26,.15) 0%,rgba(13,19,26,0) 30%,rgba(13,19,26,.82) 50%,#0d131a 68%)"></div>'))
    # 4 · critério: campo azul, tipografia e a régua
    t.append(tela(3, "azul", f"""
  <h2 class="tit pequeno" style="top:170px">Ela guarda <em>o critério.</em></h2>
  <p class="manifesto" style="top:380px">A EJUP<br>não grita.<br><em>A EJUP<br>tem peso.</em></p>
  <p class="txt" style="top:960px;width:820px">Cada detalhe passa pela régua da marca. O que destoa volta para ajuste.</p>
  <div style="position:absolute;left:96px;top:1170px;z-index:3">{regua()}</div>"""))
    # 5 · fonte: a orbe sobre os livros
    t.append(tela(4, "escura", """
  <h2 class="tit" style="top:700px">Ela guarda<br><em>a fonte.</em></h2>
  <p class="txt" style="top:910px">Número, citação, decisão e nome próprio só entram com origem rastreada, sustentada por fontes de naturezas diferentes.</p>
  <p class="txt" style="top:1170px">Afirmação sem fonte devolve a peça. Simplificação que distorce o Direito também.</p>""",
        f'<div class="bg" style="background:#05080c url({img("../orbe-3d/orbe-livros.png", 2600)}) no-repeat -489px 0/auto 1440px"></div>'
        '<div class="veu" style="background:linear-gradient(180deg,rgba(13,19,26,0) 35%,rgba(13,19,26,.82) 52%,rgba(13,19,26,.9) 100%)"></div>'))
    # 6 · confiança (papel): a carta lacrada atravessa para a tela 7
    itens = [("Ética", "profissional da advocacia"), ("Dados", "pessoais conforme a LGPD"),
             ("Imagem", "e autoria verificadas"), ("Nenhuma", "promessa de resultado")]
    grade = "".join(f"<div><b>{a}</b> {b}</div>" for a, b in itens)
    t.append(tela(5, "papel", f"""
  <h2 class="tit" style="top:830px">Ela guarda<br><em>a confiança.</em></h2>
  <div class="grade" style="top:1050px">{grade}</div>"""))
    # 7 · fecho: a orbe aberta sob o arco
    t.append(tela(6, "escura", f"""
  <h2 class="tit" style="top:790px">Sabedoria também é saber <em>a quem cabe a palavra final.</em></h2>
  <p class="txt" style="top:1080px">Minerva confere, aponta e devolve. Quem decide é sempre uma pessoa da escola.</p>
  <p class="cta">Siga a EJUP</p>
  <img class="logo" src="{logo_b}" alt="">""",
        f'<div class="bg" style="background:#05080c url({img("../orbe-3d/orbe-arco.png", 2000)}) no-repeat -421px -89px/auto 1100px"></div>'
        '<div class="veu" style="background:linear-gradient(180deg,rgba(13,19,26,0) 45%,rgba(13,19,26,.85) 58%,#0d131a 72%)"></div>'))

    ponte = (f'<img class="moeda" src="{img("moeda-recorte.png", 900)}" alt="" style="left:{x(2) - 240}px;top:1110px;width:440px">'
             f'<div class="carta" style="left:{x(5) + 170}px;top:150px;width:900px"><img src="{img("lacre-carta-sobrio.jpg", 1400)}" alt=""></div>')

    html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Carrossel Minerva</title><style>
{fontes()}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#222;font-family:'Gotham',sans-serif}}
.faixa{{position:relative;width:{W*N}px;height:{H}px;overflow:hidden}}
.t{{position:absolute;top:0;width:{W}px;height:{H}px;overflow:hidden}}
.escura{{background:#0d131a;color:#fff}}
.azul{{background:#031c37;color:#fff}}
.papel{{background:radial-gradient(90% 60% at 50% 30%,#f3f1ec 0%,#ecebe7 65%,#e4e2dd 100%);color:#031c37}}
.bg{{position:absolute;inset:0;background-size:cover}}
.veu{{position:absolute;inset:0}}
.tit{{position:absolute;left:96px;right:96px;font-weight:900;font-size:80px;line-height:1.04;letter-spacing:-.025em;z-index:3}}
.tit.pequeno{{font-size:48px;letter-spacing:-.02em}}
h1.tit{{font-size:84px}}
.tit em{{font-style:normal;color:#f0b855}}
.papel .tit em{{color:#9b6b26}}
.sub{{position:absolute;left:96px;right:120px;font-weight:300;font-size:40px;line-height:1.35;color:#d1d3d4;z-index:3}}
.txt{{position:absolute;left:96px;width:860px;font-weight:300;font-size:40px;line-height:1.42;z-index:3;color:#d1d3d4}}
.papel .txt{{color:#414042}}
.fonte{{position:absolute;left:96px;bottom:64px;font-weight:400;font-size:20px;line-height:1.4;letter-spacing:.02em;z-index:3;color:rgba(209,211,212,.75)}}
.fonte.topo{{bottom:auto;top:64px;left:auto;right:96px;text-align:right}}
.logo{{position:absolute;left:96px;bottom:64px;width:190px;z-index:3}}
.arraste{{position:absolute;right:96px;bottom:74px;font-weight:500;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#f0b855;z-index:3}}
.arraste::after{{content:"";display:inline-block;width:46px;height:2px;background:#f0b855;margin-left:14px;vertical-align:middle}}
.cta{{position:absolute;right:96px;bottom:70px;font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:#f0b855;z-index:3}}
.classe{{position:absolute;left:96px;font-weight:500;font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:#9b6b26;z-index:3}}
.verbete{{position:absolute;left:84px;font-weight:900;font-size:176px;line-height:1;letter-spacing:-.03em;color:#031c37;z-index:3}}
.acepcoes{{position:absolute;left:96px;right:96px;list-style:none;counter-reset:a;display:grid;gap:40px;z-index:3}}
.acepcoes li{{counter-increment:a;position:relative;padding-left:72px;font-weight:300;font-size:40px;line-height:1.4;color:#414042}}
.acepcoes li::before{{content:counter(a);position:absolute;left:0;top:-2px;font-weight:900;font-size:44px;color:#9b6b26}}
.acepcoes li+li{{padding-top:40px;border-top:1px solid rgba(3,28,55,.14)}}
.acepcoes li+li::before{{top:38px}}
.manifesto{{position:absolute;left:96px;font-weight:900;font-size:118px;line-height:.98;letter-spacing:-.035em;color:#fff;z-index:3}}
.manifesto em{{font-style:normal;color:#f0b855}}
.regua line{{stroke:#f0b855;stroke-width:2}}
.regua line.maior{{stroke-width:3}}
.regua text{{fill:#d1d3d4;font-family:'Gotham';font-weight:500;font-size:17px;letter-spacing:.14em;text-transform:uppercase}}
.grade{{position:absolute;left:96px;right:96px;display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(3,28,55,.16);z-index:3}}
.grade div{{padding:30px 24px 30px 0;font-weight:300;font-size:34px;line-height:1.3;color:#414042;border-bottom:1px solid rgba(3,28,55,.16)}}
.grade div:nth-child(even){{padding-left:32px;border-left:1px solid rgba(3,28,55,.16)}}
.grade b{{font-weight:900;color:#031c37}}
.fio{{position:absolute;left:0;top:0;z-index:2;pointer-events:none}}
.moeda{{position:absolute;z-index:4;transform:rotate(-8deg);filter:drop-shadow(0 30px 40px rgba(0,0,0,.55)) saturate(.7)}}
.carta{{position:absolute;z-index:4;transform:rotate(-5deg);box-shadow:0 50px 80px -30px rgba(3,28,55,.55)}}
.carta img{{display:block;width:100%}}
</style></head><body><div class="faixa">
{''.join(t)}
{ponte}
{fio_e_orbes()}
</div></body></html>"""
    (OUT / "carrossel.html").write_text(html, encoding="utf-8")
    print("ok")


if __name__ == "__main__":
    main()
