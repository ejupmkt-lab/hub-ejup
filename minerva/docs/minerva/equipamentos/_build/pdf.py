#!/usr/bin/env python3
"""Orçamento dos equipamentos em PDF (A4), a partir dos mesmos dados da planilha."""
import html, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
RAIZ = HERE.parents[3]
OUT = HERE.parent / "Orcamento_Equipamentos_EJUP.pdf"
DS = RAIZ / "skills" / "ejup-design" / "assets"
import base64
FONTE = lambda n: "data:font/otf;base64," + base64.b64encode((DS / "fonts" / f"Gotham-{n}.otf").read_bytes()).decode()
LOGO = (DS / "logo" / "ejup-horizontal-navy.svg").read_text()

ns = {"__file__": str(HERE / "orcamento.py")}
exec((HERE / "orcamento.py").read_text().split("AZUL = Font")[0], ns)
ITENS, LOJAS, DATA = ns["ITENS"], ns["LOJAS"], ns["DATA"]


def brl(v):
    return "R$ " + f"{v:,.0f}".replace(",", ".")


e = html.escape
cats = []
for it in ITENS:
    if it[0] not in cats:
        cats.append(it[0])
tot_cat = {c: (sum(q * m for k, _, q, m, n, *_ in ITENS if k == c), sum(q * n for k, _, q, m, n, *_ in ITENS if k == c))
           for c in cats}
TM = sum(v[0] for v in tot_cat.values())
TN = sum(v[1] for v in tot_cat.values())

resumo = "".join(f"<tr><td>{e(c)}</td><td class='n'>{brl(m)}</td><td class='n'>{brl(n)}</td></tr>"
                 for c, (m, n) in tot_cat.items())

blocos = ""
for c in cats:
    linhas = ""
    for k, item, q, m, n, onde, link, obs in ITENS:
        if k != c:
            continue
        linhas += (f"<tr><td class='item'><a href='{e(link)}'>{e(item)}</a><span>{e(obs)}</span></td>"
                   f"<td class='c'>{q}</td><td class='n'>{brl(m)}</td><td class='n forte'>{brl(q * m)}</td>"
                   f"<td class='n leve'>{brl(q * n)}</td><td class='onde'>{e(onde)}</td></tr>")
    m, n = tot_cat[c]
    blocos += f"""<section class="cat">
<table class="itens"><thead><tr><th colspan="6" class="tit"><h2>{e(c)}</h2></th></tr><tr><th>Item</th><th class='c'>Qtd</th><th class='n'>Preço médio</th>
<th class='n'>Subtotal</th><th class='n'>No menor preço</th><th>Onde comprar</th></tr></thead>
<tbody>{linhas}<tr class="sub"><td>Total de {e(c.lower())}</td><td></td><td></td><td class='n'>{brl(m)}</td>
<td class='n'>{brl(n)}</td><td></td></tr></tbody></table></section>"""

lojas = "".join(f"<tr><td class='loja'>{e(a)}</td><td>{e(b)}</td><td>{e(c)}</td></tr>" for a, b, c in LOJAS)

TROCAS = [
    "Aputure LS 120D II saiu de linha. No lugar, o amaran 200d S, da mesma fabricante, mais forte e com o mesmo encaixe do octabox.",
    "Tamron 17-28 f/2.8 saiu de linha. No lugar, a sucessora Tamron 16-30 f/2.8 G2, cerca de R$ 450 a mais.",
    "Microfone BM-800 (condensador) trocado pelo Fifine K688 (dinâmico), que capta menos o barulho da sala.",
    "Cartões das câmeras em V90 no lugar de V60, para gravar qualquer formato da FX30.",
    "Lark M3 no kit de 2 receptores: o de 1 receptor só tem saída USB-C e não liga na câmera.",
    "Zoom PodTrak P4 está saindo de linha. Se não houver estoque, o substituto é o P4next, que usa cartão microSD.",
    "SSD SanDisk de 2 TB na versão externa Portable (800 MB/s, USB-C). O de 560 MB/s é interno e precisaria de case, saindo mais caro.",
]
trocas = "".join(f"<li>{e(t)}</li>" for t in TROCAS)

CSS = f"""
@font-face{{font-family:G;src:url("{FONTE('Light')}");font-weight:300}}
@font-face{{font-family:G;src:url("{FONTE('Book')}");font-weight:400}}
@font-face{{font-family:G;src:url("{FONTE('Medium')}");font-weight:500}}
@font-face{{font-family:G;src:url("{FONTE('Bold')}");font-weight:700}}
@font-face{{font-family:G;src:url("{FONTE('Black')}");font-weight:900}}
@page{{size:A4;margin:16mm 14mm 18mm}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:G,Montserrat,sans-serif;font-weight:300;font-size:8.6pt;line-height:1.38;color:#414042}}
a{{color:#031c37;text-decoration:none}}
.topo{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1.2pt solid #031c37;padding-bottom:5mm}}
.topo svg{{height:9mm;width:auto}}
.topo .data{{font-size:8pt;color:#5f6062;text-align:right}}
h1{{font-weight:900;font-size:24pt;line-height:1.05;letter-spacing:-.02em;color:#031c37;margin:8mm 0 2mm}}
.sub-t{{font-size:10pt;color:#5f6062;max-width:150mm}}
.total{{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin:7mm 0 5mm}}
.caixa{{background:#031c37;color:#fff;padding:5mm 6mm;border-radius:2px}}
.caixa.clara{{background:#eef1f5;color:#031c37}}
.caixa small{{display:block;font-weight:400;font-size:8.6pt;opacity:.85}}
.caixa b{{display:block;font-weight:900;font-size:22pt;letter-spacing:-.02em;margin-top:1mm}}
.caixa.escura b{{color:#f0b855}}
.caixa span{{display:block;font-size:7.6pt;margin-top:1.5mm;opacity:.8}}
table{{width:100%;border-collapse:collapse}}
.resumo td{{padding:2mm 0;border-bottom:.5pt solid #d1d3d4;font-size:9.4pt}}
.resumo th{{text-align:left;font-weight:500;font-size:8pt;color:#5f6062;padding-bottom:1.5mm;border-bottom:1pt solid #031c37}}
.resumo .n,.resumo th.n{{text-align:right}}
.resumo tr.tot td{{font-weight:700;color:#031c37;border-bottom:none;padding-top:2.5mm}}
h2{{font-weight:900;font-size:13pt;color:#031c37;margin:8mm 0 2.5mm;letter-spacing:-.01em;break-after:avoid;page-break-after:avoid}}
.cab-cat{{break-inside:avoid;page-break-inside:avoid}}
.cat{{break-inside:auto}}
.itens th.tit{{border-bottom:none;padding:0}}
.itens th.tit h2{{margin:8mm 0 1mm}}
.itens thead{{display:table-header-group}}
.itens th{{text-align:left;font-weight:500;font-size:7.4pt;color:#5f6062;padding:0 2mm 1.5mm 0;border-bottom:1pt solid #031c37;vertical-align:bottom}}
.itens td{{padding:2.2mm 2mm 2.2mm 0;border-bottom:.5pt solid #d1d3d4;vertical-align:top}}
.itens tr{{break-inside:avoid}}
.itens .item{{width:44%}}
.itens .item a{{font-weight:500;font-size:8.8pt;display:block}}
.itens .item span{{display:block;font-size:7.4pt;color:#5f6062;margin-top:.8mm}}
.itens .c{{text-align:center;width:5%}}
.itens .n{{text-align:right;white-space:nowrap;width:10%}}
.itens .forte{{font-weight:500;color:#031c37}}
.itens .leve{{color:#5f6062}}
.itens .onde{{font-size:7.4pt;width:21%;padding-left:3mm}}
.itens tr.sub td{{font-weight:700;color:#031c37;border-bottom:none;padding-top:2.5mm}}
.bloco{{break-inside:avoid}}
ul{{margin:0 0 0 4.5mm}}
li{{margin:0 0 1.6mm;padding-left:1mm}}
li::marker{{color:#9b6b26}}
.lojas td{{padding:2mm 2mm 2mm 0;border-bottom:.5pt solid #d1d3d4;vertical-align:top;font-size:8pt}}
.lojas .loja{{font-weight:700;color:#031c37;width:25%}}
.lojas td:nth-child(2){{width:27%}}
.nota{{margin-top:7mm;padding-top:3mm;border-top:.5pt solid #d1d3d4;font-size:7.6pt;color:#5f6062}}
"""

HTML = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Orçamento de equipamentos EJUP</title>
<style>{CSS}</style></head><body>
<div class="topo">{LOGO}<div class="data">Orçamento de equipamentos de produção<br>Pesquisa de preços em {DATA}</div></div>
<h1>Equipamentos para a produção da EJUP</h1>
<p class="sub-t">Câmeras, áudio, luz, suporte e edição para podcast, A Sala e conteúdo. Preços de produtos novos em lojas
brasileiras (o MacBook é usado), com o preço médio e o menor preço visto em loja séria.</p>
<div class="total">
  <div class="caixa escura"><small>Total pelo preço médio</small><b>{brl(TM)}</b><span>Média das lojas pesquisadas</span></div>
  <div class="caixa clara"><small>Total pelo menor preço visto</small><b>{brl(TN)}</b><span>Quase sempre no Pix ou em marketplace; serve de piso para negociar</span></div>
</div>
<table class="resumo"><thead><tr><th>Categoria</th><th class="n">Preço médio</th><th class="n">Menor preço visto</th></tr></thead>
<tbody>{resumo}<tr class="tot"><td>Total</td><td class="n">{brl(TM)}</td><td class="n">{brl(TN)}</td></tr></tbody></table>
{blocos}
<div class="bloco"><h2>O que mudou em relação ao pedido</h2><ul>{trocas}</ul></div>
<div class="bloco"><h2>Onde comprar</h2><table class="lojas"><tbody>{lojas}</tbody></table></div>
<p class="nota">Preços pesquisados em {DATA}. Mercado Livre, Magalu e parte da Amazon bloquearam a leitura direta, e esses
valores vieram de buscadores e comparadores de preço. Preços mudam todo dia: antes de fechar, conferir quem vende, a garantia
(garantia de 3 meses ou "compra internacional" indicam produto importado sem garantia no Brasil) e o estoque.
O nome de cada item leva à página da loja.</p>
</body></html>"""

FOOTER = """<div style="font-family:Arial;font-size:7px;color:#8a8c8e;width:100%;padding:0 14mm;display:flex;justify-content:space-between">
<span>EJUP Educação Jurídica · Orçamento de equipamentos</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page()
    pg.set_content(HTML, wait_until="load")
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(500)
    pg.pdf(path=str(OUT), format="A4", print_background=True, display_header_footer=True,
           header_template="<div></div>", footer_template=FOOTER,
           margin={"top": "16mm", "bottom": "18mm", "left": "14mm", "right": "14mm"})
    b.close()
print(OUT, brl(TM), brl(TN))
