#!/usr/bin/env python3
"""Carrossel "Jurisprudência que não existe" · IA no Judiciário e a Resolução CNJ 615/2025.

Isca de notícia (o juiz que assinou decisão com precedente inventado pela IA)
e leitura jurídica (o que a Resolução 615 diz). Oito telas 1080x1440 montadas
numa faixa única de 8640 px, com o fio dourado de A Sala atravessando todas e
cartões de imagem que passam de uma tela para a seguinte. Depois a faixa é
cortada em oito PNGs (render.py).

Fatos: texto oficial da Resolução (material/resolucao-cnj-615-2025.pdf) e
imprensa jurídica; fontes na legenda.md.
"""
import base64, io, pathlib
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
MAT = OUT / "material"
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGO = RAIZ / "skills" / "ejup-design" / "assets" / "logo" / "ejup-horizontal-white.svg"
LOGO_N = RAIZ / "skills" / "ejup-design" / "assets" / "logo" / "ejup-horizontal-navy.svg"
W, H, N = 1080, 1440, 8


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def img(nome, larg=1600):
    im = Image.open(MAT / nome).convert("RGB")
    if im.width > larg:
        im = im.resize((larg, int(im.height * larg / im.width)), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=88)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def fontes():
    out = []
    for nome, peso in (("Light", 300), ("Book", 400), ("Medium", 500), ("Bold", 700), ("Black", 900)):
        out.append(f"@font-face{{font-family:'Gotham';font-weight:{peso};"
                   f"src:url({b64(FONTS / f'Gotham-{nome}.otf', 'font/otf')}) format('opentype')}}")
    return "\n".join(out)


ESCURAS = {0, 2, 4, 6, 7}           # telas de fundo escuro; as outras são papel


def x(k):
    return k * W


# ---------- fio dourado: um caminho só, cruzando as oito telas ----------
PTS = [(1030, 1470), (1062, 1100), (1080, 852), (1620, 856), (2160, 840), (2700, 770),
       (3240, 735), (3780, 730), (4320, 760), (4860, 770), (5180, 520), (5360, 150),
       (5650, 96), (6250, 96), (6520, 170), (6620, 480), (6740, 740), (7200, 760), (7560, 760),
       (7900, 900), (8200, 1010), (8700, 1040)]


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


def fio():
    d = caminho(PTS)
    claros = "".join(f'<rect x="{x(k)}" y="0" width="{W}" height="{H}"/>' for k in range(N) if k not in ESCURAS)
    escuros = "".join(f'<rect x="{x(k)}" y="0" width="{W}" height="{H}"/>' for k in ESCURAS)
    pinos = [(1080, 852), (3240, 735), (6250, 96), (8200, 1010)]
    pin = "".join(f'<circle cx="{a}" cy="{b}" r="9"/>' for a, b in pinos)
    return f"""<svg class="fio" viewBox="0 0 {W*N} {H}" width="{W*N}" height="{H}">
  <defs><clipPath id="ce">{escuros}</clipPath><clipPath id="cc">{claros}</clipPath>
  <filter id="brilho" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>
  <g clip-path="url(#ce)"><path d="{d}" stroke="#f0b855" stroke-width="10" fill="none" opacity=".35" filter="url(#brilho)"/>
    <path d="{d}" stroke="#f0b855" stroke-width="2.6" fill="none"/><g fill="#f0b855">{pin}</g></g>
  <g clip-path="url(#cc)"><path d="{d}" stroke="#9b6b26" stroke-width="2.6" fill="none"/><g fill="#9b6b26">{pin}</g></g>
</svg>"""


def tela(k, classe, miolo, fundo=""):
    return f'<section class="t {classe}" style="left:{x(k)}px">{fundo}{miolo}</section>'


def fonte(txt):
    return f'<p class="fonte">{txt}</p>'


def main():
    t = []
    # 1 · isca
    t.append(tela(0, "escura", f"""
  <h1 class="tit" style="top:690px">Um juiz assinou uma sentença com <em>jurisprudência que não existe.</em></h1>
  <p class="sub" style="top:1100px">Quem percebeu foi o advogado da parte que perdeu.</p>
  <img class="logo" src="{b64(LOGO, 'image/svg+xml')}" alt="">
  <p class="arraste">Arraste</p>""",
        f'<div class="bg" style="background-image:url({img("web-assinatura-pt.jpg")});background-position:40% 30%;filter:brightness(.5) saturate(.6) contrast(1.1)"></div><div class="veu baixo"></div>'))
    # 2 · o que aconteceu (papel) · o cartão da foto atravessa para a tela 3
    t.append(tela(1, "papel", f"""
  <h2 class="tit" style="top:150px">O ChatGPT tinha inventado <em>decisões do STJ.</em></h2>
  <p class="txt" style="top:430px">O juiz federal Jefferson Ferreira Rodrigues, no Acre, disse que um assessor redigiu a decisão com ajuda de IA. Chamou de mero equívoco.</p>
  <p class="txt" style="top:620px">O CNJ investigou. O corregedor regional Néviton Guedes recomendou: nada de IA aberta e não homologada para pesquisar jurisprudência.</p>
  {fonte("Fontes: Olhar Digital, Rota Jurídica e AFP, nov. 2023")}"""))
    # 3 · o outro lado da mesa
    t.append(tela(2, "escura", f"""
  <h2 class="tit" style="top:150px">Do outro lado da mesa, <em>a conta também chegou.</em></h2>
  <p class="txt" style="top:390px">O TSE confirmou, por unanimidade, multa de R$&nbsp;2&nbsp;mil à advogada Francisleidi Nigra, que citou precedentes inexistentes.</p>
  <p class="txt" style="top:580px">TJPR, TRT-MT e TJSC também aplicaram multas por jurisprudência falsa atribuída à IA.</p>
  {fonte("Fontes: Conjur, Migalhas, TJSC")}""",
        f'<div class="bg" style="background-image:url({img("web-tribunal.jpg")});background-position:50% 40%;filter:brightness(.32) saturate(.5)"></div><div class="veu" style="background:linear-gradient(180deg,rgba(3,28,55,.75),rgba(13,19,26,.55) 55%,rgba(13,19,26,.9))"></div>'))
    # 4 · a regra (papel) · documento oficial atravessa para a tela 5
    t.append(tela(3, "papel", f"""
  <h2 class="tit" style="top:830px">Em 2025, o CNJ <em>escreveu a regra.</em></h2>
  <p class="txt" style="top:1050px">A Resolução 615 organiza o uso de IA em todos os tribunais e substitui a norma de 2020. Vale desde julho de 2025. Os tribunais tiveram 12 meses para se adaptar, e esse prazo terminou em março de 2026.</p>
  {fonte("Res. CNJ 615/2025, arts. 45 a 47")}"""))
    # 5 · quem assina, responde
    t.append(tela(4, "escura", f"""
  <h2 class="tit" style="top:880px">Quem assina, <em>responde.</em></h2>
  <p class="txt" style="top:1020px">O juiz pode usar IA generativa como apoio, inclusive as ferramentas abertas na internet. A decisão continua sendo dele, e ele responde integralmente por ela e pelas informações que ela contém.</p>
  {fonte("Res. CNJ 615/2025, art. 19, § 3º, II")}""",
        f'<div class="bg" style="background-image:url({img("web-livros.jpg")});background-position:55% 50%;filter:brightness(.8) blur(4px);transform:scale(1.04)"></div><div class="veu baixo"></div>'))
    # 6 · as linhas que a IA não cruza (papel)
    itens = ["Entregar resultado que ninguém consegue revisar.",
             "Prever crime ou reincidência pela personalidade de alguém.",
             "Ranquear pessoas para avaliar direitos ou testemunhos.",
             "Reconhecer emoções por biometria.",
             "Ler processo sigiloso em IA externa, salvo com dados anonimizados na origem ou proteção técnica efetiva."]
    lis = "".join(f"<li>{i}</li>" for i in itens)
    t.append(tela(5, "papel", f"""
  <h2 class="tit" style="top:230px">Cinco linhas que a IA <em>não cruza</em> no Judiciário.</h2>
  <ul class="lista" style="top:520px">{lis}</ul>
  {fonte("Res. CNJ 615/2025, art. 10 e art. 19, § 3º, IV")}"""))
    # 7 · com voz, sem voto
    t.append(tela(6, "escura", f"""
  <h2 class="tit" style="top:760px">A advocacia está na mesa. <em>Com voz, sem voto.</em></h2>
  <p class="txt" style="top:1020px">O Comitê Nacional de IA do Judiciário fiscaliza a norma. OAB, Ministério Público, Defensoria e sociedade civil participam do debate. O voto fica com o CNJ e a magistratura.</p>
  {fonte("Res. CNJ 615/2025, art. 15, §§ 1º e 3º")}""",
        f'<div class="bg" style="background-image:url({img("web-cadeiras.jpg")});background-position:50% 30%;filter:brightness(.75)"></div><div class="veu baixo"></div>'))
    # 8 · fecho e chamada
    t.append(tela(7, "escura", f"""
  <h2 class="tit" style="top:200px">A régua vale para <em>os dois lados da mesa.</em></h2>
  <p class="txt" style="top:440px">Quem decide e quem peticiona respondem pelo que assinam. Usar IA com critério passou a fazer parte da competência jurídica.</p>
  <div class="cta" style="top:1060px"><p>Comente <b>RESOLUÇÃO</b> e a gente te envia o texto oficial da 615 com os artigos que mais afetam a advocacia marcados.</p></div>
  <img class="logo" src="{b64(LOGO, 'image/svg+xml')}" alt="">""",
        f'<div class="bg" style="background-image:url({img("web-nicho.jpg")});background-position:60% 50%;filter:brightness(.8)"></div><div class="veu cima"></div>'))

    # elementos que atravessam telas
    ponte = f"""
  <div class="cartao" style="left:{x(1)+96}px;top:880px;width:1260px;height:450px;background-image:url({img('web-laptop.jpg')});background-position:50% 50%"></div>
  <div class="doc" style="left:{x(3)+740}px;top:70px;width:500px;transform:rotate(4deg)"><img src="{img('doc-p1.jpg', 1400)}" alt=""></div>"""

    html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Carrossel Res 615</title><style>
{fontes()}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#222;font-family:'Gotham',sans-serif}}
.faixa{{position:relative;width:{W*N}px;height:{H}px;overflow:hidden}}
.t{{position:absolute;top:0;width:{W}px;height:{H}px;overflow:hidden}}
.escura{{background:#0d131a;color:#fff}}
.papel{{background:radial-gradient(90% 60% at 50% 30%,#f3f1ec 0%,#ecebe7 65%,#e4e2dd 100%);color:#031c37}}
.bg{{position:absolute;inset:0;background-size:cover}}
.veu{{position:absolute;inset:0}}
.veu.baixo{{background:linear-gradient(180deg,rgba(13,19,26,.15) 0%,rgba(13,19,26,.25) 35%,rgba(13,19,26,.9) 58%,#0d131a 78%)}}
.veu.cima{{background:linear-gradient(180deg,#0d131a 0%,rgba(13,19,26,.92) 38%,rgba(13,19,26,.35) 60%,rgba(13,19,26,.7) 100%)}}
.tit{{position:absolute;left:96px;right:96px;font-weight:900;font-size:72px;line-height:1.04;letter-spacing:-.025em;z-index:3}}
h1.tit{{font-size:84px}}
.tit em{{font-style:normal;color:#f0b855}}
.papel .tit em{{color:#9b6b26}}
.sub{{position:absolute;left:96px;right:120px;font-weight:300;font-size:38px;line-height:1.35;color:#d1d3d4;z-index:3}}
.txt{{position:absolute;left:96px;width:860px;font-weight:300;font-size:36px;line-height:1.4;z-index:3}}
.escura .txt{{color:#d1d3d4}}
.papel .txt{{color:#414042}}
.fonte{{position:absolute;left:96px;bottom:64px;font-weight:400;font-size:20px;letter-spacing:.02em;z-index:3}}
.escura .fonte{{color:rgba(209,211,212,.7)}}
.papel .fonte{{color:#5f6062}}
.logo{{position:absolute;left:96px;bottom:110px;width:190px;z-index:3}}
.escura .logo{{bottom:60px}}
.t:first-child .fonte{{display:none}}
.arraste{{position:absolute;right:96px;bottom:74px;font-weight:500;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:#f0b855;z-index:3}}
.arraste::after{{content:"";display:inline-block;width:46px;height:2px;background:#f0b855;margin-left:14px;vertical-align:middle}}
.lista{{position:absolute;left:96px;right:96px;list-style:none;display:grid;gap:30px;z-index:3}}
.lista li{{position:relative;padding-left:44px;font-weight:400;font-size:34px;line-height:1.3;color:#031c37;border-bottom:1px solid rgba(3,28,55,.14);padding-bottom:26px}}
.lista li::before{{content:"";position:absolute;left:0;top:14px;width:16px;height:16px;border-radius:50%;background:#9b6b26}}
.cta{{position:absolute;left:96px;right:96px;border:1.5px solid rgba(240,184,85,.6);border-radius:12px;padding:34px 36px;background:rgba(13,19,26,.55);z-index:3}}
.cta p{{font-weight:300;font-size:32px;line-height:1.4;color:#ecebe7}}
.cta b{{font-weight:900;color:#f0b855;letter-spacing:.04em}}
.fio{{position:absolute;left:0;top:0;z-index:2;pointer-events:none}}
.cartao{{position:absolute;z-index:1;border-radius:24px;background-size:cover;box-shadow:0 40px 70px -30px rgba(0,0,0,.8)}}
.doc{{position:absolute;z-index:1;background:#fff;padding:0;box-shadow:0 40px 80px -30px rgba(0,0,0,.6)}}
.doc img{{width:100%;display:block}}
</style></head><body><div class="faixa">
{''.join(t)}
{ponte}
{fio()}
</div></body></html>"""
    (OUT / "carrossel.html").write_text(html, encoding="utf-8")
    print("ok")


if __name__ == "__main__":
    main()
