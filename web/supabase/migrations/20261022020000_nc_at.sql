-- Aggie Connect is for North Carolina A&T Aggies, not Texas A&M.
-- Run after 20261022010000_any_email_signup.sql.

-- "Former students" is Texas A&M's term. NC A&T says alumni.
alter type public.member_role rename value 'former_student' to 'alumni';

-- NC A&T was founded in 1891.
alter table public.profiles drop constraint if exists profiles_class_year_check;
alter table public.profiles
  add constraint profiles_class_year_check check (class_year between 1891 and 2100);

alter table public.profiles drop constraint if exists profiles_ring_year_check;
alter table public.profiles
  add constraint profiles_ring_year_check check (ring_year between 1891 and 2100);

-- The Corps of Cadets is a Texas A&M institution. ROTC, Greek life and
-- other organizations go in orgs[].
alter table public.profiles drop column if exists is_corps;

-- Sign-up trigger: same rules, with the alumni role.
create or replace function public.handle_new_user()
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
    case when requested_role = 'alumni'
      then 'alumni'::public.member_role
      else 'student'::public.member_role
    end,
    -- Covers projects with email confirmation turned off, where the address
    -- is already marked confirmed at insert time.
    case when coalesce(requested_role, 'student') <> 'alumni'
           and new.email_confirmed_at is not null
           and public.is_school_email(new.email)
      then 'approved'::public.member_status
      else 'pending'::public.member_status
    end,
    left(coalesce(nullif(trim(meta ->> 'first_name'), ''), 'Aggie'), 50),
    left(coalesce(nullif(trim(meta ->> 'last_name'), ''), 'Member'), 50),
    case when year between 1891 and 2100 then year end
  );
  return new;
end;
$$;
