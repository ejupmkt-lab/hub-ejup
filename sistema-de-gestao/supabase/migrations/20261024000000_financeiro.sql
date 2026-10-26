-- Valores e recebimentos: só quem tem a permissão "vê o financeiro" lê ou
-- altera. A permissão é dada por quem já a tem (de início, ninguém: é ligada
-- à mão para o dono do sistema). Os valores ficam fora dos dados do projeto
-- e do serviço, que toda a equipe da empresa lê.

alter table public.perfis add column if not exists ve_financeiro boolean not null default false;

create or replace function privado.ve_financeiro()
returns boolean language sql stable security definer set search_path = '' as $$
  select privado.sessao_verificada()
     and coalesce((select ve_financeiro from public.perfis where id = (select auth.uid())), false)
$$;
revoke execute on function privado.ve_financeiro() from public, anon;
grant execute on function privado.ve_financeiro() to authenticated;

-- Por serviço: teto de contratação, valor da hora e a parte da FUNCERN
create table public.financeiro_servicos (
  servico_id text primary key references public.servicos (id) on delete cascade,
  empresa text not null references public.empresas (slug),
  teto numeric(12, 2) not null default 0 check (teto >= 0),
  valor_hora numeric(10, 2) not null default 90 check (valor_hora > 0),
  perc_funcern numeric(5, 2) not null default 10 check (perc_funcern between 0 and 100),
  updated_at timestamptz not null default now()
);

-- Por projeto: o valor da hora (se diferente do serviço) e as parcelas recebidas
create table public.financeiro_projetos (
  projeto_id text primary key references public.projetos (id) on delete cascade,
  empresa text not null references public.empresas (slug),
  valor_hora numeric(10, 2) check (valor_hora > 0),
  perc_funcern numeric(5, 2) check (perc_funcern between 0 and 100),
  recebidos jsonb not null default '{}'::jsonb, -- {"30": "2026-11-05", "70": "…"}
  updated_at timestamptz not null default now()
);

alter table public.financeiro_servicos enable row level security;
alter table public.financeiro_projetos enable row level security;
revoke all on public.financeiro_servicos, public.financeiro_projetos from anon;

create policy financeiro_servicos_tudo on public.financeiro_servicos for all to authenticated
  using (privado.ve_financeiro() and privado.acessa_empresa(empresa))
  with check (privado.ve_financeiro() and privado.acessa_empresa(empresa));
create policy financeiro_projetos_tudo on public.financeiro_projetos for all to authenticated
  using (privado.ve_financeiro() and privado.acessa_empresa(empresa))
  with check (privado.ve_financeiro() and privado.acessa_empresa(empresa));

-- Liga ou desliga a permissão de alguém; só quem a tem pode dar
create or replace function public.definir_financeiro(p_email text, p_ve boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if not privado.ve_financeiro() then
    raise exception 'Só quem vê o financeiro pode liberar esse acesso.';
  end if;
  select id into v_id from public.perfis where email = lower(trim(p_email));
  if v_id is null then
    raise exception 'Essa pessoa ainda não criou a conta.';
  end if;
  if v_id = (select auth.uid()) and not p_ve then
    raise exception 'Você não pode retirar o seu próprio acesso ao financeiro.';
  end if;
  update public.perfis set ve_financeiro = p_ve where id = v_id;
end
$$;
revoke execute on function public.definir_financeiro(text, boolean) from public, anon;
grant execute on function public.definir_financeiro(text, boolean) to authenticated;
