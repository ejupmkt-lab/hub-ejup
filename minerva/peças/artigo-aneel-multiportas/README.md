# Artigo "O sistema multiportas da ANEEL" · capa, story e carrossel do LinkedIn

`python3 _build/gerar.py && python3 _build/render.py`

## ⚠ Correção pendente (28/09/2026)

O texto do artigo foi revisado a partir de um documento de orientações
editoriais do board (precisão jurídico-regulatória e SEO/GEO). A versão
corrigida está em `artigo.md`, nesta pasta. Mudou o suficiente para exigir
atualização nas artes já geradas:

- **Título novo:** "Mediação na ANEEL e arbitragem na CCEE: como funciona o
  sistema multiportas do setor elétrico" (a capa, o story, o feed e o
  carrossel do LinkedIn ainda usam o título antigo, "O sistema multiportas
  da ANEEL").
- **CCEE:** denominação atual é "Câmara de Comercialização de Energia",
  não mais "... de Energia Elétrica" (Lei nº 15.269/2025).
- **Ouvidoria:** o artigo agora distingue Ouvidoria institucional da
  Ouvidoria Setorial; qualquer tela que mencione ouvidoria precisa refletir
  essa distinção.
- **FAQ:** duas perguntas novas ("Qual a diferença entre a Ouvidoria
  institucional e a Setorial?" e "A ANEEL julga a arbitragem da CCEE?") e
  duas reformuladas (ver `artigo.md`).
- **Dados estatísticos:** cada número agora vem com o período de
  referência na mesma frase, e um aviso de que reclamações, mediações e
  ações judiciais são métricas diferentes, não comparáveis diretamente.

Antes de publicar em qualquer canal, `_build/gerar.py` e `_build/linkedin.py`
precisam ser atualizados com o texto de `artigo.md`, e as artes,
regeradas.

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

## Legenda sugerida (LinkedIn)
O mesmo conflito no setor elétrico pode seguir por quatro caminhos: a Ouvidoria Setorial da ANEEL, a mediação administrativa, a arbitragem em câmaras credenciadas junto à CCEE e o processo judicial.

Os números mostram como o sistema é usado. A Ouvidoria recebe cerca de 200 mil reclamações por ano. Entre 2018 e 2023, foram 36 mediações administrativas, com prazo médio de 383 dias. Em 2021, a judicialização chegou a 25 mil ações.

No novo artigo da coluna jurídica da EJUP, explicamos a base legal de cada porta, o papel da Superintendência de Mediação Administrativa e das Relações de Consumo (SMA) e o que muda para quem assessora consumidores, geradoras, distribuidoras e comercializadoras.

O artigo completo está no site da EJUP.
