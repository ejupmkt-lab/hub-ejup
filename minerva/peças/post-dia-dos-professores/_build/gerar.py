#!/usr/bin/env python3
"""Post único do Dia dos Professores · 1080x1440 · sistema das capas institucionais do feed."""
import pathlib, re
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
DS = HERE.parents[2] / "skills" / "ejup-design" / "assets"
FONTS = (DS / "fonts").as_uri()
LOGO = re.sub(r'<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', (DS / "logo" / "ejup-horizontal-white.svg").read_text(), 1)

# cadeia: anéis encadeados, cada um maior e mais perto da borda; o último sai da tela
ANEIS = [(210, 1215, 78, .38), (410, 1130, 108, .5), (650, 1030, 146, .65), (940, 905, 196, .9)]
aneis = ""
for x, y, r, o in ANEIS:
    aneis += f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="#f0b855" stroke-opacity="{o}" stroke-width="2.4"/>'
    aneis += f'<circle cx="{x}" cy="{y}" r="{r - 22}" fill="none" stroke="#f0b855" stroke-opacity="{o * .45:.2f}" stroke-width="1.4"/>'
    aneis += f'<circle cx="{x}" cy="{y}" r="7" fill="#f0b855" fill-opacity="{min(1, o + .1):.2f}"/>'
svg = f'''<svg class="cadeia" viewBox="0 0 1080 1440" xmlns="http://www.w3.org/2000/svg">{aneis}</svg>'''

CSS = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
:root{{--deep:#061424;--silver:#d1d3d4;--gold:#f0b855;--bronze:#9b6b26}}
*{{box-sizing:border-box}}
html,body{{margin:0;background:#10151b}}
.cover{{position:relative;overflow:hidden;color:#fff;width:1080px;height:1440px;font-family:Gotham,Montserrat,sans-serif;
 background:radial-gradient(38% 30% at 62% 74%, rgba(240,184,85,.13) 0%, rgba(240,184,85,0) 70%),
 radial-gradient(70% 80% at 8% 0%, #0a2340 0%, rgba(10,35,64,0) 60%),
 linear-gradient(160deg,#071a2f 0%,var(--deep) 55%,#040d18 100%)}}
.cover::before{{content:"";position:absolute;inset:0;z-index:6;pointer-events:none;opacity:.03;mix-blend-mode:overlay;
 background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>")}}
.halo{{position:absolute;z-index:1;left:300px;top:640px;width:760px;height:760px;border-radius:50%;filter:blur(8px);opacity:.5;
 background:radial-gradient(circle at 50% 45%,rgba(240,184,85,.75) 0%,rgba(240,184,85,.42) 28%,rgba(155,107,38,.18) 52%,rgba(240,184,85,0) 70%)}}
.cadeia{{position:absolute;inset:0;z-index:2;width:100%;height:100%}}
.texto{{position:absolute;z-index:4;left:80px;right:80px;top:96px;display:flex;flex-direction:column}}
.tag{{align-self:flex-start;border-radius:999px;border:1.5px solid rgba(240,184,85,.7);background:rgba(240,184,85,.06);
 padding:12px 26px;font-size:16px;letter-spacing:.18em;font-weight:500;text-transform:uppercase;color:var(--gold);margin-bottom:34px}}
.titulo{{font-weight:900;font-size:84px;line-height:1.06;letter-spacing:-.022em;margin:0;color:#fff}}
.titulo .g{{display:block;color:var(--gold);font-weight:300;letter-spacing:-.01em}}
.sub{{font-weight:300;font-size:30px;line-height:1.5;color:rgba(209,211,212,.82);margin:30px 0 0;max-width:860px}}
.meta{{display:flex;align-items:center;font-size:22px;color:rgba(209,211,212,.85);margin-top:38px}}
.meta .sep{{width:1px;height:28px;background:rgba(209,211,212,.28);margin:0 26px}}
.meta b{{font-weight:500;color:#fff}}
.piso{{position:absolute;z-index:3;left:0;right:0;bottom:0;height:250px;background:linear-gradient(0deg,#040d18 8%,rgba(4,13,24,.85) 45%,rgba(4,13,24,0) 100%)}}
.logo{{position:absolute;z-index:5;left:50%;transform:translateX(-50%);bottom:64px}}
.logo svg{{height:44px;width:auto;display:block}}
'''
html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Dia dos Professores · EJUP</title><style>{CSS}</style></head><body>
<div class="cover"><div class="halo"></div>{svg}<div class="piso"></div>
<div class="texto"><div class="tag">EJUP · Dia do Professor</div>
<h1 class="titulo">Todo percurso<span class="g">tem um professor.</span></h1>
<p class="sub">Todo jurista, todo profissional, chegou onde chegou porque alguém lhe ensinou. E quem ensina forma quem vai ensinar.</p>
<div class="meta"><b>15 de outubro</b><span class="sep"></span><span>Homenagem a quem ensina</span></div></div>
<div class="logo">{LOGO}</div></div></body></html>'''
(OUT / "post-dia-dos-professores.html").write_text(html)
print("ok")
