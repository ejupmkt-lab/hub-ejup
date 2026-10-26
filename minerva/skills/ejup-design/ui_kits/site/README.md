# EJUP Marketing Site — UI Kit

Institutional homepage for the EJUP school. Dark navy hero, gold accents, restrained
"autoridade silenciosa" register.

## Screens / sections
- `Header.jsx` — `SiteHeader` — sticky navy top bar, wordmark, nav, Entrar / Matricule-se.
- `Hero.jsx` — `SiteHero` — gradient navy hero with display headline, lead, CTAs, stat row, decorative gold rings.
- `Courses.jsx` — `SiteCourses` — "Programas" grid of interactive course cards (click opens drawer).
- `Professors.jsx` — `SiteProfessors` + `SiteFooter` — docente grid (steel panels) and ink footer.
- `index.html` — composes all sections + an interactive **course drawer** (click a course card).

## Composition
Built on the design-system components (`Button`, `Card`, `Eyebrow`, `Badge`, `Avatar`)
loaded from `_ds_bundle.js` under `window.EJUPDesignSystem_063f43`. Sections register
themselves on `window`; `index.html` wires the interactive shell.

## Notes
- Logo is the placeholder Gotham wordmark — swap for the official asset.
- Imagery is intentionally omitted (no licensed photos); panels and rings stand in.
