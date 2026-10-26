#!/usr/bin/env python3
"""Gera os roteiros de vídeo a partir de videos.json, na estrutura imagem · fala · lettering.
Saídas: apresentacao/roteiros/videos/index.html (página e base do PDF) e os textos de
teleprompter em apresentacao/roteiros/videos/teleprompter/*.txt.
Uso: python3 design-system/roteiros/videos/build.py"""
import json, re, html, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[3]
SRC = ROOT / 'design-system/roteiros/videos/videos.json'
OUT = ROOT / 'apresentacao/roteiros/videos'
data = json.loads(SRC.read_text(encoding='utf-8'))
PALAVRAS_POR_S = 2.5      # leitura calma
TRECHO_EM_ABERTO = 12     # segundos estimados para um trecho entre colchetes

def limpa(t): return re.sub(r'\s*⚑', '', t.replace('**', '')).strip()
def dur(t):
    if t.strip().startswith('['): return TRECHO_EM_ABERTO
    return len(limpa(t).split()) / PALAVRAS_POR_S + 0.6
def fala_html(t):
    t = html.escape(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    return t.replace('⚑', '<span class="flag">⚑</span>')
def mmss(s): s = int(round(s)); return f'{s//60}:{s%60:02d}'
def dominio(url): return html.escape(re.sub(r'^https?://(www\.)?([^/]+).*', r'\2', url))
def lista(itens): return '<ul>' + ''.join(f'<li>{fala_html(i)}</li>' for i in itens) + '</ul>'

def dossie_html(v):
    """Página de investigação (design-system/07-metodo-de-roteiro.md), antes do roteiro."""
    d = v.get('dossie')
    if not d: return ''
    fatos = ''.join(f'<li>{html.escape(f["t"])} <span class="fonte">{html.escape(f["f"])}</span></li>' for f in d['fatos'])
    fontes = ''.join(f'<li><a href="{html.escape(f["url"])}">{html.escape(f["n"])}</a> <span class="url">{dominio(f["url"])}</span></li>' for f in d['fontes'])
    campos = [('O empresário', html.escape(d['empresario'])),
              ('Fatos', f'<ul class="fatos">{fatos}</ul>'),
              ('Hipóteses', lista(d['hipoteses'])),
              ('Interpretação', html.escape(d['interpretacao'])),
              ('Mecanismo', html.escape(d['mecanismo'])),
              ('Condições e limites', html.escape(d['limites'])),
              ('O que ele passa a enxergar', html.escape(d['aprende'])),
              ('Funil e duração', html.escape(d['funil'])),
              ('Edição', lista(d['edicao']))]
    linhas = ''.join(f'<div class="campo"><h3>{k}</h3><div>{val}</div></div>' for k, val in campos)
    return f'''<section class="video dossie">
  <p class="eyebrow">Vídeo {v["n"]} · investigação</p>
  <div class="cab"><h2>{html.escape(v["titulo"])}</h2></div>
  <div class="tese"><h3>Tese</h3><p>{html.escape(d["tese"])}</p></div>
  {linhas}
  <div class="campo fontes"><h3>Fontes</h3><ol>{fontes}</ol></div>
</section>'''

(OUT / 'teleprompter').mkdir(parents=True, exist_ok=True)
paginas = []
for v in data['videos']:
    t = 0; linhas = []
    for l in v['linhas']:
        let = l['let']
        let_html = f'<span class="sem">{html.escape(let)}</span>' if let == 'sem lettering' else html.escape(let)
        linhas.append(f'<tr><td class="img"><span class="tc">{mmss(t)}</span>{html.escape(l["img"])}</td><td class="fala">{fala_html(l["fala"])}</td><td class="let">{let_html}</td></tr>')
        t += dur(l['fala'])
    total = int(round(t / 5) * 5)
    (OUT / 'teleprompter' / f'{v["teleprompter"]}.txt').write_text('\n\n'.join(limpa(l['fala']) for l in v['linhas']) + '\n', encoding='utf-8')
    vid = v.get('id', str(v['n']))
    paginas.append(f'''<article class="roteiro" data-id="{vid}" data-slug="{v.get('slug','')}">{dossie_html(v)}<section class="video">
  <p class="eyebrow">Vídeo {v["n"]} · {html.escape(v["tema"])} · {html.escape(v["locacao"])}</p>
  <div class="cab"><h2>{html.escape(v["titulo"])}</h2><p class="meta">cerca de {total} s<br><span>teleprompter/{v["teleprompter"]}.txt</span></p></div>
  <p class="nota">{html.escape(v["nota"])}</p>
  <table><thead><tr><th>Imagem</th><th>Fala</th><th>Lettering</th></tr></thead><tbody>
  {"".join(linhas)}
  </tbody></table>
  <p class="leg">PM: plano médio. PP: primeiro plano, com aproximação na edição. Negrito na fala: palavra de ênfase. Tempos estimados em leitura calma. <span class="flag">⚑</span> precisa do aval do Roberto antes de gravar.</p>
</section></article>''')

page = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Vídeos · Roberto Pivotto</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Instrument+Sans:wght@400;500;600&family=Courier+Prime:wght@400;700&display=swap">
<style>
:root{{--papel:#F1F0EA;--papel-2:#E9E7DF;--tinta:#22252A;--ink2:#3A3E44;--caneta:#2B57A6;--grafite:#6E7278;--fita:#D9CBA8;--linha:#C9C7BF;
--serif:'Newsreader',Georgia,'Times New Roman',serif;--sans:'Instrument Sans',system-ui,-apple-system,'Segoe UI',sans-serif;--mono:'Courier Prime','Courier New',monospace;color-scheme:light}}
*{{box-sizing:border-box}}
body{{margin:0;background:#DEDCD4;color:var(--tinta);font-family:var(--sans);font-size:15px;line-height:1.45;padding:24px 16px 48px}}
.video{{max-width:210mm;margin:0 auto 16px;background:var(--papel);border:1px solid var(--linha);padding:15mm 15mm 14mm}}
.eyebrow{{margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--caneta)}}
.cab{{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;border-bottom:1px solid var(--tinta);padding-bottom:10px}}
h2{{margin:0;font-family:var(--serif);font-weight:500;font-size:30px;line-height:1.05;letter-spacing:-.015em;text-wrap:balance}}
.meta{{margin:0;text-align:right;font-size:12px;color:var(--ink2);white-space:nowrap}}
.meta span{{font-family:var(--mono)}}
.nota{{margin:10px 0 14px;font-size:13px;color:var(--ink2);max-width:70ch}}
table{{width:100%;border-collapse:collapse}}
thead th{{background:var(--tinta);color:var(--papel);text-align:left;font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;padding:10px 12px}}
td{{vertical-align:top;padding:11px 12px;border-bottom:1px solid var(--linha)}}
td.img{{width:24%;font-size:12.5px;color:var(--ink2)}}
.tc{{display:block;font-family:var(--mono);font-weight:700;color:var(--caneta);font-size:13px;margin-bottom:2px}}
td.fala{{width:47%;font-size:16px;line-height:1.45}}
td.fala b{{font-weight:600;color:var(--caneta)}}
td.let{{font-size:12.5px;color:var(--ink2)}}
.sem{{color:var(--grafite);opacity:.75}}
.flag{{display:inline-block;background:var(--fita);color:#22252A;font-size:10px;font-weight:600;padding:0 5px;margin-left:2px}}
.leg{{margin:10px 0 0;font-size:11px;color:var(--grafite)}}
.tese{{margin:14px 0 6px;padding:12px 14px;background:var(--tinta);color:var(--papel)}}
.tese h3,.campo h3{{margin:0 0 4px;font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase}}
.tese h3{{color:var(--fita)}} .tese p{{margin:0;font-family:var(--serif);font-size:19px;line-height:1.3}}
.campo{{display:grid;grid-template-columns:150px 1fr;gap:14px;padding:9px 0;border-bottom:1px solid var(--linha);font-size:13.5px;line-height:1.42}}
.campo h3{{color:var(--caneta);padding-top:2px}}
.campo ul,.campo ol{{margin:0;padding-left:18px}} .campo li{{margin:0 0 4px}}
.fonte{{display:inline-block;font-family:var(--mono);font-size:11px;color:var(--grafite)}}
.fontes{{font-size:12px}} .fontes a{{color:var(--tinta);text-decoration:underline;text-decoration-color:var(--linha)}} .url{{font-family:var(--mono);font-size:10px;color:var(--grafite)}}
@media (max-width:700px){{.campo{{grid-template-columns:1fr;gap:2px}}}}
@media (max-width:700px){{.video{{padding:22px 16px}} .cab{{flex-direction:column;align-items:flex-start}} .meta{{text-align:left}} table,thead,tbody,tr,td{{display:block;width:100%!important}} thead{{display:none}} tr{{border-bottom:1px solid var(--linha);padding:8px 0}} td{{border:0;padding:4px 0}} td.let{{padding-bottom:8px}}}}
@page{{size:A4;margin:0}}
@media print{{body{{background:var(--papel);padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}} .video{{max-width:none;margin:0;border:0;min-height:297mm;break-after:page}} .roteiro:last-child .video:last-child{{break-after:auto}} .dossie{{min-height:0}} tr{{break-inside:avoid}} td{{padding:6px 10px}} td.fala{{font-size:14.5px;line-height:1.36}} td.img,td.let{{font-size:12px}} .nota{{margin:8px 0 8px}} .video{{padding:11mm 14mm 9mm}} .leg{{margin-top:6px}} .campo{{padding:5px 0;font-size:12.5px;line-height:1.36;grid-template-columns:140px 1fr}} .tese{{margin:10px 0 4px;padding:10px 12px}} .tese p{{font-size:17px}} .fontes{{font-size:11px}} .dossie h2{{font-size:25px}} .fontes ol{{columns:2;column-gap:18px}} .fontes li{{break-inside:avoid}}}}
</style>
</head>
<body>
{"".join(paginas)}
</body>
</html>
'''
(OUT / 'index.html').write_text(page, encoding='utf-8')
print('ok', len(data['videos']))
