drop policy if exists "Anyone can read drawings" on storage.objects;

create policy "Anyone can read approved drawings"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'drawings'
  and exists (
    select 1 from public.submissions s
    where s.image_path = name
      and s.approved = true
  )
);