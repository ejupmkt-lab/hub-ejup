# Capa de feed — "Quem julga um ministro do STF?"

1080×1440, para divulgar o artigo "A eventual responsabilização dos ministros
do STF. Quais mecanismos o ordenamento brasileiro prevê?" (Coluna Jurídica,
a partir do EJUPcast #018 com Nicácio Carvalho e Eduardo Pacheco).

A provocação está na pergunta, e a resposta fica no site: assimetria de
informação, sem isca. Quem parar na capa já leva algo verdadeiro (a
responsabilização existe no ordenamento).

```
python3 _build/gerar.py && python3 _build/render.py
```

Foto: a Justiça (Alfredo Ceschiatti) diante do Palácio do STF, Dasfour2022,
CC BY-SA 4.0, Wikimedia Commons (`File:Supreme Federal Court1.jpg`), em
duotone navy a 78%. A mesma fotografia serviu de fundo na capa do carrossel
das monocráticas, com outro recorte; é a imagem certa para a pergunta "quem
julga", e por isso voltou.

## Versão colagem (`capa-feed-colagem.png`)

No estilo da referência do Aos Fatos: figura recortada em preto e branco de
alto contraste com grão, fundo em duotone navy posterizado (plenário do STF,
sem a parede do crucifixo), cabeças da própria estátua espelhadas nas
bordas, título em faixas brancas empilhadas com Gotham Black em navy e
bronze, selo "Coluna jurídica" no alto.

A figura central é a Justiça, e não um ministro: a manchete fala em
responsabilização, e um rosto identificável leria como acusação.

Recorte da estátua: GrabCut (OpenCV) guiado por polígono desenhado à mão,
em `_build/estatua-recorte.png`. Montagem em `_build/colagem.png`
(gerado, ignorado pelo git), texto em `_build/template-colagem.html`.
