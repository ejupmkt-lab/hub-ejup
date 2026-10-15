-- Tela de acessos: o administrador do grupo libera, altera e retira acessos
-- pelo sistema. As duas funções conferem se quem chama é administrador e
-- mantêm convite, perfil e membros coerentes entre si.

-- Libera ou altera o acesso de um e-mail. Se a pessoa já criou a conta, o
-- perfil e os acessos valem na hora; se não, valem quando ela criar.
create or replace function public.salvar_acesso(
  p_email text, p_nome text, p_nome_completo text, p_admin boolean, p_acessos jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
  par record;
begin
  if not privado.eh_admin_grupo() then
    raise exception 'Só o administrador do grupo libera acessos.';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'E-mail inválido.';
  end if;
  if trim(coalesce(p_nome, '')) = '' or trim(coalesce(p_nome_completo, '')) = '' then
    raise exception 'Informe o nome e o nome completo.';
  end if;
  if jsonb_typeof(p_acessos) <> 'object' then
    raise exception 'Acessos inválidos.';
  end if;
  if exists (select 1 from jsonb_object_keys(p_acessos) k where k not in (select slug from public.empresas)) then
    raise exception 'Empresa inexistente nos acessos.';
  end if;

  select id into v_user from auth.users where lower(email) = v_email;
  if v_user = (select auth.uid()) and not p_admin then
    raise exception 'Você não pode retirar o seu próprio acesso de administrador.';
  end if;

  insert into public.convites (email, nome, nome_completo, admin_grupo, acessos)
  values (v_email, trim(p_nome), trim(p_nome_completo), p_admin, p_acessos)
  on conflict (email) do update
    set nome = excluded.nome, nome_completo = excluded.nome_completo,
        admin_grupo = excluded.admin_grupo, acessos = excluded.acessos;

  if v_user is not null then
    insert into public.perfis (id, email, nome, nome_completo, admin_grupo)
    values (v_user, v_email, trim(p_nome), trim(p_nome_completo), p_admin)
    on conflict (id) do update
      set nome = excluded.nome, nome_completo = excluded.nome_completo, admin_grupo = excluded.admin_grupo;
    delete from public.membros where user_id = v_user;
    for par in select key, value from jsonb_each_text(p_acessos) loop
      insert into public.membros (empresa, user_id, papel) values (par.key, v_user, par.value::public.papel_membro);
    end loop;
  end if;
end
$$;

-- Retira todo o acesso. O perfil fica (o nome continua no histórico e nas
-- assinaturas de relatórios antigos), mas sem empresa nenhuma.
create or replace function public.retirar_acesso(p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
begin
  if not privado.eh_admin_grupo() then
    raise exception 'Só o administrador do grupo retira acessos.';
  end if;
  select id into v_user from public.perfis where email = v_email;
  if v_user = (select auth.uid()) then
    raise exception 'Você não pode retirar o seu próprio acesso.';
  end if;
  delete from public.convites where email = v_email;
  if v_user is not null then
    delete from public.membros where user_id = v_user;
    update public.perfis set admin_grupo = false where id = v_user;
  end if;
end
$$;

revoke execute on function public.salvar_acesso(text, text, text, boolean, jsonb) from public, anon;
revoke execute on function public.retirar_acesso(text) from public, anon;
grant execute on function public.salvar_acesso(text, text, text, boolean, jsonb) to authenticated;
grant execute on function public.retirar_acesso(text) to authenticated;
