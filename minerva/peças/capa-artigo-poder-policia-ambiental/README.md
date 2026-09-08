# Capa — "O poder de polícia ambiental municipal"

Três formatos do mesmo conteúdo, gerados de uma fonte só:

| arquivo | tamanho | uso |
|---|---|---|
| `capa-horizontal.png` | 1600×900 | site |
| `capa-story.png` | 1080×1920 | stories |
| `capa-feed.png` | 1080×1440 | feed |

Autor: Leonardo Pivotto, sócio-fundador da EJUP e da EIX CORE.

## A faixa que o site mostra
O site **corta** a capa horizontal e exibe só a faixa de cima. Medindo o print
do card da capa anterior, a imagem aparece em ~3,09:1 — de 1600×900 sobram os
**512px do topo**. Por isso pílula, título, subtítulo, metadados e assinatura
vivem todos acima dessa linha, e o `render.py` **reprova** se qualquer um
passar dela. `python3 _build/render.py --guia` desenha a linha na prova;
`_build/prova-faixa-do-site.png` mostra o que o site vai exibir.

O que fica abaixo da linha é sobra deliberada: o corpo do retrato e o logo.

## A foto
Entra se existir `foto.jpg` (ou `.png`) nesta pasta; sem ela, o lugar do
retrato sai marcado e a capa fica pronta para receber o arquivo. Depois de
soltar a foto: `python3 _build/gerar.py && python3 _build/render.py`.

Diferente da capa anterior (dois autores sobre painel bege), **este retrato
não precisa de recorte**: o fundo do estúdio já é escuro e se funde ao navy da
capa por máscara em degradê. Recorte por GrabCut com fundo escuro e terno
escuro é justamente o caso em que a separação falha — não tente.

## Trocar de artigo
Edite `ARTIGO` em `_build/gerar.py`: pílula, título (a segunda parte vai em
dourado Light), subtítulo, coluna, tema, autor e cargo. Os três formatos saem
do mesmo dicionário, então não há como um divergir do outro.
