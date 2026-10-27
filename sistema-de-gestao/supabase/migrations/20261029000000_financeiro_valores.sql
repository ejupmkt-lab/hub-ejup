-- Valor de cada parcela ajustado à mão (o que o SEBRAE realmente pagou ou vai pagar), no lugar do calculado:
-- {"30": 8091.90}
alter table public.financeiro_projetos add column valores jsonb not null default '{}'::jsonb;
