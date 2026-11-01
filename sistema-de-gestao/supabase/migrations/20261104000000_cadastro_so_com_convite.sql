-- Cadastro só com autorização: ninguém cria conta no Blimp sem que o administrador do grupo tenha liberado o e-mail
-- (tabela convites, preenchida em Equipe > Incluir pessoa ou Acessos). O bloqueio fica no banco, antes de a conta existir,
-- e vale para qualquer forma de cadastro (tela de login, link, API). Quem já tem conta não é afetado.

create or replace function public.exigir_convite_no_cadastro()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.convites c where lower(c.email) = lower(coalesce(new.email, ''))) then
    raise exception 'Este e-mail não está autorizado a criar conta.' using errcode = '42501';
  end if;
  return new;
end
$$;

revoke execute on function public.exigir_convite_no_cadastro() from public, anon, authenticated;

create trigger antes_de_criar_usuario
  before insert on auth.users
  for each row execute function public.exigir_convite_no_cadastro();

-- Incluir na equipe um e-mail novo (sem conta e sem convite) é autorizar um cadastro: só o administrador do grupo.
-- O gestor da empresa continua incluindo quem o administrador já liberou.
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

revoke execute on function public.salvar_membro(text, text, text, text, text) from public, anon;
grant execute on function public.salvar_membro(text, text, text, text, text) to authenticated;
