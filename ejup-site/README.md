# Site da EJUP

Tudo que vai para a Vercel fica nesta pasta. Na Vercel: **Root Directory = `site`**,
Framework **Other**, sem comando de build.

## Identidade visual do site

O site segue o arquivo do Figma "Apresentação · IDV do site" (fileKey `AnSK1oPgxtlYOG0p30Frtc`):
Gotham em peso regular nos títulos, Instrument Serif Italic em ouro na frase de ênfase,
botões em pílula, vidro, cantos amplos e o tom de apoio "papel". **Essas regras valem só para
o site.** Todas as outras produções da EJUP seguem o MIV (ver `CLAUDE.md` na raiz).

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Para quê |
|---|---|
| `ANTHROPIC_API_KEY` | Respostas da Minerva (`/api/minerva`) |
| `SUPABASE_URL` | Newsletter e pedidos in company (`/api/lead`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Idem — chave *service_role*, só no servidor |

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html`, `assets/app.js`, `assets/style.css` | Site: Home, A escola, Formações, Professores, EJUPcast, Coluna Jurídica, In company, Política de Privacidade. Rotas reais (`/escola`, `/formacao/licenciamento`…). |
| `minerva/` | Página `/minerva`, vídeos e imagens da Minerva |
| `api/minerva.js`, `api/_lib/prompt.js` | Endpoint e prompt da Minerva (20 req/min por IP) |
| `api/lead.js` | Grava newsletter e pedidos in company no Supabase (5 envios/min por IP) |
| `img/`, `vid/`, `fonts/` | Imagens, vídeos e Gotham (woff2) |
| `vercel.json` | Rotas do site, `/minerva`, microfone, cache |

Conteúdo (formações, episódios, artigos, FAQ) fica no topo de `assets/app.js`
(`F`, `E`, `AR`, `FAQ`). Endereços externos ficam em `LINKS` (YouTube e Spotify estão
vazios: os botões só aparecem quando forem preenchidos) e os links de pagamento em
`CHECKOUT` (vazio = o botão "Adquirir agora" abre o WhatsApp citando a formação).
Para tocar um episódio no site, preencha `yt` com o ID do vídeo no YouTube.

## Supabase: tabela `leads`

Rode no SQL Editor do projeto:

```sql
create table public.leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  tipo text not null check (tipo in ('newsletter', 'incompany')),
  email text not null,
  nome text, organizacao text, equipe text, tema text, mensagem text, origem text
);
alter table public.leads enable row level security; -- sem políticas: só o servidor acessa
create unique index leads_newsletter_email on public.leads (lower(email)) where tipo = 'newsletter';
```

## Rodar localmente

```bash
npm install
npm test            # testes dos endpoints
npm run dev:mock    # http://localhost:3000 com a Minerva respondendo em modo teste
```
