#!/usr/bin/env python3
"""Gera apresentacao/planner/index.html, o planner semanal de conteúdo de Roberto Pivotto
(mesma lógica do planner de Leonardo Pivotto, na identidade do caderno de obra).
Uso: python3 design-system/roteiros/planner.py"""
import pathlib, html
ROOT = pathlib.Path(__file__).resolve().parents[2]

# marcadores por formato (sem quadros fixos: cada peça é um tema solto do eixo dele)
REE, CAR, EST, COL, PROD = 'cod', 'out', 'avu', 'ana', 'prod'
FEED = (REE, CAR, EST, COL)
def it(m, b, s): return (m, b, s)

dias = [
 ('Segunda', None,
  [it(CAR,'CARROSSEL','Tema jurídico da semana explicado a fundo: lei, decisão ou caso'),
   it(PROD,'LINKEDIN','O mesmo carrossel, em PDF'),
   it(PROD,'STORY','Contexto do carrossel')],
  [('1ª SEMANA',[it(PROD,'EIXO DA SEMANA','Propriedade intelectual e proteção de dados')]),
   ('2ª SEMANA',[it(PROD,'EIXO DA SEMANA','Inteligência artificial e automação jurídica')]),
   ('3ª SEMANA',[it(PROD,'EIXO DA SEMANA','Negócios, contratos e sociedades')]),
   ('4ª SEMANA',[it(PROD,'EIXO DA SEMANA','Growth e marketing para advogados')])]),
 ('Terça', 'DIA DE GRAVAÇÃO',
  [it(PROD,'GRAVAR','Os dois Reels da semana, câmera aberta'),
   it(PROD,'STORIES','Bastidores da gravação')], []),
 ('Quarta', None,
  [it(REE,'REELS','Tema solto do eixo, topo de funil: um acontecimento e o mecanismo por trás'),
   it(PROD,'STORY','Repost com a pergunta do vídeo')], []),
 ('Quinta', None,
  [it(EST,'POST ESTÁTICO','Uma tese com fundamento jurídico, numa imagem'),
   it(PROD,'LINKEDIN','A tese desenvolvida em texto'),
   it(PROD,'STORY','Caixa de perguntas: vira pauta')],
  [('1× POR MÊS',[it(COL,'COLLAB · @EJUP.OFICIAL','No lugar do estático: de onde veio a EJUP, quem é Roberto')])]),
 ('Sexta', None,
  [it(REE,'REELS · FUNDO DE FUNIL','Problema real de empresa ou escritório e convite para o direct'),
   it(PROD,'LINKEDIN','O mesmo vídeo')], []),
 ('Sábado', None,
  [it(PROD,'STORIES · VIDA','Música, cozinha, jardim, quando iluminam o trabalho'),
   it(PROD,'STORY · REPERTÓRIO','Uma leitura da semana sobre negócios e tecnologia')], []),
 ('Domingo', 'SEM POSTAGEM',
  [it(PROD,'PLANEJAMENTO','Pautas e pesquisa da semana seguinte (interno, não publica)')], []),
]

def mk(m): return f'<i class="m {m}"></i>'
def lista(items):
    return '<ul>' + ''.join(f'<li>{mk(m)}<div><b>{html.escape(b)}</b><span>{html.escape(s)}</span></div></li>' for m,b,s in items) + '</ul>'
cols = ''
for nome, dest, base, vars_ in dias:
    c = f'<div class="dest">{dest}</div>' if dest else ''
    c += f'<div class="base">{lista(base)}</div>' if base else ''
    c += ''.join(f'<div class="var"><span class="sem">{s}</span>{lista(i)}</div>' for s,i in vars_)
    cols += f'<td>{c}</td>'
head = ''.join(f'<th>{d[0]}</th>' for d in dias)

page = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="robots" content="noindex, nofollow">
<meta name="description" content="Planner semanal de conteúdo de Roberto Pivotto.">
<title>Planner semanal · Roberto Pivotto</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Instrument+Sans:wght@400;500;600;700&family=Courier+Prime:wght@400;700&display=swap">
<style>
:root{{--papel:#F1F0EA;--papel-2:#E9E7DF;--tinta:#22252A;--ink2:#3A3E44;--caneta:#2B57A6;--grafite:#6E7278;--fita:#D9CBA8;--linha:#C9C7BF}}
*{{box-sizing:border-box}}
html,body{{margin:0;background:var(--papel);color:var(--tinta);font-family:'Instrument Sans',system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.pg{{max-width:1440px;margin:0 auto;padding:40px 20px 60px;display:flex;flex-direction:column;gap:26px}}
@page{{size:1920px 1080px;margin:0}}
header{{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap}}
h1{{margin:0;font-family:'Newsreader',Georgia,serif;font-weight:500;font-size:clamp(40px,6vw,72px);letter-spacing:-.025em;line-height:1}}
h1 em{{color:var(--caneta)}}
.sub{{margin:12px 0 0;font-size:17px;color:var(--grafite)}}
.selo{{border:2px solid var(--tinta);min-width:270px;background:var(--papel)}}
.selo .faixa{{background:var(--tinta);color:var(--papel);font-size:12px;font-weight:700;letter-spacing:.16em;padding:6px 12px}}
.selo .nome{{padding:10px 14px;font-size:19px;font-weight:600;letter-spacing:.14em;text-align:center;display:flex;align-items:center;justify-content:center;gap:12px}}
.selo .nome::before{{content:"";width:34px;height:4px;background:var(--caneta);border-radius:2px}}
.tw{{overflow-x:auto;padding:1px}}
table{{border-collapse:collapse;width:100%;min-width:1100px;table-layout:fixed}}
th{{background:var(--tinta);color:var(--papel);font-size:15px;font-weight:600;letter-spacing:.06em;padding:12px 8px;border:1px solid var(--tinta);text-align:center}}
td{{vertical-align:top;border:1px solid var(--tinta);padding:16px 12px}}
ul{{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:11px}}
li{{display:flex;gap:10px;align-items:flex-start}}
li b{{display:block;font-size:12.8px;font-weight:700;letter-spacing:.03em;line-height:1.25}}
li span{{display:block;font-size:12.8px;color:var(--ink2);line-height:1.35;margin-top:2px}}
.m{{flex:0 0 auto;width:11px;height:11px;margin-top:2px;display:block}}
.m.cod{{background:var(--tinta)}} .m.out{{background:var(--caneta)}} .m.ana{{background:var(--fita);outline:1.5px solid var(--tinta);outline-offset:-1.5px}}
.m.avu{{background:var(--papel);border:1.5px solid var(--tinta)}} .m.prod{{border:1.5px solid var(--grafite);border-radius:50%}}
.dest{{font-size:13.5px;font-weight:700;letter-spacing:.08em;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--caneta);color:var(--caneta)}}
.base{{margin-top:0}} .var+.base,.base+.var,.var+.var{{margin-top:16px}}
.var{{display:flex;flex-direction:column;gap:9px}}
.sem{{align-self:flex-start;background:var(--fita);color:var(--tinta);font-size:10.5px;font-weight:700;letter-spacing:.12em;padding:3px 8px;transform:rotate(-1.5deg)}}
footer{{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;font-size:13px;color:var(--grafite)}}
.leg{{display:flex;gap:16px;flex-wrap:wrap}} .leg span{{display:flex;gap:8px;align-items:center}} .leg .m{{margin:0}}
footer b{{color:var(--tinta);font-weight:600}}
@media print{{.pg{{max-width:none;width:1920px;height:1080px;padding:52px 64px;gap:30px}} table{{min-width:0}} h1{{font-size:84px}} .sub{{font-size:22px}} th{{font-size:19px;padding:15px 8px}} td{{padding:17px 14px}} li b{{font-size:15px}} li span{{font-size:14.5px}} .m{{width:13px;height:13px;margin-top:3px}} .sem{{font-size:11.5px}} .dest{{font-size:16px}} ul{{gap:11px}} footer{{font-size:14.5px;flex-wrap:nowrap}} .selo{{min-width:330px}} .selo .faixa{{font-size:14px}} .selo .nome{{font-size:23px}}}}
</style></head><body><div class="pg">
<header><div><h1>Planner <em>semanal</em></h1>
<p class="sub">Instagram e LinkedIn · um tema por peça, sempre no eixo jurídico e de negócios · Reels, carrossel e post estático</p></div>
<div class="selo"><div class="faixa">@ROBERTOPIVOTTO</div><div class="nome">ROBERTO PIVOTTO</div></div></header>
<div class="tw"><table><thead><tr>{head}</tr></thead><tbody><tr>{cols}</tr></tbody></table></div>
<footer><div class="leg"><span>{mk(REE)}Reels</span><span>{mk(CAR)}Carrossel</span><span>{mk(EST)}Post estático</span><span>{mk(COL)}Collab com a EJUP, 1× por mês</span><span>{mk(PROD)}Stories · LinkedIn · produção</span></div>
<div>Todo conteúdo fecha com uma <b>pergunta específica</b>; o Reels de sexta pode fechar com <b>convite para o direct</b>.</div></footer>
</div></body></html>
'''
(ROOT / 'apresentacao/planner/index.html').write_text(page, encoding='utf-8')
print('ok')
