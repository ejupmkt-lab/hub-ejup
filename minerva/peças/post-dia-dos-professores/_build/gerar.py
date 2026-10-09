#!/usr/bin/env python3
"""Post único e pontual do Dia dos Professores · 1080x1440 · arte própria, na identidade visual da EJUP (fundo claro, símbolo, hairlines)."""
import pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
DS = HERE.parents[2] / "skills" / "ejup-design" / "assets"
FONTS = (DS / "fonts").as_uri()

def inline(nome, cls):
    s = (DS / "logo" / nome).read_text()
    return re.sub(r'<svg ', f'<svg class="{cls}" preserveAspectRatio="xMidYMid meet" ', s, 1)

LOGO = inline("ejup-horizontal-navy.svg", "lg")
# cadeia de símbolos: cada geração um pouco maior, a opacidade sobe até a última
TAM = [58, 84, 118, 164]
OPA = [.22, .38, .62, 1]
simbolos = "".join(
    f'<div class="no" style="width:{t}px;height:{t}px;opacity:{o}">{inline("ejup-symbol-navy.svg", "sm")}</div>'
    for t, o in zip(TAM, OPA))

CSS = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Book.otf");font-weight:400}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Bold.otf");font-weight:700}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
:root{{--navy:#031c37;--steel:#304557;--silver:#d1d3d4;--bronze:#9b6b26;--graphite:#414042}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{background:#10151b}}
.post{{position:relative;width:1080px;height:1440px;overflow:hidden;font-family:Gotham,Montserrat,sans-serif;color:var(--navy);
 background:radial-gradient(75% 60% at 50% 38%,#ffffff 0%,#eceded 55%,var(--silver) 130%)}}
.moldura{{position:absolute;inset:44px;border:1px solid rgba(3,28,55,.22)}}
.moldura i{{position:absolute;width:22px;height:22px;border-color:var(--bronze);border-style:solid;border-width:0}}
.moldura i:nth-child(1){{left:-1px;top:-1px;border-top-width:2px;border-left-width:2px}}
.moldura i:nth-child(2){{right:-1px;top:-1px;border-top-width:2px;border-right-width:2px}}
.moldura i:nth-child(3){{left:-1px;bottom:-1px;border-bottom-width:2px;border-left-width:2px}}
.moldura i:nth-child(4){{right:-1px;bottom:-1px;border-bottom-width:2px;border-right-width:2px}}
.miolo{{position:absolute;left:80px;right:80px;top:215px;display:flex;flex-direction:column;align-items:center;text-align:center}}
.titulo{{white-space:nowrap;font-size:100px;line-height:1.02;letter-spacing:-.03em;font-weight:300}}
.titulo b{{display:block;font-weight:900;letter-spacing:-.035em}}
.regua{{width:96px;height:2px;background:var(--bronze);margin:56px 0 50px}}
.apoio{{text-wrap:balance;font-weight:300;font-size:38px;line-height:1.42;color:var(--graphite);max-width:860px}}
.apoio b{{font-weight:700;color:var(--navy);white-space:nowrap}}
.cadeia{{position:absolute;left:120px;right:120px;top:835px;height:190px;display:flex;align-items:flex-end;justify-content:center;gap:0}}
.cadeia::before{{content:"";position:absolute;left:0;right:0;bottom:82px;height:1px;background:linear-gradient(90deg,rgba(3,28,55,0),rgba(3,28,55,.35) 22%,rgba(3,28,55,.35) 78%,rgba(3,28,55,0))}}
.no{{position:relative;margin:0 34px;flex:none;display:flex;align-items:center;justify-content:center;transform:translateY(0)}}
.no:nth-child(1){{margin-bottom:53px}}.no:nth-child(2){{margin-bottom:40px}}.no:nth-child(3){{margin-bottom:23px}}.no:nth-child(4){{margin-bottom:0}}
.sm{{width:100%;height:100%;display:block}}
.data{{position:absolute;left:0;right:0;top:1085px;text-align:center;font-weight:500;font-size:22px;letter-spacing:.2em;text-transform:uppercase;color:var(--bronze)}}
.rodape{{position:absolute;left:0;right:0;bottom:92px;display:flex;justify-content:center}}
.lg{{height:54px;width:auto;display:block}}
'''
html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Dia dos Professores · EJUP</title><style>{CSS}</style></head><body>
<div class="post"><div class="moldura"><i></i><i></i><i></i><i></i></div>
<div class="miolo"><h1 class="titulo">Todo percurso<b>tem um professor.</b></h1><div class="regua"></div>
<p class="apoio">A EJUP deseja um <b>feliz Dia dos Professores</b> a todos que dedicam suas vidas a formar pessoas.</p></div>
<div class="cadeia">{simbolos}</div>
<div class="data">15 de outubro</div>
<div class="rodape">{LOGO}</div></div></body></html>'''
(OUT / "post-dia-dos-professores.html").write_text(html)
print("ok")
