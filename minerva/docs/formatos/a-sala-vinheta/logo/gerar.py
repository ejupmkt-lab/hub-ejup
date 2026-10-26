#!/usr/bin/env python3
"""Logo do quadro A Sala: três direções, em Gotham e na paleta EJUP.
Cada uma sai em 1920x1080 sobre o tinta (para a vinheta) e em PNG transparente."""
import base64, pathlib
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).resolve().parent
RAIZ = HERE.parents[3]
FON = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
SIMB = (RAIZ / "skills" / "ejup-design" / "assets" / "logo" / "ejup-symbol-white.svg").read_text()
def ff(n, w):
    b = base64.b64encode((FON / f"Gotham-{n}.otf").read_bytes()).decode()
    return f"@font-face{{font-family:G;font-weight:{w};src:url(data:font/otf;base64,{b})}}"
FONTES = ff("Thin", 200) + ff("Light", 300) + ff("Medium", 500) + ff("Black", 900)

# A · o mural: moldura fina, fio dourado de canto a canto, nome espaçado
A = """<svg viewBox="0 0 900 360" width="900" height="360">
  <defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="900" height="360">
    <rect width="900" height="360" fill="#fff"/>
    <rect x="150" y="126" width="600" height="112" fill="#000"/></mask></defs>
  <rect x="40" y="40" width="820" height="280" fill="none" stroke="#d1d3d4" stroke-width="2"/>
  <g mask="url(#m)"><line x1="70" y1="292" x2="830" y2="68" stroke="#f0b855" stroke-width="2"/></g>
  <circle cx="70" cy="292" r="7" fill="#f0b855"/><circle cx="830" cy="68" r="7" fill="#f0b855"/>
  <text x="469" y="212" text-anchor="middle" font-family="G" font-weight="300" font-size="92" letter-spacing="38" fill="#fff">A SALA</text>
</svg>"""

# B · a sala em perspectiva: parede do fundo + quatro arestas, nome no fundo
B = """<svg viewBox="0 0 900 420" width="900" height="420">
  <g stroke="#d1d3d4" stroke-width="2" fill="none" opacity=".9">
    <rect x="40" y="20" width="820" height="380"/>
    <rect x="250" y="120" width="400" height="180"/>
    <line x1="40" y1="20" x2="250" y2="120"/><line x1="860" y1="20" x2="650" y2="120"/>
    <line x1="40" y1="400" x2="250" y2="300"/><line x1="860" y1="400" x2="650" y2="300"/>
  </g>
  <text x="450" y="238" text-anchor="middle" font-family="G" font-weight="900" font-size="84" letter-spacing="-2" fill="#fff">a sala</text>
  <line x1="410" y1="300" x2="490" y2="300" stroke="#f0b855" stroke-width="6"/>
</svg>"""

# C · a confissão: "a" fino, "sala" pesado, fio dourado sublinhando e o símbolo EJUP pequeno
C = f"""<div class="c">
  <div class="c-nome"><span class="fino">a</span><span class="peso">sala</span></div>
  <svg viewBox="0 0 700 40" width="700" height="40"><line x1="0" y1="20" x2="640" y2="20" stroke="#f0b855" stroke-width="2"/><circle cx="646" cy="20" r="7" fill="#f0b855"/></svg>
  <div class="c-ass"><div class="c-simb">{SIMB}</div><span>EJUP · EDUCAÇÃO JURÍDICA</span></div>
</div>"""

CSS = f"""{FONTES}
*{{margin:0;box-sizing:border-box}}
body{{--bg:transparent;width:1920px;height:1080px;display:flex;align-items:center;justify-content:center;background:var(--bg)}}
body.fundo{{--bg:#0d131a;background:radial-gradient(60% 60% at 50% 45%,#0a1a2e 0%,#0d131a 60%,#05080c 100%)}}
body.fundo svg rect[fill="var(--bg)"]{{fill:#0b1726}}
body:not(.fundo) svg rect[fill="var(--bg)"]{{fill:transparent}}
.c{{display:flex;flex-direction:column;align-items:flex-start;gap:14px}}
.c-nome{{font-family:G;color:#fff;font-size:190px;line-height:.9;letter-spacing:-.03em;display:flex;align-items:baseline;gap:34px}}
.fino{{font-weight:200}}.peso{{font-weight:900}}
.c-ass{{display:flex;align-items:center;gap:16px;margin-top:8px}}
.c-simb svg{{width:34px;height:34px;display:block}}
.c-ass span{{font-family:G;font-weight:500;font-size:20px;letter-spacing:.14em;color:#d1d3d4}}
"""
def pagina(corpo, fundo):
    return f"<html><head><style>{CSS}</style></head><body class='{'fundo' if fundo else ''}'>{corpo}</body></html>"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    for nome, corpo in (("a", A), ("b", B), ("c", C)):
        pg.set_content(pagina(corpo, True)); pg.wait_for_timeout(250)
        pg.screenshot(path=str(HERE / f"a-sala-logo-{nome}.png"))
        pg.set_content(pagina(corpo, False)); pg.wait_for_timeout(250)
        pg.screenshot(path=str(HERE / f"a-sala-logo-{nome}-transparente.png"), omit_background=True)
    b.close()
