-- Funções auxiliares de acesso saem do esquema exposto pela API (public)
-- e passam para um esquema interno, usado só pelas políticas de RLS.

create schema if not exists privado;
grant usage on schema privado to authenticated;

alter function public.eh_admin_grupo() set schema privado;
alter function public.acessa_empresa(text) set schema privado;

-- O corpo de acessa_empresa chamava public.eh_admin_grupo()
create or replace function privado.acessa_empresa(e text)
returns boolean language sql stable security definer set search_path = '' as $$
  select privado.eh_admin_grupo() or exists (
    select 1 from public.membros m join public.empresas em on em.slug = m.empresa
    where m.empresa = e and m.user_id = (select auth.uid()) and em.status = 'ativo'
  )
$$;

revoke execute on function privado.eh_admin_grupo() from public, anon;
revoke execute on function privado.acessa_empresa(text) from public, anon;
grant execute on function privado.eh_admin_grupo() to authenticated;
grant execute on function privado.acessa_empresa(text) to authenticated;

-- salvar_projeto não precisa de acesso anônimo
revoke execute on function public.salvar_projeto(text, jsonb, integer) from public, anon;
grant execute on function public.salvar_projeto(text, jsonb, integer) to authenticated;
