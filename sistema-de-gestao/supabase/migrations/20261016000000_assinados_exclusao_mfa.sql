-- 1. PDF assinado de cada entrega guardado no mesmo bucket das evidências,
--    no caminho "<empresa>/<projeto>/<etapa>/assinado-<id>.pdf".
-- 2. Exclusão de clientes e projetos, só para gestores da empresa (ou admin).
-- 3. Verificação em duas etapas: quem ativou o código do aplicativo só
--    enxerga os dados depois de informá-lo nesta sessão (aal2).

update storage.buckets
   set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
       file_size_limit = 20971520
 where id = 'evidencias';

-- Sessão confirmada com o segundo fator, ou usuário sem segundo fator ativo
create or replace function privado.sessao_verificada()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors f where f.user_id = (select auth.uid()) and f.status = 'verified'
      )
$$;

create or replace function privado.eh_admin_grupo()
returns boolean language sql stable security definer set search_path = '' as $$
  select privado.sessao_verificada()
     and coalesce((select admin_grupo from public.perfis where id = (select auth.uid())), false)
$$;

create or replace function privado.acessa_empresa(e text)
returns boolean language sql stable security definer set search_path = '' as $$
  select privado.eh_admin_grupo() or (privado.sessao_verificada() and exists (
    select 1 from public.membros m join public.empresas em on em.slug = m.empresa
    where m.empresa = e and m.user_id = (select auth.uid()) and em.status = 'ativo'
  ))
$$;

create or replace function privado.gerencia_empresa(e text)
returns boolean language sql stable security definer set search_path = '' as $$
  select privado.eh_admin_grupo() or (privado.sessao_verificada() and exists (
    select 1 from public.membros m join public.empresas em on em.slug = m.empresa
    where m.empresa = e and m.user_id = (select auth.uid()) and m.papel = 'gestor' and em.status = 'ativo'
  ))
$$;

revoke execute on function privado.sessao_verificada() from public, anon;
revoke execute on function privado.gerencia_empresa(text) from public, anon;
grant execute on function privado.sessao_verificada() to authenticated;
grant execute on function privado.gerencia_empresa(text) to authenticated;

create policy clientes_delete on public.clientes for delete to authenticated
  using (privado.gerencia_empresa(empresa));
create policy projetos_delete on public.projetos for delete to authenticated
  using (privado.gerencia_empresa(empresa));
