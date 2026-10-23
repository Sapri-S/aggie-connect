-- Caps how many connection requests a member can send, so one account
-- can't spam the whole directory. It's a trigger, not a Server Action check,
-- so it holds when someone calls the API directly with their session.
-- Run after 20261024000000_auto_approve.sql.
--
-- Limits: 30 requests per rolling 24 hours, and 100 waiting for an answer
-- at once. The daily count comes from its own log, so withdrawing a request
-- and sending it again still counts twice.

-- ── Request log ─────────────────────────────────────────────────────────────
-- Written only by the trigger below. RLS is on with no policies, so clients
-- can't read or change it.
create table public.connection_request_log (
  id           bigint generated always as identity primary key,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create index connection_request_log_requester_idx
  on public.connection_request_log (requester_id, created_at);

alter table public.connection_request_log enable row level security;

revoke all on public.connection_request_log from anon, authenticated;

-- ── Limit trigger ───────────────────────────────────────────────────────────
create function public.enforce_connection_request_limits()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  sent_today int;
  waiting int;
begin
  -- Serialize inserts per requester so parallel requests can't slip past
  -- the counts.
  perform pg_advisory_xact_lock(hashtextextended(new.requester_id::text, 0));

  select count(*) into sent_today
    from public.connection_request_log
   where requester_id = new.requester_id
     and created_at > now() - interval '24 hours';
  if sent_today >= 30 then
    raise exception 'connection request limit reached'
      using errcode = 'P0001', hint = 'daily';
  end if;

  select count(*) into waiting
    from public.connections
   where requester_id = new.requester_id
     and status = 'pending';
  if waiting >= 100 then
    raise exception 'connection request limit reached'
      using errcode = 'P0001', hint = 'pending';
  end if;

  insert into public.connection_request_log (requester_id)
  values (new.requester_id);

  -- Keep the log small: only the last day matters.
  delete from public.connection_request_log
   where requester_id = new.requester_id
     and created_at < now() - interval '24 hours';

  return new;
end;
$$;

create trigger connections_request_limits
  before insert on public.connections
  for each row execute function public.enforce_connection_request_limits();

revoke execute on function public.enforce_connection_request_limits() from public, anon, authenticated;
