# Carrossel — "Quem, de fato, pode julgar um ministro do STF?"

Onze telas 1080×1440 para o feed do Instagram, derivadas da coluna jurídica
da EJUP sobre responsabilização de ministros do Supremo.

**Peça descritiva.** Nenhum ministro é nomeado como investigado, nenhum caso
concreto é julgado, nenhum lado do debate público é encampado. A peça
descreve competência, rito e instrumento.

## O enquadramento

Sem rótulo no alto: cada tela abre direto no título, na margem de topo. A
base legal entra como linha de fonte, sob uma hairline dourada, logo abaixo
do corpo, onde ela pertence.

A fotografia ocupa os 900 px inferiores do quadro e sobe por trás do texto
com máscara e gradiente, então não sobra quadro vazio embaixo. Nas telas sem
fotografia a tipografia cresce até encostar na margem do logo.

## A ponte entre telas

Um algarismo gigante partido ao meio: a metade esquerda sai pela borda
direita de uma tela e a metade direita entra pela borda esquerda da
seguinte. Quem arrasta completa a figura com o próprio dedo. Fica atrás do
texto e à frente da fotografia, em dourado rebaixado.

| Par | Ponte |
|---|---|
| 2 → 3 | `01`, a primeira competência |
| 3 → 4 | `02`, a segunda |
| 4 → 5 | `03`, a terceira |
| 6 → 7 | a palavra `ÉTICA` |
| 7 → 8 | a mesma fotografia da colunata, fatiada ao meio |

Duas telas claras quebram o ritmo: a do CNJ e a do choque de princípios.

Cada tela fecha puxando a seguinte. O fecho da 3 anuncia "um julgador que
não usa toga", o da 4 anuncia "o terceiro nome que todo mundo cita", o da 6
anuncia que a resposta está sendo escrita em outro texto, e o da 10 anuncia
a recapitulação. A leitura só fecha na última tela.

## Como reconstruir

```
python3 _build/tratar_fotos.py   # recorta e tinge as fotografias
python3 _build/gerar.py          # monta carrossel.html com fontes embutidas
python3 _build/render.py         # exporta telas/tela-01..11.png e confere medidas
```

## Base legal citada na peça

| Tela | Afirmação | Fonte |
|---|---|---|
| 3 | Infração penal comum julgada pelo próprio STF | CF, art. 102, I, "b" |
| 4 | Crime de responsabilidade julgado pelo Senado | CF, art. 52, II · Lei 1.079/1950 |
| 4 | Perda do cargo e inabilitação por oito anos | Lei 1.079/1950, art. 2º e art. 33 |
| 5 | CNJ não alcança ministros do STF | CF, art. 103-B, § 4º |
| 10 | Legitimidade da OAB | Lei 8.906/1994, art. 44, I · CF, art. 103, VII |

## Pendências antes do gate humano

1. **Telas 2, 6 e 7 dependem de fonte do Victor.** As sessões extraordinárias
   das seccionais e o requerimento ao Conselho Pleno (setembro de 2026), a
   proposta de código de ética apresentada ao CNJ (agosto de 2026) e a
   relatoria da ministra Cármen Lúcia vieram do texto do artigo. Antes de
   publicar, vincular a cada uma o link da matéria ou do documento oficial,
   conforme o item 20 do checklist.
2. **Item 21 do checklist (duas categorias de fonte).** A peça se apoia em
   fonte primária (Constituição e leis). Falta uma segunda categoria:
   doutrina, pesquisa ou profissional de referência sobre responsabilização
   de ministros. Uma linha de citação na tela 9 resolve.

## Créditos das fotografias

Ver `fotos/CREDITOS.md`.
