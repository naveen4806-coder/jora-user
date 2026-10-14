-- Storage policies for the public Jora image buckets.
-- Upload files beneath the authenticated user's UUID folder: <user-id>/<filename>.
create policy "profile image upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "profile image update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "profile image delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vendor product image upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.profiles where id = auth.uid() and role in ('vendor', 'admin')));
create policy "vendor product image update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.profiles where id = auth.uid() and role in ('vendor', 'admin')))
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.profiles where id = auth.uid() and role in ('vendor', 'admin')));
create policy "vendor product image delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text and exists (select 1 from public.profiles where id = auth.uid() and role in ('vendor', 'admin')));
