---
name: ejup-design
description: Use this skill to generate well-branded interfaces and assets for EJUP — Escola Jurídica (Brazilian legal-education school), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## EJUP in one breath
Brazilian legal-education school. Voice = *autoridade silenciosa* (silent authority): calm, dense, precise, never hype. Archetypes: Sage + Magician. "Alma clássica, repertório contemporâneo." Language is pt-BR, formal and institutional.

## Non-negotiables
- **Palette:** deep navy `#031c37` + ink `#0d131a` dominate; **gold `#f0b855`** is a rare, precious accent (one CTA per view). Steel `#304557`, silver `#d1d3d4`, graphite `#414042` fill the rest.
- **Type:** Gotham throughout (fonts in `assets/fonts/`). Wide-tracked uppercase eyebrows are a signature device. Light/Book body, Bold/Black display.
- **Restraint:** small radii, soft navy-tinted shadows, hairline borders, generous whitespace. No emoji, no bubbly corners, no busy gradients, no exclamation-driven urgency.
- **Motion:** short, serene fades / ease-out. No bounce, no loops.

See `readme.md` for the full content + visual foundations, and `_ds_bundle.js` (namespace `EJUPDesignSystem_063f43`) for components.

## Carrossel de Instagram — checklist obrigatório
Sempre que criar um novo carrossel, seguir `social/README.md` + `social/carousel.css` e:
- Dimensão **1080×1440 px**, cores estritamente MIV (ver acima).
- Revisar ortografia/gramática/concordância/pontuação. Sem travessão entre palavras. Sem o trope "não é sobre isso, é sobre aquilo".
- Sem cabeçalho de tema e sem numeração de slide no topo. **Sem eyebrow dourado de assunto** no começo do slide: dá cara de IA.
- **Texto justificado** (`text-align:justify` + `text-align-last:left` + `hyphens:auto`), nunca jogado.
- **Dourado como destaque dentro da frase**, ao menos um por slide. Conteúdo centralizado verticalmente.
- **Todo slide leva elemento visual** além de texto: barra, anel, timeline, painel, chip, bloco de dado.
- **Logo do rodapé com altura idêntica em todos os slides.** Variar fundo ao longo do carrossel.
- Capa com hook visual e chamada de arraste em destaque. CTA final chamativo, com fundo próprio.
- Buscar imagens na web relacionadas a cada slide (não pedir ao usuário) — algumas páginas, não todas; duotone navy; enquadramento sem cortar cabeças; identificar pessoas.
- Diagramação com respiro — nada grudado. Aumentar o número de slides se o texto ficar denso.
- Compor para engajamento (salvar/enviar/comentar): variar layouts (capa → dado → foto → síntese → CTA), manter dinâmica e harmonia.
- **Último slide sempre CTA**: logo EJUP + "Alma clássica, **repertório contemporâneo**." + @ejup.oficial. Símbolo sempre em canto vazio, nunca atrás de texto.
- Entregar com 3 botões: baixar PNG por slide (alta qualidade, 1080×1440), baixar todas as peças de uma vez, baixar PDF de apresentação para aprovação.
