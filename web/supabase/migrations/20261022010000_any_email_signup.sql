-- Any email can sign up. Students are auto-approved only when they confirm
-- a school email address. Everyone else stays pending until an admin
-- approves them.

-- The school email domains. Edit this list to change who is auto-approved.
create or replace function public.is_school_email(email text)
returns boolean
language sql immutable set search_path = ''
as $$
  select split_part(lower(coalesce(email, '')), '@', 2) in (
    'ncat.edu',
    'aggies.ncat.edu'
  );
$$;

revoke execute on function public.is_school_email(text) from public, anon, authenticated;

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
    case when requested_role = 'former_student'
      then 'former_student'::public.member_role
      else 'student'::public.member_role
    end,
    -- Covers projects with email confirmation turned off, where the address
    -- is already marked confirmed at insert time.
    case when coalesce(requested_role, 'student') <> 'former_student'
           and new.email_confirmed_at is not null
           and public.is_school_email(new.email)
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

create or replace function public.handle_email_confirmed()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null
     and old.email_confirmed_at is null
     and public.is_school_email(new.email)
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
