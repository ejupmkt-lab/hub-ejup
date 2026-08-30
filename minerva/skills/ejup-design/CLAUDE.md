# EJUP Design System — instruções permanentes

## Marca
- EJUP — Escola Jurídica (educação jurídica digital de alto nível, pt-BR).
- Slogan: **"Alma clássica, repertório contemporâneo."**
- Arquétipos: Sábio + Mago. Posição: alternativa qualificada à superficialidade acelerada no Direito.

## Regras gerais de conteúdo
- **SEMPRE revisar ortografia, gramática, concordância e pontuação** (pt-BR) de todos os textos antes de entregar qualquer material.
- Tom de voz: autoridade silenciosa — formal, denso, preciso, sem hype nem exclamação. Sem emoji.
- **NÃO usar travessão entre palavras** no meio do texto. **NÃO usar a construção "não é sobre isso, é sobre aquilo"** (trope de texto de IA).

## Cores (estritamente o MIV — nunca inventar cores)
- Navy #031c37 (primária) · Ink #0d131a · Aço #304557 · Dourado #f0b855 (acento raro) · Bronze #9b6b26 (hover/atenção) · Prata #d1d3d4 · Cinza #5f6062 · Grafite #414042 + preto/branco.
- Tons claros = tintas por opacidade das cores MIV, nunca novos hex. Sem verde/vermelho de status (info = aço, atenção/erro = bronze). Sem magenta/rosa (cor de campanha fora do MIV) a menos que o usuário peça.

## Tipografia / logo
- Fonte **Gotham** (client-provided, em `assets/fonts/`). Manchetes mesclam **Light + Bold** na mesma frase. Eyebrows em caps com tracking largo.
- Logo oficial em `assets/logo/` (ejup-horizontal/vertical/symbol × navy/white/gold). Lockup horizontal é prioritário.

## Carrossel (Instagram)
- **Formato: 1080×1440 px** (3:4).
- **O último slide é SEMPRE um CTA** com o **logo da EJUP** (lockup horizontal branco), o slogan e o handle **@ejup.oficial**. Slogan com **"repertório contemporâneo" em NEGRITO** e "Alma clássica," em peso leve.
- **Símbolo (espiral) NUNCA atrás de texto** — sempre em um canto vazio. Cor do símbolo:
  - Fundo escuro (navy/ink/foto) → **branco com opacidade** (~6–8%).
  - Fundo claro/branco → **azul marinho (#031c37) com opacidade** OU **preto com opacidade**.
- **SEM cabeçalho de tema e SEM contador/número de slide** no topo das peças (não usar `.post__header` / `.post__counter`).
- **Mesclar imagens de ilustração** em alguns slides (não precisa ser em todos): EU (Claude) busco as imagens na web sobre o tema de cada slide — o usuário NÃO envia imagens. Imagem deve ter relação direta com o que é falado naquela página. Usar `<image-slot>` com `src` preenchido; fotos em **duotone navy** (`.post__photo--duo`) + scrim navy para legibilidade. Creditar quando a fonte exigir (ex.: Unsplash).
- **Enquadramento de fotos com pessoas:** nunca cortar a cabeça; identificar corretamente quem é cada pessoa (legenda/crédito de nome quando aplicável).
- **Diagramação:** respiro entre as informações — nunca deixar textos/elementos grudados.
- **Número de slides:** flexível — se o texto ficar denso, aumente o número de slides para distribuir melhor o conteúdo em vez de espremer.
- **Engajamento:** ser criativo, manter dinâmica e harmonia entre as páginas; compor para que o cliente da EJUP queira **salvar, enviar a alguém ou comentar** — dado concreto, síntese útil, insight guardável (variar layouts: capa → dado → foto → síntese → CTA).
- **Entrega/export:** toda peça de carrossel traz UI de exportação: (1) **download do PNG de cada slide** já em 1080×1440 e em alta qualidade; (2) **baixar todas as peças de uma vez** (PNGs separados); (3) **baixar o PDF de apresentação** para aprovação.
- Backgrounds: `.post--dark` (brilho navy no canto → ink → preto) ou `.post--navy` (aço→navy→ink). Linguagem completa em `social/carousel.css` + `social/README.md`.
- **Referência definitiva de padrão** (série "supercomputador Macaíba", `reference-carousels/EJUP-carrossel-*.png`): TODO slide com foto de fundo real (full-bleed, sem duotone forçado — pode ser foto colorida com scrim escuro para legibilidade); textos NUNCA no topo colado — sempre com margem/respiro; dados numéricos em blocos com linha divisória fina acima de cada item; comparação com barra de progresso horizontal (dourado vs. cinza) quando fizer sentido; timeline de anos em coluna (ano dourado + descrição); chips/pills com seta "→" entre etapas; citação de fonte pequena e discreta no rodapé do texto (não no rodapé da peça); foto de pessoas em ambiente real (ex.: podcast) sem duotone, cores naturais, dentro de card com cantos arretados; ÚLTIMO slide de conteúdo pode ser navy claro/prata (`.post--silver`) para variar ritmo antes do CTA.

## Diagramação de carrossel — regras fixas (não repetir pedido)
Estas valem para TODA peça nova. Só mudam se o usuário pedir explicitamente o contrário.

### Texto
- **Texto sempre justificado.** `text-align:justify` + `text-align-last:left` + `hyphens:auto` em títulos e parágrafos. Texto "jogado" (ragged right) não passa.
- **NUNCA usar eyebrow/rótulo de tema em dourado no topo do slide** (ex.: "O QUE A LEI DEFINE", "DESDE 2025", "COMO SE REPACTUA"). Isso dá cara de peça feita por IA. O assunto se anuncia pelo próprio título.
- **O dourado é destaque DENTRO da frase**, não etiqueta acima dela: use `<span class="g">` na expressão que carrega o argumento. Pelo menos um destaque dourado por slide.
- Conteúdo **centralizado verticalmente** na página, com respiro equivalente em cima e embaixo. Nada empurrado para o topo nem sobrando meia página vazia.

### Elementos visuais
- **Todo slide precisa de mais que texto.** Barra de proporção, anel de porcentagem, timeline, painéis, blocos de dado com régua, chips, numeração. Slide só com parágrafo é slide fraco.
- Variar o fundo ao longo do carrossel. **Não repetir o mesmo tratamento escuro em sequência**: intercalar `.post--dark`, `.post--navy`, `.post--silver` (branco acinzentado) e foto.
- **Logo EJUP no rodapé com o MESMO tamanho em todos os slides** (altura fixa, sem exceção no CTA).

### Capa
- A capa precisa de **hook visual**: imagem com tensão que faça parar o scroll, não foto ambiente neutra.
- A chamada de arraste é **elemento de destaque**, com seta e contraste (dourado), nunca uma nota discreta em itálico no rodapé.

### Fotos
- Enquadramento **centralizado** no assunto. Conferir o recorte renderizado, não confiar no `object-fit`.
- Pessoa nunca cortada na cabeça nem deslocada para um canto do card.

### CTA final
- Precisa ser **chamativo**: destaque dourado, fundo diferente do resto, hierarquia clara do que fazer.
- O slogan não fica largado numa linha no rodapé. Diagramar como parte da composição.

## Estrutura do projeto
- `styles.css` → tokens em `tokens/` (cores, tipografia, espaçamento, fontes).
- Componentes React em `components/{core,forms,layout}/` (namespace `EJUPDesignSystem_063f43`).
- UI kits em `ui_kits/{site,plataforma}/` · Slides 16:9 em `slides/` · Carrossel em `social/`.
- Templates prontos em `templates/` (carrossel-instagram, site-institucional, plataforma-aluno).
- Guia completo da marca: `readme.md`.
