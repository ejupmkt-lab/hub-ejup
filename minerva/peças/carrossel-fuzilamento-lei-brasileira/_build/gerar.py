#!/usr/bin/env python3
"""Carrossel 'A lei brasileira também prevê fuzilamento' · 9 telas 1080x1440 · tipográfico, sem foto."""
import pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
DS = HERE.parents[2] / "skills" / "ejup-design" / "assets"
FONTS = (DS / "fonts").as_uri()


def svg(nome):
    return re.sub(r'<svg ', '<svg preserveAspectRatio="xMidYMid meet" ', (DS / "logo" / nome).read_text(), 1)


LOGO_B = svg("ejup-horizontal-white.svg")
LOGO_N = svg("ejup-horizontal-navy.svg")


def tela(cls, corpo, num="", logo=LOGO_B):
    marca = f'<div class="num">{num}</div>' if num else ""
    return f'<section class="s {cls}">{marca}<div class="conteudo">{corpo}</div><div class="logo">{logo}</div></section>'


def lei(eyebrow, texto, corpo):
    return f'<div class="eyebrow">{eyebrow}</div><blockquote>{texto}</blockquote><p class="corpo">{corpo}</p>'


t1 = tela("navy capa", '''
  <div class="xlvii">XLVII</div>
  <div class="eyebrow">Pena de morte · o que diz a lei brasileira</div>
  <h1>A lei brasileira também prevê <em>fuzilamento</em>.</h1>
  <p class="lead">Os Estados Unidos marcaram um para 3&nbsp;de dezembro. No Brasil, a regra existe desde 1969 e vale em um único cenário.</p>
''')

t2 = tela("ink", '''
  <div class="eyebrow">O caso americano</div>
  <h2>Um fuzilamento <em>com transmissão</em></h2>
  <p class="corpo">Em 2009, o então major do Exército Nidal Hasan matou 13 pessoas na base de Fort Hood, no Texas. Um tribunal militar o condenou à morte em 2013. Em outubro de 2026, o presidente aprovou a execução por fuzilamento, e o Pentágono anunciou que vai transmiti-la.</p>
  <div class="ficha"><div><small>Quando</small><b>3 de dezembro de 2026, em Fort Hood</b></div><div><small>Marco</small><b>Primeira execução militar dos EUA desde 1961</b></div></div>
''')

t3 = tela("papel", lei(
    "Constituição · art. 5º, XLVII",
    "não haverá penas: a) de morte, <em>salvo em caso de guerra declarada</em>, nos termos do art.&nbsp;84,&nbsp;XIX",
    "A proibição e a exceção dividem a mesma linha. Declarar guerra cabe ao Presidente da República, no caso de agressão estrangeira, com autorização ou referendo do Congresso Nacional (art. 84, XIX)."),
    "5º", LOGO_N)

t4 = tela("navy", lei(
    "Código Penal Militar · art. 56",
    "A pena de morte é executada <em>por fuzilamento</em>.",
    "A pena capital aparece no Livro II do Código, dedicado aos crimes militares em tempo de guerra. Na traição, o brasileiro que toma armas contra o Brasil está sujeito à morte, no grau máximo, ou a vinte anos de reclusão, no grau mínimo (art. 355)."),
    "56")

t5 = tela("steel", lei(
    "Código Penal Militar · art. 57",
    "A sentença definitiva de condenação à morte é comunicada, logo que passe em julgado, <em>ao Presidente da República</em>, e não pode ser executada senão depois de sete dias após a comunicação.",
    "O prazo abre espaço para o indulto e a comutação da pena, que cabem ao Presidente (CF, art. 84, XII). Em zona de operações de guerra, a execução pode ser imediata, quando a ordem e a disciplina militares exigirem. Nos Estados Unidos, a execução militar também depende de aprovação presidencial."),
    "57")

t6 = tela("papel", '''
  <div class="eyebrow">Código de Processo Penal Militar · arts. 707 e 708</div>
  <h2>O rito está <em>escrito na lei</em></h2>
  <div class="rito">
    <div>Uniforme comum, sem insígnias</div>
    <div>Olhos vendados, salvo se o condenado recusar</div>
    <div>Sinais no lugar das vozes de fogo</div>
    <div>Direito a socorro espiritual</div>
    <div>Ata assinada pelo executor e por duas testemunhas, publicada em boletim</div>
  </div>
  <p class="corpo nota">O registro previsto é a ata, com duas testemunhas.</p>
''', "707", LOGO_N)

t7 = tela("ink", '''
  <div class="eyebrow">Constituição · art. 60, §4º, IV</div>
  <h2>A exceção tem <em>limite fixo</em></h2>
  <p class="corpo">A proibição da pena de morte integra os direitos e garantias individuais, que nenhuma emenda pode abolir. Para a doutrina majoritária, estendê-la a outros casos exigiria uma nova Constituição.</p>
  <p class="corpo">O Brasil também ratificou o Protocolo à Convenção Americana sobre Direitos Humanos para abolir a pena de morte, com uma única reserva: crimes militares gravíssimos em tempo de guerra (Decreto 2.754/1998).</p>
''', "60")

t8 = tela("navy", '''
  <div class="eyebrow">A publicidade da pena</div>
  <h2>O Direito moderno <em>tirou a pena do palco</em></h2>
  <p class="corpo">Michel Foucault abre <i>Vigiar e Punir</i>, de 1975, com o suplício público de Damiens, em Paris, em 1757. O livro descreve como a punição deixou a praça e passou a acontecer longe do público, com regras e registro.</p>
  <p class="corpo">Em 9 de outubro de 2026, o Alto Comissariado da ONU para os Direitos Humanos afirmou que transmitir uma execução equivale a uma execução pública e violaria a proibição absoluta da tortura.</p>
''', "1757")

t9 = f'''<section class="s ink fecho"><div class="conteudo">
<h2>Onde termina a publicidade da pena e começa <em>o espetáculo?</em></h2>
<p class="corpo">Conte nos comentários. Salve para consultar os dispositivos quando o tema voltar.</p>
<div class="botao">Salve e compartilhe</div>
<div class="assin"><b>Alma clássica, <em>repertório contemporâneo.</em></b><span>@ejup.oficial</span></div></div>
<div class="logo">{LOGO_B}</div></section>'''

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
.s{{position:relative;width:1080px;height:1440px;margin:0 0 40px;overflow:hidden;color:#fff}}
.navy{{background:var(--navy)}} .ink{{background:var(--ink)}} .steel{{background:var(--steel)}}
.papel{{background:linear-gradient(160deg,#f8f6f1,#eeeae1);color:var(--graphite)}}
.conteudo{{position:absolute;left:96px;right:96px;top:110px;bottom:230px;display:flex;flex-direction:column;justify-content:center}}
.logo{{position:absolute;left:0;right:0;bottom:80px;display:flex;justify-content:center}}
.logo svg{{height:54px;width:auto}}
em{{font-style:normal;color:var(--gold)}} .papel em{{color:var(--bronze)}}
i{{font-style:italic;font-weight:400}}
.num{{position:absolute;right:-60px;top:20px;font-weight:900;font-size:640px;line-height:1;letter-spacing:-.04em;color:transparent;-webkit-text-stroke:3px rgba(209,211,212,.10);white-space:nowrap}}
.papel .num{{-webkit-text-stroke:3px rgba(155,107,38,.16)}}
.eyebrow{{font-weight:500;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:40px;position:relative}}
.papel .eyebrow{{color:var(--bronze)}}
h1,h2{{text-wrap:balance}}
h1{{font-weight:900;font-size:104px;line-height:1.03;letter-spacing:-.03em;position:relative}}
h2{{font-weight:900;font-size:84px;line-height:1.05;letter-spacing:-.025em;margin-bottom:44px;position:relative}}
.papel h2{{color:var(--navy)}}
.lead{{font-weight:300;font-size:44px;line-height:1.42;margin-top:48px;padding-top:40px;border-top:2px solid rgba(209,211,212,.3);color:#fff;position:relative}}
.corpo{{font-weight:300;font-size:38px;line-height:1.46;position:relative}}
.corpo + .corpo{{margin-top:30px}}
.papel .corpo{{color:var(--graphite)}}
blockquote{{font-weight:400;font-size:56px;line-height:1.24;letter-spacing:-.01em;padding-left:40px;border-left:4px solid var(--gold);margin-bottom:52px;position:relative}}
.papel blockquote{{color:var(--navy);border-color:var(--bronze)}}
.steel blockquote{{font-size:46px}}
.ficha{{display:grid;grid-template-columns:1fr 1fr;margin-top:48px;border-top:2px solid rgba(209,211,212,.3);position:relative}}
.ficha div{{padding:24px 0 0}} .ficha div+div{{padding-left:36px;border-left:2px solid rgba(209,211,212,.3)}}
.ficha small{{display:block;font-weight:500;font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:10px}}
.ficha b{{font-weight:500;font-size:32px;line-height:1.25}}
.rito{{position:relative;margin-bottom:40px}}
.rito div{{font-weight:400;font-size:36px;line-height:1.3;color:var(--navy);padding:22px 0;border-top:2px solid rgba(48,69,87,.25)}}
.rito div:last-child{{border-bottom:2px solid rgba(48,69,87,.25)}}
.nota{{font-size:34px}}
.xlvii{{font-weight:900;font-size:300px;line-height:.8;letter-spacing:-.02em;color:transparent;-webkit-text-stroke:3px rgba(209,211,212,.34);margin:0 0 70px -8px}}
.fecho .conteudo{{justify-content:center}}
.fecho h2{{font-size:92px}}
.botao{{align-self:flex-start;margin-top:48px;background:var(--gold);color:var(--ink);font-weight:700;font-size:28px;letter-spacing:.12em;text-transform:uppercase;padding:22px 40px;border-radius:4px}}
.assin{{margin-top:64px;border-top:2px solid rgba(209,211,212,.25);padding-top:28px;display:flex;flex-direction:column;gap:10px}}
.assin b{{font-weight:900;font-size:36px;letter-spacing:-.01em}} .assin span{{font-weight:300;font-size:30px;color:var(--silver)}}
'''

html = (f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Fuzilamento na lei brasileira</title>'
        f'<style>{CSS}</style></head><body>{t1}{t2}{t3}{t4}{t5}{t6}{t7}{t8}{t9}</body></html>')
(OUT / "carrossel.html").write_text(html)
print("carrossel.html gerado")
