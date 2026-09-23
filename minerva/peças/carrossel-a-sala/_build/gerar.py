#!/usr/bin/env python3
"""Carrossel — "A Sala". Versão modelo para a linha cinematográfica.

Dez telas 1080x1440. Cada tela tem um gancho que só a seguinte resolve, e a
capa combina gancho visual (a cadeira na frente do título gigante) com
gancho de texto ("o que todo advogado já fez e ninguém confessa").

Imagens: geradas no Higgsfield (gpt_image_2_5), uma por tela, nenhuma
repetida. A cadeira da capa foi recortada com o removedor de fundo do
Higgsfield e sobreposta ao título para dar profundidade.

Linguagem: numeração "(000)", Gotham Book com palavras em Book Italic no
corpo narrativo, Gotham Black só no título da capa, microrrótulos nos cantos,
grão de película. Itálico em dourado sobre escuro e em bronze sobre papel.
"""
import base64
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"
IMG = HERE / "img"


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    out = []
    for nome, peso, estilo in (("Light", 300, "normal"), ("Book", 400, "normal"),
                               ("BookItalic", 400, "italic"), ("Medium", 500, "normal"),
                               ("Black", 900, "normal")):
        out.append(f"@font-face{{font-family:'Gotham';font-weight:{peso};font-style:{estilo};"
                   f"src:url({b64(FONTS / f'Gotham-{nome}.otf', 'font/otf')}) format('opentype')}}")
    return "\n".join(out)


def g(i):
    return b64(IMG / f"g{i}.jpg", "image/jpeg")


LOGO = (LOGOS / "ejup-horizontal-navy.svg").read_text(encoding="utf-8")


def logo(cls):
    return f'<div class="logo {cls}">{LOGO}</div>'


CANTOS = '<i class="c c1"></i><i class="c c2"></i><i class="c c3"></i><i class="c c4"></i>'

TELAS = [
    # ---------------------------------------------------------------- 000 capa
    f'''<section class="s papel capa">
  <div class="cheia" style="background-image:url({g(0)})"></div>
  {CANTOS}
  <p class="micro" style="left:92px;top:78px">um quadro<br>EJUP Educação<br>Jurídica</p>
  <p class="micro centro-x" style="top:78px">episódio 01</p>
  <p class="micro dir" style="right:92px;top:78px">gravado<br>em estúdio</p>
  <h2 class="gancho">O que todo advogado já fez<br>e <em>ninguém</em> confessa.</h2>
  <h1 class="titulo">a sala</h1>
  <img class="cadeira" src="{b64(IMG / 'cadeira.png', 'image/png')}" alt="">
  <p class="micro" style="left:92px;bottom:84px">(000)<br>arraste</p>
  <p class="micro centro-x" style="bottom:84px">Natal · RN · 2026</p>
  <p class="micro dir" style="right:92px;bottom:84px">confissões<br>de quem assina</p>
</section>''',

    # ---------------------------------------------------------------- 001
    f'''<section class="s tinta">
  <div class="cheia" style="background-image:url({g(1)})"></div>
  <div class="grad-baixo" style="height:460px"></div>
  <p class="lab" style="left:64px;top:64px">(001)</p>
  <h1 class="disp" style="left:64px;right:64px;top:170px;font-size:200px"><em>Até</em><br>agora.</h1>
  <p class="leg" style="right:64px;bottom:120px;text-align:right">Existe uma sala onde a confissão<br>vem primeiro. E o Direito entra<br>logo depois.</p>
</section>''',

    # ---------------------------------------------------------------- 002
    f'''<section class="s tinta">
  <div class="cheia" style="background-image:url({g(2)})"></div>
  <div class="grad-baixo"></div>
  <p class="lab" style="left:64px;top:64px">(002)<br>INT. A SALA · NOITE</p>
  <h1 class="disp" style="left:64px;right:64px;bottom:300px">Uma sala.<br>Uma mesa.<br><em>Duas</em> cadeiras.</h1>
  <p class="leg" style="left:64px;bottom:120px">E uma frase que abre todo episódio.</p>
  <p class="seta" style="right:64px;bottom:116px">&rarr;</p>
</section>''',

    # ---------------------------------------------------------------- 003
    f'''<section class="s tinta">
  <div class="cheia" style="background-image:url({g(3)})"></div>
  <p class="lab" style="left:64px;top:64px">(003)<br>A FRASE</p>
  <h1 class="disp centro-y" style="left:64px;right:64px;text-align:center;font-size:132px">Eu preciso<br><em>confessar</em><br>uma coisa.</h1>
  <p class="leg centro-x" style="bottom:120px;text-align:center;width:640px">Ela nunca muda. A confissão que vem<br>depois dela muda a cada episódio.</p>
</section>''',

    # ---------------------------------------------------------------- 004
    f'''<section class="s tinta">
  <div class="cheia" style="background-image:url({g(4)})"></div>
  <div class="grad-cima"></div>
  <div class="grad-baixo" style="height:420px"></div>
  <p class="lab" style="left:64px;top:64px">(004)<br>A CONFISSÃO DO EPISÓDIO 01</p>
  <h1 class="disp" style="left:64px;right:64px;top:200px;font-size:104px">“Eu já assinei<br>uma petição que<br><em>não li inteira.</em>”</h1>
  <p class="leg" style="right:64px;bottom:120px;text-align:right">Se você advoga há tempo suficiente,<br>você também já.</p>
</section>''',

    # ---------------------------------------------------------------- 005
    f'''<section class="s papel">
  <div class="quadro" style="right:0;top:170px;width:620px;height:500px;background-image:url({g(5)})"></div>
  <p class="lab" style="left:64px;top:64px">(005)<br>O OUTRO LADO DA MESA</p>
  <h1 class="disp" style="left:64px;right:64px;top:740px;font-size:112px">Toda confissão<br>tem uma <em>regra</em><br>esperando.</h1>
  <p class="leg" style="left:64px;bottom:120px">Dever de verificação. Responsabilidade<br>de quem assina. O que a lei diz e o que<br>os tribunais já decidiram.</p>
  <p class="leg" style="right:64px;bottom:120px;text-align:right">E ela chega<br>sem aviso.</p>
</section>''',

    # ---------------------------------------------------------------- 006
    f'''<section class="s tinta">
  <div class="cheia" style="background-image:url({g(6)})"></div>
  <p class="lab dir" style="right:64px;top:64px">(006)<br>A VIRADA</p>
  <h1 class="disp" style="right:64px;left:64px;top:190px;text-align:right;font-size:190px">Corte<br><em>seco.</em></h1>
  <p class="leg" style="left:64px;bottom:120px">Entra a vinheta. O episódio abre a lei,<br>a jurisprudência e a doutrina que<br>respondem à confissão, com fonte na tela.</p>
</section>''',

    # ---------------------------------------------------------------- 007
    f'''<section class="s tinta">
  <div class="cheia" style="background-image:url({g(7)})"></div>
  <p class="lab" style="left:64px;top:64px">(007)<br>PLANO DETALHE</p>
  <h1 class="disp" style="left:64px;right:64px;top:170px;font-size:116px">Sobre a mesa,<br><em>o tema.</em></h1>
  <p class="marca" style="left:150px;top:1150px">01 · disquete</p>
  <p class="marca" style="left:600px;top:1150px">02 · disco rígido</p>
  <p class="leg" style="right:64px;bottom:120px;text-align:right">No episódio 01: memória, tempo<br>e o que a máquina guarda por nós.</p>
</section>''',

    # ---------------------------------------------------------------- 008
    f'''<section class="s tinta">
  <div class="cheia" style="background-image:url({g(8)})"></div>
  <div class="grad-baixo"></div>
  <p class="lab" style="left:64px;top:64px">(008)<br>CONTRACAMPO</p>
  <h1 class="disp" style="left:64px;right:64px;bottom:300px;font-size:112px">E a cadeira<br>do outro lado<br>é <em>a sua.</em></h1>
  <p class="leg" style="left:64px;bottom:120px">Então responda com sinceridade:</p>
  <p class="seta" style="right:64px;bottom:116px">&rarr;</p>
</section>''',

    # ---------------------------------------------------------------- 009 CTA
    f'''<section class="s papel">
  <div class="cheia" style="background-image:url({g(9)})"></div>
  <p class="lab" style="left:64px;top:64px">(009)</p>
  <h1 class="disp" style="left:64px;right:64px;top:720px;text-align:center;font-size:118px">Qual seria<br>a <em>sua</em> confissão?</h1>
  <p class="leg centro-x" style="top:1040px;text-align:center;width:700px">Conta nos comentários.<br>A Sala · episódio 01 em breve no canal da EJUP.</p>
  <p class="micro centro-x" style="bottom:150px">alma clássica, repertório contemporâneo</p>
  {logo('bc')}
</section>''',
]


def main():
    html = (HERE / "template.html").read_text(encoding="utf-8")
    html = html.replace("__FONT_FACES__", fontes()).replace("__SLIDES__", "\n".join(TELAS))
    (OUT / "carrossel.html").write_text(html, encoding="utf-8")
    print(f"gerado: carrossel.html, {len(TELAS)} telas")


if __name__ == "__main__":
    main()
