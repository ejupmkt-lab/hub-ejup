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
| `SUPABASE_URL` | Banco de respostas da Minerva, newsletter, in company e Portal |
| `SUPABASE_SERVICE_ROLE_KEY` | Idem — chave secreta (`sb_secret_…` ou *service_role*), só no servidor |
| `RESEND_API_KEY`, `EMAIL_FROM` | Opcional. E-mails do Portal (dúvida nova, resposta do professor, plantão, lembretes). Sem elas, o Portal funciona sem e-mails |
| `CRON_SECRET` | Opcional. Protege a tarefa diária de lembretes (`/api/portal?r=cron`, 8h de Fortaleza) |
| `SITE_URL` | Opcional. Endereço oficial (ex.: `https://ejup.com.br`) usado nos links dos e-mails |
| `PORTAL_GOOGLE` | Opcional. `1` mostra "Continuar com Google" (ligar o provedor Google no Supabase antes) |

## Estrutura

| Caminho | O que é |
|---|---|
| `app.html`, `assets/app.js`, `assets/style.css` | Site: Home, A escola, Formações, Professores, EJUPcast, Coluna Jurídica, In company, Política de Privacidade. Rotas reais (`/escola`, `/formacao/licenciamento`…). |
| `minerva/` | Página `/minerva`; `abertura.webp` e `fechamento.webp` (movimento da esfera, tocam uma vez), `repouso.jpg` e `aberta.jpg` (estados parados) |
| `api/minerva.js`, `api/_lib/busca.js` | Minerva sem IA: busca a pergunta cadastrada mais parecida e devolve a resposta (20 req/min por IP) |
| `api/_lib/respostas.js` | Respostas iniciais da Minerva; reserva quando o Supabase não estiver configurado |
| `api/lead.js` | Grava newsletter e pedidos in company no Supabase (5 envios/min por IP) |
| `assets/portal.js` | Entrar, criar conta, recuperar senha, Portal do Aluno, Área do Professor e `/certificado/CÓDIGO`. Carregado só quando alguém abre essas páginas |
| `api/portal.js`, `api/_lib/portal.js` | API do Portal em uma função (`/api/portal?r=…`), sessão em cookie HttpOnly |
| `dev/fake-supabase.mjs` | Supabase em memória para os testes e para `npm run dev:portal` |
| `img/`, `vid/`, `fonts/` | Imagens, vídeos e Gotham (woff2) |
| `assets/padrao.js` | Textos padrão do site (formações, professores, artigos, episódios, perguntas, links) e títulos/descrições das páginas |
| `api/pagina.js`, `api/_lib/seo.js` | Entrega cada página com título, descrição, imagem de prévia (WhatsApp, LinkedIn) e dados estruturados (Google); gera `/sitemap.xml` e `/robots.txt` |
| `vercel.json` | Rotas do site, `/minerva`, microfone, cache |

**Conteúdo do site** (formações e suas páginas, professores, artigos da Coluna, episódios do
EJUPcast, perguntas frequentes e links) é editado na **Área da Equipe → Site** e fica na tabela
`site_itens`. Na primeira vez, clique em "Trazer o conteúdo atual para o banco". Sem banco ou sem
itens, o site usa os textos de `assets/app.js` (`F`, `PROF`, `E`, `AR`, `FAQ`, `LINKS`). Edições
aparecem em até 1 minuto (cache da Vercel). Detalhes: link de pagamento vazio = "Adquirir agora"
abre o WhatsApp; YouTube/Spotify vazios escondem os botões; `yt` do episódio é o código do vídeo;
no texto do artigo, linha em branco separa parágrafos e "## " cria subtítulo e item do índice.

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

## Portal do Aluno e Área do Professor

### Ligar
1. No Supabase, **SQL Editor**: rode `dev/supabase_setup.sql` (se ainda não rodou) e depois
   `dev/supabase_portal.sql`. Ele cria as tabelas do Portal, a formação Licenciamento com os 4 módulos
   e 14 aulas (títulos e durações provisórios) e a formação Pareceres.
2. **Authentication → URL Configuration**: *Site URL* = endereço do site (hoje
   `https://ejup-site.vercel.app`); em *Redirect URLs* acrescente `https://ejup-site.vercel.app/**`
   (e o domínio próprio quando existir).
3. **Authentication → Emails → SMTP Settings**: ligue um SMTP próprio (Resend, Gmail Workspace…).
   O SMTP padrão do Supabase só envia para e-mails da equipe do projeto e com limite por hora:
   sem SMTP próprio, alunos não recebem a confirmação de cadastro nem o link de nova senha.
4. Opcional: `RESEND_API_KEY` e `EMAIL_FROM` na Vercel para os avisos do Portal, e `CRON_SECRET`
   para os lembretes diários.

### Área da Equipe (`/equipe`)
Libera alunos (vários e-mails de uma vez), troca plano, suspende acesso, cria e edita formações, módulos,
aulas (vídeo, materiais, tópicos) e as respostas da Minerva, sem abrir o Supabase. Para ganhar acesso:
crie a sua conta no site e, uma única vez, no Supabase **Table Editor → `perfis`**, mude o seu `papel` para
`equipe`. Quem é equipe também vê a Área do Professor de todas as formações.

### Operar pelo Table Editor do Supabase (alternativa)
- **Liberar um aluno:** em `matriculas`, nova linha com `email` (o da inscrição), `curso_id`
  (`licenciamento`, `pareceres`…) e `plano` (`essencial`, `acompanhado` ou `mentoria`). Pode ser antes de
  o aluno criar a conta. `ativa = false` suspende o acesso.
- **Professor:** crie o usuário em **Authentication → Users → Add user** (com senha e *Auto Confirm*) e
  ponha o e-mail dele em `cursos.professor_emails` da formação. `perfis.papel = equipe` vê todas as formações.
- **Aulas:** em `aulas`, preencha `titulo`, `duracao_min`, `sobre`, `topicos` e `video`. O vídeo aceita
  link do YouTube, Vimeo ou Panda Video, arquivo `.mp4`, ou o caminho de um arquivo enviado ao bucket
  privado `aulas` do Storage. `materiais` é uma lista `[{"nome":"Slides","url":"…","tipo":"PDF"}]`; a
  `url` pode ser um link ou um caminho no bucket privado `materiais` (o Portal gera um link temporário).
  `publicada = false` esconde a aula.
- **Minerva por formação:** em `minerva_respostas`, `curso_id` liga a resposta a uma formação e
  `fonte_aula` + `fonte_segundo` mostram "Rever em 11:50". `portal = true` tira a resposta do hotsite.
  Professores ensinam respostas pela Área do Professor (aparecem com `origem = professor`).
- **Certificado:** sai sozinho quando o aluno conclui a última aula (`matriculas.certificado`). A
  conferência pública fica em `/certificado/EJUP-XXXX-XXXX`; o PDF sai pela impressão do navegador.

Planos (Essencial, Acompanhado, Mentoria), prazos de resposta (2 dias úteis; 1 no Mentoria) e o limite
de 2 mentorias seguem a proposta do protótipo. Mudança de plano é pedida à equipe pelo WhatsApp.

## Rodar localmente

```bash
npm install
npm test            # testes dos endpoints
npm run dev         # http://localhost:3000 (a Minerva responde com o banco local)
npm run dev:portal  # idem, com o Portal ligado a um Supabase em memória:
                    # aluno@ejup.com.br / senha-aluno-1 · professor@ejup.com.br / senha-prof-1
                    # equipe@ejup.com.br / senha-equipe-1
```
