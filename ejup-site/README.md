# Site da EJUP — Minerva

Tudo que vai para a Vercel fica nesta pasta. Na Vercel: **Root Directory = `site`**,
Framework **Other**, sem comando de build, e a variável `ANTHROPIC_API_KEY` cadastrada.

| Caminho | O que é |
|---|---|
| `minerva/index.html` | Página `/minerva` (`/` redireciona para ela). CSS e JS no próprio arquivo. |
| `minerva/abertura.mp4`, `fechamento.mp4` | Vídeos da Minerva (fechada → aberta, aberta → fechada). |
| `minerva/repouso.jpg`, `aberta.jpg` | 1º quadro da abertura e último quadro: estados parados e fallback sem vídeo. |
| `api/minerva.js` | `POST /api/minerva` → Claude. Limite de 20 req/min por IP. |
| `api/_lib/prompt.js` | Prompt da Minerva (texto de marca). |
| `fonts/` | Gotham Light, Book, Medium e Black em woff2. |
| `vercel.json` | Redirecionamento, permissão de microfone, cache. |

Ajustes rápidos ficam no topo da página:

- `MINERVA_CONFIG` (início do segundo `<script>`): endpoint, caminhos dos vídeos e saudação.
- Variáveis `--pulse-speed`, `--pulse-min`, `--pulse-max`, `--rest-glow`, `--halo-size`,
  `--float` e `--float-speed` (início do CSS): ritmo do brilho e da flutuação.

## Rodar localmente

```bash
npm install
npm test            # testes do endpoint e do limite por IP
npm run dev:mock    # http://localhost:3000/minerva com respostas de teste
ANTHROPIC_API_KEY=... npm run dev   # com a Minerva de verdade
```
