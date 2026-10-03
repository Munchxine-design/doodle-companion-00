drop policy if exists "Anyone can read site assets" on storage.objects;

create policy "Admins can read site assets"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'site-assets'
  and has_role(auth.uid(), 'admin'::app_role)
);