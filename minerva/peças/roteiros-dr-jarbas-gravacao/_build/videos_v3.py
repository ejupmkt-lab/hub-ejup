"""Versão 4 (09/10/2026) dos quatro vídeos que o Dr. Jarbas grava em 19/10.

Temas diversos (pedido do Victor): cidadania como ciência (tese e livros dele),
Justiça Militar, a Lei nº 15.468/2026 e os atos gratuitos da Lei nº 9.265/1996.
A linguagem e a estrutura da versão 3 continuam.

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
# as duas locações no Espaço Jarbas Bezerra (fotos de 09/10/2026)
LOC1 = "Locação 1 · gabinete vermelho, sentado à mesa"
LOC2 = "Locação 2 · sala de madeira, Têmis e cadeiras antigas"

VIDEOS = {
 "A1": dict(
  num=1, titulo="Cidadania tem método", local=LOC1,
  seg=[
   ("GANCHO", "PP. Sentado à mesa do gabinete vermelho, estante com a Têmis e as corujas ao fundo. Livro A Cidadania como Ciência em pé sobre a mesa, capa para a câmera. Fora de quadro: a vitrine de carteiras, que mostra números de documentos.", "Pergunte a um advogado o que é cidadania. A resposta quase sempre é **uma lista** de direitos e deveres.", "O que é cidadania?"),
   ("AUTORIDADE", "PM.", "Eu passei anos estudando essa pergunta. Ela virou minha tese de doutorado em Educação, na UFRN, e hoje são **dois livros**.", "Jarbas Bezerra · [título a confirmar]"),
   ("CONTEÚDO", "PP. Pausa curta antes da frase.", "A conclusão é que cidadania é uma **ciência**.", "Cidadania como ciência"),
   ("CONTEÚDO", "PM. Contar os quatro pontos com a mão.", "Ela tem objeto próprio, fundamentos, princípios e **método**, como qualquer outro campo do conhecimento.", "objeto · fundamentos · princípios · método"),
   ("CONTEÚDO", "PM.", "E ela conversa com todos eles: com o Direito, com a educação, com a saúde, com a economia.", ""),
   ("VIRADA", "PP.", "Para quem é da área jurídica, isso muda a pergunta. Ela passa a ser se a pessoa **sabe exercer** os direitos que tem.", ""),
   ("VIRADA", "PM.", "Direito que a pessoa desconhece fica no papel. É ali que a cidadania pede **educação**, e é ali que o jurista tem trabalho a fazer.", ""),
   ("CTA", "PM. Olhar na lente até o fim.", "Comenta aqui: qual direito você vê as pessoas deixarem de usar por não saber que têm? E, se quiser ir fundo, o livro novo se chama **Cidadania: a Ciência das Ciências**.", "Livros · A Cidadania como Ciência e Cidadania: a Ciência das Ciências · " + AVISO),
  ],
  legenda="Cidadania costuma ser lembrada como uma lista de direitos e deveres. Na tese de doutorado em Educação (UFRN, 2022) e nos livros que vieram dela, a cidadania é tratada como ciência: objeto próprio, fundamentos, princípios e método. Para quem é da área jurídica, a pergunta muda: a pessoa sabe exercer os direitos que tem? Livro novo: Cidadania: a Ciência das Ciências. " + AVISO + ".",
  conferir=[
   "Doutorado em Educação pela UFRN (2022), tese \"A cidadania como Ciência\": perfil do docente no SIGAA/UFRN.",
   "Tese do livro (objeto próprio, fundamentos, princípios e método; diálogo com Direito, educação, saúde e economia): Tribuna do Norte, lançamento de 30/09/2026.",
   "\"Dois livros\": o primeiro, A Cidadania como Ciência (Editora Idearte), confirmado pela capa nas fotos do escritório; o novo é Cidadania: a Ciência das Ciências, lançado em 30/09/2026.",
   "Título exato do livro novo: Tribuna do Norte grafa \"Cidadania - a Ciência das Ciências\". Dr. Jarbas confirma a grafia para o lettering.",
  ]),
 "B1": dict(
  num=3, titulo="O juiz que pode perder a votação", local=LOC2,
  seg=[
   ("GANCHO", "PP. Sentado numa das cadeiras antigas de couro, A Calúnia de Apeles (Botticelli) acima dele. Olhar firme, sem sorriso. Crucifixo fora de quadro, se a opção for neutralidade.", "Tem um julgamento no Brasil em que o juiz pode **perder a votação** para quatro pessoas que não precisam ser formadas em Direito.", "O juiz pode perder a votação"),
   ("AUTORIDADE", "PM.", "É a Justiça Militar dos estados. Eu julguei ali por **quase vinte e oito anos**.", "Jarbas Bezerra · [título a confirmar]"),
   ("CONTEÚDO", "PM.", "Na maior parte dos crimes militares, quem decide é um grupo de cinco: o juiz e **quatro oficiais** da própria polícia ou do corpo de bombeiros.", "1 juiz + 4 oficiais · Constituição, art. 125, § 5º"),
   ("CONTEÚDO", "PP.", "Depois que acusação e defesa falam, a porta fecha. Os cinco discutem sozinhos, e vale a **maioria**.", "Votação a portas fechadas · CPPM, art. 434"),
   ("VIRADA", "PP. Pausa curta antes da frase.", "Agora pense no advogado que chega ali falando como se tivesse **um juiz só** na frente.", ""),
   ("VIRADA", "PM.", "Cita súmula, cita doutrina, usa termo técnico. Convence um voto. Os outros quatro não acompanham, e são eles que formam a maioria.", "Grafismo: cinco cadeiras, uma acesa"),
   ("VIRADA", "PP. Segurar 1 s de silêncio depois da frase.", "Ali, a defesa que funciona é a que um oficial com anos de tropa **entende e concorda**.", ""),
   ("CTA", "PM. Tom de conversa, olhar na lente até o fim.", "Se você advoga ou quer advogar na área militar, **salva esse vídeo**. E manda para aquele colega que trata a Justiça Militar como se fosse a comum.", "Salve e envie para um colega · " + AVISO),
  ],
  legenda="Na Justiça Militar dos estados, a maior parte dos crimes é julgada por cinco pessoas: o juiz e quatro oficiais. Eles votam a portas fechadas e vale a maioria (CF, art. 125; CPPM, art. 434). Para quem advoga ali, isso muda a forma de defender. Salve e envie para quem atua na área. " + AVISO + ".",
  conferir=[
   "CF, art. 125, § 5º (EC 45/2004): o Conselho de Justiça, presidido pelo juiz de direito, julga os crimes militares, salvo os cometidos contra civis (juiz sozinho) e os dolosos contra a vida de civil (júri, § 4º). Por isso o vídeo diz \"a maior parte\". Conferir no Planalto.",
   "CPPM, art. 434: o Conselho delibera em sessão secreta. Confirmado em fonte secundária; conferir no Planalto.",
   "\"Quatro oficiais da própria polícia ou do corpo de bombeiros\" e \"não precisam ser formadas em Direito\": composição do Conselho no RN. Dr. Jarbas confirma.",
   "\"Eu julguei ali por quase vinte e oito anos\": o SIGAA registra magistratura desde 1990; o tempo na Justiça Militar vem da proposta. Dr. Jarbas confirma.",
  ]),
 "A2": dict(
  num=2, titulo="A lei que mudou a escola em julho", local=LOC1,
  seg=[
   ("GANCHO", "PP. Gabinete vermelho, câmera do outro lado da mesa: os painéis de recortes de jornal ao fundo. Gravata diferente da do vídeo 1.", "Em julho, uma lei mudou o que **toda escola do Brasil** precisa ensinar. E abriu uma porta para a área jurídica.", "Lei nº 15.468/2026"),
   ("CONTEÚDO", "PM.", "A Lei quinze mil quatrocentos e sessenta e oito colocou a **educação política e os direitos da cidadania** entre os conteúdos obrigatórios da educação básica.", "LDB, art. 26 · educação política e cidadania"),
   ("CONTEÚDO", "PM.", "Ele entra no estudo da realidade social e política. No mesmo dia, outra lei criou a **Semana Nacional da Ética e da Cidadania**, em maio.", "Lei nº 15.467/2026 · primeira semana de maio"),
   ("CONTEÚDO", "PP.", "Só que a lei não diz em que série isso entra, nem **quem vai ensinar**. Isso fica para regulamentação.", "Séries e formação de professores: a regulamentar"),
   ("AUTORIDADE", "PM.", "Eu defendo isso desde dois mil e treze, quando criamos o **Setembro Cidadão** no Rio Grande do Norte, com a advogada Lígia Limeira.", "Jarbas Bezerra · [título a confirmar]"),
   ("VIRADA", "PP. Pausa curta antes da frase.", "Agora pense: quem sabe explicar a Constituição em linguagem de sala de aula?", ""),
   ("VIRADA", "PM.", "Advogados, professores de Direito, defensores, juízes. A escola vai precisar de gente que traduza o Direito **sem perder o rigor**.", ""),
   ("CTA", "PM. Olhar na lente até o fim.", "Se você é da área jurídica, **salva esse vídeo** e manda para um professor ou diretor de escola que você conhece.", "Salve e envie para um professor · " + AVISO),
  ],
  legenda="A Lei nº 15.468/2026 colocou a educação política e os direitos da cidadania entre os conteúdos obrigatórios da educação básica (LDB, art. 26). A Lei nº 15.467/2026 criou a Semana Nacional da Ética e da Cidadania, na primeira semana de maio. A lei não diz quem vai ensinar, e a área jurídica tem muito a contribuir. Salve e envie para um professor. " + AVISO + ".",
  conferir=[
   "Lei nº 15.468, de 13/07/2026 (PL 4.088/2023): inclui o § 9º-B no art. 26 da LDB; componente obrigatório no estudo da realidade social e política; não define séries nem formação docente (Câmara dos Deputados, Senado Notícias, Atlas Público). Conferir o texto no Planalto.",
   "Lei nº 15.467/2026 (PL 162/2024): Semana Nacional da Ética e da Cidadania na primeira semana de maio (Senado Notícias, 15/07/2026). Conferir no Planalto.",
   "Setembro Cidadão idealizado por Jarbas Bezerra e Lígia Limeira em 2013 no RN: coluna de Simone Silva, Agora RN, 17/07/2026. Dr. Jarbas confirma e decide como citar a coautora.",
   "O vídeo não diz que a lei federal nasceu da ideia dele; diz só que ele defende o tema desde 2013.",
  ]),
 "B2": dict(
  num=4, titulo="O que a lei diz que é de graça", local=LOC2,
  seg=[
   ("GANCHO", "PP. Em pé ao lado da Têmis de olhos vendados, parede de madeira ao fundo. Gravata diferente da do vídeo 3.", "Certidão de nascimento, pedido de informação ao poder público, petição em defesa de um direito. A lei diz que tudo isso é **de graça**.", "De graça, por lei"),
   ("AUTORIDADE", "PM.", "Trabalho com educação cidadã desde dois mil e treze, e essa lei **sempre surpreende**.", "Jarbas Bezerra · [título a confirmar]"),
   ("CONTEÚDO", "PM.", "A Constituição manda a lei dizer quais atos de cidadania são gratuitos. A lei é a nove mil duzentos e sessenta e cinco, de mil novecentos e noventa e seis.", "Constituição, art. 5º, LXXVII · Lei nº 9.265/1996"),
   ("CONTEÚDO", "PM. Contar os itens com a mão.", "Estão na lista os atos para votar, o alistamento militar, os pedidos de informação ao poder público para se defender ou denunciar irregularidade, e as petições em defesa de direitos.", "Lei nº 9.265/1996, art. 1º, I a V"),
   ("CONTEÚDO", "PP.", "E também o registro de nascimento, o de óbito com a **primeira certidão**, e o documento de identificação da pessoa com autismo.", "art. 1º, VI e VII (Leis 9.534/1997 e 13.977/2020)"),
   ("VIRADA", "PM.", "Para quem advoga, essa lista é ferramenta. Antes de orientar alguém a pagar por um desses atos, **confira a lei**, na versão atual.", ""),
   ("CTA", "PM. Olhar na lente até o fim.", "**Salva esse vídeo** para ter a lista à mão, e manda para quem atende o público no seu escritório.", "Salve para consultar · " + AVISO),
  ],
  legenda="A Constituição garante a gratuidade dos atos necessários ao exercício da cidadania, na forma da lei (art. 5º, LXXVII). A Lei nº 9.265/1996 lista esses atos, e a lista cresceu com as Leis nº 9.534/1997 e nº 13.977/2020. Antes de pagar por um deles, confira a lei na versão atual e o órgão responsável. Salve para consultar. " + AVISO + ".",
  conferir=[
   "CF, art. 5º, LXXVII, e Lei nº 9.265/1996, art. 1º, I a VII, com as inclusões das Leis nº 9.534/1997 e nº 13.977/2020: conferidos no Planalto em 06/10/2026 (carrossel Cidadania em Prática 2). Reconferir a versão vigente.",
   "\"Os atos para votar\" resume o inciso I (atos que capacitam ao exercício da soberania popular, art. 14 da CF). Revisor jurídico confirma o resumo.",
   "\"Desde dois mil e treze\" e \"essa lei sempre surpreende\" são a experiência dele. Dr. Jarbas confirma.",
   "O vídeo não promete gratuidade em todo caso; manda conferir a lei e o órgão.",
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
