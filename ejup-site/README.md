# Site da EJUP — Minerva

Tudo que vai para a Vercel fica nesta pasta. Na Vercel, o projeto usa
**Root Directory = `site`**, sem framework e sem comando de build.

- `minerva/` — página da Minerva (`/minerva`) e vídeos `abertura.mp4` / `fechamento.mp4`
- `api/minerva.js` — endpoint `POST /api/minerva` (chave em `ANTHROPIC_API_KEY`, só no painel da Vercel)
- `api/_lib/` — utilitários do endpoint (limite de 20 req/min por IP)
- `vercel.json` — `/` redireciona para `/minerva`, cabeçalhos de microfone e cache
- `tests/` — `npm test`
