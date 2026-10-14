-- Sistema de Gestão — esquema inicial
--
-- Isolamento por empresa via Row Level Security: cada linha pertence a uma
-- empresa e só os membros dela (ou o administrador do grupo) a enxergam.
--
-- Clientes e projetos guardam o conteúdo como documento (jsonb). O projeto
-- inteiro — etapas, checklist, redação, registros, referências e histórico —
-- é salvo de uma vez, com controle de versão para que duas pessoas não
-- sobrescrevam o trabalho uma da outra.
--
-- Acesso por convite: só quem tem e-mail cadastrado em `convites` ganha perfil
-- e acesso às empresas ao criar a conta.

-- ─── Empresas e pessoas ───────────────────────────────────────────────────

create type public.empresa_status as enum ('ativo', 'em_estruturacao', 'standby');
create type public.papel_membro as enum ('gestor', 'consultor', 'equipe');

create table public.empresas (
  slug text primary key,
  nome text not null,
  status public.empresa_status not null default 'ativo',
  descricao text not null default '',
  socios text not null default '',
  ordem integer not null default 0
);

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  nome text not null,
  nome_completo text not null,
  admin_grupo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.membros (
  empresa text not null references public.empresas (slug) on delete cascade,
  user_id uuid not null references public.perfis (id) on delete cascade,
  papel public.papel_membro not null,
  primary key (empresa, user_id)
);

-- Quem pode criar conta e com quais acessos
create table public.convites (
  email text primary key,
  nome text not null,
  nome_completo text not null,
  admin_grupo boolean not null default false,
  acessos jsonb not null default '{}'::jsonb, -- {"pivotto": "gestor", ...}
  created_at timestamptz not null default now()
);

-- ─── Dados das empresas ───────────────────────────────────────────────────

create table public.clientes (
  id text primary key,
  empresa text not null references public.empresas (slug),
  dados jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clientes_empresa_idx on public.clientes (empresa);

create table public.projetos (
  id text primary key,
  empresa text not null references public.empresas (slug),
  cliente_id text not null references public.clientes (id),
  dados jsonb not null,
  versao integer not null default 1,
  atualizado_por uuid references public.perfis (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projetos_empresa_idx on public.projetos (empresa);
create index projetos_cliente_idx on public.projetos (cliente_id);

-- ─── Funções de acesso ────────────────────────────────────────────────────

create or replace function public.eh_admin_grupo()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select admin_grupo from public.perfis where id = (select auth.uid())), false)
$$;

-- Membro de uma empresa ativa, ou admin do grupo (que vê todas, inclusive inativas)
create or replace function public.acessa_empresa(e text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.eh_admin_grupo() or exists (
    select 1 from public.membros m join public.empresas em on em.slug = m.empresa
    where m.empresa = e and m.user_id = (select auth.uid()) and em.status = 'ativo'
  )
$$;

-- ─── RLS ──────────────────────────────────────────────────────────────────

alter table public.empresas enable row level security;
alter table public.perfis enable row level security;
alter table public.membros enable row level security;
alter table public.convites enable row level security;
alter table public.clientes enable row level security;
alter table public.projetos enable row level security;

create policy empresas_select on public.empresas for select to authenticated
  using (public.acessa_empresa(slug));

create policy perfis_select on public.perfis for select to authenticated using (
  id = (select auth.uid()) or public.eh_admin_grupo() or exists (
    select 1 from public.membros m where m.user_id = perfis.id and public.acessa_empresa(m.empresa)
  )
);

create policy membros_select on public.membros for select to authenticated
  using (public.acessa_empresa(empresa));

create policy convites_admin on public.convites for all to authenticated
  using (public.eh_admin_grupo()) with check (public.eh_admin_grupo());

create policy clientes_select on public.clientes for select to authenticated using (public.acessa_empresa(empresa));
create policy clientes_insert on public.clientes for insert to authenticated with check (public.acessa_empresa(empresa));
create policy clientes_update on public.clientes for update to authenticated
  using (public.acessa_empresa(empresa)) with check (public.acessa_empresa(empresa));

create policy projetos_select on public.projetos for select to authenticated using (public.acessa_empresa(empresa));
create policy projetos_insert on public.projetos for insert to authenticated with check (public.acessa_empresa(empresa));
create policy projetos_update on public.projetos for update to authenticated
  using (public.acessa_empresa(empresa)) with check (public.acessa_empresa(empresa));

-- ─── Salvamento com controle de versão ────────────────────────────────────

-- Salva o projeto se ninguém o alterou desde a última leitura.
-- Retorna a nova versão, ou null se houve conflito (outra pessoa salvou antes).
create or replace function public.salvar_projeto(p_id text, p_dados jsonb, p_versao integer)
returns integer language plpgsql security invoker set search_path = '' as $$
declare
  nova integer;
begin
  update public.projetos
     set dados = p_dados, versao = versao + 1, updated_at = now(), atualizado_por = (select auth.uid())
   where id = p_id and versao = p_versao
  returning versao into nova;
  return nova;
end
$$;

-- ─── Criação de perfil a partir do convite ────────────────────────────────

create or replace function public.criar_perfil_convidado()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  c public.convites%rowtype;
  par record;
begin
  select * into c from public.convites where lower(email) = lower(new.email);
  if not found then
    return new; -- sem convite: conta existe, mas sem acesso a nada
  end if;
  insert into public.perfis (id, email, nome, nome_completo, admin_grupo)
  values (new.id, lower(new.email), c.nome, c.nome_completo, c.admin_grupo)
  on conflict (id) do nothing;
  for par in select key, value from jsonb_each_text(c.acessos) loop
    insert into public.membros (empresa, user_id, papel)
    values (par.key, new.id, par.value::public.papel_membro)
    on conflict do nothing;
  end loop;
  return new;
end
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_convidado();

revoke execute on function public.criar_perfil_convidado() from public, anon, authenticated;

-- ─── Empresas do grupo ────────────────────────────────────────────────────

insert into public.empresas (slug, nome, status, descricao, socios, ordem) values
  ('pivotto', 'Pivotto & Pivotto', 'ativo',
   'Escritório de advocacia. Consultoria de Adequação à LGPD via HUB SEBRAE.',
   'Roberto e Leonardo', 1),
  ('orb', 'ORB', 'em_estruturacao',
   'Funcionamento próprio, diferente das outras empresas. Serviços, etapas e entregas serão levantados quando o módulo for estruturado.',
   'Roberto e terceiro sócio', 2),
  ('ejup', 'EJUP', 'standby',
   'Escola Jurídica para Profissionais. Trabalha por curso; o modelo será desenhado quando o processo estiver estruturado.',
   'Roberto', 3);
