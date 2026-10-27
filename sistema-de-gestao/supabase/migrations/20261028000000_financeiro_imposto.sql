-- Imposto por empresa (a alíquota do Simples sobe conforme o faturamento dos últimos 12 meses) e datas de
-- recebimento ajustadas à mão por projeto. Mesma proteção do restante do financeiro: só quem vê o financeiro lê ou altera.

create table public.financeiro_empresas (
  empresa text primary key references public.empresas (slug) on delete cascade,
  faturamento_12m numeric(14, 2) not null default 0 check (faturamento_12m >= 0),
  aliquota_fixa numeric(5, 2) check (aliquota_fixa between 0 and 100), -- vazio: calcula pela faixa do Simples
  mudancas jsonb not null default '[]'::jsonb, -- [{"desde": "2026-12", "aliquota": 11.2}]
  updated_at timestamptz not null default now()
);

alter table public.financeiro_empresas enable row level security;
revoke all on public.financeiro_empresas from anon;
create policy financeiro_empresas_tudo on public.financeiro_empresas for all to authenticated
  using (privado.ve_financeiro() and privado.acessa_empresa(empresa))
  with check (privado.ve_financeiro() and privado.acessa_empresa(empresa));

-- {"30": "2026-11-05", "70": "2026-12-05"}: a data que a pessoa combinou, no lugar da estimada pelo plano
alter table public.financeiro_projetos add column previsoes jsonb not null default '{}'::jsonb;
