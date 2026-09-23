#!/usr/bin/env python3
"""Capa do corte EJUPcast #18 · Dra. Rossana Fonseca (1080x1920).

Opção A: faixas de foto entre as linhas do título, adaptada da referência
(material/referencia-faixas.jpg) para Gotham e a paleta EJUP. As três faixas
são janelas para a mesma foto, alinhadas: juntas, remontam a Rossana.
Opção B: pegada A Sala, foto em tela cheia, escura, com grão.
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

# ---- Opção A: a foto escondida atrás das faixas ----
S = 0.86                      # escala da foto (2000x1125 -> 1720x968)
IMG_X, IMG_Y = -286, 423      # onde a foto inteira ficaria na tela
DY = 150                      # desce o bloco inteiro para centrar na tela
FAIXAS = [                    # left, top, width, height, ponto da foto original no centro, escala
    (112, 650 + DY, 856, 200, (960, 380), S),     # rosto
    (790, 890 + DY, 178, 150, (1185, 560), 1.0),  # o microfone
    (112, 1085 + DY, 420, 150, (1000, 960), 0.9), # as mãos apontando a mesa
]


def faixa(img, x, y, w, h, c, esc):
    bx, by = x + w / 2 - c[0] * esc - x, y + h / 2 - c[1] * esc - y
    return (f'<div class="faixa" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;'
            f'background-image:url({img});background-size:{2000*esc:.0f}px auto;'
            f'background-position:{bx:.0f}px {by:.0f}px"></div>')


def main():
    foto = Image.open(FOTO).convert("RGB")
    foto_a = jpg(ImageEnhance.Color(foto).enhance(.9))

    # Opção B: recorte vertical centrado no rosto, tratado escuro
    x0 = 610
    cr = foto.crop((x0, 0, x0 + 633, 1125)).resize((1080, 1920), Image.LANCZOS)
    cr = cr.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    cr = ImageEnhance.Brightness(ImageEnhance.Color(cr).enhance(.78)).enhance(.9)
    foto_b = jpg(cr, 88)
    g = grao(540, 960)

    fa = "".join(faixa(foto_a, *f) for f in FAIXAS)
    html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Capa corte EJUPcast 18</title><style>
{fontes()}
:root{{--tinta:#0d131a;--navy:#031c37;--aco:#304557;--grafite:#414042;--cinza:#5f6062;
  --prata:#d1d3d4;--ouro:#f0b855;--bronze:#9b6b26;--papel:#ecebe7}}
*{{box-sizing:border-box;margin:0}}
body{{background:#3a3d42;display:flex;gap:28px;padding:28px;font-family:'Gotham',sans-serif}}
.s{{position:relative;width:1080px;height:1920px;overflow:hidden;flex:none}}
/* A */
.a{{background:var(--papel);color:var(--navy)}}
.arcos{{position:absolute;inset:0}}
.faixa{{position:absolute;border-radius:28px;background-repeat:no-repeat;
  box-shadow:0 18px 40px -22px rgba(3,28,55,.55)}}
.t{{position:absolute;line-height:.9;letter-spacing:-.035em;white-space:nowrap}}
.it{{font-style:italic;font-weight:400}}
.bk{{font-weight:900}}
.a .rodape{{position:absolute;left:112px;right:112px;top:1330px;display:flex;justify-content:space-between;
  align-items:baseline;border-top:1.5px solid rgba(3,28,55,.25);padding-top:26px}}
.nome{{font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase}}
.ep{{font-weight:300;font-size:24px;color:var(--cinza)}}
.lead{{position:absolute;left:112px;right:112px;font-weight:300;font-size:40px;line-height:1.3}}
.lead em{{font-style:italic;color:var(--bronze)}}
.logo{{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:flex-end;gap:8px}}
.logo svg{{width:200px;height:auto;display:block}}
.logo span{{font-weight:300;font-size:40px;line-height:1}}
.a .logo svg path{{fill:#031c37!important}}
/* B */
.b{{background:var(--tinta);color:#fff}}
.b .foto{{position:absolute;inset:0;background-size:cover;background-position:center}}
.b .veu{{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(13,19,26,.55) 0%,rgba(13,19,26,0) 22%,rgba(13,19,26,0) 42%,rgba(13,19,26,.82) 62%,#0d131a 86%),
  radial-gradient(120% 80% at 50% 35%,rgba(0,0,0,0) 55%,rgba(0,0,0,.55) 100%)}}
.b .grao{{position:absolute;inset:0;background-size:540px 960px;mix-blend-mode:overlay;opacity:.32}}
.b .logo svg path{{fill:#fff!important}}
.b .nome{{color:var(--prata)}}
.b .ouro{{color:var(--ouro)}}
</style></head><body>

<section class="s a">
  <svg class="arcos" viewBox="0 0 1080 1920"><g fill="none" stroke="#d1d3d4" stroke-width="70" opacity=".45">
    <path d="M-200 700 C 200 150, 700 -60, 1300 60"/><path d="M-160 2100 C 300 1500, 800 1500, 1300 1250"/></g></svg>
  <div class="logo" style="top:300px">{LOGO_N}<span>/cast</span></div>
  <p class="t it" style="left:104px;top:600px;font-size:180px">Deixaram</p>
  {fa}
  <p class="t bk" style="left:100px;top:1035px;font-size:168px">o dever</p>
  <p class="t it" style="left:566px;top:1232px;font-size:180px">ser.</p>
  <div class="rodape" style="top:1450px"><p class="nome">Dra. Rossana Fonseca</p><p class="ep">EJUPcast #18</p></div>
  <p class="lead" style="top:1550px;color:#414042">Direito e moral: a primeira lição do curso de Direito, e a que muita gente <em>esqueceu.</em></p>
</section>

<section class="s b">
  <div class="foto" style="background-image:url({foto_b})"></div>
  <div class="veu"></div>
  <div class="grao" style="background-image:url({g})"></div>
  <div class="logo" style="top:120px">{LOGO_B}<span>/cast</span></div>
  <p class="t" style="left:108px;top:1150px;font-size:150px;font-weight:200">Deixaram</p>
  <p class="t bk" style="left:104px;top:1290px;font-size:150px">o dever <span class="ouro">ser.</span></p>
  <p class="lead" style="top:1480px;color:#d1d3d4">Direito e moral: a primeira lição do curso de Direito, e a que muita gente <em style="color:#f0b855">esqueceu.</em></p>
  <p class="nome" style="position:absolute;left:112px;top:1680px">Dra. Rossana Fonseca <span style="font-weight:300;letter-spacing:0;text-transform:none;color:#5f6062">·</span> EJUPcast #18</p>
</section>
</body></html>"""
    (OUT / "capa.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
