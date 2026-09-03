# Capa — "A legitimidade da investigação defensiva no processo penal"

Capa para a coluna jurídica do site, 1600×900. Autores: Thiago Praxedes de
Vasconcelos e Thiago de Moura Correia.

**Status: fechada.** A foto veio da pasta do Drive "Investigação Defensiva -
Versão 2" (ejup.mkt), arquivo "Modelo pra melhorar e também Ref".

## Recorte dos autores
`_build/cutout.py` separa os dois advogados do fundo e grava
`foto-autores.png` com alpha. Keying por cor **não** resolve neste material: o
bege do painel encosta no tom de pele (chega a abrir buraco no rosto) e o navy
do fundo encosta no cinza dos ternos. A separação é feita com **GrabCut**
(OpenCV), semeado por retângulos de fundo garantido (painel bege, navy à
esquerda, as duas cunhas bege entre as cabeças) e de frente garantida (rostos,
camisas, ternos). Depois: abertura/fechamento morfológico, descarte de ilhas
menores que 12.000 px e feather de 1,3 px na borda.

O corte reto que sobra no ombro esquerdo é dissolvido no CSS por uma máscara
em degradê (`mask-image`), em vez de aparecer como aresta.

**Três armadilhas que custaram rodadas (não repetir):**
- *Limpeza por classe de cor na borda* (regra "se é bege/navy e está perto do
  contorno, apaga"): reprovada. Pele em sombra e barba caem na mesma faixa
  do bege e do navy — abriu buraco no rosto e no cabelo. O que funciona para
  a franja de 1–2 px é o **estrangulamento da máscara** (erode 5×5), sem cor.
- *Retângulo de frente garantida que sai do contorno*: o canto superior
  direito do retângulo do rosto esquerdo ultrapassava o cabelo e forçava um
  bloco de navy a virar frente. Semente de frente tem de caber **dentro** da
  silhueta, com folga.
- *Retângulo de fundo garantido invadindo o ombro*: a cunha bege entre as
  cabeças só existe acima da linha do ombro (y≈400); prolongada até 455, ela
  cortava terno de verdade. Quando a fronteira é inclinada, encurtar a semente
  e deixar o GrabCut resolver a diagonal.

Para refazer: `python3 _build/cutout.py && python3 _build/build.py && python3 _build/render.py`.

## Direção (v3 — card premium, referência direta do banner G4)
Usuário mandou o banner "Formação G4" como modelo. A v3 reproduz a estrutura:
tag em pílula com contorno dourado · título com a frase-chave em dourado
(G4 usa serifa itálica; EJUP é só Gotham, então o contraste vem do peso:
Black branco + Light dourado) · subtítulo Light · faixa de metadados com
ícones dourados separados por filete · **botão em gradiente dourado**
("Ler o artigo") · retratos **recortados sem fundo** com **halo dourado**
por trás e piso escuro que os funde ao fundo · bokeh discreto em aço/navy ·
cantos arredondados de card. Sem cantoneiras nem diagonal (v2 arquivada).

A foto precisa chegar como arquivo para virar recorte; com o fundo bege
uniforme do estúdio, a remoção pode ser feita por PIL (chroma por distância
de cor + feather). Se não segurar, cai para a foto inteira com fusão de bordas.

## Direção (v2 — "premium editorial", referência G4)
A v1 com friso de colunas no topo foi rejeitada pelo usuário ("algo mais
premium, pode usar o dourado como na outra referência"). A v2:

- **Cantoneiras douradas finas** em dois cantos opostos, enquadrando a peça.
  É o gesto de moldura editorial de luxo; substitui qualquer ornamento.
- **Costura diagonal dourada** de volta, herdada da referência original — só o
  filete (com leve brilho), sem o painel bege. O recorte da foto segue a mesma
  diagonal (5,08°), e o filete esconde a emenda.
- **Dourado dentro do título**: "investigação defensiva" em `--gold`, o resto
  em branco. Subtítulo inteiro em dourado Light, como no original.
- Anéis dos autores ligados por uma haste dourada fina (detalhe que já existia
  na referência e funcionava).
- Brilho quente quase imperceptível (dourado a 7%) irradiando da foto para o
  fundo — dá a temperatura "G4" sem sair da paleta.

## O que foi corrigido em relação ao corte original
- Painel bege (fora das 8 cores do MIV) → fundo navy/tinta, único degradê.
- Título em serifada → Gotham Black 900, como manda a tipografia da marca.
- Foto de pessoa real mantida em cor natural — duotone navy é tratamento para
  imagem de banco/ilustrativa, não para retrato de gente nomeada.

## Arquivos
- `capa.png` — a peça em 1600×900 (com placeholder de foto).
- `capa.html` — versão viva, com Gotham e logo embutidos.
- `_build/` — motor: `template.html`, `build.py`, `render.py`.
