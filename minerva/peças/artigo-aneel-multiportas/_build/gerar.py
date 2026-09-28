#!/usr/bin/env python3
"""Artigo "O sistema multiportas da ANEEL": capa do site, story e carrossel do LinkedIn.

Um recurso só costura as três peças: as portas do sistema desenhadas como
arcos (arquitetura clássica depurada, do mapa imagético). No carrossel, cada
tela acende a porta de que fala; na capa e no fecho, todas.

    python3 _build/gerar.py && python3 _build/render.py
"""
import base64
import io
import pathlib

from PIL import Image, ImageOps

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"

PORTAS = ["Ouvidoria", "Mediação", "Arbitragem", "Judiciário"]
TODAS = set(range(4))


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    return "\n".join(
        f"@font-face{{font-family:'Gotham';font-weight:{peso};"
        f"src:url({b64(FONTS / f'Gotham-{n}.otf', 'font/otf')}) format('opentype')}}"
        for n, peso in (("Light", 300), ("Book", 400), ("Medium", 500),
                        ("Bold", 700), ("Black", 900)))


LOGO = b64(LOGOS / "ejup-horizontal-white.svg", "image/svg+xml")
FOTOS = OUT / "fotos"


def fundo(nome, foco=0.5, gama=0.8):
    """Foto do carrossel em duotone da paleta (tinta nas sombras, prata nas
    luzes), recortada em 1080x820: a foto ocupa a parte de cima da tela e se dissolve no navy, onde o texto mora. foco: posição horizontal do recorte."""
    arq = FOTOS / f"{nome}.jpg"
    try:
        im = Image.open(arq).convert("L")
    except (FileNotFoundError, OSError):
        print(f"aviso: {arq.name} ausente ou inválida, tela sem foto")
        return ""
    im = ImageOps.autocontrast(im, cutoff=2)
    im = im.point(lambda v: int(255 * (v / 255) ** gama))   # abre as sombras das fotos noturnas
    im = ImageOps.fit(im, (1080, 820), Image.LANCZOS, centering=(foco, 0.5))
    im = ImageOps.colorize(im, black="#0d131a", mid="#304557", white="#d1d3d4")
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=84)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def portas(acesas, largura, rotulos=True, prop=1.9):
    """Quatro arcos lado a lado. As acesas ganham luz dourada por dentro."""
    n, gap = 4, 0.16
    w = 100 / (n + (n - 1) * gap)          # largura de cada porta, em unidades de 100
    h = w * prop
    H = h + (16 if rotulos else 2)
    partes = ['<defs><linearGradient id="luz" x1="0" y1="1" x2="0" y2="0">'
              '<stop offset="0" stop-color="#f0b855" stop-opacity=".55"/>'
              '<stop offset=".7" stop-color="#f0b855" stop-opacity=".12"/>'
              '<stop offset="1" stop-color="#f0b855" stop-opacity="0"/></linearGradient></defs>']
    for i in range(n):
        x = i * w * (1 + gap)
        r = w / 2
        d = (f"M{x:.2f},{h:.2f} V{r:.2f} A{r:.2f},{r:.2f} 0 0 1 {x + w:.2f},{r:.2f} "
             f"V{h:.2f} Z")
        acesa = i in acesas
        partes.append(f'<path d="{d}" fill="{"url(#luz)" if acesa else "rgba(209,211,212,.04)"}" '
                      f'stroke="{"#f0b855" if acesa else "rgba(209,211,212,.34)"}" '
                      f'stroke-width="{1.6 if acesa else 1.2}" vector-effect="non-scaling-stroke"/>')
        # soleira: a linha do chão sob cada porta
        partes.append(f'<line x1="{x - 1:.2f}" y1="{h:.2f}" x2="{x + w + 1:.2f}" y2="{h:.2f}" '
                      f'stroke="{"#f0b855" if acesa else "rgba(209,211,212,.34)"}" '
                      'stroke-width="1.5" vector-effect="non-scaling-stroke"/>')
        if rotulos:
            partes.append(f'<text x="{x + r:.2f}" y="{h + 9:.2f}" text-anchor="middle" '
                          f'class="rot{" on" if acesa else ""}">{PORTAS[i].upper()}</text>')
    return (f'<svg class="portas" viewBox="-1 -1 102 {H + 2:.2f}" width="{largura}" '
            f'style="height:auto">{"".join(partes)}</svg>')


# ------------------------------------------------------------------ capa do site
def capa_site():
    return f"""<div class="peca site" id="site">
  <div class="texto">
    <span class="tag">EJUP · Artigo</span>
    <h1 class="titulo">O sistema multiportas<br><span class="g">da ANEEL</span></h1>
    <p class="sub">O que é e como funciona a mediação de conflitos no setor elétrico.</p>
    <p class="meta">Coluna jurídica <i></i> Direito da energia</p>
  </div>
  <div class="arte">{portas(TODAS, 520)}</div>
  <img class="logo" src="{LOGO}" alt="EJUP">
</div>"""


# ------------------------------------------------------------------ story
def story():
    return f"""<div class="peca story" id="story">
  <h1 class="titulo">O setor elétrico tem <span class="g">quatro portas</span> para um mesmo conflito.</h1>
  <div class="arte">{portas(TODAS, 904)}</div>
  <p class="sub">Novo artigo na coluna jurídica: o sistema multiportas da ANEEL, da Ouvidoria à arbitragem.</p>
  <div class="pilula"><i>&rarr;</i><span>Leia o artigo completo no site da EJUP</span></div>
  <img class="logo" src="{LOGO}" alt="EJUP">
</div>"""


# ------------------------------------------------------------------ carrossel LinkedIn
def tela(acesas, miolo, fecho=False, foto=None, foco=0.5, gama=0.8, opac=.85, topo=0):
    """opac e topo ajustam cada foto: menos presença quando a textura briga
    com os rótulos das portas; topo desce a foto quando o assunto dela cai
    atrás dos rótulos."""
    img = fundo(foto, foco, gama) if foto else ""
    mascara = ("" if not topo else
               ";-webkit-mask-image:linear-gradient(180deg,transparent 0%,#000 22%,#000 55%,transparent 100%)"
               ";mask-image:linear-gradient(180deg,transparent 0%,#000 22%,#000 55%,transparent 100%)")
    camada = (f'<div class="fundo" style="background-image:url({img});opacity:{opac};top:{topo}px{mascara}"></div>'
              '<div class="veu"></div>') if img else ""
    return (f'<div class="peca li{" fecho" if fecho else ""}">' + camada +
            f'<div class="arte">{portas(acesas, 856, prop=1.15)}</div>'
            f'<div class="miolo">{miolo}</div>'
            f'<img class="logo" src="{LOGO}" alt="EJUP"></div>')


def carrossel():
    return [
        tela(TODAS, """
  <h1 class="titulo">O setor elétrico tem <span class="g">quatro portas</span> para um mesmo conflito.</h1>
  <p class="sub">O sistema multiportas da ANEEL: o que é e como funciona a mediação de conflitos no setor elétrico.</p>
  <p class="seta">Coluna jurídica EJUP <b>&rarr;</b></p>""", foto="01-capa", foco=0.5),
        tela(set(), """
  <h1 class="titulo t2">A via administrativa nasce com a <span class="g">própria ANEEL</span>.</h1>
  <p class="corpo">A Lei nº 9.427/1996, que criou a Agência, atribui a ela dirimir as divergências entre os agentes do setor e entre eles e os consumidores.</p>
  <ul class="normas">
    <li><b>Lei nº 13.848/2019</b><span>art. 22 · a ouvidoria das agências</span></li>
    <li><b>Lei nº 10.848/2004</b><span>art. 4º, §5º · arbitragem na comercialização</span></li>
    <li><b>REN ANEEL nº 957/2021</b><span>câmaras arbitrais credenciadas</span></li>
    <li><b>REN ANEEL nº 1.061/2023</b><span>cria a SMA, que conduz a mediação</span></li>
  </ul>""", foto="02-base", foco=0.42, gama=0.6, opac=1),
        tela({0}, """
  <p class="numero">200 mil</p>
  <p class="num-leg">reclamações por ano chegam à ANEEL pela Ouvidoria Setorial.</p>
  <p class="corpo">É a porta do consumidor que não resolveu o problema com a distribuidora. Cada registro segue para a concessionária responder, e o conjunto alimenta a fiscalização e as novas regras do setor.</p>""", foto="03-ouvidoria", foco=0.5, opac=.5),
        tela({1}, """
  <h1 class="titulo t2">O mediador facilita o diálogo. <span class="g">O acordo é das partes.</span></h1>
  <div class="dados">
    <div><p class="numero n2">36</p><p class="num-leg">mediações conduzidas entre 2018 e 2023</p></div>
    <div><p class="numero n2">383</p><p class="num-leg">dias de prazo médio até a conclusão</p></div>
  </div>
  <p class="corpo">Conduzida pela própria Agência, trata conflitos técnicos e regulatórios com quem conhece o setor.</p>""", foto="04-mediacao", foco=0.35),
        tela({2}, """
  <h1 class="titulo t2">Na comercialização, <span class="g">os agentes escolhem a câmara arbitral.</span></h1>
  <p class="corpo">A REN ANEEL nº 957/2021 abriu as disputas no âmbito da CCEE a qualquer câmara credenciada. Antes, uma única câmara concentrava esses casos.</p>
  <p class="corpo">Em certos contratos, arbitragem e processo judicial convivem, conforme os critérios de matéria e valor definidos entre as partes.</p>""", foto="05-arbitragem", foco=0.7, gama=0.7, topo=100),
        tela({3}, """
  <p class="numero">25 mil</p>
  <p class="num-leg">ações judiciais no setor elétrico em 2021, o pico da série.</p>
  <p class="corpo">Cerca de 4 mil vieram do apagão no Amapá. A via judicial segue aberta a qualquer parte; as outras portas ampliam o repertório de quem conduz o conflito.</p>""", foto="06-judiciario", foco=0.5),
        tela(TODAS, """
  <h1 class="titulo t2">Escolher a porta certa <span class="g">integra a estratégia</span> do caso.</h1>
  <p class="corpo">Assessorar um consumidor diante da distribuidora ou orientar um agente numa controvérsia contratual começa pela via adequada.</p>
  <div class="pilula"><i>&rarr;</i><span>Leia o artigo completo no site da EJUP</span></div>""", fecho=True, foto="07-fecho", foco=0.3),
    ]


CSS = """
:root{--navy:#031c37;--deep:#061424;--steel:#304557;--silver:#d1d3d4;--gold:#f0b855}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#10151b;display:flex;flex-wrap:wrap;gap:28px;padding:28px;align-items:flex-start;
     font-family:'Gotham','Montserrat',system-ui,sans-serif}
.peca{position:relative;overflow:hidden;color:#fff;
  background:radial-gradient(70% 60% at 50% 30%,rgba(240,184,85,.07) 0%,rgba(240,184,85,0) 65%),
             radial-gradient(70% 80% at 8% 0%,#0a2340 0%,rgba(10,35,64,0) 60%),
             linear-gradient(160deg,#071a2f 0%,var(--deep) 55%,#040d18 100%)}
.peca::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.035;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>")}
.portas{display:block;overflow:visible}
.portas .rot{filter:drop-shadow(0 0 .8px rgba(6,20,36,.95)) drop-shadow(0 0 2px rgba(6,20,36,.8));font:500 2.7px 'Gotham';letter-spacing:.1em;fill:rgba(209,211,212,.55)}
.portas .rot.on{fill:var(--gold)}
.titulo{font-weight:900;line-height:1.06;letter-spacing:-.024em}
.titulo .g{color:var(--gold)}
.sub{font-weight:300;line-height:1.45;color:rgba(209,211,212,.85)}
.logo{position:absolute}
.pilula{display:flex;align-items:center;gap:22px;border:1.5px solid rgba(240,184,85,.6);border-radius:999px}
.pilula i{font-style:normal;color:var(--gold)}
.pilula span{font-weight:500}

/* capa do site 1600x900: o site mostra só os 512 px de cima */
.site{width:1600px;height:900px;border-radius:28px}
.site .texto{position:absolute;left:96px;top:64px;width:860px}
.site .tag{display:inline-block;padding:11px 24px;border-radius:999px;border:1.5px solid rgba(240,184,85,.7);
  background:rgba(240,184,85,.06);color:var(--gold);font-weight:500;font-size:15px;letter-spacing:.18em;
  text-transform:uppercase;margin-bottom:32px}
.site .titulo{font-size:66px}
.site .titulo .g{font-weight:300;letter-spacing:-.01em}
.site .sub{font-size:25px;margin-top:26px;max-width:720px}
.site .meta{display:flex;align-items:center;gap:18px;margin-top:34px;font-size:19px;color:rgba(209,211,212,.85)}
.site .meta i{width:1px;height:22px;background:rgba(209,211,212,.3)}
.site .arte{position:absolute;left:1000px;top:70px}
.site .logo{left:96px;bottom:56px;height:30px}

/* story 1080x1920 */
.story{width:1080px;height:1920px;padding:250px 88px 0}
.story .titulo{font-size:92px}
.story .arte{margin-top:90px}
.story .sub{font-size:36px;margin-top:80px}
.story .pilula{margin-top:60px;padding:32px 44px}
.story .pilula i{font-size:38px}.story .pilula span{font-size:33px}
.story .logo{left:50%;transform:translateX(-50%);bottom:170px;height:62px}

/* LinkedIn 1080x1350 */
.li .fundo{position:absolute;left:0;right:0;top:0;height:820px;background-size:cover;background-position:center;opacity:.85;
  -webkit-mask-image:linear-gradient(180deg,#000 0%,#000 55%,transparent 100%);mask-image:linear-gradient(180deg,#000 0%,#000 55%,transparent 100%)}
.li .veu{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(6,20,36,.28) 0%,rgba(6,20,36,.4) 30%,rgba(4,13,24,.82) 50%,rgba(4,13,24,.9) 100%)}
.li .arte,.li .miolo,.li .logo{position:relative;z-index:2}
.li .logo{position:absolute}
.li{width:1080px;height:1350px;padding:96px 112px 0;display:flex;flex-direction:column}
.li .miolo{margin-top:auto;margin-bottom:auto;padding-bottom:150px}
.li .arte{margin-bottom:56px}
.li .titulo{font-size:78px}
.li .titulo.t2{font-size:64px}
.li .sub{font-size:32px;margin-top:36px}
.li .seta{margin-top:40px;font-weight:500;font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.li .corpo{font-weight:300;font-size:31px;line-height:1.5;color:rgba(209,211,212,.9);margin-top:30px}
.li .numero{font-weight:900;font-size:170px;line-height:.95;letter-spacing:-.04em;color:var(--gold)}
.li .numero.n2{font-size:120px}
.li .num-leg{font-weight:500;font-size:34px;line-height:1.3;margin-top:14px}
.li .dados{display:flex;gap:56px;margin-top:40px}
.li .dados>div{flex:1}
.li .dados .num-leg{font-size:26px;font-weight:300;color:rgba(209,211,212,.9)}
.li .normas{list-style:none;margin-top:36px;border-top:1px solid rgba(209,211,212,.2)}
.li .normas li{display:flex;justify-content:space-between;gap:24px;padding:20px 0;border-bottom:1px solid rgba(209,211,212,.2);font-size:25px}
.li .normas b{font-weight:700;white-space:nowrap}
.li .normas span{font-weight:300;color:rgba(209,211,212,.85);text-align:right}
.li .pilula{margin-top:48px;padding:28px 40px}
.li .pilula i{font-size:32px}.li .pilula span{font-size:28px}
.li .logo{left:112px;bottom:72px;height:40px}
"""


def main():
    pecas = [capa_site(), story()] + carrossel()
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
            f'<title>Artigo ANEEL multiportas</title><style>{fontes()}{CSS}</style></head>'
            f'<body>{"".join(pecas)}</body></html>')
    (OUT / "pecas.html").write_text(html, encoding="utf-8")
    print(f"gerado: pecas.html ({len(pecas)} peças)")


if __name__ == "__main__":
    main()
