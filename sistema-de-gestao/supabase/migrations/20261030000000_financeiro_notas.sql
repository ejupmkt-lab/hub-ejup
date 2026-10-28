-- Notas fiscais de cada parcela (e da contrapartida do cliente): número, data de emissão, valor e o arquivo.
-- {"30": {"numero": "123", "emitidaEm": "2026-11-03", "valor": 8091.9, "arquivo": {"caminho": "<projeto>/<arquivo>", "nome": "nf.pdf"}}}
alter table public.financeiro_projetos add column notas jsonb not null default '{}'::jsonb;

-- Arquivos das notas: bucket privado, só para quem vê o financeiro. Caminho "<projeto>/<arquivo>"; a regra de
-- empresa segue a empresa atual do projeto (se o projeto mudar de empresa, os arquivos acompanham sem copiar nada).
-- Arquivos de um projeto já excluído (sem linha em "projetos") continuam acessíveis a quem vê o financeiro, para a limpeza.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notas-fiscais', 'notas-fiscais', false, 10485760, array['application/pdf', 'application/xml', 'text/xml', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy notas_fiscais_select on storage.objects for select to authenticated
  using (
    bucket_id = 'notas-fiscais' and privado.ve_financeiro()
    and coalesce((select privado.acessa_empresa(pr.empresa) from public.projetos pr where pr.id = (storage.foldername(name))[1]), true)
  );

create policy notas_fiscais_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'notas-fiscais' and privado.ve_financeiro()
    and exists (select 1 from public.projetos pr where pr.id = (storage.foldername(name))[1] and privado.acessa_empresa(pr.empresa))
  );

create policy notas_fiscais_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'notas-fiscais' and privado.ve_financeiro()
    and coalesce((select privado.acessa_empresa(pr.empresa) from public.projetos pr where pr.id = (storage.foldername(name))[1]), true)
  );
