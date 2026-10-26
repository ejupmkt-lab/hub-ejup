# EJUP — Carrossel (Instagram) · Design Language

Reusable layouts for EJUP's social carousel posts, absorbed from the brand's existing posts
(`assets/social-refs/`). Portrait **1080×1440** (4:5).

## Files (cont.)

### Header + page counter (absorbed from the "Custo Invisível" set) — ⚠️ DESCONTINUADO
Por decisão da marca (ago/2026), os novos carrosséis **NÃO levam** tema no topo nem contador de slides. As classes `.post__header` / `.post__counter` permanecem no CSS apenas para reprodução de peças antigas.
- Full-bleed photo slides use `.post__photo` + scrim; light slides use `.post--silver` with a navy headline.
- `carousel.css` — the shared design language. Link **after** `../styles.css` (it needs the brand tokens). Defines `.post` frames, backgrounds, headline/statement type, steel `.panel`s, the `.pill` CTA box, the bottom `.post__logo` bar, photo treatment, and the final `.cta` slide.
- `carrossel.html` — **interactive** swipeable post (arrows / dots / keyboard, position persisted). Use as the starting point for a new carousel.
- `layout-*.html` — single-slide specimen cards, one per archetype:
  - `layout-capa` — cover: gold eyebrow, Light+Bold headline, símbolo watermark.
  - `layout-capa-foto` — **cover over a photo** (navy duotone) + centered eyebrow/headline/credit.
  - `layout-citacao` — oversized quotation marks + impact line.
  - `layout-stat` — **número gigante** (mixed weight/color: light prefix + black number + gold unit) with lead / takeaway / italic note.
  - `layout-dados` — **stat monetário** (R$) + 2-column gold-topped **data row**.
  - `layout-comparativo` — ANTES / AGORA steel panels with hairline divider.
  - `layout-lista` — 2×2 numbered steel cards.
  - `layout-pill` — statement + thin pill CTA box with corner dots (navy identity bg).
  - `layout-foto` — full-bleed photo + directional scrim.
  - `layout-cta` — **closing slide**: logo + slogan *“Alma clássica, repertório contemporâneo”* + `@ejup.oficial`.

## Patterns (absorbed from the EJUPCAST + Energia carousels)
- **Número gigante / stat hero** (`.stat-hero`): one metric dominates the slide — `.pre` (light) + `.num` (Gotham Black) + `.unit` (gold). A `.lead-line` above sets it up; a bold `.takeaway`, dimmed `.support`, hairline `.hair-rule` and italic `.note-italic` follow.
- **Data row** (`.data-row`): 2–column labelled data points with a **gold top rule** — `.k` (bold label) + `.v` (gray caption). No boxes.
- **Chips** (`.chip`): small uppercase inline tags (O SETOR · O PRAZO).
- **Timeline** (`.timeline`): year dots + connecting gold→steel rule.
- **Photo duotone** (`.post__photo--duo`): grayscale image + navy-multiply + silver-lighten = an institutional **navy duotone**. The reference posts use a magenta duotone (a campaign colour that is **not** in the MIV); per brand direction it is rendered in navy. Pair with `.post__scrim--navy-bottom`.
- **Concentric watermark**: the símbolo placed large & low-opacity in an empty corner reads as tonal rings (`.post__mark--lg` + `--tr2` / `--br2`).

## Backgrounds (EJUP identity)
Two dark treatments, both built from **MIV colors only**:
- `.post--dark` — **navy `#031c37` glow** in the top-right corner fading to **ink `#0d131a`** then black.
- `.post--navy` — rich **steel→navy→ink** gradient (`#304557`→`#031c37`→`#0d131a`) for feature / statement moments.
- `.post--silver` — light radial (white→`#d1d3d4`). `.post--photo` — full-bleed image.

The **símbolo watermark** always sits in an *empty corner* (`--tr` / `--tl` / `--br`), never behind text.
- Every slide carries the **white horizontal logo** centered at the bottom (navy logo on silver slides).
- Headlines mix **Gotham Light + Bold** in one sentence (light gray running text, bright-white emphasis).
- Keep gold rare — eyebrow labels and the closing símbolo watermark only.
- The carousel **always ends** on the CTA slide with the slogan and `@ejup.oficial`.

## Regras de entrega (padrão para novos carrosséis)
- **Dimensão: 1080×1440 px** por slide.
- **Sem tema no topo e sem numeração de slides.**
- Texto revisado (ortografia, gramática, concordância, pontuação); sem travessão entre palavras; sem a construção "não é sobre X, é sobre Y".
- Compor para engajamento: conteúdo que o cliente queira salvar, enviar ou comentar; dinâmica e harmonia entre as páginas.
- Toda entrega inclui UI de exportação: **PNG por slide (1080×1440)**, **baixar todas as peças de uma vez** e **PDF de apresentação para aprovação**.

## Rules

## Photography
`layout-foto` uses a placeholder. Drop a real photo into `.post__photo > img` (full-bleed,
`object-fit:cover`) and keep the `.post__scrim--left` / `--bottom` for text legibility. The
brand's photography is sober and editorial: nature/territory, justice iconography, professionals.
