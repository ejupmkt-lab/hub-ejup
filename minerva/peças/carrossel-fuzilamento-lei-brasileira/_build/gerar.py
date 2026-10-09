#!/usr/bin/env python3
"""Carrossel 'A Constituição brasileira admite a pena de morte' · 15 telas 1080x1440.

Versão 3 (09/10/2026): capa com imagem gerada no Higgsfield (venda sobre a
Constituição), gráficos (linha de 65 anos, diagrama da guerra declarada, janela
de sete dias, quadro Brasil x EUA), linha do tempo que atravessa duas telas e
gancho no pé das telas para puxar o arraste. Imagens em _build/tratar_fotos.py.
"""
import pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
DS = HERE.parents[2] / "skills" / "ejup-design" / "assets"
FONTS = (DS / "fonts").as_uri()
IMG = (HERE / "duotone").as_uri()

MANET = "Édouard Manet, <i>A execução de Maximiliano</i>, 1868 · The Met"
GOYA = "Francisco de Goya, <i>Não se pode olhar</i>, c. 1810 · The Met"
HOGARTH = "William Hogarth, <i>Execução em Tyburn</i>, 1747 · The Met"


def svg(nome):
    return re.sub(r'<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', (DS / "logo" / nome).read_text(), 1)


LOGO_B = svg("ejup-horizontal-white.svg")
LOGO_N = svg("ejup-horizontal-navy.svg")


def bg(img):
    return f"background-image:url('{IMG}/{img}.jpg')"


def gancho(txt):
    return f'<div class="gancho">{txt} <span>→</span></div>' if txt else ""


def cheia(cls, img, corpo, credito="", gc="", logo=LOGO_B):
    cr = f'<div class="credito">{credito}</div>' if credito else ""
    return (f'<section class="s cheia {cls}"><div class="img" style="{bg(img)}"></div><div class="veu"></div>{cr}'
            f'<div class="conteudo">{corpo}</div>{gancho(gc)}<div class="logo">{logo}</div></section>')


def faixa(cls, img, corpo, credito="", h=640, gc=""):
    cr = f'<div class="credito">{credito}</div>' if credito else ""
    return (f'<section class="s faixa {cls}" style="--h:{h}px"><div class="img" style="{bg(img)}"></div><div class="veu"></div>{cr}'
            f'<div class="conteudo">{corpo}</div>{gancho(gc)}<div class="logo">{LOGO_B}</div></section>')


def texto(cls, corpo, fundo="", gc="", logo=LOGO_B):
    fd = f'<div class="fundo" style="{bg(fundo)}"></div>' if fundo else ""
    return (f'<section class="s texto {cls}">{fd}<div class="conteudo">{corpo}</div>{gancho(gc)}'
            f'<div class="logo">{logo}</div></section>')


# 1 · capa
t01 = cheia("capa", "capa-venda", '''
  <div class="eyebrow">Pena de morte · o que diz a lei brasileira</div>
  <h1>A Constituição brasileira admite a <em>pena de morte</em>.</h1>
  <p class="lead">Em um único caso. E a lei já define o método.</p>''', gc="Arraste")

# 2 · a notícia
t02 = faixa("ink", "pelotao", '''
  <div class="eyebrow">Por que falar disso agora</div>
  <h2>Os EUA marcaram um fuzilamento para <em>3&nbsp;de dezembro</em></h2>
  <p class="corpo">O condenado matou 13 pessoas na base de Fort Hood, em 2009. O Pentágono anunciou que vai transmitir.</p>''',
            MANET, 600, "Há 65 anos isso não acontecia")

# 3 · 65 anos
t03 = texto("navy anos", '''
  <div class="eyebrow">Justiça militar dos EUA</div>
  <div class="numero">65 <small>anos</small></div>
  <p class="corpo">sem uma execução militar. A última foi em 1961.</p>
  <div class="regua"><div class="linha"></div>
    <div class="marco ini"><i></i><b>1961</b><span>última execução militar</span></div>
    <div class="marco fim"><i></i><b>2026</b><span>fuzilamento marcado</span></div></div>''',
            "fundo-manet-b", "E no Brasil?")

# 4 · salvo
t04 = texto("papel salvo", '''
  <div class="eyebrow">E no Brasil? · Constituição, art. 5º, XLVII</div>
  <p class="trecho">“não haverá penas: a) de morte,</p>
  <div class="palavra">salvo</div>
  <p class="trecho dir">em caso de guerra declarada”</p>
  <p class="corpo">A exceção inteira cabe em uma palavra.</p>''',
            "fundo-hogarth-a-claro", "Quem declara a guerra?", LOGO_N)

# 5 · quem declara
t05 = texto("steel", '''
  <div class="eyebrow">Constituição, art. 84, XIX</div>
  <h2>Guerra declarada exige <em>dois Poderes</em></h2>
  <div class="diagrama">
    <div class="caixa"><small>Declara</small><b>Presidente da República</b></div>
    <div class="caixa"><small>Autoriza ou referenda</small><b>Congresso Nacional</b></div>
    <div class="liga"></div>
    <div class="caixa final"><small>Só diante de agressão estrangeira</small><b>Guerra declarada</b></div>
  </div>''', "fundo-manet-a", "E a lei já diz como")

# 6 · art. 56
t06 = faixa("ink", "botas", '''
  <div class="eyebrow">Código Penal Militar, art. 56</div>
  <blockquote>“A pena de morte é executada <em>por fuzilamento</em>.”</blockquote>''', MANET, 620,
            "Mas não para qualquer crime")

# 7 · só crimes de guerra
t07 = faixa("navy", "baionetas", '''
  <h2>Só para crimes militares <em>em tempo de guerra</em></h2>
  <p class="corpo">Como a traição: o brasileiro que pega em armas contra o Brasil (art.&nbsp;355).</p>''', GOYA, 640,
            "E a sentença passa pelo Presidente")

# 8 · sete dias
dias = "".join(f'<div class="dia{" a" if i in (0, 7) else ""}"><i></i><b>{i}</b></div>' for i in range(8))
t08 = texto("papel", f'''
  <div class="eyebrow">Código Penal Militar, art. 57</div>
  <h2>Sete dias <em>entre a sentença e a execução</em></h2>
  <div class="semana">
    <div class="janela"><span>Janela para indulto ou comutação · CF, art. 84, XII</span></div>
    <div class="dias">{dias}</div>
    <div class="pontas"><span>Comunicação ao Presidente</span><span>Execução possível</span></div>
  </div>
  <p class="nota">Em zona de operações de guerra, pode ser imediata.</p>''', "fundo-goya-claro", "O rito também está na lei", LOGO_N)

# 9 · o rito
t09 = faixa("ink rito", "faixa-venda", '''
  <div class="eyebrow">Código de Processo Penal Militar, arts. 707 e 708</div>
  <div class="lista">
    <div><b>01</b>Uniforme comum, sem insígnias</div>
    <div><b>02</b>Olhos vendados, se o condenado aceitar</div>
    <div><b>03</b>Sinal no lugar da voz de fogo</div>
    <div><b>04</b>Ata assinada por duas testemunhas</div>
  </div>''', "", 560, "Lado a lado com os EUA")

# 10 · Brasil x EUA
linhas = [("Quando cabe", "Só em guerra declarada", "Também em tempo de paz"),
          ("Presidente", "Pode indultar em 7 dias", "Precisa aprovar"),
          ("Método", "Fuzilamento", "Fuzilamento, neste caso"),
          ("Registro", "Ata e duas testemunhas", "Transmissão anunciada")]
quadro = "".join(f'<div class="rot">{a}</div><div>{b}</div><div>{c}</div>' for a, b, c in linhas)
t10 = texto("navy", f'''
  <div class="eyebrow">Lado a lado</div>
  <h2>Brasil <em>e</em> EUA</h2>
  <div class="quadro"><div class="rot"></div><div class="cab">Brasil</div><div class="cab">EUA · Justiça militar</div>{quadro}</div>''',
            "fundo-hogarth-b", "Uma emenda poderia mudar isso?")

# 11 · cláusula pétrea
t11 = texto("ink", '''
  <div class="eyebrow">Constituição, art. 60, §4º, IV</div>
  <h2>Uma emenda poderia <em>ampliar?</em></h2>
  <p class="corpo">Para a doutrina majoritária, não. A proibição é cláusula pétrea.</p>
  <div class="ficha"><small>Decreto 2.754/1998</small>O Brasil ratificou o protocolo americano contra a pena de morte, com reserva só para a guerra.</div>''',
            "fundo-manet-a", "A pena e a plateia")


# 12 e 13 · linha do tempo que atravessa as duas telas
def panorama(lado, corpo, marcos):
    x = 0 if lado == "esq" else -1080
    pts = "".join(f'<div class="ponto {pos}" style="left:{px + x}px"><i></i><b>{ano}</b><span>{txt}</span></div>'
                  for px, ano, txt, pos in marcos)
    cr = f'<div class="credito">{HOGARTH}</div>' if lado == "esq" else ""
    return (f'<section class="s pano ink"><div class="img" style="{bg("panorama")};background-position:{x}px 0"></div>'
            f'<div class="veu"></div>{cr}<div class="trilho" style="left:{x}px"></div>{pts}'
            f'<div class="conteudo">{corpo}</div>{gancho("A linha continua") if lado == "esq" else ""}'
            f'<div class="logo">{LOGO_B}</div></section>')


MARCOS = [(150, "1747", "Londres monta arquibancadas para um enforcamento", "cima"),
          (600, "1757", "Paris: o suplício de Damiens, que abre <i>Vigiar e Punir</i>", "baixo"),
          (1230, "1961", "Última execução militar dos EUA", "cima"),
          (1680, "2026", "O Pentágono anuncia a transmissão", "baixo")]
t12 = panorama("esq", '''
  <div class="eyebrow">A publicidade da pena</div>
  <h2>Da praça <em>à tela</em></h2>''', MARCOS)
t13 = panorama("dir", '''
  <p class="corpo">O Direito moderno tirou a pena do palco. Foucault descreve essa passagem em <i>Vigiar e Punir</i>, de 1975.</p>''', MARCOS)

# 14 · ONU
t14 = cheia("", "goya", '''
  <div class="eyebrow">ONU · 9 de outubro de 2026</div>
  <h2>Transmitir equivale a <em>executar em público</em></h2>
  <p class="corpo">Para o Alto Comissariado de Direitos Humanos, violaria a proibição da tortura.</p>''', GOYA)

# 15 · fecho
t15 = cheia("fecho", "capa-venda", '''
  <h2>Onde termina a publicidade da pena e começa <em>o espetáculo?</em></h2>
  <p class="corpo">Conte nos comentários.</p>
  <div class="botao">Salve e compartilhe</div>
  <div class="assin"><b>Alma clássica, <em>repertório contemporâneo.</em></b><span>@ejup.oficial</span></div>''')

telas = [t01, t02, t03, t04, t05, t06, t07, t08, t09, t10, t11, t12, t13, t14, t15]

CSS = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Book.otf");font-weight:400}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-BookItalic.otf");font-weight:400;font-style:italic}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Bold.otf");font-weight:700}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
:root{{--ink:#0d131a;--navy:#031c37;--steel:#304557;--silver:#d1d3d4;--bronze:#9b6b26;--gold:#f0b855;--graphite:#414042;--fio:rgba(209,211,212,.28)}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#222;font-family:Gotham,Montserrat,sans-serif;-webkit-font-smoothing:antialiased}}
.s{{position:relative;width:1080px;height:1440px;margin:0 0 40px;overflow:hidden;color:#fff;--bg:#031c37;background:var(--bg)}}
.navy{{--bg:#031c37}} .ink{{--bg:#0d131a}} .steel{{--bg:#304557}}
.papel{{--bg:#f3f0e9;background:linear-gradient(160deg,#f8f6f1,#eeeae1);color:var(--graphite);--fio:rgba(48,69,87,.28)}}
.conteudo{{position:absolute;left:96px;right:96px;top:110px;bottom:240px;display:flex;flex-direction:column;justify-content:center;z-index:2}}
.logo{{position:absolute;left:0;right:0;bottom:80px;display:flex;justify-content:center;z-index:3}}
.logo svg{{height:54px;width:auto}}
em{{font-style:normal;color:var(--gold)}} .papel em{{color:var(--bronze)}}
i{{font-style:italic;font-weight:400}}
h1,h2{{text-wrap:balance;position:relative}}
.eyebrow{{font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:34px;position:relative}}
.papel .eyebrow{{color:var(--bronze)}}
h1{{font-weight:900;font-size:104px;line-height:1.06;letter-spacing:-.03em}}
h2{{font-weight:900;font-size:86px;line-height:1.05;letter-spacing:-.025em}}
.papel h2{{color:var(--navy)}}
.lead{{font-weight:300;font-size:46px;line-height:1.35;margin-top:36px}}
.corpo{{font-weight:300;font-size:44px;line-height:1.4;margin-top:36px;position:relative}}
.papel .corpo{{color:var(--graphite)}}
blockquote{{font-weight:400;font-size:68px;line-height:1.2;letter-spacing:-.015em;padding-left:44px;border-left:5px solid var(--gold);position:relative}}
.gancho{{position:absolute;right:96px;bottom:168px;z-index:3;font-weight:500;font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}}
.gancho span{{display:inline-block;margin-left:10px;font-size:28px;letter-spacing:0;transform:translateY(2px)}}
.papel .gancho{{color:var(--bronze)}}
/* imagens */
.img{{position:absolute;left:0;top:0;width:1080px;background-size:cover;background-position:center}}
.credito{{position:absolute;z-index:3;font-weight:300;font-size:17px;letter-spacing:.02em;color:rgba(209,211,212,.72)}}
.credito i{{font-weight:400}}
.cheia .img{{height:1440px}}
.cheia .veu{{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(3,28,55,0) 0%,rgba(3,28,55,.15) 34%,rgba(3,28,55,.86) 58%,#031c37 74%)}}
.cheia .credito{{left:96px;bottom:212px}}
.cheia .conteudo{{top:auto;height:820px;justify-content:flex-end;padding-bottom:10px}}
.capa .veu{{background:linear-gradient(to bottom,rgba(1,8,18,0) 0%,rgba(1,8,18,0) 40%,rgba(3,28,55,.75) 56%,#031c37 70%)}}
.capa .conteudo{{height:780px}}
.faixa .img{{height:var(--h)}}
.faixa .veu{{position:absolute;left:0;top:0;width:1080px;height:calc(var(--h) + 2px);background:linear-gradient(to bottom,rgba(0,0,0,0) 45%,var(--bg) 100%)}}
.faixa .credito{{right:60px;top:calc(var(--h) - 54px);text-align:right}}
.faixa .conteudo{{top:calc(var(--h) + 10px)}}
.fundo{{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.22}}
.fundo::after{{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,var(--bg) 0%,transparent 30%,transparent 70%,var(--bg) 100%)}}
.papel .fundo{{opacity:.12}}
/* 3 · 65 anos */
.numero{{font-weight:900;font-size:400px;line-height:.8;letter-spacing:-.05em;color:var(--gold);position:relative}}
.numero small{{font-size:96px;letter-spacing:-.02em;color:#fff;margin-left:8px}}
.anos .corpo{{margin-top:30px}}
.regua{{position:relative;height:150px;margin-top:70px}}
.regua .linha{{position:absolute;left:0;right:0;top:12px;border-top:2px dashed rgba(209,211,212,.45)}}
.marco{{position:absolute;top:0;display:flex;flex-direction:column}}
.marco i{{display:block;width:26px;height:26px;border-radius:50%;background:var(--gold);margin-bottom:22px}}
.marco b{{font-weight:900;font-size:44px}} .marco span{{font-weight:300;font-size:26px;color:var(--silver);margin-top:6px}}
.marco.ini{{left:0}} .marco.fim{{right:0;align-items:flex-end;text-align:right}}
/* 4 · salvo */
.trecho{{font-weight:400;font-size:50px;line-height:1.2;color:var(--navy);position:relative}}
.trecho.dir{{text-align:right}}
.palavra{{font-weight:900;font-size:300px;line-height:.9;letter-spacing:-.05em;color:var(--bronze);text-align:center;margin:18px 0 24px;position:relative;text-decoration:underline;text-decoration-thickness:10px;text-underline-offset:26px}}
.salvo .corpo{{margin-top:56px;font-weight:400;color:var(--navy)}}
/* 5 · diagrama */
.diagrama{{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:64px;position:relative}}
.caixa{{border:2px solid rgba(209,211,212,.5);border-radius:4px;padding:28px 30px;background:rgba(3,28,55,.35)}}
.caixa small{{display:block;font-weight:500;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:12px}}
.caixa b{{font-weight:700;font-size:36px;line-height:1.15}}
.liga{{grid-column:1/3;height:70px;position:relative;margin:-28px 0}}
.liga::before{{content:"";position:absolute;left:25%;right:25%;top:0;height:35px;border:2px solid var(--gold);border-top:none}}
.liga::after{{content:"";position:absolute;left:50%;top:35px;height:35px;border-left:2px solid var(--gold)}}
.caixa.final{{grid-column:1/3;border-color:var(--gold);background:rgba(240,184,85,.08);text-align:center}}
.caixa.final b{{font-weight:900;font-size:48px}}
/* 8 · sete dias */
.semana{{margin-top:96px;position:relative}}
.janela{{margin:0 3.5% 18px;border:2px solid var(--bronze);border-bottom:none;height:58px;position:relative}}
.janela span{{position:absolute;left:0;right:0;top:-44px;text-align:center;font-weight:500;font-size:20px;letter-spacing:.1em;text-transform:uppercase;color:var(--bronze)}}
.dias{{display:flex;justify-content:space-between;position:relative}}
.dias::before{{content:"";position:absolute;left:3.5%;right:3.5%;top:17px;border-top:2px solid rgba(3,28,55,.35)}}
.dia{{width:7%;display:flex;flex-direction:column;align-items:center;position:relative}}
.dia i{{width:36px;height:36px;border-radius:50%;border:2px solid var(--navy);background:#f3f0e9}}
.dia.a i{{background:var(--navy)}}
.dia b{{font-weight:900;font-size:38px;color:var(--navy);margin-top:14px}}
.pontas{{display:flex;justify-content:space-between;margin-top:18px;font-weight:500;font-size:22px;letter-spacing:.06em;text-transform:uppercase;color:var(--navy)}}
.pontas span{{max-width:44%}} .pontas span+span{{text-align:right}}
.nota{{margin-top:56px;font-weight:300;font-size:36px;color:var(--graphite);position:relative}}
/* 9 · rito */
.lista div{{display:flex;align-items:baseline;gap:30px;font-weight:400;font-size:42px;line-height:1.25;padding:26px 0;border-top:2px solid var(--fio)}}
.lista div:last-child{{border-bottom:2px solid var(--fio)}}
.lista b{{font-weight:900;font-size:34px;color:var(--gold);min-width:56px}}
/* 10 · quadro */
.quadro{{display:grid;grid-template-columns:210px 1fr 1fr;margin-top:56px;position:relative}}
.quadro>div{{padding:26px 18px 26px 0;border-top:2px solid var(--fio);font-weight:300;font-size:33px;line-height:1.2}}
.quadro .cab{{font-weight:900;font-size:36px;color:var(--gold);border-top:none;padding-top:0}}
.quadro .rot{{font-weight:500;font-size:19px;letter-spacing:.14em;text-transform:uppercase;color:var(--silver);padding-top:34px}}
.quadro>div:nth-child(3n+2){{font-weight:400}}
/* 11 · ficha */
.ficha{{margin-top:56px;padding-top:26px;border-top:2px solid var(--fio);font-weight:300;font-size:32px;line-height:1.4;color:var(--silver);position:relative}}
.ficha small{{display:block;font-weight:500;font-size:20px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}}
/* 12 e 13 · panorama */
.pano .img{{width:2160px;height:700px;background-size:2160px 700px;background-repeat:no-repeat}}
.pano .veu{{position:absolute;left:0;top:0;width:1080px;height:702px;background:linear-gradient(to bottom,rgba(13,19,26,0) 25%,rgba(13,19,26,.85) 62%,#0d131a 100%)}}
.pano .credito{{left:96px;top:60px}}
.pano .conteudo{{top:396px;bottom:auto;height:340px;justify-content:flex-end;padding-bottom:8px}}
.pano .corpo{{font-size:42px}}
.trilho{{position:absolute;top:970px;width:2160px;border-top:3px solid var(--gold);z-index:2}}
.ponto{{position:absolute;top:956px;width:330px;z-index:2}}
.ponto>i{{position:absolute;left:-15px;top:0;width:30px;height:30px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 8px #0d131a}}
.ponto b{{position:absolute;left:-15px;font-weight:900;font-size:46px;line-height:1}}
.ponto span{{position:absolute;left:-15px;width:360px;font-weight:300;font-size:25px;line-height:1.3;color:var(--silver)}}
.ponto.cima b{{bottom:34px}} .ponto.cima span{{bottom:92px}}
.ponto.baixo b{{top:60px}} .ponto.baixo span{{top:118px}}
/* fecho */
.fecho .veu{{background:linear-gradient(to bottom,rgba(1,8,18,.1) 0%,rgba(3,28,55,.55) 30%,rgba(3,28,55,.94) 48%,#031c37 62%)}}
.fecho .conteudo{{height:900px}}
.fecho h2{{font-size:82px}}
.botao{{align-self:flex-start;margin-top:40px;background:var(--gold);color:var(--ink);font-weight:700;font-size:28px;letter-spacing:.12em;text-transform:uppercase;padding:22px 40px;border-radius:4px;position:relative}}
.assin{{margin-top:50px;border-top:2px solid rgba(209,211,212,.25);padding-top:26px;display:flex;flex-direction:column;gap:10px;position:relative}}
.assin b{{font-weight:900;font-size:34px;letter-spacing:-.01em}} .assin span{{font-weight:300;font-size:28px;color:var(--silver)}}
'''

html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Pena de morte na lei brasileira</title>'
        f'<style>{CSS}</style></head><body>{"".join(telas)}</body></html>')
(OUT / "carrossel.html").write_text(html)
print(f"carrossel.html gerado · {len(telas)} telas")
