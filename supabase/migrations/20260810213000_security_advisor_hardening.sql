-- Keep privileged RLS helpers out of the API-exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

alter function public.is_admin() set schema private;
alter function public.current_profile_role() set schema private;
alter function public.current_tutor_registry_id() set schema private;
alter function public.can_access_chat_thread(bigint) set schema private;

revoke all on function private.is_admin() from public, anon, authenticated;
revoke all on function private.current_profile_role() from public, anon, authenticated;
revoke all on function private.current_tutor_registry_id() from public, anon, authenticated;
revoke all on function private.can_access_chat_thread(bigint) from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_profile_role() to authenticated;
grant execute on function private.current_tutor_registry_id() to authenticated;
grant execute on function private.can_access_chat_thread(bigint) to authenticated;

-- SQL function bodies are stored as text, so refresh the helper's internal names.
create or replace function private.can_access_chat_thread(target_thread_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.chat_threads
    where id = target_thread_id
      and (
        student_id = (select auth.uid())
        or (
          (select private.current_profile_role()) = 'tutor'
          and tutor_registry_id = (select private.current_tutor_registry_id())
        )
        or (select private.is_admin())
      )
  );
$$;

revoke all on function private.can_access_chat_thread(bigint) from public, anon, authenticated;
grant execute on function private.can_access_chat_thread(bigint) to authenticated;

-- Trigger functions execute as their owner and must never be client-callable.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Recovery RPCs are invoked only by the rate-limited server route.
revoke all on function public.request_account_id_email(text, text)
  from public, anon, authenticated;
revoke all on function public.verify_account_recovery(text, text, text)
  from public, anon, authenticated;
grant execute on function public.request_account_id_email(text, text) to service_role;
grant execute on function public.verify_account_recovery(text, text, text) to service_role;

-- These legacy privilege-escalating RPC surfaces are no longer needed.
drop function if exists public.find_account_hint(text, text);
drop function if exists public.delete_my_account();
drop function if exists public.submit_homework(bigint);

-- Explicit deny policies document that these service-only tables have no client path.
drop policy if exists "No client access to recovery request audit" on public.account_recovery_email_requests;
create policy "No client access to recovery request audit"
on public.account_recovery_email_requests
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "No client access to auth rate limits" on public.auth_request_limits;
create policy "No client access to auth rate limits"
on public.auth_request_limits
for all
to anon, authenticated
using (false)
with check (false);

notify pgrst, 'reload schema';
