-- Route every new account through the same admissions inbox.

alter table public.account_creation_requests
  alter column acceptance_letter_path drop not null,
  alter column acceptance_letter_name drop not null;

-- Recover pending accounts that pre-date the unified signup request flow.
insert into public.account_creation_requests (
  user_id,
  full_name,
  email,
  phone,
  requested_role,
  acceptance_letter_path,
  acceptance_letter_name,
  status
)
select
  profile.id,
  coalesce(nullif(profile.full_name, ''), split_part(profile.email, '@', 1)),
  profile.email,
  coalesce(profile.phone, ''),
  case
    when profile.role in ('student', 'parent', 'tutor') then profile.role
    else 'student'
  end,
  null,
  null,
  'pending'
from public.profiles as profile
where profile.role <> 'admin'
  and profile.account_status = 'pending'
on conflict (user_id) do nothing;

-- This account was created while student/parent requests were not recorded.
insert into public.account_creation_requests (
  user_id,
  full_name,
  email,
  phone,
  requested_role,
  acceptance_letter_path,
  acceptance_letter_name,
  status
)
select
  profile.id,
  coalesce(nullif(profile.full_name, ''), split_part(profile.email, '@', 1)),
  profile.email,
  coalesce(profile.phone, ''),
  case
    when profile.role in ('student', 'parent', 'tutor') then profile.role
    else 'student'
  end,
  null,
  null,
  'pending'
from public.profiles as profile
where lower(profile.email) = 'messiyoda5@gmail.com'
on conflict (user_id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  requested_role = excluded.requested_role,
  status = 'pending',
  reviewed_by = null,
  reviewed_at = null,
  review_note = null,
  updated_at = now();

update public.profiles
set
  account_status = 'pending',
  account_reviewed_at = null,
  updated_at = now()
where lower(email) = 'messiyoda5@gmail.com'
  and role <> 'admin';
