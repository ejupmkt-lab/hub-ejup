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
| `SUPABASE_URL` | Banco de respostas da Minerva, newsletter e pedidos in company |
| `SUPABASE_SERVICE_ROLE_KEY` | Idem — chave *service_role*, só no servidor |

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html`, `assets/app.js`, `assets/style.css` | Site: Home, A escola, Formações, Professores, EJUPcast, Coluna Jurídica, In company, Política de Privacidade. Rotas reais (`/escola`, `/formacao/licenciamento`…). |
| `minerva/` | Página `/minerva`; `abertura.webp` e `fechamento.webp` (movimento da esfera, tocam uma vez), `repouso.jpg` e `aberta.jpg` (estados parados) |
| `api/minerva.js`, `api/_lib/busca.js` | Minerva sem IA: busca a pergunta cadastrada mais parecida e devolve a resposta (20 req/min por IP) |
| `api/_lib/respostas.js` | Respostas iniciais da Minerva; reserva quando o Supabase não estiver configurado |
| `api/lead.js` | Grava newsletter e pedidos in company no Supabase (5 envios/min por IP) |
| `img/`, `vid/`, `fonts/` | Imagens, vídeos e Gotham (woff2) |
| `vercel.json` | Rotas do site, `/minerva`, microfone, cache |

Conteúdo (formações, episódios, artigos, FAQ) fica no topo de `assets/app.js`
(`F`, `E`, `AR`, `FAQ`). Endereços externos ficam em `LINKS` (YouTube e Spotify estão
vazios: os botões só aparecem quando forem preenchidos) e os links de pagamento em
`CHECKOUT` (vazio = o botão "Adquirir agora" abre o WhatsApp citando a formação).
Para tocar um episódio no site, preencha `yt` com o ID do vídeo no YouTube.

## Minerva: banco de respostas

A Minerva não usa inteligência artificial. Cada linha do banco tem a pergunta principal, outras formas
de perguntar (`variacoes`), termos-chave (`palavras`) e a `resposta`. A Minerva compara a pergunta do
visitante com tudo isso e devolve a resposta da linha mais parecida; se nada for parecido o bastante,
encaminha para a equipe e sugere perguntas próximas.

- **Com Supabase:** rode `dev/minerva_respostas.sql` no SQL Editor (cria a tabela `minerva_respostas` e
  carrega as respostas iniciais). Depois, edite pelo **Table Editor**: mudanças valem em até 1 minuto,
  sem novo deploy. `ativo = false` tira uma resposta do ar.
- **Sem Supabase:** a Minerva usa `api/_lib/respostas.js`. Para regenerar o SQL a partir dele:
  `node dev/gerar-sql.mjs`.

Para melhorar uma resposta que não está sendo encontrada, acrescente a forma como as pessoas perguntam
em `variacoes`, ou o termo principal em `palavras`.

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
npm run dev         # http://localhost:3000 (a Minerva responde com o banco local)
```
