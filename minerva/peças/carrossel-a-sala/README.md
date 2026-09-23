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
| (002) | Uma sala. Uma mesa. *Duas* cadeiras. | e uma frase que abre todo episódio → |
| (003) | Eu preciso *confessar* uma coisa. | a confissão muda a cada episódio |
| (004) | "Eu já assinei uma petição que *não li inteira*." | você também já |
| (005) | Toda confissão tem uma *regra* esperando. | e ela chega sem aviso |
| (006) | Corte *seco.* | o episódio abre a lei |
| (007) | Sobre a mesa, *o tema.* | memória, tempo e a máquina |
| (008) | E a cadeira do outro lado é *a sua.* | então responda → |
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

Geradas no Higgsfield com o modelo gpt_image_2_5 (0,25 crédito cada; 10
imagens + 1 recorte de fundo). Originais em `gerado/`, prontas em
`_build/img/`. Nenhuma pessoa identificável: a mão da tela (004) aparece
sem rosto.

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
