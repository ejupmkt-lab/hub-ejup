# Artigo "Mediação na ANEEL e arbitragem na CCEE: o sistema multiportas do setor elétrico" · capa, story e carrossel do LinkedIn

`python3 _build/gerar.py && python3 _build/render.py`

## Texto atualizado (29/09/2026)

As artes foram regeradas com o texto revisado de `artigo.md`: título "O
sistema multiportas do setor elétrico" com o subtítulo "Mediação na ANEEL
e arbitragem na CCEE"; a ouvidoria das telas é sempre a Setorial; base
legal com a Lei nº 13.140/2015 e a REH ANEEL nº 3.173/2023; a REN
1.061/2023 como reorganização da SMA; os números tratados como métricas
diferentes, sem comparação entre eles; e a tela da arbitragem diz que quem
julga é o tribunal arbitral, e não a ANEEL. Elementos visuais inalterados.

| arquivo | tamanho | uso |
|---|---|---|
| `capa-site-1600x900.png` | 1600×900 | coluna jurídica do site (o site mostra só os 512 px de cima; o render reprova se passar) |
| `story-1080x1920.png` | 1080×1920 | divulgação nos stories |
| `feed-1080x1440.png` | 1080×1440 | a mesma arte do story, no formato do feed |
| `linkedin/tela-01..07.png` e `carrossel-linkedin.pdf` | 1080×1350 | carrossel do LinkedIn (sobe como documento PDF) |

## Capa do site, story e feed
Seguem a capa já publicada da investigação defensiva: pílula, título com o
trecho dourado em Light, subtítulo, ícones da coluna jurídica e do tema
(raio, "Direito da energia"), autoria "Equipe EJUP" e, nos verticais, o
botão "Ler o artigo". Sem foto de autor: o lugar dela é das portas.

## O recurso visual
As quatro portas do sistema (Ouvidoria, Mediação, Arbitragem, Judiciário)
desenhadas como arcos: arquitetura clássica depurada, do mapa imagético, e o
próprio argumento do artigo. No carrossel cada tela acende a porta de que
fala; capa e fecho acendem todas; a tela da base legal deixa todas apagadas.
Zero crédito do Higgsfield.

## Carrossel do LinkedIn
`_build/linkedin.py`, no sistema do carrossel de poder de polícia ambiental
(`skills/ejup-design/CARROSSEL.md`): telas escuras com foto em duotone na
metade de cima e texto no terço inferior, alternando com telas de papel com
lista e cartões em bronze e um arco vazado sangrando pela direita. Título de
pesos mistos, corpo justificado. O fio entre as telas são as quatro portas,
pequenas, acima de cada título, em área limpa: cada tela acende a sua.
Fotos e créditos em `fotos/CREDITOS.md` (todas Pexels, sem crédito
obrigatório).

## Fontes (itens 20 e 21)
- Leis e resoluções citadas (fonte primária): Lei nº 9.427/1996, Lei nº
  10.848/2004, Lei nº 13.140/2015, Lei nº 13.848/2019, Lei nº 15.269/2025
  (denominação atual da CCEE), REN ANEEL nº 957/2021 e nº 1.061/2023
  (https://www2.aneel.gov.br/cedoc/ren20231061.html), Resolução
  Homologatória ANEEL nº 3.173/2023 e a Convenção Arbitral vigente da CCEE.
- Números (200 mil reclamações/ano; 36 mediações entre 2018 e 2023, prazo
  médio de 383 dias; pico de 25 mil ações em 2021, cerca de 4 mil do apagão
  no Amapá): painel do V Congresso Internacional CBMA, Migalhas, coluna
  Migalhas Consensuais,
  https://www.migalhas.com.br/coluna/migalhas-consensuais/405763/mediacao-no-setor-da-energia--painel-do-v-congresso-internacional
- Pesquisa acadêmica: "O Uso da Mediação Administrativa na Solução de
  Conflitos pela ANEEL", Journal of Law and Regulation (UnB),
  https://periodicos.unb.br/index.php/rdsr/article/view/19264
- SMA, página oficial da ANEEL:
  https://www.gov.br/aneel/pt-br/composicao/relacoes-com-a-sociedade/superintendencia-de-mediacao-administrativa-e-das-relacoes-de-consumo

## Legenda sugerida (LinkedIn) · texto revisado do artigo
O mesmo conflito no setor elétrico pode seguir por quatro caminhos: a Ouvidoria Setorial e a mediação administrativa, conduzidas pela ANEEL, a arbitragem no ambiente da CCEE e o processo judicial.

Cada porta tem sua base legal e seu volume próprio. A Ouvidoria Setorial recebia cerca de 200 mil reclamações por ano. Entre 2018 e 2023, foram 36 mediações administrativas, com prazo médio de 383 dias. Em 2021, a judicialização chegou a 25 mil ações. São métricas diferentes, e cada uma retrata só a sua via.

No novo artigo da coluna jurídica da EJUP, explicamos a base legal de cada porta, o papel da Superintendência de Mediação Administrativa e das Relações de Consumo (SMA), a Convenção Arbitral da CCEE e o que isso muda para quem assessora consumidores, geradoras, distribuidoras e comercializadoras.

O artigo completo está no site da EJUP.

## Duas versões alternativas (29/09/2026, após o cliente achar os arcos infantilizados)

Mesmo texto, mesma diagramação, mesmas fotos; muda só a figura que costura
as peças (`_build/figuras.py`). Gerar:

    ESTILO=portico python3 _build/gerar.py && ESTILO=portico python3 _build/linkedin.py && ESTILO=portico python3 _build/render.py
    ESTILO=fios    python3 _build/gerar.py && ESTILO=fios    python3 _build/linkedin.py && ESTILO=fios    python3 _build/render.py

- **`versao-portico/` (versão A, portas redesenhadas):** fachada clássica
  em traço fino, sem preenchimento chapado nem arco de desenho infantil.
  Arquitrave em duas linhas com numeral romano no friso, batente duplo,
  portas fechadas com almofadas em traço. A porta ativa aparece
  entreaberta: fresta de luz dourada e o reflexo no piso.
- **`versao-fios/` (versão B, tema elétrico):** diagrama unifilar, a
  linguagem de projeto elétrico. Um barramento e quatro alimentadores, cada
  um com disjuntor e terminal. Os condutores são desenhados como cabo
  isolado (capa escura e alma de cobre). No circuito ativo o disjuntor está
  fechado e a alma conduz em dourado; nos outros, disjuntor aberto e fio
  apagado.

Sem `ESTILO`, os scripts continuam gerando a versão original com os arcos,
na raiz da pasta.

## Versão C · linhas de transmissão (`versao-linhas/`, 29/09/2026)
Pedido do Victor depois das versões A e B: o sistema de uma grande
hidrelétrica. Uma barragem de gravidade em corte (reservatório, condutos
forçados, casa de força) alimenta o pórtico de saída de uma subestação; de lá
a energia segue por três torres treliçadas até o pórtico de chegada, em
quatro condutores com catenária. Cada condutor é uma porta. O ativo conduz
em dourado, com brilho; os outros ficam em traço apagado.

    ESTILO=linhas python3 _build/gerar.py && ESTILO=linhas python3 _build/linkedin.py && ESTILO=linhas python3 _build/render.py

**Sem fotos no carrossel da versão C (29/09/2026).** Retorno do Roberto:
gostou da lógica das linhas, mas a imagem por trás polui; "ou imagem ou a
ilustração". Na versão `linhas` as telas escuras ficaram só com a
ilustração sobre o navy, com o conteúdo centrado na tela.
