#!/usr/bin/env python3
"""Carrossel 'A lei brasileira também prevê fuzilamento' · 16 telas 1080x1440.

Versão 2 (09/10/2026): gravuras de Manet, Goya e Hogarth em duotone navy como
fundo, e pouco texto por tela. As imagens saem de _build/tratar_fotos.py.
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


def cheia(cls, img, corpo, credito):
    """Gravura de ponta a ponta, texto no pé sobre o véu."""
    return (f'<section class="s cheia {cls}"><div class="img" style="background-image:url(\'{IMG}/{img}.jpg\')"></div>'
            f'<div class="veu"></div><div class="credito">{credito}</div>'
            f'<div class="conteudo">{corpo}</div><div class="logo">{LOGO_B}</div></section>')


def faixa(cls, img, corpo, credito, h=700):
    """Gravura no alto, texto embaixo."""
    return (f'<section class="s faixa {cls}" style="--h:{h}px"><div class="img" style="background-image:url(\'{IMG}/{img}.jpg\')"></div>'
            f'<div class="veu"></div><div class="credito">{credito}</div>'
            f'<div class="conteudo">{corpo}</div><div class="logo">{LOGO_B}</div></section>')


def texto(cls, corpo, num="", logo=LOGO_B, fundo=""):
    marca = f'<div class="num">{num}</div>' if num else ""
    fd = f'<div class="fundo" style="background-image:url(\'{IMG}/{fundo}.jpg\')"></div>' if fundo else ""
    return f'<section class="s texto {cls}">{fd}{marca}<div class="conteudo">{corpo}</div><div class="logo">{logo}</div></section>'


telas = [
    cheia("capa", "capa", '''
      <div class="eyebrow">Pena de morte · o que diz a lei brasileira</div>
      <h1>A lei brasileira também prevê <em>fuzilamento</em>.</h1>''', MANET),

    faixa("ink", "pelotao", '''
      <div class="eyebrow">O caso americano</div>
      <h2>Os EUA marcaram um fuzilamento para <em>3&nbsp;de dezembro</em></h2>
      <p class="corpo">O condenado matou 13 pessoas na base de Fort Hood, no Texas, em 2009.</p>''', MANET, 640),

    faixa("navy", "muro", '''
      <h2>E o Pentágono anunciou que vai <em>transmitir</em></h2>
      <p class="corpo">Será a primeira execução militar dos Estados Unidos desde 1961.</p>''', MANET, 640),

    texto("navy grande", '''
      <h2>E no Brasil?</h2>
      <p class="corpo">A Constituição proíbe a pena de morte. A exceção está na mesma frase.</p>''', fundo="fundo-manet-a"),

    texto("papel", '''
      <div class="eyebrow">Constituição · art. 5º, XLVII</div>
      <blockquote>“não haverá penas: a) de morte, <em>salvo em caso de guerra declarada</em>”</blockquote>''', "5º", LOGO_N, "fundo-hogarth-a-claro"),

    texto("steel", '''
      <div class="eyebrow">Constituição · art. 84, XIX</div>
      <h2>Quem declara <em>a guerra</em></h2>
      <p class="corpo">O Presidente da República, diante de agressão estrangeira, com autorização ou referendo do Congresso Nacional.</p>''', "84", fundo="fundo-manet-b"),

    faixa("ink", "botas", '''
      <div class="eyebrow">Código Penal Militar · art. 56</div>
      <blockquote>“A pena de morte é executada <em>por fuzilamento</em>.”</blockquote>''', MANET, 620),

    faixa("navy", "baionetas", '''
      <h2>Só para crimes <em>de guerra</em></h2>
      <p class="corpo">Como a traição: o brasileiro que pega em armas contra o Brasil (art.&nbsp;355).</p>''', GOYA, 660),

    texto("papel", '''
      <div class="eyebrow">Código Penal Militar · art. 57</div>
      <h2>A sentença vai <em>ao Presidente</em></h2>
      <p class="corpo">A execução só pode ocorrer sete dias depois. O prazo abre espaço para indulto ou comutação da pena.</p>''', "57", LOGO_N, "fundo-goya-claro"),

    texto("ink", '''
      <div class="eyebrow">Código de Processo Penal Militar · arts. 707 e 708</div>
      <h2>O rito está <em>na lei</em></h2>
      <div class="rito">
        <div>Uniforme comum, sem insígnias</div>
        <div>Olhos vendados, se o condenado aceitar</div>
        <div>Sinal no lugar da voz de fogo</div>
        <div>Ata assinada por duas testemunhas</div>
      </div>''', "707", fundo="fundo-manet-b"),

    texto("navy", '''
      <div class="eyebrow">Constituição · art. 60, §4º, IV</div>
      <h2>Uma emenda poderia <em>ampliar?</em></h2>
      <p class="corpo">Para a doutrina majoritária, não. A proibição integra as garantias individuais, que são cláusula pétrea.</p>''', "60", fundo="fundo-hogarth-b"),

    texto("papel", '''
      <div class="eyebrow">Decreto 2.754/1998</div>
      <h2>O compromisso <em>internacional</em></h2>
      <p class="corpo">O Brasil ratificou o protocolo americano para abolir a pena de morte, com reserva só para crimes militares gravíssimos em guerra.</p>''', "1998", LOGO_N, "fundo-manet-a-claro"),

    faixa("ink", "arquibancada", '''
      <div class="eyebrow">A publicidade da pena</div>
      <h2>Por séculos, a execução <em>teve plateia</em></h2>
      <p class="corpo">Londres, 1747: arquibancadas para assistir a um enforcamento.</p>''', HOGARTH, 660),

    texto("navy", '''
      <h2>O Direito moderno <em>tirou a pena do palco</em></h2>
      <p class="corpo">Michel Foucault descreve essa passagem em <i>Vigiar e Punir</i> (1975): a punição saiu da praça e ganhou regras e registro.</p>''', "1975", fundo="fundo-hogarth-a"),

    cheia("", "goya", '''
      <div class="eyebrow">ONU · 9 de outubro de 2026</div>
      <h2>Transmitir equivale a <em>executar em público</em></h2>
      <p class="corpo">Para o Alto Comissariado de Direitos Humanos, violaria a proibição da tortura.</p>''', GOYA),

    cheia("fecho", "tyburn", '''
      <h2>Onde termina a publicidade da pena e começa <em>o espetáculo?</em></h2>
      <p class="corpo">Conte nos comentários.</p>
      <div class="botao">Salve e compartilhe</div>
      <div class="assin"><b>Alma clássica, <em>repertório contemporâneo.</em></b><span>@ejup.oficial</span></div>''', HOGARTH),
]

CSS = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Book.otf");font-weight:400}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-BookItalic.otf");font-weight:400;font-style:italic}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Bold.otf");font-weight:700}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
:root{{--ink:#0d131a;--navy:#031c37;--steel:#304557;--silver:#d1d3d4;--bronze:#9b6b26;--gold:#f0b855;--graphite:#414042}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#222;font-family:Gotham,Montserrat,sans-serif;-webkit-font-smoothing:antialiased}}
.s{{position:relative;width:1080px;height:1440px;margin:0 0 40px;overflow:hidden;color:#fff;--bg:#031c37;background:var(--bg)}}
.navy{{--bg:#031c37}} .ink{{--bg:#0d131a}} .steel{{--bg:#304557}}
.papel{{background:linear-gradient(160deg,#f8f6f1,#eeeae1);color:var(--graphite)}}
.conteudo{{position:absolute;left:96px;right:96px;top:110px;bottom:230px;display:flex;flex-direction:column;justify-content:center}}
.logo{{position:absolute;left:0;right:0;bottom:80px;display:flex;justify-content:center;z-index:3}}
.logo svg{{height:54px;width:auto}}
em{{font-style:normal;color:var(--gold)}} .papel em{{color:var(--bronze)}}
i{{font-style:italic;font-weight:400}}
h1,h2{{text-wrap:balance;position:relative}}
.eyebrow{{font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:36px;position:relative}}
.papel .eyebrow{{color:var(--bronze)}}
h1{{font-weight:900;font-size:112px;line-height:1.08;letter-spacing:-.03em}}
h2{{font-weight:900;font-size:88px;line-height:1.04;letter-spacing:-.025em}}
.papel h2{{color:var(--navy)}}
.corpo{{font-weight:300;font-size:44px;line-height:1.4;margin-top:40px;position:relative}}
.papel .corpo{{color:var(--graphite)}}
blockquote{{font-weight:400;font-size:66px;line-height:1.2;letter-spacing:-.015em;padding-left:44px;border-left:5px solid var(--gold);position:relative}}
.papel blockquote{{color:var(--navy);border-color:var(--bronze)}}
/* imagem */
.img{{position:absolute;left:0;top:0;width:1080px;background-size:cover;background-position:center}}
.credito{{position:absolute;z-index:2;font-weight:300;font-size:17px;letter-spacing:.02em;color:rgba(209,211,212,.75)}}
.credito i{{font-weight:400}}
.cheia .img{{height:1440px}}
.cheia .veu{{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(3,28,55,.10) 0%,rgba(3,28,55,.20) 34%,rgba(3,28,55,.88) 58%,#031c37 74%)}}
.cheia .credito{{left:96px;bottom:168px}}
.cheia .conteudo{{top:auto;height:800px;justify-content:flex-end;z-index:2;padding-bottom:8px}}
.faixa .img{{height:var(--h)}}
.faixa .veu{{position:absolute;left:0;top:0;width:1080px;height:calc(var(--h) + 2px);background:linear-gradient(to bottom,rgba(0,0,0,0) 45%,var(--bg) 100%)}}
.faixa .credito{{right:60px;top:calc(var(--h) - 54px);text-align:right}}
.faixa .conteudo{{top:calc(var(--h) + 20px);justify-content:center;z-index:2}}
/* texto com gravura de fundo */
.fundo{{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.24}}
.fundo::after{{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,var(--bg) 0%,transparent 30%,transparent 70%,var(--bg) 100%)}}
.papel .fundo{{opacity:.13}}
.papel .fundo::after{{background:linear-gradient(to bottom,#f8f6f1 0%,transparent 30%,transparent 70%,#eeeae1 100%)}}
.grande .fundo{{opacity:.55;top:520px}}
.grande .fundo::after{{background:linear-gradient(to bottom,var(--bg) 0%,transparent 45%,transparent 80%,var(--bg) 100%)}}
/* texto puro */
.fundo ~ .num{{display:none}}
.num{{position:absolute;right:-60px;top:20px;font-weight:900;font-size:620px;line-height:1;letter-spacing:-.04em;color:transparent;-webkit-text-stroke:3px rgba(209,211,212,.10);white-space:nowrap}}
.papel .num{{-webkit-text-stroke:3px rgba(155,107,38,.16)}}
.grande h2{{font-size:150px;letter-spacing:-.035em}}
.grande .num{{top:auto;bottom:240px;right:auto;left:70px;font-size:330px;-webkit-text-stroke:3px rgba(209,211,212,.22)}}
.grande .conteudo{{justify-content:flex-start;top:180px}}
.rito{{margin-top:44px;position:relative}}
.rito div{{font-weight:400;font-size:40px;line-height:1.3;padding:24px 0;border-top:2px solid rgba(209,211,212,.25)}}
.rito div:last-child{{border-bottom:2px solid rgba(209,211,212,.25)}}
/* fecho */
.fecho .veu{{background:linear-gradient(to bottom,rgba(3,28,55,.25) 0%,rgba(3,28,55,.55) 30%,rgba(3,28,55,.94) 50%,#031c37 64%)}}
.fecho .conteudo{{height:900px}}
.fecho h2{{font-size:84px}}
.botao{{align-self:flex-start;margin-top:44px;background:var(--gold);color:var(--ink);font-weight:700;font-size:28px;letter-spacing:.12em;text-transform:uppercase;padding:22px 40px;border-radius:4px;position:relative}}
.assin{{margin-top:54px;border-top:2px solid rgba(209,211,212,.25);padding-top:26px;display:flex;flex-direction:column;gap:10px;position:relative}}
.assin b{{font-weight:900;font-size:34px;letter-spacing:-.01em}} .assin span{{font-weight:300;font-size:28px;color:var(--silver)}}
'''

html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Fuzilamento na lei brasileira</title>'
        f'<style>{CSS}</style></head><body>{"".join(telas)}</body></html>')
(OUT / "carrossel.html").write_text(html)
print(f"carrossel.html gerado · {len(telas)} telas")
