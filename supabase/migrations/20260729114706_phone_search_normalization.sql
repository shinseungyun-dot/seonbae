-- Defines phone normalization before the vault-backed recovery function uses it.
create or replace function public.canonical_phone_digits(value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  with cleaned as (
    select regexp_replace(value, '[^0-9]', '', 'g') as digits
  )
  select
    case
      when digits like '00%' then substring(digits from 3)
      when digits like '0%' then '82' || substring(digits from 2)
      else digits
    end
  from cleaned;
$$;

revoke all on function public.canonical_phone_digits(text) from public;
revoke all on function public.canonical_phone_digits(text) from anon;
revoke all on function public.canonical_phone_digits(text) from authenticated;

update public.profiles
set
  phone = '+' || public.canonical_phone_digits(phone),
  updated_at = now()
where phone is not null
  and public.canonical_phone_digits(phone) ~ '^[1-9][0-9]{7,14}$'
  and phone <> '+' || public.canonical_phone_digits(phone);

update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{phone}',
  to_jsonb('+' || public.canonical_phone_digits(raw_user_meta_data ->> 'phone')),
  true
)
where raw_user_meta_data ? 'phone'
  and public.canonical_phone_digits(raw_user_meta_data ->> 'phone') ~ '^[1-9][0-9]{7,14}$'
  and raw_user_meta_data ->> 'phone'
    <> '+' || public.canonical_phone_digits(raw_user_meta_data ->> 'phone');

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
      and public.canonical_phone_digits(phone)
        = public.canonical_phone_digits(p_phone)
      and lower(email) = lower(trim(p_email))
  );
$$;

revoke all on function public.verify_account_recovery(text, text, text) from public;
revoke all on function public.verify_account_recovery(text, text, text) from anon;
revoke all on function public.verify_account_recovery(text, text, text) from authenticated;
grant execute on function public.verify_account_recovery(text, text, text) to anon, authenticated;

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
  where role = 'user'
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

  request_headers := coalesce(
    nullif(current_setting('request.headers', true), ''),
    '{}'
  )::jsonb;
  public_api_key := nullif(request_headers ->> 'apikey', '');

  if public_api_key is null then
    raise exception 'API request context is unavailable';
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

revoke all on function public.request_account_id_email(text, text) from public;
revoke all on function public.request_account_id_email(text, text) from anon;
revoke all on function public.request_account_id_email(text, text) from authenticated;
grant execute on function public.request_account_id_email(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
