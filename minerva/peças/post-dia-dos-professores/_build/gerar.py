#!/usr/bin/env python3
"""Post único e pontual do Dia dos Professores · 1080x1440 · arte própria na identidade visual da EJUP.
Conceito: a cadeia de gerações. O símbolo da EJUP, em dourado (aplicação institucional autorizada), cresce de geração em geração
até sair do quadro. Fundo navy profundo, texto à esquerda, silêncio em volta."""
import pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
DS = HERE.parents[2] / "skills" / "ejup-design" / "assets"
FONTS = (DS / "fonts").as_uri()

def simbolo(i):
    s = (DS / "logo" / "ejup-symbol-navy.svg").read_text()
    s = s.replace('fill="#031c37"', f'fill="url(#ouro{i})"')
    s = re.sub(r'<svg ', '<svg class="sim" preserveAspectRatio="xMidYMid meet" ', s, 1)
    defs = (f'<defs><linearGradient id="ouro{i}" x1="0" y1="0" x2="1" y2="1">'
            '<stop offset="0" stop-color="#fbe3a6"/><stop offset=".35" stop-color="#f0b855"/>'
            '<stop offset=".7" stop-color="#b9822d"/><stop offset="1" stop-color="#f0b855"/></linearGradient></defs>')
    return s.replace('<g ', defs + '<g ', 1)

# x, y (centro), tamanho, opacidade: cada geração maior e mais nítida; a última sai do quadro
GER = [(120, 845, 74, .32), (285, 770, 120, .5), (520, 640, 205, .72), (835, 400, 640, 1)]
nos = "".join(
    f'<div class="g" style="left:{x - t / 2}px;top:{y - t / 2}px;width:{t}px;height:{t}px;opacity:{o}">{simbolo(i)}</div>'
    for i, (x, y, t, o) in enumerate(GER))
logo = re.sub(r'<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', (DS / "logo" / "ejup-horizontal-white.svg").read_text(), 1)

CSS = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
:root{{--navy:#031c37;--ink:#0d131a;--silver:#d1d3d4;--gold:#f0b855}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{background:#10151b}}
.post{{position:relative;width:1080px;height:1440px;overflow:hidden;color:#fff;font-family:Gotham,Montserrat,sans-serif;
 background:radial-gradient(60% 45% at 78% 30%,rgba(240,184,85,.16) 0%,rgba(240,184,85,0) 70%),
 radial-gradient(80% 70% at 0% 100%,#0a2340 0%,rgba(10,35,64,0) 62%),
 linear-gradient(165deg,#031c37 0%,#05152a 55%,var(--ink) 100%)}}
.post::after{{content:"";position:absolute;inset:0;z-index:7;pointer-events:none;opacity:.045;mix-blend-mode:overlay;
 background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")}}
.g{{position:absolute;z-index:2;filter:drop-shadow(0 0 28px rgba(240,184,85,.28))}}
.g .sim{{width:100%;height:100%;display:block}}
.fio{{position:absolute;inset:0;z-index:1;width:100%;height:100%}}
.texto{{position:absolute;z-index:4;left:90px;right:90px;top:960px}}
.titulo{{font-size:76px;line-height:1.06;letter-spacing:-.03em;font-weight:300;white-space:nowrap}}
.titulo b{{display:block;font-weight:900;letter-spacing:-.035em}}
.titulo em{{font-style:normal;color:var(--gold)}}
.apoio{{margin-top:32px;font-weight:300;font-size:31px;line-height:1.45;color:rgba(209,211,212,.88);max-width:800px}}
.apoio b{{font-weight:700;color:#fff;white-space:nowrap}}
.data{{margin-top:30px;font-weight:500;font-size:20px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:20px}}
.data::before{{content:"";width:56px;height:1px;background:var(--gold)}}
.rodape{{position:absolute;z-index:5;left:0;right:0;bottom:60px;display:flex;justify-content:center}}
.rodape svg{{height:46px;width:auto;display:block}}
'''
# fio fino ligando as gerações
fio = '<svg class="fio" viewBox="0 0 1080 1440"><path d="M120 845 C 200 830, 215 785, 285 770 C 380 750, 420 690, 520 640 C 640 580, 700 480, 835 400" fill="none" stroke="#f0b855" stroke-opacity=".28" stroke-width="1.4" stroke-dasharray="3 9"/></svg>'
html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Dia dos Professores · EJUP</title><style>{CSS}</style></head><body>
<div class="post">{fio}{nos}
<div class="texto"><h1 class="titulo">Todo percurso começa<b>com alguém que <em>ensina.</em></b></h1>
<p class="apoio">A EJUP deseja um <b>feliz Dia dos Professores</b> a todos que dedicam suas vidas a formar pessoas.</p>
<div class="data">15 de outubro</div></div>
<div class="rodape">{logo}</div></div></body></html>'''
(OUT / "post-dia-dos-professores.html").write_text(html)
print("ok")
