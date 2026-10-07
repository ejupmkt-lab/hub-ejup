#!/usr/bin/env python3
"""Carrossel '5 julgamentos do STF para acompanhar em outubro' · 8 telas 1080x1440 · versão editorial."""
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


def tela(cls, corpo, logo=LOGO_B, extra=""):
    return f'<section class="s {cls}">{extra}<div class="conteudo">{corpo}</div><div class="logo">{logo}</div></section>'


def caso(cls, n, data, titulo, texto, ref, logo):
    corpo = (f'<h2>{titulo}</h2><p class="corpo">{texto}</p>'
             f'<div class="docket"><div><small>Quando</small><b>{data}</b></div><div><small>Processo</small><b>{ref}</b></div></div>')
    return tela("caso " + cls, corpo, logo, f'<div class="num">{n}</div>')


t1 = f'''<section class="s navy capa"><div class="foto" style="background-image:url('{FOTOS}/capa.jpg')"></div><div class="veu"></div>
<div class="conteudo"><div class="cinco">5</div>
<h1><b>julgamentos do STF</b><br><span class="l">para acompanhar em</span> <em>outubro</em></h1>
<div class="datas"><span>7 e 8</span><span>14 e 15</span><span>21 e 22</span><span>28 e 29</span></div></div>
<div class="logo">{LOGO_B}</div></section>'''

t2 = caso("ink", "1", "7 e 8 de outubro", "Crédito presumido de ICMS entra na base do <em>PIS/Cofins?</em>",
          "Em plenário virtual, a maioria de 6 a 5 afastava a tributação, mas o pedido de destaque levou o caso ao plenário físico. Os processos sobre o tema estão suspensos em todo o país até a decisão definitiva.",
          "RE 835.818 · Tema 843", LOGO_B)
t3 = caso("papel", "2", "14 e 15 de outubro", "Aplicativo de fretamento precisa de <em>circuito fechado?</em>",
          "A lei mineira exige a mesma lista de passageiros na ida e na volta, o que atinge plataformas como a Buser. A análise começou no plenário virtual e recomeça no plenário físico, após pedido de destaque do presidente.",
          "RE 1.506.410 · Caso Buser", LOGO_N)
t4 = caso("navy", "3", "21 e 22 de outubro", "Adulto capaz pode <em>recusar tratamento médico?</em>",
          "Em 2024, o STF reconheceu que Testemunhas de Jeová maiores e capazes podem recusar transfusão por motivo religioso. Agora analisa se o direito vale para qualquer adulto capaz. O relator votou por assegurá-lo, desde que a decisão seja livre, informada e esclarecida.",
          "ADPF 642 · ADPF 618", LOGO_B)
t5 = caso("steel", "4", "21 e 22 de outubro", "Quando a polícia precisa de ordem judicial para <em>acessar dados?</em>",
          "Na ADC 91, o relator, ministro Cristiano Zanin, votou para exigir autorização judicial, como regra, na identificação de usuários por dados de conexão, com exceção em extrema urgência. As ADIs discutem o poder de requisição dos delegados.",
          "ADC 91 · ADI 5.059 · ADI 5.073", LOGO_B)
t6 = caso("papel", "5", "28 e 29 de outubro", "Contribuição progressiva dos servidores é <em>constitucional?</em>",
          "Uma turma recursal federal do Rio Grande do Sul limitou a contribuição a 14%, por ver violação à isonomia e caráter confiscatório. A União sustenta que a progressividade prevista na Emenda 103/2019 é compatível com a Constituição.",
          "RE 1.384.562 · Tema 1.226", LOGO_N)

t7 = tela("navy", '''
  <h2 class="gr">A pauta <em>pode mudar</em></h2>
  <p class="corpo">O calendário inicial cobre as quartas-feiras, e as quintas ficam reservadas para processos remanescentes. Pedidos de vista e de destaque alteram a ordem. Confira no site do STF antes de planejar uma sustentação ou uma petição.</p>
  <div class="lista"><small>Também na pauta de outubro</small>
    <div>Funrural e a sub-rogação (ADI 4.395)</div><div>Liberdade de imprensa (Rcl 78.354)</div><div>Porte de arma de guardas municipais (ADI 7.717)</div><div>Insalubridade de terceirizados (ADPF 1.181)</div></div>
''', LOGO_B)

t8 = f'''<section class="s ink fecho"><div class="foto2" style="background-image:url('{FOTOS}/fecho.jpg')"></div><div class="veu2"></div>
<div class="conteudo"><h2 class="gr">Qual julgamento você vai <em>acompanhar?</em></h2>
<p class="corpo">Conte nos comentários. Salve para consultar a pauta durante o mês.</p>
<div class="botao">Salve e compartilhe</div>
<div class="assin"><b>Alma clássica, <em>repertório contemporâneo.</em></b><span>@ejup.oficial</span></div></div></section>'''

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
.conteudo{{position:absolute;left:96px;right:96px;top:100px;bottom:230px;display:flex;flex-direction:column;justify-content:center}}
.logo{{position:absolute;left:0;right:0;bottom:80px;display:flex;justify-content:center}}
.logo svg{{height:54px;width:auto}}
em{{font-style:normal;color:var(--gold)}} .papel em{{color:var(--bronze)}}
/* capa */
.capa .foto{{position:absolute;left:0;top:0;width:1080px;height:700px;background-size:cover;background-position:center}}
.capa .veu{{position:absolute;left:0;top:0;width:1080px;height:760px;background:linear-gradient(to bottom,rgba(3,28,55,0) 35%,#031c37 96%)}}
.capa .conteudo{{top:auto;bottom:230px;justify-content:flex-end;height:760px}}
.cinco{{font-weight:900;font-size:300px;line-height:.8;letter-spacing:-.05em;color:var(--gold);margin:0 0 26px -10px}}
.capa h1{{font-size:88px;line-height:1.04;letter-spacing:-.03em;font-weight:900}}
.capa h1 .l{{font-weight:300;letter-spacing:-.01em;font-size:58px}}
.datas{{display:flex;margin-top:38px;border-top:2px solid rgba(209,211,212,.3);padding-top:22px}}
.datas span{{font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:var(--silver);padding-right:26px;margin-right:26px;border-right:2px solid rgba(209,211,212,.3)}}
.datas span:last-child{{border:none}}
/* casos */
.num{{position:absolute;right:-70px;top:30px;font-weight:900;font-size:820px;line-height:1;color:transparent;-webkit-text-stroke:3px rgba(209,211,212,.16)}}
.papel .num{{-webkit-text-stroke:3px rgba(155,107,38,.3)}}
.caso h2{{font-weight:900;font-size:92px;line-height:1.04;letter-spacing:-.03em;margin-bottom:44px;position:relative}}
.caso.papel h2{{color:var(--navy)}}
.corpo{{font-weight:300;font-size:41px;line-height:1.48;text-align:justify;text-align-last:left;hyphens:auto;position:relative}}
.papel .corpo{{color:var(--graphite)}}
.gr + .corpo{{text-align:left}}
.docket{{display:grid;grid-template-columns:1fr 1fr;margin-top:46px;border-top:2px solid rgba(209,211,212,.3);position:relative}}
.papel .docket{{border-color:rgba(48,69,87,.3)}}
.docket div{{padding:24px 0 0}} .docket div+div{{padding-left:36px;border-left:2px solid rgba(209,211,212,.3)}}
.papel .docket div+div{{border-color:rgba(48,69,87,.3)}}
.docket small{{display:block;font-weight:500;font-size:22px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}}
.papel .docket small{{color:var(--bronze)}}
.docket b{{font-weight:500;font-size:33px;line-height:1.25}}
.papel .docket b{{color:var(--navy)}}
/* texto corrido */
h2.gr{{font-weight:900;font-size:92px;line-height:1.04;letter-spacing:-.03em;margin-bottom:46px}}
.lista{{margin-top:44px}}
.lista small{{display:block;font-weight:500;font-size:20px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:6px}}
.lista div{{font-weight:400;font-size:32px;padding:20px 0;border-top:2px solid rgba(209,211,212,.25)}}
.lista div:last-child{{border-bottom:2px solid rgba(209,211,212,.25)}}
/* fecho */
.fecho .foto2{{position:absolute;left:0;top:0;width:1080px;height:560px;background-size:cover;background-position:center}}
.fecho .veu2{{position:absolute;left:0;top:0;width:1080px;height:600px;background:linear-gradient(to bottom,rgba(13,19,26,0) 30%,#0d131a 98%)}}
.fecho .conteudo{{top:auto;bottom:90px;height:880px;justify-content:flex-end}}
.botao{{align-self:flex-start;margin-top:48px;background:var(--gold);color:var(--ink);font-weight:700;font-size:28px;letter-spacing:.12em;text-transform:uppercase;padding:22px 40px;border-radius:4px}}
.assin{{margin-top:60px;border-top:2px solid rgba(209,211,212,.25);padding-top:28px;display:flex;flex-direction:column;gap:10px}}
.assin b{{font-weight:900;font-size:36px;letter-spacing:-.01em}} .assin span{{font-weight:300;font-size:30px;color:var(--silver)}}
'''

html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>5 julgamentos do STF em outubro</title><style>{CSS}</style></head><body>{t1}{t2}{t3}{t4}{t5}{t6}{t7}{t8}</body></html>'
(OUT / "carrossel.html").write_text(html)
print("carrossel.html gerado")
