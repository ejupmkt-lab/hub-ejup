#!/usr/bin/env python3
"""Peças para o mural de cortiça de A Sala, ep. 01 (caso Master), em PNG a 300 dpi.
Regras: nenhuma foto de pessoa no mural (montagem de "quadro de provas" com rosto
sugere culpa, e o roteiro proíbe); nenhum documento falso com nome real; todo fato
com fonte no roteiro (docs/formatos/a-sala-ep01-caso-master.md). Fotos só de
prédios, do Wikimedia Commons, com crédito em ../mural/CREDITOS.md."""
import base64, io, pathlib
from PIL import Image, ImageEnhance, ImageOps, ImageFilter
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "mural"; OUT.mkdir(exist_ok=True)
RAIZ = HERE.parents[2]
FOTOS = RAIZ / "peças" / "carrossel-quem-julga-ministro" / "fotos"
FON = RAIZ / "skills" / "ejup-design" / "assets" / "fonts"

def pb(nome, larg=1600):
    im = Image.open(FOTOS / nome).convert("L")
    if im.width > larg: im = im.resize((larg, round(im.height * larg / im.width)), Image.LANCZOS)
    im = ImageEnhance.Contrast(ImageOps.autocontrast(im, cutoff=1)).enhance(1.15)
    im = ImageOps.colorize(im, "#141414", "#efeae0")
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=90)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

black = base64.b64encode((HERE / "fontes" / "SpecialElite-Regular.ttf").read_bytes()).decode()   # máquina de escrever (Apache 2.0)

GRAO = """<svg class="grao" xmlns="http://www.w3.org/2000/svg"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" seed="4"/>
<feColorMatrix values="0 0 0 0 .35  0 0 0 0 .3  0 0 0 0 .22  0 0 0 .22 0"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>"""

def papel(w, h, corpo, cls="papel"):
    return f'<div class="peca {cls}" style="width:{w}mm;height:{h}mm">{GRAO}<div class="in">{corpo}</div></div>'

def foto(nome, w, h, legenda):
    return (f'<div class="peca foto" style="width:{w}mm;height:{h}mm">'
            f'<div class="img" style="background-image:url({pb(nome)})"></div>'
            f'<p class="leg">{legenda}</p>{GRAO}</div>')

def ficha(data, titulo, linha):
    return papel(125, 75, f'<div class="topo"><span>A SALA · EP. 01</span><span>FICHA</span></div>'
                          f'<p class="data">{data}</p><p class="tit">{titulo}</p><p class="txt">{linha}</p>'
                          f'<div class="pautas"></div>')

T = lambda n: f'<span class="t" style="width:{n}ch"></span>'

PECAS = {
 "01-foto-stf-fachada": foto("stf-fachada.jpg", 150, 100, "STF · Brasília"),
 "02-foto-stf-colunata": foto("colunata.jpg", 100, 150, "Colunata · Praça dos Três Poderes"),
 "03-foto-antigo-stf": foto("antigo-stf.jpg", 150, 100, "Antigo edifício do STF · Rio de Janeiro"),
 "04-foto-senado": foto("senado-plenario.jpg", 150, 100, "Plenário do Senado Federal"),
 "05-ficha-liquidacao": ficha("18.11.2025", "Liquidação do Banco Master", "Banco Central decreta a liquidação extrajudicial. No mesmo dia, operação Compliance Zero."),
 "06-ficha-relatoria": ficha("12.02.2026", "Troca de relatoria no STF", "Dias Toffoli deixa a relatoria. O processo é sorteado para André Mendonça."),
 "07-ficha-nova-prisao": ficha("03.2026", "Nova prisão", "Confirmada pela Segunda Turma do STF."),
 "08-ficha-relatorio-pf": ficha("09.2026", "Relatório da PF", "Contrato de escritório e mensagens atribuídas pela PF. Moraes nega."),
 "09-numero-credores": papel(105, 148, '<p class="rot">CREDORES</p><p class="big">1,6<br>milhão</p><p class="txt">pessoas com dinheiro aplicado no banco na data da liquidação</p>'),
 "10-numero-fgc": papel(105, 148, '<p class="rot">TETO DO FGC</p><p class="big">R$ 250<br>mil</p><p class="txt">por pessoa, por instituição. Acima disso, entra na fila da liquidação.</p>'),
 "11-lei-cpp-252-254": papel(148, 105, '<p class="rot">CÓDIGO DE PROCESSO PENAL</p><p class="art">Art. 252</p><p class="txt">O juiz não atua no processo em que o cônjuge tiver funcionado como advogado.</p><p class="art">Art. 254</p><p class="txt">O juiz se dá por suspeito se for amigo íntimo ou inimigo capital de qualquer das partes.</p>'),
 "12-lei-cf-quem-julga": papel(148, 105, '<p class="rot">CONSTITUIÇÃO FEDERAL</p><p class="art">Art. 102, I, "b"</p><p class="txt">Ministro do STF, em crime comum, é julgado pelo próprio Supremo.</p><p class="art">Art. 52, II</p><p class="txt">Em crime de responsabilidade, pelo Senado Federal.</p>'),
 "13-comprovante-cdb": papel(80, 140, f'<p class="rot">COMPROVANTE DE APLICAÇÃO</p><div class="cupom"><p>Produto ........ CDB</p><p>Instituição .... {T(9)}</p><p>Garantia ....... FGC</p><p>Vencimento ..... {T(8)}</p><p class="circ">Rentab. ....... {T(4)}% CDI</p><p>Valor .......... R$ {T(9)}</p></div><p class="rodape">Documento ilustrativo · sem valor</p>', "papel cupom-p"),
 "14-pergunta": papel(148, 105, '<p class="q">Quem julga,<br>quando todo mundo<br>conhece todo mundo?</p>'),
 "15-tarjas": papel(148, 105, f'<p class="rot">FOLHA 5/7 · {T(10)}</p><span class="linha" style="width:96%"></span><span class="linha" style="width:88%"></span><p class="txt">Segundo o relatório, {T(22)} e {T(14)}.</p><span class="linha" style="width:92%"></span><span class="linha" style="width:70%"></span><span class="linha" style="width:84%"></span>'),
}

CSS = f"""@font-face{{font-family:SE;src:url(data:font/ttf;base64,{black})}}
*{{margin:0;box-sizing:border-box}} body{{background:#555;padding:10mm;display:flex;flex-wrap:wrap;gap:10mm}}
.peca{{position:relative;overflow:hidden;flex:none}}
.grao{{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:multiply}}
.papel{{background:radial-gradient(120% 120% at 40% 35%,#f4efe4 0%,#ebe4d4 70%,#ddd3bf 100%);color:#1b1b1b;font-family:SE,'Liberation Mono',monospace}}
.papel .in{{position:absolute;inset:0;padding:8mm 9mm}}
.topo{{display:flex;justify-content:space-between;font-size:7.5pt;letter-spacing:.14em;border-bottom:.5pt solid #1b1b1b;padding-bottom:2mm}}
.data{{font-family:SE;font-weight:400;font-size:26pt;letter-spacing:-.01em;margin-top:5mm}}
.tit{{font-weight:400;font-size:12pt;margin-top:1mm;text-transform:uppercase;letter-spacing:.04em}}
.txt{{font-size:10pt;line-height:1.45;margin-top:2.5mm}}
.pautas{{position:absolute;left:9mm;right:9mm;bottom:8mm;height:10mm;background:repeating-linear-gradient(transparent 0 4.6mm,#9b6b26 4.6mm 4.8mm);opacity:.45}}
.rot{{font-size:8.5pt;letter-spacing:.16em}}
.big{{font-family:SE;font-weight:400;font-size:48pt;line-height:.95;letter-spacing:-.02em;margin:14mm 0 6mm}}
.art{{font-family:SE;font-weight:400;font-size:15pt;margin-top:5mm}}
.q{{font-family:SE;font-weight:400;font-size:24pt;line-height:1.1;letter-spacing:-.01em;margin-top:18mm;text-align:center}}
.cupom{{margin-top:6mm;font-size:9pt;line-height:2}}
.circ{{position:relative}} .circ:after{{content:"";position:absolute;left:-2mm;right:4mm;top:-1mm;bottom:-1mm;border:.6mm solid #c1272d;border-radius:50%;transform:rotate(-3deg)}}
.rodape{{position:absolute;bottom:8mm;left:9mm;font-size:6.5pt;color:#666}}
.t{{display:inline-block;height:1em;background:#111;vertical-align:-.12em}}
.linha{{display:block;height:3.4mm;background:#111;margin:3mm 0}}
.foto{{background:#f3f0e8;padding:5mm 5mm 13mm}}
.foto .img{{position:absolute;left:5mm;right:5mm;top:5mm;bottom:13mm;background-size:cover;background-position:center}}
.foto .leg{{position:absolute;left:6mm;bottom:4mm;font-family:SE,'Liberation Mono',monospace;font-size:8pt;color:#333}}
"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1400, "height": 900}, device_scale_factor=300 / 96)
    for nome, html in PECAS.items():
        pg.set_content(f"<html><head><meta charset='utf-8'><style>{CSS}</style></head><body>{html}</body></html>")
        pg.wait_for_timeout(250)
        pg.locator(".peca").first.screenshot(path=str(OUT / f"{nome}.png"))
    b.close()
print(len(PECAS), "peças")
