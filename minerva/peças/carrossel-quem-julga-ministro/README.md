# Carrossel — "Quem, de fato, pode julgar um ministro do STF?"

Dezessete telas 1080×1440 para o feed do Instagram, derivadas da coluna jurídica
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

## As emendas (prévia aguardando aprovação do Victor)

Cada virada de tela tem uma ligação própria, tirada do conteúdo, em escala
discreta. Nenhum recurso se repete em duas emendas seguidas.

| Emenda | Ligação |
|---|---|
| 1 → 2 | a fotografia do STF escorre para a tela seguinte |
| 2 → 3 | carimbo "Requerimento · Protocolado · Conselho Pleno" |
| 3 → 4 | a fotografia do edifício escorre |
| 4 → 5 | janela em arco antecipando o mármore do plenário do STF |
| 5 → 6 | recorte do art. 52, II, da Constituição |
| 6 → 7 | a fotografia do Senado escorre |
| 7 → 8 → 9 | a folha clara é maior que o quadro e invade as vizinhas |
| 9 → 10 | recorte do art. 103-B, § 4º |
| 10 → 13 | uma fotografia só da esplanada, da borda da 10 à borda da 13 |
| 13 → 14 → 15 | a folha clara invade as vizinhas |
| 15 → 16 | recorte do art. 103, VII |
| 16 → 17 | janela em arco com a fachada do STF, voltando à capa |

## Uma ideia por tela

Dezessete telas, pouco texto em cada uma. Cada tela fecha deixando a
seguinte em aberto, e duas delas conversam à distância: a tela 4 mostra a
tabela de competências com as respostas em branco ("?"), e a tela 16 devolve
a mesma tabela preenchida.

Duas telas claras quebram o ritmo: "E o CNJ?" e o choque de princípios. A
fotografia da esplanada é uma só, fatiada entre as telas 11 e 12.

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
