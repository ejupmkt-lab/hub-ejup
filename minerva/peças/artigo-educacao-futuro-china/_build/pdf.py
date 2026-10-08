#!/usr/bin/env python3
"""Gera o PDF do artigo a partir de artigo.md (texto selecionável, links ativos)."""
import pathlib, re, html
try:
    import markdown
except ImportError:
    markdown = None
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
DS = HERE.parents[2] / "skills" / "ejup-design" / "assets"
FONTS = (DS / "fonts").as_uri()
md = (OUT / "artigo.md").read_text()
md = re.sub(r'<!--.*?-->\s*', '', md, flags=re.S)
body = markdown.markdown(md, extensions=["extra"]) if markdown else None
if body is None:
    raise SystemExit("instale o pacote markdown: pip install markdown")
logo = re.sub(r'<svg ', '<svg preserveAspectRatio="xMinYMid meet" ', (DS / "logo" / "ejup-horizontal-navy.svg").read_text(), 1)
CSS = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Book.otf");font-weight:400}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Bold.otf");font-weight:700}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
@page{{size:A4;margin:22mm 20mm 22mm 20mm}}
*{{box-sizing:border-box}}
body{{font-family:Gotham,Montserrat,sans-serif;font-weight:300;font-size:10.5pt;line-height:1.62;color:#414042;margin:0}}
.logo{{height:11mm;margin-bottom:10mm}} .logo svg{{height:100%;width:auto}}
h1{{font-weight:900;font-size:24pt;line-height:1.1;letter-spacing:-.02em;color:#031c37;margin:0 0 8mm}}
h2{{font-weight:900;font-size:14.5pt;line-height:1.18;letter-spacing:-.01em;color:#031c37;margin:9mm 0 3mm;break-after:avoid}}
h3{{font-weight:700;font-size:11.5pt;color:#031c37;margin:6mm 0 1.5mm;break-after:avoid}}
p{{margin:0 0 3.2mm;text-align:justify;hyphens:auto;orphans:3;widows:3}}
strong{{font-weight:700;color:#031c37}}
ul{{margin:0 0 4mm;padding-left:5mm}} li{{margin-bottom:1.6mm;text-align:justify;hyphens:auto}}
a{{color:#9b6b26;text-decoration:none;border-bottom:.2mm solid #9b6b26}}
h1+p{{font-weight:400;font-size:11.5pt}}
'''
doc = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>A educação do futuro está em curso</title><style>{CSS}</style></head><body><div class="logo">{logo}</div>{body}</body></html>'
(OUT / "artigo.html").write_text(doc)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page()
    pg.goto((OUT / "artigo.html").as_uri())
    pg.wait_for_timeout(800)
    pg.pdf(path=str(OUT / "Artigo_A_educacao_do_futuro_esta_em_curso_caso_da_China.pdf"), format="A4", print_background=True, display_header_footer=True,
           header_template="<span></span>",
           footer_template='<div style="width:100%;font-size:8px;color:#5f6062;text-align:center;font-family:sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
           margin={"top": "22mm", "bottom": "22mm", "left": "20mm", "right": "20mm"})
    b.close()
print("pdf ok")
