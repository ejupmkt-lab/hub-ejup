#!/usr/bin/env python3
"""Carrossel — "O caso Vorcaro", derivado do episódio 01 de A Sala.

Treze telas 1080x1440 na linha cinematográfica (modelo: carrossel-a-sala).
Linguagem simples, nomes próprios com fonte e com a resposta de quem foi
citado, um gancho por tela. Nenhum rosto real: os nomes ficam no texto e as
imagens são objetos, gerados no Higgsfield (opção B aprovada pelo Victor:
9 imagens em 1k baixa, a da Sala em 2k média com a foto real como
referência, 1 recorte de fundo; 4,25 créditos).

Roteiro de origem: docs/formatos/a-sala-ep01-caso-master.md
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
CANTOS = '<i class="c c1"></i><i class="c c2"></i><i class="c c3"></i><i class="c c4"></i>'


def fonte(txt, lado="left"):
    return f'<p class="fonte-rod" style="{lado}:64px">{txt}</p>'


def pessoa(nome, sobrenome, fato, resposta, gancho, img, fontes_txt):
    return f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g(img)})"></div>
  <div class="grad-cima" style="height:900px"></div>
  <div class="grad-baixo" style="height:420px"></div>
  <h1 class="disp" style="left:64px;right:64px;top:150px;font-size:124px">{nome}<br><em>{sobrenome}</em></h1>
  <p class="texto" style="left:64px;right:64px;top:430px">{fato}</p>
  <p class="resposta" style="left:64px;right:200px;top:{460 + (len(fato) // 46 + 1) * 50 + 20}px">{resposta}</p>
  <p class="leg" style="right:64px;bottom:150px;text-align:right">{gancho}</p>
  {fonte(fontes_txt)}
</section>"""


TELAS = [
    # 1 · capa
    f"""<section class="s papel capa">
  <div class="cheia" style="background:linear-gradient(180deg,#f0eae0 0%,#ece6db 55%,#e6e0d4 100%)"></div>
  {CANTOS}
  <h2 class="gancho" style="top:150px;font-size:40px">Um banqueiro preso. 1,6 milhão de pessoas<br>com dinheiro travado. E <em>três ministros</em><br>do Supremo.</h2>
  <h1 class="titulo" style="top:318px;font-size:230px;line-height:.86;white-space:normal">o caso<br>Vorcaro</h1>
  <img class="cadeira" src="{b64(IMG / 'objetos.png', 'image/png')}" alt="" style="transform-origin:50% 100%;transform:translateY(-60px) scale(.85);filter:drop-shadow(0 26px 30px rgba(13,19,26,.28))">
  <p class="micro" style="left:92px;bottom:84px">arraste</p>
  <img class="selo-simbolo" src="{SIMBOLO}" alt="">
  <p class="micro dir" style="right:92px;bottom:84px">nomes, datas<br>e o que a lei diz</p>
</section>""",

    # 2 · aeroporto
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('aeroporto')})"></div>
  <div class="grad-cima" style="height:760px"></div>
  <div class="grad-baixo" style="height:460px"></div>
  <h1 class="disp" style="left:64px;right:64px;top:150px;font-size:96px">Novembro de 2025.<br>O dono do banco<br>foi <em>preso no<br>aeroporto.</em></h1>
  <p class="leg" style="left:64px;right:64px;bottom:200px;font-size:30px">Segundo a Polícia Federal, Daniel Vorcaro,<br>dono do Banco Master, estava de saída do país.</p>
  <p class="leg" style="right:64px;bottom:150px;text-align:right;color:var(--ouro)">No mesmo dia, o banco dele fechou. &rarr;</p>
  {fonte('Fontes: JOTA · CNN Brasil')}
</section>""",

    # 3 · banco fechado
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('banco')})"></div>
  <div class="grad-cima" style="height:760px"></div>
  <div class="grad-baixo" style="height:520px"></div>
  <h1 class="disp" style="left:64px;right:64px;top:150px;font-size:112px">O Banco Central<br><em>fechou o banco.</em></h1>
  <p class="leg" style="left:64px;right:64px;bottom:240px;font-size:30px">O Master saiu das mãos do dono. Entrou um<br>liquidante para pagar quem der para pagar.</p>
  <p class="leg" style="right:64px;bottom:150px;text-align:right;color:var(--ouro)">E 1,6 milhão de pessoas tinham dinheiro lá dentro. &rarr;</p>
  {fonte('Fontes: Banco Central · CNN Brasil')}
</section>""",

    # 4 · a isca
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('cdb')})"></div>
  <div class="grad-baixo" style="height:760px"></div>
  <h1 class="disp" style="left:64px;right:64px;bottom:360px;font-size:112px">Pagar <em>mais que<br>todo mundo.</em></h1>
  <p class="leg" style="left:64px;right:64px;bottom:230px;font-size:30px">O Master vendia CDB rendendo muito acima dos<br>outros bancos. E repetia: tem a garantia do FGC.</p>
  <p class="leg" style="right:64px;bottom:150px;text-align:right;color:var(--ouro)">Só que essa garantia tem teto. &rarr;</p>
  {fonte('Fonte: Polícia Federal, via imprensa')}
</section>""",

    # 5 · o teto do FGC
    f"""<section class="s papel">
  <h1 class="disp" style="left:64px;right:64px;top:150px;font-size:116px">Um seguro<br>que tem <em>teto.</em></h1>
  <p class="texto escuro" style="left:64px;right:64px;top:430px">É um fundo pago pelos próprios bancos para devolver o dinheiro das pessoas quando um banco quebra.</p>
  <div class="numeros" style="top:640px">
    <div><b>R$ 250 mil</b><span>por pessoa, em cada banco. Bancos do mesmo grupo contam como um só.</span></div>
    <div><b>R$ 1 milhão</b><span>no máximo, a cada quatro anos, somando tudo o que a pessoa recebeu.</span></div>
  </div>
  <p class="texto escuro" style="left:64px;right:64px;top:1030px">Quem tinha mais do que isso foi para a fila. A fila de quem só recebe se sobrar dinheiro.</p>
  <p class="leg escuro" style="right:64px;bottom:150px;text-align:right">Foi o maior resgate da história do FGC. &rarr;</p>
  {fonte('Fontes: regras do FGC · CNN Brasil · Transparência Internacional Brasil')}
</section>""",

    # 6 · celular
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('celular')})"></div>
  <div class="grad-baixo" style="height:640px"></div>
  <h1 class="disp" style="left:64px;right:64px;top:150px;font-size:118px">Aí vieram<br>as <em>mensagens<br>no celular.</em></h1>
  <p class="leg" style="left:64px;right:64px;bottom:230px;font-size:30px">A PF apreendeu o telefone de Vorcaro.<br>O que estava lá dentro mudou o tamanho do caso.</p>
  <p class="leg" style="right:64px;bottom:150px;text-align:right;color:var(--ouro)">Ele chegou ao Supremo. &rarr;</p>
</section>""",

    # 7 · plenário
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('plenario')})"></div>
  <div class="grad-baixo" style="height:620px"></div>
  <h1 class="disp" style="left:64px;right:64px;bottom:300px;font-size:112px">No Supremo,<br><em>três nomes</em><br>apareceram.</h1>
  <p class="leg" style="left:64px;right:64px;bottom:190px;font-size:28px">Nenhum deles é investigado por crime neste caso. Cada um aparece por um motivo diferente.</p>
  <p class="leg" style="right:64px;bottom:140px;text-align:right;color:var(--ouro)">O primeiro era o relator. &rarr;</p>
</section>""",

    # 8 · Toffoli
    pessoa("Dias", "Toffoli",
           "Era o relator do caso no Supremo: o ministro que conduz o processo. Em fevereiro de 2026, pediu para sair, depois de reportagens ligarem empresas de familiares dele a fundos investigados.",
           "A relatoria foi sorteada de novo.",
           "E caiu com outro ministro. &rarr;", "cadeira",
           "Fontes: imprensa · STF"),

    # 9 · Mendonça
    pessoa("André", "Mendonça",
           "Assumiu o caso e mandou Vorcaro de volta para a prisão em março de 2026. Em setembro, veio à tona: um ano antes de virar relator, ele teve duas horas de reunião com Vorcaro, em São Paulo.",
           "Mendonça confirma o encontro. Diz que foi uma única vez e que decidiu contra o banqueiro.",
           "O terceiro nome veio no relatório da PF. &rarr;", "reuniao",
           "Fonte: Agência Pública"),

    # 10 · Moraes
    pessoa("Alexandre", "de Moraes",
           "Segundo a PF, o escritório da mulher dele, Viviane Barci de Moraes, tinha um contrato de cerca de R$ 130 milhões com o banco. E no celular de Vorcaro havia mensagens para um contato que a PF identificou como o ministro, uma delas no dia da prisão: “conseguiu ter notícia ou bloquear?”",
           "Moraes nega relação com Vorcaro e diz que não recebeu essas mensagens.",
           "Dentro do Supremo, o clima esquentou. &rarr;", "contrato",
           "Fontes: Agência Pública · Metrópoles"),

    # 11 · Gilmar
    f"""<section class="s preto">
  <h1 class="disp centro-y" style="left:64px;right:64px;font-size:150px;line-height:1.02">“Até a <em>máfia</em><br>tem ética.”</h1>
  <p class="leg" style="left:64px;bottom:230px;font-size:30px">Gilmar Mendes, ministro do STF, em sessão da Corte.</p>
  <p class="leg" style="right:64px;bottom:150px;text-align:right;color:var(--ouro)">E o que a lei diz sobre tudo isso? &rarr;</p>
  {fonte('Fontes: Metrópoles · Terra')}
</section>""",

    # 12 · o que a lei diz
    f"""<section class="s papel">
  <h1 class="disp" style="left:64px;right:64px;top:150px;font-size:104px">O que a <em>lei</em> diz.</h1>
  <div class="qa" style="top:330px">
    <div><b>Está preso, então é culpado?</b><span>Ainda não. A prisão antes do julgamento serve para proteger a investigação. Culpa, só com sentença.</span></div>
    <div><b>Juiz que conhece uma das partes pode julgar?</b><span>A lei manda sair do caso o juiz que é amigo íntimo de uma das partes, ou cujo marido ou mulher atuou como advogado no processo. <i>CPP, arts. 252 e 254.</i></span></div>
    <div><b>E quem julga um ministro do Supremo?</b><span>Crime comum, o próprio Supremo. Crime de responsabilidade, o Senado. <i>CF, arts. 102 e 52.</i></span></div>
  </div>
  <p class="leg escuro" style="right:64px;bottom:150px;text-align:right">Falta a pergunta que ninguém respondeu. &rarr;</p>
</section>""",

    # 13 · CTA
    f"""<section class="s tinta">
  <div class="cheia" style="background-image:url({g('sala')})"></div>
  <img class="impresso" src="{SIMBOLO}" alt="" style="left:498px;top:352px;width:84px;filter:blur(.4px)">
  <div class="grad-cima" style="height:300px;opacity:.6"></div>
  <div class="grad-baixo" style="height:640px"></div>
  <h1 class="disp" style="left:64px;right:64px;bottom:430px;text-align:center;font-size:88px">Quem deve julgar<br>quando <em>todo mundo<br>conhece todo mundo?</em></h1>
  <p class="leg centro-x" style="bottom:250px;text-align:center;width:820px;font-size:28px">Responde aqui embaixo. O episódio completo<br>sai em breve em A Sala, no canal da EJUP.</p>
  <div class="logo bc">{LOGO}</div>
</section>""",
]


def main():
    html = (HERE / "template.html").read_text(encoding="utf-8")
    html = html.replace("__FONT_FACES__", fontes()).replace("__SLIDES__", "\n".join(TELAS))
    (OUT / "carrossel.html").write_text(html, encoding="utf-8")
    print(f"gerado: carrossel.html, {len(TELAS)} telas")


if __name__ == "__main__":
    main()
