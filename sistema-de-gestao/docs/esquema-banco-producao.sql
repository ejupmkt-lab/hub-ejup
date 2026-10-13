-- HUB Pivotto — esquema inicial
-- Isolamento por empresa via Row Level Security: cada linha pertence a uma empresa
-- (direta ou indiretamente) e só membros daquela empresa a enxergam.

create extension if not exists pgcrypto;

-- ─── Tipos ────────────────────────────────────────────────────────────────

create type empresa_status as enum ('ativo', 'em_estruturacao', 'standby');
create type papel_membro as enum ('gestor', 'consultor', 'equipe');
create type projeto_status as enum ('aguardando_plano', 'em_andamento', 'encerrado');
create type etapa_status as enum (
  'nao_iniciada', 'em_levantamento', 'em_redacao', 'em_revisao',
  'aguardando_assinaturas', 'a_enviar', 'enviada', 'aprovada', 'devolvida'
);
create type atividade_status as enum ('pendente', 'feito', 'nao_aplicavel');

-- ─── Empresas e pessoas ───────────────────────────────────────────────────

create table empresas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  status empresa_status not null default 'ativo',
  descricao text,
  socios text,
  created_at timestamptz not null default now()
);

create table perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  admin_grupo boolean not null default false,
  created_at timestamptz not null default now()
);

create table membros (
  empresa_id uuid not null references empresas (id) on delete cascade,
  user_id uuid not null references perfis (id) on delete cascade,
  papel papel_membro not null,
  primary key (empresa_id, user_id)
);

-- ─── Clientes ─────────────────────────────────────────────────────────────

create table clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas (id) on delete restrict,
  razao_social text not null,
  nome_fantasia text,
  cnpj text,
  endereco text,
  cep text,
  cidade_uf text,
  email text,
  telefone text,
  site text,
  responsavel text,
  cargo_responsavel text,
  porte text,
  tempo_atividade text,
  ramo text,
  produtos_servicos text,
  empregados_gestao integer,
  empregados_operacionais integer,
  created_at timestamptz not null default now()
);
create index on clientes (empresa_id);

-- ─── Projetos (instância de um modelo de fluxo) ───────────────────────────

create table projetos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas (id) on delete restrict,
  cliente_id uuid not null references clientes (id) on delete restrict,
  modelo_id text not null,
  modelo_versao integer not null,
  consultor_id uuid references perfis (id),
  status projeto_status not null default 'aguardando_plano',
  -- Dados que alimentam a ficha de identificação dos relatórios
  prestadora_vinculada text not null default 'FUNCERN',
  numero_projeto_hub text,
  codigo_solicitacao_hub text,
  gestor_sebrae text,
  ficha_tecnica text,
  codigo_ficha_tecnica text,
  segmento text,
  area_atuacao text,
  local_assinatura text not null default 'Natal/RN',
  plano_fechado_em timestamptz,
  created_at timestamptz not null default now()
);
create index on projetos (empresa_id);

create table etapas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id) on delete cascade,
  ordem integer not null,
  nome text not null,
  descricao text not null,
  horas_previstas integer not null,
  duracao_referencia_dias integer not null,
  data_inicio date,
  data_fim date,
  -- Datas fechadas no plano de trabalho (base para comparar alterações)
  data_inicio_plano date,
  data_fim_plano date,
  status etapa_status not null default 'nao_iniciada',
  unique (projeto_id, ordem)
);

create table atividades (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references etapas (id) on delete cascade,
  ordem integer not null,
  codigo text not null,
  texto text not null,
  nivel integer not null default 1,
  status atividade_status not null default 'pendente',
  justificativa text
);
create index on atividades (etapa_id);

create table entregaveis (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references etapas (id) on delete cascade,
  ordem integer not null,
  tipo text not null default 'entregavel', -- 'entregavel' | 'instrumento'
  titulo text not null,
  conteudo text not null default '',
  unique (etapa_id, ordem)
);

-- Seções do relatório da etapa (objeto, escopo, atividades realizadas, conclusão…)
create table secoes_relatorio (
  etapa_id uuid not null references etapas (id) on delete cascade,
  chave text not null,
  conteudo text not null default '',
  updated_at timestamptz not null default now(),
  primary key (etapa_id, chave)
);

-- Registros do programa que atravessam as etapas (riscos, marcos, RoPA…)
create table registros (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id) on delete cascade,
  tipo text not null,
  codigo text not null,
  dados jsonb not null default '{}'::jsonb,
  etapa_origem integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (projeto_id, tipo, codigo)
);
create index on registros (projeto_id, tipo);

create table referencias (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos (id) on delete cascade,
  texto text not null,
  url text,
  consultado_em date,
  created_at timestamptz not null default now()
);

create table historico (
  id bigint generated always as identity primary key,
  projeto_id uuid not null references projetos (id) on delete cascade,
  etapa_id uuid references etapas (id) on delete cascade,
  user_id uuid references perfis (id),
  acao text not null,
  detalhe jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on historico (projeto_id, created_at desc);

-- ─── Funções de acesso ────────────────────────────────────────────────────

create or replace function public.eh_admin_grupo()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select admin_grupo from perfis where id = auth.uid()), false)
$$;

-- Membro de uma empresa ativa (ou admin do grupo, que vê tudo)
create or replace function public.acessa_empresa(e uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.eh_admin_grupo() or exists (
    select 1 from membros m join empresas em on em.id = m.empresa_id
    where m.empresa_id = e and m.user_id = auth.uid() and em.status = 'ativo'
  )
$$;

create or replace function public.empresa_do_projeto(p uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select empresa_id from projetos where id = p
$$;

create or replace function public.empresa_da_etapa(et uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select pr.empresa_id from etapas e join projetos pr on pr.id = e.projeto_id where e.id = et
$$;

-- ─── RLS ──────────────────────────────────────────────────────────────────

alter table empresas enable row level security;
alter table perfis enable row level security;
alter table membros enable row level security;
alter table clientes enable row level security;
alter table projetos enable row level security;
alter table etapas enable row level security;
alter table atividades enable row level security;
alter table entregaveis enable row level security;
alter table secoes_relatorio enable row level security;
alter table registros enable row level security;
alter table referencias enable row level security;
alter table historico enable row level security;

-- Empresas: o admin vê todas (inclusive inativas); membros veem as suas ativas.
create policy empresas_select on empresas for select
  using (public.acessa_empresa(id));

-- Perfis: cada um vê o próprio e os colegas das empresas que acessa.
create policy perfis_select on perfis for select using (
  id = auth.uid() or public.eh_admin_grupo() or exists (
    select 1 from membros m where m.user_id = perfis.id and public.acessa_empresa(m.empresa_id)
  )
);

create policy membros_select on membros for select using (public.acessa_empresa(empresa_id));
create policy membros_admin on membros for all
  using (public.eh_admin_grupo()) with check (public.eh_admin_grupo());

create policy clientes_all on clientes for all
  using (public.acessa_empresa(empresa_id)) with check (public.acessa_empresa(empresa_id));

create policy projetos_all on projetos for all
  using (public.acessa_empresa(empresa_id)) with check (public.acessa_empresa(empresa_id));

create policy etapas_all on etapas for all
  using (public.acessa_empresa(public.empresa_do_projeto(projeto_id)))
  with check (public.acessa_empresa(public.empresa_do_projeto(projeto_id)));

create policy registros_all on registros for all
  using (public.acessa_empresa(public.empresa_do_projeto(projeto_id)))
  with check (public.acessa_empresa(public.empresa_do_projeto(projeto_id)));

create policy referencias_all on referencias for all
  using (public.acessa_empresa(public.empresa_do_projeto(projeto_id)))
  with check (public.acessa_empresa(public.empresa_do_projeto(projeto_id)));

create policy historico_select on historico for select
  using (public.acessa_empresa(public.empresa_do_projeto(projeto_id)));
create policy historico_insert on historico for insert
  with check (public.acessa_empresa(public.empresa_do_projeto(projeto_id)) and user_id = auth.uid());

create policy atividades_all on atividades for all
  using (public.acessa_empresa(public.empresa_da_etapa(etapa_id)))
  with check (public.acessa_empresa(public.empresa_da_etapa(etapa_id)));

create policy entregaveis_all on entregaveis for all
  using (public.acessa_empresa(public.empresa_da_etapa(etapa_id)))
  with check (public.acessa_empresa(public.empresa_da_etapa(etapa_id)));

create policy secoes_all on secoes_relatorio for all
  using (public.acessa_empresa(public.empresa_da_etapa(etapa_id)))
  with check (public.acessa_empresa(public.empresa_da_etapa(etapa_id)));

-- ─── Empresas do grupo ────────────────────────────────────────────────────

insert into empresas (slug, nome, status, descricao, socios) values
  ('pivotto', 'Pivotto & Pivotto', 'ativo',
   'Escritório de advocacia. Consultoria de Adequação à LGPD via HUB SEBRAE.',
   'Roberto e Leonardo'),
  ('orb', 'ORB', 'em_estruturacao',
   'Funcionamento próprio, a ser estruturado depois do MVP.',
   'Roberto e terceiro sócio'),
  ('ejup', 'EJUP', 'standby',
   'Escola Jurídica para Profissionais. Trabalha por curso; módulo em standby.',
   'Roberto');

-- ─── Criação de projeto a partir de um modelo (transação única) ───────────
-- p: { empresa_id, cliente_id, modelo_id, modelo_versao, consultor_id, campos…,
--      etapas: [{ ordem, nome, descricao, horas_previstas, duracao_referencia_dias,
--                 atividades: [{codigo, texto, nivel}], entregaveis: [{titulo, tipo}] }] }
create or replace function public.criar_projeto(p jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  novo uuid;
  et jsonb;
  et_id uuid;
  item jsonb;
  i integer;
begin
  insert into projetos (
    empresa_id, cliente_id, modelo_id, modelo_versao, consultor_id,
    numero_projeto_hub, codigo_solicitacao_hub, gestor_sebrae, ficha_tecnica,
    codigo_ficha_tecnica, segmento, area_atuacao, prestadora_vinculada
  ) values (
    (p->>'empresa_id')::uuid, (p->>'cliente_id')::uuid, p->>'modelo_id',
    (p->>'modelo_versao')::int, nullif(p->>'consultor_id', '')::uuid,
    p->>'numero_projeto_hub', p->>'codigo_solicitacao_hub', p->>'gestor_sebrae',
    p->>'ficha_tecnica', p->>'codigo_ficha_tecnica', p->>'segmento', p->>'area_atuacao',
    coalesce(nullif(p->>'prestadora_vinculada', ''), 'FUNCERN')
  ) returning id into novo;

  for et in select * from jsonb_array_elements(p->'etapas') loop
    insert into etapas (projeto_id, ordem, nome, descricao, horas_previstas, duracao_referencia_dias)
    values (novo, (et->>'ordem')::int, et->>'nome', et->>'descricao',
            (et->>'horas_previstas')::int, (et->>'duracao_referencia_dias')::int)
    returning id into et_id;

    i := 0;
    for item in select * from jsonb_array_elements(et->'atividades') loop
      i := i + 1;
      insert into atividades (etapa_id, ordem, codigo, texto, nivel)
      values (et_id, i, item->>'codigo', item->>'texto', (item->>'nivel')::int);
    end loop;

    i := 0;
    for item in select * from jsonb_array_elements(et->'entregaveis') loop
      i := i + 1;
      insert into entregaveis (etapa_id, ordem, titulo, tipo)
      values (et_id, i, item->>'titulo', item->>'tipo');
    end loop;
  end loop;

  insert into historico (projeto_id, user_id, acao) values (novo, auth.uid(), 'projeto_criado');
  return novo;
end
$$;
