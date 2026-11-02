DROP POLICY IF EXISTS "Public read rmacts files" ON storage.objects;
CREATE POLICY "Signed-in read rmacts files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('materials', 'profile-photos'));
CREATE POLICY "Users update own photo" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);