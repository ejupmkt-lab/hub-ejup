-- Custo real da IA, por dia, como o console da Anthropic informa (planilha "Cost" exportada do console). Alimenta a aba
-- "Uso da IA" do Financeiro: o dia que tem custo do console mostra esse valor; o que ainda não tem, o custo estimado pelos tokens
-- que o Blimp registra. Só quem vê o financeiro lê e grava (a tela importa as planilhas novas).

create table public.custo_ia_console (
  dia date not null,              -- usage_date_utc da planilha
  modelo text not null,           -- como o console escreve ("Claude Opus 5.5")
  tipo text not null,             -- input_no_cache, output, input_cache_read, input_cache_write_5m, input_cache_write_1h...
  custo_usd numeric(12, 4) not null check (custo_usd >= 0),
  atualizado_em timestamptz not null default now(),
  primary key (dia, modelo, tipo)
);
alter table public.custo_ia_console enable row level security;
revoke all on public.custo_ia_console from anon;
create policy custo_ia_console_financeiro on public.custo_ia_console for all to authenticated
  using (privado.ve_financeiro()) with check (privado.ve_financeiro());

-- Histórico de 22/10/2026 a 03/11/2026 (planilhas de outubro e de 01/11 a 04/11)
insert into public.custo_ia_console (dia, modelo, tipo, custo_usd) values
  ('2026-10-22', 'Claude Opus 5.5', 'input_no_cache', 0.17),
  ('2026-10-22', 'Claude Opus 5.5', 'output', 0.2),
  ('2026-10-23', 'Claude Opus 5.5', 'input_no_cache', 0.07),
  ('2026-10-23', 'Claude Opus 5.5', 'output', 0.05),
  ('2026-10-24', 'Claude Opus 5.5', 'input_no_cache', 0.22),
  ('2026-10-24', 'Claude Opus 5.5', 'output', 0.34),
  ('2026-10-25', 'Claude Opus 5.5', 'input_no_cache', 0.02),
  ('2026-10-25', 'Claude Opus 5.5', 'output', 0.04),
  ('2026-10-26', 'Claude Opus 5.5', 'input_no_cache', 0.09),
  ('2026-10-26', 'Claude Opus 5.5', 'output', 0.09),
  ('2026-10-27', 'Claude Opus 5.5', 'input_no_cache', 2.35),
  ('2026-10-27', 'Claude Opus 5.5', 'output', 1.65),
  ('2026-10-28', 'Claude Opus 5.5', 'input_no_cache', 1.06),
  ('2026-10-28', 'Claude Opus 5.5', 'output', 1.9),
  ('2026-10-29', 'Claude Opus 5.5', 'input_no_cache', 0.64),
  ('2026-10-29', 'Claude Opus 5.5', 'output', 0.25),
  ('2026-10-30', 'Claude Opus 5.5', 'input_no_cache', 2.53),
  ('2026-10-30', 'Claude Opus 5.5', 'output', 0.56),
  ('2026-11-01', 'Claude Opus 5.5', 'input_no_cache', 0.16),
  ('2026-11-01', 'Claude Opus 5.5', 'output', 0.05),
  ('2026-11-03', 'Claude Opus 5.5', 'input_no_cache', 2.47),
  ('2026-11-03', 'Claude Opus 5.5', 'output', 0.69)
on conflict (dia, modelo, tipo) do nothing;
