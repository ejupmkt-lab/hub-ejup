#!/usr/bin/env python3
"""Folha cenográfica de A Sala, episódio 01 (caso Master): o "relatório com tarjas".
A4 para impressão. Conteúdo tirado do roteiro (docs/formatos/a-sala-ep01-caso-master.md),
só com fatos que têm fonte. As tarjas cobrem referências internas e fontes, nunca a
resposta de quem foi citado. Cabeçalho da própria EJUP, sem imitar órgão público."""
import base64, pathlib
from playwright.sync_api import sync_playwright
OUT = pathlib.Path(__file__).resolve().parent.parent
SE = base64.b64encode((pathlib.Path(__file__).resolve().parent / "fontes" / "SpecialElite-Regular.ttf").read_bytes()).decode()

T = lambda n: f'<span class="t" style="width:{n}ch"></span>'   # tarja com largura em caracteres

HTML = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
@font-face {{ font-family: SE; src: url(data:font/ttf;base64,{SE}) }}
@page {{ size: A4; margin: 0 }}
* {{ box-sizing: border-box; margin: 0 }}
body {{ width: 210mm; height: 297mm; background: #fbfaf7; color: #1b1b1b;
  font-family: SE, 'Liberation Mono', monospace; font-size: 9.6pt; line-height: 1.45;
  padding: 16mm 18mm 22mm 20mm; position: relative }}
.topo {{ display: flex; justify-content: space-between; border-bottom: 1.2pt solid #1b1b1b; padding-bottom: 3mm; font-size: 9pt; letter-spacing: .08em }}
.topo b {{ font-weight: 700 }}
h1 {{ font-size: 14pt; font-weight: 700; letter-spacing: .06em; margin: 5mm 0 1mm }}
.sub {{ font-size: 9.2pt; color: #444 }}
.ficha {{ margin: 4mm 0 3mm; border: .8pt solid #1b1b1b; padding: 3mm 4mm; font-size: 9.4pt; display: grid; grid-template-columns: 38mm 1fr; row-gap: 1mm }}
h2 {{ font-size: 10pt; font-weight: 700; letter-spacing: .05em; margin: 4mm 0 1.5mm }}
p {{ margin: 0 0 2.2mm; text-align: justify }}
ol {{ padding-left: 6mm; margin: 0 }} li {{ margin-bottom: 1.4mm; text-align: justify }}
.d {{ font-weight: 700 }}
.t {{ display: inline-block; height: 1.02em; background: #111; vertical-align: -.16em; margin: 0 .15ch }}
.linha {{ display: block; height: 1.02em; background: #111; margin: 1.6mm 0 }}
.rod {{ position: absolute; left: 20mm; right: 18mm; bottom: 10mm; display: flex; justify-content: space-between;
  font-size: 7.6pt; color: #666; border-top: .6pt solid #999; padding-top: 2mm }}
</style></head><body>
<div class="topo"><span><b>EJUP · A SALA</b> · DOSSIÊ DE ESTUDO</span><span>USO INTERNO · FOLHA 3/7</span></div>
<h1>RELATÓRIO DE LEITURA · CASO MASTER</h1>
<div class="sub">Episódio 01. Síntese do que foi publicado até setembro de 2026. Reconferir no dia da gravação.</div>

<div class="ficha">
  <span>Referência</span><span>AS-01/{T(6)}</span>
  <span>Assunto</span><span>Liquidação do Banco Master e investigação no STF</span>
  <span>Situação</span><span>Em andamento. Ninguém foi julgado até esta data.</span>
  <span>Preparado por</span><span>{T(22)}</span>
</div>

<h2>1. CRONOLOGIA</h2>
<ol>
<li><span class="d">14.03.2025</span> · Reunião de Daniel Vorcaro com o ministro André Mendonça, em São Paulo, antes de ele se tornar relator. Mendonça confirma o encontro e diz que foi uma única vez, sobre outro processo. {T(14)}</li>
<li><span class="d">18.11.2025</span> · Banco Central decreta a liquidação extrajudicial do Banco Master. No mesmo dia, operação Compliance Zero: a Polícia Federal prende Vorcaro no aeroporto de Guarulhos.</li>
<li><span class="d">12.02.2026</span> · O ministro Dias Toffoli deixa a relatoria do caso no STF. O processo é sorteado para André Mendonça. {T(18)}</li>
<li><span class="d">03.2026</span> · Nova prisão de Vorcaro, confirmada pela Segunda Turma do STF. {T(26)}</li>
<li><span class="d">09.2026</span> · Relatório da PF aponta contrato de cerca de R$ 130 milhões entre o banco e o escritório de Viviane Barci de Moraes, e mensagens atribuídas pela PF a um contato identificado como o ministro Alexandre de Moraes. Moraes nega relação com Vorcaro e diz não ter recebido as mensagens.</li>
</ol>

<h2>2. NÚMEROS</h2>
<p>Cerca de 1,6 milhão de credores. Maior acionamento da história do Fundo Garantidor de Créditos, com garantia de até R$ 250 mil por pessoa, por instituição. Valor total pago: {T(12)} (fontes divergem; não citar).</p>

<h2>3. O QUE A LEI DIZ</h2>
<p>A prisão antes do julgamento serve à investigação; a culpa depende de sentença definitiva (CF, art. 5º, LVII). O juiz não atua em processo em que o cônjuge tenha atuado como advogado (CPP, art. 252) e se afasta se for amigo íntimo ou inimigo de uma das partes (CPP, art. 254). Ministro do STF responde por crime comum no próprio STF (CF, art. 102, I, "b") e por crime de responsabilidade no Senado (CF, art. 52, II).</p>

<h2>4. OBSERVAÇÕES</h2>
<span class="linha" style="width:92%"></span>
<span class="linha" style="width:78%"></span>
<p>Toda citação de nome vai ao ar com a fonte e com a resposta de quem foi citado. {T(20)}</p>

<div class="rod"><span>Fontes: JOTA · CNN Brasil · Agência Pública · Metrópoles · TI Brasil · CF · CPP</span><span style="margin-left:6mm;white-space:nowrap">Material cenográfico · EJUP</span></div>
</body></html>"""

(OUT / "relatorio-com-tarjas.html").write_text(HTML, encoding="utf-8")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 794, "height": 1123}, device_scale_factor=3.125)
    pg.set_content(HTML); pg.wait_for_timeout(300)
    pg.pdf(path=str(OUT / "relatorio-com-tarjas-A4.pdf"), format="A4", print_background=True)
    pg.screenshot(path=str(OUT / "relatorio-com-tarjas-A4.png"), full_page=False)
    b.close()
print("ok")
