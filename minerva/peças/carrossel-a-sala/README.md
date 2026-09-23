# Carrossel — "A Sala", o quadro explicado

Dez telas 1080×1440 que apresentam o formato A Sala (ver
`docs/formatos/a-sala.md`) como se o carrossel fosse um filme.

## Linguagem

Editorial de cinema, a partir das referências enviadas pelo Victor
(vestigare_, cinexis, freeezframes, filmnostalgia, goosebumpscinema):

- numeração "(000)" a "(009)" em todas as telas;
- títulos grandes em Gotham Book com palavras em Book Italic;
- legendas miúdas nos cantos, imagens fora do centro;
- alternância entre tinta e papel, grão de película em todas as telas;
- planos do set com rótulo de câmera, legenda de cinema, página de roteiro
  e faixa de película.

**Exceção documentada à seção 5 do CLAUDE.md.** Nesta série o título sai em
Book + Book Italic, e não em Black, por pedido expresso do Victor por uma
linha cinematográfica com fontes elegantes. A família segue única (Gotham) e
a paleta segue a da marca.

## Sequência

| Tela | Conteúdo |
|---|---|
| (000) | capa: "eu preciso confessar uma coisa." sobre o frame da confissão |
| (001) | o cenário: uma sala escura, uma mesa e duas cadeiras |
| (002) | plano geral: a cadeira vazia espera quem vai confessar |
| (003) | plano detalhe: sobre a mesa, o tema (disco rígido e disquete) |
| (004) | plano fechado com legenda de cinema |
| (005) | ninguém confessa à toa: os quatro atos do episódio |
| (006) | página de roteiro do episódio 01 |
| (007) | depois da confissão, corte seco |
| (008) | película: episódio 01, dever de verificação |
| (009) | créditos: a sala. em breve no canal da EJUP |

## Reconstruir

```
python3 _build/recortes.py   # recortes e correção de cor dos frames
python3 _build/gerar.py      # monta carrossel.html
python3 _build/render.py     # telas/*.png e visualizacao-completa.png
```

## Antes do gate humano

- **Direito de imagem (item 23).** A pessoa nos frames é identificável.
  Confirmar autorização de uso de imagem por escrito antes de publicar.
- **Data do episódio 01.** A peça diz "em breve". Se houver data, trocar na
  capa e nos créditos.
