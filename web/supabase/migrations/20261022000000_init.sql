-- Aggie Connect 2.0: initial schema.
-- Every table has Row Level Security enabled in the same migration that
-- creates it. Clients only ever use the publishable key plus the user's
-- session, so these policies are the access control.

-- ── Types ───────────────────────────────────────────────────────────────────
create type public.member_role as enum ('student', 'former_student', 'admin');
create type public.member_status as enum ('pending', 'approved', 'suspended');
create type public.connection_status as enum ('pending', 'accepted', 'declined');

-- ── Profiles ────────────────────────────────────────────────────────────────
-- No email column: emails stay in auth.users, which clients can't read.
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         public.member_role   not null default 'student',
  status       public.member_status not null default 'pending',
  first_name   text not null check (char_length(first_name) between 1 and 50),
  last_name    text not null check (char_length(last_name) between 1 and 50),
  class_year   int  check (class_year between 1876 and 2100),
  headline     text check (char_length(headline) <= 120),
  bio          text check (char_length(bio) <= 1000),
  major        text check (char_length(major) <= 80),
  college      text check (char_length(college) <= 80),
  city         text check (char_length(city) <= 80),
  linkedin_url text check (
    linkedin_url ~ '^https://(www\.)?linkedin\.com/in/[A-Za-z0-9_%-]+/?$'
  ),
  avatar_path  text,
  orgs         text[] not null default '{}' check (cardinality(orgs) <= 20),
  is_corps     boolean not null default false,
  ring_year    int check (ring_year between 1889 and 2100),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_status_idx on public.profiles (status);
create index profiles_class_year_idx on public.profiles (class_year);

alter table public.profiles enable row level security;

-- ── Helper functions ────────────────────────────────────────────────────────
-- security definer so policies can check the caller's own row without
-- recursing into the profiles policies.
create function public.is_approved()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

revoke execute on function public.is_approved() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_approved() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ── Profile policies ────────────────────────────────────────────────────────
-- You can always see yourself. You see other members only once you're
-- approved, and only members who are approved. Admins see everyone.
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: approved members read approved members"
  on public.profiles for select to authenticated
  using (status = 'approved' and (select public.is_approved()));

create policy "profiles: admins read all"
  on public.profiles for select to authenticated
  using ((select public.is_admin()));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No insert or delete policies: rows are created by the sign-up trigger and
-- removed with the auth user.

-- Column-level privileges: users can update their own profile fields, but
-- never role, status or timestamps. Role and status change only through
-- the admin functions below.
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (
  first_name, last_name, class_year, headline, bio, major, college, city,
  linkedin_url, avatar_path, orgs, is_corps, ring_year
) on public.profiles to authenticated;

create function public.touch_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── Sign-up trigger ─────────────────────────────────────────────────────────
-- Creates the profile from sign-up metadata. Only whitelisted fields are
-- read, and role can only be student or former_student, so nobody can
-- sign up as an admin.
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_role text := meta ->> 'role';
  year int;
begin
  begin
    year := (meta ->> 'class_year')::int;
  exception when others then
    year := null;
  end;

  insert into public.profiles (id, role, status, first_name, last_name, class_year)
  values (
    new.id,
    case when requested_role = 'former_student'
      then 'former_student'::public.member_role
      else 'student'::public.member_role
    end,
    -- Covers projects with email confirmation turned off, where the address
    -- is already marked confirmed at insert time.
    case when coalesce(requested_role, 'student') <> 'former_student'
           and new.email_confirmed_at is not null
           and lower(new.email) like '%@tamu.edu'
      then 'approved'::public.member_status
      else 'pending'::public.member_status
    end,
    left(coalesce(nullif(trim(meta ->> 'first_name'), ''), 'Aggie'), 50),
    left(coalesce(nullif(trim(meta ->> 'last_name'), ''), 'Member'), 50),
    case when year between 1876 and 2100 then year end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Students are auto-approved once they confirm a @tamu.edu address.
-- Former students stay pending until an admin approves them.
create function public.handle_email_confirmed()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and old.email_confirmed_at is null
     and lower(new.email) like '%@tamu.edu'
  then
    update public.profiles
       set status = 'approved'
     where id = new.id
       and role = 'student'
       and status = 'pending';
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.handle_email_confirmed();

-- ── Connections ─────────────────────────────────────────────────────────────
create table public.connections (
  id           bigint generated always as identity primary key,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id  uuid not null references public.profiles (id) on delete cascade,
  status       public.connection_status not null default 'pending',
  message      text check (char_length(message) <= 300),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (requester_id <> receiver_id)
);

-- One connection per pair, whichever direction it was requested in.
create unique index connections_pair_idx on public.connections (
  least(requester_id, receiver_id), greatest(requester_id, receiver_id)
);
create index connections_receiver_idx on public.connections (receiver_id, status);

alter table public.connections enable row level security;

create policy "connections: participants read"
  on public.connections for select to authenticated
  using ((select auth.uid()) in (requester_id, receiver_id));

-- Only approved members can send requests, only as themselves, only to
-- approved members, and only as pending.
create policy "connections: approved members request"
  on public.connections for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
    and (select public.is_approved())
    and exists (
      select 1 from public.profiles p
      where p.id = receiver_id and p.status = 'approved'
    )
  );

-- Only the receiver answers a request.
create policy "connections: receiver responds"
  on public.connections for update to authenticated
  using (receiver_id = (select auth.uid()))
  with check (receiver_id = (select auth.uid()));

create policy "connections: participants remove"
  on public.connections for delete to authenticated
  using ((select auth.uid()) in (requester_id, receiver_id));

revoke all on public.connections from anon;
revoke insert, update, delete on public.connections from authenticated;
grant select, delete on public.connections to authenticated;
grant insert (requester_id, receiver_id, message) on public.connections to authenticated;
grant update (status) on public.connections to authenticated;

create trigger connections_touch_updated_at
  before update on public.connections
  for each row execute function public.touch_updated_at();

-- ── Audit log ───────────────────────────────────────────────────────────────
create table public.audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  target_id  uuid,
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "audit_log: admins read"
  on public.audit_log for select to authenticated
  using ((select public.is_admin()));

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

-- ── Admin functions ─────────────────────────────────────────────────────────
-- The only way to change role or status from the app. Each checks the caller
-- is an admin and writes to the audit log.
create function public.admin_set_status(target uuid, new_status public.member_status)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'admins cannot change their own status' using errcode = '42501';
  end if;

  update public.profiles set status = new_status where id = target;
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'set_status', target, jsonb_build_object('status', new_status));
end;
$$;

create function public.admin_set_role(target uuid, new_role public.member_role)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'admins cannot change their own role' using errcode = '42501';
  end if;

  update public.profiles set role = new_role where id = target;
  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'set_role', target, jsonb_build_object('role', new_role));
end;
$$;

revoke execute on function public.admin_set_status(uuid, public.member_status) from public, anon;
revoke execute on function public.admin_set_role(uuid, public.member_role) from public, anon;
grant execute on function public.admin_set_status(uuid, public.member_status) to authenticated;
grant execute on function public.admin_set_role(uuid, public.member_role) to authenticated;

-- Trigger functions are not callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_email_confirmed() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- ── First admin ─────────────────────────────────────────────────────────────
-- There is deliberately no way to become admin from the app. After you sign
-- up and confirm your email, run this once in the Supabase SQL editor:
--
--   update public.profiles set role = 'admin', status = 'approved'
--   where id = (select id from auth.users where email = 'you@example.com');
