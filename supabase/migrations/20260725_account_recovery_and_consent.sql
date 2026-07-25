alter table public.profiles
  add column if not exists phone text,
  add column if not exists privacy_consent_version text,
  add column if not exists privacy_consented_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists terms_agreed_at timestamptz,
  add column if not exists age_confirmed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_phone_format;

alter table public.profiles
  add constraint profiles_phone_format
  check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$');

create index if not exists profiles_phone_lookup_idx
  on public.profiles (phone, lower(full_name));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_admin_account boolean;
  consented boolean;
begin
  is_admin_account := coalesce(new.email, '') = 'ssapgoadmin@seonbae.internal';
  consented :=
    coalesce(new.raw_user_meta_data ->> 'privacy_agreed', 'false') = 'true'
    and coalesce(new.raw_user_meta_data ->> 'terms_agreed', 'false') = 'true'
    and coalesce(new.raw_user_meta_data ->> 'age_confirmed', 'false') = 'true';

  if tg_op = 'INSERT' and not is_admin_account and not consented then
    raise exception 'Required signup consent is missing';
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    privacy_consent_version,
    privacy_consented_at,
    terms_version,
    terms_agreed_at,
    age_confirmed_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'privacy_consent_version', ''),
    case when consented then now() else null end,
    nullif(new.raw_user_meta_data ->> 'terms_version', ''),
    case when consented then now() else null end,
    case when consented then now() else null end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    privacy_consent_version = coalesce(
      public.profiles.privacy_consent_version,
      excluded.privacy_consent_version
    ),
    privacy_consented_at = coalesce(
      public.profiles.privacy_consented_at,
      excluded.privacy_consented_at
    ),
    terms_version = coalesce(public.profiles.terms_version, excluded.terms_version),
    terms_agreed_at = coalesce(
      public.profiles.terms_agreed_at,
      excluded.terms_agreed_at
    ),
    age_confirmed_at = coalesce(
      public.profiles.age_confirmed_at,
      excluded.age_confirmed_at
    ),
    updated_at = now();

  return new;
end;
$$;

create or replace function public.find_account_hint(
  p_full_name text,
  p_phone text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_email text;
  local_part text;
  domain_part text;
begin
  select email
  into account_email
  from public.profiles
  where role = 'user'
    and lower(trim(full_name)) = lower(trim(p_full_name))
    and phone = p_phone
  order by created_at asc
  limit 1;

  if account_email is null then
    return null;
  end if;

  local_part := split_part(account_email, '@', 1);
  domain_part := split_part(account_email, '@', 2);

  return
    case
      when length(local_part) <= 1 then left(local_part, 1) || '***'
      when length(local_part) = 2 then left(local_part, 1) || '***'
      else left(local_part, 2) || repeat('*', greatest(length(local_part) - 2, 3))
    end
    || '@'
    || domain_part;
end;
$$;

create or replace function public.verify_account_recovery(
  p_full_name text,
  p_phone text,
  p_email text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where role = 'user'
      and lower(trim(full_name)) = lower(trim(p_full_name))
      and phone = p_phone
      and lower(email) = lower(trim(p_email))
  );
$$;

revoke all on function public.find_account_hint(text, text) from public;
revoke all on function public.verify_account_recovery(text, text, text) from public;
grant execute on function public.find_account_hint(text, text) to anon, authenticated;
grant execute on function public.verify_account_recovery(text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
