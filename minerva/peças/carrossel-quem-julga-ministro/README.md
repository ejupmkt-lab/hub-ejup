# Carrossel — "Quem, de fato, pode julgar um ministro do STF?"

Onze telas 1080×1440 para o feed do Instagram, derivadas da coluna jurídica
da EJUP sobre responsabilização de ministros do Supremo.

**Peça descritiva.** Nenhum ministro é nomeado como investigado, nenhum caso
concreto é julgado, nenhum lado do debate público é encampado. A peça
descreve competência, rito e instrumento.

## O dispositivo visual

**O selo de competência.** Um objeto único preso a uma haste vertical no
alto de cada tela, respondendo passo a passo a pergunta da capa. Enquanto a
resposta ainda não chegou, a haste fica em prata e o selo carrega a própria
pergunta. Quando a competência aparece, a haste acende em dourado e o selo
mostra a base legal. No CNJ a haste volta ao prata, porque ali a resposta é
de não alcance.

Duas telas claras quebram o ritmo (a do CNJ e a do choque de princípios), e
a colunata das telas 7 e 8 é uma fotografia só, fatiada ao meio: passar o
dedo percorre a mesma imagem.

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
