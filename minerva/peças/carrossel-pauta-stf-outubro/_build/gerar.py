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
    nomes = ["7 e 8", "14 e 15", "21 e 22", "28 e 29"]
    pts = ""
    for i, n in enumerate(nomes):
        cls = "on" if i == ativo else ("ok" if i < ativo else "")
        pts += f'<div class="pt {cls}"><i></i><span>{n}</span></div>'
    return f'<div class="trilho"><div class="fio-t"></div>{pts}</div>'


def tela(cls, corpo, logo=LOGO_B, extra=""):
    return f'<section class="s {cls}">{extra}<div class="conteudo">{corpo}</div><div class="logo">{logo}</div></section>'


def item(titulo, txt, ref):
    return f'<div class="r"><b>{titulo}</b><p>{txt}</p><small>{ref}</small></div>'


# 1 capa: calendário de 4 semanas x quarta e quinta
cal = '<svg class="folha" viewBox="0 0 300 380"><rect x="14" y="14" width="272" height="352" rx="8" fill="none" stroke="#f0b855" stroke-width="5"/>'
for r in range(4):
    for c in range(2):
        x = 46 + c * 112; y = 52 + r * 76
        cal += f'<rect x="{x}" y="{y}" width="92" height="56" rx="4" fill="{"#f0b855" if c == 0 else "none"}" stroke="#f0b855" stroke-width="4"/>'
cal += '</svg>'
t1 = tela("navy", f'''
  {cal}
  <h1 class="h-capa"><span class="l">O que o STF julga em</span><br><em>outubro</em></h1>
  <p class="sub">Quatro semanas de pauta no Plenário, de tributos a dados sigilosos.</p>
  <div class="chips"><span class="chip">Pauta do Plenário</span><span class="seta">Deslize para ver semana a semana</span></div>
''')

# 2 semana 1
t2 = tela("passo papel", '''
  <h2>Tributos e <em>depósitos judiciais</em></h2>
  <div class="rows">
    ''' + item("Créditos presumidos de ICMS no PIS/Cofins", "Se esse benefício estadual entra na base de cálculo das contribuições. Os processos sobre o tema estão suspensos em todo o país.", "RE 835.818 · Tema 843") + item("Expurgos inflacionários em depósitos judiciais", "Se podem entrar na correção monetária dos depósitos.", "RE 1.141.156 · Tema 1.016") + '''
  </div>
''', LOGO_N, '<div class="num">7</div>' + trilho(0))

# 3 semana 2
t3 = tela("passo navy", '''
  <h2>Aplicativo, campo e <em>imprensa</em></h2>
  <div class="rows">
    ''' + item("Caso Buser", "Lei mineira exige \"circuito fechado\" no fretamento: a lista de passageiros da ida deve ser a mesma da volta.", "RE 1.506.410") + item("Funrural", "Conclusão do julgamento e parâmetros da sub-rogação na cobrança.", "ADI 4.395") + item("Liberdade de imprensa", "Reclamação contra condenação de emissora por reportagem sobre prisão.", "Rcl 78.354") + '''
  </div>
''', LOGO_B, '<div class="num">14</div>' + trilho(1))

# 4 semana 3
t4 = tela("passo papel", '''
  <h2>Autonomia do paciente e <em>dados sigilosos</em></h2>
  <div class="rows">
    ''' + item("Recusa a tratamento médico", "O direito de adulto capaz recusar tratamento, inclusive com risco de morte, e a validade de normas que admitem intervenção sem consentimento.", "ADPF 642 e ADPF 618") + item("Acesso a dados em investigações", "Quando polícia e Ministério Público precisam de autorização judicial, no Marco Civil da Internet e nos poderes dos delegados.", "ADC 91 · ADI 5.059 · ADI 5.073") + '''
  </div>
''', LOGO_N, '<div class="num">21</div>' + trilho(2))

# 5 semana 4
t5 = tela("passo navy", '''
  <h2>A Reforma da Previdência e os <em>servidores</em></h2>
  <div class="rows">
    ''' + item("Alíquotas progressivas", "Se a contribuição progressiva dos servidores federais, nos moldes da Emenda 103/2019, é constitucional.", "RE 1.384.562 · Tema 1.226") + item("Doenças graves e incapacitantes", "A revogação da isenção parcial da contribuição sobre proventos de servidores nessa condição.", "ADI 6.336") + '''
  </div>
''', LOGO_B, '<div class="num">28</div>' + trilho(3))

# 6 onde destrava
t6 = tela("steel", '''
  <h2>Onde a decisão <em>destrava processos</em></h2>
  <p class="corpo esq">Dois julgamentos do mês mantêm ações suspensas até a decisão do Supremo.</p>
  <div class="cards3"><div>PIS/Cofins sobre créditos presumidos de ICMS: processos suspensos em todo o país</div><div>Funrural: suspensão por determinação do relator, ministro Gilmar Mendes, até a definição da sub-rogação</div></div>
''')

# 7 a pauta pode mudar
t7 = tela("papel", '''
  <h2>A pauta <em>pode mudar</em></h2>
  <p class="corpo esq">O calendário inicial cobre as quartas-feiras. As quintas ficam reservadas para processos remanescentes, e pedidos de vista ou de destaque alteram a ordem. Confira a pauta no site do STF antes de planejar uma sustentação ou uma petição.</p>
  <div class="cards3"><div>Quarta: pauta divulgada</div><div>Quinta: processos remanescentes</div></div>
''', LOGO_N)

# 8 CTA
t8 = tela("ink", f'''
  <div class="simb">{SIMB}</div>
  <h2 class="cta">Qual julgamento você vai <em>acompanhar?</em></h2>
  <p class="corpo esq">Conte nos comentários. Salve para consultar a pauta durante o mês.</p>
  <div class="pill">Salve e compartilhe</div>
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
.passo h2{{font-size:68px;margin-bottom:28px}}
.passo .corpo{{font-size:44px}}
.num{{position:absolute;right:-30px;top:20px;font-weight:900;font-size:640px;line-height:1;color:transparent;-webkit-text-stroke:3px rgba(209,211,212,.18)}}
.papel .passo .conteudo{{bottom:350px}}
.passo h2{{font-size:68px;margin-bottom:28px}}
.passo .corpo{{font-size:44px}}
.num{{-webkit-text-stroke:3px rgba(155,107,38,.28)}}
.rows{{display:flex;flex-direction:column}}
.r{{padding:24px 0;border-top:2px solid rgba(209,211,212,.28)}}
.r:last-child{{border-bottom:2px solid rgba(209,211,212,.28)}}
.papel .r{{border-color:rgba(48,69,87,.25)}}
.r b{{display:block;font-weight:900;font-size:43px;letter-spacing:-.01em;margin-bottom:10px}}
.papel .r b{{color:var(--navy)}}
.r p{{font-weight:300;font-size:37px;line-height:1.36;text-align:left}}
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
html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cidadania em Prática 01</title><style>{CSS}</style></head><body>{t1}{t2}{t3}{t4}{t5}{t6}{t7}{t8}</body></html>'
(OUT / "carrossel.html").write_text(html)
print("carrossel.html gerado")
html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Pauta do STF em outubro</title><style>{CSS}</style></head><body>{t1}{t2}{t3}{t4}{t5}{t6}{t7}{t8}</body></html>'
(OUT / "carrossel.html").write_text(html)
print("carrossel.html gerado")
