#!/usr/bin/env python3
"""Thumbnail do YouTube · A Sala, episódio 01 (o caso Vorcaro). 1280x720.

Imagem: a ficha de Vorcaro sobre a mesa de A Sala, a mesma do vídeo
`entrega/pessoas/vorcaro.mp4` (retrato CC0, uso decidido pelo Victor em
07/10/2026). Nenhum ministro na imagem: rosto ao lado de ministro sugeriria
acusação (item 23). Texto à direita, no espaço vazio da mesa: logo de A Sala,
"O CASO" e "VORCARO" em dourado, e uma linha de gancho. Logo EJUP no canto
superior direito, como nas thumbs do canal.

Variantes: a (gancho "e três ministros do Supremo") e b ("e o que a lei diz").
Uso: python3 thumb.py
"""
import base64, io, pathlib
from PIL import Image, ImageEnhance
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FON = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
W, H = 1280, 720

VARIANTES = {
    "a": "e três ministros<br>do Supremo",
    "b": "e o que a lei diz",
}


def b64(im, fmt="JPEG"):
    buf = io.BytesIO()
    (im.convert("RGB") if fmt == "JPEG" else im).save(buf, fmt, quality=92)
    return f"data:image/{fmt.lower()};base64," + base64.b64encode(buf.getvalue()).decode()


fundo = Image.open(RAIZ / "peças/a-sala-ep01-animacao/telas-codigo/up/p-vorcaro.png").convert("RGB")
fundo = ImageEnhance.Contrast(fundo.resize((W, H), Image.LANCZOS)).enhance(1.06)
logo = Image.open(RAIZ / "docs/formatos/a-sala-vinheta/logo/a-sala-logo-a-transparente.png").convert("RGBA")
logo = logo.crop(logo.getbbox())
EJUP = (RAIZ / "skills/ejup-design/assets/logo/ejup-horizontal-white.svg").read_text()
f = lambda n: base64.b64encode((FON / f"Gotham-{n}.otf").read_bytes()).decode()


def html(gancho):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:G;font-weight:500;src:url(data:font/otf;base64,{f('Medium')})}}
@font-face{{font-family:G;font-weight:900;src:url(data:font/otf;base64,{f('Black')})}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:{W}px;height:{H}px;background:#0d131a;font-family:G;overflow:hidden;position:relative}}
.foto{{position:absolute;inset:0;background:url({b64(fundo)}) center/cover}}
.luz{{position:absolute;inset:0;background:
  radial-gradient(48% 70% at 27% 42%,rgba(255,236,200,.10) 0%,rgba(0,0,0,0) 60%),
  radial-gradient(120% 90% at 50% 45%,rgba(0,0,0,0) 55%,rgba(0,0,0,.55) 100%)}}
.grao{{position:absolute;inset:0;opacity:.22;mix-blend-mode:overlay}}
.ejup{{position:absolute;right:48px;top:40px;width:168px}}
.ejup svg{{width:100%;height:auto;display:block}}
.col{{position:absolute;left:640px;right:48px;top:0;bottom:0;display:flex;flex-direction:column;
  justify-content:center;align-items:flex-start}}
.asala{{width:250px;display:block;margin-bottom:34px;filter:drop-shadow(0 4px 18px rgba(0,0,0,.6))}}
.l1{{color:#fff;font-weight:500;font-size:56px;line-height:1;letter-spacing:.06em;text-transform:uppercase}}
.l2{{color:#f0b855;font-weight:900;line-height:.92;letter-spacing:-.02em;text-transform:uppercase;
  white-space:nowrap;margin-top:8px;text-shadow:0 6px 30px rgba(0,0,0,.55)}}
.fio{{width:120px;height:3px;background:#f0b855;margin:28px 0 22px}}
.l3{{color:#fff;font-weight:500;font-size:40px;line-height:1.12;letter-spacing:-.005em;max-width:560px}}
</style></head><body>
<div class="foto"></div><div class="luz"></div>
<svg class="grao" width="{W}" height="{H}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="5"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
<div class="ejup">{EJUP}</div>
<div class="col">
  <img class="asala" src="{b64(logo, 'PNG')}">
  <div class="l1">O caso</div>
  <div class="l2" id="l2">Vorcaro</div>
  <div class="fio"></div>
  <div class="l3">{gancho}</div>
</div>
<script>
  // "VORCARO" ocupa a largura da coluna
  document.fonts.ready.then(() => {{
    const el = document.getElementById('l2'), alvo = 592;
    el.style.fontSize = '100px';
    el.style.fontSize = (100 * alvo / el.scrollWidth) + 'px';
    document.body.dataset.pronto = '1';
  }});
</script>
</body></html>"""


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": W, "height": H})
    for k, gancho in VARIANTES.items():
        pg.set_content(html(gancho)); pg.wait_for_selector('body[data-pronto]'); pg.wait_for_timeout(300)
        png = OUT / f"thumb-{k}-1280x720.png"
        pg.screenshot(path=str(png))
        Image.open(png).convert("RGB").save(OUT / f"thumb-{k}-1280x720.jpg", quality=92)
        print("ok", k)
    b.close()
