#!/usr/bin/env python3
"""Carrossel Outubro Rosa (19/10): câncer de mama, números e prazos legais · 8 telas 1080x1440."""
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


def tela(cls, corpo, logo=LOGO_B, extra=""):
    return f'<section class="s {cls}">{extra}<div class="conteudo">{corpo}</div><div class="logo">{logo}</div></section>'


def fonte(t):
    return f'<p class="fonte">{t}</p>'


# 1 capa
t1 = tela("navy capa", '''
  <div class="eyebrow">19 de outubro · Câncer de mama</div>
  <div class="gigante">78.610</div>
  <h1>novos casos de câncer de mama <em>por ano</em> no Brasil</h1>
  <p class="sub">Estimativa do INCA para 2026 a 2028. Os números, os prazos que a lei fixa e a distância entre os dois.</p>
  <div class="deslize">Deslize <i>→</i></div>
''', LOGO_B, '<div class="num">19</div>')

# 2 panorama
t2 = tela("papel", f'''
  <div class="eyebrow">O panorama</div>
  <h2>Mais incidente entre as mulheres, <em>salvo o câncer de pele</em></h2>
  <div class="stats">
    <div><b>71,57</b><span>casos estimados por 100 mil mulheres, em cada ano de 2026 a 2028</span></div>
    <div><b>18.139</b><span>óbitos por câncer de mama em 2021, taxa ajustada de 11,71 por 100 mil mulheres</span></div>
    <div><b>45%</b><span>das mortes ocorrem entre os 50 e os 69 anos</span></div>
  </div>
  {fonte("Fonte: INCA, Estimativa 2026-2028 e Atlas de Mortalidade por Câncer.")}
''', LOGO_N)

# 3 regiões
reg = [("Sudeste", 88.29), ("Sul", 77.91), ("Centro-Oeste", 61.32), ("Nordeste", 58.02), ("Norte", 31.28)]
barras = "".join(
    f'<div class="br"><span class="n">{n}</span><div class="tr"><i style="width:{v / 88.29 * 100:.1f}%"></i></div><b>{str(v).replace(".", ",")}</b></div>'
    for n, v in reg)
t3 = tela("navy", f'''
  <div class="eyebrow">Por região</div>
  <h2>O risco estimado <em>muda de região para região</em></h2>
  <p class="corpo">Casos estimados por 100 mil mulheres, por ano.</p>
  <div class="barras">{barras}</div>
  {fonte("Fonte: INCA, Estimativa 2026-2028.")}
''', LOGO_B)

# 4 a lei
t4 = tela("papel", f'''
  <div class="eyebrow">O que a lei fixa</div>
  <h2>Dois prazos, <em>duas leis</em></h2>
  <div class="dois">
    <div><b>30</b><u>dias</u><h3>Exames de confirmação</h3><p>Quando a principal hipótese é de neoplasia maligna, a contar do pedido médico fundamentado.</p><small>Lei 13.896/2019</small></div>
    <div><b>60</b><u>dias</u><h3>Primeiro tratamento</h3><p>Cirurgia, radioterapia ou quimioterapia, a contar do registro do diagnóstico no prontuário.</p><small>Lei 12.732/2012</small></div>
  </div>
  {fonte("Aplicam-se a pacientes atendidas pelo SUS.")}
''', LOGO_N)

# 5 prática
t5 = tela("navy", f'''
  <div class="eyebrow">O que a prática mostra</div>
  <h2>O cumprimento do prazo de 60 dias <em>variou muito</em></h2>
  <div class="escala">
    <div class="rot"><span>0%</span><span>100%</span></div>
    <div class="trilha"><i style="left:49.4%;width:33.7%"></i><s style="left:49.4%"></s><s style="left:83.1%"></s></div>
    <div class="vals"><b style="left:49.4%">49,4%</b><b style="left:83.1%">83,1%</b></div>
  </div>
  <p class="corpo">Entre 2013 e 2019, o percentual de pacientes que começaram o tratamento em até 60 dias oscilou entre esses dois valores.</p>
  <div class="nota"><b>43 dias</b><span>foi a mediana entre o diagnóstico e o início do tratamento nos registros hospitalares de 2000 a 2012, com variação de 0 a 182 dias.</span></div>
  {fonte("Fonte: INCA e Registros Hospitalares de Câncer.")}
''', LOGO_B)

# 6 estágio
t6 = tela("papel", f'''
  <div class="eyebrow">O estágio do diagnóstico</div>
  <h2>Diagnósticos em estágio III ou IV <em>cresceram na pandemia</em></h2>
  <div class="cols">
    <div class="col"><div class="bar" style="height:{40.8 / 51.5 * 100:.1f}%"><b>40,8%</b></div><span>Antes da pandemia</span></div>
    <div class="col"><div class="bar b2" style="height:100%"><b>51,5%</b></div><span>2020 e 2021</span></div>
  </div>
  <p class="corpo">Alta de cerca de 26%. A queda no número de mamografias feitas pelo SUS está entre os fatores apontados.</p>
  {fonte("Fonte: Sociedade Brasileira de Mastologia, com dados do DataSUS.")}
''', LOGO_N)

# 7 outros direitos
t7 = tela("ink", f'''
  <div class="eyebrow">Outros direitos previstos</div>
  <h2>Além do prazo, <em>a lei prevê</em></h2>
  <div class="lista">
    <div><b>01</b><div><h3>Reconstrução mamária</h3><p>No mesmo tempo cirúrgico, quando houver condição técnica. Leis 12.802/2013 e 9.797/1999.</p></div></div>
    <div><b>02</b><div><h3>Mamografia a partir dos 40 anos</h3><p>Garantida pelo SUS, com indicação médica. Lei 11.664/2008.</p></div></div>
  </div>
  <div class="nota"><b>menos de 10%</b><span>das pacientes mastectomizadas têm acesso à reconstrução imediata pelo SUS, segundo o INCA.</span></div>
''', LOGO_B)

# 8 fecho
t8 = tela("navy cta", f'''
  <div class="simb">{SIMB}</div>
  <h2>Defendemos o direito que <em>chega a tempo.</em></h2>
  <p class="corpo">Conteúdo informativo, sem orientação a caso individual. Em caso de suspeita, procure o serviço de saúde e a Defensoria Pública, se precisar de apoio jurídico.</p>
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
.logo{{position:absolute;left:0;right:0;bottom:80px;display:flex;justify-content:center}}
.logo svg{{height:54px;width:auto}}
em{{font-style:normal;color:var(--gold)}} .papel em{{color:var(--bronze)}}
.eyebrow{{font-weight:500;font-size:26px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:26px}}
.papel .eyebrow{{color:var(--bronze)}}
h2{{font-weight:900;font-size:68px;line-height:1.06;letter-spacing:-.03em;margin-bottom:38px}}
.papel h2{{color:var(--navy)}}
.corpo{{font-weight:300;font-size:36px;line-height:1.45}}
.papel .corpo{{color:var(--graphite)}}
.fonte{{margin-top:34px;font-weight:300;font-size:24px;line-height:1.35;color:var(--silver);opacity:.85}}
.papel .fonte{{color:var(--graphite);opacity:.8}}
/* capa */
.capa .conteudo{{justify-content:center}}
.gigante{{font-weight:900;font-size:250px;line-height:.95;letter-spacing:-.045em;color:var(--gold)}}
.capa h1{{font-weight:900;font-size:62px;line-height:1.08;letter-spacing:-.025em;margin-top:18px}}
.sub{{font-weight:300;font-size:34px;line-height:1.4;color:var(--silver);margin-top:34px}}
.deslize{{align-self:flex-start;margin-top:44px;background:var(--gold);color:var(--ink);font-weight:700;font-size:26px;letter-spacing:.12em;text-transform:uppercase;padding:18px 34px;border-radius:4px}}
.deslize i{{font-style:normal;margin-left:10px}}
.num{{position:absolute;right:-50px;bottom:140px;font-weight:900;font-size:520px;line-height:1;color:transparent;-webkit-text-stroke:3px rgba(209,211,212,.12);letter-spacing:-.04em;z-index:1}}
/* stats */
.stats div{{padding:26px 0;border-top:2px solid rgba(48,69,87,.28);display:flex;flex-direction:column;gap:6px}}
.stats div:last-child{{border-bottom:2px solid rgba(48,69,87,.28)}}
.stats b{{font-weight:900;font-size:96px;line-height:1;letter-spacing:-.03em;color:var(--bronze)}}
.stats span{{font-weight:300;font-size:33px;line-height:1.35;color:var(--graphite)}}
/* barras */
.barras{{margin-top:34px;display:flex;flex-direction:column;gap:30px}}
.br{{display:grid;grid-template-columns:230px 1fr 110px;align-items:center;gap:18px}}
.br .n{{font-weight:500;font-size:32px}}
.br .tr{{height:46px;background:rgba(209,211,212,.12)}}
.br .tr i{{display:block;height:100%;background:var(--gold)}}
.br b{{font-weight:900;font-size:38px;text-align:right}}
/* dois prazos */
.dois{{display:grid;grid-template-columns:1fr 1fr;gap:26px}}
.dois>div{{background:rgba(3,28,55,.06);border-top:6px solid var(--bronze);padding:36px 30px}}
.dois b{{font-weight:900;font-size:170px;line-height:.9;letter-spacing:-.04em;color:var(--navy)}}
.dois u{{text-decoration:none;font-weight:500;font-size:30px;letter-spacing:.14em;text-transform:uppercase;color:var(--bronze);margin-left:12px}}
.dois h3{{font-weight:900;font-size:38px;color:var(--navy);margin:22px 0 12px;line-height:1.1}}
.dois p{{font-weight:300;font-size:31px;line-height:1.4}}
.dois small{{display:block;margin-top:22px;font-weight:700;font-size:26px;letter-spacing:.08em;text-transform:uppercase;color:var(--bronze)}}
/* escala */
.escala{{position:relative;margin:10px 0 24px;height:210px}}
.rot{{display:flex;justify-content:space-between;font-weight:300;font-size:26px;color:var(--silver)}}
.trilha{{position:relative;height:30px;background:rgba(209,211,212,.16);margin-top:14px}}
.trilha i{{position:absolute;top:0;height:100%;background:var(--gold)}}
.trilha s{{position:absolute;top:-20px;width:4px;height:70px;background:#fff}}
.vals{{position:relative;height:70px;margin-top:62px}}
.vals b{{position:absolute;transform:translateX(-50%);font-weight:900;font-size:62px;color:var(--gold)}}
.nota{{margin-top:36px;border-left:6px solid var(--gold);padding-left:28px;display:flex;flex-direction:column;gap:8px}}
.nota b{{font-weight:900;font-size:88px;line-height:1;letter-spacing:-.03em;color:var(--gold)}}
.nota span{{font-weight:300;font-size:32px;line-height:1.4}}
/* colunas */
.cols{{display:flex;gap:60px;align-items:flex-end;height:420px;margin:6px 0 34px;padding:0 20px;border-bottom:3px solid rgba(48,69,87,.4)}}
.col{{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:stretch;position:relative}}
.col .bar{{background:var(--steel);display:flex;align-items:flex-start;justify-content:center;padding-top:20px}}
.col .bar.b2{{background:var(--navy)}}
.col .bar b{{font-weight:900;font-size:76px;color:#fff;letter-spacing:-.03em}}
.col span{{position:absolute;bottom:-62px;left:0;right:0;text-align:center;font-weight:500;font-size:30px;color:var(--navy)}}
.cols+.corpo{{margin-top:78px;font-size:34px}}
/* lista */
.lista>div{{display:flex;gap:34px;padding:36px 0;border-top:2px solid rgba(209,211,212,.25)}}
.lista>div:last-child{{border-bottom:2px solid rgba(209,211,212,.25)}}
.lista b{{font-weight:900;font-size:76px;line-height:.9;color:var(--gold);min-width:100px}}
.lista h3{{font-weight:900;font-size:42px;line-height:1.1;margin-bottom:10px}}
.lista p{{font-weight:300;font-size:32px;line-height:1.4;color:var(--silver)}}
/* fecho */
.cta .conteudo{{justify-content:center}}
.cta .simb{{width:130px;margin-bottom:50px}}
.cta h2{{font-size:96px}}
.cta .corpo{{color:var(--silver);font-size:34px}}
.assin{{margin-top:56px;border-top:2px solid rgba(209,211,212,.25);padding-top:26px;display:flex;flex-direction:column;gap:8px}}
.assin b{{font-weight:900;font-size:34px}} .assin span{{font-weight:300;font-size:28px;color:var(--silver)}}
'''

html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Outubro Rosa · câncer de mama e prazos legais</title><style>{CSS}</style></head><body>{t1}{t2}{t3}{t4}{t5}{t6}{t7}{t8}</body></html>'
(OUT / "carrossel.html").write_text(html)
print("carrossel.html gerado")
