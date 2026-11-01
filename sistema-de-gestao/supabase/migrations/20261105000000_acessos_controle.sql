-- Controle de acessos: o administrador do grupo vê quem entrou, saiu ou mudou de função, e em que empresa. Cada mudança
-- guarda o "antes" e o "depois", para poder desfazer à mão. O registro só é lido pelo administrador; só as funções abaixo escrevem.

create table public.acessos_log (
  id bigint generated always as identity primary key,
  em timestamptz not null default now(),
  quem text not null,       -- e-mail de quem fez a mudança
  acao text not null,       -- salvar_acesso, retirar_acesso, incluir_na_equipe, retirar_da_empresa
  email text not null,      -- a pessoa que mudou
  empresa text,
  antes jsonb,
  depois jsonb
);
alter table public.acessos_log enable row level security;
revoke all on public.acessos_log from anon, authenticated;
grant select on public.acessos_log to authenticated;
create policy acessos_log_admin on public.acessos_log for select to authenticated using (privado.eh_admin_grupo());

create or replace function privado.registrar_acesso(p_acao text, p_email text, p_empresa text, p_antes jsonb, p_depois jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.acessos_log (quem, acao, email, empresa, antes, depois)
  values (coalesce((select pf.email from public.perfis pf where pf.id = (select auth.uid())), '?'), p_acao, p_email, p_empresa, p_antes, p_depois)
$$;
revoke execute on function privado.registrar_acesso(text, text, text, jsonb, jsonb) from public, anon, authenticated;

-- Acessos de uma pessoa agora (convite, mais o que já vale na conta): {"admin": bool, "acessos": {...}}
create or replace function privado.acessos_atuais(p_email text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'admin', coalesce((select pf.admin_grupo from public.perfis pf where pf.email = p_email), (select c.admin_grupo from public.convites c where c.email = p_email), false),
    'acessos', coalesce((select jsonb_object_agg(m.empresa, m.papel) from public.membros m join public.perfis pf on pf.id = m.user_id where pf.email = p_email),
                        (select c.acessos from public.convites c where c.email = p_email), '{}'::jsonb))
$$;
revoke execute on function privado.acessos_atuais(text) from public, anon, authenticated;

create or replace function public.salvar_acesso(
  p_email text, p_nome text, p_nome_completo text, p_admin boolean, p_acessos jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
  v_antes jsonb;
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
  v_antes := privado.acessos_atuais(v_email);

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
  perform privado.registrar_acesso('salvar_acesso', v_email, null, v_antes, jsonb_build_object('admin', p_admin, 'acessos', p_acessos));
end
$$;

create or replace function public.retirar_acesso(p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
  v_antes jsonb;
begin
  if not privado.eh_admin_grupo() then
    raise exception 'Só o administrador do grupo retira acessos.';
  end if;
  select id into v_user from public.perfis where email = v_email;
  if v_user = (select auth.uid()) then
    raise exception 'Você não pode retirar o seu próprio acesso.';
  end if;
  v_antes := privado.acessos_atuais(v_email);
  delete from public.convites where email = v_email;
  if v_user is not null then
    delete from public.membros where user_id = v_user;
    update public.perfis set admin_grupo = false where id = v_user;
  end if;
  perform privado.registrar_acesso('retirar_acesso', v_email, null, v_antes, jsonb_build_object('admin', false, 'acessos', '{}'::jsonb));
end
$$;

create or replace function public.retirar_membro(p_empresa text, p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
  v_antes jsonb;
begin
  if not privado.gerencia_empresa(p_empresa) then
    raise exception 'Só gestores da empresa cuidam da equipe.';
  end if;
  select id into v_user from public.perfis where email = v_email;
  if v_user = (select auth.uid()) then
    raise exception 'Você não pode retirar o seu próprio acesso.';
  end if;
  v_antes := privado.acessos_atuais(v_email);
  update public.convites set acessos = acessos - p_empresa where email = v_email;
  delete from public.membros where empresa = p_empresa and user_id = v_user;
  perform privado.registrar_acesso('retirar_da_empresa', v_email, p_empresa, v_antes, privado.acessos_atuais(v_email));
end
$$;

create or replace function public.salvar_membro(p_empresa text, p_email text, p_nome text, p_nome_completo text, p_papel text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
  v_nome text;
  v_completo text;
  v_antes jsonb;
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
  -- E-mail que o sistema ainda não conhece (sem conta e sem convite): quem autoriza é o administrador do grupo
  if v_user is null and not privado.eh_admin_grupo() and not exists (select 1 from public.convites where email = v_email) then
    raise exception 'Só o administrador do grupo autoriza um e-mail novo. Peça a ele para liberar o acesso e depois inclua a pessoa na equipe.';
  end if;
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

  v_antes := privado.acessos_atuais(v_email);
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
  perform privado.registrar_acesso('incluir_na_equipe', v_email, p_empresa, v_antes, privado.acessos_atuais(v_email));
end
$$;

revoke execute on function public.salvar_acesso(text, text, text, boolean, jsonb), public.retirar_acesso(text), public.retirar_membro(text, text), public.salvar_membro(text, text, text, text, text) from public, anon;
grant execute on function public.salvar_acesso(text, text, text, boolean, jsonb), public.retirar_acesso(text), public.retirar_membro(text, text), public.salvar_membro(text, text, text, text, text) to authenticated;
