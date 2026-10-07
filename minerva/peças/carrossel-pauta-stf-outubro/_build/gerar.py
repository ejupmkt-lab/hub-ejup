#!/usr/bin/env python3
"""Carrossel '5 julgamentos do STF para acompanhar em outubro' · 8 telas 1080x1440."""
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


def anel(cor="#d1d3d4", op=.1):
    return (f'<svg class="anel" viewBox="0 0 1080 1440"><circle cx="1010" cy="1180" r="520" fill="none" stroke="{cor}" '
            f'stroke-opacity="{op}" stroke-width="10"/><circle cx="1010" cy="1180" r="380" fill="none" stroke="{cor}" '
            f'stroke-opacity="{op}" stroke-width="10"/></svg>')


def caso(cls, n, data, titulo, texto, ref, logo, fundo=""):
    corpo = (f'<div class="top"><div class="big">{n}</div><div class="data">{data}</div></div>'
             f'<h2>{titulo}</h2><div class="ficha"><p>{texto}</p><small>{ref}</small></div>')
    return tela("caso " + cls, corpo, logo, fundo)


t1 = tela("navy capa", '''
  <div class="cinco">5</div>
  <h1 class="h-capa"><b>julgamentos do STF</b><br><span class="l">para acompanhar em</span> <em>outubro</em></h1>
  <div class="datas"><span>7 e 8</span><span>14 e 15</span><span>21 e 22</span><span>28 e 29</span></div>
''', LOGO_B, anel("#f0b855", .22))

t2 = caso("ink", "1", "7 e 8 de outubro", "Crédito presumido de ICMS entra na base do <em>PIS/Cofins?</em>",
          "No plenário virtual, a maioria de 6 a 5 afastava a tributação, e o pedido de destaque levou o caso ao plenário físico. Os processos sobre o tema estão suspensos em todo o país.",
          "RE 835.818 · Tema 843", LOGO_B, anel())
t3 = caso("papel", "2", "14 e 15 de outubro", "Aplicativo de fretamento precisa de <em>circuito fechado?</em>",
          "A lei mineira exige a mesma lista de passageiros na ida e na volta, o que atinge plataformas como a Buser. O julgamento recomeça no plenário físico.",
          "RE 1.506.410 · Caso Buser", LOGO_N, anel("#9b6b26", .22))
t4 = caso("navy", "3", "21 e 22 de outubro", "Adulto capaz pode <em>recusar tratamento médico?</em>",
          "Em 2024, o STF reconheceu a recusa de transfusão por motivo religioso. Agora analisa o direito de qualquer paciente adulto e capaz. O relator votou por assegurá-lo, desde que a decisão seja livre, informada e esclarecida.",
          "ADPF 642 · ADPF 618", LOGO_B, anel())
t5 = caso("steel", "4", "21 e 22 de outubro", "Quando a polícia precisa de ordem judicial para <em>acessar dados?</em>",
          "Na ADC 91, o relator, ministro Cristiano Zanin, votou para exigir autorização judicial, como regra, na identificação de usuários por dados de conexão, com exceção para extrema urgência. As ADIs discutem o poder de requisição dos delegados.",
          "ADC 91 · ADI 5.059 · ADI 5.073", LOGO_B, anel())
t6 = caso("papel", "5", "28 e 29 de outubro", "Contribuição progressiva dos servidores é <em>constitucional?</em>",
          "Uma turma recursal federal do Rio Grande do Sul limitou a contribuição a 14%, por ver violação à isonomia e caráter confiscatório. A União defende que a progressividade da Emenda 103/2019 é compatível com a Constituição.",
          "RE 1.384.562 · Tema 1.226", LOGO_N, anel("#9b6b26", .22))

t7 = tela("navy", '''
  <h2 class="gr">A pauta <em>pode mudar</em></h2>
  <p class="corpo">O calendário inicial cobre as quartas-feiras. As quintas ficam reservadas para processos remanescentes, e pedidos de vista ou de destaque alteram a ordem. A pauta de outubro inclui ainda o Funrural, a liberdade de imprensa, o porte de arma de guardas municipais e a insalubridade de terceirizados. Confira no site do STF antes de planejar uma sustentação ou uma petição.</p>
''', LOGO_B, anel())

t8 = tela("ink", f'''
  <div class="simb">{SIMB}</div>
  <h2 class="gr">Qual julgamento você vai <em>acompanhar?</em></h2>
  <p class="corpo">Conte nos comentários. Salve para consultar a pauta durante o mês.</p>
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
.anel{{position:absolute;inset:0;width:100%;height:100%}}
.conteudo{{position:absolute;left:84px;right:84px;top:80px;bottom:230px;display:flex;flex-direction:column;justify-content:center}}
.logo{{position:absolute;left:0;right:0;bottom:80px;display:flex;justify-content:center}}
.logo svg{{height:54px;width:auto}}
em{{font-style:normal;color:var(--gold)}} .papel em{{color:var(--bronze)}}
.cinco{{font-weight:900;font-size:760px;line-height:.74;letter-spacing:-.06em;color:var(--gold);margin:0 0 30px -30px}}
.h-capa{{font-size:84px;line-height:1.04;letter-spacing:-.03em;font-weight:900;color:#fff}}
.h-capa .l{{font-weight:300;letter-spacing:-.01em;font-size:60px}} .h-capa em{{font-weight:900}}
.datas{{display:flex;gap:14px;margin-top:40px}}
.datas span{{border:2px solid var(--gold);color:var(--gold);font-weight:500;font-size:24px;letter-spacing:.12em;text-transform:uppercase;padding:12px 22px;border-radius:999px}}
.caso .top{{display:flex;align-items:flex-end;gap:30px;margin-bottom:30px}}
.caso .big{{font-weight:900;font-size:400px;line-height:.78;letter-spacing:-.05em;color:var(--gold);margin-left:-16px}}
.caso.papel .big{{color:var(--bronze)}}
.caso .data{{margin-bottom:14px;background:var(--gold);color:var(--ink);font-weight:700;font-size:26px;letter-spacing:.1em;text-transform:uppercase;padding:16px 28px;border-radius:999px}}
.caso.papel .data{{background:var(--navy);color:#fff}}
.caso h2{{font-weight:900;font-size:84px;line-height:1.04;letter-spacing:-.03em;margin-bottom:34px}}
.caso.papel h2{{color:var(--navy)}}
.ficha{{border-left:10px solid var(--gold);background:rgba(255,255,255,.08);padding:30px 36px 28px;clip-path:polygon(0 0,100% 0,100% 84%,95% 100%,0 100%)}}
.caso.papel .ficha{{border-color:var(--bronze);background:rgba(3,28,55,.06)}}
.ficha p{{font-weight:300;font-size:37px;line-height:1.36;text-align:left}}
.caso.papel .ficha p{{color:var(--graphite)}}
.ficha small{{display:block;margin-top:18px;font-weight:700;font-size:23px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}}
.caso.papel .ficha small{{color:var(--bronze)}}
h2.gr{{font-weight:900;font-size:92px;line-height:1.04;letter-spacing:-.03em;margin-bottom:48px}}
.corpo{{font-weight:300;font-size:42px;line-height:1.5;text-align:left}}
.simb{{width:150px;margin-bottom:60px}}
.pill{{align-self:flex-start;margin-top:52px;background:var(--gold);color:var(--ink);font-weight:700;font-size:30px;letter-spacing:.12em;text-transform:uppercase;padding:22px 44px;border-radius:999px}}
.assin{{margin-top:70px;border-top:2px solid rgba(209,211,212,.25);padding-top:30px;display:flex;flex-direction:column;gap:10px}}
.assin b{{font-weight:900;font-size:36px;letter-spacing:-.01em}} .assin span{{font-weight:300;font-size:30px;color:var(--silver)}}
.ink:not(.caso) .logo{{display:none}}
'''

html = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>5 julgamentos do STF em outubro</title><style>{CSS}</style></head><body>{t1}{t2}{t3}{t4}{t5}{t6}{t7}{t8}</body></html>'
(OUT / "carrossel.html").write_text(html)
print("carrossel.html gerado")
