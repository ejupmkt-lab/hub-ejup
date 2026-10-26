-- Mover um projeto para outra empresa do grupo, com tudo: dados, histórico, conversa, financeiro e o cliente.
-- Quem move precisa gerenciar a empresa de origem e ter acesso à de destino. Os arquivos (bucket "evidencias")
-- são copiados pelo aplicativo antes, para a pasta da empresa de destino; aqui só se acertam os caminhos.
-- Cliente: se a empresa de destino já tem um cliente com o mesmo CNPJ, o projeto passa a ele; senão, o cliente
-- vai junto (quando era só deste projeto) ou é copiado (quando tem outros projetos na empresa de origem).

create or replace function public.mover_projeto(p_id text, p_destino text, p_servico_id text default null, p_usuario text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_proj public.projetos%rowtype;
  v_cli public.clientes%rowtype;
  v_origem text;
  v_nome_origem text;
  v_nome_destino text;
  v_cnpj text;
  v_cliente_destino text;
  v_outros integer;
  v_serv public.servicos%rowtype;
  v_dados jsonb;
  v_consultor text;
  v_detalhe text;
  v_de text;
  v_para text;
begin
  select * into v_proj from public.projetos where id = p_id for update;
  if not found then raise exception 'Projeto não encontrado.'; end if;
  v_origem := v_proj.empresa;
  if v_origem = p_destino then raise exception 'O projeto já está nessa empresa.'; end if;
  if not (privado.gerencia_empresa(v_origem) and privado.acessa_empresa(p_destino)) then
    raise exception 'Só gestores da empresa de origem, com acesso à de destino, podem mover o projeto.' using errcode = '42501';
  end if;
  select nome into v_nome_origem from public.empresas where slug = v_origem;
  select nome into v_nome_destino from public.empresas where slug = p_destino;

  -- Cliente
  select * into v_cli from public.clientes where id = v_proj.cliente_id for update;
  v_cnpj := regexp_replace(coalesce(v_cli.dados ->> 'cnpj', ''), '\D', '', 'g');
  v_cliente_destino := null;
  if v_cnpj <> '' then
    select id into v_cliente_destino from public.clientes
     where empresa = p_destino and regexp_replace(coalesce(dados ->> 'cnpj', ''), '\D', '', 'g') = v_cnpj limit 1;
  end if;
  if v_cliente_destino is null then
    select count(*) into v_outros from public.projetos where cliente_id = v_cli.id and id <> p_id;
    if v_outros = 0 then
      v_cliente_destino := v_cli.id;
      update public.clientes set empresa = p_destino, dados = jsonb_set(dados, '{empresa}', to_jsonb(p_destino)), updated_at = now() where id = v_cli.id;
      v_detalhe := 'O cliente foi junto.';
    else
      v_cliente_destino := 'cli-' || gen_random_uuid()::text;
      insert into public.clientes (id, empresa, dados)
      values (v_cliente_destino, p_destino, jsonb_set(jsonb_set(v_cli.dados, '{empresa}', to_jsonb(p_destino)), '{id}', to_jsonb(v_cliente_destino)));
      v_detalhe := 'O cliente foi copiado (continua também em ' || v_nome_origem || ').';
    end if;
  else
    v_detalhe := 'Vinculado ao cliente que já existia em ' || v_nome_destino || ' (mesmo CNPJ).';
  end if;

  -- Dados do projeto: caminhos dos arquivos, empresa, cliente, consultor e serviço
  v_de := '"' || v_origem || '/' || p_id || '/';
  v_para := '"' || p_destino || '/' || p_id || '/';
  v_dados := replace(v_proj.dados::text, v_de, v_para)::jsonb;
  v_dados := jsonb_set(v_dados, '{empresa}', to_jsonb(p_destino));
  v_dados := jsonb_set(v_dados, '{clienteId}', to_jsonb(v_cliente_destino));
  v_consultor := v_dados ->> 'consultorId';
  if v_consultor is null or not exists (select 1 from public.membros where empresa = p_destino and user_id::text = v_consultor) then
    v_dados := jsonb_set(v_dados, '{consultorId}', to_jsonb((select auth.uid())::text));
    v_detalhe := v_detalhe || ' O consultor passou a ser quem moveu o projeto.';
  end if;
  if p_servico_id is not null then
    select * into v_serv from public.servicos where id = p_servico_id and empresa = p_destino;
    if found then
      v_dados := v_dados || jsonb_build_object('modeloId', v_serv.id, 'modeloVersao', coalesce((v_serv.dados ->> 'versao')::int, 1), 'servicoNome', coalesce(v_serv.dados ->> 'nomeCurto', v_dados ->> 'servicoNome'));
      v_detalhe := v_detalhe || ' Serviço: ' || coalesce(v_serv.dados ->> 'nomeCurto', v_serv.id) || '.';
    end if;
  end if;
  v_dados := jsonb_set(
    v_dados,
    '{historico}',
    jsonb_build_array(jsonb_build_object(
      'em', to_char((now() at time zone 'utc') - interval '3 hours', 'YYYY-MM-DD"T"HH24:MI:SS'),
      'usuario', coalesce(p_usuario, ''),
      'acao', 'Projeto movido de ' || v_nome_origem || ' para ' || v_nome_destino,
      'detalhe', v_detalhe
    )) || coalesce(v_dados -> 'historico', '[]'::jsonb)
  );

  update public.projetos
     set empresa = p_destino, cliente_id = v_cliente_destino, dados = v_dados, versao = versao + 1, updated_at = now(), atualizado_por = (select auth.uid())
   where id = p_id;
  update public.mensagens_projeto
     set empresa = p_destino,
         anexos = replace(anexos::text, v_de, v_para)::jsonb,
         acoes = replace(acoes::text, v_de, v_para)::jsonb,
         desfazer = replace(desfazer::text, v_de, v_para)::jsonb
   where projeto_id = p_id;
  update public.financeiro_projetos set empresa = p_destino where projeto_id = p_id;

  return jsonb_build_object('cliente_id', v_cliente_destino, 'de', v_origem, 'para', p_destino);
end
$$;

revoke execute on function public.mover_projeto(text, text, text, text) from public, anon;
grant execute on function public.mover_projeto(text, text, text, text) to authenticated;
