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
    nomes = ["Participação", "Informação e defesa", "Documentos"]
    pts = ""
    for i, n in enumerate(nomes):
        cls = "on" if i == ativo else ("ok" if i < ativo else "")
        pts += f'<div class="pt {cls}"><i></i><span>{n}</span></div>'
    return f'<div class="trilho"><div class="fio-t"></div>{pts}</div>'


def tela(cls, corpo, logo=LOGO_B, extra=""):
    return f'<section class="s {cls}">{extra}<div class="conteudo">{corpo}</div><div class="logo">{logo}</div></section>'


def item(txt, ref):
    return f'<div class="r"><p>{txt}</p><small>{ref}</small></div>'


# 1 capa
folha = '''<svg class="folha" viewBox="0 0 300 380"><rect x="14" y="14" width="272" height="352" rx="8" fill="none" stroke="#f0b855" stroke-width="5"/>
<rect x="46" y="58" width="130" height="14" fill="#f0b855"/>
<g stroke="#d1d3d4" stroke-opacity=".5" stroke-width="8"><line x1="46" y1="116" x2="254" y2="116"/><line x1="46" y1="150" x2="254" y2="150"/><line x1="46" y1="184" x2="254" y2="184"/><line x1="46" y1="218" x2="200" y2="218"/></g>
<circle cx="222" cy="304" r="38" fill="none" stroke="#f0b855" stroke-width="5"/><path d="M204 304l13 13 24-28" fill="none" stroke="#f0b855" stroke-width="6"/></svg>'''
t1 = tela("navy", f'''
  {folha}
  <h1 class="h-capa"><span class="l">Quais atos de</span><br><em>cidadania são gratuitos?</em></h1>
  <p class="sub">O que a Constituição e a Lei nº 9.265/1996 garantem.</p>
  <div class="chips"><span class="chip">Cidadania em Prática</span><span class="seta">Deslize para ver a lista</span></div>
''')

# 2 papel
t2 = tela("papel", '''
  <h2>A gratuidade está na <em>Constituição</em></h2>
  <div class="cit"><p>São gratuitas as ações de habeas corpus e habeas data e, na forma da lei, os atos necessários ao exercício da cidadania.</p></div>
  <span class="chip papel-chip">Constituição Federal, art. 5º, LXXVII</span>
''', LOGO_N)

# 3 navy
t3 = tela("navy", '''
  <h2>A Constituição remete à <em>lei</em></h2>
  <p class="corpo esq">Cabe à lei dizer quais atos são necessários ao exercício da cidadania. A Lei nº 9.265/1996 regulamenta o inciso LXXVII e enumera esses atos.</p>
  <div class="cards3"><div>Constituição, art. 5º, LXXVII</div><div>Lei nº 9.265/1996, art. 1º</div><div>Lista de atos gratuitos</div></div>
''')

# 4 papel · participação
t4 = tela("passo papel", '''
  <h2>Atos de <em>participação</em></h2>
  <div class="rows">
    ''' + item("Atos que capacitam o cidadão ao exercício da soberania popular, prevista no art. 14 da Constituição.", "Lei 9.265, art. 1º, I") + item("Alistamento militar.", "art. 1º, II") + item("Ações de impugnação de mandato eletivo por abuso do poder econômico, corrupção ou fraude.", "art. 1º, IV") + '''
  </div>
''', LOGO_N, '<div class="num">1</div>' + trilho(0))

# 5 navy · informação e defesa
t5 = tela("passo navy", '''
  <h2>Atos de <em>informação e defesa</em></h2>
  <div class="rows">
    ''' + item("Pedidos de informações ao poder público, em todos os âmbitos, para instruir defesa ou denunciar irregularidades administrativas.", "Lei 9.265, art. 1º, III") + item("Requerimentos ou petições que visem às garantias individuais e à defesa do interesse público.", "art. 1º, V") + '''
  </div>
''', LOGO_B, '<div class="num">2</div>' + trilho(1))

# 6 papel · documentos
t6 = tela("passo papel", '''
  <h2>Documentos da <em>vida civil</em></h2>
  <div class="rows">
    ''' + item("Registro civil de nascimento e assento de óbito, bem como a primeira certidão respectiva.", "Lei 9.265, art. 1º, VI (Lei 9.534/1997)") + item("Requerimento e emissão de documento de identificação específico, ou segunda via, para pessoa com transtorno do espectro autista.", "art. 1º, VII (Lei 13.977/2020)") + '''
  </div>
''', LOGO_N, '<div class="num">3</div>' + trilho(2))

# 7 steel · linha do tempo
t7 = tela("steel", '''
  <h2>A lista <em>cresceu</em> com o tempo</h2>
  <p class="corpo esq">A gratuidade alcança os atos que a lei enumera, e a enumeração foi ampliada por leis posteriores. Antes de pagar por um ato, confirme na norma e no órgão.</p>
  <div class="tl"><div class="no"><b>1996</b><span>Lei 9.265</span></div><div class="no"><b>1997</b><span>Lei 9.534</span></div><div class="no"><b>2020</b><span>Lei 13.977</span></div></div>
''')

# 8 CTA
t8 = tela("ink", f'''
  <div class="simb">{SIMB}</div>
  <h2 class="cta">Você já precisou de um <em>desses atos?</em></h2>
  <p class="corpo esq">Conte nos comentários. Na próxima quinzena: ação popular.</p>
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
.r p{{font-weight:300;font-size:42px;line-height:1.36;text-align:left}}
.r small{{display:block;margin-top:12px;font-weight:500;font-size:22px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold)}}
.papel .r small{{color:var(--bronze)}}
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
/* 7 tl */
.tl{{display:flex;justify-content:space-between;position:relative;margin-top:60px}}
.tl::before{{content:"";position:absolute;left:30px;right:30px;top:22px;height:3px;background:rgba(209,211,212,.4)}}
.no{{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;background:var(--steel);padding:0 18px}}
.no::before{{content:"";width:44px;height:44px;border-radius:50%;background:var(--gold);margin-bottom:6px}}
.no b{{font-weight:900;font-size:46px}} .no span{{font-weight:400;font-size:26px;color:var(--silver)}}
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
html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cidadania em Prática 02</title><style>{CSS}</style></head><body>{t1}{t2}{t3}{t4}{t5}{t6}{t7}{t8}</body></html>'
(OUT / "carrossel.html").write_text(html)
print("carrossel.html gerado")
