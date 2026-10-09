"""Versão 3 (09/10/2026) dos quatro vídeos que o Dr. Jarbas grava em 19/10.

Pedido do Victor: cada vídeo é individual. Sem nome de quadro, sem apresentação
de quadro e sem gancho para o próximo episódio. Gancho nos primeiros segundos,
gatilhos (curiosidade, autoridade, número concreto, consequência, utilidade),
CTA honesto no fim, linguagem sem juridiquês e relevância para quem é da área
jurídica. O aviso educativo vai só no lettering.

Fonte única da fala: o gerar.py monta o teleprompter daqui e o
roteiro_tecnico.py monta o PDF de Imagem, Fala e Lettering. Palavras entre
** ** são as de ênfase.

Cada trecho: (bloco, imagem, fala, lettering).
"""

AVISO = "Conteúdo educativo, sem orientação individual"

VIDEOS = {
 "A1": dict(
  num=1, titulo="O juiz que pode perder a votação", local="Locação 1 · gabinete, sentado à mesa",
  seg=[
   ("GANCHO", "PP. Olhar firme na lente, sem sorriso.", "Tem um julgamento no Brasil em que o juiz pode **perder a votação** para quatro pessoas que não precisam ser formadas em Direito.", "O juiz pode perder a votação"),
   ("AUTORIDADE", "PM.", "É a Justiça Militar dos estados. Eu julguei ali por **quase vinte e oito anos**.", "Jarbas Bezerra · [título a confirmar]"),
   ("CONTEÚDO", "PM.", "Na maior parte dos crimes militares, quem decide é um grupo de cinco: o juiz e **quatro oficiais** da própria polícia ou do corpo de bombeiros.", "1 juiz + 4 oficiais · Constituição, art. 125, § 5º"),
   ("CONTEÚDO", "PP.", "Depois que acusação e defesa falam, a porta fecha. Os cinco discutem sozinhos, e vale a **maioria**.", "Votação a portas fechadas · CPPM, art. 434"),
   ("VIRADA", "PP. Pausa curta antes da frase.", "Agora pense no advogado que chega ali falando como se tivesse **um juiz só** na frente.", ""),
   ("VIRADA", "PM.", "Cita súmula, cita doutrina, usa termo técnico. Convence um voto. Os outros quatro não acompanham, e são eles que formam a maioria.", "Grafismo: cinco cadeiras, uma acesa"),
   ("VIRADA", "PP. Segurar 1 s de silêncio depois da frase.", "Ali, a defesa que funciona é a que um oficial com anos de tropa **entende e concorda**.", ""),
   ("CTA", "PM. Tom de conversa, olhar na lente até o fim.", "Se você advoga ou quer advogar na área militar, **salva esse vídeo**. E manda para aquele colega que trata a Justiça Militar como se fosse a comum.", "Salve e envie para um colega · " + AVISO),
  ],
  legenda="Na Justiça Militar dos estados, a maior parte dos crimes é julgada por cinco pessoas: o juiz e quatro oficiais. Eles votam a portas fechadas e vale a maioria (CF, art. 125; CPPM, art. 434). Para quem advoga ali, isso muda tudo na forma de defender. Salve e envie para quem atua na área. " + AVISO + ".",
  conferir=[
   "CF, art. 125, § 5º (EC 45/2004): o Conselho de Justiça, presidido pelo juiz de direito, julga os crimes militares, salvo os cometidos contra civis (juiz sozinho) e os dolosos contra a vida de civil (júri, § 4º). Por isso o vídeo diz \"a maior parte\". Conferir no Planalto (fora do ar em 08/10).",
   "CPPM, art. 434: o Conselho delibera em sessão secreta. Confirmado em fonte secundária; conferir no Planalto.",
   "\"Quatro oficiais da própria polícia ou do corpo de bombeiros\": composição do Conselho no RN pela lei de organização judiciária. Dr. Jarbas confirma.",
   "\"Não precisam ser formadas em Direito\": os juízes militares são oficiais, sem exigência de formação jurídica. Dr. Jarbas confirma a frase.",
   "\"Eu julguei ali por quase vinte e oito anos\": Dr. Jarbas confirma tempo e forma de dizer.",
  ]),
 "A2": dict(
  num=2, titulo="Oito dias", local="Locação 1 · gabinete, sentado à mesa",
  seg=[
   ("GANCHO", "PP. Olhar firme na lente.", "Um militar sai do quartel sem autorização e volta em oito dias: o problema é **disciplinar**. Passou do oitavo dia, vira **crime**.", "8 dias"),
   ("CONTEÚDO", "PM.", "É a deserção. A pena vai de **seis meses a dois anos** de detenção.", "Deserção · Código Penal Militar, art. 187"),
   ("AUTORIDADE", "PM.", "Em quase vinte e oito anos julgando militares, vi muitos jovens descobrirem essa conta **na frente do juiz**.", "Jarbas Bezerra · [título a confirmar]"),
   ("CONTEÚDO", "PP.", "Voltavam no nono dia achando que iam levar uma punição interna. Saíam com um **processo criminal**.", ""),
   ("VIRADA", "PM.", "Para quem advoga, o primeiro passo é confirmar a data exata da saída e da volta. **Um dia** muda o caso inteiro.", "Data da saída · data da volta"),
   ("VIRADA", "PP. Pausa curta antes da frase.", "E tem um detalhe que muda a defesa: se ele se apresentar por conta própria em até oito dias depois disso, a lei manda **reduzir a pena pela metade**.", "Apresentação voluntária · CPM, art. 189, I"),
   ("AUTORIDADE", "PM.", "Foi por ver tanta gente chegar tarde a essa informação que passei a levar a lei para a sala de aula, com o **Probec**.", "Probec · Programa Brasileiro de Educação Cidadã"),
   ("CTA", "PM. Olhar na lente até o fim.", "Se você advoga para militares, ou tem alguém da família na tropa, **manda esse vídeo** para essa pessoa.", "Envie para quem precisa saber · " + AVISO),
  ],
  legenda="Até oito dias fora do quartel sem autorização, o problema é disciplinar. Do nono dia em diante, é deserção: crime com pena de seis meses a dois anos de detenção (CPM, art. 187). E quem se apresenta por conta própria em até oito dias depois disso tem a pena reduzida pela metade (CPM, art. 189, I). Envie para quem precisa saber. " + AVISO + ".",
  conferir=[
   "CPM, art. 187 (deserção: ausência sem licença por mais de oito dias; detenção de seis meses a dois anos) e art. 189, I (apresentação voluntária em até oito dias após a consumação: pena diminuída de metade). Confirmados em fontes secundárias; conferir no Planalto.",
   "\"Volta em oito dias: o problema é disciplinar\" é simplificação para o vídeo; ausência menor pode ter outras consequências conforme o regulamento. Revisor jurídico confirma.",
   "\"Vi muitos jovens descobrirem essa conta na frente do juiz\" e \"voltavam no nono dia\" são relato dele. Dr. Jarbas confirma.",
   "Probec: autorização para citar e coautoria (o programa foi idealizado com a advogada Lígia Limeira, segundo a Assembleia). Dr. Jarbas decide.",
  ]),
 "B1": dict(
  num=3, titulo="Obedecer também pode dar condenação", local="Locação 2 · em pé, parede neutra",
  seg=[
   ("GANCHO", "PP. Olhar firme na lente.", "O militar que recusa uma ordem pode ser **condenado**. O que cumpre a ordem também pode.", "Recusar ou cumprir?"),
   ("AUTORIDADE", "PM.", "Eu julguei crimes militares por quase vinte e oito anos, e a lei resolve isso em **dois artigos**.", "Jarbas Bezerra · [título a confirmar]"),
   ("CONTEÚDO", "PM. Mão esquerda marca o primeiro artigo.", "Recusar ordem de serviço do superior é crime, com pena de **um a dois anos** de detenção.", "Recusa de obediência · Código Penal Militar, art. 163"),
   ("CONTEÚDO", "PM. Mão direita marca o segundo artigo.", "Cumprir a ordem protege o militar, com **duas exceções**.", "Código Penal Militar, art. 38"),
   ("CONTEÚDO", "PP.", "Quando a ordem é para fazer algo **claramente criminoso**. E quando ele **exagera** na hora de cumprir.", "1. ordem manifestamente criminosa · 2. excesso"),
   ("CONTEÚDO", "PM.", "Nesses casos, quem cumpriu responde junto com quem mandou.", ""),
   ("VIRADA", "PP. Pausa curta antes da frase.", "Repare no **claramente**. A lei poupa o soldado de analisar cada ordem como um advogado e cobra dele a recusa do absurdo, aquilo que qualquer pessoa enxerga como crime.", "\"Claramente\""),
   ("VIRADA", "PM.", "E o exagero fica sempre na conta de quem executa, mesmo quando a ordem era legal.", ""),
   ("VIRADA", "PP. Segurar 1 s de silêncio depois da frase.", "Por isso, na defesa, a pergunta que costuma decidir o caso é **como** a ordem foi cumprida.", ""),
   ("CTA", "PM. Olhar na lente até o fim.", "Se você atua na área criminal, **salva esse vídeo**. Essa diferença decide processo.", "Salve para consultar · " + AVISO),
  ],
  legenda="Recusar ordem de serviço é crime (CPM, art. 163). Cumprir também pode ser, quando a ordem é claramente criminosa ou quando há excesso na execução (CPM, art. 38). Na defesa, a pergunta que costuma decidir é como a ordem foi cumprida. Salve para consultar. " + AVISO + ".",
  conferir=[
   "CPM, art. 38, alínea b e § 2º (\"é punível também o inferior\"; redação do § 2º dada pela Lei nº 14.688/2023), conferido no Planalto em 06/10/2026.",
   "CPM, art. 163 (recusa de obediência; detenção de um a dois anos, se o fato não constitui crime mais grave). Confirmado em fontes secundárias; conferir no Planalto.",
   "\"Claramente criminoso\" traduz o \"manifestamente criminoso\" da lei; o lettering mostra o termo legal. Revisor jurídico confirma a tradução.",
   "\"Eu julguei crimes militares por quase vinte e oito anos\": Dr. Jarbas confirma.",
  ]),
 "B2": dict(
  num=4, titulo="A frase que todo mundo lê pela metade", local="Locação 2 · em pé, parede neutra",
  seg=[
   ("GANCHO", "PP. Olhar firme na lente.", "A Constituição diz que não cabe habeas corpus contra punição disciplinar de militar. Muito comandante para de ler aí. **E muito advogado também.**", "Lida pela metade · Constituição, art. 142, § 2º"),
   ("AUTORIDADE", "PM.", "Passei **quase vinte e oito anos** julgando na Justiça Militar.", "Jarbas Bezerra · [título a confirmar]"),
   ("CONTEÚDO", "PM.", "O Supremo já decidiu como ler essa regra. Se a punição foi justa, quem decide é o **comando**. Se ela foi legal, quem confere é o **juiz**.", "STF, RE 338.840"),
   ("CONTEÚDO", "PM. Contar os três pontos com a mão.", "O juiz olha se quem puniu tinha autoridade sobre o militar, se o fato tinha ligação com o serviço e se aquela punição podia ser aplicada.", "autoridade · ligação com o serviço · punição cabível"),
   ("AUTORIDADE", "PP.", "Na minha mesa, a punição que caía quase sempre caía pela **forma**: o militar não sabia direito do que era acusado, não teve prazo para se defender, ou a decisão não explicava o porquê.", "Direito de defesa · Constituição, art. 5º, LV"),
   ("VIRADA", "PM.", "Antes de discutir se a punição foi justa, **confira o processo**.", ""),
   ("CTA", "PM, indo a PP na pergunta. Olhar na lente até o fim.", "Se você atende militares, **salva esse vídeo**. E se você comanda, faça duas perguntas antes de assinar uma punição: ele sabe exatamente do que é acusado? Teve prazo para responder?", "Salve e envie · " + AVISO),
  ],
  legenda="\"Não caberá habeas corpus em relação a punições disciplinares militares\" (CF, art. 142, § 2º). Para o STF, a justiça da punição fica com o comando e a legalidade fica com o juiz (RE 338.840). Na prática, os erros de forma são os que mais derrubam punições. Salve e envie para quem atende militares. " + AVISO + ".",
  conferir=[
   "CF, art. 142, § 2º, e art. 5º, LV. Conferir no Planalto.",
   "STF, RE 338.840, 2ª Turma, Rel. Min. Ellen Gracie, 19/08/2003: o exame alcança os pressupostos de legalidade (hierarquia, poder disciplinar, ato ligado à função, pena susceptível de aplicação disciplinar). No vídeo, hierarquia e poder disciplinar viram \"autoridade\". Conferir a ementa no portal do STF.",
   "\"A punição que caía quase sempre caía pela forma\" é experiência dele. Dr. Jarbas confirma.",
   "Revisão jurídica: o texto fala do controle de legalidade em geral, sem prometer anulação a ninguém.",
  ]),
}


def limpa(t):
    return t.replace("**", "")


def blocos(k):
    """Agrupa os trechos em blocos para o teleprompter, na ordem em que aparecem."""
    out = []
    for bloco, _, fala, _ in VIDEOS[k]["seg"]:
        if out and out[-1][0] == bloco:
            out[-1][1][0] += " " + limpa(fala)
        else:
            out.append((bloco, [limpa(fala)]))
    return out
