#!/usr/bin/env python3
"""Curadoria de leituras de domingo: Os Mandamentos do Advogado, de Eduardo J. Couture · 5 telas 1080x1440."""
import pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
DS = HERE.parents[2] / "skills" / "ejup-design" / "assets"
FONTS = (DS / "fonts").as_uri()
FOTOS = (OUT / "fotos").as_uri()


def svg(nome):
    return re.sub(r'<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', (DS / "logo" / nome).read_text(), 1)


LOGO_B = svg("ejup-horizontal-white.svg")
LOGO_N = svg("ejup-horizontal-navy.svg")
SIMB = svg("ejup-symbol-gold.svg")


def tela(cls, corpo, logo=LOGO_B, extra=""):
    return f'<section class="s {cls}">{extra}<div class="conteudo">{corpo}</div><div class="logo">{logo}</div></section>'


t1 = tela("navy capa", '''
  <div class="eyebrow">Leitura de domingo</div>
  <h1>Os Mandamentos<br>do <em>Advogado</em></h1>
  <p class="sub">Eduardo J. Couture</p>
  <p class="sub2">Dez preceitos curtos sobre estudar, pensar, lutar e esperar.</p>
  <div class="deslize">Deslize <i>→</i></div>
''', LOGO_B, '<div class="foto"></div><div class="scrim"></div><div class="num">10</div>')

t2 = tela("papel", '''
  <div class="eyebrow">O texto e o autor</div>
  <h2>Um decálogo escrito para <em>quem advoga</em></h2>
  <div class="fatos">
    <div><b>1904 a 1956</b><span>Eduardo J. Couture, jurista uruguaio e professor de Direito Processual.</span></div>
    <div><b>1948 e 1949</b><span>Surge como esboço na Revista de Derecho Procesal e é apresentado em conferência no Colégio de Advogados de Buenos Aires.</span></div>
    <div><b>10</b><span>mandamentos curtos, escritos em espanhol e traduzidos para o português em versões que variam.</span></div>
  </div>
''', LOGO_N)

t3 = tela("navy", '''
  <div class="eyebrow">Três para ler devagar</div>
  <h2>Do estudo ao <em>tempo</em></h2>
  <div class="lista">
    <div><b>2º</b><div><h3>Pensa</h3><p>O Direito se aprende estudando, mas se exerce pensando.</p></div></div>
    <div><b>4º</b><div><h3>Luta</h3><p>Teu dever é lutar pelo Direito. No dia em que encontrares em conflito o Direito e a Justiça, luta pela Justiça.</p></div></div>
    <div><b>7º</b><div><h3>Tem paciência</h3><p>O tempo se vinga das coisas que se fazem sem a sua colaboração.</p></div></div>
  </div>
  <p class="fonte">Tradução livre do original em espanhol.</p>
''', LOGO_B)

t4 = tela("papel", '''
  <div class="eyebrow">Por que ler</div>
  <h2>Uma leitura que pede <em>repertório e tempo</em></h2>
  <div class="num-l">
    <div><b>1</b><span>Estudo antes da pressa</span></div>
    <div><b>2</b><span>Pensamento antes da tese</span></div>
    <div><b>3</b><span>Tempo antes do resultado</span></div>
  </div>
  <p class="corpo">São poucas páginas, e cada mandamento sustenta uma conversa inteira sobre a prática do Direito.</p>
''', LOGO_N)

t5 = tela("ink cta", f'''
  <div class="simb">{SIMB}</div>
  <h2>Boa leitura,<br><em>bom domingo.</em></h2>
  <p class="corpo">Os Mandamentos do Advogado, de Eduardo J. Couture. Siga a EJUP para a curadoria de leituras de todo domingo.</p>
  <div class="assin"><b>Alma clássica, <em>repertório contemporâneo.</em></b><span>@ejup.oficial</span></div>
''', LOGO_B)

CSS = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Book.otf");font-weight:400}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Bold.otf");font-weight:700}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
:root{{--ink:#0d131a;--navy:#031c37;--steel:#304557;--silver:#d1d3d4;--bronze:#9b6b26;--gold:#f0b855;--graphite:#414042}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#222;font-family:Gotham,Montserrat,sans-serif;-webkit-font-smoothing:antialiased}}
.s{{position:relative;width:1080px;height:1440px;margin:0 0 40px;overflow:hidden;color:#fff}}
.navy{{background:var(--navy)}} .ink{{background:var(--ink)}}
.papel{{background:linear-gradient(160deg,#f8f6f1,#eeeae1);color:var(--graphite)}}
.conteudo{{position:absolute;left:96px;right:96px;top:100px;bottom:230px;display:flex;flex-direction:column;justify-content:center;z-index:2}}
.logo{{position:absolute;left:0;right:0;bottom:80px;display:flex;justify-content:center;z-index:3}}
.logo svg{{height:54px;width:auto}}
em{{font-style:normal;color:var(--gold)}} .papel em{{color:var(--bronze)}}
.eyebrow{{font-weight:500;font-size:26px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:28px}}
.papel .eyebrow{{color:var(--bronze)}}
h2{{font-weight:900;font-size:76px;line-height:1.06;letter-spacing:-.03em;margin-bottom:40px}}
.papel h2{{color:var(--navy)}}
.corpo{{font-weight:300;font-size:38px;line-height:1.45}}
.papel .corpo{{color:var(--graphite);margin-top:40px;font-size:42px}}
.fonte{{margin-top:34px;font-weight:300;font-size:26px;line-height:1.35;color:var(--silver);opacity:.85}}
/* capa */
.foto{{position:absolute;inset:0;background:url("{FOTOS}/capa.jpg") center/cover}}
.scrim{{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(3,28,55,.25) 0%,rgba(3,28,55,.55) 40%,rgba(3,28,55,.94) 70%,#031c37 90%)}}
.capa .conteudo{{justify-content:flex-end}}
.capa h1{{font-weight:900;font-size:104px;line-height:1.02;letter-spacing:-.035em}}
.sub{{font-weight:700;font-size:44px;margin-top:34px}}
.sub2{{font-weight:300;font-size:36px;line-height:1.4;color:var(--silver);margin-top:14px;max-width:760px}}
.deslize{{align-self:flex-start;margin-top:44px;background:var(--gold);color:var(--ink);font-weight:700;font-size:26px;letter-spacing:.12em;text-transform:uppercase;padding:18px 34px;border-radius:4px}}
.deslize i{{font-style:normal;margin-left:10px}}
.num{{position:absolute;right:-30px;top:40px;font-weight:900;font-size:520px;line-height:1;color:transparent;-webkit-text-stroke:3px rgba(209,211,212,.28);letter-spacing:-.04em;z-index:1}}
/* fatos */
.fatos>div{{padding:32px 0;border-top:2px solid rgba(48,69,87,.28);display:flex;flex-direction:column;gap:8px}}
.fatos>div:last-child{{border-bottom:2px solid rgba(48,69,87,.28)}}
.fatos b{{font-weight:900;font-size:68px;line-height:1;letter-spacing:-.03em;color:var(--bronze)}}
.fatos span{{font-weight:300;font-size:36px;line-height:1.4}}
/* lista */
.lista>div{{display:flex;gap:34px;padding:42px 0;border-top:2px solid rgba(209,211,212,.25)}}
.lista>div:last-child{{border-bottom:2px solid rgba(209,211,212,.25)}}
.lista b{{font-weight:900;font-size:76px;line-height:.9;color:var(--gold);min-width:100px}}
.lista h3{{font-weight:900;font-size:54px;line-height:1.1;margin-bottom:10px}}
.lista p{{font-weight:300;font-size:40px;line-height:1.4;color:var(--silver)}}
/* numerada */
.num-l div{{display:flex;gap:34px;align-items:baseline;padding:50px 0;border-top:2px solid rgba(48,69,87,.28)}}
.num-l div:last-child{{border-bottom:2px solid rgba(48,69,87,.28)}}
.num-l b{{font-weight:900;font-size:80px;line-height:.9;color:var(--bronze);min-width:56px}}
.num-l span{{font-weight:500;font-size:56px;line-height:1.25;color:var(--navy)}}
/* fecho */
.cta .conteudo{{justify-content:center}}
.cta .simb{{width:130px;margin-bottom:50px}}
.cta h2{{font-size:96px}}
.cta .corpo{{color:var(--silver);font-size:36px}}
.assin{{margin-top:56px;border-top:2px solid rgba(209,211,212,.25);padding-top:26px;display:flex;flex-direction:column;gap:8px}}
.assin b{{font-weight:900;font-size:34px}} .assin span{{font-weight:300;font-size:28px;color:var(--silver)}}
'''
html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Leitura de domingo · Couture</title><style>{CSS}</style></head><body>{t1}{t2}{t3}{t4}{t5}</body></html>'
(OUT / "carrossel.html").write_text(html)
print("ok")
