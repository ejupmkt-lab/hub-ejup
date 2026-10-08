#!/usr/bin/env python3
"""Post de aspas de sábado: Eduardo J. Couture, 1º mandamento · 1 tela 1080x1440."""
import pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
DS = HERE.parents[2] / "skills" / "ejup-design" / "assets"
FONTS = (DS / "fonts").as_uri()
LOGO_B = re.sub(r'<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', (DS / "logo" / "ejup-horizontal-white.svg").read_text(), 1)
CSS = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Bold.otf");font-weight:700}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
:root{{--navy:#031c37;--steel:#304557;--silver:#d1d3d4;--gold:#f0b855}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#222;font-family:Gotham,Montserrat,sans-serif;-webkit-font-smoothing:antialiased}}
.s{{position:relative;width:1080px;height:1440px;overflow:hidden;color:#fff;background:var(--navy)}}
.aspas{{position:absolute;right:-30px;top:-70px;font-weight:900;font-size:900px;line-height:1;color:transparent;-webkit-text-stroke:3px rgba(209,211,212,.14)}}
.conteudo{{position:absolute;left:96px;right:96px;top:150px;bottom:230px;display:flex;flex-direction:column;justify-content:center;z-index:2}}
.eyebrow{{font-weight:500;font-size:26px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:34px}}
.abre{{font-weight:900;font-size:230px;line-height:.95;letter-spacing:-.045em;color:var(--gold)}}
.texto{{font-weight:300;font-size:60px;line-height:1.28;letter-spacing:-.01em;margin-top:30px}}
.texto b{{font-weight:900}}
.fio{{width:120px;height:4px;background:var(--gold);margin:56px 0 30px}}
.autor{{font-weight:900;font-size:40px;letter-spacing:-.01em}}
.obra{{font-weight:300;font-size:30px;color:var(--silver);margin-top:8px}}
.logo{{position:absolute;left:0;right:0;bottom:80px;display:flex;justify-content:center;z-index:3}}
.logo svg{{height:54px;width:auto}}
'''
body = f'''<section class="s"><div class="aspas">”</div><div class="conteudo">
<div class="eyebrow">Para estudar com calma</div>
<div class="abre">Estuda.</div>
<p class="texto">O Direito se transforma constantemente. Se não acompanhas seus passos, serás <b>cada dia um pouco menos advogado.</b></p>
<div class="fio"></div>
<div class="autor">Eduardo J. Couture</div>
<div class="obra">Os Mandamentos do Advogado · 1º mandamento</div>
</div><div class="logo">{LOGO_B}</div></section>'''
(OUT / "carrossel.html").write_text(f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Couture · 1º mandamento</title><style>{CSS}</style></head><body>{body}</body></html>')
print("ok")
