insert into storage.buckets (id, name, public)
values ('certification-evidence', 'certification-evidence', false)
on conflict (id) do nothing;

create policy "evidence_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'certification-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "evidence_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'certification-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'certification-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "evidence_select_own_or_admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'certification-evidence'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or private.is_admin()
  )
);

create policy "evidence_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'certification-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
