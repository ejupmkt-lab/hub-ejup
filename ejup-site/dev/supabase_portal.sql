-- EJUP · Portal do Aluno e Área do Professor
-- Rode no Supabase (SQL Editor → New query → Run) DEPOIS de supabase_setup.sql.
-- Pode rodar de novo sem perder dados: só cria o que falta.
-- Todas as tabelas ficam com RLS ligado e sem políticas: só o servidor do site (chave secreta) lê e grava.

-- ---------- pessoas ----------
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nome text not null default '',
  papel text not null default 'aluno' check (papel in ('aluno', 'professor', 'equipe')),
  tel text,
  area text,
  oab text,
  nome_certificado text,
  areas text,
  bio text,
  prefs jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists perfis_email_idx on public.perfis (email);

-- todo usuário novo do Supabase Auth ganha um perfil (inclusive professores criados pelo painel)
create or replace function public.ejup_novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, email, nome)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'nome', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists ejup_novo_usuario on auth.users;
create trigger ejup_novo_usuario after insert on auth.users
  for each row execute function public.ejup_novo_usuario();
insert into public.perfis (id, email, nome)
  select id, lower(email), coalesce(raw_user_meta_data->>'nome', '') from auth.users
  on conflict (id) do nothing;

-- ---------- conteúdo ----------
create table if not exists public.cursos (
  id text primary key,                         -- igual ao endereço da formação no site (licenciamento, pareceres…)
  titulo text not null,
  area text,
  horas numeric not null default 0,
  descricao text,
  capa text,                                   -- imagem do site, ex.: /img/curso1.jpg
  professores text,                            -- nomes como aparecem para o aluno
  professor_emails text[] not null default '{}', -- e-mails de quem entra na Área do Professor desta formação
  ativo boolean not null default true,
  ordem int not null default 0
);

create table if not exists public.modulos (
  id text primary key,
  curso_id text not null references public.cursos(id) on delete cascade,
  ordem int not null default 0,
  titulo text not null
);

create table if not exists public.aulas (
  id text primary key,
  modulo_id text not null references public.modulos(id) on delete cascade,
  ordem int not null default 0,
  titulo text not null,
  duracao_min int not null default 0,
  video text,             -- link do YouTube, Vimeo, Panda ou arquivo; ou caminho no Storage (bucket "aulas")
  sobre text,             -- resumo mostrado na aba "Sobre a aula"
  topicos text[] not null default '{}',
  materiais jsonb not null default '[]'::jsonb,  -- [{"nome":"Slides","url":"https://… ou caminho no bucket materiais","tipo":"PDF"}]
  publicada boolean not null default true
);

-- ---------- acesso ----------
-- A equipe libera o aluno adicionando uma linha aqui com o e-mail dele (pode ser antes de ele criar a conta).
create table if not exists public.matriculas (
  id bigserial primary key,
  email text not null,
  curso_id text not null references public.cursos(id) on delete cascade,
  plano text not null default 'essencial' check (plano in ('essencial', 'acompanhado', 'mentoria')),
  ativa boolean not null default true,
  concluida_em timestamptz,
  certificado text unique,
  criado_em timestamptz not null default now(),
  unique (email, curso_id)
);
create or replace function public.ejup_email_minusculo() returns trigger language plpgsql as $$
begin new.email := lower(trim(new.email)); return new; end $$;
drop trigger if exists ejup_email_minusculo on public.matriculas;
create trigger ejup_email_minusculo before insert or update on public.matriculas
  for each row execute function public.ejup_email_minusculo();

-- ---------- estudo ----------
create table if not exists public.progresso (
  user_id uuid not null references auth.users(id) on delete cascade,
  aula_id text not null references public.aulas(id) on delete cascade,
  concluida boolean not null default false,
  segundo int not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, aula_id)
);

create table if not exists public.notas (
  user_id uuid not null references auth.users(id) on delete cascade,
  aula_id text not null references public.aulas(id) on delete cascade,
  texto text not null default '',
  segundo int not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, aula_id)
);

-- ---------- suporte ----------
create table if not exists public.plantoes (
  id bigserial primary key,
  curso_id text not null references public.cursos(id) on delete cascade,
  inicio timestamptz not null,
  duracao_min int not null default 60,
  link text,
  gravacao text,
  criado_em timestamptz not null default now()
);

create table if not exists public.duvidas (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  curso_id text not null references public.cursos(id) on delete cascade,
  aula_id text references public.aulas(id) on delete set null,
  segundo int,
  titulo text not null,
  status text not null default 'professor' check (status in ('professor', 'respondida', 'encerrada', 'plantao')),
  via_minerva boolean not null default false,
  plantao_id bigint references public.plantoes(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists duvidas_curso_idx on public.duvidas (curso_id, status);

create table if not exists public.mensagens (
  id bigserial primary key,
  duvida_id bigint not null references public.duvidas(id) on delete cascade,
  autor_id uuid references auth.users(id) on delete set null,
  papel text not null check (papel in ('aluno', 'professor')),
  texto text not null,
  criado_em timestamptz not null default now()
);
create index if not exists mensagens_duvida_idx on public.mensagens (duvida_id);

create table if not exists public.mentorias (
  id bigserial primary key,
  curso_id text not null references public.cursos(id) on delete cascade,
  aluno_id uuid not null references auth.users(id) on delete cascade,
  inicio timestamptz not null,
  status text not null default 'pedido' check (status in ('pedido', 'proposto', 'confirmado', 'realizado', 'cancelado')),
  link text,
  criado_em timestamptz not null default now()
);

-- ---------- Minerva no Portal ----------
-- Respostas por formação: curso_id vazio vale para todas; fonte_aula/fonte_segundo mostram "Rever em 11:50".
alter table public.minerva_respostas add column if not exists curso_id text references public.cursos(id) on delete cascade;
alter table public.minerva_respostas add column if not exists fonte_aula text references public.aulas(id) on delete set null;
alter table public.minerva_respostas add column if not exists fonte_segundo int;
alter table public.minerva_respostas add column if not exists origem text not null default 'equipe';
alter table public.minerva_respostas add column if not exists portal boolean not null default false; -- true: só no Portal, fora do hotsite

create table if not exists public.minerva_log (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  curso_id text references public.cursos(id) on delete cascade,
  pergunta text not null,
  resposta_id text,
  ajudou boolean,
  revisado boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists minerva_log_curso_idx on public.minerva_log (curso_id, criado_em desc);

alter table public.perfis enable row level security;
alter table public.cursos enable row level security;
alter table public.modulos enable row level security;
alter table public.aulas enable row level security;
alter table public.matriculas enable row level security;
alter table public.progresso enable row level security;
alter table public.notas enable row level security;
alter table public.plantoes enable row level security;
alter table public.duvidas enable row level security;
alter table public.mensagens enable row level security;
alter table public.mentorias enable row level security;
alter table public.minerva_log enable row level security;

-- ---------- arquivos privados (vídeos e materiais enviados ao Supabase) ----------
insert into storage.buckets (id, name, public) values ('aulas', 'aulas', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('materiais', 'materiais', false) on conflict (id) do nothing;

-- ---------- formações ----------
insert into public.cursos (id, titulo, area, horas, descricao, capa, professores, ordem) values
  ('licenciamento', 'Marco Legal do Licenciamento Ambiental', 'Direito Ambiental', 10,
   'Análise prática, técnica e aprofundada da Lei Geral do Licenciamento Ambiental (Lei 15.190/2025).',
   '/img/curso1.jpg', 'Leonardo Pivotto e Maria Helena Cortez', 1),
  ('pareceres', 'Formação em Pareceres Técnicos Ambientais', 'Direito Ambiental', 8,
   'Da estrutura à argumentação: como produzir pareceres robustos e defensáveis.',
   '/img/curso2.jpg', 'Leonardo Pivotto', 2)
on conflict (id) do nothing;

insert into public.modulos (id, curso_id, ordem, titulo) values
  ('lic-m1', 'licenciamento', 1, 'Introdução e Princípios Fundamentais'),
  ('lic-m2', 'licenciamento', 2, 'As Modalidades de Licenciamento'),
  ('lic-m3', 'licenciamento', 3, 'Isenções e Dispensas de Licenciamento'),
  ('lic-m4', 'licenciamento', 4, 'Temas Transversais e Procedimentais')
on conflict (id) do nothing;

-- Títulos e durações provisórios: troque pelos reais e preencha "video" quando as aulas estiverem hospedadas.
insert into public.aulas (id, modulo_id, ordem, titulo, duracao_min) values
  ('lic-m1-a1', 'lic-m1', 1, 'Aula 1', 42),
  ('lic-m1-a2', 'lic-m1', 2, 'Aula 2', 42),
  ('lic-m1-a3', 'lic-m1', 3, 'Aula 3', 42),
  ('lic-m1-a4', 'lic-m1', 4, 'Aula 4', 42),
  ('lic-m2-a1', 'lic-m2', 1, 'Aula 1', 42),
  ('lic-m2-a2', 'lic-m2', 2, 'Aula 2', 42),
  ('lic-m2-a3', 'lic-m2', 3, 'As modalidades de licenciamento na prática', 40),
  ('lic-m2-a4', 'lic-m2', 4, 'Aula 4', 35),
  ('lic-m3-a1', 'lic-m3', 1, 'Aula 1', 45),
  ('lic-m3-a2', 'lic-m3', 2, 'Aula 2', 40),
  ('lic-m3-a3', 'lic-m3', 3, 'Aula 3', 38),
  ('lic-m4-a1', 'lic-m4', 1, 'Aula 1', 50),
  ('lic-m4-a2', 'lic-m4', 2, 'Aula 2', 45),
  ('lic-m4-a3', 'lic-m4', 3, 'Aula 3', 55)
on conflict (id) do nothing;

-- ---------- respostas da Minerva sobre o próprio Portal (valem para todas as formações) ----------
insert into public.minerva_respostas (id, pergunta, variacoes, palavras, resposta, ordem, curso_id, origem, portal) values
  ('portal-certificado', 'Quando recebo o certificado?',
   array['como pego meu certificado', 'onde fica o certificado', 'certificado de conclusão'],
   array['certificado', 'conclusão'],
   'O certificado é liberado quando você marca como concluída a última aula da formação. Ele aparece em Certificados, com um código para conferência e a opção de baixar em PDF.', 100, null, 'equipe', true),
  ('portal-plano', 'Como funciona o plano de estudo?',
   array['como mudar meu plano de estudo', 'quantas horas por semana', 'reorganizar plano'],
   array['plano', 'semana', 'horas'],
   'Você escolhe quanto tempo tem por semana e em quais dias estuda. O portal distribui as aulas pendentes por semana e refaz a distribuição sempre que você muda o tempo ou atrasa.', 101, null, 'equipe', true),
  ('portal-professor', 'Como mando uma dúvida ao professor?',
   array['falar com o professor', 'perguntar ao professor', 'enviar dúvida'],
   array['professor', 'dúvida'],
   'Em Suporte, clique em Nova dúvida. A aula e o minuto em que você está seguem anexados. A dúvida ao professor faz parte dos planos Acompanhado e Mentoria.', 102, null, 'equipe', true),
  ('portal-plantao', 'O que é o plantão ao vivo?',
   array['quando é o plantão', 'encontro ao vivo', 'plantão gravado'],
   array['plantão', 'vivo'],
   'É um encontro on-line em grupo com o professor para as dúvidas da turma. A data aparece no início do portal e o encontro fica gravado. Faz parte dos planos Acompanhado e Mentoria.', 103, null, 'equipe', true),
  ('portal-mentoria', 'Como marco a mentoria individual?',
   array['agendar mentoria', 'encontro individual com o professor'],
   array['mentoria', 'individual', 'agendar'],
   'No plano Mentoria, abra Suporte e escolha Mentoria individual. Você vê os horários livres do professor e pede um. O professor confirma ou propõe outro horário.', 104, null, 'equipe', true),
  ('portal-acesso', 'Não estou vendo minha formação no portal',
   array['comprei e não aparece', 'minha formação não aparece', 'sem acesso ao curso'],
   array['acesso', 'aparece', 'comprei'],
   'O acesso é liberado pela equipe da EJUP no e-mail usado na inscrição. Se a formação não aparece, confira se entrou com esse e-mail ou fale com a equipe pelo WhatsApp 85 9 9271.4050.', 105, null, 'equipe', true)
on conflict (id) do nothing;

-- ---------- conteúdo do site (vitrine), editado na Área da Equipe ----------
-- tipo: formacao, professor, artigo, episodio, faq ou config. Sem linhas, o site usa os textos que vêm no código.
create table if not exists public.site_itens (
  tipo text not null check (tipo in ('formacao', 'professor', 'artigo', 'episodio', 'faq', 'config')),
  id text not null,
  dados jsonb not null default '{}'::jsonb,
  ordem int not null default 0,
  publicado boolean not null default true,
  atualizado_em timestamptz not null default now(),
  primary key (tipo, id)
);
alter table public.site_itens enable row level security;

-- ---------- aceite dos Termos de Uso (vem do cadastro) ----------
alter table public.perfis add column if not exists termos_versao text;
alter table public.perfis add column if not exists termos_em timestamptz;
create or replace function public.ejup_novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, email, nome, termos_versao, termos_em)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'nome', ''),
          new.raw_user_meta_data->>'termos_versao', (new.raw_user_meta_data->>'termos_em')::timestamptz)
  on conflict (id) do nothing;
  return new;
end $$;
