-- Gestores e gestoras do SEBRAE que acompanham os projetos no HUB: uma lista
-- por empresa, para escolher no projeto em vez de digitar o nome a cada vez.

create table public.gestores_sebrae (
  id uuid primary key default gen_random_uuid(),
  empresa text not null references public.empresas (slug),
  nome text not null check (length(trim(nome)) > 0),
  created_at timestamptz not null default now(),
  unique (empresa, nome)
);

alter table public.gestores_sebrae enable row level security;

-- Quem trabalha na empresa vê e inclui; só gestores da empresa removem
create policy gestores_sebrae_select on public.gestores_sebrae for select to authenticated
  using (privado.acessa_empresa(empresa));
create policy gestores_sebrae_insert on public.gestores_sebrae for insert to authenticated
  with check (privado.acessa_empresa(empresa));
create policy gestores_sebrae_delete on public.gestores_sebrae for delete to authenticated
  using (privado.gerencia_empresa(empresa));

-- Quem já foi informado nos projetos entra na lista
insert into public.gestores_sebrae (empresa, nome)
select distinct empresa, trim(dados ->> 'gestorSebrae') from public.projetos
where trim(coalesce(dados ->> 'gestorSebrae', '')) <> ''
on conflict (empresa, nome) do nothing;
