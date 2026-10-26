#!/usr/bin/env python3
"""Carrossel do artigo 'Centros de Inteligência do Judiciário e o enfrentamento das demandas repetitivas' · 10 telas 1080x1440."""
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


def foto(nome):
    return f'<div class="foto" style="background-image:url(\'{FOTOS}/{nome}\')"></div><div class="scrim"></div>'


# 1 capa (foto)
t1 = tela("navy fotot", '''
  <div class="sel"><i></i><div><small>Artigo de</small><b>Dra. Rossana Fonseca</b><span>Coluna jurídica EJUP</span></div></div>
  <h1><span class="l">Por que o mesmo conflito</span><br><em>volta aos tribunais</em><br><span class="l">milhares de vezes?</span></h1>
  <p class="sub">Os Centros de Inteligência do Judiciário e as demandas repetitivas</p>
  <div class="deslize">Deslize para entender <i>→</i></div>
''', LOGO_B, foto("capa.jpg"))

# 2 papel: a cena
t2 = tela("papel", '''
  <h2>A cena que quem advoga <em>conhece bem</em></h2>
  <p class="corpo">O mesmo conflito, nascido da mesma causa, chega aos tribunais em milhares de processos praticamente idênticos.</p>
  <div class="num-l">
    <div><b>1</b><span>Uma cobrança indevida replicada em escala</span></div>
    <div><b>2</b><span>Uma norma que admite duas leituras</span></div>
    <div><b>3</b><span>Um contrato-padrão com uma cláusula mal resolvida</span></div>
  </div>
''', LOGO_N)

# 3 navy: dispositivo causa -> processos
t3 = tela("navy", '''
  <h2>Julgar caso a caso <em>deixa intacta a causa</em></h2>
  <p class="corpo">O Judiciário incluiu a gestão de demandas repetitivas e de grandes litigantes entre os macrodesafios da Estratégia Nacional 2021-2026.</p>
  <div class="fluxo">
    <div class="no a"><i></i><b>A causa</b><span>prática, norma ou contrato</span><em class="tag">Centros de Inteligência</em></div>
    <div class="no"><i></i><b>O conflito se repete</b><span>mesma origem</span></div>
    <div class="no c"><i></i><b>Milhares de processos</b><span>mesma questão</span><em class="tag t2">Julgamento individual</em></div>
  </div>
''', LOGO_B)

# 4 navy: o que é
t4 = tela("ink", '''
  <h2>Uma estrutura que <em>estuda por que o conflito se repete</em></h2>
  <p class="corpo">Instalada dentro de um tribunal ou de um conselho, monitora a litigiosidade e propõe o tratamento adequado para demandas estratégicas, repetitivas e de massa.</p>
  <div class="rede">
    <div class="topo">CIPJ · junto ao Conselho Nacional de Justiça</div>
    <div class="ramos"><div>Centros locais dos tribunais</div><div>Centro Nacional da Justiça Federal</div><div>Centro Nacional da Justiça do Trabalho</div></div>
  </div>
''', LOGO_B)

# 5 papel: nota técnica
t5 = tela("papel", '''
  <h2>O produto é a <em>nota técnica</em></h2>
  <div class="num-l">
    <div><b>1</b><span>Identifica a causa do litígio</span></div>
    <div><b>2</b><span>Propõe a solução na origem, por autocomposição ou encaminhamento administrativo</span></div>
    <div><b>3</b><span>Acompanha os resultados</span></div>
  </div>
  <p class="corpo fecha">A nota técnica reúne estudos e recomendações. Ela orienta, e o julgamento de cada caso continua com o juiz.</p>
''', LOGO_N)

# 6 navy: linha do tempo
t6 = tela("navy", '''
  <h2>Do foro federal ao <em>Judiciário inteiro</em></h2>
  <div class="tl">
    <div class="p"><b>2015</b><span>A Justiça Federal no Rio Grande do Norte cria a Comissão de Prevenção de Demandas, depois Centro Local de Inteligência.</span></div>
    <div class="p"><b>2017</b><span>Portaria CJF nº 369 cria o Centro Nacional e os Centros Locais da Justiça Federal.</span></div>
    <div class="p"><b>2018</b><span>Resolução CJF nº 499 consolida a estrutura.</span></div>
    <div class="p"><b>2020</b><span>Resolução CNJ nº 349 institui o CIPJ e a rede de Centros de Inteligência.</span></div>
  </div>
''', LOGO_B)

# 7 papel: comparação
t7 = tela("papel", '''
  <h2>Centro, IRDR ou repetitivos: <em>cada um atua num momento</em></h2>
  <div class="cmp">
    <div><b>Centro de Inteligência</b><span>Foco na causa. Atua antes ou durante a multiplicação dos conflitos e produz nota técnica.</span></div>
    <div><b>IRDR · art. 976 do CPC</b><span>Uniformiza a questão nos tribunais de segundo grau, com a controvérsia já espalhada, e produz tese jurídica.</span></div>
    <div><b>Recursos repetitivos · a partir do art. 1.036</b><span>Uniformizam nos tribunais superiores e produzem precedente qualificado.</span></div>
  </div>
  <p class="corpo fecha">Os caminhos se complementam.</p>
''', LOGO_N)

# 8 navy: revisão
t8 = tela("navy", '''
  <h2>O arcabouço está <em>em revisão</em></h2>
  <p class="corpo g">Em julho de 2026, a Portaria CNJ nº 333 instituiu um grupo de trabalho para estudar mudanças na Resolução 349 e aprimorar a rede. A revisão pretende reforçar a atuação dos centros na identificação de litigância abusiva. A proposta ainda passará por consulta pública, e até lá a Resolução 349/2020 segue como texto de referência.</p>
''', LOGO_B, '<div class="num">2026</div>')

# 9 papel: advocacia
t9 = tela("papel", '''
  <h2>O que muda para <em>quem advoga</em></h2>
  <div class="grade">
    <div><b>Diagnóstico</b><span>Verificar se a controvérsia do cliente integra um grupo de demandas repetitivas e se o tribunal já estudou uma solução.</span></div>
    <div><b>Argumentação</b><span>Conhecer o estudo que o próprio tribunal produziu qualifica a petição.</span></div>
    <div><b>Prevenção</b><span>Quando a origem está numa prática da organização, o trabalho consultivo reduz processos e risco jurídico.</span></div>
    <div><b>Acompanhamento</b><span>A revisão da Resolução 349 está em curso no CNJ.</span></div>
  </div>
''', LOGO_N)

# 10 CTA
t10 = tela("navy fotot cta", f'''
  <div class="simb">{SIMB}</div>
  <h2>Leia o artigo <em>completo</em></h2>
  <p class="corpo">O tema também foi conversa no EJUPcast #019, com o juiz federal Marco Bruno Miranda Clementino.</p>
  <div class="botao">Link na bio</div>
  <div class="assin"><b>Alma clássica, <em>repertório contemporâneo.</em></b><span>@ejup.oficial</span></div>
''', LOGO_B, foto("fecho.jpg"))

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
.conteudo{{position:absolute;left:96px;right:96px;top:100px;bottom:230px;display:flex;flex-direction:column;justify-content:center}}
.logo{{position:absolute;left:0;right:0;bottom:80px;display:flex;justify-content:center}}
.logo svg{{height:54px;width:auto}}
em{{font-style:normal;color:var(--gold)}} .papel em{{color:var(--bronze)}}
h2{{font-weight:900;font-size:80px;line-height:1.05;letter-spacing:-.03em;margin-bottom:40px;position:relative}}
.papel h2{{color:var(--navy)}}
.corpo{{font-weight:300;font-size:40px;line-height:1.5;text-align:justify;text-align-last:left;hyphens:auto;position:relative}}
.papel .corpo{{color:var(--graphite)}}
.corpo.fecha{{margin-top:36px;font-weight:400}}
/* foto */
.foto{{position:absolute;inset:0;background-size:cover;background-position:center}}
.scrim{{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(3,28,55,0) 30%,rgba(3,28,55,.78) 60%,#031c37 86%)}}
.fotot:not(.cta) .scrim{{background:linear-gradient(to bottom,rgba(3,28,55,0) 22%,rgba(3,28,55,.82) 48%,#031c37 80%)}}
.fotot .conteudo{{justify-content:flex-end;top:100px}}
.fotot h1{{font-weight:900;font-size:92px;line-height:1.03;letter-spacing:-.03em}}
.fotot h1 .l{{font-weight:300;letter-spacing:-.01em;font-size:66px}}
.sel{{position:absolute;left:0;top:10px;display:flex;gap:30px;align-items:stretch}}
.sel i{{width:5px;background:var(--gold)}}
.sel div{{display:flex;flex-direction:column;gap:8px}}
.sel small{{font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}}
.sel b{{font-weight:900;font-size:60px;letter-spacing:-.02em;line-height:1}}
.sel span{{font-weight:300;font-size:30px;color:var(--silver)}}
.fotot:not(.cta)::after{{content:"";position:absolute;left:0;right:0;top:0;height:460px;background:linear-gradient(to bottom,rgba(3,28,55,.9),rgba(3,28,55,0));pointer-events:none}}
.fotot .conteudo{{z-index:2}}
.eyebrow{{margin-top:38px;font-weight:500;font-size:26px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}}
.eyebrow span{{display:block;margin-top:8px;font-weight:300;font-size:30px;letter-spacing:0;text-transform:none;color:var(--silver)}}
.sub{{font-weight:300;font-size:38px;line-height:1.35;color:var(--silver);margin-top:34px}}
.deslize{{align-self:flex-start;margin-top:40px;background:var(--gold);color:var(--ink);font-weight:700;font-size:26px;letter-spacing:.12em;text-transform:uppercase;padding:18px 34px;border-radius:4px}}
.deslize i{{font-style:normal;margin-left:10px}}
/* lista numerada */
.num-l{{margin-top:30px}}
.num-l div{{display:flex;gap:34px;align-items:baseline;padding:44px 0;border-top:2px solid rgba(48,69,87,.28)}}
.num-l div:last-child{{border-bottom:2px solid rgba(48,69,87,.28)}}
.num-l b{{font-weight:900;font-size:76px;line-height:.9;color:var(--bronze);min-width:56px}}
.num-l span{{font-weight:500;font-size:44px;line-height:1.3;color:var(--navy)}}
/* fluxo causa -> processos */
.fluxo{{margin-top:40px;display:flex;flex-direction:column;gap:0;position:relative}}
.no{{position:relative;padding:0 0 64px 62px;border-left:4px solid rgba(209,211,212,.35);margin-left:14px}}
.no:last-child{{border-left-color:transparent;padding-bottom:0}}
.no i{{position:absolute;left:-20px;top:2px;width:36px;height:36px;border-radius:50%;background:var(--navy);border:4px solid var(--silver)}}
.no.a i{{background:var(--gold);border-color:var(--gold)}}
.no b{{display:block;font-weight:900;font-size:50px}} .no span{{display:block;font-weight:300;font-size:34px;color:var(--silver);margin-top:4px}}
.tag{{display:inline-block;margin-top:12px;font-style:normal;background:var(--gold);color:var(--ink);font-weight:700;font-size:22px;letter-spacing:.12em;text-transform:uppercase;padding:10px 20px;border-radius:4px}}
.tag.t2{{background:transparent;color:var(--silver);border:2px solid rgba(209,211,212,.5)}}
/* rede */
.rede{{margin-top:70px}}
.topo{{background:var(--gold);color:var(--ink);font-weight:700;font-size:32px;letter-spacing:.06em;text-transform:uppercase;padding:40px 28px;text-align:center;border-radius:4px}}
.ramos{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px;position:relative}}
.ramos::before{{content:"";position:absolute;left:16.6%;right:16.6%;top:-30px;height:30px;border:3px solid rgba(209,211,212,.5);border-bottom:none}}
.ramos div{{border:2px solid rgba(209,211,212,.4);padding:48px 18px;font-weight:500;font-size:32px;line-height:1.25;text-align:center}}
/* timeline */
.tl{{margin-top:6px;position:relative}}
.tl .p{{position:relative;padding:0 0 34px 46px;border-left:4px solid rgba(209,211,212,.3);margin-left:10px}}
.tl .p:last-child{{border-left-color:transparent;padding-bottom:0}}
.tl .p::before{{content:"";position:absolute;left:-14px;top:8px;width:24px;height:24px;border-radius:50%;background:var(--gold)}}
.tl b{{display:block;font-weight:900;font-size:56px;color:var(--gold);line-height:1}}
.tl span{{display:block;font-weight:300;font-size:36px;line-height:1.38;margin-top:8px}}
/* comparação */
.cmp div{{padding:26px 0;border-top:2px solid rgba(48,69,87,.28)}}
.cmp div:last-child{{border-bottom:2px solid rgba(48,69,87,.28)}}
.cmp b{{display:block;font-weight:900;font-size:40px;color:var(--navy);margin-bottom:8px}}
.cmp span{{display:block;font-weight:300;font-size:36px;line-height:1.38}}
.cmp div{{padding:34px 0!important}}
/* revisão */
.num{{position:absolute;right:-40px;top:70px;font-weight:900;font-size:360px;line-height:1;color:transparent;-webkit-text-stroke:3px rgba(209,211,212,.16);letter-spacing:-.04em}}
.corpo.g{{font-size:46px;line-height:1.5;text-align:left}}
/* grade */
.grade{{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:6px}}
.grade div{{background:rgba(3,28,55,.06);border-top:6px solid var(--bronze);padding:28px 26px}}
.grade b{{display:block;font-weight:900;font-size:44px;color:var(--navy);margin-bottom:12px}}
.grade span{{display:block;font-weight:300;font-size:31px;line-height:1.4}}
/* CTA */
.cta .conteudo{{justify-content:flex-end}}
.cta .corpo{{text-align:left}}
.cta .simb{{width:120px;margin-bottom:46px}}
.botao{{align-self:flex-start;margin-top:44px;background:var(--gold);color:var(--ink);font-weight:700;font-size:30px;letter-spacing:.12em;text-transform:uppercase;padding:22px 40px;border-radius:4px}}
.assin{{margin-top:50px;border-top:2px solid rgba(209,211,212,.25);padding-top:26px;display:flex;flex-direction:column;gap:8px}}
.assin b{{font-weight:900;font-size:34px;letter-spacing:-.01em}} .assin span{{font-weight:300;font-size:28px;color:var(--silver)}}
'''

html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Centros de Inteligência · carrossel do artigo</title><style>{CSS}</style></head><body>{t1}{t2}{t3}{t4}{t5}{t6}{t7}{t8}{t9}{t10}</body></html>'
(OUT / "carrossel.html").write_text(html)
print("carrossel.html gerado")
