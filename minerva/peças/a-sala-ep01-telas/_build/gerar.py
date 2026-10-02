#!/usr/bin/env python3
"""A Sala · ep. 01 · telas de apoio ao roteiro (1920x1080, para inserir na edição).

Linguagem: a da vinheta e do set. Fundo tinta, papel de dossiê, texto de
máquina de escrever (Special Elite) nos documentos, Gotham nos títulos, fio
dourado ligando as peças. Imagens reaproveitadas do carrossel do caso
(peças/carrossel-caso-vorcaro/_build/img), sem custo novo.

Conjunto completo na ordem do roteiro. Ilustrações novas em ilustracoes/
(Higgsfield, gpt_image_2_5 média 2k, 4 créditos, aprovadas pelo Victor em 02/10).
"""
import base64, pathlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
RAIZ = HERE.parents[2]
FONTS = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"
ELITE = RAIZ / "peças" / "a-sala-ep01-cenografia" / "_build" / "fontes" / "SpecialElite-Regular.ttf"
IMG = RAIZ / "peças" / "carrossel-caso-vorcaro" / "_build" / "img"
LOGO_SALA = RAIZ / "docs" / "formatos" / "a-sala-vinheta" / "logo" / "a-sala-logo-a-transparente.png"


def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def fontes():
    out = [f"@font-face{{font-family:'Elite';src:url({b64(ELITE, 'font/ttf')})}}"]
    for nome, peso, estilo in (("Light", 300, "normal"), ("Book", 400, "normal"),
                               ("BookItalic", 400, "italic"), ("Medium", 500, "normal"),
                               ("Black", 900, "normal")):
        out.append(f"@font-face{{font-family:'Gotham';font-weight:{peso};font-style:{estilo};"
                   f"src:url({b64(FONTS / f'Gotham-{nome}.otf', 'font/otf')}) format('opentype')}}")
    return "\n".join(out)


def foto(nome):
    return b64(IMG / nome, "image/jpeg")


def marca():
    return '<div class="marca">A SALA</div>'


def fonte(txt):
    return f'<p class="fonte">Fonte: {txt}</p>'


ILU = OUT / "ilustracoes"


def il(nome, w=1920):
    """Ilustração do Higgsfield (PNG 2688x1520) reduzida e embutida em JPEG."""
    import io
    from PIL import Image
    im = Image.open(ILU / f"{nome}.png").convert("RGB")
    im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=88)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


SETA = '<svg class="seta" viewBox="0 0 120 20"><path d="M0 10 H108 M98 2 L113 10 L98 18" stroke="#f0b855" stroke-width="2" fill="none"/></svg>'


def ficha_ministro(img, credito, anexo, cab, nome, papel, itens, diz, fontes_txt):
    lis = "".join(f"<li><time>{d}</time>{t}</li>" for d, t in itens)
    return f"""<section class="s">
  <div class="veu cheio"></div>
  <div class="prova" style="left:150px;top:150px;transform:rotate(-2.2deg)">
    <img src="{foto(img)}" alt=""><span class="clip"></span><p>Anexo {anexo} · {nome} · foto: {credito}</p></div>
  <div class="dossie" style="left:820px;top:140px">
    <p class="cab">{cab}</p>
    <h3>{nome}</h3>
    <p class="papel">{papel}</p>
    <ol class="linha">{lis}</ol>
    <p class="diz"><b>O que ele diz:</b> {diz}</p>
  </div>
  {fonte(fontes_txt)}{marca()}
</section>"""


# 1 · Quem é quem: quadro de personagens ligados pelo fio
t1 = f"""<section class="s">
  <div class="fundo" style="background-image:url({foto('sala.jpg')})"></div><div class="veu"></div>
  <p class="eyebrow" style="left:120px;top:96px">Parte 1 · Quem é quem</p>
  <svg class="fio" viewBox="0 0 1920 1080"><g stroke="#f0b855" stroke-width="2.2" fill="none" opacity=".9">
    <path d="M390 230 C 650 180, 820 200, 960 240"/><path d="M960 240 C 1120 270, 1320 200, 1540 230"/>
    <path d="M390 230 C 470 520, 700 650, 960 700"/><path d="M1540 230 C 1450 520, 1220 650, 960 700"/></g>
    <g fill="#f0b855"><circle cx="390" cy="230" r="9"/><circle cx="960" cy="240" r="9"/><circle cx="1540" cy="230" r="9"/><circle cx="960" cy="700" r="9"/></g></svg>
  <div class="ficha" style="left:180px;top:230px;transform:rotate(-2deg)">
    <div class="tarja-foto">D.V.</div><b>Daniel Vorcaro</b><span>Dono do Banco Master</span><i>Preso. Investigado pela PF. Ainda não julgado.</i></div>
  <div class="ficha" style="left:750px;top:240px;transform:rotate(1.2deg)">
    <div class="sigla">BC</div><b>Banco Central</b><span>Fiscaliza os bancos</span><i>Liquidou o Master e nomeou um liquidante.</i></div>
  <div class="ficha" style="left:1330px;top:230px;transform:rotate(-1deg)">
    <div class="sigla">PF</div><b>Polícia Federal</b><span>Operação Compliance Zero</span><i>Prendeu Vorcaro em Guarulhos.</i></div>
  <div class="ficha larga" style="left:680px;top:700px;transform:rotate(-.6deg)">
    <div class="numero">1,6 mi</div><div style="display:grid;gap:6px"><b>de pessoas</b><span>com dinheiro aplicado no banco</span></div></div>
  {fonte("JOTA, CNN Brasil")}{marca()}
</section>"""

# 2 · O seguro tem teto: exemplo de quem tinha R$ 400 mil
t2 = f"""<section class="s">
  <div class="veu cheio"></div>
  <p class="eyebrow" style="left:120px;top:96px">Parte 2 · A isca</p>
  <h2 class="titulo" style="left:120px;top:150px">O seguro tem <em>teto.</em></h2>
  <div class="regua">
    <div class="trecho coberto" style="width:62.5%"><span>R$ 250 mil</span><small>o FGC devolve</small></div>
    <div class="trecho fila" style="width:37.5%"><span>R$ 150 mil</span><small>vai para a fila</small></div>
  </div>
  <p class="exemplo">Exemplo: quem aplicou <b>R$ 400 mil</b> no Master</p>
  <div class="regras">
    <div><b>R$ 250 mil</b><span>por pessoa, por banco</span></div>
    <div><b>1 banco</b><span>bancos do mesmo grupo valem como um</span></div>
    <div><b>R$ 1 milhão</b><span>no máximo, a cada 4 anos, somando tudo</span></div>
  </div>
  {fonte("regras do FGC")}{marca()}
</section>"""

# 3 · Ficha de dossiê: André Mendonça
t3 = f"""<section class="s">
  <div class="veu cheio"></div>
  <div class="prova" style="left:150px;top:150px;transform:rotate(-2.2deg)">
    <img src="{foto('foto-mendonca.jpg')}" alt=""><span class="clip"></span><p>Anexo 02 · André Mendonça · foto: Rosinei Coutinho/STF</p></div>
  <div class="dossie" style="left:820px;top:140px">
    <p class="cab">STF · RELATORIA DO CASO MASTER</p>
    <h3>André Mendonça</h3>
    <p class="papel">Relator depois da saída de Dias Toffoli</p>
    <ol class="linha">
      <li><time>14.03.2025</time>Reunião com Vorcaro, duas horas, no Instituto Iter, em São Paulo.</li>
      <li><time>03.2026</time>Manda Vorcaro de volta à prisão. A Segunda Turma confirma.</li>
      <li><time>09.2026</time>A reunião de 2025 vem a público.</li>
    </ol>
    <p class="diz"><b>O que ele diz:</b> confirma o encontro. Foi uma única vez, sobre outro processo, e decidiu contra o que Vorcaro queria.</p>
  </div>
  {fonte("Agência Pública")}{marca()}
</section>"""

# 4 · Quem julga um ministro do Supremo
t4 = f"""<section class="s">
  <div class="fundo direita" style="background-image:url({foto('plenario.jpg')})"></div><div class="veu lado"></div>
  <p class="eyebrow" style="left:120px;top:96px">Parte 4 · O que a lei diz</p>
  <h2 class="titulo" style="left:120px;top:150px;font-size:76px">Quem julga um ministro <em>do Supremo?</em></h2>
  <div class="caminho" style="top:430px"><span class="tipo">Crime comum</span><svg viewBox="0 0 220 20"><path d="M0 10 H205 M195 2 L210 10 L195 18" stroke="#f0b855" stroke-width="2" fill="none"/></svg>
    <span class="quem">O próprio Supremo</span><small>Constituição, art. 102, I, b</small></div>
  <div class="caminho" style="top:620px"><span class="tipo">Crime de responsabilidade</span><svg viewBox="0 0 220 20"><path d="M0 10 H205 M195 2 L210 10 L195 18" stroke="#f0b855" stroke-width="2" fill="none"/></svg>
    <span class="quem">O Senado Federal</span><small>Constituição, art. 52, II</small></div>
  {fonte("Constituição Federal")}{marca()}
</section>"""


# ---------- telas completas ----------
abre = f"""<section class="s">
  <div class="fundo" style="background-image:url({il('banco-lacrado')});filter:saturate(.6) brightness(.45)"></div><div class="veu lado"></div>
  <p class="mega" style="left:120px;top:360px">1,6 milhão</p>
  <p class="sub" style="left:128px;top:580px">de pessoas descobriram que o dinheiro delas<br>estava preso dentro de um banco.</p>
  {fonte("JOTA, CNN Brasil")}{marca()}
</section>"""

liquida = f"""<section class="s">
  <div class="fundo" style="background-image:url({il('banco-lacrado')});filter:saturate(.6) brightness(.6)"></div><div class="veu lado"></div>
  <p class="eyebrow" style="left:120px;top:96px">Parte 1 · O nome técnico</p>
  <h2 class="titulo" style="left:120px;top:150px;font-size:80px">Liquidação <em>extrajudicial</em></h2>
  <div class="passos" style="top:440px">
    <div><span class="n">1</span><b>Sai o dono</b><p>O controle do banco deixa de ser de quem o criou.</p></div>
    <div><span class="n">2</span><b>Entra o liquidante</b><p>Nomeado pelo Banco Central para administrar o que sobrou.</p></div>
    <div><span class="n">3</span><b>Paga quem der</b><p>Os credores recebem na medida do que houver.</p></div>
  </div>
  {fonte("Banco Central")}{marca()}
</section>"""

data18 = f"""<section class="s">
  <div class="fundo direita" style="background-image:url({foto('aeroporto.jpg')})"></div><div class="veu lado"></div>
  <div class="cartela" style="left:120px;top:250px">
    <p class="data">18.11.2025</p>
    <p class="fato">Banco Central fecha o Master.</p>
    <p class="fato">PF prende Vorcaro em Guarulhos.</p>
    <p class="nota">Operação Compliance Zero. Segundo a PF, ele estava de saída do país.</p>
  </div>
  {fonte("JOTA, CNN Brasil")}{marca()}
</section>"""

cdb = f"""<section class="s">
  <div class="fundo direita" style="background-image:url({foto('cdb.jpg')})"></div><div class="veu lado"></div>
  <p class="eyebrow" style="left:120px;top:96px">Parte 2 · A isca</p>
  <h2 class="titulo" style="left:120px;top:150px;font-size:80px">Como funciona <em>um CDB</em></h2>
  <div class="ciclo" style="top:420px">
    <div class="no">Você</div>
    <div class="liga"><small>empresta dinheiro</small>{SETA}</div>
    <div class="no">Banco</div>
    <div class="liga"><small>devolve com juros</small>{SETA}</div>
    <div class="no">Você</div>
  </div>
  <p class="destaque" style="left:120px;top:690px">O Master pagava <b>muito mais</b> do que os outros bancos.<br>E o argumento de venda era sempre o mesmo: <em>tem a garantia do FGC.</em></p>
  {marca()}
</section>"""

seguro = f"""<section class="s">
  <div class="fundo" style="background-image:url({il('guarda-chuva')});filter:saturate(.8) brightness(.8)"></div>
  <div class="veu" style="background:linear-gradient(90deg,rgba(13,19,26,.95) 0%,rgba(13,19,26,.7) 40%,rgba(13,19,26,0) 70%)"></div>
  <p class="eyebrow" style="left:120px;top:96px">Parte 2 · O FGC</p>
  <h2 class="titulo" style="left:120px;top:330px;font-size:84px;max-width:860px">Funciona como um seguro. <em>Com limite.</em></h2>
  <p class="sub" style="left:124px;top:600px;max-width:780px;font-size:34px">Um fundo que os próprios bancos bancam para devolver o dinheiro das pessoas quando um banco quebra.</p>
  {fonte("FGC")}{marca()}
</section>"""

fila = f"""<section class="s">
  <div class="fundo" style="background-image:url({il('fila')});filter:saturate(.8) brightness(.85)"></div>
  <div class="veu" style="background:linear-gradient(180deg,rgba(13,19,26,.9) 0%,rgba(13,19,26,.4) 45%,rgba(13,19,26,.1) 100%)"></div>
  <h2 class="titulo" style="left:120px;top:140px;font-size:80px;max-width:1300px">Quem tinha mais de R$ 250 mil <em>entrou na fila.</em></h2>
  <p class="sub" style="left:124px;top:360px;font-size:34px">A fila de quem só recebe se sobrar dinheiro do banco.</p>
  {marca()}
</section>"""

destino = f"""<section class="s">
  <div class="veu cheio"></div>
  <p class="eyebrow" style="left:120px;top:96px">Parte 2 · Segundo a investigação</p>
  <h2 class="titulo" style="left:120px;top:150px;font-size:80px">Para onde ia <em>o dinheiro?</em></h2>
  <div class="fluxo" style="top:470px">
    <div class="papel-f"><b>Dinheiro dos CDBs</b><span>captado de quem aplicou</span></div>{SETA}
    <div class="papel-f"><b>Fundos ligados</b><span>ao próprio banco</span></div>{SETA}
    <div class="papel-f escuro-f"><b>Papéis de empresas</b><span>em crise</span></div>
  </div>
  {fonte("a confirmar")}{marca()}
</section>"""

recorde = f"""<section class="s">
  <div class="fundo" style="background-image:url({il('guarda-chuva')});filter:saturate(.5) brightness(.35)"></div><div class="veu"></div>
  <p class="eyebrow centro" style="top:330px">Resultado</p>
  <h2 class="titulo centro" style="top:390px;font-size:100px;max-width:none">O maior acionamento<br><em>da história do FGC.</em></h2>
  {fonte("CNN Brasil, Transparência Internacional Brasil")}{marca()}
</section>"""

supremo = f"""<section class="s">
  <div class="fundo" style="background-image:url({il('supremo')});filter:saturate(.8) brightness(.85)"></div>
  <div class="veu" style="background:linear-gradient(90deg,rgba(13,19,26,.92) 0%,rgba(13,19,26,.55) 45%,rgba(13,19,26,0) 70%)"></div>
  <p class="eyebrow" style="left:120px;top:96px">Parte 3 · Quando o caso chegou ao Supremo</p>
  <h2 class="titulo" style="left:120px;top:300px;font-size:84px;max-width:900px">Até aqui, seria um caso de banco. <em>Ele virou outra coisa.</em></h2>
  <p class="sub" style="left:124px;top:640px;font-size:34px">E aqui entram três nomes.</p>
  {marca()}
</section>"""

relator = f"""<section class="s">
  <div class="fundo direita" style="background-image:url({foto('plenario.jpg')})"></div><div class="veu lado"></div>
  <p class="eyebrow" style="left:120px;top:96px">Parte 3 · Vocabulário</p>
  <h2 class="titulo" style="left:120px;top:150px;font-size:84px">Relator</h2>
  <p class="sub" style="left:124px;top:270px;font-size:38px">É o ministro que conduz o processo.</p>
  <div class="passos" style="top:470px;right:820px">
    <div><span class="n">1</span><b>O caso chega</b><p>O processo entra no Supremo.</p></div>
    <div><span class="n">2</span><b>Sorteio</b><p>Um ministro é sorteado relator.</p></div>
    <div><span class="n">3</span><b>Conduz</b><p>Decide os pedidos e leva o caso ao colegiado.</p></div>
  </div>
  {fonte("STF")}{marca()}
</section>"""

def marco(d, t, x, cima=True):
    return f'<div class="marco{" cima" if cima else ""}" style="left:{x}px"><time>{d}</time><p>{t}</p></div>'
linha = f"""<section class="s">
  <div class="veu cheio"></div>
  <p class="eyebrow" style="left:120px;top:96px">Parte 3 · Linha do tempo</p>
  <h2 class="titulo" style="left:120px;top:150px;font-size:72px">O caso no Supremo</h2>
  <div class="trilho"></div>
  {marco("14.03.2025", "Mendonça se reúne com Vorcaro no Instituto Iter", 140, True)}
  {marco("18.11.2025", "Liquidação do Master e prisão de Vorcaro", 470, False)}
  {marco("12.02.2026", "Toffoli deixa a relatoria. O caso vai para Mendonça", 800, True)}
  {marco("03.2026", "Vorcaro volta à prisão. A Segunda Turma confirma", 1130, False)}
  {marco("09.2026", "A reunião de 2025 e o relatório da PF vêm a público", 1460, True)}
  {fonte("Agência Pública, JOTA, CNN Brasil, Metrópoles")}{marca()}
</section>"""

toffoli = ficha_ministro("foto-toffoli.jpg", "Nelson Jr./STF", "01", "STF · RELATORIA DO CASO MASTER", "Dias Toffoli",
    "Primeiro relator do caso no Supremo",
    [("Antes da saída", "Reportagens ligam empresas de familiares dele a fundos investigados."),
     ("Antes da saída", "A PF encontra referências ao nome dele no celular de Vorcaro."),
     ("12.02.2026", "Pede para deixar a relatoria.")],
    "a resposta do ministro entra aqui, com fonte, antes da gravação.", "imprensa · confirmar no portal do STF")

moraes = ficha_ministro("foto-moraes.jpg", "Isac Nóbrega/PR", "03", "RELATÓRIO DA POLÍCIA FEDERAL · SET. 2026", "Alexandre de Moraes",
    "Ministro do STF",
    [("Contrato", "Escritório de Viviane Barci de Moraes, mulher do ministro, com o Master: cerca de R$ 130 milhões em três anos."),
     ("Mensagens", "No celular de Vorcaro, mensagens a um contato que a PF identificou como o ministro.")],
    "nega qualquer relação com Vorcaro e diz que não recebeu essas mensagens.", "Agência Pública, Metrópoles")

msg = f"""<section class="s">
  <div class="fundo" style="background-image:url({foto('celular.jpg')});filter:saturate(.5) brightness(.35)"></div><div class="veu"></div>
  <p class="eyebrow centro" style="top:250px">Mensagem do dia da prisão</p>
  <p class="aspas centro" style="top:330px">“conseguiu ter notícia<br>ou bloquear?”</p>
  <p class="sub centro" style="top:690px;font-size:28px">Atribuída pela PF a Vorcaro. Moraes nega ter recebido.<br>As respostas do outro lado nunca foram encontradas.</p>
  {fonte("Agência Pública, Metrópoles")}{marca()}
</section>"""

gilmar = f"""<section class="s">
  <div class="veu cheio"></div>
  <div class="prova" style="left:150px;top:190px;width:440px;transform:rotate(-2deg)">
    <img src="{foto('foto-gilmar.jpg')}" alt=""><span class="clip"></span><p>Gilmar Mendes · foto: Alejandro Zambrana/Secom/TSE</p></div>
  <p class="aspas" style="left:720px;top:330px;font-size:120px;text-align:left">“Até a máfia<br>tem ética.”</p>
  <p class="sub" style="left:726px;top:640px;font-size:30px">Gilmar Mendes, ministro do STF, em sessão do tribunal.</p>
  {fonte("Metrópoles, Terra")}{marca()}
</section>"""

perguntas = f"""<section class="s">
  <div class="fundo direita" style="background-image:url({foto('cadeira.jpg')})"></div><div class="veu lado"></div>
  <p class="eyebrow" style="left:120px;top:96px">Parte 4 · O que a lei diz, sem juridiquês</p>
  <ol class="tres" style="top:260px">
    <li><span>1</span>Se ele está preso, ele é culpado?</li>
    <li><span>2</span>Um juiz que conhece uma das partes pode julgar o caso?</li>
    <li><span>3</span>Quem julga um ministro do Supremo?</li>
  </ol>
  {marca()}
</section>"""

preso = f"""<section class="s">
  <div class="veu cheio"></div>
  <p class="eyebrow" style="left:120px;top:96px">Pergunta 1</p>
  <h2 class="titulo" style="left:120px;top:150px;font-size:80px">Preso <em>ainda não é culpado.</em></h2>
  <div class="etapas" style="top:540px">
    <div class="on"><b>Investigação</b><small>prisão antes do julgamento protege a investigação</small><i>ele está aqui</i></div>
    <div><b>Denúncia</b></div><div><b>Julgamento</b></div><div class="fim"><b>Sentença</b><small>culpa, só a partir daqui</small></div>
  </div>
  {fonte("Constituição Federal, art. 5º, LVII · Código de Processo Penal, art. 312")}{marca()}
</section>"""

cpp = f"""<section class="s">
  <div class="veu cheio"></div>
  <p class="eyebrow" style="left:120px;top:96px">Pergunta 2 · Código de Processo Penal</p>
  <div class="artigo" style="left:120px;top:220px;transform:rotate(-1deg)">
    <p class="num">Art. 252</p><p>O juiz não atua em processo em que o <b>cônjuge</b> atuou como <b>advogado</b>.</p><small>impedimento</small></div>
  <div class="artigo" style="left:1000px;top:250px;transform:rotate(.8deg)">
    <p class="num">Art. 254</p><p>O juiz se afasta se for <b>amigo íntimo</b> ou <b>inimigo</b> de uma das partes.</p><small>suspeição</small></div>
  <p class="sub" style="left:124px;top:820px;font-size:32px">Se alguma dessas regras se aplica, quem decide é o próprio Supremo.</p>
  {fonte("Código de Processo Penal")}{marca()}
</section>"""

fecho = f"""<section class="s">
  <div class="fundo" style="background-image:url({foto('sala.jpg')});filter:saturate(.5) brightness(.45)"></div><div class="veu"></div>
  <h2 class="titulo centro" style="top:380px;font-size:96px;max-width:none">Quem deve julgar,<br><em>quando todo mundo<br>conhece todo mundo?</em></h2>
  {marca()}
</section>"""

ordem = [abre, t1, liquida, data18, cdb, seguro, t2, fila, destino, recorde, supremo, relator, linha,
         toffoli, t3, moraes, msg, gilmar, perguntas, preso, cpp, t4, fecho]

html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>A Sala ep01 telas</title><style>
{fontes()}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#222;display:grid;gap:30px;padding:30px;font-family:'Gotham',sans-serif}}
.s{{position:relative;width:1920px;height:1080px;overflow:hidden;background:#0d131a;color:#fff}}
.fundo{{position:absolute;inset:0;background-size:cover;background-position:center;filter:saturate(.7) brightness(.55)}}
.fundo.direita{{left:auto;width:820px;filter:saturate(.6) brightness(.7)}}
.veu{{position:absolute;inset:0;background:radial-gradient(80% 90% at 50% 45%,rgba(13,19,26,.35),rgba(13,19,26,.92))}}
.veu.cheio{{background:radial-gradient(70% 80% at 60% 40%,#132436 0%,#0d131a 70%)}}
.veu.lado{{background:linear-gradient(90deg,#0d131a 0%,#0d131a 52%,rgba(13,19,26,.55) 70%,rgba(13,19,26,.2) 100%)}}
.eyebrow{{position:absolute;font:500 20px/1 'Gotham';letter-spacing:.14em;text-transform:uppercase;color:#f0b855}}
.titulo{{position:absolute;font:900 92px/1.02 'Gotham';letter-spacing:-.03em;max-width:1100px}}
.titulo em{{font-style:italic;font-weight:400;color:#d1d3d4}}
.fonte{{position:absolute;left:120px;bottom:70px;font:300 20px/1 'Gotham';color:rgba(209,211,212,.7);letter-spacing:.02em}}
.marca{{position:absolute;right:120px;bottom:56px;font:300 20px/1 'Gotham';letter-spacing:.5em;padding:12px 8px 12px 20px;border:1px solid rgba(209,211,212,.4);color:rgba(236,235,231,.85)}}
.fio{{position:absolute;inset:0}}
.ficha{{position:absolute;width:420px;background:#ecebe7;color:#0d131a;padding:26px 28px 30px;border-radius:2px;
  box-shadow:0 30px 60px -20px rgba(0,0,0,.8);font-family:'Elite';display:grid;gap:8px}}
.ficha::before{{content:"";position:absolute;top:-10px;left:50%;width:18px;height:18px;margin-left:-9px;border-radius:50%;
  background:radial-gradient(circle at 35% 35%,#f0b855,#9b6b26);box-shadow:0 3px 6px rgba(0,0,0,.6)}}
.ficha b{{font:900 34px/1.05 'Gotham';letter-spacing:-.02em;color:#031c37}}
.ficha span{{font-size:22px;color:#414042}}
.ficha i{{font-style:normal;font-size:21px;line-height:1.35;color:#0d131a;border-top:1px dashed rgba(13,19,26,.35);padding-top:10px;margin-top:4px}}
.tarja-foto,.sigla{{height:150px;display:grid;place-items:center;margin-bottom:10px;font:900 64px/1 'Gotham';letter-spacing:.06em}}
.tarja-foto{{background:#0d131a;color:rgba(236,235,231,.18)}}
.sigla{{background:#d1d3d4;color:#304557}}
.ficha.larga{{width:560px;grid-template-columns:auto 1fr;align-items:center;gap:22px}}
.numero{{white-space:nowrap;font:900 96px/1 'Gotham';letter-spacing:-.04em;color:#9b6b26}}
.regua{{position:absolute;left:120px;right:120px;top:380px;height:150px;display:flex;border-radius:4px;overflow:hidden;
  box-shadow:0 30px 60px -30px rgba(0,0,0,.9)}}
.trecho{{display:flex;flex-direction:column;justify-content:center;padding:0 36px;gap:10px}}
.trecho span{{font:900 56px/1 'Gotham';letter-spacing:-.02em}}
.trecho small{{font:500 20px/1 'Gotham';letter-spacing:.14em;text-transform:uppercase}}
.coberto{{background:#f0b855;color:#0d131a}}
.fila{{background:repeating-linear-gradient(135deg,#304557 0 14px,#26394a 14px 28px);color:#d1d3d4}}
.exemplo{{position:absolute;left:120px;top:560px;font:300 28px/1.3 'Gotham';color:#d1d3d4}}
.exemplo b{{font-weight:500;color:#fff}}
.regras{{position:absolute;left:120px;right:120px;top:700px;display:grid;grid-template-columns:repeat(3,1fr);gap:40px;
  border-top:1px solid rgba(209,211,212,.25);padding-top:30px}}
.regras b{{display:block;font:900 40px/1 'Gotham';color:#fff;margin-bottom:10px}}
.regras span{{font:300 24px/1.35 'Gotham';color:#d1d3d4}}
.prova{{position:absolute;width:540px;background:#ecebe7;padding:22px 22px 18px;box-shadow:0 40px 70px -20px rgba(0,0,0,.9)}}
.prova img{{width:100%;display:block}}
.prova p{{font:15px/1.3 'Elite';color:#414042;margin-top:12px}}
.clip{{position:absolute;top:-22px;left:60px;width:34px;height:80px;border:5px solid #9aa0a4;border-radius:18px;border-bottom-color:transparent}}
.dossie{{position:absolute;width:960px;background:#ecebe7;color:#0d131a;padding:56px 64px 60px;font-family:'Elite';
  box-shadow:0 40px 70px -20px rgba(0,0,0,.9);transform:rotate(.6deg)}}
.dossie .cab{{font-size:18px;letter-spacing:.18em;color:#5f6062;border-bottom:1px solid rgba(13,19,26,.3);padding-bottom:16px}}
.dossie h3{{font:900 64px/1 'Gotham';letter-spacing:-.025em;color:#031c37;margin-top:28px}}
.dossie .papel{{font-size:24px;color:#414042;margin-top:12px}}
.linha{{list-style:none;margin-top:34px;display:grid;gap:18px;border-left:2px solid #9b6b26;padding-left:28px}}
.linha li{{font-size:24px;line-height:1.35;position:relative}}
.linha li::before{{content:"";position:absolute;left:-37px;top:8px;width:16px;height:16px;border-radius:50%;background:#9b6b26}}
.linha time{{display:block;font:500 18px/1 'Gotham';letter-spacing:.14em;color:#9b6b26;margin-bottom:6px}}
.diz{{margin-top:34px;font-size:23px;line-height:1.4;background:rgba(209,211,212,.45);padding:18px 22px}}
.caminho{{position:absolute;left:120px;display:grid;grid-template-columns:420px 230px auto;align-items:center;column-gap:20px}}
.caminho .tipo{{font:300 36px/1.15 'Gotham';color:#d1d3d4}}
.caminho svg{{width:220px}}
.caminho .quem{{font:900 50px/1 'Gotham';letter-spacing:-.02em}}
.caminho small{{grid-column:3;font:400 20px/1 'Gotham';color:#f0b855;letter-spacing:.06em;margin-top:12px}}

.centro{{left:0;right:0;text-align:center;margin:auto}}
.mega{{position:absolute;font:900 200px/1 'Gotham';letter-spacing:-.045em;color:#f0b855}}
.sub{{position:absolute;font:300 40px/1.35 'Gotham';color:#d1d3d4}}
.passos{{position:absolute;left:120px;right:120px;display:grid;grid-template-columns:repeat(3,1fr);gap:40px}}
.passos div{{border-top:2px solid #f0b855;padding-top:26px;display:grid;gap:12px;align-content:start}}
.passos .n{{font:200 64px/1 'Gotham';color:#f0b855}}
.passos b{{font:900 40px/1.05 'Gotham';letter-spacing:-.02em}}
.passos p{{font:300 26px/1.35 'Gotham';color:#d1d3d4}}
.cartela{{position:absolute;width:900px;background:#ecebe7;color:#0d131a;padding:56px 64px;font-family:'Elite';box-shadow:0 40px 70px -20px rgba(0,0,0,.9);transform:rotate(-.8deg)}}
.cartela .data{{font:900 110px/1 'Gotham';letter-spacing:-.04em;color:#031c37;margin-bottom:26px}}
.cartela .fato{{font-size:38px;line-height:1.35}}
.cartela .nota{{font-size:24px;color:#414042;margin-top:26px;border-top:1px dashed rgba(13,19,26,.35);padding-top:18px}}
.ciclo{{position:absolute;left:120px;display:flex;align-items:center;gap:22px}}
.ciclo .no{{width:200px;height:200px;border-radius:50%;border:2px solid #f0b855;display:grid;place-items:center;font:900 38px/1 'Gotham'}}
.ciclo .liga{{display:grid;gap:10px;justify-items:center}}
.ciclo .liga small{{font:400 22px/1 'Gotham';color:#d1d3d4}}
.seta{{width:120px}}
.destaque{{position:absolute;font:300 34px/1.45 'Gotham';color:#d1d3d4}}
.destaque b{{font-weight:900;color:#fff}}.destaque em{{color:#f0b855}}
.fluxo{{position:absolute;left:120px;right:120px;display:flex;align-items:center;gap:26px}}
.papel-f{{flex:1;background:#ecebe7;color:#0d131a;padding:40px 36px;display:grid;gap:10px;box-shadow:0 30px 60px -20px rgba(0,0,0,.8)}}
.papel-f b{{font:900 38px/1.05 'Gotham';color:#031c37}}.papel-f span{{font:24px/1.3 'Elite';color:#414042}}
.papel-f.escuro-f{{background:#304557;color:#fff}}.papel-f.escuro-f b{{color:#fff}}.papel-f.escuro-f span{{color:#d1d3d4}}
.trilho{{position:absolute;left:120px;right:120px;top:640px;height:2px;background:#f0b855}}
.marco{{position:absolute;width:300px;top:680px;display:grid;gap:10px}}
.marco::before{{content:"";position:absolute;left:0;top:-49px;width:16px;height:16px;border-radius:50%;background:#f0b855}}
.marco.cima{{top:auto;bottom:470px}}.marco.cima::before{{top:auto;bottom:-49px}}
.marco time{{font:500 22px/1 'Gotham';letter-spacing:.12em;color:#f0b855}}
.marco p{{font:300 26px/1.3 'Gotham';color:#ecebe7}}
.aspas{{position:absolute;font:italic 400 110px/1.08 'Gotham';letter-spacing:-.03em;color:#fff}}
.tres{{position:absolute;left:120px;width:1000px;list-style:none;display:grid;gap:44px}}
.tres li{{display:grid;grid-template-columns:90px 1fr;align-items:baseline;font:900 50px/1.12 'Gotham';letter-spacing:-.02em}}
.tres span{{font:200 64px/1 'Gotham';color:#f0b855}}
.etapas{{position:absolute;left:120px;right:120px;display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:2px solid rgba(209,211,212,.3)}}
.etapas div{{position:relative;padding-top:34px;display:grid;gap:12px;align-content:start;padding-right:30px}}
.etapas div::before{{content:"";position:absolute;top:-10px;left:0;width:18px;height:18px;border-radius:50%;background:#304557}}
.etapas div.on::before,.etapas div.fim::before{{background:#f0b855}}
.etapas b{{font:900 36px/1 'Gotham'}}
.etapas small{{font:300 24px/1.35 'Gotham';color:#d1d3d4}}
.etapas i{{font:500 20px/1 'Gotham';letter-spacing:.14em;text-transform:uppercase;font-style:normal;color:#0d131a;background:#f0b855;justify-self:start;padding:8px 12px}}
.artigo{{position:absolute;width:800px;background:#ecebe7;color:#0d131a;padding:48px 56px;font:30px/1.45 'Elite';box-shadow:0 40px 70px -20px rgba(0,0,0,.9);display:grid;gap:18px}}
.artigo .num{{font:900 64px/1 'Gotham';color:#031c37;letter-spacing:-.02em}}
.artigo b{{color:#9b6b26;font-weight:400;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:6px}}
.artigo small{{font:500 18px/1 'Gotham';letter-spacing:.16em;text-transform:uppercase;color:#5f6062}}
</style></head><body>
{"".join(ordem)}
</body></html>"""

(OUT / "telas.html").write_text(html, encoding="utf-8")
print("ok")
