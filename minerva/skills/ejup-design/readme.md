# EJUP — Escola Jurídica · Design System

EJUP (EJUP Educação Jurídica / Escola Jurídica) is a Brazilian legal-education school.
This design system encodes its brand identity for producing on-brand interfaces, slides,
and marketing assets.

## Sources provided
- `uploads/MIV_EJUP_2026_compressed.pdf` — **Manual de Identidade Visual Simplificado** (simplified
  visual identity manual, 12 pp). Primary source for logo, type, and color.
- `EJUP - DOCS /Manual da Marca.pdf` — fuller brand manual (read-only mount; not yet parsed).
- `EJUP - DOCS /Vestuário EJUP.pdf` — apparel / merch applications (read-only mount; not yet parsed).
- `EJUP - DOCS /MIV_EJUP_2026_compressed.pdf` — same as uploaded MIV.

> Note: the "codebase" attached is brand-guideline PDFs, not source code. There is no product
> codebase or Figma — UI kits below are built from the brand system, not reverse-engineered from code.

## Brand at a glance
- **Sector:** legal education (cursos jurídicos, preparação para concursos / OAB, Brazil).
- **Personality:** authoritative, institutional, refined. Dark navy + gold conveys prestige,
  tradition, and seriousness — the visual language of law and academia, elevated with a premium
  gold accent (there is a special **gold-with-texture** logo variant).
- **Language:** Portuguese (pt-BR).

## Typography
- Base typeface: **Gotham** (Book, Light, Bold). Used for headings and long-form/web text alike —
  chosen for its wide range of weights and high legibility.
- Substitution: Gotham is a licensed (Hoefler&Co) font and is **not** on Google Fonts. The nearest
  free geometric-sans match is **Montserrat** (very close cap-height/geometry) — used here as the
  webfont fallback. ⚠️ FLAGGED: replace with licensed Gotham webfont files for production.

## Color palette (from MIV, page 5)
| Hex | RGB | Role |
|---|---|---|
| `#031c37` | 3,28,55 | Primary deep navy (brand) |
| `#0d131a` | 13,19,26 | Near-black ink |
| `#304557` | 48,69,87 | Steel blue (secondary) |
| `#f0b855` | 242,179,61 | Gold / amber accent |
| `#9b6b26` | 155,107,38 | Bronze / dark gold |
| `#414042` | 65,64,66 | Dark gray |
| `#5f6062` | 95,96,98 | Mid gray |
| `#d1d3d4` | 209,211,212 | Light gray |
| `#000000` | 0,0,0 | Mono positive |

Contrast rule (MIV p.7): on brand-colored backgrounds, always pair the darkest tone over the
lightest or vice-versa for maximum contrast.

## Logo
The official **ejup** logo (provided in vector: `uploads/Logo_EJUP_Rebrand_FINAL.svg`). The wordmark is lowercase **“ejup”** beside a concentric-spiral **símbolo**, with the **EDUCAÇÃO JURÍDICA** descriptor (“JURÍDICA” in bold).
- Composition of **símbolo** (spiral mark) + **logotipo** (wordmark) + descriptor; usable together or separately.
- Preferred lockup: **horizontal** (priority); **vertical** alternative; **símbolo** alone for compact/branding contexts (favicon, watermark, avatars).
- Monochrome positive (navy on light) and negative (white on dark). Gold símbolo for premium accents.
- Assets in `assets/logo/`: `ejup-horizontal-{navy,white}.svg`, `ejup-vertical-{navy,white}.svg`, `ejup-symbol-{navy,white,gold}.svg`.

## Brand strategy (from Manual da Marca)
- **Mission:** transform *notório saber jurídico* (eminent legal knowledge) into high-level digital education, connecting experts to the market and preparing professionals for excellence in the practice of Law.
- **Vision:** be the national reference legal school in strategic legal education and the formation of leaders.
- **The enemy:** *a cultura da superficialidade acelerada no Direito* — the culture of accelerated superficiality that turns legal learning into fast consumption.
- **Position:** not opposition, but a *qualified alternative* / *qualified extension* of formal legal education — "tradição sem mofo, inovação sem vulgarização, digital sem superficialidade" (tradition without must, innovation without vulgarization, digital without superficiality).
- **Archetypes:** **The Sage** (dominant) + **The Magician** (secondary). Guardian of deep knowledge that reorganizes and re-enchants tradition for the digital era.
- **The hero (audience):** *o jurista da profundidade consciente* — the jurist of conscious depth. "Alma clássica, repertório contemporâneo" (classic soul, contemporary repertoire).

## CONTENT FUNDAMENTALS
**Voice:** *Autoridade silenciosa* (silent authority). The brand "speaks with calm, density and precision, avoids noise, and positions itself with quiet authority — of one who needn't prove relevance through over-exposure."

- **Language:** Portuguese (pt-BR), formal and institutional. Addresses an intelligent, experienced professional — never condescends.
- **Tone:** precise, dense, reflective, serene. Confident without shouting. Prestige and gravitas over hype.
- **Do:** value time, rigor, criteria, depth, ethics. Use structured argument and solid references. Make tradition a competitive advantage. Calm declaratives.
- **Don't:** no easy promises, no "instant results", no rhetorical seduction, no exclamation-driven urgency, no "minimum viable" tone, no clickbait. Avoid hype words (revolucionário, hack, atalho, fórmula mágica).
- **Casing:** Title-style headlines in Gotham; institutional capitalization. The wordmark and section eyebrows are often set in **all-caps with very wide letterspacing** (`L E T R A · E S P A Ç A D A`), echoing the manual's own typographic treatment.
- **Person:** institutional third person for brand statements; respectful second person (você) when guiding the student. Never overly familiar.
- **Emoji:** none. The brand is sober; emoji would break the register.
- **Examples of register:** "Comunicar autoridade sem ruído." · "Alma clássica, repertório contemporâneo." · "O símbolo conduz; o tecido sustenta." · "Profundidade como vantagem competitiva."

## VISUAL FOUNDATIONS
- **Palette:** deep navy `#031c37` and ink `#0d131a` dominate; **gold `#f0b855`** and bronze `#9b6b26` are precious accents used sparingly (like the embroidered mark on a blazer). Steel `#304557` and a restrained gray ramp (silver `#d1d3d4`) fill the rest. Restricted, sober, high-contrast.
- **Backgrounds:** predominantly dark, premium navy/ink fields for institutional/hero moments; clean white/off-white for content surfaces. No noisy patterns or busy gradients. A subtle gold-texture treatment exists for the special logo variant. When gradients appear, keep them deep navy→ink, very low-key.
- **Type:** Gotham throughout. Generous letter-spacing on caps eyebrows (`--ls-caps: 0.14em`); tight tracking on large display. Light/Book weights for body, Bold/Black for emphasis. Air and margin are part of the prestige — don't crowd.
- **Spacing & layout:** disciplined, grid-led, lots of breathing room. "Sobriedade depurada" — depurated sobriety. Fixed institutional headers; quiet footers.
- **Corner radii:** restrained. Small radii (2–8px) for inputs/cards; institutional, not bubbly. Pills reserved for tags/badges.
- **Cards:** clean, low elevation. Soft navy-tinted shadows (`--shadow-sm/md`), 1px subtle borders (`--border-subtle`). On dark surfaces, cards are steel-blue panels with hairline gold or white separators.
- **Borders:** thin (1px), hairline separators. Gold used as a thin accent rule, never a thick block.
- **Shadows:** soft and cool, tinted toward navy (never warm/black). A dedicated `--shadow-gold` glow for primary CTAs only.
- **Motion:** understated and serene. Short fades and gentle ease-out (`--ease-out`), 120–360ms. No bounce, no playful spring, no infinite loops. Movement should feel composed.
- **Hover:** darken gold toward `--ejup-bronze` (the MIV's own darker gold) / lighten navy slightly; subtle. **Press:** slight darken, optional 1–2px settle — no big shrink.
- **Imagery:** sober, editorial, warm-neutral or cool; suited rooms, books, architecture, focused professionals. Authority without noise. Marks applied discreetly (*ton sur ton* embroidery is the governing metaphor).
- **Transparency/blur:** sparingly — a subtle navy scrim over hero imagery for legibility; light frosted overlays on dark. Not a defining motif.

### Social / Carrossel (Instagram)
The brand's carousel posts have a distinct, well-defined language (see `social/` and `assets/social-refs/`):
- **Format:** portrait **1080×1350** (4:5). Sequence ends on a **CTA slide**: white logo + slogan **“Alma clássica, repertório contemporâneo”** + `@ejup.oficial`.
- **Backgrounds (EJUP identity navy):** dark treatment = **navy `#031c37` glow** in the top corner fading to **ink `#0d131a`** then black; feature slides = a rich **steel→navy→ink** gradient (`#304557`→`#031c37`→`#0d131a`); a **silver** radial (white→`#d1d3d4`) for contrast; or **full-bleed photography** with a directional black scrim. All stops are MIV colors.
- **Headlines:** Gotham, mixed **Light + Bold in the same sentence** — light gray running text, bright-white bold emphasis. Sentence case or wide uppercase.
- **Body:** Light weight, dimmed silver (`#d1d3d4` at reduced opacity), generous leading.
- **Devices:** oversized serif **quotation marks** (steel `#304557`); **steel rounded panels** (`#304557`, radius 28px) for ANTES/AGORA comparisons and numbered 2×2 grids; thin **pill boxes** (radius 44px) with two small steel **corner dots** for mid-carousel CTAs; the **símbolo** as a large low-opacity watermark; logo centered at the bottom.
- **Logo:** white horizontal lockup, centered at the bottom of every slide (navy lockup on silver slides).

## ICONOGRAPHY
- The visual manual defines **no proprietary icon set**. The brand leans on typography, the símbolo (mark), and restraint rather than decorative icons.
- **Substitution (FLAGGED ⚠️):** for UI needs, this system uses **Lucide** (linked from CDN) — thin, geometric, even-stroke line icons that match Gotham's refined, institutional feel. Stroke ~1.5px, no fills, navy or gold only. Replace with a bespoke set if the client commissions one.
- **Emoji / unicode:** not used as icons. Eyebrow separators use the middot `·` (as in the manuals: "Coleção institucional · 01"). The only social glyph is a thin-stroke **Instagram** mark beside `@ejup.oficial` on carousel CTA slides.
- **Logótipo / símbolo:** official ejup logo in `assets/logo/` (lowercase “ejup” wordmark + spiral símbolo). The símbolo doubles as a standalone branding mark (white on dark, gold for accents).

## Index / Manifest

**Root**
- `styles.css` — global entry (consumers link this). `@import`s the token files only.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css` (radii/shadow/motion/layout), `fonts.css` (`@font-face` for Gotham).
- `readme.md` — this guide. `SKILL.md` — Agent-Skills wrapper.
- `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json` — generated; do not edit.

**Assets** (`assets/`)
- `fonts/` — Gotham OTFs (Thin → Black, Book Italic).
- `logo/` — **official ejup logo** (vector). `ejup-horizontal-{navy,white}.svg`, `ejup-vertical-{navy,white}.svg`, `ejup-symbol-{navy,white,gold}.svg`. Source: `uploads/Logo_EJUP_Rebrand_FINAL.svg`.

**Foundation cards** (`guidelines/`) — Design System tab
- Colors: `color-brand`, `color-accent`, `color-neutral`, `color-semantic`.
- Type: `type-display`, `type-body`, `type-weights`, `type-eyebrow`.
- Spacing: `spacing-scale`, `radii`, `shadows`.
- Brand: `logo`, `voice`, `principles`.

**Components** — `window.EJUPDesignSystem_063f43`
- `components/core/` — Button, IconButton, Badge, Avatar, Eyebrow.
- `components/forms/` — Input, Select, Checkbox, Switch.
- `components/layout/` — Card, Tabs, Callout.
- Each: `<Name>.jsx` + `.d.ts` + `.prompt.md`; one `*.card.html` per directory.

**UI kits** (`ui_kits/`)
- `site/` — institutional marketing homepage (hero, programas, docentes, course drawer).
- `plataforma/` — student area (sidebar, dashboard, lesson player).

**Social / Carrossel** (`social/`) — Instagram carousel design language (1080×1350)- `carousel.css` — shared slide styling (backgrounds, headlines, panels, pill, stat hero, data row, photo duotone, timeline, logo bar).
- `carrossel.html` — interactive swipeable post (capa → citação → número gigante → statement → comparativo → dados R$ → pílula → foto → CTA). Starting point.
- Layout cards: `layout-{capa,capa-foto,citacao,stat,dados,comparativo,lista,pill,foto,cta}.html`.
- `assets/social-refs/` — reference exports of real EJUP posts.

**Slides** (`slides/`) — `slide-capa`, `slide-principios`, `slide-citacao` (1280×720).

**Templates** (`templates/`) — ready starting points for consuming projects (each a `.dc.html` with a sibling `ds-base.js`):
- `carrossel-instagram/CarrosselInstagram.dc.html` — full 1080×1350 carousel (capa → conteúdo → CTA slogan), as a scroll-snap filmstrip.
- `site-institucional/SiteInstitucional.dc.html` — institutional homepage, composed from the Site kit sections.
- `plataforma-aluno/PlataformaAluno.dc.html` — student area (sidebar + dashboard).

## Caveats / open items
- **Imagery**: no licensed photography included; UI kits and slides use navy panels and the ejup symbol as branding in place of photos.
- Gotham fonts are client-provided and embedded; `Montserrat` remains only as a CSS fallback.
- Icons: Lucide-style inline SVGs / substitution (no proprietary EJUP icon set defined).
