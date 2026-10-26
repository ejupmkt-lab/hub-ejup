#!/usr/bin/env python3
"""Artigo "Centros de Inteligência do Judiciário" (Rossana Fonseca): capa do
site 1600x900, story 1080x1920, feed 1080x1440 e post 1080x1350.

Mesmo sistema das capas do artigo da ANEEL (versão aprovada, linhas): fundo
navy, pílula, título com o trecho dourado em Light, subtítulo, ícones da
coluna e do tema, autoria e botão. Sem foto: "ou imagem ou a ilustração".
A ilustração é o argumento do artigo: uma grade de processos idênticos; os
que nascem da mesma causa acendem em dourado e convergem para um ponto só.

    python3 _build/gerar.py && python3 _build/render.py
"""
import base64, io, os, pathlib, random
from PIL import Image, ImageEnhance

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    return "\n".join(
        f"@font-face{{font-family:'Gotham';font-weight:{peso};"
        f"src:url({b64(FONTS / f'Gotham-{n}.otf', 'font/otf')}) format('opentype')}}"
        for n, peso in (("Light", 300), ("Book", 400), ("Medium", 500),
                        ("Bold", 700), ("Black", 900)))


LOGO = b64(LOGOS / "ejup-horizontal-white.svg", "image/svg+xml")

# Foto da autora: ensaio profissional da Dra. Rossana (Drive, pasta da
# Panda Design, "Dra. Rossana - Fotos Profissionais-2.jpg"), diante da
# estante de livros. Boca fechada, olhar firme, ela no centro do quadro.
# FOTO=0 gera a versão só com a ilustração (versao-ilustracao/).
COM_FOTO = os.environ.get("FOTO", "1") != "0"
FOTO = OUT / "fotos" / "rossana-profissional-2.jpg"
CENTRO_X, ROSTO_Y = 1200, 1000     # centro dela e altura do rosto, no arquivo de 2400x3596


def foto(w, h):
    """Recorte do frame na proporção do cartão, com ela no centro."""
    im = Image.open(FOTO).convert("RGB")
    im = ImageEnhance.Color(im).enhance(.96)
    largura = 2100 if w / h < 1.2 else 2400
    altura = largura * h / w
    x0 = max(0, min(im.width - largura, CENTRO_X - largura / 2))
    y0 = max(0, min(im.height - altura, ROSTO_Y - altura * .42))   # rosto um pouco acima do meio
    im = im.crop((round(x0), round(y0), round(x0 + largura), round(y0 + altura))).resize((w * 2 // 2, h), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=88)
    return f'<div class="cartao" style="width:{w}px;height:{h}px;background-image:url(data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()})"></div>'


ARTIGO = dict(
    titulo="Centros de Inteligência",
    titulo_g="do Judiciário",
    sub="O que são, como funcionam e como atuam nas demandas repetitivas.",
    coluna="Coluna jurídica",
    tema="Gestão judiciária",
    autoria="Dra. Rossana Fonseca",
)

GOLD, OFF, FRACO = "#f0b855", "rgba(209,211,212,.40)", "rgba(209,211,212,.16)"


def ilustracao(largura):
    """Grade de processos (folhas com canto dobrado e linhas de texto). Os da
    mesma causa acendem e convergem, por curvas, a um ponto: a origem."""
    cols, rows = 9, 5
    w, h, gx, gy = 62, 80, 26, 30
    x0, y0 = 0, 0
    random.seed(19)
    acesos = {(1, 0), (4, 0), (7, 1), (2, 2), (5, 2), (8, 3), (0, 4), (3, 4), (6, 4)}
    gw = cols * w + (cols - 1) * gx
    gh = rows * h + (rows - 1) * gy
    nx, ny = gw / 2, gh + 150                      # o ponto de origem, abaixo da grade
    p = ['<defs><filter id="luz" x="-50%" y="-50%" width="200%" height="200%">'
         '<feGaussianBlur stdDeviation="5"/></filter></defs>']
    curvas = []
    for r in range(rows):
        for c in range(cols):
            x, y = x0 + c * (w + gx), y0 + r * (h + gy)
            on = (c, r) in acesos
            cor = GOLD if on else OFF
            sw = 1.8 if on else 1.2
            d = 14
            p.append(f'<path d="M{x},{y} H{x + w - d} L{x + w},{y + d} V{y + h} H{x} Z" fill="'
                     f'{"rgba(240,184,85,.10)" if on else "none"}" stroke="{cor}" stroke-width="{sw}"/>')
            p.append(f'<path d="M{x + w - d},{y} V{y + d} H{x + w}" fill="none" stroke="{cor}" stroke-width="{sw}"/>')
            for k, f in enumerate((.62, .78, .5, .7)):
                ly = y + 26 + k * 13
                p.append(f'<line x1="{x + 10}" y1="{ly}" x2="{x + 10 + (w - 20) * f:.1f}" y2="{ly}" '
                         f'stroke="{cor}" stroke-width="{1.3 if on else 1}" opacity="{.9 if on else .7}"/>')
            if on:
                sx, sy = x + w / 2, y + h
                curvas.append(f"M{sx},{sy} C{sx},{sy + (ny - sy) * .55} {nx},{ny - (ny - sy) * .45} {nx},{ny}")
    for d in curvas:
        p.append(f'<path d="{d}" fill="none" stroke="{GOLD}" stroke-width="7" opacity=".28" filter="url(#luz)"/>')
        p.append(f'<path d="{d}" fill="none" stroke="{GOLD}" stroke-width="1.6" opacity=".9"/>')
    p.append(f'<circle cx="{nx}" cy="{ny}" r="22" fill="none" stroke="{GOLD}" stroke-width="1.6" opacity=".55"/>')
    p.append(f'<circle cx="{nx}" cy="{ny}" r="9" fill="{GOLD}"/>')
    p.append(f'<circle cx="{nx}" cy="{ny}" r="30" fill="{GOLD}" opacity=".25" filter="url(#luz)"/>')
    p.append(f'<text x="{nx + 46}" y="{ny + 8}" style="font:500 21px Gotham;letter-spacing:2.6px;fill:{GOLD}">A CAUSA DE ORIGEM</text>')
    p.append(f'<line x1="-20" y1="{ny}" x2="{nx - 36}" y2="{ny}" stroke="{FRACO}" stroke-width="1"/>')
    return (f'<svg class="portas" viewBox="-30 -10 {gw + 60} {ny + 50}" width="{largura}" '
            f'style="height:auto;overflow:visible">{"".join(p)}</svg>')


ICONE_COLUNA = ('<svg viewBox="0 0 24 24" fill="none" stroke="#f0b855" stroke-width="1.8" '
                'stroke-linecap="round"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>')
# tema: colunas de um edifício público (o Judiciário)
ICONE_TEMA = ('<svg viewBox="0 0 24 24" fill="none" stroke="#f0b855" stroke-width="1.8" '
              'stroke-linecap="round" stroke-linejoin="round"><path d="M3 9 12 4l9 5"/>'
              '<path d="M5 10v8M9.7 10v8M14.3 10v8M19 10v8M3 20h18"/></svg>')
SETA_CTA = ('<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#031c37"/>'
            '<path d="M8 12h8M13 8l4 4-4 4" fill="none" stroke="#f0b855" stroke-width="2.2" '
            'stroke-linecap="round" stroke-linejoin="round"/></svg>')


def cabecalho(cta=True):
    a = ARTIGO
    return f"""<div class="texto">
    <span class="tag">EJUP · Artigo</span>
    <h1 class="titulo">{a["titulo"]}<br><span class="g">{a["titulo_g"]}</span></h1>
    <p class="sub">{a["sub"]}</p>
    <div class="meta"><span class="item">{ICONE_COLUNA}{a["coluna"]}</span><i class="sep"></i>
      <span class="item">{ICONE_TEMA}{a["tema"]}</span></div>
    <p class="autoria">{a["autoria"]}</p>
    {f'<span class="cta">Ler o artigo {SETA_CTA}</span>' if cta else ''}
  </div>"""


def capa_site():
    return f"""<div class="peca site" id="site">
  {cabecalho(cta=False)}
  <div class="arte">{foto(460, 440) if COM_FOTO else ilustracao(500)}</div>
  <img class="logo" src="{LOGO}" alt="EJUP">
</div>"""


CARTAO = {"story": (840, 640), "feed": (640, 480), "post": (600, 450)}


def vertical(ident, largura):
    return f"""<div class="peca vert {ident}" id="{ident}">
  <div class="halo"></div>
  {cabecalho()}
  <div class="arte">{foto(*CARTAO[ident]) if COM_FOTO else ilustracao(largura)}</div>
  <img class="logo" src="{LOGO}" alt="EJUP">
</div>"""


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

/* cabeçalho comum (capa do site, story, feed) */
.texto{z-index:2}
.tag{display:inline-block;border-radius:999px;border:1.5px solid rgba(240,184,85,.7);background:rgba(240,184,85,.06);
  color:var(--gold);font-weight:500;letter-spacing:.18em;text-transform:uppercase}
.texto .titulo .g{font-weight:300;letter-spacing:-.01em}
.meta{display:flex;align-items:center;color:rgba(209,211,212,.85)}
.meta .item{display:flex;align-items:center;gap:.55em}
.meta .item svg{width:1.05em;height:1.05em;flex:none}
.meta .sep{width:1px;height:1.2em;background:rgba(209,211,212,.3);margin:0 1.3em}
.autoria{font-weight:500;color:#fff}
.cta{display:inline-flex;align-items:center;gap:22px;padding:0 40px;border-radius:999px;
  background:linear-gradient(90deg,#c99a48 0%,var(--gold) 45%,#c99a48 100%);color:var(--navy);
  font-weight:700;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 14px 40px rgba(240,184,85,.22)}
.halo{position:absolute;border-radius:50%;pointer-events:none;filter:blur(10px);
  background:radial-gradient(circle,rgba(240,184,85,.22) 0%,rgba(155,107,38,.1) 45%,rgba(240,184,85,0) 70%)}

/* capa do site 1600x900: o site mostra só os 512 px de cima */
.site{width:1600px;height:900px;border-radius:28px}
.site .texto{position:absolute;left:96px;top:56px;width:860px}
.site .tag{padding:11px 24px;font-size:15px;margin-bottom:28px}
.site .titulo{font-size:64px}
.site .sub{font-size:24px;margin-top:22px;max-width:720px}
.site .meta{font-size:19px;margin-top:28px}
.site .autoria{font-size:19px;margin-top:16px}
.site .arte{position:absolute;left:1000px;top:70px}
.linhas .site .arte{left:1010px;top:60px}
.linhas .halo{opacity:.4}
.site .logo{left:96px;bottom:56px;height:30px}

/* story 1080x1920 e feed 1080x1440: mesmo cabeçalho, portas embaixo */
.vert .texto{position:absolute;left:88px;right:88px}
.vert .tag{padding:13px 28px;font-size:19px;margin-bottom:36px}
.vert .titulo{font-size:92px}
.vert .sub{font-size:33px;margin-top:28px}
.vert .meta{font-size:25px;margin-top:36px}
.vert .autoria{font-size:25px;margin-top:20px}
.vert .cta{height:80px;font-size:21px;margin-top:48px}
.vert .cta svg{width:28px;height:28px}
.vert .arte{position:absolute;left:50%;transform:translateX(-50%)}
.vert .logo{left:50%;transform:translateX(-50%)}
.story{width:1080px;height:1920px}
.story .texto{top:230px}
.story .arte{top:1130px}
.story .halo{left:90px;top:1000px;width:900px;height:640px}
.story .logo{bottom:150px;height:56px}
.feed{width:1080px;height:1440px}
.feed .texto{top:96px}
.feed .titulo{font-size:84px}
.feed .sub{font-size:30px;margin-top:22px}
.feed .meta{margin-top:28px}
.feed .cta{margin-top:36px;height:72px}
.feed .arte{top:800px}
.feed .halo{left:150px;top:720px;width:780px;height:560px}
.feed .logo{bottom:56px;height:40px}
/* post de divulgação 1080x1350 (4:5) */
.post{width:1080px;height:1350px}
.post .texto{top:88px}
.post .titulo{font-size:82px}
.post .sub{font-size:30px;margin-top:20px}
.post .meta{margin-top:26px}
.post .autoria{margin-top:16px}
.post .cta{margin-top:32px;height:70px}
.post .arte{top:770px}
.post .halo{left:150px;top:680px;width:780px;height:520px}
.post .logo{bottom:52px;height:38px}

/* cartão com a foto da autora */
.cartao{border-radius:12px;background-size:cover;background-position:center;
  box-shadow:0 30px 60px rgba(3,28,55,.6),0 8px 18px rgba(3,28,55,.45),inset 0 0 0 1px rgba(209,211,212,.12)}
.foto .site .arte{left:1044px;top:56px}
.foto .story .arte{top:1040px}.foto .feed .arte{top:826px}.foto .post .arte{top:790px}
/* ilustração mais alta que as linhas da ANEEL: posições próprias, sem tocar o logo */
.story .arte{top:1050px}.story .logo{bottom:120px}
.story .halo{left:140px;top:1000px;width:800px;height:640px}
.feed .arte{top:812px}.feed .logo{bottom:40px}
.feed .halo{left:200px;top:780px;width:680px;height:500px}
.post .arte{top:772px}.post .logo{bottom:40px}
.post .halo{left:220px;top:740px;width:640px;height:460px}
"""


def main():
    pecas = [capa_site(), vertical("story", 720), vertical("feed", 560), vertical("post", 520)]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
            f'<title>Artigo Centros de Inteligência</title><style>{fontes()}{CSS}</style></head>'
            f'<body class="linhas{" foto" if COM_FOTO else ""}">{"".join(pecas)}</body></html>')
    (OUT / ("pecas.html" if COM_FOTO else "versao-ilustracao/pecas.html")).write_text(html, encoding="utf-8")
    print(f"gerado: pecas.html ({len(pecas)} peças)")


if __name__ == "__main__":
    main()
