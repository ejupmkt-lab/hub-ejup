#!/usr/bin/env python3
"""Roteiros de gravação do Dr. Jarbas: textos de teleprompter (txt e PDF) e folha de gravação (md e PDF)."""
import html, pathlib, re
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
FONTS = (HERE.parents[2] / "skills" / "ejup-design" / "assets" / "fonts").as_uri()
RITMO = 2.5  # palavras por segundo, leitura calma

ABERTURA_A = "Eu sou o Jarbas Bezerra, e este é O Que o Processo Não Mostra."
ABERTURA_B = "Eu sou o Jarbas Bezerra, e este é o Antes da Consequência."

# cada episódio: id, quadro, título, base, blocos [(nome, [linhas])], em tela, câmera B, legenda, conferir
EPS = [
 dict(id="A1", q="A", n=1, titulo="A solidão da decisão", base="Experiência de quase 28 anos na magistratura militar (proposta, roteiro 07)",
  blocos=[("GANCHO", ["O processo reúne artigos de lei, laudos e depoimentos.", "Mas há uma parte da decisão que nenhum documento registra."]),
          ("ABERTURA", [ABERTURA_A]),
          ("CORPO", ["Foram quase vinte e oito anos julgando na Vara Criminal Militar.", "Em cada audiência, eu tinha diante de mim uma infração, e também uma família, uma carreira construída e o peso institucional da tropa.", "Quem decide carrega essa soma.", "O juiz que decide para agradar plateias abre mão da própria função.", "A autoridade de quem julga está na serenidade e no estrito cumprimento da legalidade."]),
          ("SÍNTESE", ["A lei estabelece o rito.", "A maturidade humana ajuda a tornar justa a sentença."]),
          ("FECHO", ["Reflexão geral, sem relação com processo real.", "Na próxima terça, outro bastidor da decisão."])],
  tela=["Abertura: letreiro \"O Que o Processo Não Mostra\" por 2 s.", "Corpo: a expressão \"a soma\" não vai em tela; deixar a imagem respirar.", "Fecho: aviso \"Reflexão geral, sem relação com processo real\"."],
  camb="Mãos sobre a mesa de madeira, a caneta ao lado, lombadas da estante em foco suave.",
  legenda="O processo reúne artigos de lei, laudos e depoimentos. A solidão de quem decide fica de fora dos autos. Uma reflexão sobre julgar com serenidade e dentro da legalidade. Reflexão geral, sem relação com processo real.",
  conferir=["\"Quase vinte e oito anos\" e \"Vara Criminal Militar\" vêm da proposta. Dr. Jarbas confirma os números e o nome da vara antes de gravar."]),
 dict(id="A2", q="A", n=2, titulo="Por que educar antes de julgar", base="Educação cidadã, PROBEC e Dia Estadual da Educação Cívica (proposta, roteiro 11)",
  blocos=[("GANCHO", ["Já me perguntaram: o senhor tem uma carreira estável na magistratura, por que gastar energia com cartilhas e palestras em escolas?"]),
          ("ABERTURA", [ABERTURA_A]),
          ("CORPO", ["A resposta nasceu na sala de julgamento.", "Vi muitos jovens militares diante de mim por falta de compreensão elementar das suas responsabilidades.", "Entendi que a caneta do juiz chega depois do fato.", "Por isso ajudei a criar o Programa Brasileiro de Educação Cidadã, o Probec.", "Em dois mil e treze, o Rio Grande do Norte instituiu, por lei complementar, o dez de setembro como Dia Estadual da Educação Cívica."]),
          ("SÍNTESE", ["Atuar sobre a causa também faz parte do ofício.", "O juiz decide.", "O educador acrescenta o que a sentença não alcança."]),
          ("FECHO", ["Reflexão pessoal, sem relação com processo real.", "Na próxima terça, outro bastidor da decisão."])],
  tela=["Abertura: letreiro \"O Que o Processo Não Mostra\" por 2 s.", "Quando falar do Probec: logotipo do programa, se houver autorização de uso.", "Fecho: aviso \"Reflexão pessoal, sem relação com processo real\"."],
  camb="Livros e publicações do programa sobre a mesa, se existirem em cena; mãos virando uma página.",
  legenda="A caneta do juiz chega depois do fato. Por isso a educação cidadã também faz parte do ofício. Uma reflexão sobre o Probec e o Dia Estadual da Educação Cívica. Reflexão pessoal, sem relação com processo real.",
  conferir=["Lei Complementar estadual nº 494/2013, que instituiu o Dia Estadual da Educação Cívica em 10 de setembro: confirmada em notícia da Assembleia Legislativa do RN, mas o texto da lei precisa ser conferido na fonte.", "A frase \"ajudei a criar o Probec\" respeita que o programa foi idealizado com a advogada Lígia Limeira, segundo a Assembleia. Dr. Jarbas decide se cita a coautoria.", "\"Vi muitos jovens militares...\" é relato dele, mantido do roteiro 11 da proposta. Sem caso, nome ou local."]),
 dict(id="A3", q="A", n=3, titulo="A Justiça Militar como especialidade", base="Direito Penal Militar aplicado (proposta, roteiro 12)",
  blocos=[("GANCHO", ["A Justiça Militar é uma extensão da Justiça comum ou uma especialidade?", "A resposta muda a forma de advogar."]),
          ("ABERTURA", [ABERTURA_A]),
          ("CORPO", ["A Constituição organiza as Forças Armadas, as polícias militares e os bombeiros militares com base na hierarquia e na disciplina.", "São esses os valores que a jurisdição militar protege.", "Na vida civil, certos deveres parecem secundários.", "Na vida em tropa, eles sustentam a própria instituição.", "Por isso a lógica da caserna pede leitura própria.", "Ao levar teses da Justiça comum para a Justiça Militar, como a insignificância, o advogado precisa mostrar como elas dialogam com o bem jurídico militar."]),
          ("SÍNTESE", ["Quem entende a jurisdição constrói defesas mais sólidas.", "Entenda a especialidade antes de subscrever a peça."]),
          ("FECHO", ["Conteúdo educativo, sem orientação individual.", "Na próxima terça, outro bastidor da decisão."])],
  tela=["Abertura: letreiro \"O Que o Processo Não Mostra\" por 2 s.", "Primeira frase do corpo: \"Constituição, arts. 42 e 142\".", "Fecho: aviso \"Conteúdo educativo, sem orientação individual\"."],
  camb="Constituição aberta sobre a mesa, com o art. 142 em foco; mão passando o dedo na linha.",
  legenda="A Justiça Militar é uma especialidade, com bens jurídicos próprios: a hierarquia e a disciplina. O que isso muda para quem advoga na área. Conteúdo educativo, sem orientação individual.",
  conferir=["Arts. 42 (caput, redação da EC 18/1998) e 142 da Constituição conferidos no Planalto em 06/10/2026: instituições \"organizadas com base na hierarquia e disciplina\".", "A frase sobre a insignificância é síntese cautelosa. A proposta original dizia que aplicar teses genéricas é \"receita certa para a improcedência\", afirmação que não cabe sem jurisprudência. [conferir posição atual do STM e do STF antes de gravar; incluir a segunda fonte]."]),
 dict(id="B1", q="B", n=1, titulo="Hierarquia e a ordem manifestamente ilegal", base="Prevenção para militares e forças de segurança, CPM art. 38 (proposta, roteiro 08)",
  blocos=[("GANCHO", ["Na vida militar, o dever de obediência sustenta a corporação.", "Mas onde termina o cumprimento da ordem e onde começa o crime?"]),
          ("ABERTURA", [ABERTURA_B]),
          ("CORPO", ["O artigo trinta e oito do Código Penal Militar afasta a culpa de quem age em estrita obediência a ordem direta de superior hierárquico, em matéria de serviço.", "Mas se a ordem tem por objeto um ato manifestamente criminoso, ou se há excesso na execução, o subordinado também é punido.", "Quem mandou responde.", "E quem cumpriu também pode responder."]),
          ("EXPERIÊNCIA", ["Em quase três décadas na jurisdição militar, vi carreiras interrompidas porque o subordinado acreditou que bastava dizer: cumpri ordens."]),
          ("SÍNTESE", ["A hierarquia organiza a tropa e encontra limite na lei.", "Conheça a regra antes de cumprir a ordem."]),
          ("FECHO", ["Conteúdo educativo, sem orientação individual.", "Na próxima quinta, outro cuidado antes da consequência."])],
  tela=["Abertura: letreiro \"Antes da Consequência\" por 2 s.", "Primeira frase do corpo: \"Código Penal Militar, art. 38\"; destacar \"manifestamente criminoso\".", "Fecho: aviso \"Conteúdo educativo, sem orientação individual\"."],
  camb="Código Penal Militar aberto no art. 38, em plano diagonal; mão marcando a linha com a caneta.",
  legenda="Hierarquia tem limite na lei: ordem manifestamente criminosa não protege quem a cumpre. O que diz o art. 38 do Código Penal Militar. Conteúdo educativo, sem orientação individual.",
  conferir=["Art. 38 do CPM, alínea b e §§ 1º e 2º (redação do § 2º dada pela Lei nº 14.688/2023), conferido no Planalto em 06/10/2026.", "\"Vi carreiras interrompidas...\" é relato dele, mantido da proposta. Sem caso, nome ou local."]),
 dict(id="B2", q="B", n=2, titulo="Rigor de comando e arbítrio pessoal", base="Gestão institucional e prevenção no CPM (proposta, roteiro 10)",
  blocos=[("GANCHO", ["Na minha experiência, uma das falhas mais recorrentes na condução disciplinar da tropa é a confusão entre rigor de comando e arbítrio pessoal."]),
          ("ABERTURA", [ABERTURA_B]),
          ("CORPO", ["Ao tentar restabelecer a ordem imediata, o oficial pode deixar o devido processo legal em segundo plano.", "A Constituição assegura o contraditório e a ampla defesa também no processo administrativo, no inciso cinquenta e cinco do artigo quinto.", "Quando esse rito é deixado de lado, o procedimento fica sujeito à anulação.", "E a forma como o comandante conduziu o caso também pode ser examinada."]),
          ("SÍNTESE", ["A autoridade do oficial se fortalece quando o rito é seguido.", "Quem instrui com rigor técnico trabalha com segurança.", "Firmeza e método andam juntos."]),
          ("FECHO", ["Conteúdo educativo, sem orientação individual.", "Na próxima quinta, outro cuidado antes da consequência."])],
  tela=["Abertura: letreiro \"Antes da Consequência\" por 2 s.", "Quando citar o inciso: \"Constituição, art. 5º, LV\".", "Fecho: aviso \"Conteúdo educativo, sem orientação individual\"."],
  camb="Constituição aberta no art. 5º, inciso LV; mão virando para a página do inciso.",
  legenda="Rigor de comando e arbítrio pessoal não se confundem. O contraditório e a ampla defesa valem também no processo administrativo (CF, art. 5º, LV). Conteúdo educativo, sem orientação individual.",
  conferir=["Art. 5º, LV, da Constituição, conferido no Planalto em 06/10/2026.", "\"O procedimento fica sujeito à anulação\" e \"a conduta do comandante pode ser examinada\" são cuidadosas. A proposta dizia que o comandante responderia por abuso de autoridade, o que depende do caso e da lei aplicável. [revisão jurídica]", "\"Na minha experiência\" mantém o tom pessoal da proposta. Sem caso, nome ou local."]),
 dict(id="B3", q="B", n=3, titulo="Antes de publicar: o militar nas redes sociais", base="Prevenção, CPM art. 166 (proposta nova, tema da pauta)",
  blocos=[("GANCHO", ["Um militar pode publicar documento oficial, ou criticar o superior, nas redes sociais?"]),
          ("ABERTURA", [ABERTURA_B]),
          ("CORPO", ["O Código Penal Militar trata do tema no artigo cento e sessenta e seis.", "O texto prevê a conduta de publicar, sem licença, ato ou documento oficial, ou de criticar publicamente ato de superior ou assunto atinente à disciplina militar.", "A pena prevista é de detenção, de dois meses a um ano, se o fato não constitui crime mais grave.", "Os limites desse artigo diante da liberdade de expressão são debatidos nos tribunais."]),
          ("PREVENTIVO", ["Antes de publicar, pergunte: o conteúdo é oficial? Há licença? Trata de disciplina militar?", "Em caso de dúvida, consulte o setor jurídico da corporação."]),
          ("SÍNTESE", ["A internet guarda tudo.", "Conheça a regra antes de publicar."]),
          ("FECHO", ["Conteúdo educativo, sem orientação individual.", "Na próxima quinta, outro cuidado antes da consequência."])],
  tela=["Abertura: letreiro \"Antes da Consequência\" por 2 s.", "Primeira frase do corpo: \"Código Penal Militar, art. 166\".", "Fecho: aviso \"Conteúdo educativo, sem orientação individual\"."],
  camb="Código Penal Militar aberto no art. 166, plano diagonal; um celular desfocado no canto, sem tela legível.",
  legenda="O Código Penal Militar trata de publicar ato ou documento oficial, sem licença, e de criticar publicamente ato de superior ou assunto de disciplina militar (art. 166). Os limites diante da liberdade de expressão são debatidos nos tribunais. Conteúdo educativo, sem orientação individual.",
  conferir=["Texto do art. 166 do CPM e a pena (detenção de dois meses a um ano) conferidos no Planalto em 06/10/2026.", "A relação do art. 166 com a liberdade de expressão está sob debate. [conferir a jurisprudência atual do STF e do STM antes de gravar; incluir a segunda fonte]. O texto falado só informa a existência do debate.", "Este episódio é novo (não consta na proposta). Dr. Jarbas confirma se entra na gravação."]),
]


def stats(ep):
    t = 0; cue = []
    for nome, ls in ep["blocos"]:
        w = sum(len(re.findall(r"\w+", l)) for l in ls); d = w / RITMO + 0.8
        cue.append((nome, w, t, t + d)); t += d
    return cue, sum(c[1] for c in cue), t


def mm(x): return f"{int(x // 60)}:{int(x % 60):02d}"


def txt_ep(ep):
    return "\n\n".join("\n".join(ls) for _, ls in ep["blocos"]) + "\n"


FACE = f'''
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Light.otf");font-weight:300}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Book.otf");font-weight:400}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Medium.otf");font-weight:500}}
@font-face{{font-family:Gotham;src:url("{FONTS}/Gotham-Black.otf");font-weight:900}}
'''
QN = {"A": "O Que o Processo Não Mostra", "B": "Antes da Consequência"}


def html_tp(q):
    pags = ""
    for ep in [e for e in EPS if e["q"] == q]:
        corpo = "".join("<div class='b'>" + "".join(f"<p>{html.escape(l)}</p>" for l in ls) + "</div>" for _, ls in ep["blocos"])
        pags += f"<section><h1>{QN[q]} · Episódio {ep['n']} · {html.escape(ep['titulo'])}</h1>{corpo}</section>"
    return f'''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>{FACE}
@page{{size:A4;margin:22mm 20mm}}
body{{font-family:Gotham,Montserrat,sans-serif;color:#0d131a}}
section{{break-after:page}} section:last-child{{break-after:auto}}
h1{{font-weight:900;font-size:13pt;letter-spacing:-.01em;margin-bottom:8mm;color:#031c37}}
.b{{margin-bottom:10mm;break-inside:avoid}}
.b p{{font-size:24pt;line-height:1.36;margin-bottom:3mm}}
</style>{pags}</html>'''


def md_geral():
    L = ["# Roteiros de gravação · Dr. Jarbas Bezerra · dois quadros, seis vídeos", "",
         "Feitos do zero em 06/10/2026 a partir da proposta de conteúdo (quadros 02 e 04, os de vídeo vertical e semanais). Quadros escolhidos: **O Que o Processo Não Mostra** (terça, 12h00) e **Antes da Consequência** (quinta, 18h30), três episódios de cada, para cobrir três semanas de grade.", "",
         "## Regras de todos os roteiros",
         "- Frases afirmativas, sem a figura \"não é X, é Y\", sem travessão entre palavras e sem promessa de resultado.",
         "- Nenhum caso real: reflexões gerais e relatos pessoais dele, sem processo, nome ou local identificável.",
         "- Aviso fixo no fecho: \"Conteúdo educativo, sem orientação individual\" ou \"Reflexão geral, sem relação com processo real\".",
         "- Norma citada no ar foi conferida no Planalto em 06/10/2026 quando indicado. O que não pôde ser conferido está marcado [conferir].",
         "- Segundo as regras da EJUP, cada episódio precisa de uma segunda fonte, de categoria diferente da norma (doutrina, jurisprudência ou fonte institucional). Fica a cargo do revisor.",
         "- Dr. Jarbas e o gate humano aprovam antes de publicar. Magistrado em rede social: conferir a Resolução CNJ nº 305/2019, o art. 36 da LOMAN e a regra da corregedoria do tribunal.", "",
         "## Ordem de gravação sugerida",
         "Gravar por quadro, na ordem abaixo. Um take extra do fecho (aviso e convite à próxima semana) pode ser reaproveitado entre os episódios do mesmo quadro.",
         "1. A1, A2, A3 (O Que o Processo Não Mostra).", "2. B1, B2, B3 (Antes da Consequência).", "",
         "## O que ele precisa ter à mão",
         "- Texto no teleprompter (arquivo `.txt` de cada episódio ou o PDF do quadro), leitura a cerca de 150 palavras por minuto.",
         "- Constituição Federal e Código Penal Militar, com o artigo marcado, para o plano de detalhe (Câmera B).",
         "- Caneta e mesa de madeira em cena (da direção de arte da proposta).",
         "- Cena sem toga e sem martelo cenográfico, conforme a proposta.", "",
         "## O que mudou em relação à proposta",
         "- Reescrevi os seis roteiros em frases afirmativas. A proposta usa \"não é X, é Y\" em vários trechos (\"julgar não é exercício de poder; é sacerdócio\", \"hierarquia não é salvo-conduto\", \"a autoridade não é enfraquecida pelo rito; é blindada por ele\"), figura que a EJUP evita.",
         "- Tirei afirmações sem apoio verificável: \"a receita certa para a improcedência das defesas\" (A3), \"o comandante respondendo por abuso de autoridade\" (B2) e \"esvaziar as varas criminais de amanhã\" (A2).",
         "- B3 é novo, porque o art. 166 do CPM é tema recorrente de dúvida entre militares e rende um episódio útil.", ""]
    for q in ("A", "B"):
        L += [f"# Quadro · {QN[q]}", ""]
        for ep in [e for e in EPS if e["q"] == q]:
            cue, tot, dur = stats(ep)
            L += [f"## Episódio {ep['n']} · {ep['titulo']}", f"**Base:** {ep['base']}", f"**Duração estimada:** {round(dur)} segundos, em leitura calma ({tot} palavras). **Arquivo do teleprompter:** `teleprompter/{ep['id']}.txt`.", "",
                  "**Tempos**"]
            L += [f"- **{mm(a)} a {mm(b)}** · {n} ({w} palavras)" for n, w, a, b in cue]
            L += ["", "**Em tela (aplicar na edição, sem ler no teleprompter)**"] + [f"- {x}" for x in ep["tela"]]
            L += ["", f"**Câmera B:** {ep['camb']}", "", "**Conferir antes de gravar**"] + [f"- {x}" for x in ep["conferir"]]
            L += ["", f"**Legenda sugerida:** {ep['legenda']}", ""]
    return "\n".join(L)


def md_html(md):
    out, lista = [], False
    for ln in md.splitlines():
        s = html.escape(ln)
        s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
        s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
        item = bool(re.match(r"(- |\d+\. )", ln))
        if lista and not item:
            out.append("</ul>"); lista = False
        if ln.startswith("# "): out.append(f"<h1>{s[2:]}</h1>")
        elif ln.startswith("## "): out.append(f"<h2>{s[3:]}</h2>")
        elif item:
            if not lista: out.append("<ul>"); lista = True
            out.append("<li>" + re.sub(r"^(- |\d+\. )", "", s) + "</li>")
        elif ln.strip(): out.append(f"<p>{s}</p>")
    if lista: out.append("</ul>")
    return "\n".join(out)


def html_md(md):
    return f'''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>{FACE}
@page{{size:A4;margin:18mm 16mm}}
body{{font-family:Gotham,Montserrat,sans-serif;color:#0d131a;font-weight:300;font-size:9.8pt;line-height:1.48}}
h1{{font-weight:900;font-size:16pt;letter-spacing:-.02em;color:#031c37;margin:7mm 0 4mm}}
h2{{font-weight:500;font-size:9.5pt;letter-spacing:.12em;text-transform:uppercase;color:#9b6b26;margin:6mm 0 2mm;break-after:avoid}}
p{{margin-bottom:2.5mm}} ul{{margin:0 0 2.5mm 5mm}} li{{margin-bottom:1.2mm}}
b{{font-weight:500}} code{{font-family:inherit;background:#eef0f1;padding:0 1.4mm}}
</style>{md_html(md)}</html>'''


def main():
    (OUT / "teleprompter").mkdir(exist_ok=True)
    for ep in EPS:
        (OUT / "teleprompter" / f"{ep['id']}.txt").write_text(txt_ep(ep))
    md = md_geral()
    (OUT / "roteiros-gravacao.md").write_text(md)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        jobs = [(f"teleprompter-{'o-que-o-processo-nao-mostra' if q == 'A' else 'antes-da-consequencia'}.pdf", html_tp(q)) for q in ("A", "B")]
        jobs.append(("roteiros-gravacao.pdf", html_md(md)))
        for nome, h in jobs:
            arq = HERE / (nome + ".html"); arq.write_text(h)
            pg = b.new_page(); pg.goto(arq.as_uri()); pg.wait_for_timeout(800)
            pg.pdf(path=str(OUT / nome), prefer_css_page_size=True, print_background=True)
            pg.close(); arq.unlink()
        b.close()
    for ep in EPS:
        cue, tot, dur = stats(ep)
        print(ep["id"], tot, "palavras", round(dur), "s")


if __name__ == "__main__":
    main()
