# Peças

Entregas finais de design produzidas em conversa. Só a **versão aprovada** de cada peça
está aqui — versões anteriores/rejeitadas ficam registradas em texto no `HANDOFF-EJUP.md`,
não como arquivo, para não acumular peso morto no repositório.

## `carrossel-apostas-superendividamento/`

Carrossel de Instagram, 14 telas, 1080×1440, sobre a Lei do Superendividamento, apostas
online e o cadastro de proteção ao crédito — acompanha o episódio 16 do EJUPcast.

- `tela-01.png` a `tela-14.png` — as peças em alta, prontas para publicar.
- `EJUP-Carrossel-Apostas.pdf` — as 14 telas em PDF, para aprovação.
- `apresentacao.html` — visualizador local com botão de baixar tudo/baixar individual
  (abra o arquivo direto, os botões de download não funcionam se servido como artifact).
- `EJUP-Story-Artigo-Superendividamento.png` — story de divulgação do artigo (1080×1920),
  com zona reservada para a caixinha de link do Instagram.

Conceito: as 14 telas são recortes de uma única imagem de 15.120×1.440px — uma curva
dourada atravessa todas sem interromper nas emendas, sobe com o argumento (gasto,
inadimplência, negativados) e desce quando a lei/o jurista entram. Detalhes da construção
e da verificação de emenda estão na seção 11 do `HANDOFF-EJUP.md`.

## `carrossel-quatro-competencias/`

Carrossel conceitual de Instagram, 8 telas, 1080×1440, sobre o eixo temático de setembro:
as quatro competências do jurista do presente (notório saber, alfabetização em IA, visão
estratégica e de gestão, critério ético diante da inovação).

- `tela-01.png` a `tela-08.png` — as peças em alta, prontas para publicar.
- `EJUP-Carrossel-Quatro-Competencias.pdf` — as 8 telas em PDF, para aprovação.
- `EJUP-Carrossel-Quatro-Competencias-PNG.zip` — os 8 PNGs.
- `apresentacao.html` — visualizador com baixar individual/tudo/PDF. Precisa ser servido
  (`python3 -m http.server` na pasta), senão o navegador bloqueia o download.
- `carrossel.html` — a peça viva, com Gotham e logos embutidos; roda sozinha.
- `_build/` — motor: `template.html`, `build.py` (embute fontes/logos/tokens),
  `render.py` (mede e exporta os PNGs), `deliver.py` (PDF, ZIP, apresentação).

Conceito **"As quatro colunas"**: uma ordem clássica depurada, desenhada em SVG, atravessa
o carrossel. A capa mostra a colunata inteira apagada; a tela 2 mostra o frontão solto e
fora de prumo (a pressa querendo o topo sem a base); cada competência acende uma coluna em
dourado; na tela 7 as quatro sustentam o frontão. Detalhes na seção 15 do `HANDOFF-EJUP.md`.

## `a-estante-ejup/utopia-para-realistas/`

Primeira edição do quadro "A Estante EJUP", quatro stories (1080×1920) recomendando
*Utopia para Realistas*, de Rutger Bregman.

- `estante-01.png` a `estante-04.png`.

Versão "A Escala": uma barra de progresso (Inimaginável → Radical → Aceitável → Inevitável)
avança a cada story, e há um quiz com resposta atrasada entre a tela 2 e a 3. Detalhes na
seção 12 do `HANDOFF-EJUP.md`.
