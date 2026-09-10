# Carrossel — decisões monocráticas no STF (setembro de 2026)

Nove telas 1080×1440, no sistema de `skills/ejup-design/CARROSSEL.md`.

```
python3 _build/tratar_fotos.py && python3 _build/gerar.py && python3 _build/render.py
```

## Peça datada
Retrata a situação em **10/09/2026**. O Plenário do STF decide em **15/09**.
Depois dessa data a peça está vencida: ou sai antes, ou é refeita.

## O dispositivo: o placar do caso
Uma régua fixa no alto de todas as telas, com os quatro atores (Mendonça ·
Dino · Presidência · Plenário) e o estado de cada um: agiu, teve a decisão
suspensa, é a vez dele, está à espera. O mesmo objeto na mesma posição em
todas as telas, mudando quando a história muda.

Liga as telas **e** informa: o leitor sempre sabe em que ponto do caso está.

A moldura que se completa ficou no carrossel anterior, de propósito. Repetir
dispositivo entre peças é o que faz virar template, e foi essa a crítica.

## Os diagramas
Quatro, em `_build/figuras.py`, todos de mecanismo: a **linha do tempo** dos
quatro movimentos em 48 horas · os **dois trilhos** separando controle da
pessoa e controle do ato · o **eixo em aberto** entre decisão individual e
decisão conjunta · a **convergência** dos três caminhos para o colegiado.

## As fotos: uma faixa cortada, e uma quebra proposital
As telas escuras 1, 5, 7 e 9 são fatias consecutivas da mesma fotografia de
arcada: passar o dedo é percorrer a imagem. A tela 3 rompe a continuidade de
propósito, com o Congresso Nacional, porque é ali que o texto fala de outro
Poder. A quebra visual é o argumento.

## O que falta: foto real do STF
**A saída de rede desta sessão bloqueia tudo menos o Pexels.** Wikimedia, Flickr, Agência Brasil, o portal do STF, Unsplash e Pixabay respondem 000. Não existe foto do plenário do STF acessível daqui, e usar uma Suprema Corte estrangeira do Pexels seria erro pior que a falta.\n\nCaminho que funciona, e já funcionou com a foto do Leonardo: subir os
arquivos no repositório, em `peças/carrossel-monocratica-stf/fotos/`, e me
avisar. Com foto do plenário em mãos, as telas 1, 5, 7 e 9 trocam de imagem
sem mexer em mais nada.

## O dispositivo antigo: uma foto só, cortada em cinco
As telas escuras são **fatias consecutivas da mesma fotografia**, na ordem em
que aparecem. Passar o dedo é percorrer a imagem: a arcada continua de uma
tela para a seguinte e o ponto de fuga cai no meio do argumento, na tela que
diz que quem corrige o individual é o coletivo. As telas claras entram como
pausas, e quando o escuro volta a fotografia retoma de onde parou.

É o princípio da tela única de 15.120px do carrossel de superendividamento
(aprovado), resolvido de outro jeito: lá uma curva desenhada atravessava as
telas, aqui é a própria fotografia que atravessa.

Vantagem de produção, além da estética: **acaba o banco de imagens avulsas**.
Uma peça, uma foto, zero risco de repetir imagem que já rodou em outro
carrossel.

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
