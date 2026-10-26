-- Equipe de cada empresa: o gestor da empresa inclui pessoas, muda a função
-- (gestor, consultor ou equipe) e retira o acesso, só na própria empresa. O
-- administrador do grupo pode tudo em todas. Cada pessoa edita o próprio nome.

-- Quem trabalha na empresa (com conta), quem foi convidado e ainda não criou a
-- conta, e os administradores do grupo (que veem todas as empresas)
create or replace function public.equipe_da_empresa(p_empresa text)
returns table (email text, nome text, nome_completo text, papel text, situacao text, admin_grupo boolean, membro boolean)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not privado.acessa_empresa(p_empresa) then
    raise exception 'Sem acesso a esta empresa.';
  end if;
  return query
    select pf.email, pf.nome, pf.nome_completo, m.papel::text, 'ativo'::text, pf.admin_grupo, true
    from public.membros m join public.perfis pf on pf.id = m.user_id
    where m.empresa = p_empresa
    union all
    select pf.email, pf.nome, pf.nome_completo, 'gestor'::text, 'ativo'::text, true, false
    from public.perfis pf
    where pf.admin_grupo and not exists (select 1 from public.membros m where m.empresa = p_empresa and m.user_id = pf.id)
    union all
    select c.email, c.nome, c.nome_completo, c.acessos ->> p_empresa, 'convidado'::text, c.admin_grupo, true
    from public.convites c
    where c.acessos ? p_empresa and not exists (select 1 from public.perfis pf where pf.email = c.email);
end
$$;

-- Inclui a pessoa na empresa ou muda a função dela. O convite guarda o acesso
-- para quando ela criar a conta; quem já tem conta passa a ver a empresa na hora.
create or replace function public.salvar_membro(p_empresa text, p_email text, p_nome text, p_nome_completo text, p_papel text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
  v_nome text;
  v_completo text;
begin
  if not privado.gerencia_empresa(p_empresa) then
    raise exception 'Só gestores da empresa cuidam da equipe.';
  end if;
  if p_papel not in ('gestor', 'consultor', 'equipe') then
    raise exception 'Função inválida.';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'E-mail inválido.';
  end if;

  select id into v_user from auth.users where lower(email) = v_email;
  if v_user = (select auth.uid()) and p_papel <> 'gestor' and not privado.eh_admin_grupo() then
    raise exception 'Você não pode tirar a sua própria função de gestor.';
  end if;

  -- Nome: o informado; senão, o que já existe no perfil ou no convite
  select coalesce(nullif(trim(p_nome), ''), pf.nome, c.nome), coalesce(nullif(trim(p_nome_completo), ''), pf.nome_completo, c.nome_completo)
    into v_nome, v_completo
  from (select 1) x
  left join public.perfis pf on pf.email = v_email
  left join public.convites c on c.email = v_email;
  if coalesce(v_nome, '') = '' or coalesce(v_completo, '') = '' then
    raise exception 'Informe o nome e o nome completo.';
  end if;

  insert into public.convites (email, nome, nome_completo, admin_grupo, acessos)
  values (v_email, v_nome, v_completo, false, jsonb_build_object(p_empresa, p_papel))
  on conflict (email) do update set acessos = public.convites.acessos || jsonb_build_object(p_empresa, p_papel);

  if v_user is not null then
    insert into public.perfis (id, email, nome, nome_completo, admin_grupo)
    values (v_user, v_email, v_nome, v_completo, false)
    on conflict (id) do nothing;
    insert into public.membros (empresa, user_id, papel) values (p_empresa, v_user, p_papel::public.papel_membro)
    on conflict (empresa, user_id) do update set papel = excluded.papel;
  end if;
end
$$;

-- Retira a pessoa só desta empresa; os acessos às outras continuam
create or replace function public.retirar_membro(p_empresa text, p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
begin
  if not privado.gerencia_empresa(p_empresa) then
    raise exception 'Só gestores da empresa cuidam da equipe.';
  end if;
  select id into v_user from public.perfis where email = v_email;
  if v_user = (select auth.uid()) then
    raise exception 'Você não pode retirar o seu próprio acesso.';
  end if;
  update public.convites set acessos = acessos - p_empresa where email = v_email;
  delete from public.membros where empresa = p_empresa and user_id = v_user;
end
$$;

-- Cada pessoa muda o próprio nome (perfil e convite)
create or replace function public.atualizar_meu_perfil(p_nome text, p_nome_completo text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text;
begin
  if trim(coalesce(p_nome, '')) = '' or trim(coalesce(p_nome_completo, '')) = '' then
    raise exception 'Informe o nome e o nome completo.';
  end if;
  update public.perfis set nome = trim(p_nome), nome_completo = trim(p_nome_completo)
  where id = (select auth.uid()) returning email into v_email;
  update public.convites set nome = trim(p_nome), nome_completo = trim(p_nome_completo) where email = v_email;
end
$$;

-- Situação da empresa (ativa, em estruturação, em standby): só o administrador do grupo
create or replace function public.definir_situacao_empresa(p_empresa text, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not privado.eh_admin_grupo() then
    raise exception 'Só o administrador do grupo muda a situação da empresa.';
  end if;
  update public.empresas set status = p_status::public.empresa_status where slug = p_empresa;
end
$$;

revoke execute on function public.equipe_da_empresa(text) from public, anon;
revoke execute on function public.salvar_membro(text, text, text, text, text) from public, anon;
revoke execute on function public.retirar_membro(text, text) from public, anon;
revoke execute on function public.atualizar_meu_perfil(text, text) from public, anon;
revoke execute on function public.definir_situacao_empresa(text, text) from public, anon;
grant execute on function public.equipe_da_empresa(text) to authenticated;
grant execute on function public.salvar_membro(text, text, text, text, text) to authenticated;
grant execute on function public.retirar_membro(text, text) to authenticated;
grant execute on function public.atualizar_meu_perfil(text, text) to authenticated;
grant execute on function public.definir_situacao_empresa(text, text) to authenticated;
