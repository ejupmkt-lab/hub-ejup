#!/usr/bin/env python3
"""Roteiros de gravação do Dr. Jarbas: textos de teleprompter (txt e PDF) e folha de gravação (md e PDF)."""
import html, importlib.util, pathlib, re
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
FONTS = (HERE.parents[2] / "skills" / "ejup-design" / "assets" / "fonts").as_uri()
RITMO = 2.5  # palavras por segundo, leitura calma

ABERTURA_A = "Eu sou o Jarbas Bezerra, e este é O Que o Processo Não Mostra."
ABERTURA_B = "Eu sou o Jarbas Bezerra, e este é o Antes da Consequência."

# cada episódio: id, quadro, título, base, blocos [(nome, [linhas])], em tela, câmera B, legenda, conferir
EPS = [
 dict(id="A1", q="A", n=1, titulo="O voto que os autos não registram", base="Conselho de Justiça e sessão secreta (CF, art. 125, § 5º; CPPM, art. 434), com a experiência dele na presidência dos Conselhos",
  blocos=[("GANCHO", ['Na Justiça Militar estadual, a sentença costuma nascer numa sala fechada, depois que as partes saem.']),
          ("ABERTURA", [ABERTURA_A]),
          ("CORPO", ['Desde dois mil e quatro, crime militar contra civil é julgado pelo juiz de direito, sozinho, e o doloso contra a vida vai ao júri. Os demais vão ao Conselho de Justiça: o juiz preside e divide a mesa com quatro oficiais da corporação. Terminados os debates, o Conselho delibera em sessão secreta. Os oficiais perguntam sobre o direito, o juiz esclarece, e a decisão sai da maioria.']),
          ("EXPERIÊNCIA", ['Em quase vinte e oito anos, meu voto contou como um entre cinco. À mesa estavam oficiais que conheciam a tropa por dentro e nunca tinham estudado processo penal.']),
          ("SÍNTESE", ['Para quem advoga ali, a sustentação oral fala também a quatro julgadores que não são juristas. Argumento que só o juiz togado entende convence um voto em cinco.']),
          ("FECHO", ['Esta é uma reflexão geral, sem relação com processo real. Na próxima terça, volto com outro bastidor da decisão.'])],
  tela=["Abertura: letreiro \"O Que o Processo Não Mostra\" por 2 s.", "Na frase de 2004: \"Constituição, art. 125, § 5º\".", "Na sessão secreta: \"Código de Processo Penal Militar, art. 434\".", "Em \"um entre cinco\": cinco cadeiras desenhadas, uma acesa (grafismo simples, sem rosto).", "Fecho: aviso \"Reflexão geral, sem relação com processo real\"."],
  camb="Mesa de madeira vista de cima, cinco cadeiras ou cinco blocos de papel em fila; a mão dele afasta um dos blocos para o centro.",
  legenda="Na Justiça Militar estadual, a maior parte dos crimes militares é julgada por um Conselho: o juiz de direito e quatro oficiais, que deliberam em sessão secreta (CF, art. 125, § 5º; CPPM, art. 434). O voto do juiz conta como um entre cinco, e isso muda a forma de sustentar uma defesa. Reflexão geral, sem relação com processo real.",
  conferir=["CF, art. 125, § 4º, ressalva a competência do júri quando a vítima for civil (crime doloso contra a vida); o § 5º (EC 45/2004) dá ao juiz de direito o julgamento singular dos crimes militares contra civis e ações contra atos disciplinares; o Conselho de Justiça, sob a presidência do juiz de direito, julga os demais. Texto confirmado em fonte secundária em 08/10/2026 (Planalto fora do ar); conferir no Planalto.", "CPPM, art. 434: deliberação em sessão secreta, com os juízes militares podendo pedir esclarecimento sobre questão de direito. Confirmado em fonte secundária (LegJur) em 08/10/2026; conferir no Planalto.", "Composição \"juiz de direito e quatro oficiais\": é o modelo dos Conselhos (Lei 8.457/1992 na União); no RN depende da lei de organização judiciária. Dr. Jarbas confirma.", "\"Quase vinte e oito anos\", \"um entre cinco\" e \"oficiais que nunca tinham estudado processo penal\" são a experiência dele. Dr. Jarbas confirma que reflete o que viveu, e pode trocar por palavras dele.", "Segunda fonte (item 21): doutrina sobre o escabinato na Justiça Militar, a definir pelo revisor."]),
 dict(id="A2", q="A", n=2, titulo="Oito dias", base="Deserção (CPM, art. 187), educação cidadã, Probec e Dia Estadual da Educação Cívica (proposta, roteiro 11)",
  blocos=[("GANCHO", ['Oito dias. É o prazo que separa uma ausência sem licença do crime de deserção.']),
          ("ABERTURA", [ABERTURA_A]),
          ("CORPO", ['O artigo cento e oitenta e sete do Código Penal Militar pune com detenção de seis meses a dois anos o militar que se ausenta da unidade, sem licença, por mais de oito dias. Muitos jovens conheceram esse prazo diante de mim, na audiência. Alguns voltaram no nono dia, certos de que responderiam a uma falta disciplinar.']),
          ("EXPERIÊNCIA", ['Isso me levou para fora do gabinete. Ajudei a criar o Probec, o Programa Brasileiro de Educação Cidadã, para levar a lei à sala de aula antes que ela chegue aos autos.']),
          ("SÍNTESE", ['A sentença alcança o fato depois que ele aconteceu. A aula alcança o jovem antes. Quem comanda militares recém-incorporados pode começar por esse artigo.']),
          ("FECHO", ['Esta é uma reflexão pessoal, sem relação com processo real. Na próxima terça, volto com outro bastidor da decisão.'])],
  tela=["Abertura: letreiro \"O Que o Processo Não Mostra\" por 2 s.", "No gancho: o número 8 grande, sozinho na tela, por 1 s.", "Na citação: \"Código Penal Militar, art. 187 · detenção de 6 meses a 2 anos\".", "Quando falar do Probec: logotipo do programa, se houver autorização de uso, e a linha \"10 de setembro · Dia Estadual da Educação Cívica (RN, 2013)\".", "Fecho: aviso \"Reflexão pessoal, sem relação com processo real\"."],
  camb="Calendário de mesa ou folha com oito traços riscados à caneta e o nono em branco; depois, o Código Penal Militar aberto no art. 187.",
  legenda="Mais de oito dias de ausência sem licença e a falta vira crime de deserção (CPM, art. 187, detenção de seis meses a dois anos). Por que um juiz militar decidiu levar a lei para a sala de aula. Reflexão pessoal, sem relação com processo real.",
  conferir=["CPM, art. 187 (deserção: ausência sem licença por mais de oito dias; detenção de seis meses a dois anos, agravada se oficial). Confirmado em fontes secundárias em 08/10/2026 (Planalto fora do ar); conferir no Planalto.", "\"Conheceram esse prazo diante de mim, na audiência\" e \"voltaram no nono dia\" são relato dele, sem caso, nome ou local. Dr. Jarbas confirma que reflete o que viu.", "Lei Complementar estadual nº 494/2013 (Dia Estadual da Educação Cívica, 10 de setembro): conferir o texto na fonte.", "\"Ajudei a criar o Probec\": o programa foi idealizado com a advogada Lígia Limeira, segundo a Assembleia. Dr. Jarbas decide se cita a coautoria.", "Segunda fonte (item 21): doutrina ou jurisprudência do STM sobre a contagem do prazo da deserção (CPPM, art. 451), a definir pelo revisor."]),
 dict(id="A3", q="A", n=3, titulo="A Justiça Militar como especialidade", base="Direito Penal Militar aplicado (proposta, roteiro 12)",
  blocos=[("GANCHO", ["A Justiça Militar é uma extensão da Justiça comum, ou uma especialidade? A resposta muda a forma de advogar."]),
          ("ABERTURA", [ABERTURA_A]),
          ("CORPO", ["A Constituição organiza as Forças Armadas, as polícias militares e os bombeiros militares com base na hierarquia e na disciplina, e são esses os valores que a jurisdição militar protege. Na vida civil, certos deveres parecem secundários. Na vida em tropa, eles sustentam a própria instituição, e por isso a lógica da caserna pede uma leitura própria. Quando o advogado leva para a Justiça Militar teses da Justiça comum, como a insignificância, ele precisa mostrar como elas dialogam com o bem jurídico militar."]),
          ("SÍNTESE", ["Quem entende a jurisdição constrói defesas mais sólidas. Por isso, vale entender a especialidade antes de assinar a peça."]),
          ("FECHO", ["Conteúdo educativo, sem orientação individual. Na próxima terça, volto com outro bastidor da decisão."])],
  tela=["Abertura: letreiro \"O Que o Processo Não Mostra\" por 2 s.", "Primeira frase do corpo: \"Constituição, arts. 42 e 142\".", "Fecho: aviso \"Conteúdo educativo, sem orientação individual\"."],
  camb="Constituição aberta sobre a mesa, com o art. 142 em foco; mão passando o dedo na linha.",
  legenda="A Justiça Militar é uma especialidade, com bens jurídicos próprios: a hierarquia e a disciplina. O que isso muda para quem advoga na área. Conteúdo educativo, sem orientação individual.",
  conferir=["Arts. 42 (caput, redação da EC 18/1998) e 142 da Constituição conferidos no Planalto em 06/10/2026: instituições \"organizadas com base na hierarquia e disciplina\".", "A frase sobre a insignificância é síntese cautelosa. A proposta original dizia que aplicar teses genéricas é \"receita certa para a improcedência\", afirmação que não cabe sem jurisprudência. [conferir posição atual do STM e do STF antes de gravar; incluir a segunda fonte]."]),
 dict(id="B1", q="B", n=1, titulo="Entre dois artigos", base="Obediência hierárquica (CPM, art. 38) e recusa de obediência (CPM, art. 163)",
  blocos=[("GANCHO", ['Toda ordem recebida coloca o militar entre dois artigos do Código Penal Militar.']),
          ("ABERTURA", [ABERTURA_B]),
          ("CORPO", ['O cento e sessenta e três pune quem recusa obediência a ordem do superior sobre assunto de serviço. O trinta e oito protege quem cumpre ordem direta do superior, em matéria de serviço. A proteção acaba quando a ordem manda praticar ato manifestamente criminoso, ou quando há excesso na execução. Aí o subordinado responde junto com quem mandou. Repare na palavra manifestamente. A lei dispensa o soldado de dar parecer jurídico sobre cada ordem e cobra dele a recusa do crime evidente.']),
          ("EXPERIÊNCIA", ['Nas audiências que presidi, a discussão mais difícil girava em torno do excesso, que pertence a quem executa, mesmo quando a ordem era legal.']),
          ("SÍNTESE", ['O dever de cumprir vem da hierarquia. A forma de cumprir é de quem executa, e é por ela que se responde.']),
          ("FECHO", ['Conteúdo educativo, sem orientação individual. Na próxima quinta, volto com outro cuidado antes da consequência.'])],
  tela=["Abertura: letreiro \"Antes da Consequência\" por 2 s.", "No gancho: \"art. 163\" à esquerda e \"art. 38\" à direita, o militar no meio (grafismo simples).", "No art. 163: \"Recusa de obediência · detenção de 1 a 2 anos\".", "No art. 38: destacar \"manifestamente criminoso\" e \"excesso\".", "Fecho: aviso \"Conteúdo educativo, sem orientação individual\"."],
  camb="Código Penal Militar aberto, a caneta marcando primeiro o art. 163 e depois o art. 38; dedo parado sobre a palavra \"manifestamente\".",
  legenda="Recusar ordem legal é crime (CPM, art. 163). Cumprir ordem manifestamente criminosa, ou executar com excesso, também é (CPM, art. 38). O que a palavra \"manifestamente\" pede do militar. Conteúdo educativo, sem orientação individual.",
  conferir=["CPM, art. 38, alínea b e § 2º (\"é punível também o inferior\"; redação do § 2º dada pela Lei nº 14.688/2023), conferido no Planalto em 06/10/2026.", "CPM, art. 163 (recusa de obediência; detenção de um a dois anos, se o fato não constitui crime mais grave). Confirmado em fontes secundárias em 08/10/2026 (Planalto fora do ar); conferir no Planalto.", "\"A discussão mais difícil girava em torno do excesso\" é relato dele. Dr. Jarbas confirma.", "Segunda fonte (item 21): doutrina sobre a obediência hierárquica e o \"manifestamente criminoso\" (por exemplo, Jorge César de Assis ou Cícero Robson Coimbra Neves), a definir pelo revisor."]),
 dict(id="B2", q="B", n=2, titulo="A frase lida pela metade", base="Controle judicial da punição disciplinar militar (CF, art. 142, § 2º; art. 125, §§ 4º e 5º; art. 5º, LV; STF, RE 338.840)",
  blocos=[("GANCHO", ['Há uma frase na Constituição que muito comandante lê pela metade: não caberá habeas corpus em relação a punições disciplinares militares.']),
          ("ABERTURA", [ABERTURA_B]),
          ("CORPO", ['Está no artigo cento e quarenta e dois. O Supremo leu a frase inteira: o mérito da punição fica com o comando, e a legalidade continua sob controle do juiz. O juiz examina hierarquia, poder disciplinar, ligação do fato com a função e pena cabível. Desde dois mil e quatro, as ações contra punições disciplinares chegam ao juiz de direito do juízo militar.']),
          ("EXPERIÊNCIA", ['Na minha mesa, as punições anuladas tinham quase sempre um vício de rito: acusação mal descrita, prazo de defesa ignorado, decisão sem fundamento.']),
          ("SÍNTESE", ['Antes de assinar uma punição, vale uma pergunta: o acusado soube exatamente do que era acusado e teve prazo para responder?']),
          ("FECHO", ['Conteúdo educativo, sem orientação individual. Na próxima quinta, volto com outro cuidado antes da consequência.'])],
  tela=["Abertura: letreiro \"Antes da Consequência\" por 2 s.", "No gancho: a frase do art. 142, § 2º, escrita, com a segunda metade apagada e depois revelada.", "Nos quatro pontos: lista curta \"hierarquia · poder disciplinar · ligação com a função · pena cabível\" e \"STF, RE 338.840\".", "Em 2004: \"Constituição, art. 125, §§ 4º e 5º\". Nos vícios de rito: \"Contraditório e ampla defesa · Constituição, art. 5º, LV\".", "Fecho: aviso \"Conteúdo educativo, sem orientação individual\"."],
  camb="Constituição aberta no art. 142, a mão cobrindo metade da linha do § 2º e depois descobrindo; em seguida, uma folha de punição com o campo \"defesa\" em branco.",
  legenda="\"Não caberá habeas corpus em relação a punições disciplinares militares\" (CF, art. 142, § 2º). Para o STF, o mérito fica com o comando e a legalidade continua sob controle do juiz (RE 338.840). Os vícios de rito que mais anulam punições. Conteúdo educativo, sem orientação individual.",
  conferir=["CF, art. 142, § 2º, e art. 5º, LV: textos conhecidos; art. 5º, LV conferido no Planalto em 06/10/2026; conferir o art. 142, § 2º, no Planalto.", "STF, RE 338.840, 2ª Turma, Rel. Min. Ellen Gracie, julgado em 19/08/2003: o exame do habeas corpus alcança os pressupostos de legalidade (hierarquia, poder disciplinar, ato ligado à função, pena susceptível de aplicação disciplinar). Confirmado em fontes secundárias (Dizer o Direito); conferir a ementa no portal do STF. É a segunda fonte do episódio (jurisprudência).", "CF, art. 125, §§ 4º e 5º (EC 45/2004): ações judiciais contra atos disciplinares militares julgadas singularmente pelo juiz de direito do juízo militar. Conferir no Planalto.", "\"As punições anuladas tinham quase sempre um vício de rito\" é a experiência dele. Dr. Jarbas confirma, e ajusta os três exemplos se quiser.", "Revisão jurídica: o texto fala do controle de legalidade em geral, sem prometer anulação a ninguém."]),
 dict(id="B3", q="B", n=3, titulo="Antes de publicar: o militar nas redes sociais", base="Prevenção, CPM art. 166 (proposta nova, tema da pauta)",
  blocos=[("GANCHO", ["Um militar pode publicar documento oficial, ou criticar o superior, nas redes sociais?"]),
          ("ABERTURA", [ABERTURA_B]),
          ("CORPO", ["O Código Penal Militar trata do tema no artigo cento e sessenta e seis. O texto prevê a conduta de publicar, sem licença, ato ou documento oficial, e a de criticar publicamente ato de superior ou assunto atinente à disciplina militar. A pena prevista é de detenção, de dois meses a um ano, se o fato não constitui crime mais grave. Os limites desse artigo diante da liberdade de expressão ainda são debatidos nos tribunais."]),
          ("PREVENTIVO", ["Antes de publicar, vale perguntar: o conteúdo é oficial? Existe licença? Ele trata de disciplina militar? Na dúvida, consulte o setor jurídico da corporação."]),
          ("SÍNTESE", ["A internet guarda tudo. Por isso, conheça a regra antes de publicar."]),
          ("FECHO", ["Conteúdo educativo, sem orientação individual. Na próxima quinta, volto com outro cuidado antes da consequência."])],
  tela=["Abertura: letreiro \"Antes da Consequência\" por 2 s.", "Primeira frase do corpo: \"Código Penal Militar, art. 166\".", "Fecho: aviso \"Conteúdo educativo, sem orientação individual\"."],
  camb="Código Penal Militar aberto no art. 166, plano diagonal; um celular desfocado no canto, sem tela legível.",
  legenda="O Código Penal Militar trata de publicar ato ou documento oficial, sem licença, e de criticar publicamente ato de superior ou assunto de disciplina militar (art. 166). Os limites diante da liberdade de expressão são debatidos nos tribunais. Conteúdo educativo, sem orientação individual.",
  conferir=["Texto do art. 166 do CPM e a pena (detenção de dois meses a um ano) conferidos no Planalto em 06/10/2026.", "A relação do art. 166 com a liberdade de expressão está sob debate. [conferir a jurisprudência atual do STF e do STM antes de gravar; incluir a segunda fonte]. O texto falado só informa a existência do debate.", "Este episódio é novo (não consta na proposta). Dr. Jarbas confirma se entra na gravação."]),
]

# Versão 3 (09/10/2026): A1, A2, B1 e B2 viram vídeos individuais, sem quadro.
# A fala, o lettering e a legenda vêm de videos_v3.py.
_spec = importlib.util.spec_from_file_location("videos_v3", HERE / "videos_v3.py")
V3 = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(V3)
for _ep in EPS:
    _v = V3.VIDEOS.get(_ep["id"])
    if not _v:
        continue
    _ep.update(titulo=_v["titulo"], base=f"Vídeo individual {_v['num']} (versão de 09/10/2026, sem quadro) · {_v['local']}",
               blocos=V3.blocos(_ep["id"]), legenda=_v["legenda"], conferir=_v["conferir"],
               camb="Sem câmera B: o vídeo inteiro é o Dr. Jarbas falando para a câmera.",
               tela=[f"Em \"{' '.join(V3.limpa(f).split()[:5])}…\": {l}" for _, _, f, l in _v["seg"] if l])


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
         "- B3 é novo, porque o art. 166 do CPM é tema recorrente de dúvida entre militares e rende um episódio útil.", "",
         "## Versão 3 (09/10/2026): quatro vídeos individuais",
         "- Pedido do Victor: sem nome de quadro, sem apresentação de quadro e sem gancho para o próximo episódio. Cada vídeo fica de pé sozinho, com gancho, autoridade, informação prática para a área jurídica e CTA. Linguagem sem juridiquês; o aviso educativo vai só no lettering.",
         "- Textos, lettering e legendas em `_build/videos_v3.py`. O PDF de gravação é `Roteiros_Dr_Jarbas_19-10.pdf`.", "",
         "## Versão 2 (08/10/2026): A1, A2, B1 e B2 reescritos",
         "- Pedido do Victor: tirar a cara de IA e o senso comum. As máximas genéricas (\"Quem decide carrega essa soma\", \"Firmeza e método andam juntos\") saíram.",
         "- Cada episódio agora entrega uma informação que só quem conhece a Justiça Militar por dentro tem: o Conselho de Justiça e a sessão secreta (A1), o prazo de oito dias da deserção (A2), o militar entre os arts. 163 e 38 do CPM (B1) e a leitura do STF sobre o habeas corpus na punição disciplinar (B2).",
         "- Os relatos pessoais novos estão marcados em \"Conferir antes de gravar\". O Dr. Jarbas confirma ou troca por palavras dele.",
         "- O Planalto estava fora do ar em 08/10/2026. Os artigos novos foram confirmados em fontes secundárias e precisam de conferência final no Planalto.", ""]
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
