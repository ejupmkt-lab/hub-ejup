-- Uso da IA integrada: cada chamada à IA (conversa, importar do HUB, leitura de relatório e de ficha) grava quantos tokens usou
-- e em qual modelo. O custo é calculado na tela, pelo preço de tabela de cada modelo. Só quem vê o financeiro lê; ninguém grava
-- direto na tabela: a gravação passa pela função, que exige uma conta com perfil (autorizada pelo administrador).

create table public.uso_ia (
  id bigint generated always as identity primary key,
  em timestamptz not null default now(),
  usuario text not null,          -- e-mail de quem pediu
  rota text not null check (rota in ('conversa', 'importar-hub', 'relatorio-hub', 'ficha-servico')),
  modelo text not null,
  entrada integer not null default 0 check (entrada >= 0),
  saida integer not null default 0 check (saida >= 0),
  cache_leitura integer not null default 0 check (cache_leitura >= 0),
  cache_escrita integer not null default 0 check (cache_escrita >= 0),
  projeto_id text,
  empresa text
);
create index uso_ia_em_idx on public.uso_ia (em desc);

alter table public.uso_ia enable row level security;
revoke all on public.uso_ia from anon, authenticated;
grant select on public.uso_ia to authenticated;
create policy uso_ia_financeiro on public.uso_ia for select to authenticated using (privado.ve_financeiro());

create or replace function public.registrar_uso_ia(
  p_rota text, p_modelo text, p_entrada integer, p_saida integer, p_cache_leitura integer, p_cache_escrita integer, p_projeto_id text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text;
  v_empresa text;
begin
  select pf.email into v_email from public.perfis pf where pf.id = (select auth.uid());
  if v_email is null then
    raise exception 'Sem acesso.';
  end if;
  if p_projeto_id is not null then
    select pr.empresa into v_empresa from public.projetos pr where pr.id = p_projeto_id;
  end if;
  insert into public.uso_ia (usuario, rota, modelo, entrada, saida, cache_leitura, cache_escrita, projeto_id, empresa)
  values (v_email, p_rota, left(coalesce(p_modelo, '?'), 80), greatest(0, coalesce(p_entrada, 0)), greatest(0, coalesce(p_saida, 0)),
          greatest(0, coalesce(p_cache_leitura, 0)), greatest(0, coalesce(p_cache_escrita, 0)), p_projeto_id, v_empresa);
end
$$;
revoke execute on function public.registrar_uso_ia(text, text, integer, integer, integer, integer, text) from public, anon;
grant execute on function public.registrar_uso_ia(text, text, integer, integer, integer, integer, text) to authenticated;
