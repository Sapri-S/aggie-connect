-- Launch: "open to helping" on profiles, member reports, and self-serve
-- account deletion.
-- Run after 20261026000000_admin_mfa.sql, and before deploying the code that
-- reads profiles.open_to.

-- ── Open to helping ─────────────────────────────────────────────────────────
-- What a member is happy to help other Aggies with. Shown as chips on their
-- profile and as a directory filter.
alter table public.profiles
  add column if not exists open_to text[] not null default '{}'
  check (open_to <@ array['mentoring', 'referrals', 'resume_reviews', 'coffee_chats']);

grant update (open_to) on public.profiles to authenticated;

-- ── Reports ─────────────────────────────────────────────────────────────────
-- Members flag profiles (fake, spam, harassment). Only admins read them.
-- Members never write the table directly: report_member() checks who may
-- report and how often.
create table public.reports (
  id          bigint generated always as identity primary key,
  reporter_id uuid references public.profiles (id) on delete set null,
  target_id   uuid not null references public.profiles (id) on delete cascade,
  reason      text not null check (reason in ('fake', 'spam', 'harassment', 'inappropriate', 'other')),
  details     text check (char_length(details) <= 500),
  status      text not null default 'open' check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now(),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz
);

-- One open report per reporter and member; reporting again is a no-op.
create unique index reports_open_pair_idx
  on public.reports (reporter_id, target_id) where status = 'open';
create index reports_status_idx on public.reports (status, created_at desc);
create index reports_reporter_idx on public.reports (reporter_id, created_at);

alter table public.reports enable row level security;

create policy "reports: admins read"
  on public.reports for select to authenticated
  using ((select public.is_admin()));

revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;

-- Files a report as the caller. Approved members only, not about yourself,
-- only about approved members (the ones you can see), at most 10 a day.
create function public.report_member(target uuid, reason text, details text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_approved() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'you cannot report yourself' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles where id = target and status = 'approved'
  ) then
    raise exception 'member not found' using errcode = 'P0002';
  end if;
  if (
    select count(*) from public.reports
     where reporter_id = auth.uid() and created_at > now() - interval '24 hours'
  ) >= 10 then
    raise exception 'report limit reached' using errcode = '54000';
  end if;

  insert into public.reports (reporter_id, target_id, reason, details)
  values (auth.uid(), target, reason, nullif(trim(details), ''))
  on conflict (reporter_id, target_id) where status = 'open' do nothing;
end;
$$;

-- Open reports with both names, oldest first. Non-admins get an empty list.
create function public.admin_list_reports()
returns table (
  id                bigint,
  reason            text,
  details           text,
  created_at        timestamptz,
  target_id         uuid,
  target_first_name text,
  target_last_name  text,
  target_status     public.member_status,
  reporter_id       uuid,
  reporter_name     text
)
language sql stable security definer set search_path = ''
as $$
  select r.id, r.reason, r.details, r.created_at,
         t.id, t.first_name, t.last_name, t.status,
         r.reporter_id, coalesce(rp.first_name || ' ' || rp.last_name, 'A deleted member')
    from public.reports r
    join public.profiles t on t.id = r.target_id
    left join public.profiles rp on rp.id = r.reporter_id
   where public.is_admin() and r.status = 'open'
   order by r.created_at;
$$;

create function public.admin_resolve_report(report_id bigint)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  target uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.reports
     set status = 'resolved', resolved_by = auth.uid(), resolved_at = now()
   where id = report_id and status = 'open'
  returning target_id into target;
  if target is null then
    raise exception 'report not found' using errcode = 'P0002';
  end if;

  insert into public.audit_log (actor_id, action, target_id, details)
  values (auth.uid(), 'resolve_report', target, jsonb_build_object('report_id', report_id));
end;
$$;

-- ── Delete my account ───────────────────────────────────────────────────────
-- Removes the caller's account, profile, connections and reports about them
-- (cascade). The app deletes their photos first. Admins can't delete
-- themselves here, so the site never loses its last admin by accident; an
-- admin steps down in SQL first. The audit log keeps the ID, not the email.
create function public.delete_my_account()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if public.has_admin_role() then
    raise exception 'admins cannot delete their own account' using errcode = '42501';
  end if;

  insert into public.audit_log (actor_id, action, target_id, details)
  values (null, 'self_delete', me, '{}'::jsonb);

  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.report_member(uuid, text, text) from public, anon;
revoke execute on function public.admin_list_reports() from public, anon;
revoke execute on function public.admin_resolve_report(bigint) from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.report_member(uuid, text, text) to authenticated;
grant execute on function public.admin_list_reports() to authenticated;
grant execute on function public.admin_resolve_report(bigint) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
