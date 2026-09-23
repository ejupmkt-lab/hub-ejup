#!/usr/bin/env python3
"""Capa do corte EJUPcast #18 · Dra. Rossana Fonseca (1080x1920).

Título: "Direito e moral". Faixas de foto entre as linhas, adaptadas da
referência (material/referencia-faixas.jpg) para Gotham e a paleta EJUP.
A1 papel · A2 navy com dourado · A3 conceito (Direito = gesto de fora,
moral = o que está dentro), com as falas dela.
"""
import base64, io, pathlib, random
from PIL import Image, ImageFilter, ImageEnhance

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"
FOTO = OUT / "material" / "rossana-frame.webp"


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def jpg(im, q=90):
    buf = io.BytesIO(); im.convert("RGB").save(buf, "JPEG", quality=q)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def fontes():
    out = []
    for nome, peso, estilo in (("Thin", 200, "normal"), ("Light", 300, "normal"),
                               ("Book", 400, "normal"), ("BookItalic", 400, "italic"),
                               ("Medium", 500, "normal"), ("Black", 900, "normal")):
        out.append(f"@font-face{{font-family:'Gotham';font-weight:{peso};font-style:{estilo};"
                   f"src:url({b64(FONTS / f'Gotham-{nome}.otf', 'font/otf')}) format('opentype')}}")
    return "\n".join(out)


def grao(w, h, forca=26):
    random.seed(7)
    im = Image.effect_noise((w, h), forca).convert("L")
    buf = io.BytesIO(); im.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


LOGO_B = (LOGOS / "ejup-horizontal-white.svg").read_text(encoding="utf-8")
LOGO_N = (LOGOS / "ejup-horizontal-navy.svg").read_text(encoding="utf-8")


def faixa(img, x, y, w, h, c, esc):
    """Janela arredondada para a foto: o ponto c da foto original fica no centro."""
    bx, by = w / 2 - c[0] * esc, h / 2 - c[1] * esc
    return (f'<div class="faixa" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;'
            f'background-image:url({img});background-size:{2000*esc:.0f}px auto;'
            f'background-position:{bx:.0f}px {by:.0f}px"></div>')


ROSTO, MIC, MAO_E, MAO_D = (960, 385), (1185, 560), (905, 975), (1500, 900)
ARCOS = ('<svg class="arcos" viewBox="0 0 1080 1920"><g fill="none" stroke="{c}" stroke-width="70" opacity="{o}">'
         '<path d="M-200 760 C 200 210, 700 0, 1300 120"/><path d="M-160 2160 C 300 1560, 800 1560, 1300 1310"/></g></svg>')


def rodape(top, tom):
    return (f'<div class="rodape {tom}" style="top:{top}px"><p class="nome">Dra. Rossana Fonseca</p>'
            f'<p class="ep">EJUPcast #18</p></div>')


def main():
    foto = Image.open(FOTO).convert("RGB")
    # grade única para todas as faixas: um pouco menos saturada, sombras frias
    f = ImageEnhance.Contrast(ImageEnhance.Color(foto).enhance(.82)).enhance(1.06)
    img = jpg(f, 92)
    g = grao(540, 960, 22)

    # A1 · papel, refinada
    a1 = f"""<section class="s claro">
  {ARCOS.format(c="#d1d3d4", o=".42")}
  <div class="logo" style="top:230px">{LOGO_N}<span>/cast</span></div>
  <p class="t it" style="left:104px;top:500px;font-size:212px">Direito</p>
  {faixa(img, 112, 740, 856, 300, (960, 330), .72)}
  <p class="t bk" style="left:100px;top:1092px;font-size:196px">e</p>
  {faixa(img, 300, 1108, 668, 170, (1120, 600), .95)}
  {faixa(img, 112, 1330, 330, 170, MAO_E, .95)}
  <p class="t it" style="left:474px;top:1320px;font-size:196px">moral</p>
  {rodape(1580, "")}
  <p class="lead" style="top:1670px">A primeira lição do curso de Direito, e a que muita gente <em>esqueceu.</em></p>
  <div class="grao" style="background-image:url({g})"></div>
</section>"""

    # A2 · a mesma ideia no escuro, com o dourado
    a2 = a1.replace('class="s claro"', 'class="s escuro"').replace(
        ARCOS.format(c="#d1d3d4", o=".42"), ARCOS.format(c="#304557", o=".35")).replace(
        LOGO_N, LOGO_B).replace(
        '<p class="t it" style="left:474px;top:1320px;font-size:196px">moral</p>',
        '<p class="t it ouro" style="left:474px;top:1320px;font-size:196px">moral</p>')

    # A3 · conceito: o Direito é o gesto de fora, a moral é o que está dentro
    a3 = f"""<section class="s claro">
  {ARCOS.format(c="#d1d3d4", o=".42")}
  <div class="logo" style="top:200px">{LOGO_N}<span>/cast</span></div>
  <p class="t bk" style="left:100px;top:400px;font-size:190px">Direito</p>
  {faixa(img, 112, 620, 856, 250, MAO_E, 1.0)}
  <p class="cit" style="top:896px">“algo externo, que você externaliza.”</p>
  <p class="t it" style="left:104px;top:980px;font-size:190px">e moral</p>
  {faixa(img, 112, 1200, 856, 250, ROSTO, .95)}
  <p class="cit" style="top:1476px">“uma coisa que está intrínseca em você.”</p>
  {rodape(1580, "")}
  <p class="lead" style="top:1670px;font-size:34px">A primeira lição do curso de Direito, e a que muita gente <em>esqueceu.</em></p>
  <div class="grao" style="background-image:url({g})"></div>
</section>"""

    html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Capa corte EJUPcast 18</title><style>
{fontes()}
:root{{--tinta:#0d131a;--navy:#031c37;--aco:#304557;--grafite:#414042;--cinza:#5f6062;
  --prata:#d1d3d4;--ouro:#f0b855;--bronze:#9b6b26;--papel:#ecebe7}}
*{{box-sizing:border-box;margin:0}}
body{{background:#3a3d42;display:flex;gap:28px;padding:28px;font-family:'Gotham',sans-serif}}
.s{{position:relative;width:1080px;height:1920px;overflow:hidden;flex:none}}
.claro{{background:radial-gradient(90% 60% at 50% 40%,#f3f1ec 0%,#ecebe7 60%,#e4e2dd 100%);color:var(--navy)}}
.escuro{{background:radial-gradient(90% 60% at 30% 20%,#0a2a49 0%,#031c37 45%,#0d131a 100%);color:#fff}}
.arcos{{position:absolute;inset:0}}
.grao{{position:absolute;inset:0;background-size:540px 960px;mix-blend-mode:overlay;opacity:.18;pointer-events:none}}
.faixa{{position:absolute;border-radius:28px;background-repeat:no-repeat;
  box-shadow:0 24px 44px -26px rgba(3,28,55,.6),inset 0 0 0 1px rgba(255,255,255,.08)}}
.t{{position:absolute;line-height:.9;letter-spacing:-.035em;white-space:nowrap}}
.it{{font-style:italic;font-weight:400}}
.bk{{font-weight:900}}
.ouro{{color:var(--ouro)}}
.rodape{{position:absolute;left:112px;right:112px;display:flex;justify-content:space-between;
  align-items:baseline;border-top:1.5px solid currentColor;padding-top:26px}}
.claro .rodape{{border-top-color:rgba(3,28,55,.25)}}
.escuro .rodape{{border-top-color:rgba(209,211,212,.3)}}
.nome{{font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase}}
.ep{{font-weight:300;font-size:24px;color:var(--cinza)}}
.escuro .ep{{color:var(--prata)}}
.lead{{position:absolute;left:112px;right:112px;font-weight:300;font-size:40px;line-height:1.3;color:var(--grafite)}}
.escuro .lead{{color:var(--prata)}}
.lead em{{font-style:italic;color:var(--bronze)}}
.escuro .lead em{{color:var(--ouro)}}
.cit{{position:absolute;right:112px;font-style:italic;font-weight:400;font-size:30px;color:var(--bronze)}}
.logo{{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:flex-end;gap:8px}}
.logo svg{{width:200px;height:auto;display:block}}
.logo span{{font-weight:300;font-size:40px;line-height:1}}
.claro .logo svg path{{fill:#031c37!important}}
.escuro .logo svg path{{fill:#fff!important}}
</style></head><body>
{a1}
{a2}
{a3}
</body></html>"""
    (OUT / "capa.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
