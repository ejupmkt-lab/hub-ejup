#!/usr/bin/env python3
"""Post único e pontual do Dia dos Professores · 1080x1440.
A própria imagem é a lousa: ardósia azul-marinho em sangria total, escrita e desenho a giz, marcas de apagador.
O símbolo da EJUP, em dourado, é desenhado no quadro em gerações cada vez maiores; a última sai da lousa."""
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
            '<stop offset="0" stop-color="#f8dca0"/><stop offset=".4" stop-color="#f0b855"/>'
            '<stop offset=".75" stop-color="#c58d33"/><stop offset="1" stop-color="#f0b855"/></linearGradient></defs>')
    return s.replace('<g ', defs + '<g ', 1)

# centro x, centro y, tamanho, opacidade. Cada geração maior; a última passa da borda direita
GER = [(120, 905, 62, .55), (250, 840, 100, .66), (440, 750, 165, .8), (815, 600, 500, 1)]
nos = "".join(
    f'<div class="g" style="left:{x - t / 2}px;top:{y - t / 2}px;width:{t}px;height:{t}px;opacity:{o}">{simbolo(i)}</div>'
    for i, (x, y, t, o) in enumerate(GER))
logo = re.sub(r'<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', (DS / "logo" / "ejup-horizontal-white.svg").read_text(), 1)

FILTROS = '''<svg width="0" height="0" style="position:absolute">
<filter id="giz" x="-5%" y="-5%" width="110%" height="110%">
 <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="4" result="ond"/>
 <feDisplacementMap in="SourceGraphic" in2="ond" scale="3.2" result="d"/>
 <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="9" result="n"/>
 <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.4 0 0 0 -1.05" result="m"/>
 <feComposite in="d" in2="m" operator="in"/>
</filter>
<filter id="gizfino" x="-5%" y="-5%" width="110%" height="110%">
 <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="2" result="ond"/>
 <feDisplacementMap in="SourceGraphic" in2="ond" scale="1.6" result="d"/>
 <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="5" result="n"/>
 <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3 0 0 0 -0.75" result="m"/>
 <feComposite in="d" in2="m" operator="in"/>
</filter>
<filter id="borra"><feGaussianBlur stdDeviation="22"/></filter>
</svg>'''

# marcas de apagador: faixas largas e suaves, e traços de lições anteriores quase apagados
ARDOSIA = '''<svg class="marcas" viewBox="0 0 1080 1440">
<g filter="url(#borra)" fill="none" stroke-linecap="round" stroke="#ffffff">
<path d="M-40 330 C 250 290, 600 360, 1120 300" stroke-opacity=".07" stroke-width="110"/>
<path d="M-40 640 C 300 600, 700 690, 1120 610" stroke-opacity=".055" stroke-width="130"/>
<path d="M-40 1010 C 280 980, 640 1050, 1120 990" stroke-opacity=".06" stroke-width="120"/>
</g>
<g filter="url(#gizfino)" fill="none" stroke="#fff" stroke-opacity=".10" stroke-width="3" stroke-linecap="round">
<circle cx="905" cy="470" r="46"/><circle cx="905" cy="470" r="30"/><path d="M95 1070 H 330 M95 1098 H 250"/>
<path d="M760 1040 q 30 -50 60 0 t 60 0" /></g></svg>'''

CSS = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Book.otf");font-weight:400}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Bold.otf");font-weight:700}}
:root{{--ink:#0d131a;--steel:#304557;--silver:#d1d3d4;--gold:#f0b855;--chalk:#f4f1e8}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{background:#10151b}}
.post{{position:relative;width:1080px;height:1440px;overflow:hidden;font-family:Gotham,Montserrat,sans-serif;color:var(--chalk);
 background:radial-gradient(90% 60% at 30% 22%,#173150 0%,#0f2238 45%,#08121f 100%)}}
.post::before{{content:"";position:absolute;inset:0;z-index:1;opacity:.5;
 background:radial-gradient(120% 100% at 50% 40%,transparent 50%,rgba(0,0,0,.55) 100%)}}
.post::after{{content:"";position:absolute;inset:0;z-index:20;pointer-events:none;opacity:.07;mix-blend-mode:overlay;
 background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")}}
.marcas{{position:absolute;inset:0;width:100%;height:100%;z-index:2}}
.escrita{{position:absolute;z-index:6;left:84px;right:84px;top:118px;filter:url(#gizfino)}}
.titulo{{font-size:74px;line-height:1.1;letter-spacing:-.02em;font-weight:400;white-space:nowrap}}
.titulo b{{display:block;font-weight:700}}
.titulo em{{font-style:normal;color:var(--gold)}}
.g{{position:absolute;z-index:5;filter:url(#giz)}}
.g .sim{{width:100%;height:100%;display:block}}
.fio{{position:absolute;inset:0;width:100%;height:100%;z-index:4;filter:url(#gizfino)}}
.apoio{{position:absolute;z-index:6;left:84px;right:84px;top:985px;filter:url(#gizfino)}}
.apoio p{{font-weight:400;font-size:34px;line-height:1.42;color:var(--chalk);max-width:860px}}
.apoio b{{font-weight:700;white-space:nowrap}}
.data{{margin-top:24px;font-weight:500;font-size:21px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:18px}}
.data::before{{content:"";width:52px;height:2px;background:var(--gold)}}
.borda{{position:absolute;z-index:8;left:0;right:0;top:1244px;height:34px;background:linear-gradient(180deg,#4a6378 0%,#304557 45%,#1f2f3d 100%);box-shadow:0 -6px 18px rgba(0,0,0,.4),0 18px 30px rgba(0,0,0,.5)}}
.giz1,.giz2{{position:absolute;z-index:9;height:20px;border-radius:10px;background:linear-gradient(180deg,#fff,#d9dcdc);box-shadow:0 3px 6px rgba(0,0,0,.45)}}
.giz1{{left:96px;top:1229px;width:78px}}
.giz2{{left:196px;top:1233px;width:50px;transform:rotate(-5deg)}}
.apagador{{position:absolute;z-index:9;left:780px;top:1206px;width:168px;height:42px;border-radius:5px;background:linear-gradient(180deg,#27394c,#15222f);border-top:14px solid #d1d3d4;box-shadow:0 5px 8px rgba(0,0,0,.5)}}
.parede{{position:absolute;z-index:7;left:0;right:0;top:1278px;bottom:0;background:linear-gradient(180deg,#0a141f,#0d131a)}}
.rodape{{position:absolute;z-index:10;left:0;right:0;bottom:44px;display:flex;justify-content:center}}
.rodape svg{{height:48px;width:auto;display:block}}
'''
fio = '<svg class="fio" viewBox="0 0 1080 1440"><path d="M120 905 C 190 892, 205 855, 250 840 C 330 818, 360 780, 440 750 C 570 705, 660 690, 815 600" fill="none" stroke="#f0b855" stroke-opacity=".5" stroke-width="2" stroke-dasharray="2 11" stroke-linecap="round"/></svg>'
html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Dia dos Professores · EJUP</title><style>{CSS}</style></head><body>{FILTROS}
<div class="post">{ARDOSIA}{fio}{nos}
<div class="escrita"><h1 class="titulo">Todo percurso começa<b>com alguém que <em>ensina.</em></b></h1></div>
<div class="apoio"><p>A EJUP deseja um <b>feliz Dia dos Professores</b> a todos que dedicam suas vidas a formar pessoas.</p><div class="data">15 de outubro</div></div>
<div class="borda"></div><div class="giz1"></div><div class="giz2"></div><div class="apagador"></div><div class="parede"></div>
<div class="rodape">{logo}</div></div></body></html>'''
(OUT / "post-dia-dos-professores.html").write_text(html)
print("ok")
