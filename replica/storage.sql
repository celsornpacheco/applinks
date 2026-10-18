-- Supabase Storage (só existe no Supabase; o ambiente local usa o armazenamento simples do dev/local-supabase)
-- Fotos e assinaturas: buckets privados, arquivos em <id da OS>/<arquivo>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('evidencias', 'evidencias', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('assinaturas', 'assinaturas', false, 1048576, array['image/png'])
on conflict (id) do nothing;

-- Só quem pode ver a OS vê ou envia os arquivos dela (mesma regra das tabelas)
create policy evidencias_read on storage.objects for select to authenticated
  using (bucket_id = 'evidencias' and public.can_see_work_order(((storage.foldername(name))[1])::uuid));
create policy evidencias_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias' and public.can_see_work_order(((storage.foldername(name))[1])::uuid));

-- Assinatura: só técnico e gestor enviam
create policy assinaturas_read on storage.objects for select to authenticated
  using (bucket_id = 'assinaturas' and public.can_see_work_order(((storage.foldername(name))[1])::uuid));
create policy assinaturas_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'assinaturas'
              and public.current_role_name() in ('admin','manager','technician')
              and public.can_see_work_order(((storage.foldername(name))[1])::uuid));
