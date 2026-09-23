#!/usr/bin/env python3
"""Carrossel — "A Sala", o quadro explicado.

Dez telas 1080x1440 que apresentam o formato A Sala como se o carrossel fosse
um filme: capa com a frase de abertura, planos do set, uma página de roteiro,
película e créditos.

Linguagem editorial de cinema: numeração "(000)", títulos grandes em Gotham
Book com palavras em Book Italic, legendas miúdas nos cantos, imagens fora do
centro, alternância entre tinta e papel, grão de película em todas as telas.

EXCEÇÃO DOCUMENTADA À SEÇÃO 5 DO CLAUDE.md: nesta série o título sai em
Gotham Book + Book Italic, e não em Black. Pedido expresso do Victor por uma
linha "diferentona, cinematográfica, com fontes elegantes". A família segue
única (Gotham) e a paleta segue a da marca.

Imagens: frames gravados no set da Sala pela própria EJUP.
"""
import base64
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
LOGOS = RAIZ / "skills" / "ejup-design" / "assets" / "logo"
REC = HERE / "recortes"


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    out = []
    for nome, peso, estilo in (("Thin", 200, "normal"), ("Light", 300, "normal"),
                               ("Book", 400, "normal"), ("BookItalic", 400, "italic"),
                               ("Medium", 500, "normal"), ("Black", 900, "normal")):
        out.append(f"@font-face{{font-family:'Gotham';font-weight:{peso};"
                   f"font-style:{estilo};src:url({b64(FONTS / f'Gotham-{nome}.otf', 'font/otf')})"
                   " format('opentype')}")
    return "\n".join(out)


def img(nome):
    return b64(REC / f"{nome}.jpg", "image/jpeg")


LOGO = (LOGOS / "ejup-horizontal-navy.svg").read_text(encoding="utf-8")


def logo(cor):
    return f'<div class="logo {cor}">{LOGO}</div>'


def furos(n=9):
    return "".join("<i></i>" for _ in range(n))


TELAS = [
    # ---------------------------------------------------------------- 000
    f'''<section class="s tinta">
  <div class="cheia" style="background-image:url({img('capa')})"></div>
  <div class="sombra-baixo"></div>
  <p class="lab tl">(000)<br>A SALA<br>um quadro da EJUP</p>
  <p class="lab tr dir">episódio 01<br>em breve</p>
  <h1 class="disp" style="left:70px;right:70px;bottom:250px">eu preciso <em>confessar</em><br>uma coisa.</h1>
  <p class="lab bl">arraste para entrar na sala</p>
  {logo('br')}
</section>''',

    # ---------------------------------------------------------------- 001
    f'''<section class="s papel">
  <p class="lab tc">(001)<br><br>todo episódio começa<br>no mesmo lugar.</p>
  <h1 class="disp centro">uma sala <em>escura,</em><br>uma mesa<br>e <em>duas</em> cadeiras.</h1>
  <p class="leg bc">o cenário não muda. mudam o objeto sobre a mesa e a frase
  que abre o episódio.</p>
</section>''',

    # ---------------------------------------------------------------- 002
    f'''<section class="s tinta">
  <div class="quadro" style="left:360px;top:300px;width:720px;height:540px;background-image:url({img('vazia-43')})"></div>
  <h1 class="disp" style="left:110px;right:40px;top:800px;font-size:106px">a cadeira <em>vazia</em><br>espera quem vai<br><em>confessar.</em></h1>
  <p class="lab bl">(002)<br>PLANO GERAL<br>int. a sala · noite</p>
  <p class="leg br dir">do outro lado da mesa fica a câmera.<br>quem senta ali é quem assiste.</p>
</section>''',

    # ---------------------------------------------------------------- 003
    f'''<section class="s tinta">
  <h1 class="disp" style="left:70px;right:70px;top:190px">sobre a mesa,<br><em>o tema.</em></h1>
  <div class="quadro" style="left:0;top:560px;width:1080px;height:452px;background-image:url({img('detalhe')})"></div>
  <p class="marca" style="left:150px;top:1040px">01 · disco rígido</p>
  <p class="marca" style="left:700px;top:1040px">02 · disquete</p>
  <p class="lab bl">(003)<br>PLANO DETALHE<br>episódio 01</p>
  <p class="leg br dir">em cada episódio, um objeto carrega<br>o assunto. no primeiro, memória e<br>tempo: o que a máquina guarda por nós.</p>
</section>''',

    # ---------------------------------------------------------------- 004
    f'''<section class="s preto">
  <div class="cheia" style="background-image:url({img('rosto')})"></div>
  <div class="tarja cima"></div><div class="tarja baixo"></div>
  <p class="lab tl sobre">(004)</p>
  <p class="lab tr dir sobre">PLANO FECHADO · 85 MM<br>câmera parada</p>
  <p class="legenda">Eu preciso confessar uma coisa.</p>
  <p class="lab bl sobre">00:00:06:12</p>
  {logo('br sobre')}
</section>''',

    # ---------------------------------------------------------------- 005
    f'''<section class="s papel">
  <p class="lab tc">(005)<br><br>o que vem depois<br>da frase.</p>
  <h1 class="disp centro">ninguém<br>confessa<br><em>à toa.</em></h1>
  <p class="leg bc">cada confissão vira pergunta jurídica: o que aconteceu,
  qual o mecanismo, o que está em aberto e o que muda na prática.</p>
</section>''',

    # ---------------------------------------------------------------- 006
    f'''<section class="s papel roteiro">
  <p class="lab tl">(006)<br>ROTEIRO · EPISÓDIO 01</p>
  <p class="lab tr dir">pág. 1</p>
  <div class="pagina">
    <p class="slug">INT. A SALA · NOITE</p>
    <p class="acao">Ele puxa a cadeira e senta. Três segundos de silêncio. Olha para a câmera.</p>
    <p class="pers">ELE</p>
    <p class="fala">Eu preciso confessar uma coisa.</p>
    <p class="paren">(pausa)</p>
    <p class="fala">Eu já assinei uma petição que eu não li inteira.</p>
    <p class="paren">(pausa)</p>
    <p class="fala">E se você é advogado há tempo suficiente, você também já.</p>
    <p class="trans">CORTE SECO.</p>
  </div>
</section>''',

    # ---------------------------------------------------------------- 007
    f'''<section class="s tinta">
  <div class="quadro" style="left:0;top:180px;width:640px;height:478px;background-image:url({img('maos-43')})"></div>
  <h1 class="disp" style="left:70px;right:60px;top:720px">depois da confissão,<br><em>corte seco.</em></h1>
  <p class="lab tr dir">(007)<br>A VINHETA</p>
  <p class="leg bl">entra a vinheta, e o episódio abre a lei,<br>a jurisprudência e a doutrina que<br>respondem à frase. com fonte na tela.</p>
</section>''',

    # ---------------------------------------------------------------- 008
    f'''<section class="s preto">
  <div class="pelicula">
    <div class="furos e">{furos()}</div><div class="furos d">{furos()}</div>
    <div class="fr" style="background-image:url({img('simbolo')})"></div>
    <div class="fr" style="background-image:url({img('fr-maos')})"></div>
    <div class="fr" style="background-image:url({img('fr-vazia')})"></div>
  </div>
  <p class="lab" style="left:560px;top:160px">(008)<br>EPISÓDIO 01</p>
  <h1 class="disp menor" style="left:560px;right:60px;top:560px">dever de<br><em>verificação.</em></h1>
  <p class="leg" style="left:560px;right:60px;top:880px">inteligência artificial, documentos
  que ninguém leu inteiro e o nome de quem assina.</p>
</section>''',

    # ---------------------------------------------------------------- 009
    f'''<section class="s tinta">
  <p class="lab tc">(009)</p>
  <h1 class="disp centro gigante">a <em>sala.</em></h1>
  <p class="leg bc larga" style="bottom:290px">em breve no canal da EJUP.<br>
  <span class="ouro">alma clássica, repertório contemporâneo.</span></p>
  <p class="creditos">um quadro EJUP Educação Jurídica · roteiro, direção e fotografia EJUP</p>
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
