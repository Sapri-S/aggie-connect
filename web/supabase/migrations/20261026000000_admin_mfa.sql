-- Admins need two-factor authentication. Admin rights (every RLS policy and
-- function that calls public.is_admin()) now apply only to a session that
-- has passed a TOTP check (aal2). A phished password alone gets a normal
-- member session, not every member's email.
-- Run after 20261024000000_auto_approve.sql.
--
-- After running this, each admin opens /admin, is sent to /admin/mfa, and
-- sets up an authenticator app. Until they do, they have no admin rights.
--
-- Lost authenticator: another admin can't reset it from the app. In the
-- Supabase SQL Editor, delete the admin's factors and they can enrol again:
--
--   delete from auth.mfa_factors
--   where user_id = (select id from auth.users where email = 'admin@example.com');

-- Role check without the MFA requirement. Only for deciding where to send
-- someone (show the Admin link, send them to set up MFA). Never use it to
-- grant access: use public.is_admin().
create function public.has_admin_role()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.has_admin_role()
     and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

revoke execute on function public.has_admin_role() from public, anon;
grant execute on function public.has_admin_role() to authenticated;
