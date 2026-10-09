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


def simb(i, t, x, y, o):
    return f'<div class="g" style="left:{x - t / 2}px;top:{y - t / 2}px;width:{t}px;height:{t}px;opacity:{o}">{simbolo(i)}</div>'
# dentro da lousa (coordenadas relativas à lousa): cada geração maior; a última passa da borda
GER = [(140, 690, 68, .5), (285, 635, 108, .65), (480, 555, 176, .8), (775, 470, 360, 1)]
nos = "".join(simb(i, t, x, y, o) for i, (x, y, t, o) in enumerate(GER))
logo = re.sub(r'<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', (DS / "logo" / "ejup-horizontal-white.svg").read_text(), 1)

CSS = f"""
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Bold.otf");font-weight:700}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
:root{{--navy:#031c37;--ink:#0d131a;--steel:#304557;--silver:#d1d3d4;--gold:#f0b855}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{background:#10151b}}
.post{{position:relative;width:1080px;height:1440px;overflow:hidden;color:#fff;font-family:Gotham,Montserrat,sans-serif;
 background:radial-gradient(70% 50% at 50% 30%,#0b2547 0%,rgba(11,37,71,0) 70%),linear-gradient(170deg,#031c37 0%,#04172c 60%,var(--ink) 100%)}}
.post::after{{content:"";position:absolute;inset:0;z-index:9;pointer-events:none;opacity:.045;mix-blend-mode:overlay;
 background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")}}
.lousa{{position:absolute;z-index:2;left:64px;right:64px;top:84px;height:850px;border:16px solid var(--steel);border-radius:6px;overflow:hidden;
 background:radial-gradient(80% 70% at 30% 20%,#14263c 0%,#0e1b2c 55%,#0a141f 100%);
 box-shadow:inset 0 0 60px rgba(0,0,0,.55),0 30px 60px rgba(0,0,0,.45)}}
.poeira{{position:absolute;inset:0;opacity:.5;
 background:radial-gradient(40% 8% at 25% 88%,rgba(255,255,255,.09),transparent),radial-gradient(35% 7% at 70% 12%,rgba(255,255,255,.06),transparent),radial-gradient(30% 6% at 55% 60%,rgba(255,255,255,.05),transparent)}}
.giz{{filter:url(#rugoso)}}
.escrita{{position:absolute;left:56px;right:56px;top:54px}}
.titulo{{font-size:66px;line-height:1.1;letter-spacing:-.02em;font-weight:300;white-space:nowrap}}
.titulo b{{display:block;font-weight:700}}
.titulo em{{font-style:normal;color:var(--gold)}}
.g{{position:absolute;filter:drop-shadow(0 0 14px rgba(240,184,85,.25))}}
.g .sim{{width:100%;height:100%;display:block}}
.fio{{position:absolute;inset:0;width:100%;height:100%}}
.borda{{position:absolute;z-index:3;left:56px;right:56px;top:944px;height:26px;background:linear-gradient(180deg,#3d556a,#243747);border-radius:3px;box-shadow:0 14px 26px rgba(0,0,0,.5)}}
.gizinho{{position:absolute;z-index:4;top:928px;height:18px;border-radius:9px;background:linear-gradient(180deg,#fff,#cfd2d4)}}
.apagador{{position:absolute;z-index:4;top:916px;left:735px;width:150px;height:30px;border-radius:4px;background:linear-gradient(180deg,#24384c,#16273a);border-top:10px solid #d1d3d4}}
.texto{{position:absolute;z-index:4;left:90px;right:90px;top:1040px}}
.apoio{{font-weight:300;font-size:34px;line-height:1.45;color:rgba(209,211,212,.9);max-width:860px}}
.apoio b{{font-weight:700;color:#fff;white-space:nowrap}}
.data{{margin-top:28px;font-weight:500;font-size:20px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:20px}}
.data::before{{content:"";width:56px;height:1px;background:var(--gold)}}
.rodape{{position:absolute;z-index:5;left:0;right:0;bottom:56px;display:flex;justify-content:center}}
.rodape svg{{height:46px;width:auto;display:block}}
"""
fio = '<svg class="fio" viewBox="0 0 900 760"><path d="M140 690 C 215 675, 230 645, 285 635 C 370 618, 405 580, 480 555 C 590 515, 665 500, 775 470" fill="none" stroke="#f0b855" stroke-opacity=".3" stroke-width="1.6" stroke-dasharray="3 9"/></svg>'
filtro = '<svg width="0" height="0" style="position:absolute"><filter id="rugoso"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="r"/><feDisplacementMap in="SourceGraphic" in2="r" scale="2.4"/></filter></svg>'
html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Dia dos Professores · EJUP</title><style>{CSS}</style></head><body>{filtro}
<div class="post"><div class="lousa"><div class="poeira"></div><div class="giz">{fio}{nos}
<div class="escrita"><h1 class="titulo">Todo percurso começa<b>com alguém que <em>ensina.</em></b></h1></div></div></div>
<div class="borda"></div><div class="gizinho" style="left:120px;width:70px"></div><div class="gizinho" style="left:205px;width:46px;top:930px;transform:rotate(-4deg)"></div><div class="apagador"></div>
<div class="texto"><p class="apoio">A EJUP deseja um <b>feliz Dia dos Professores</b> a todos que dedicam suas vidas a formar pessoas.</p>
<div class="data">15 de outubro</div></div>
<div class="rodape">{logo}</div></div></body></html>"""
(OUT / "post-dia-dos-professores.html").write_text(html)
print("ok")
