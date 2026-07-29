import { redirect } from "next/navigation";
import { createClient } from "../../../utils/supabase/server";
import type { PortalChatThread } from "../ChatPanel";
import TutorPortalDashboard, {
  type TutorPortalSession,
} from "./TutorPortalDashboard";

export const dynamic = "force-dynamic";

export default async function TutorPortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,role,tutor_registry_id")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role !== "tutor" || !profile.tutor_registry_id) {
    redirect("/portal");
  }

  const [{ data: sessionRows }, { data: threadRows }] = await Promise.all([
    supabase
      .from("portal_sessions")
      .select(
        "id,user_id,session_date,starts_at,duration_minutes,actual_minutes,subject,title,session_type,location,notes,zoom_meeting_number,zoom_status",
      )
      .eq("tutor_registry_id", profile.tutor_registry_id)
      .order("session_date", { ascending: true })
      .order("starts_at", { ascending: true }),
    supabase
      .from("chat_threads")
      .select("id,student_id")
      .eq("tutor_registry_id", profile.tutor_registry_id)
      .order("updated_at", { ascending: false }),
  ]);

  const studentIds = Array.from(
    new Set([
      ...(sessionRows ?? []).map((row) => row.user_id),
      ...(threadRows ?? []).map((row) => row.student_id),
    ]),
  );
  const studentMap = new Map<
    string,
    { full_name: string | null; email: string }
  >();
  if (studentIds.length) {
    const { data: students } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .in("id", studentIds);
    for (const student of students ?? []) studentMap.set(student.id, student);
  }

  const sessions: TutorPortalSession[] = (sessionRows ?? []).map((row) => ({
    id: row.id,
    studentName:
      studentMap.get(row.user_id)?.full_name
      || studentMap.get(row.user_id)?.email
      || "학생",
    sessionDate: row.session_date,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    actualMinutes: row.actual_minutes,
    subject: row.subject,
    title: row.title,
    sessionType: row.session_type,
    location: row.location,
    notes: row.notes,
    zoomMeetingNumber: row.zoom_meeting_number,
    zoomStatus: row.zoom_status,
  }));

  const chatThreads: PortalChatThread[] = (threadRows ?? []).map((row) => ({
    id: row.id,
    counterpartName:
      studentMap.get(row.student_id)?.full_name
      || studentMap.get(row.student_id)?.email
      || "학생",
    counterpartMeta: "수강 학생",
  }));

  return (
    <TutorPortalDashboard
      currentUserId={user.id}
      tutor={{
        name:
          profile.full_name
          || user.user_metadata?.full_name
          || user.email?.split("@")[0]
          || "튜터",
        email: profile.email || user.email || "",
        registryId: profile.tutor_registry_id,
      }}
      sessions={sessions}
      chatThreads={chatThreads}
    />
  );
}
