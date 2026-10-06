#!/usr/bin/env python3
"""Carrossel 'Cidadania em Prática' · ep. 1 · Direito de petição · 8 telas 1080x1440."""
import pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
DS = HERE.parents[2] / "skills" / "ejup-design" / "assets"
FONTS = (DS / "fonts").as_uri()


def svg(nome):
    return re.sub(r'<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', (DS / "logo" / nome).read_text(), 1)


LOGO_B = svg("ejup-horizontal-white.svg")
LOGO_N = svg("ejup-horizontal-navy.svg")
SIMB = svg("ejup-symbol-gold.svg")


def trilho(ativo):
    nomes = ["Destino e pedido", "Escrita", "Protocolo"]
    pts = ""
    for i, n in enumerate(nomes):
        cls = "on" if i == ativo else ("ok" if i < ativo else "")
        pts += f'<div class="pt {cls}"><i></i><span>{n}</span></div>'
    return f'<div class="trilho"><div class="fio-t"></div>{pts}</div>'


def tela(cls, corpo, logo=LOGO_B, extra=""):
    return f'<section class="s {cls}">{extra}<div class="conteudo">{corpo}</div><div class="logo">{logo}</div></section>'


# 1 capa
folha = '''<svg class="folha" viewBox="0 0 300 380"><rect x="14" y="14" width="272" height="352" rx="8" fill="none" stroke="#f0b855" stroke-width="5"/>
<rect x="46" y="58" width="130" height="14" fill="#f0b855"/>
<g stroke="#d1d3d4" stroke-opacity=".5" stroke-width="8"><line x1="46" y1="116" x2="254" y2="116"/><line x1="46" y1="150" x2="254" y2="150"/><line x1="46" y1="184" x2="254" y2="184"/><line x1="46" y1="218" x2="200" y2="218"/></g>
<circle cx="222" cy="304" r="38" fill="none" stroke="#f0b855" stroke-width="5"/><path d="M204 304l13 13 24-28" fill="none" stroke="#f0b855" stroke-width="6"/></svg>'''
t1 = tela("navy", f'''
  {folha}
  <h1 class="h-capa"><span class="l">Como exercer o</span><br><em>direito de petição</em></h1>
  <p class="sub">Passo a passo, da Constituição ao protocolo.</p>
  <div class="chips"><span class="chip">Cidadania em Prática</span><span class="seta">Deslize para ver o caminho</span></div>
''')

# 2 papel
t2 = tela("papel", '''
  <h2>Um direito de <em>todos</em></h2>
  <div class="cit"><p>A Constituição assegura a todos, independentemente do pagamento de taxas, o direito de petição aos Poderes Públicos em defesa de direitos ou contra ilegalidade ou abuso de poder.</p></div>
  <span class="chip papel-chip">Constituição Federal, art. 5º, XXXIV, a</span>
''', LOGO_N)

# 3 navy
t3 = tela("navy", '''
  <h2>A todos, <em>sem pagar taxa</em></h2>
  <p class="corpo">O texto constitucional fala em todos. Qualquer pessoa pode peticionar ao Poder Público, e o direito não depende do pagamento de taxas.</p>
  <div class="cards3"><div>Qualquer pessoa</div><div>Qualquer dos Poderes</div><div>Sem taxa</div></div>
''')

# 4 papel passo 1
t4 = tela("passo papel", '''
  <h2><span class="l">Antes de escrever,</span><br>defina o destino e o <em>pedido</em></h2>
  <div class="rows">
    <div class="r"><b>O destino</b><p>Identifique o órgão ou a autoridade a quem a petição se dirige.</p></div>
    <div class="r"><b>O pedido</b><p>Diga em uma frase o que você quer que seja feito.</p></div>
  </div>
''', LOGO_N, '<div class="num">1</div>' + trilho(0))

# 5 navy passo 2
t5 = tela("passo navy", '''
  <h2>Escreva em <em>quatro partes</em></h2>
  <div class="rows">
    <div class="r"><b>Quem é você</b><p>Nome e identificação de quem peticiona.</p></div>
    <div class="r"><b>O fato</b><p>O que aconteceu, com data e local.</p></div>
    <div class="r"><b>O problema</b><p>A ilegalidade ou o abuso que você aponta.</p></div>
    <div class="r"><b>O pedido</b><p>O que você quer que o órgão faça.</p></div>
  </div>
''', LOGO_B, '<div class="num">2</div>' + trilho(1))

# 6 papel passo 3
t6 = tela("passo papel", '''
  <h2>Protocole e <em>guarde o comprovante</em></h2>
  <p class="corpo">O comprovante prova a data e o conteúdo do que foi entregue. Guarde uma cópia da petição e o número do protocolo, e acompanhe o andamento por ele.</p>
  <div class="recibo"><div><small>Protocolo</small><span></span></div><div><small>Data</small><span></span></div><div><small>Órgão</small><span></span></div></div>
''', LOGO_N, '<div class="num">3</div>' + trilho(2))

# 7 steel
t7 = tela("steel", '''
  <h2>A petição <em>convive</em> com a Justiça</h2>
  <p class="corpo">A lei não excluirá da apreciação do Poder Judiciário lesão ou ameaça a direito (Constituição Federal, art. 5º, XXXV). Em caso de lesão, vale buscar advogado ou defensoria.</p>
  <div class="fork"><div class="topo">Seu direito</div><div class="ramos"><div>Petição ao Poder Público</div><div>Ação no Judiciário</div></div></div>
''')

# 8 CTA
t8 = tela("ink", f'''
  <div class="simb">{SIMB}</div>
  <h2 class="cta">Você já usou o <em>direito de petição?</em></h2>
  <p class="corpo esq">Conte nos comentários. Na próxima quinzena: atos gratuitos de cidadania.</p>
  <div class="pill">Salve para consultar</div>
  <div class="assin"><b>Alma clássica, <em>repertório contemporâneo.</em></b><span>@ejup.oficial</span></div>
''')

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
.navy{{background:var(--navy)}} .ink{{background:var(--ink)}} .steel{{background:var(--steel)}}
.papel{{background:linear-gradient(160deg,#f8f6f1,#eeeae1);color:var(--graphite)}}
.conteudo{{position:absolute;left:96px;right:96px;top:110px;bottom:250px;display:flex;flex-direction:column;justify-content:center}}
.logo{{position:absolute;left:0;right:0;bottom:84px;display:flex;justify-content:center}}
.logo svg{{height:54px;width:auto}}
em{{font-style:normal;color:var(--gold)}} .papel em{{color:var(--bronze)}}
h2{{font-weight:900;font-size:86px;line-height:1.06;letter-spacing:-.025em;margin-bottom:56px}}
h2 .l{{font-weight:300;letter-spacing:-.01em}}
.papel h2{{color:var(--navy)}}
.corpo{{font-weight:300;font-size:48px;line-height:1.5;text-align:justify;text-align-last:left;hyphens:auto}}
.papel .corpo{{color:var(--graphite)}}
.corpo.esq{{text-align:left}}
.chip{{display:inline-block;border:2px solid var(--gold);color:var(--gold);font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase;padding:14px 26px;border-radius:999px}}
/* capa */
.folha{{align-self:flex-end;width:250px;margin-bottom:70px;opacity:.95}}
.h-capa{{margin-top:0;font-size:112px;line-height:1.02;letter-spacing:-.03em;font-weight:900}}
.h-capa .l{{font-weight:300;font-size:70px;letter-spacing:-.01em}}
.sub{{font-weight:300;font-size:44px;line-height:1.4;color:var(--silver);margin:44px 0 56px}}
.chips{{display:flex;align-items:center;gap:32px}}
.seta{{font-weight:400;font-size:26px;color:var(--silver)}}
.seta::after{{content:" \\2192";color:var(--gold)}}
/* 2 */
.cit{{border-left:8px solid var(--bronze);padding:8px 0 8px 44px;margin-bottom:56px}}
.cit p{{font-weight:300;font-size:47px;line-height:1.5;color:var(--navy);text-align:justify;text-align-last:left;hyphens:auto}}
.papel-chip{{align-self:flex-start;border-color:var(--bronze);color:var(--bronze)}}
/* 3 */
.cards3{{display:flex;flex-direction:column;gap:20px;margin-top:56px}}
.cards3 div{{border:2px solid rgba(209,211,212,.35);padding:34px 40px;font-weight:500;font-size:40px;letter-spacing:.02em;border-left:8px solid var(--gold)}}
/* passos */
.passo .conteudo{{bottom:350px}}
.passo h2{{font-size:76px;margin-bottom:44px}}
.passo .corpo{{font-size:44px}}
.num{{position:absolute;right:-30px;top:20px;font-weight:900;font-size:640px;line-height:1;color:transparent;-webkit-text-stroke:3px rgba(209,211,212,.18)}}
.papel .passo .conteudo{{bottom:350px}}
.passo h2{{font-size:76px;margin-bottom:44px}}
.passo .corpo{{font-size:44px}}
.num{{-webkit-text-stroke:3px rgba(155,107,38,.28)}}
.rows{{display:flex;flex-direction:column}}
.r{{padding:34px 0;border-top:2px solid rgba(209,211,212,.28)}}
.r:last-child{{border-bottom:2px solid rgba(209,211,212,.28)}}
.papel .r{{border-color:rgba(48,69,87,.25)}}
.r b{{display:block;font-weight:900;font-size:44px;letter-spacing:-.01em;margin-bottom:10px}}
.papel .r b{{color:var(--navy)}}
.r p{{font-weight:300;font-size:36px;line-height:1.4;text-align:left}}
.trilho{{position:absolute;left:96px;right:96px;bottom:190px;display:flex;justify-content:space-between}}
.fio-t{{position:absolute;left:14px;right:14px;top:14px;height:3px;background:rgba(209,211,212,.3)}}
.papel .fio-t{{background:rgba(48,69,87,.25)}}
.pt{{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px;font-size:22px;letter-spacing:.1em;text-transform:uppercase;font-weight:500;color:rgba(209,211,212,.6)}}
.pt i{{display:block;width:30px;height:30px;border-radius:50%;background:var(--navy);border:3px solid rgba(209,211,212,.5)}}
.papel .pt{{color:rgba(48,69,87,.6)}} .papel .pt i{{background:#f3f0e8;border-color:rgba(48,69,87,.4)}}
.pt.on i{{background:var(--gold);border-color:var(--gold)}} .pt.on{{color:var(--gold)}}
.papel .pt.on i{{background:var(--bronze);border-color:var(--bronze)}} .papel .pt.on{{color:var(--bronze)}}
.pt.ok i{{border-color:var(--gold)}} .papel .pt.ok i{{border-color:var(--bronze)}}
/* 6 */
.recibo{{margin-top:50px;border:3px dashed rgba(155,107,38,.55);padding:34px 40px;display:flex;flex-direction:column;gap:24px}}
.recibo div{{display:flex;align-items:flex-end;gap:24px}}
.recibo small{{font-weight:500;font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:var(--bronze);width:170px}}
.recibo span{{flex:1;height:2px;background:rgba(48,69,87,.35)}}
/* 7 */
.fork{{margin-top:54px;text-align:center}}
.fork .topo{{display:inline-block;background:var(--gold);color:var(--ink);font-weight:700;font-size:28px;letter-spacing:.12em;text-transform:uppercase;padding:16px 36px;border-radius:999px}}
.ramos{{display:flex;gap:28px;margin-top:44px;position:relative}}
.ramos::before{{content:"";position:absolute;left:25%;right:25%;top:-26px;height:26px;border:3px solid rgba(209,211,212,.5);border-bottom:none}}
.ramos div{{flex:1;border:2px solid rgba(209,211,212,.45);padding:34px 22px;font-weight:500;font-size:34px;line-height:1.3}}
/* 8 */
.simb{{width:150px;margin-bottom:60px}}
h2.cta{{font-size:92px}}
.pill{{align-self:flex-start;margin-top:52px;background:var(--gold);color:var(--ink);font-weight:700;font-size:30px;letter-spacing:.12em;text-transform:uppercase;padding:22px 44px;border-radius:999px}}
.assin{{margin-top:70px;border-top:2px solid rgba(209,211,212,.25);padding-top:30px;display:flex;flex-direction:column;gap:10px}}
.assin b{{font-weight:900;font-size:36px;letter-spacing:-.01em}} .assin span{{font-weight:300;font-size:30px;color:var(--silver)}}
.ink .logo{{display:none}}
'''
html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cidadania em Prática 01</title><style>{CSS}</style></head><body>{t1}{t2}{t3}{t4}{t5}{t6}{t7}{t8}</body></html>'
(OUT / "carrossel.html").write_text(html)
print("carrossel.html gerado")
