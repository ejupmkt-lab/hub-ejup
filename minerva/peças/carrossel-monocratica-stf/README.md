# Carrossel — decisões monocráticas no STF (setembro de 2026)

Nove telas 1080×1440, no sistema de `skills/ejup-design/CARROSSEL.md`.

```
python3 _build/tratar_fotos.py && python3 _build/gerar.py && python3 _build/render.py
```

## Peça datada
Retrata a situação em **10/09/2026**. O Plenário do STF decide em **15/09**.
Depois dessa data a peça está vencida: ou sai antes, ou é refeita.

## O dispositivo: as camadas
Cada decisão é um painel translúcido, e a composição evolui de tela em tela:
uma ordem entra pela borda (1) · duas se cruzam e a zona do cruzamento fica
hachurada (2) · a frase popular passa por cima das duas, apagadas (3) ·
Senado e tribunal em duas colunas, pessoa de um lado, ato do outro (4) · o
colegiado de onze assentos cerca a decisão individual (5) · três caminhos
saem da pilha (6) · a Presidência congela as duas numa moldura tracejada (7)
· a pilha se recolhe atrás de um painel dourado único, o Plenário (8) · o
caso fica arquivado, alinhado (9).

As fotos entram como camada de fundo nas telas 1, 3, 7 e 9 (alto da tela,
dissolvendo no navy antes do texto), como caixas por coluna na 4 e dentro do
painel dourado na 8. As telas 2, 5 e 6 são só desenho: linha do tempo, o
círculo dos onze assentos e os três caminhos, em SVG gerado no próprio
`_build/gerar.py`. Sem alternância mecânica claro/escuro: a foto aparece onde
o argumento a pede (a Justiça diante do STF, o Congresso quando a frase fala
de outro Poder, a sessão plenária quando a Presidência convoca o colegiado).

Fotos e licenças em `fotos/CREDITOS.md`. Crédito vai na legenda do post.
`_build/figuras.py` é da versão anterior.

## Postura editorial
Descreve o mecanismo processual, sem defender resultado e sem atribuir
motivo a ministro nenhum. Os verbos são os dos autos: afastou, reintegrou,
suspendeu, convocou. Nenhum adjetivo sobre pessoas.

## O gancho de engajamento, e por que ele não é isca
O charter proíbe isca ("comenta EU QUERO", dor fabricada, urgência). O que
esta peça usa é **assimetria real de informação**: o leitor viu a manchete e
não viu o mecanismo. E corrige uma **crença errada que circula**, tirada dos
comentários da própria imprensa: *"um ministro não pode anular a decisão do
outro, isso é papel do Senado"*. A primeira metade está certa, a segunda troca
de Poder. Contrariar um erro popular com o artigo na mão gera discussão de
quem sabe e de quem achava que sabia, sem pedir comentário a ninguém.

Cada tela termina numa linha que a seguinte responde. É o que sustenta o
arrasto, e é honesto: exposição boa funciona assim.

## Fatos verificados
Confirmados em Agência Brasil, CNN Brasil e Metrópoles em 09 e 10/09/2026:
suspensão das decisões de Mendonça e de Dino sobre o comando da PF, pedido de
informações em 48 horas, avocação da relatoria do Inquérito das Fake News pela
Presidência, suspensão de procedimentos que investiguem ministros e convocação
de sessão plenária extraordinária para 15/09.

## A verificar antes de publicar
- **O texto literal da decisão.** A peça descreve o fundamento (decisões
  monocráticas sucessivas com comandos incompatíveis) **sem aspas**, de
  propósito: as versões que circulam vêm de resumo de imprensa, não do
  inteiro teor. Só usar aspas depois de conferir no acórdão.
- **Os instrumentos citados na tela 6** (agravo interno, competência da
  Presidência, prevenção) estão descritos em termos gerais, sem artigo e
  alínea do RISTF. Se o artigo do site for aprofundar, citar dispositivo.
- **O quadro pode mudar antes de 15/09.** Reconferir na manhã da postagem.
