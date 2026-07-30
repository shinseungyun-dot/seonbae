create table if not exists public.auth_request_limits (
  key_hash text not null,
  action text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (key_hash, action),
  constraint auth_request_limits_key_hash_check
    check (key_hash ~ '^[0-9a-f]{64}$'),
  constraint auth_request_limits_action_check
    check (action in ('authenticate', 'signup', 'recovery', 'password_update')),
  constraint auth_request_limits_request_count_check
    check (request_count between 1 and 1000000)
);

alter table public.auth_request_limits enable row level security;

revoke all on table public.auth_request_limits
  from public, anon, authenticated;

create or replace function public.consume_auth_request_limit(
  p_key_hash text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
  current_window_started_at timestamptz;
  window_interval interval;
begin
  if p_key_hash !~ '^[0-9a-f]{64}$'
    or p_action not in ('authenticate', 'signup', 'recovery', 'password_update')
    or p_limit not between 1 and 1000
    or p_window_seconds not between 10 and 86400
  then
    raise exception 'Invalid rate-limit parameters';
  end if;

  window_interval := make_interval(secs => p_window_seconds);

  insert into public.auth_request_limits (
    key_hash,
    action,
    window_started_at,
    request_count,
    updated_at
  )
  values (
    p_key_hash,
    p_action,
    now(),
    1,
    now()
  )
  on conflict (key_hash, action) do update
  set
    window_started_at = case
      when public.auth_request_limits.window_started_at
        <= now() - window_interval
      then now()
      else public.auth_request_limits.window_started_at
    end,
    request_count = case
      when public.auth_request_limits.window_started_at
        <= now() - window_interval
      then 1
      else public.auth_request_limits.request_count + 1
    end,
    updated_at = now()
  returning
    auth_request_limits.request_count,
    auth_request_limits.window_started_at
  into current_count, current_window_started_at;

  allowed := current_count <= p_limit;
  retry_after_seconds := case
    when allowed then 0
    else greatest(
      1,
      ceil(
        extract(
          epoch from (
            current_window_started_at
            + window_interval
            - now()
          )
        )
      )::integer
    )
  end;

  if random() < 0.01 then
    delete from public.auth_request_limits
    where updated_at < now() - interval '2 days';
  end if;

  return next;
end;
$$;

revoke all on function public.consume_auth_request_limit(
  text,
  text,
  integer,
  integer
) from public, anon, authenticated;

grant execute on function public.consume_auth_request_limit(
  text,
  text,
  integer,
  integer
) to service_role;

notify pgrst, 'reload schema';
