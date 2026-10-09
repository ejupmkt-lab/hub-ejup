#!/usr/bin/env python3
"""Post do Dia dos Professores sobre as três fotografias de referência · 1080x1440.
Uma versão por foto (livro, lousa, sala). Texto em Gotham: título Light + Black dourado, apoio Light, logo branca."""
import pathlib, re, sys
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
DS = HERE.parents[2] / "skills" / "ejup-design" / "assets"
FONTS = (DS / "fonts").as_uri()
logo = re.sub(r'<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', (DS / "logo" / "ejup-horizontal-white.svg").read_text(), 1)

# foto, posição do recorte, véu de legibilidade, posição do bloco de apoio
V = {
 "A-livro": dict(foto="ref-livro.jpg", pos="50% 50%", apoio_top=1128,
   veu="linear-gradient(180deg,rgba(3,28,55,.55) 0%,rgba(3,28,55,0) 34%,rgba(3,28,55,0) 62%,rgba(8,14,22,.78) 82%,rgba(8,14,22,.92) 100%)"),
 "B-lousa": dict(foto="ref-lousa.jpg", pos="50% 50%", apoio_top=470,
   veu="linear-gradient(180deg,rgba(8,16,26,.72) 0%,rgba(8,16,26,.35) 38%,rgba(8,16,26,0) 56%,rgba(8,14,22,0) 82%,rgba(8,14,22,.85) 100%)"),
 "C-sala": dict(foto="ref-sala.jpg", pos="50% 50%", apoio_top=455,
   veu="linear-gradient(180deg,rgba(6,12,22,.55) 0%,rgba(6,12,22,.15) 40%,rgba(6,12,22,0) 55%,rgba(6,12,22,0) 80%,rgba(6,12,22,.7) 100%)"),
}

CSS = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Book.otf");font-weight:400}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Bold.otf");font-weight:700}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
:root{{--gold:#f0b855;--silver:#d1d3d4}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{background:#0d131a}}
.post{{position:relative;width:1080px;height:1440px;overflow:hidden;font-family:Gotham,Montserrat,sans-serif;color:#fff}}
.foto{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
.veu{{position:absolute;inset:0}}
.topo{{position:absolute;left:84px;right:84px;top:92px}}
.eyebrow{{font-weight:500;font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:18px;margin-bottom:34px}}
.eyebrow::before{{content:"";width:52px;height:2px;background:var(--gold)}}
.titulo{{font-weight:300;font-size:84px;line-height:1.04;letter-spacing:-.02em;white-space:nowrap}}
.titulo b{{display:block;font-weight:900;font-size:138px;line-height:1.02;letter-spacing:-.03em;color:var(--gold);margin-top:6px}}
.apoio{{position:absolute;left:84px;width:820px}}
.apoio .a{{font-weight:500;font-size:32px;line-height:1.3;color:#fff;margin-bottom:12px;letter-spacing:-.005em}}
.apoio .b{{font-weight:300;font-size:29px;line-height:1.42;color:var(--silver)}}
.rodape{{position:absolute;left:0;right:0;bottom:46px;display:flex;justify-content:center}}
.rodape svg{{height:46px;width:auto;display:block}}
'''

def html(v):
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Dia dos Professores · EJUP</title><style>{CSS}</style></head><body>
<div class="post"><img class="foto" src="{(OUT / "fotos" / v["foto"]).as_uri()}" style="object-position:{v["pos"]}">
<div class="veu" style="background:{v["veu"]}"></div>
<div class="topo"><div class="eyebrow">15 de outubro</div><h1 class="titulo">Feliz Dia dos<b>Professores.</b></h1></div>
<div class="apoio" style="top:{v["apoio_top"]}px"><p class="a">Todo percurso começa com alguém que ensina.</p><p class="b">A EJUP agradece a todos que dedicam suas vidas a formar pessoas.</p></div>
<div class="rodape">{logo}</div></div></body></html>'''

sel = sys.argv[1:] or list(V)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1080, "height": 1440})
    for k in sel:
        f = OUT / f"_build/_tmp_{k}.html"; f.write_text(html(V[k]))
        pg.goto(f.as_uri()); pg.wait_for_timeout(700)
        pg.locator(".post").screenshot(path=str(OUT / f"post-dia-dos-professores-{k}.png"))
        f.unlink(); print("ok", k)
    b.close()
