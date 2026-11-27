DROP POLICY IF EXISTS "Signed-in read rmacts files" ON storage.objects;

CREATE POLICY "Read own profile photo or course materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  (
    bucket_id = 'profile-photos'
    AND (
      (storage.foldername(name))[1] = (select auth.uid())::text
      OR (select public.has_role((select auth.uid()), 'admin'::public.app_role))
    )
  )
  OR (
    bucket_id = 'materials'
    AND (
      (select public.has_role((select auth.uid()), 'student'::public.app_role))
      OR (select public.has_role((select auth.uid()), 'admin'::public.app_role))
    )
  )
);