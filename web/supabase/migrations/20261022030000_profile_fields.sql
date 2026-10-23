-- Profile additions: current job and a private avatars bucket.
-- Run after 20261022020000_nc_at.sql.

alter table public.profiles
  add column if not exists job_title text check (char_length(job_title) <= 100),
  add column if not exists company   text check (char_length(company) <= 100);

-- Users can edit these on their own row (role and status stay locked).
grant update (job_title, company) on public.profiles to authenticated;

-- ── Avatars ─────────────────────────────────────────────────────────────────
-- Private bucket: photos are only visible to signed-in, approved members
-- (through short-lived signed URLs), the same people who can see profiles.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Files live at avatars/<user id>/<random>.webp. Each user can only write
-- inside their own folder.
create policy "avatars: upload own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars: delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- You can see your own photo; approved members can see everyone's.
create policy "avatars: read own or as approved member"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_approved())
    )
  );

-- avatar_path must point inside the user's own folder, so nobody can set
-- their profile photo to someone else's file.
alter table public.profiles
  add constraint profiles_avatar_path_own_folder
  check (avatar_path is null or avatar_path like id::text || '/%');
