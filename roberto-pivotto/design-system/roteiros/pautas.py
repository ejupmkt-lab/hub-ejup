#!/usr/bin/env python3
"""Gera a pauta da semana a partir de design-system/roteiros/pautas/<data>.json:
apresentacao/pautas/<data>/index.html (página e base do PDF).
Cada peça abre com a investigação do método (07-metodo-de-roteiro.md) e depois traz a peça pronta.
Uso: python3 design-system/roteiros/pautas.py 2026-10-26"""
import json, re, html, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
data = json.loads((ROOT / f'design-system/roteiros/pautas/{sys.argv[1]}.json').read_text(encoding='utf-8'))

def tx(t):
    t = html.escape(t)
    return t.replace('⚑', '<span class="flag">⚑</span>')
def dominio(url): return html.escape(re.sub(r'^https?://(www\.)?([^/]+).*', r'\2', url))
def lista(itens): return '<ul>' + ''.join(f'<li>{tx(i)}</li>' for i in itens) + '</ul>'
def campo(k, v): return f'<div class="campo"><h3>{k}</h3><div>{v}</div></div>'

NOME_PECA = {'fala': 'A fala, na ordem', 'carrossel': 'As telas', 'estatico': 'A arte'}
secoes = []
resumo = ''
for p in data['pecas']:
    resumo += f'<tr><td class="d">{tx(p["dia"])}</td><td>{tx(p["formato"])}</td><td><b>{tx(p["titulo"])}</b><br><span>{tx(p["eixo"])}</span></td></tr>'
    fatos = ''.join(f'<li>{tx(f["t"])} <span class="fonte">{tx(f["f"])}</span></li>' for f in p['fatos'])
    campos = [('Para quem', tx(p['empresario'])), ('Fatos', f'<ul class="fatos">{fatos}</ul>')]
    if p['hipoteses']: campos.append(('Hipóteses', lista(p['hipoteses'])))
    campos += [('Interpretação', tx(p['interpretacao'])), ('Mecanismo', tx(p['mecanismo'])),
               ('Condições e limites', tx(p['limites'])), ('O que ele passa a enxergar', tx(p['aprende']))]
    if p.get('gravacao'): campos.append(('Gravação', tx(p['gravacao'])))
    itens = ''.join(f'<li>{tx(i)}</li>' for i in p['peca']['itens'])
    legenda = ''.join(f'<p>{tx(par)}</p>' for par in p['legenda'].split('\n\n'))
    fontes = ''.join(f'<li><a href="{html.escape(f["url"])}">{tx(f["n"])}</a> <span class="url">{dominio(f["url"])}</span></li>' for f in p['fontes'])
    secoes.append(f'''<section class="folha">
  <p class="eyebrow">{tx(p["dia"])} · {tx(p["formato"])} · {tx(p["eixo"])}</p>
  <h2>{tx(p["titulo"])}</h2>
  <div class="tese"><h3>Tese</h3><p>{tx(p["tese"])}</p></div>
  {"".join(campo(k, v) for k, v in campos)}
  <div class="peca {p["peca"]["tipo"]}"><h3>{NOME_PECA[p["peca"]["tipo"]]}</h3><ol>{itens}</ol></div>
  <div class="legenda"><h3>Legenda</h3>{legenda}</div>
  {campo("Junto", lista(p["extras"])) if p.get("extras") else ""}
  {campo("Fontes", f'<ol class="fontes">{fontes}</ol>') if fontes else ""}
</section>''')

rotina = ''.join(f'<tr><td class="d">{tx(d)}</td><td colspan="2">{tx(t)}</td></tr>' for d, t in data['rotina'])
capa = f'''<section class="folha capa">
  <p class="eyebrow">Roberto Pivotto · pauta da semana</p>
  <h1>{tx(data["semana"])}</h1>
  <p class="nota">{tx(data["nota"])}</p>
  <table><thead><tr><th>Dia</th><th>Formato</th><th>Peça</th></tr></thead><tbody>{resumo}{rotina}</tbody></table>
  <p class="leg"><span class="flag">⚑</span> precisa do aval ou da resposta do Roberto antes de publicar. Fato, hipótese e interpretação ficam separados na fala.</p>
</section>'''

page = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Pauta {html.escape(data["slug"])} · Roberto Pivotto</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Instrument+Sans:wght@400;500;600&family=Courier+Prime:wght@400;700&display=swap">
<style>
:root{{--papel:#F1F0EA;--tinta:#22252A;--ink2:#3A3E44;--caneta:#2B57A6;--grafite:#6E7278;--fita:#D9CBA8;--linha:#C9C7BF;
--serif:'Newsreader',Georgia,'Times New Roman',serif;--sans:'Instrument Sans',system-ui,-apple-system,'Segoe UI',sans-serif;--mono:'Courier Prime','Courier New',monospace;color-scheme:light}}
*{{box-sizing:border-box}}
body{{margin:0;background:#DEDCD4;color:var(--tinta);font-family:var(--sans);font-size:16px;line-height:1.5;padding:24px 16px 48px}}
.folha{{max-width:210mm;margin:0 auto 16px;background:var(--papel);border:1px solid var(--linha);padding:15mm 15mm 14mm}}
.eyebrow{{margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--caneta)}}
h1,h2{{margin:0 0 12px;font-family:var(--serif);font-weight:500;letter-spacing:-.015em;line-height:1.08;text-wrap:balance}}
h1{{font-size:40px}} h2{{font-size:30px;border-bottom:1px solid var(--tinta);padding-bottom:10px}}
h3{{margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--caneta)}}
.nota{{font-size:16px;color:var(--ink2);max-width:70ch}}
table{{width:100%;border-collapse:collapse;margin-top:12px}}
th{{background:var(--tinta);color:var(--papel);text-align:left;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;padding:10px 12px}}
td{{vertical-align:top;padding:11px 12px;border-bottom:1px solid var(--linha);font-size:15px}}
td.d{{font-family:var(--mono);font-weight:700;color:var(--caneta);white-space:nowrap}} td span{{color:var(--grafite);font-size:13px}}
.tese{{margin:14px 0 8px;padding:12px 14px;background:var(--tinta);color:var(--papel)}}
.tese h3{{color:var(--fita)}} .tese p{{margin:0;font-family:var(--serif);font-size:20px;line-height:1.3}}
.campo{{display:grid;grid-template-columns:150px 1fr;gap:14px;padding:9px 0;border-bottom:1px solid var(--linha);font-size:15px;line-height:1.45}}
.campo h3{{padding-top:3px}}
ul,ol{{margin:0;padding-left:20px}} li{{margin:0 0 5px}}
.fonte{{font-family:var(--mono);font-size:12px;color:var(--grafite)}}
.peca,.legenda{{margin-top:14px;padding:14px 16px;border:1.5px solid var(--tinta);background:#fff}}
.peca li{{font-size:17px;line-height:1.5;margin-bottom:9px}} .peca.fala li{{font-family:var(--serif);font-size:19px}}
.legenda p{{margin:0 0 9px;font-size:16px}} .legenda p:last-child{{margin:0}}
.fontes a{{color:var(--tinta);text-decoration-color:var(--linha)}} .url{{font-family:var(--mono);font-size:11px;color:var(--grafite)}}
.flag{{display:inline-block;background:var(--fita);color:#22252A;font-size:11px;font-weight:600;padding:0 5px;margin-left:2px}}
.leg{{margin:12px 0 0;font-size:13px;color:var(--grafite)}}
@media (max-width:700px){{.folha{{padding:22px 16px}} .campo{{grid-template-columns:1fr;gap:2px}} h1{{font-size:30px}} h2{{font-size:25px}}}}
@page{{size:A4;margin:12mm 0}}
@page:first{{margin-top:0}}
@media print{{body{{background:var(--papel);padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}} .folha{{max-width:none;margin:0;border:0;padding:0 15mm;break-after:page}} .capa{{padding-top:15mm}} .folha:last-child{{break-after:auto}} li,.legenda p,td{{break-inside:avoid}} h2{{break-after:avoid}}}}
</style>
</head>
<body>
{capa}
{"".join(secoes)}
</body>
</html>
'''
out = ROOT / f'apresentacao/pautas/{data["slug"]}'
out.mkdir(parents=True, exist_ok=True)
(out / 'index.html').write_text(page, encoding='utf-8')
print('ok', len(data['pecas']))
