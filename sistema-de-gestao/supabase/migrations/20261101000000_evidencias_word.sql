-- O arquivo final do diagnóstico (Word ou PDF) fica no bucket "evidencias", em "<empresa>/<projeto>/diagnostico/…":
-- o bucket passa a aceitar Word (.docx e .doc), além de imagens e PDF.
update storage.buckets
   set allowed_mime_types = array[
     'image/png', 'image/jpeg', 'image/webp', 'application/pdf',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'
   ]
 where id = 'evidencias';
