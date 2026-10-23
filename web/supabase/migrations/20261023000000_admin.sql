-- Admin tools: list members with their emails, and remove members.
-- Run after 20261022030000_profile_fields.sql.
--
-- Both functions check public.is_admin() themselves. They run as the
-- database owner (security definer) because emails live in auth.users,
-- which normal users can't read, and removing a member means deleting their
-- auth.users row.

-- Every member with their email and last sign-in, pending first.
-- Non-admins get an empty list.
create or replace function public.admin_list_members()
returns table (
  id              uuid,
  email           text,
  first_name      text,
  last_name       text,
  role            public.member_role,
  status          public.member_status,
  class_year      int,
  created_at      timestamptz,
  last_sign_in_at timestamptz,
  is_demo         boolean
)
language sql stable security definer set search_path = ''
as $$
  select p.id, u.email::text, p.first_name, p.last_name, p.role, p.status,
         p.class_year, p.created_at, u.last_sign_in_at,
         u.email like '%@demo.aggieconnect.invalid'
    from public.profiles p
    join auth.users u on u.id = p.id
   where public.is_admin()
   order by (p.status = 'pending') desc, p.created_at desc;
$$;

-- Removes a member completely: account, profile and connections (cascade).
-- Admins can't remove themselves. Logged to audit_log with the email, since
-- the profile row is gone afterward.
create or replace function public.admin_remove_user(target uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  target_email text;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'admins cannot remove themselves' using errcode = '42501';
  end if;

  select u.email into target_email from auth.users u where u.id = target;
  if target_email is null then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'remove_user', target, jsonb_build_object('email', target_email));

  delete from auth.users where id = target;
end;
$$;

revoke execute on function public.admin_list_members() from public, anon;
revoke execute on function public.admin_remove_user(uuid) from public, anon;
grant execute on function public.admin_list_members() to authenticated;
grant execute on function public.admin_remove_user(uuid) to authenticated;

-- Admins can delete anyone's avatar, so removing a member doesn't leave
-- their photo behind in storage.
create policy "avatars: admins delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (select public.is_admin()));
