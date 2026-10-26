#!/usr/bin/env python3
import base64, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent; OUT = HERE.parent; RAIZ = HERE.parents[2]
FONTS = RAIZ/"skills/ejup-design/assets/fonts"; LOGOS = RAIZ/"skills/ejup-design/assets/logo"
f = "\n".join("@font-face{font-family:'Gotham';font-weight:%d;src:url(data:font/otf;base64,%s) format('opentype')}" % (p, base64.b64encode((FONTS/n).read_bytes()).decode()) for n,p in (("Gotham-Medium.otf",500),("Gotham-Black.otf",900)))
col = "data:image/png;base64," + base64.b64encode((HERE/"colagem.png").read_bytes()).decode()
html = (HERE/"template-colagem.html").read_text()
for k,v in (("__FONTS__",f),("__COLAGEM__",col),("__SIMBOLO__",(LOGOS/"ejup-symbol-gold.svg").read_text()),("__LOGO__",(LOGOS/"ejup-horizontal-white.svg").read_text())):
    assert k in html, k; html = html.replace(k,v)
(OUT/"capa-colagem.html").write_text(html); print("gerado")
