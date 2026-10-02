#!/usr/bin/env python3
"""A Sala · ep. 01 · telas de apoio ao roteiro (1920x1080, para inserir na edição).

Linguagem: a da vinheta e do set. Fundo tinta, papel de dossiê, texto de
máquina de escrever (Special Elite) nos documentos, Gotham nos títulos, fio
dourado ligando as peças. Imagens reaproveitadas do carrossel do caso
(peças/carrossel-caso-vorcaro/_build/img), sem custo novo.

Amostra para aprovação: quatro telas, uma de cada tipo.
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
</style></head><body>
{t1}
{t2}
{t3}
{t4}
</body></html>"""

(OUT / "telas.html").write_text(html, encoding="utf-8")
print("ok")
