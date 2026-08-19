-- Tutors schedule their own Zoom lessons, and tutor applications arrive before
-- an account exists.

-- 1. Tutors may create sessions under their own registry id, and only for a
--    student they already work with. The API checks the relationship too; this
--    policy keeps the guarantee if the table is reached through PostgREST
--    directly.
drop policy if exists "Tutors can create their own sessions" on public.portal_sessions;
create policy "Tutors can create their own sessions"
on public.portal_sessions
for insert
to authenticated
with check (
  tutor_registry_id = (select public.current_tutor_registry_id())
  and (
    exists (
      select 1
      from public.chat_threads thread
      where thread.student_id = portal_sessions.user_id
        and thread.tutor_registry_id = portal_sessions.tutor_registry_id
    )
    or exists (
      select 1
      from public.portal_sessions existing
      where existing.user_id = portal_sessions.user_id
        and existing.tutor_registry_id = portal_sessions.tutor_registry_id
    )
  )
);

-- 2. Tutor sign-up is gone: applications are submitted by people who have no
--    account yet, and an admin creates the account after review. The request
--    therefore can no longer require a profile row, and it carries the
--    credential documents that used to be uploaded from the tutor portal.
alter table public.account_creation_requests
  alter column user_id drop not null;

alter table public.account_creation_requests
  add column if not exists credential_path text,
  add column if not exists credential_name text,
  add column if not exists university text,
  add column if not exists subjects text,
  add column if not exists referral_code text,
  add column if not exists applicant_note text;
