-- Imagens de evidência dos relatórios (prints, fotos de reunião).
-- Bucket privado; caminho "<empresa>/<projeto>/<etapa>/<arquivo>". Só quem
-- acessa a empresa (mesma regra das tabelas) lê, envia ou apaga.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy evidencias_select on storage.objects for select to authenticated
  using (bucket_id = 'evidencias' and privado.acessa_empresa((storage.foldername(name))[1]));

create policy evidencias_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias' and privado.acessa_empresa((storage.foldername(name))[1]));

create policy evidencias_delete on storage.objects for delete to authenticated
  using (bucket_id = 'evidencias' and privado.acessa_empresa((storage.foldername(name))[1]));
