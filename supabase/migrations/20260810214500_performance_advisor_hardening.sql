-- Cover foreign keys used during parent-row updates and deletes.
create index if not exists account_creation_requests_reviewed_by_idx
  on public.account_creation_requests (reviewed_by)
  where reviewed_by is not null;

create index if not exists chat_messages_sender_idx
  on public.chat_messages (sender_id);

create index if not exists consultation_requests_handled_by_idx
  on public.consultation_requests (handled_by)
  where handled_by is not null;

create index if not exists consultation_requests_user_idx
  on public.consultation_requests (user_id)
  where user_id is not null;

create index if not exists portal_sessions_tutor_registry_idx
  on public.portal_sessions (tutor_registry_id)
  where tutor_registry_id is not null;

create index if not exists tutor_credentials_reviewed_by_idx
  on public.tutor_credentials (reviewed_by)
  where reviewed_by is not null;

create index if not exists tutor_credentials_tutor_registry_idx
  on public.tutor_credentials (tutor_registry_id)
  where tutor_registry_id is not null;

-- Give every role/action pair one permissive policy so PostgreSQL evaluates
-- one combined predicate instead of several overlapping predicates.
drop policy if exists "Admins can manage chat threads" on public.chat_threads;
create policy "Admins can insert chat threads"
on public.chat_threads for insert to authenticated
with check ((select private.is_admin()));
create policy "Admins can update chat threads"
on public.chat_threads for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy "Admins can delete chat threads"
on public.chat_threads for delete to authenticated
using ((select private.is_admin()));

drop policy if exists "Admins can read consultation attendance" on public.consultation_attendance;
drop policy if exists "Parents can read consultation attendance" on public.consultation_attendance;
create policy "Authorized users can read consultation attendance"
on public.consultation_attendance for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.consultation_sessions
    where consultation_sessions.id = consultation_attendance.consultation_id
      and consultation_sessions.parent_id = (select auth.uid())
  )
);

drop policy if exists "Admins can manage consultations" on public.consultation_sessions;
drop policy if exists "Parents can read their consultations" on public.consultation_sessions;
create policy "Authorized users can read consultations"
on public.consultation_sessions for select to authenticated
using (
  parent_id = (select auth.uid())
  or (select private.is_admin())
);
create policy "Admins can insert consultations"
on public.consultation_sessions for insert to authenticated
with check ((select private.is_admin()));
create policy "Admins can update consultations"
on public.consultation_sessions for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy "Admins can delete consultations"
on public.consultation_sessions for delete to authenticated
using ((select private.is_admin()));

drop policy if exists "Admins can manage family links" on public.parent_student_links;
create policy "Admins can insert family links"
on public.parent_student_links for insert to authenticated
with check ((select private.is_admin()));
create policy "Admins can update family links"
on public.parent_student_links for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy "Admins can delete family links"
on public.parent_student_links for delete to authenticated
using ((select private.is_admin()));

drop policy if exists "Admins can manage homework" on public.portal_assignments;
drop policy if exists "Students can read their homework" on public.portal_assignments;
drop policy if exists "Parents can read linked student homework" on public.portal_assignments;
drop policy if exists "Tutors can read assigned homework" on public.portal_assignments;
drop policy if exists "Tutors can assign homework to their students" on public.portal_assignments;
drop policy if exists "Tutors can update their homework" on public.portal_assignments;
create policy "Authorized users can read homework"
on public.portal_assignments for select to authenticated
using (
  student_id = (select auth.uid())
  or tutor_registry_id = (select private.current_tutor_registry_id())
  or exists (
    select 1
    from public.parent_student_links
    where parent_id = (select auth.uid())
      and student_id = portal_assignments.student_id
  )
  or (select private.is_admin())
);
create policy "Tutors and admins can assign homework"
on public.portal_assignments for insert to authenticated
with check (
  (select private.is_admin())
  or (
    tutor_registry_id = (select private.current_tutor_registry_id())
    and exists (
      select 1
      from public.portal_sessions
      where user_id = portal_assignments.student_id
        and tutor_registry_id = (select private.current_tutor_registry_id())
    )
  )
);
create policy "Tutors and admins can update homework"
on public.portal_assignments for update to authenticated
using (
  (select private.is_admin())
  or tutor_registry_id = (select private.current_tutor_registry_id())
)
with check (
  (select private.is_admin())
  or tutor_registry_id = (select private.current_tutor_registry_id())
);
create policy "Admins can delete homework"
on public.portal_assignments for delete to authenticated
using ((select private.is_admin()));

drop policy if exists "Admins can manage sessions" on public.portal_sessions;
drop policy if exists "Users can read their own sessions" on public.portal_sessions;
drop policy if exists "Tutors can read their assigned sessions" on public.portal_sessions;
drop policy if exists "Parents can read linked student sessions" on public.portal_sessions;
create policy "Authorized users can read sessions"
on public.portal_sessions for select to authenticated
using (
  user_id = (select auth.uid())
  or tutor_registry_id = (select private.current_tutor_registry_id())
  or (
    (select private.current_profile_role()) = 'parent'
    and exists (
      select 1
      from public.parent_student_links
      where parent_id = (select auth.uid())
        and student_id = portal_sessions.user_id
    )
  )
  or (select private.is_admin())
);
create policy "Admins can insert sessions"
on public.portal_sessions for insert to authenticated
with check ((select private.is_admin()));
create policy "Admins can update sessions"
on public.portal_sessions for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy "Admins can delete sessions"
on public.portal_sessions for delete to authenticated
using ((select private.is_admin()));

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Admins can read profiles" on public.profiles;
drop policy if exists "Parents can read linked student profiles" on public.profiles;
drop policy if exists "Tutors can read assigned student profiles" on public.profiles;
create policy "Authorized users can read profiles"
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select private.is_admin())
  or exists (
    select 1
    from public.parent_student_links
    where parent_id = (select auth.uid())
      and student_id = profiles.id
  )
  or (
    (select private.current_profile_role()) = 'tutor'
    and exists (
      select 1
      from public.portal_sessions
      where user_id = profiles.id
        and tutor_registry_id = (select private.current_tutor_registry_id())
    )
  )
);

drop policy if exists "Admins can read all tutors" on public.tutors;
drop policy if exists "Public can read active tutors" on public.tutors;
create policy "Anonymous users can read active tutors"
on public.tutors for select to anon
using (active = true);
create policy "Authenticated users can read visible tutors"
on public.tutors for select to authenticated
using (active = true or (select private.is_admin()));

drop policy if exists "Admins can read Zoom attendance" on public.zoom_attendance;
drop policy if exists "Tutors can read attendance for assigned sessions" on public.zoom_attendance;
drop policy if exists "Users can read attendance for their sessions" on public.zoom_attendance;
create policy "Authorized users can read Zoom attendance"
on public.zoom_attendance for select to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.portal_sessions
    where portal_sessions.id = zoom_attendance.session_id
      and (
        portal_sessions.user_id = (select auth.uid())
        or portal_sessions.tutor_registry_id = (select private.current_tutor_registry_id())
      )
  )
);

notify pgrst, 'reload schema';
