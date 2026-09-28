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


def fundo(nome, foco=0.5, gama=1.0, focoy=0.5):
    """Foto do carrossel em cor natural, recortada em 1080x1350. Entra em
    modo sobreposição (overlay) sobre o fundo, abaixo das portas."""
    arq = FOTOS / f"{nome}.jpg"
    try:
        im = Image.open(arq).convert("RGB")
    except (FileNotFoundError, OSError):
        print(f"aviso: {arq.name} ausente ou inválida, tela sem foto")
        return ""
    im = ImageOps.fit(im, (1080, 1350), Image.LANCZOS, centering=(foco, focoy))
    if gama != 1.0:
        im = im.point(lambda v: int(255 * (v / 255) ** gama))
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


# ------------------------------------------------------------------ cabeçalho do artigo
# Mesma gramática da capa já publicada (investigação defensiva): pílula,
# título com o trecho dourado em Light, subtítulo, linha de ícones (coluna e
# tema), autoria e botão. A foto dos autores dá lugar às portas.
ICONE_COLUNA = ('<svg viewBox="0 0 24 24" fill="none" stroke="#f0b855" stroke-width="1.8" '
                'stroke-linecap="round"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>')
ICONE_TEMA = ('<svg viewBox="0 0 24 24" fill="none" stroke="#f0b855" stroke-width="1.8" '
              'stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>')
SETA_CTA = ('<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#031c37"/>'
            '<path d="M8 12h8M13 8l4 4-4 4" fill="none" stroke="#f0b855" stroke-width="2.2" '
            'stroke-linecap="round" stroke-linejoin="round"/></svg>')


def cabecalho(cta=True):
    return f"""<div class="texto">
    <span class="tag">EJUP · Artigo</span>
    <h1 class="titulo">O sistema multiportas<br><span class="g">da ANEEL</span></h1>
    <p class="sub">O que é e como funciona a mediação de conflitos no setor elétrico.</p>
    <div class="meta"><span class="item">{ICONE_COLUNA}Coluna jurídica</span><i class="sep"></i>
      <span class="item">{ICONE_TEMA}Direito da energia</span></div>
    <p class="autoria">Equipe EJUP</p>
    {f'<span class="cta">Ler o artigo {SETA_CTA}</span>' if cta else ''}
  </div>"""


# ------------------------------------------------------------------ capa do site
def capa_site():
    return f"""<div class="peca site" id="site">
  {cabecalho(cta=False)}
  <div class="arte">{portas(TODAS, 520)}</div>
  <img class="logo" src="{LOGO}" alt="EJUP">
</div>"""


# ------------------------------------------------------------------ story e feed
def vertical(ident, largura_portas):
    return f"""<div class="peca vert {ident}" id="{ident}">
  <div class="halo"></div>
  {cabecalho()}
  <div class="arte">{portas(TODAS, largura_portas)}</div>
  <img class="logo" src="{LOGO}" alt="EJUP">
</div>"""


# O carrossel do LinkedIn mora em linkedin.py.


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

/* LinkedIn 1080x1350 */
/* base neutra (grafite e cinza da paleta) sob a foto: em sobreposição, a foto
   guarda a cor natural em vez de tingir de azul */
.li .base{position:absolute;inset:0;background:linear-gradient(180deg,#414042 0%,#5f6062 60%,#414042 100%);
  -webkit-mask-image:linear-gradient(180deg,transparent 0%,transparent 27%,#000 45%,#000 100%);
  mask-image:linear-gradient(180deg,transparent 0%,transparent 27%,#000 45%,#000 100%)}
.li .fundo{position:absolute;inset:0;background-size:cover;background-position:center;mix-blend-mode:overlay;
  -webkit-mask-image:linear-gradient(180deg,transparent 0%,transparent 27%,#000 45%,#000 100%);
  mask-image:linear-gradient(180deg,transparent 0%,transparent 27%,#000 45%,#000 100%)}
.li .veu{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(4,13,24,0) 28%,rgba(4,13,24,.45) 44%,rgba(4,13,24,.6) 70%,rgba(4,13,24,.72) 100%)}
/* foto com muita textura atrás do corpo de texto: véu mais denso */
.li .veu.forte{background:linear-gradient(180deg,rgba(4,13,24,0) 28%,rgba(4,13,24,.6) 44%,rgba(4,13,24,.78) 62%,rgba(4,13,24,.85) 100%)}
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
    pecas = [capa_site(), vertical("story", 904), vertical("feed", 780)]
    html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
            f'<title>Artigo ANEEL multiportas</title><style>{fontes()}{CSS}</style></head>'
            f'<body>{"".join(pecas)}</body></html>')
    (OUT / "pecas.html").write_text(html, encoding="utf-8")
    print(f"gerado: pecas.html ({len(pecas)} peças)")


if __name__ == "__main__":
    main()
