-- Tutor referrals and an append-only, server-written electronic contract trail.

alter table public.account_creation_requests
  add column if not exists referral_code text;

alter table public.account_creation_requests
  add constraint account_creation_requests_referral_code_length
  check (referral_code is null or char_length(referral_code) <= 80);

alter table public.auth_request_limits
  drop constraint if exists auth_request_limits_action_check;

alter table public.auth_request_limits
  add constraint auth_request_limits_action_check
    check (action in ('authenticate', 'signup', 'recovery', 'password_update', 'consultation', 'contract_signature'));

create or replace function public.consume_auth_request_limit(
  p_key_hash text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
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
    or p_action not in ('authenticate', 'signup', 'recovery', 'password_update', 'consultation', 'contract_signature')
    or p_limit not between 1 and 1000
    or p_window_seconds not between 10 and 86400
  then
    raise exception 'Invalid rate-limit parameters';
  end if;

  window_interval := make_interval(secs => p_window_seconds);
  insert into public.auth_request_limits (key_hash, action, window_started_at, request_count, updated_at)
  values (p_key_hash, p_action, now(), 1, now())
  on conflict (key_hash, action) do update
  set
    window_started_at = case when public.auth_request_limits.window_started_at <= now() - window_interval then now() else public.auth_request_limits.window_started_at end,
    request_count = case when public.auth_request_limits.window_started_at <= now() - window_interval then 1 else public.auth_request_limits.request_count + 1 end,
    updated_at = now()
  returning auth_request_limits.request_count, auth_request_limits.window_started_at
  into current_count, current_window_started_at;

  allowed := current_count <= p_limit;
  retry_after_seconds := case when allowed then 0 else greatest(1, ceil(extract(epoch from (current_window_started_at + window_interval - now())))::integer) end;
  if random() < 0.01 then
    delete from public.auth_request_limits where updated_at < now() - interval '2 days';
  end if;
  return next;
end;
$$;

revoke all on function public.consume_auth_request_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_auth_request_limit(text, text, integer, integer)
  to service_role;

create table if not exists public.tutor_contract_signatures (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles(id) on delete cascade,
  application_request_id bigint not null references public.account_creation_requests(id) on delete restrict,
  tutor_registry_id text not null references public.tutors(registry_id) on delete restrict,
  contract_version text not null check (char_length(contract_version) between 1 and 40),
  contract_title text not null check (char_length(contract_title) between 1 and 120),
  contract_hash text not null check (contract_hash ~ '^[a-f0-9]{64}$'),
  contract_snapshot jsonb not null,
  signer_name text not null check (char_length(signer_name) between 2 and 80),
  signer_birth_date date not null,
  signer_phone text not null check (char_length(signer_phone) between 7 and 32),
  signer_affiliation text not null check (char_length(signer_affiliation) between 2 and 120),
  signer_email text not null check (char_length(signer_email) between 3 and 254),
  signature_path text not null check (char_length(signature_path) between 1 and 500),
  signature_sha256 text not null check (signature_sha256 ~ '^[a-f0-9]{64}$'),
  signing_method text not null default 'drawn_signature_and_explicit_consent'
    check (signing_method = 'drawn_signature_and_explicit_consent'),
  accepted_at timestamptz not null,
  signed_at timestamptz not null default now(),
  approval_snapshot jsonb not null,
  ip_address_hash text not null check (ip_address_hash ~ '^[a-f0-9]{64}$'),
  user_agent_hash text not null check (user_agent_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique (tutor_id, contract_version)
);

create index if not exists tutor_contract_signatures_tutor_signed_idx
  on public.tutor_contract_signatures (tutor_id, signed_at desc);

alter table public.tutor_contract_signatures enable row level security;
revoke all on table public.tutor_contract_signatures from public, anon, authenticated;
grant select on table public.tutor_contract_signatures to authenticated;

create policy "Tutors can read their signed contracts"
on public.tutor_contract_signatures
for select
to authenticated
using (tutor_id = (select auth.uid()) or (select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tutor-contract-signatures',
  'tutor-contract-signatures',
  false,
  524288,
  array['image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';
