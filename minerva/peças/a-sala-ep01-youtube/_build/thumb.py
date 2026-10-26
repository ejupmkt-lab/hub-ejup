#!/usr/bin/env python3
"""Thumbnail do YouTube · A Sala, episódio 01 (o caso Vorcaro). 1280x720.

Pedido do Victor (08/10/2026): bem mais chamativa e dentro do ambiente de A
Sala, perto da capa do teaser. Fundo: a sala da vinheta (quadro 7, luminária
acesa sobre o mural, cadeira, mesa). A foto de Vorcaro entra presa no centro do
mural, como prova do caso, com fios dourados ligando a outras provas (o fio é
a assinatura do quadro). Embaixo, o título em Gotham Black: "O CASO" em branco
e "VORCARO" em dourado, grande. Logo de A Sala no alto à esquerda e EJUP à
direita.

Foto: retrato CC0 (Márcio Gustavo Vasconcelos), o mesmo do episódio, uso
decidido pelo Victor em 07/10/2026. Nenhum ministro na imagem (item 23).
Uso: python3 thumb.py
"""
import base64, io, pathlib
from PIL import Image, ImageEnhance, ImageOps
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FON = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
W, H = 1280, 720


def b64(im, fmt="JPEG"):
    buf = io.BytesIO()
    (im.convert("RGB") if fmt == "JPEG" else im).save(buf, fmt, quality=92)
    return f"data:image/{fmt.lower()};base64," + base64.b64encode(buf.getvalue()).decode()


# a sala, com um leve zoom para o mural ganhar tamanho
sala = Image.open(RAIZ / "docs/formatos/a-sala-vinheta/quadros-chave/q7-v2-recorte.png").convert("RGB")
cw = round(sala.width / 1.15); ch = round(cw * 9 / 16)
x0 = (sala.width - cw) // 2
sala = sala.crop((x0, 0, x0 + cw, ch)).resize((W, H), Image.LANCZOS)
sala = ImageEnhance.Contrast(sala).enhance(1.08)

# a foto de Vorcaro tratada como cópia em papel: preto e branco quente
foto = Image.open(RAIZ / "peças/carrossel-caso-vorcaro/fotos/vorcaro.jpg").convert("L")
foto = ImageOps.autocontrast(foto, cutoff=1)
foto = ImageOps.colorize(foto, black=(22, 18, 14), white=(236, 226, 206), mid=(128, 112, 92))

logo = Image.open(RAIZ / "docs/formatos/a-sala-vinheta/logo/a-sala-logo-a-transparente.png").convert("RGBA")
logo = logo.crop(logo.getbbox())
EJUP = (RAIZ / "skills/ejup-design/assets/logo/ejup-horizontal-white.svg").read_text()
f = lambda n: base64.b64encode((FON / f"Gotham-{n}.otf").read_bytes()).decode()

# ponto do alfinete e pontas dos fios, sobre o mural
PX, PY = 640, 122
FIOS = [(372, 118), (930, 128), (352, 452), (948, 440), (520, 470), (800, 96)]

fios_svg = "".join(
    f'<line x1="{PX}" y1="{PY}" x2="{x}" y2="{y}" stroke="#f0b855" stroke-width="2.2" stroke-opacity=".85"/>'
    f'<circle cx="{x}" cy="{y}" r="5" fill="#f0b855"/>' for x, y in FIOS)

HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:G;font-weight:500;src:url(data:font/otf;base64,{f('Medium')})}}
@font-face{{font-family:G;font-weight:900;src:url(data:font/otf;base64,{f('Black')})}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:{W}px;height:{H}px;background:#07090c;font-family:G;overflow:hidden;position:relative}}
.sala{{position:absolute;inset:0;background:url({b64(sala)}) center/cover}}
.cone{{position:absolute;inset:0;background:radial-gradient(34% 62% at 50% 6%,rgba(255,214,150,.20) 0%,rgba(255,214,150,0) 70%)}}
.fios{{position:absolute;inset:0}}
.foto{{position:absolute;left:{PX - 105}px;top:{PY - 16}px;width:210px;padding:12px 12px 34px;background:#e8dfcc;
  transform:rotate(-3deg);box-shadow:0 18px 40px rgba(0,0,0,.65),0 2px 6px rgba(0,0,0,.5)}}
.foto img{{display:block;width:100%;filter:contrast(1.05)}}
.foto:after{{content:"";position:absolute;inset:0;background:linear-gradient(170deg,rgba(255,240,210,.18),rgba(0,0,0,.18))}}
.pino{{position:absolute;left:{PX - 10}px;top:{PY - 10}px;width:20px;height:20px;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#ffe2a6,#f0b855 45%,#9b6b26 100%);box-shadow:0 4px 8px rgba(0,0,0,.6)}}
.veu{{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(7,9,12,.55) 0%,rgba(7,9,12,0) 14%,rgba(7,9,12,0) 50%,rgba(7,9,12,.78) 68%,rgba(7,9,12,.96) 84%),
  radial-gradient(120% 95% at 50% 40%,rgba(0,0,0,0) 55%,rgba(0,0,0,.6) 100%)}}
.grao{{position:absolute;inset:0;opacity:.24;mix-blend-mode:overlay}}
.asala{{position:absolute;left:40px;top:34px;width:220px;filter:drop-shadow(0 4px 16px rgba(0,0,0,.7))}}
.ejup{{position:absolute;right:44px;top:44px;width:150px}}
.ejup svg{{width:100%;height:auto;display:block}}
.tit{{position:absolute;left:0;right:0;bottom:34px;display:flex;flex-direction:column;align-items:center;text-align:center}}
.l1{{color:#fff;font-weight:900;font-size:64px;line-height:1;letter-spacing:.04em;text-transform:uppercase;
  text-shadow:0 4px 24px rgba(0,0,0,.8)}}
.l2{{color:#f0b855;font-weight:900;line-height:.86;letter-spacing:-.025em;text-transform:uppercase;white-space:nowrap;
  margin-top:4px;text-shadow:0 0 40px rgba(240,184,85,.28),0 8px 34px rgba(0,0,0,.85)}}
</style></head><body>
<div class="sala"></div><div class="cone"></div>
<svg class="fios" width="{W}" height="{H}">{fios_svg}</svg>
<div class="foto"><img src="{b64(foto)}"></div>
<div class="pino"></div>
<div class="veu"></div>
<svg class="grao" width="{W}" height="{H}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="5"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
<img class="asala" src="{b64(logo, 'PNG')}">
<div class="ejup">{EJUP}</div>
<div class="tit"><div class="l1">O caso</div><div class="l2" id="l2">Vorcaro</div></div>
<script>
  document.fonts.ready.then(() => {{
    const el = document.getElementById('l2'), alvo = 1060;
    el.style.fontSize = '100px';
    el.style.fontSize = (100 * alvo / el.scrollWidth) + 'px';
    document.body.dataset.pronto = '1';
  }});
</script>
</body></html>"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": W, "height": H})
    pg.set_content(HTML); pg.wait_for_selector("body[data-pronto]"); pg.wait_for_timeout(300)
    png = OUT / "thumb-1280x720.png"
    pg.screenshot(path=str(png))
    Image.open(png).convert("RGB").save(OUT / "thumb-1280x720.jpg", quality=92)
    b.close()
print("ok")
