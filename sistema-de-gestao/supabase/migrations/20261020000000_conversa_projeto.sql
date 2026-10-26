-- Conversa de cada projeto: o consultor manda texto, ditado, fotos e PDFs; a
-- IA responde e organiza o projeto (marca o checklist, escreve seções do
-- relatório, guarda fotos como evidência de uma etapa, registra visitas).
-- O que a IA aplicou fica em `acoes`, com o necessário para desfazer.

create table public.mensagens_projeto (
  id uuid primary key default gen_random_uuid(),
  projeto_id text not null references public.projetos (id) on delete cascade,
  empresa text not null references public.empresas (slug),
  autor uuid references public.perfis (id) on delete set null default auth.uid(),
  autor_nome text not null default '',
  papel text not null check (papel in ('usuario', 'ia')),
  texto text not null default '',
  anexos jsonb not null default '[]'::jsonb, -- [{id, caminho, nome, tipo}]
  acoes jsonb not null default '[]'::jsonb, -- [{descricao}] e, na mensagem da IA, os passos para desfazer
  desfazer jsonb not null default '[]'::jsonb,
  desfeita boolean not null default false,
  created_at timestamptz not null default now()
);
create index mensagens_projeto_idx on public.mensagens_projeto (projeto_id, created_at);

alter table public.mensagens_projeto enable row level security;

create policy mensagens_select on public.mensagens_projeto for select to authenticated
  using (privado.acessa_empresa(empresa));
create policy mensagens_insert on public.mensagens_projeto for insert to authenticated
  with check (privado.acessa_empresa(empresa));
create policy mensagens_update on public.mensagens_projeto for update to authenticated
  using (privado.acessa_empresa(empresa)) with check (privado.acessa_empresa(empresa));
create policy mensagens_delete on public.mensagens_projeto for delete to authenticated
  using (privado.gerencia_empresa(empresa));
