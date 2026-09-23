# Carrossel — "A Sala" (peça modelo da linha cinematográfica)

Dez telas 1080×1440. É a peça de referência para os próximos carrosséis da
linha cinematográfica: gancho forte na capa, um gancho por tela, imagem
própria em cada tela, nenhuma repetida.

## Capa: gancho visual e gancho de texto

- **Visual:** título gigante "a sala" em Gotham Black, com a cadeira
  recortada passando na frente das letras (profundidade de cartaz, a partir
  da referência adgod.ai). Microrrótulos e cantoneiras nos quatro cantos.
- **Texto:** "O que todo advogado já fez e *ninguém* confessa."

## A corrente de ganchos

| Tela | Fecha com | Abre a próxima |
|---|---|---|
| (000) | ninguém confessa | arraste |
| (001) | *Até* agora. | existe uma sala |
| (002) | Uma sala. Uma mesa. *Duas* cadeiras. | uma é de quem confessa, a outra fica do lado de cá da tela → |
| (003) | Eu preciso *confessar* uma coisa. | a confissão muda a cada episódio |
| (004) | "Eu já assinei uma petição que *não li inteira*." | você também já |
| (005) | Toda confissão tem uma *regra* esperando. | e ela chega sem aviso |
| (006) | Corte *seco.* | o episódio abre a lei |
| (007) | Sobre a mesa, *a prova.* | uma prova diferente em cada episódio |
| (008) | E a cadeira deste lado é *a sua.* | então responda → |
| (009) | Qual seria a *sua* confissão? | comentários |

## Linguagem

- Numeração "(000)" e rótulo de plano em cada tela.
- Narrativa em Gotham Book com palavras em Book Italic (dourado sobre
  escuro, bronze sobre papel). Black só no título da capa.
- Grão de película em todas as telas, alternância entre tinta e papel.

**Exceção documentada à seção 5 do CLAUDE.md:** títulos internos em Book e
Book Italic, e não em Black, por pedido expresso do Victor por uma linha
cinematográfica com fontes elegantes. Família e paleta seguem as da marca.

## Imagens

Geradas no Higgsfield (gpt_image_2_5). Tudo o que aparece do set foi gerado
com a **foto real da Sala como referência** (qualidade média, 2k, 1 crédito
cada), para bater com o cenário gravado: parede escura, quadro de cortiça
laranja com moldura de alumínio, mesa clara, cadeira escura de tecido, luz
de cima e cor fria.

- A mesa aparece sem o disquete e o HD da gravação de teste (edição no
  próprio Higgsfield). Sobre ela, na tela (007), entram provas: envelope
  confidencial, fotografias e relatório com tarjas. O texto do relatório,
  que saiu em espanhol, foi desfocado.
- O papel preso na cortiça recebe o **símbolo da EJUP** (SVG oficial,
  impresso por multiplicação) nas telas (002), (008) e (009). A capa leva o
  símbolo embaixo, ao centro.
- **Duas cadeiras:** a do apresentador aparece na capa (recortada na frente
  do título) e na (002); a de quem assiste é o contraplano da (008), vista
  por trás, do lado de cá da mesa.
- Porta, feixe de luz, livro e projetor são cenas genéricas (0,25 crédito
  cada).

Custo total desta versão: cerca de 13 créditos.

## Reconstruir

```
python3 _build/preparar.py   # corta borda e leva a 1080x1440
python3 _build/gerar.py      # monta carrossel.html
python3 _build/render.py     # telas/*.png e visualizacao-completa.png
```

## Antes do gate humano

- A capa generaliza ("o que todo advogado já fez"): gancho apelativo
  aprovado pelo Victor para esta linha.
- "Episódio 01 em breve": trocar pela data quando houver.
