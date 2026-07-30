-- Give the formerly generic "user" role an explicit student meaning.
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  alter column role set default 'student';

update public.profiles
set role = 'student',
    updated_at = now()
where role = 'user';

alter table public.profiles
  add constraint profiles_role_check
    check (role in ('student', 'parent', 'tutor', 'admin'));

comment on column public.profiles.role is
  'Access role: student, parent, tutor, or admin. Tutor is assigned only through a matched tutor registry email or an administrator.';

-- OAuth creates the auth user before the application callback can append the
-- local phone/consent metadata. This trigger therefore creates the profile on
-- the first event, then completes it synchronously when the callback updates
-- raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_tutor_registry_id text;
  requested_role text;
  consented boolean;
  is_admin_account boolean;
begin
  select registry_id
  into matched_tutor_registry_id
  from public.tutors
  where zoom_host_email is not null
    and lower(zoom_host_email) = lower(coalesce(new.email, ''))
  limit 1;

  requested_role := case
    when new.raw_user_meta_data ->> 'account_role' = 'parent' then 'parent'
    else 'student'
  end;
  consented :=
    coalesce(new.raw_user_meta_data ->> 'privacy_agreed', 'false') = 'true'
    and coalesce(new.raw_user_meta_data ->> 'terms_agreed', 'false') = 'true'
    and coalesce(new.raw_user_meta_data ->> 'age_confirmed', 'false') = 'true';
  is_admin_account :=
    lower(coalesce(new.email, '')) = 'ssapgoadmin@seonbae.internal';

  insert into public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    tutor_registry_id,
    privacy_consent_version,
    privacy_consented_at,
    terms_version,
    terms_agreed_at,
    age_confirmed_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(
      coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name'
      ),
      ''
    ),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case
      when is_admin_account then 'admin'
      when matched_tutor_registry_id is not null then 'tutor'
      else requested_role
    end,
    matched_tutor_registry_id,
    nullif(new.raw_user_meta_data ->> 'privacy_consent_version', ''),
    case when consented then now() else null end,
    nullif(new.raw_user_meta_data ->> 'terms_version', ''),
    case when consented then now() else null end,
    case when consented then now() else null end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    role = case
      when public.profiles.role = 'admin' or is_admin_account then 'admin'
      when matched_tutor_registry_id is not null then 'tutor'
      when public.profiles.role = 'tutor' then 'tutor'
      else requested_role
    end,
    tutor_registry_id = case
      when matched_tutor_registry_id is not null then matched_tutor_registry_id
      when public.profiles.role = 'tutor' then public.profiles.tutor_registry_id
      else null
    end,
    privacy_consent_version = coalesce(
      excluded.privacy_consent_version,
      public.profiles.privacy_consent_version
    ),
    privacy_consented_at = coalesce(
      public.profiles.privacy_consented_at,
      excluded.privacy_consented_at
    ),
    terms_version = coalesce(
      excluded.terms_version,
      public.profiles.terms_version
    ),
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

-- Password sign-up has all metadata at INSERT time. OAuth sign-up receives
-- phone/consent metadata only after the provider callback, so synchronize the
-- profile again when that metadata (or the verified email) changes.
drop trigger if exists on_auth_user_metadata_updated on auth.users;
create trigger on_auth_user_metadata_updated
  after update of raw_user_meta_data, email on auth.users
  for each row
  when (
    old.raw_user_meta_data is distinct from new.raw_user_meta_data
    or old.email is distinct from new.email
  )
  execute procedure public.handle_new_user();

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
  where role in ('student', 'parent', 'tutor')
    and lower(trim(full_name)) = lower(trim(p_full_name))
    and public.canonical_phone_digits(phone)
      = public.canonical_phone_digits(p_phone)
  order by created_at asc
  limit 1;

  if account_email is null then
    return null;
  end if;

  local_part := split_part(account_email, '@', 1);
  domain_part := split_part(account_email, '@', 2);

  return
    case
      when length(local_part) <= 2 then left(local_part, 1) || '***'
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
    where role in ('student', 'parent', 'tutor')
      and lower(trim(full_name)) = lower(trim(p_full_name))
      and public.canonical_phone_digits(phone)
        = public.canonical_phone_digits(p_phone)
      and lower(email) = lower(trim(p_email))
  );
$$;

create or replace function public.request_account_id_email(
  p_full_name text,
  p_phone text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_email text;
  lookup_key text;
  request_headers jsonb;
  public_api_key text;
begin
  if length(trim(coalesce(p_full_name, ''))) < 2
    or public.canonical_phone_digits(p_phone) !~ '^[1-9][0-9]{7,14}$'
  then
    return true;
  end if;

  select email
  into account_email
  from public.profiles
  where role in ('student', 'parent', 'tutor')
    and lower(trim(full_name)) = lower(trim(p_full_name))
    and public.canonical_phone_digits(phone)
      = public.canonical_phone_digits(p_phone)
  order by created_at asc
  limit 1;

  if account_email is null then
    return true;
  end if;

  lookup_key := encode(
    extensions.digest(
      convert_to(
        lower(trim(p_full_name))
        || ':'
        || public.canonical_phone_digits(p_phone),
        'utf8'
      ),
      'sha256'
    ),
    'hex'
  );

  if exists (
    select 1
    from public.account_recovery_email_requests
    where lookup_fingerprint = lookup_key
      and requested_at > now() - interval '5 minutes'
  ) then
    return true;
  end if;

  select decrypted_secret
  into public_api_key
  from vault.decrypted_secrets
  where name = 'seonbae_supabase_publishable_key'
  order by created_at desc
  limit 1;

  if public_api_key is null then
    request_headers := coalesce(
      nullif(current_setting('request.headers', true), ''),
      '{}'
    )::jsonb;
    public_api_key := nullif(request_headers ->> 'apikey', '');
  end if;

  if public_api_key is null then
    raise exception 'Account recovery email is not configured';
  end if;

  insert into public.account_recovery_email_requests (lookup_fingerprint)
  values (lookup_key);

  delete from public.account_recovery_email_requests
  where requested_at < now() - interval '7 days';

  perform net.http_post(
    url :=
      'https://ccblynvwidadvhtbexfd.supabase.co/auth/v1/otp'
      || '?redirect_to=https%3A%2F%2Fwww.seonbaetutor.com%2Fapi%2Fauth%2Fcallback%3Fnext%3D%2Fportal',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', public_api_key,
      'Authorization', 'Bearer ' || public_api_key
    ),
    body := jsonb_build_object(
      'email', account_email,
      'create_user', false
    )
  );

  return true;
end;
$$;

revoke all on function public.find_account_hint(text, text) from public;
revoke all on function public.verify_account_recovery(text, text, text) from public;
revoke all on function public.request_account_id_email(text, text) from public;
grant execute on function public.find_account_hint(text, text) to anon, authenticated;
grant execute on function public.verify_account_recovery(text, text, text) to anon, authenticated;
grant execute on function public.request_account_id_email(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
