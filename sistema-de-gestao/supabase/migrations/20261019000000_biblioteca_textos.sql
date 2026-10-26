-- Biblioteca de textos aprovados: seções e entregáveis de relatórios que o
-- SEBRAE aprovou, anonimizados, para reaproveitar em projetos parecidos.
-- Marcadores no texto ({{empresa}}, {{responsavel}}…) são trocados pelos
-- dados do novo cliente na hora de usar.

create table public.biblioteca_textos (
  id uuid primary key default gen_random_uuid(),
  empresa text not null references public.empresas (slug),
  etapa integer not null check (etapa between 1 and 20),
  chave text not null, -- seção ("escopo") ou entregável ("entregavel:<título>")
  titulo text not null default '',
  texto text not null,
  ramo text not null default '',
  porte text not null default '',
  origem text not null default 'aprovado', -- aprovado | manual
  projeto_origem text, -- projeto de onde veio (nulo se colado à mão)
  criado_por uuid references public.perfis (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (projeto_origem, etapa, chave)
);
create index biblioteca_textos_busca_idx on public.biblioteca_textos (empresa, etapa, chave);

alter table public.biblioteca_textos enable row level security;

create policy biblioteca_select on public.biblioteca_textos for select to authenticated
  using (privado.acessa_empresa(empresa));
create policy biblioteca_insert on public.biblioteca_textos for insert to authenticated
  with check (privado.acessa_empresa(empresa));
create policy biblioteca_update on public.biblioteca_textos for update to authenticated
  using (privado.acessa_empresa(empresa)) with check (privado.acessa_empresa(empresa));
create policy biblioteca_delete on public.biblioteca_textos for delete to authenticated
  using (privado.gerencia_empresa(empresa));
