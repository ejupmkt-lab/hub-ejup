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


def g(nome):
    return b64(IMG / f"{nome}.jpg", "image/jpeg")


LOGO = (LOGOS / "ejup-horizontal-navy.svg").read_text(encoding="utf-8")
SIMBOLO = b64(LOGOS / "ejup-symbol-navy.svg", "image/svg+xml")


def logo(cls):
    return f'<div class="logo {cls}">{LOGO}</div>'


def simbolo_no_papel(x0, y0, x1, y1, escala=.62, desfoque=0.0, deslocar=.08):
    """O símbolo da EJUP impresso no papel preso na cortiça."""
    w = (x1 - x0) * escala
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 + (y1 - y0) * deslocar
    return (f'<img class="impresso" src="{SIMBOLO}" alt="" style="left:{cx - w / 2:.0f}px;'
            f'top:{cy - w / 2:.0f}px;width:{w:.0f}px;filter:blur({desfoque}px)">')


CANTOS = '<i class="c c1"></i><i class="c c2"></i><i class="c c3"></i><i class="c c4"></i>'

TELAS = [
    # ---------------------------------------------------------------- 000 capa
    f"""<section class="s papel capa">
  <div class="cheia" style="background-image:url({g('capa')})"></div>
  {CANTOS}
  <p class="micro" style="left:92px;top:78px">um quadro<br>EJUP Educação<br>Jurídica</p>
  <p class="micro centro-x" style="top:78px">episódio 01</p>
  <p class="micro dir" style="right:92px;top:78px">gravado<br>em estúdio</p>
  <h2 class="gancho">O que todo advogado já fez<br>e <em>ninguém</em> confessa.</h2>
  <h1 class="titulo">a sala</h1>
  <img class="cadeira" src="{b64(IMG / 'cadeira.png', 'image/png')}" alt="">
  <p class="micro" style="left:92px;bottom:84px">(000)<br>arraste</p>
  <img class="selo-simbolo" src="{SIMBOLO}" alt="">
  <p class="micro dir" style="right:92px;bottom:84px">confissões<br>de quem assina</p>
</section>""",

    # ---------------------------------------------------------------- 001
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('porta')})"></div>
  <div class="grad-baixo" style="height:460px"></div>
  <p class="lab" style="left:64px;top:64px">(001)</p>
  <h1 class="disp" style="left:64px;right:64px;top:170px;font-size:200px"><em>Até</em><br>agora.</h1>
  <p class="leg" style="right:64px;bottom:120px;text-align:right">Existe uma sala onde a confissão<br>vem primeiro. E o Direito entra<br>logo depois.</p>
</section>""",

    # ---------------------------------------------------------------- 002
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('sala')})"></div>
  {simbolo_no_papel(476, 436, 600, 594, desfoque=0.6)}
  <div class="grad-baixo" style="height:520px"></div>
  <p class="lab" style="left:64px;top:64px">(002)<br>INT. A SALA · NOITE</p>
  <h1 class="disp" style="left:64px;right:64px;bottom:250px;font-size:104px">Uma sala.<br>Uma mesa.<br><em>Duas</em> cadeiras.</h1>
  <p class="leg" style="left:64px;bottom:120px">Uma é de quem confessa. A outra fica do lado de cá da tela.</p>
  <p class="seta" style="right:64px;bottom:116px">&rarr;</p>
</section>""",

    # ---------------------------------------------------------------- 003
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('feixe')})"></div>
  <p class="lab" style="left:64px;top:64px">(003)<br>A FRASE</p>
  <h1 class="disp centro-y" style="left:64px;right:64px;text-align:center;font-size:132px">Eu preciso<br><em>confessar</em><br>uma coisa.</h1>
  <p class="leg centro-x" style="bottom:120px;text-align:center;width:640px">Ela nunca muda. A confissão que vem<br>depois dela muda a cada episódio.</p>
</section>""",

    # ---------------------------------------------------------------- 004
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('assinatura')})"></div>
  <div class="grad-cima"></div>
  <div class="grad-baixo" style="height:420px"></div>
  <p class="lab" style="left:64px;top:64px">(004)<br>A CONFISSÃO DO EPISÓDIO 01</p>
  <h1 class="disp" style="left:64px;right:64px;top:200px;font-size:104px">“Eu já assinei<br>uma petição que<br><em>não li inteira.</em>”</h1>
  <p class="leg" style="right:64px;bottom:120px;text-align:right">Se você advoga há tempo suficiente,<br>você também já.</p>
</section>""",

    # ---------------------------------------------------------------- 005
    f"""<section class="s papel">
  <div class="quadro" style="right:0;top:170px;width:620px;height:500px;background-image:url({g('livro')})"></div>
  <p class="lab" style="left:64px;top:64px">(005)<br>O OUTRO LADO DA MESA</p>
  <h1 class="disp" style="left:64px;right:64px;top:740px;font-size:112px">Toda confissão<br>tem uma <em>regra</em><br>esperando.</h1>
  <p class="leg" style="left:64px;bottom:120px">Dever de verificação. Responsabilidade<br>de quem assina. O que a lei diz e o que<br>os tribunais já decidiram.</p>
  <p class="leg" style="right:64px;bottom:120px;text-align:right">E ela chega<br>sem aviso.</p>
</section>""",

    # ---------------------------------------------------------------- 006
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('projetor')})"></div>
  <p class="lab dir" style="right:64px;top:64px">(006)<br>A VIRADA</p>
  <h1 class="disp" style="right:64px;left:64px;top:190px;text-align:right;font-size:190px">Corte<br><em>seco.</em></h1>
  <p class="leg" style="left:64px;bottom:120px">Entra a vinheta. O episódio abre a lei,<br>a jurisprudência e a doutrina que<br>respondem à confissão, com fonte na tela.</p>
</section>""",

    # ---------------------------------------------------------------- 007
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('provas')})"></div>
  <div class="grad-cima" style="height:420px"></div>
  <p class="lab dir" style="right:64px;top:64px">(007)<br>PLANO DETALHE</p>
  <h1 class="disp" style="left:64px;right:64px;top:130px;font-size:110px">Sobre a mesa,<br><em>a prova.</em></h1>
  <p class="marca" style="left:64px;top:470px">01 · envelope lacrado</p>
  <p class="marca" style="left:700px;top:352px">02 · fotografias</p>
  <p class="marca" style="left:64px;top:1130px">03 · relatório com tarjas</p>
  <p class="leg" style="left:64px;bottom:96px;width:340px">Uma prova diferente em cada episódio. Ela é o tema.</p>
</section>""",

    # ---------------------------------------------------------------- 008
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('contraplano')})"></div>
  {simbolo_no_papel(484, 254, 608, 346, escala=.5, desfoque=0.9)}
  <p class="lab" style="left:64px;top:64px">(008)<br>CONTRAPLANO</p>
  <h1 class="disp" style="left:64px;right:64px;bottom:280px;font-size:108px">E a cadeira<br>deste lado<br>é <em>a sua.</em></h1>
  <p class="leg" style="left:64px;bottom:120px">Então responda com sinceridade:</p>
  <p class="seta" style="right:64px;bottom:116px">&rarr;</p>
</section>""",

    # ---------------------------------------------------------------- 009 CTA
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('cortica')})"></div>
  {simbolo_no_papel(374, 416, 700, 864, escala=.58, desfoque=0.2, deslocar=.05)}
  <div class="grad-baixo" style="height:560px"></div>
  <p class="lab" style="left:64px;top:64px">(009)</p>
  <h1 class="disp" style="left:64px;right:64px;top:930px;text-align:center;font-size:104px">Qual seria<br>a <em>sua</em> confissão?</h1>
  <p class="leg centro-x" style="top:1176px;text-align:center;width:760px">Conta nos comentários. A Sala · episódio 01<br>em breve no canal da EJUP.</p>
  {logo('bc')}
</section>""",
]


def main():
    html = (HERE / "template.html").read_text(encoding="utf-8")
    html = html.replace("__FONT_FACES__", fontes()).replace("__SLIDES__", "\n".join(TELAS))
    (OUT / "carrossel.html").write_text(html, encoding="utf-8")
    print(f"gerado: carrossel.html, {len(TELAS)} telas")


if __name__ == "__main__":
    main()
