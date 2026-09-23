#!/usr/bin/env python3
"""Cartela final da vinheta: símbolo EJUP dourado e "a sala" em Gotham Black, 1920x1080."""
import base64, pathlib
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).resolve().parent
RAIZ = HERE.parents[3]
F = RAIZ / "skills" / "ejup-design" / "assets" / "fonts" / "Gotham-Black.otf"
S = (RAIZ / "skills" / "ejup-design" / "assets" / "logo" / "ejup-symbol-gold.svg").read_text()
fonte = base64.b64encode(F.read_bytes()).decode()
def html(titulo):
    return f"""<html><head><style>
@font-face{{font-family:G;font-weight:900;src:url(data:font/otf;base64,{fonte})}}
body{{margin:0;width:1920px;height:1080px;background:radial-gradient(60% 60% at 50% 45%,#0a1a2e 0%,#0d131a 55%,#05080c 100%);
display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px}}
svg{{width:150px;height:150px}}
h1{{font-family:G;font-weight:900;font-size:112px;letter-spacing:-.025em;color:#fff;margin:0;line-height:1;opacity:{1 if titulo else 0}}}
</style></head><body>{S}<h1>a sala</h1></body></html>"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    for nome, t in (("assinatura-simbolo.png", False), ("assinatura.png", True)):
        pg.set_content(html(t)); pg.wait_for_timeout(300)
        pg.screenshot(path=str(HERE / nome))
    b.close()
