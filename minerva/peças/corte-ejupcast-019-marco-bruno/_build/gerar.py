#!/usr/bin/env python3
"""Capa do corte EJUPcast #19 · Marco Bruno (1080x1920).

Título: "Ilicitude ou prevenção?".
A1 papel e A2 navy seguem o sistema da capa do corte #18 (faixas da mesma foto,
na mesma escala e alinhadas, entre as linhas do título).
B segue a linguagem cinematográfica da capa do carrossel A Sala: tinta, grão,
título grande e a foto em tela cheia embaixo.
"""
import base64, io, math, pathlib, random, re
from PIL import Image, ImageEnhance

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"
FOTO = OUT / "material" / "marco-bruno-frame.webp"


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


def selo_cast(logo, aro, ponto, d=210):
    """Selo EJUPcast: logotipo ejup e /CAST num aro fino com dois pontos."""
    marca = re.sub(r'viewBox="[^"]*"', 'viewBox="352 690 282 118"', logo, count=1)
    r = d / 2 - 4
    pts = "".join(f'<circle cx="{d/2 + r*math.cos(math.radians(a)):.1f}" cy="{d/2 + r*math.sin(math.radians(a)):.1f}" r="4.5" fill="{ponto}"/>'
                  for a in (-70, 115))
    return (f'<div class="selo" style="width:{d}px;height:{d}px">'
            f'<svg class="selo-aro" viewBox="0 0 {d} {d}"><circle cx="{d/2}" cy="{d/2}" r="{r}" fill="none" '
            f'stroke="{aro}" stroke-width="1.5"/>{pts}</svg>'
            f'<div class="selo-marca"><div>{marca}<span>/cast</span></div></div></div>')


ARCOS = ('<svg class="arcos" viewBox="0 0 1080 1920"><g fill="none" stroke="{c}" stroke-width="70" opacity="{o}">'
         '<path d="M-200 760 C 200 210, 700 0, 1300 120"/><path d="M-160 2160 C 300 1560, 800 1560, 1300 1310"/></g></svg>')


def rodape(top):
    return (f'<div class="rodape" style="top:{top}px"><p class="nome">Marco Bruno</p>'
            f'<p class="ep">EJUPcast #19</p></div>')


def main():
    foto = Image.open(FOTO).convert("RGB")
    f = ImageEnhance.Contrast(ImageEnhance.Color(foto).enhance(.84)).enhance(1.05)
    img = jpg(f, 92)
    g = grao(540, 960, 22)

    # A · faixas. Foto inteira projetada na escala E com canto em (L, T); cada faixa
    # é uma janela dessa mesma projeção. Cabeça inteira na faixa de cima, mãos e
    # microfone na de baixo.
    E, D = .8, 170
    L, T = -208, 448 + D
    def jan(x, y, w, h):
        y += D
        return (f'<div class="faixa" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;'
                f'background-image:url({img});background-size:{2000*E:.0f}px auto;'
                f'background-position:{L - x}px {T - y}px"></div>')

    def capa_a(classe, logo, aro, ponto):
        return f"""<section class="s {classe}">
  {ARCOS.format(c="#d1d3d4", o=".42") if classe == "claro" else ARCOS.format(c="#304557", o=".35")}
  <div class="logo" style="top:{90 + D}px">{selo_cast(logo, aro, ponto)}</div>
  <p class="t it" style="left:100px;top:{318 + D}px;font-size:200px">Ilicitude</p>
  {jan(112, 500, 856, 380)}
  <p class="t bk" style="left:100px;top:{928 + D}px;font-size:168px">ou</p>
  {jan(356, 910, 612, 170)}
  <p class="t it ac" style="left:100px;top:{1112 + D}px;font-size:160px">prevenção?</p>
  {rodape(1330 + D)}
  <div class="grao" style="background-image:url({g})"></div>
</section>"""

    a1 = capa_a("claro", LOGO_N, "rgba(3,28,55,.35)", "#9b6b26")
    a2 = capa_a("escuro", LOGO_B, "rgba(209,211,212,.5)", "#f0b855")

    # B · cinema. Recorte vertical da foto com ele no centro, fundido na tinta.
    h = foto.height
    w = int(h * 1080 / 1300)
    cx = 1010
    rec = foto.crop((cx - w // 2, 0, cx + w // 2, h))
    rec = ImageEnhance.Brightness(ImageEnhance.Color(rec).enhance(.7)).enhance(.92)
    rimg = jpg(rec.resize((1080, int(h * 1080 / w))), 90)
    b = f"""<section class="s tinta">
  <div class="cena" style="background-image:url({rimg})"></div>
  <div class="veu"></div>
  <div class="logo" style="top:120px">{selo_cast(LOGO_B, "rgba(209,211,212,.5)", "#f0b855")}</div>
  <p class="t bk centro" style="top:410px;font-size:150px">Ilicitude</p>
  <p class="t it centro" style="top:560px;font-size:132px;color:var(--prata)">ou <span class="ouro">prevenção?</span></p>
  <div class="rodape centrado" style="top:1700px"><p class="nome">Marco Bruno</p><p class="ep">EJUPcast #19</p></div>
  <div class="grao" style="background-image:url({g});opacity:.22"></div>
</section>"""

    html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Capa corte EJUPcast 19</title><style>
{fontes()}
:root{{--tinta:#0d131a;--navy:#031c37;--aco:#304557;--grafite:#414042;--cinza:#5f6062;
  --prata:#d1d3d4;--ouro:#f0b855;--bronze:#9b6b26}}
*{{box-sizing:border-box;margin:0}}
body{{background:#3a3d42;display:flex;gap:28px;padding:28px;font-family:'Gotham',sans-serif}}
.s{{position:relative;width:1080px;height:1920px;overflow:hidden;flex:none}}
.claro{{background:radial-gradient(90% 60% at 50% 40%,#f3f1ec 0%,#ecebe7 60%,#e4e2dd 100%);color:var(--navy)}}
.escuro{{background:radial-gradient(90% 60% at 30% 20%,#0a2a49 0%,#031c37 45%,#0d131a 100%);color:#fff}}
.tinta{{background:var(--tinta);color:#fff}}
.arcos{{position:absolute;inset:0}}
.grao{{position:absolute;inset:0;background-size:540px 960px;mix-blend-mode:overlay;opacity:.18;pointer-events:none}}
.faixa{{position:absolute;border-radius:28px;background-repeat:no-repeat;
  box-shadow:0 24px 44px -26px rgba(3,28,55,.6),inset 0 0 0 1px rgba(255,255,255,.08)}}
.t{{position:absolute;line-height:.9;letter-spacing:-.035em;white-space:nowrap}}
.it{{font-style:italic;font-weight:400}}
.bk{{font-weight:900}}
.claro .ac{{color:var(--navy)}}
.escuro .ac{{color:var(--ouro)}}
.ouro{{color:var(--ouro)}}
.centro{{left:0;right:0;text-align:center}}
.rodape{{position:absolute;left:112px;right:112px;display:flex;justify-content:space-between;
  align-items:baseline;border-top:1.5px solid;padding-top:26px}}
.claro .rodape{{border-top-color:rgba(3,28,55,.25)}}
.escuro .rodape,.tinta .rodape{{border-top-color:rgba(209,211,212,.3)}}
.nome{{font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase}}
.ep{{font-weight:300;font-size:24px;color:var(--cinza)}}
.escuro .ep,.tinta .ep{{color:var(--prata)}}
.cena{{position:absolute;left:0;right:0;bottom:0;height:1300px;background-size:cover;background-position:center bottom}}
.veu{{position:absolute;inset:0;background:linear-gradient(180deg,#0d131a 0%,#0d131a 34%,rgba(13,19,26,.55) 50%,rgba(13,19,26,0) 62%,rgba(13,19,26,0) 78%,rgba(13,19,26,.92) 92%,#0d131a 100%)}}
.logo{{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:flex-end;gap:8px}}
.selo{{position:relative}}
.logo .selo-aro{{position:absolute;inset:0;width:100%;height:100%}}
.selo-marca{{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}}
.selo-marca>div{{display:flex;align-items:flex-end;gap:5px}}
.logo .selo-marca svg{{width:96px;height:auto;display:block}}
.logo .selo-marca span{{font-weight:500;font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:5px;opacity:.8}}
.claro .logo svg path{{fill:#031c37!important}}
.escuro .logo svg path,.tinta .logo svg path{{fill:#fff!important}}
</style></head><body>
{a1}
{a2}
{b}
</body></html>"""
    (OUT / "capa.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
