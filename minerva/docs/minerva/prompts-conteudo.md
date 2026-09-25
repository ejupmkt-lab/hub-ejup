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
_Ainda não recebido._

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
_Ainda não recebido._

### 6. Frase para post manifesto / aspas
_Ainda não recebido._

### 7. Legenda explicativa da frase
_Ainda não recebido._

### 8. Curadoria de leitura de domingo
_Ainda não recebido._

### 9. Ideias de tema para artigo
_Ainda não recebido._
