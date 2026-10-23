-- Everyone is approved once they confirm their email: students and alumni,
-- school or personal address. Admins can still suspend or remove members.
-- Run after 20261023000000_admin.sql.
--
-- public.is_school_email stays defined. To go back to approving only
-- school emails, add `and public.is_school_email(new.email)` to both
-- conditions below.

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
    case when new.email_confirmed_at is not null
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

create or replace function public.handle_email_confirmed()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and old.email_confirmed_at is null
  then
    -- Only pending members: a suspended member stays suspended.
    update public.profiles
       set status = 'approved'
     where id = new.id
       and status = 'pending';
  end if;
  return new;
end;
$$;

-- Let in everyone already waiting who has confirmed their email.
update public.profiles p
   set status = 'approved'
  from auth.users u
 where u.id = p.id
   and p.status = 'pending'
   and u.email_confirmed_at is not null;
