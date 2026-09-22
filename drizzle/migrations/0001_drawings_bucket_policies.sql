CREATE POLICY "Anyone can upload a drawing"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'drawings');

CREATE POLICY "Anyone can read drawings"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'drawings');

CREATE POLICY "Admins can delete drawings"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'drawings' AND public.has_role(auth.uid(), 'admin'));
