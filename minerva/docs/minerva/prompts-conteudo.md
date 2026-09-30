# Prompts de conteúdo — briefing por item

Este arquivo guarda, um por um, os prompts completos que o Victor manda para
cada peça de conteúdo do tipo "estrutura, texto e briefing de posts" (sem
arte). Cada prompt vira a referência fixa para todo episódio ou peça seguinte
do mesmo tipo: a Minerva lê este arquivo antes de montar a entrega e segue o
padrão de estrutura, nível de detalhe e critério de escolha que o Victor
descreveu aqui, aplicando ao material novo (transcrição, briefing ou pauta
daquela vez).

Vale sempre o `CLAUDE.md` da raiz por cima de qualquer prompt aqui guardado:
em caso de conflito com a lei da marca, o `CLAUDE.md` prevalece.

---

## Como usar

1. O Victor manda o prompt completo de um item (por exemplo, "legenda do
   teaser", "ideias de thumbnail", "descrição do YouTube", "carrossel de
   divulgação", etc.).
2. A Minerva registra o prompt aqui, na seção correspondente, com a data.
3. Da próxima vez que o Victor pedir aquele mesmo tipo de peça, para um
   episódio ou peça diferente, a Minerva usa o prompt guardado como modelo de
   estrutura e critério, sem precisar que o Victor repita tudo.
4. Se o Victor mandar um prompt novo para um item que já tem um guardado, o
   novo substitui o antigo (a versão anterior fica no histórico do git).

---

## Itens

### 1. Legenda do teaser de revelação de convidado
_Recebido em 29/09/2026, com o teaser em vídeo do #19 e um post de referência._

> preciso de uma legenda para esse teaser, quando for teaser, comece sempre
> com uma frase que dê a entender que estamos revelando o convidado, salve
> essa informação

**Regra fixa:** toda legenda de teaser abre com uma frase que revela o
convidado, no molde do post do episódio 17 (perfil @ejup.oficial, 2 de
setembro): "Zeca Melo é o convidado do episódio 17 do EJUPcast!"

**Modelo de referência (transcrito do print):**

> Zeca Melo é o convidado do episódio 17 do EJUPcast!
>
> No episódio 17, recebemos Zeca Melo, superintendente do SEBRAE no Rio
> Grande do Norte, para uma conversa que atravessa décadas de experiência
> com pequenos negócios, gestão pública e o papel do empreendedorismo no
> fortalecimento da economia potiguar.
>
> Ao lado de Leonardo Pivotto e Rossana Fonseca, Zeca reconstrói histórias
> reais de empresas que começaram pequenas e hoje são referência no Estado,
> explica como o SEBRAE atua desde o primeiro atendimento até os grandes
> projetos regionais e traz um ponto essencial para quem atua na advocacia:
> o advogado também é um empreendedor e precisa de apoio para administrar
> seu escritório, não apenas do conhecimento técnico aprendido na faculdade.
>
> Uma conversa sobre propósito, competência e sobre reconhecer o valor
> daquilo que o Rio Grande do Norte tem para oferecer.
>
> O episódio completo estreia amanhã, no site da EJUP.
>
> Link na bio.

**Como aplicar:** (1) frase de revelação; (2) parágrafo de apresentação do
convidado com cargo e tema da conversa; (3) "Ao lado de [quem entrevista]",
os pontos fortes da conversa, só com o que foi dito no episódio; (4) uma
frase de fecho; (5) quando e onde estreia (confirmar com o Victor, nunca
supor a data); (6) "Link na bio." Vale a régua de fluidez e a regra de
CTA deste arquivo. O modelo tem um "!" só, na frase de revelação, e é o
único permitido.

### 2. Ideias de thumbnail
_Recebido em 25/09/2026._

> Preciso de uma thumbnail chamativa que faça o público querer ver o
> episódio, algo clickbait, mas sem apelar. Quero que as thumbnails tenham
> uma ideia completa, tipo "os bastidores da defesa criminal", entende? que
> seja algo chamativo, e que ajude a prever o conteúdo do vídeo, acho que
> isso faz com que o público fique mais interessado. Não quero títulos
> cortados, como palavras chaves, como "IA, formação e tribunais".

**Como aplicar:** o título da thumbnail é sempre uma ideia completa, uma
frase ou promessa de conteúdo, nunca uma lista de palavras-chave soltas. Tem
que gerar curiosidade real (gancho forte) e, ao mesmo tempo, entregar de
verdade o que o título promete, sem inventar ou exagerar o que está no
episódio. Cada título nasce de um fato concreto e verificável da conversa
(um caso, um número, uma frase dita pelo convidado), nunca de uma promessa
vaga ou de clickbait que engana.

**Conferir o verbo contra a transcrição (erro de 30/09/2026):** o gancho
"evitou uma dívida de 250 milhões sem julgar um processo" estava errado. Na
fala do Marco Bruno, o débito do município de Natal "recebeu um desconto de
mais de duzentos e cinquenta milhões de reais da União", num processo de
governança judicial (o processo da Urbana) que envolveu Justiça Federal,
do Trabalho e Estadual, MPs e procuradorias. Não houve "dívida evitada" e o
processo existiu. Antes de fechar qualquer título ou legenda com número,
reler o trecho e usar o verbo que a pessoa usou (desconto, acordo,
redução), sem inflar.

**Formato completo do texto da thumbnail (recebido em 25/09/2026):**

> depois do título, tb é escrito o nome do convidado e ejupcast 18, ent tudo
> precisa encaixar em até 100 caracteres
> tipo assim:
> Decisões por IA, Tribunais e Rumos da Advocacia | Nicácio Carvalho e
> Eduardo Pacheco | EJUPcast #018

**Como aplicar:** o texto completo da thumbnail segue sempre o formato
**Título | Convidado(s) | EJUPcast #NN**, com o número do episódio, e o
conjunto inteiro (título + nome + selo do episódio) precisa caber em até
100 caracteres, contando os separadores " | ". Com mais de um convidado,
listar todos separados por "e", como no exemplo do episódio #018.

**Nome do convidado (ajuste de 25/09/2026):** usar o nome curto ou como a
pessoa é chamada no dia a dia (ex.: "Marco Bruno"), não o nome completo
formal (ex.: "Marco Bruno de Miranda Clementino"), mesmo quando o convidado
tem título de magistrado, professor etc. Isso sobra mais espaço para o
título dentro do limite de 100 caracteres.

**Dois textos diferentes, não um só (ajuste de 25/09/2026):** o formato
"Título | Convidado | EJUPcast #NN", até 100 caracteres, é o **título do
vídeo no YouTube** (campo de metadado, aparece como texto normal embaixo do
player). O texto que vai **escrito na arte da thumbnail** é só a frase
central, bem mais curta (na prática, uns 40 a 45 caracteres), pra caber
grande e legível na capa. O nome do convidado e o selo do episódio aparecem
na arte como elementos visuais à parte (nome embaixo do título, selo do
episódio no canto), no sistema do cartão já aprovado, não colados na mesma
frase com " | ".

### 3. Descrição do episódio para o YouTube
_Recebido em 25/09/2026, como print de uma descrição já publicada (episódio
com Correia Júnior e Thiago Correia)._

**Modelo de referência (transcrito do print):**

> 352 visualizações · Estreou em 8 de jul. de 2026
>
> Quem defende melhor: quem estudou o crime nos livros, ou quem já recebeu a
> ocorrência no balcão da delegacia?
>
> Correia Júnior passou 22 anos na Polícia Civil, de delegado substituto a
> delegado-geral, e leciona Direito Penal há mais de 20 anos. Hoje, advoga
> na defesa criminal ao lado do filho, Thiago Correia, que escolheu ser
> advogado desde o primeiro dia da faculdade. Pai e filho, sócios no mesmo
> escritório.
>
> Nesta conversa com Rossana Fonseca e Roberto Pivotto, os dois defendem uma
> tese que incomoda: "melhor defende quem sabe acusar". E vão a fundo em
> pontos que raramente são ditos com essa clareza: que o delegado é o
> primeiro garantidor da Constituição; por que gravar a conversa entre
> advogado e cliente é, para eles, "absolutamente inconstitucional"; como
> jovens advogados são cooptados para "levar recado" dentro de presídios; e
> até onde a delação premiada ainda é, de fato, premiada.
>
> Se a conversa agregou à sua atuação, compartilhe com quem precisa ouvir
> isso. Inscreva-se no canal e ative o sino para acompanhar os próximos
> episódios do EJUPcast.
>
> Gostou do conteúdo?
> Deixe seu LIKE, INSCREVA-SE no canal e ative o sininho! Compartilhe este
> episódio estratégico com seus sócios e colegas de profissão!
>
> Instagram dos Convidados: @thiagocorreia.adv e @correiajr
> 🌐 www.ejup.com.br · 📸 @ejup.oficial · 🎧 EJUPcast no Spotify

**Como aplicar:** a descrição sempre segue essa ordem fixa:

1. **Gancho.** Uma pergunta ou provocação de abertura, ligada ao tema
   central do episódio, sem "—" (travessão).
2. **Quem é o convidado.** Um parágrafo de apresentação, trajetória e
   credenciais, sem elogio vazio, só fatos verificáveis do briefing ou da
   transcrição.
3. **A conversa.** Quem participa da entrevista pela EJUP (nem sempre é
   Rossana e Roberto juntos, confirmar por episódio), a tese central entre
   aspas, e uma lista de pontos fortes abordados, cada um separado por
   ponto e vírgula, terminando com "e".
4. **CTA de inscrição.** Texto fixo: "Se a conversa agregou à sua atuação,
   compartilhe com quem precisa ouvir isso. Inscreva-se no canal e ative o
   sino para acompanhar os próximos episódios do EJUPcast."
5. **CTA de engajamento.** Mesma ideia do modelo, mas **sem caixa alta
   gritada e sem excesso de exclamação** (regra da marca): "Gostou do
   conteúdo? Deixe seu like, inscreva-se no canal e ative o sininho.
   Compartilhe este episódio com seus sócios e colegas de profissão."
6. **Rodapé fixo.** Instagram do(s) convidado(s) (nunca inventar o handle,
   perguntar se não estiver confirmado) e depois:
   "🌐 www.ejup.com.br · 📸 @ejup.oficial · 🎧 EJUPcast no Spotify".

### 4. Carrossel de divulgação do podcast
_Recebido em 25/09/2026._

> Preciso de um carrossel para a divulgação do episódio, crie o prompt para
> esse carrossel com 1 ideia por tela, use uma linguagem formal, mas fácil
> de entender. Não coloque travessão entre palavras no texto e não aborde a
> figura de "não é sobre isso, é sobre aquilo", comum entre textos criados
> por IA.
>
> Siga a referência: https://www.instagram.com/p/Dai2bi-iXH2/?img_index=1
> (perfil human___podcast, carrossel de divulgação de podcast, abertura com
> pergunta ou frase provocativa, peça gráfica, não fotográfica)

**Como aplicar:**

- **Uma ideia por tela.** Cada tela carrega só um fato, uma frase ou uma
  pergunta. Nunca acumular dois raciocínios na mesma tela.
- **Linguagem formal e fácil de entender.** Sem jargão técnico
  desnecessário, sem gíria, mas também sem explicar o óbvio.
- **Sem travessão entre palavras** e **sem a figura "não é X, é Y"** (regras
  já valem para toda a EJUP, reforçadas aqui).
- **Estrutura de referência** (formato "carrossel de divulgação de
  podcast"): capa com pergunta ou frase provocativa ligada ao tema central
  do episódio, telas seguintes com uma ideia ou fato de cada vez sobre o
  convidado e a conversa, tela final com CTA para assistir ou ouvir o
  episódio completo.
- **Limitação registrada:** o Instagram bloqueia a leitura das telas
  internas de um carrossel por fora do app. A Minerva usa a legenda e a
  estrutura descrita, mas para bater exatamente com o layout visual da
  referência (posição do texto, tipografia, se é foto ou peça gráfica), o
  Victor precisa mandar prints das telas.

**Estrutura confirmada por print (25/09/2026), a partir do próprio
carrossel do EJUPcast #018 no sistema do cartão já aprovado pelo Roberto.
Esta é a referência definitiva para "carrossel de divulgação do podcast",
sempre 6 telas:**

1. **Capa.** Número do episódio ("EP 018"), foto do(s) convidado(s) em
   cartão arredondado sobreposto ao painel navy. Abaixo: "Episódio #NN" em
   cinza, nome do(s) convidado(s) em título navy, uma frase de efeito curta
   em dourado (a tese ou o paradoxo central do episódio, não um resumo).
2. **Nesta conversa.** Lista de 4 a 5 temas da conversa, um por linha,
   separados por linha fina, em negrito. Abaixo, a duração da conversa e o
   nome de quem entrevista ("1h06 de conversa com a Dra. Rossana Fonseca").
3. **Citação forte 1.** Foto do convidado que disse a frase, ícone de aspas,
   citação com a parte mais forte em itálico, atribuição embaixo (nome em
   negrito + tempo do corte, ex. "Eduardo Pacheco 22:44").
4. **Citação forte 2.** Mesmo formato da tela 3, com outra citação e outro
   convidado (ou o mesmo, se for só um).
5. **Biografia.** Foto maior, mais de um convidado ou ambiente. "Episódio
   #NN", nome do(s) convidado(s), parágrafo curto de biografia por
   convidado (nome em negrito, cargo, especialidade), fechando com "Com a
   Dra. Rossana Fonseca" (ou quem entrevistou).
6. **CTA final.** Selo circular "ejup /cast" centralizado em fundo navy.
   "Episódio completo", chamada "Assista no YouTube e no Spotify.", uma
   frase curta de contexto com uma pergunta de engajamento para os
   comentários, botão "Link na bio".

**Timecodes das citações:** a transcrição normalmente não tem marcação de
tempo real, só a ordem da fala. A Minerva escolhe as citações mais fortes
pelo conteúdo, mas o tempo exato (ex. "22:44") precisa ser conferido por
quem edita o vídeo antes de ir para a arte final, nunca inventado.

### 5. Timecodes para cortes de Instagram
_Recebido em 25/09/2026._

> me de 3 timecodes interessantes para fazer cortes para o instagram

**Como aplicar:** a Minerva escolhe os 3 melhores trechos pelo conteúdo da
transcrição (uma ideia fechada, uma frase de impacto ou um caso concreto que
funcione sozinho, fora do contexto do episódio inteiro). Quando a
transcrição não tem marcação real de tempo (só a ordem da fala, sem
minuto:segundo), a Minerva **não inventa** o timecode: descreve o trecho de
forma que dê pra localizar no áudio ou vídeo original (o que é dito, mais
ou menos onde fica na conversa) e avisa que o tempo exato precisa ser
conferido por quem edita. Quando a transcrição já vier com marcação de
tempo, a Minerva usa o tempo real.

### 6. Frase para post manifesto / aspas
_Recebido em 25/09/2026, junto com o item 7 (ver abaixo)._

> Quero fazer um post manifesto/aspas de alguma fala de Marco Bruno no
> podcast. Citação de destaque de Marco Bruno, peça de identidade, alinhada
> ao Manifesto EJUP. Use a transcrição completa do podcast que já te mandei.

**Como aplicar:** a citação escolhida precisa ecoar diretamente alguma linha
do banco vivo do manifesto (`CLAUDE.md`, seção 4) ou do núcleo estratégico
(tradição, inovação, profundidade, autoridade silenciosa), não só ser uma
frase bonita solta. Sempre citação literal ou próxima do literal da
transcrição (limpando só vícios de fala tipo "é, é, é"), nunca reescrita a
ponto de mudar o sentido. Fonte: o próprio episódio do EJUPcast, com o nome
completo do convidado e, quando existir, o número do episódio.

### 7. Legenda explicativa da frase
_Recebido em 25/09/2026, no mesmo pedido do item 6._

> Me dê a legenda para o post também, use uma linguagem formal, mas fácil de
> entender. Não coloque travessão entre palavras no texto e não aborde a
> figura de "não é sobre isso, é sobre aquilo", comum entre textos criados
> por IA. Contextualize a fala e o porquê dela. Coloque um CTA no final, no
> canto inferior da tela, para convidar o público a assistir o episódio, que
> tem o link na bio.

**Como aplicar:** a legenda segue a estrutura já usada nas peças de
identidade da EJUP (ver `peças/post-manifesto-mandela/README.md`, seção
"Legenda sugerida"):

1. **Contexto.** Quem é o convidado e em que momento da conversa ele disse
   aquilo, sem elogio vazio.
2. **A frase entre aspas**, com atribuição.
3. **Por que importa para a EJUP.** Como essa fala conecta com o que a marca
   defende (núcleo estratégico, manifesto).
4. **Fechamento.** Uma linha curta que reforça o propósito editorial.
5. **CTA.** Convite para assistir ao episódio completo, com "o link está na
   bio".

**Dois CTAs diferentes, não um só:** o texto que aparece **na própria arte**
(canto inferior da tela, curto, tipo "Assista ao episódio completo. Link na
bio.") é separado da **legenda do post** (o texto que acompanha a
publicação, mais longo, com o contexto e o fechamento). O CTA da legenda
pode ser mais desenvolvido que o da arte.

### 8. Curadoria de leitura de domingo
_Recebido em 25/09/2026._

> procure um livro para a curadoria de leitura de domingo, se conseguir, que
> faça sentido da EJUP divulgar

**Como aplicar:** essa curadoria é a série "A Estante EJUP"
(`peças/a-estante-ejup/`, ver README da série). Duas linhas possíveis de
escolha, e a Minerva oferece as duas quando fizer sentido:

1. **Ligado ao episódio da semana.** Um livro com origem rastreável direto no
   briefing ou na transcrição (o convidado escreveu, coordenou, citou ou
   recomendou). É a escolha mais segura no critério de fidelidade factual
   (itens 20 e 21), porque a fonte já está dada.
2. **Na linha da série já publicada.** As duas edições anteriores ("Utopia
   para Realistas", de Rutger Bregman, e "De Zero a Um", de Peter Thiel) são
   livros de ideias, fora do Direito estrito, que conversam com formação
   estratégica, repertório contemporâneo e visão de futuro. Um livro nessa
   linha não depende do episódio da semana.

Cada indicação precisa da ficha do livro (autor, editora, ano), de uma linha
que explique por que faz sentido a EJUP divulgar aquele título e, se for
seguir pra peça de fato (4 stories, 1080×1920), a imagem da capa vem do
Victor. Esta sessão não baixa imagem da internet.

**Roteiro dos 4 stories (recebido em 25/09/2026, print do briefing original
de "De Zero a Um"):** a Minerva escreve o texto de cada story nessa mesma
estrutura fixa, para qualquer livro da série:

1. **Story 1, Abertura.** Uma pergunta desconfortável ligada ao argumento do
   livro. O nome do livro e de quem organizou ou escreveu. Instrução para
   avançar.
2. **Story 2, A ideia central.** O argumento do livro, em duas frases
   curtas e diretas.
3. **Story 3, Por que isso importa para o Direito e para a EJUP.** A ponte
   entre o argumento do livro e o que a EJUP defende.
4. **Story 4, Fechamento.** Uma síntese, uma pergunta para engajamento (algo
   que convide a pessoa a responder no direct) e a assinatura "EJUP. Alma
   clássica, repertório contemporâneo."

**Correções já aplicadas na edição "De Zero a Um" e válidas para todas as
próximas (ver `peças/a-estante-ejup/de-zero-a-um/README.md`):**
- Sem emoji. O 👉 do briefing original virou a seta da pílula de chamada, que
  já é elemento visual da série, não texto.
- "Arrasta para o lado" virou "Avance".
- Qualquer frase na figura "não é X, e sim Y" (ou variantes como "não basta
  X, é preciso Y") vira afirmativa direta.
- Nunca colocar a EJUP contra a advocacia tradicional ou o ensino formal
  (regra de posicionamento do `CLAUDE.md`, seção 1: a EJUP é ponte, não
  ruptura). Uma frase como "abandonar o caminho já pavimentado" precisa virar
  algo como "reconhecer o caminho já pavimentado e ter o critério de
  construir o trecho que falta".
- **O fio que costura os 4 stories nasce do argumento do próprio livro**,
  nunca de um conceito genérico. Cada edição tem o seu.

### 9. Ideias de tema para artigo
_Ainda não recebido._

### 10. Legenda para divulgar artigo publicado
_Recebido em 28/09/2026, item novo, fora da lista original de nove._

> Preciso de uma legenda para o Instagram da EJUP para divulgar o artigo que
> foi publicado, a arte do post será apenas a capa do artigo. Use uma
> linguagem formal, mas fácil de entender. Não coloque travessão entre
> palavras no texto e não aborde a figura de "não é sobre isso, é sobre
> aquilo", comum entre textos criados por IA. Coloque um CTA no final para
> convidar o público a ler o artigo, que tem o link na bio.

**Como aplicar:** a Minerva lê o artigo completo (PDF ou texto que o Victor
manda) antes de escrever, nunca chuta o conteúdo pelo título. A legenda
segue essa estrutura:

1. **Gancho.** Uma pergunta ou constatação ligada ao problema central do
   artigo, sem travessão.
2. **O que o artigo explica.** Um ou dois parágrafos com a tese central e os
   fatos mais fortes (número, base legal, mecanismo), sempre fiéis ao texto
   do artigo, sem simplificar a ponto de distorcer (checklist, item 22).
3. **Por que importa.** Para quem esse conteúdo é relevante na prática.
4. **CTA final.** Convite direto para ler o artigo completo, com "o link
   está na bio".

Como a arte é só a capa do artigo (sem texto extra na imagem), a legenda
carrega sozinha todo o resumo e o contexto, então pode ser um pouco mais
longa que a legenda de um post com texto na própria arte.

**Variante: carrossel de dados do artigo (recebido em 28/09/2026).** Quando
o artigo vira um carrossel com vários slides de dados e citações (não só uma
capa), a mesma estrutura de legenda vale, mas o passo 2 ("o que o artigo
explica") vira um resumo dos pontos mais fortes que já estão nos slides
(cada estatística, cada base legal), não uma repetição de cada tela. A
legenda funciona como a porta de entrada, o carrossel entrega o
detalhamento.

**Ligação com episódio anterior (pedido do Roberto, 29/09/2026).** A legenda
de artigo pode apontar para um episódio do EJUPcast que tocou o mesmo
assunto. Só se cita o que foi de fato dito no episódio (conferir na
transcrição, nunca pelo título), com número do episódio e nome e cargo do
convidado. Se a ligação for só temática, dizer isso ao Victor e não afirmar
que o episódio tratou do tema do artigo. Exemplo: artigo da ANEEL ligado ao
EJUPcast #011 (Caio Cavalcanti, CEO e fundador da EVEX), pela abertura do
mercado de energia e pela literacia energética do consumidor.

### 11. Legenda para carrossel de teaser de "A Sala"
_Recebido em 28/09/2026._

> legenda para esse carrossel
> (print do carrossel de lançamento do quadro A Sala, episódio 01, 10 telas)

**Como aplicar:** "A Sala" é um quadro novo, com abertura sempre igual
(sala escura, mesa, duas cadeiras, a frase "Eu preciso confessar uma
coisa"), documentado em `docs/formatos/a-sala.md`. Cada episódio tem uma
confissão diferente que abre um tema jurídico (ver a tabela de confissões
naquele arquivo). A legenda desse tipo de carrossel de lançamento ou teaser
segue:

1. **Gancho.** O conceito do quadro em uma ou duas frases, sem entregar o
   episódio.
2. **O que é "A Sala".** Uma linha curta explicando o formato (a mesa, as
   duas cadeiras, a frase de abertura).
3. **A confissão do episódio**, só se ela já estiver visível na arte do
   carrossel (não adianta esconder na legenda o que a peça já mostra).
4. **CTA de engajamento.** Convite para responder nos comentários, no
   espírito do quadro (a pessoa também confessando algo).
5. **Anúncio.** "Em breve, no canal da EJUP" (ou a data, quando já estiver
   definida).

Sem travessão, sem a figura "não é X, é Y", linguagem formal e fácil de
entender, valem sempre.

**Regra do quadro (30/09/2026):** nas legendas de A Sala, nunca nomear
quem apresenta (por exemplo, "Roberto abrindo cada episódio"), porque nem
sempre será a mesma pessoa. Dizer "uma frase que abre cada episódio".
Vale também para legenda de vídeo de expectativa: sem revelar tema nem
caso, com data de estreia e convite para o público comentar o palpite.

### 12. Legenda para carrossel de caso real (tema de episódio de A Sala)
_Recebido em 28/09/2026._

> legenda para esse carrossel do tema do primeiro ep. de A Sala, no final
> fale algo como "aguarde tal coisa"
> (print do carrossel "O caso Vorcaro", 13 telas)

**Como aplicar:** quando o carrossel envolve um caso real em andamento, com
pessoas identificadas (inclusive autoridades), a legenda segue o mesmo
cuidado que a peça já aplica nos slides (ver
`peças/carrossel-caso-vorcaro/README.md`, "Regras de conteúdo aplicadas"):

- Nome próprio só com o verbo certo ("segundo a Polícia Federal",
  "investigado"), nunca afirmando como fato o que é apuração em andamento.
- Toda acusação ou menção citada junto com a resposta de quem foi citado,
  quando ela existir.
- Deixar explícito quando alguém citado não é investigado por crime naquele
  caso, para não sugerir culpa por associação.
- Fechar com uma chamada para o episódio completo, no estilo "Aguarde. O
  episódio completo estreia em breve, no quadro A Sala, no canal da EJUP",
  sem data que ainda não esteja confirmada.

**Lembrete permanente:** peça com caso real em andamento não vai ao ar sem
os itens do "Antes do gate humano" daquele README (revisão jurídica,
confirmação de ausência de conflito de interesse, reconferir os fatos na
data da publicação). A legenda pronta não substitui essa checagem.

## Regra geral de CTA (recebida em 28/09/2026)

> como mudo esse CTA para as pessoas seguirem e acompanharem o insta e os
> próximos eps. tá meio estranho esse "siga para acompanhar"

**Como aplicar, em qualquer peça:** "siga para acompanhar" repete a mesma
ideia duas vezes sem acrescentar nada, é o tipo de redundância que soa
robótica. O CTA de seguir o perfil sempre vem com o motivo específico
embutido, não com "acompanhar" solto:

- "Siga a EJUP para não perder o episódio completo e os próximos capítulos
  de [nome do quadro ou série]."
- "Siga o perfil e acompanhe o episódio completo e as próximas edições de
  [nome do quadro ou série]."

Vale para qualquer CTA de "seguir" em qualquer peça, não só para A Sala.

## Regra geral de fluidez do texto (feedback do Roberto Pivotto, 28/09/2026)

O Roberto, gate humano de publicação, reprovou uma legenda com o comentário:
"Achei com muita cara de IA, vê se consegue melhorar um pouco a fluidez e
deixar com menos jeito de IA."

**O que causa essa cara de IA, e como evitar:**
- **Parágrafos com o mesmo formato e o mesmo tamanho**, cada um abrindo com
  uma frase declarativa curta e fechando limpo. Varia o comprimento das
  frases dentro do mesmo parágrafo.
- **Listas disfarçadas de prosa** ("Uma mesa, duas cadeiras e uma frase que
  abre cada episódio"). Prefere a frase correndo mais solta, com vírgula e
  conectivo, ao invés de três itens enfileirados.
- **Pergunta de CTA em duas frases separadas e simétricas** ("Você também já
  teve a sua. Conta pra gente nos comentários: qual seria a sua confissão?").
  Uma pergunta direta e mais coloquial funciona melhor ("E você, já teve a
  sua? Deixa nos comentários.").
- Uma palavra do dia a dia no lugar certo ("chato de admitir" em vez de
  "poucos admitem em voz alta") ajuda a quebrar o tom de texto institucional
  demais, sem virar gíria nem perder o formal e fácil de entender que o
  Victor pediu.

Essa checagem de fluidez entra em toda legenda a partir de agora, antes de
entregar.

**Cuidado adicional (28/09/2026):** ao tentar deixar o texto mais fluido, o
pronome pode perder o substantivo a que se refere. "E você, já teve a sua?"
depois de um parágrafo que citava "a confissão" duas frases antes ficou
ambíguo (a sua o quê?). Sempre que uma frase mais solta usar pronome ("a
sua", "isso", "ela"), o substantivo precisa estar na mesma frase ou na
imediatamente anterior, nunca a dois parágrafos de distância. Versão
corrigida desse caso: "Qual seria a sua confissão? Deixa nos comentários."
