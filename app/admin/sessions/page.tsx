import { redirect } from "next/navigation";
import { createClient } from "../../../utils/supabase/server";
import { zoomConfigurationStatus } from "../../../utils/zoom/server";
import AdminSessionManager, {
  type AdminLesson,
  type AdminStudent,
  type AdminZoomTutor,
} from "./AdminSessionManager";
import type {
  AdminConsultation,
  AdminFamilyLink,
  AdminParent,
} from "./AdminConsultationPanel";

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/portal");

  const [
    { data: students },
    { data: parents },
    { data: tutors },
    { data: lessons },
    { data: consultations },
    { data: familyLinks },
  ] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,full_name,email")
        .eq("role", "student")
        .order("full_name", { ascending: true }),
      supabase
        .from("profiles")
        .select("id,full_name,email")
        .eq("role", "parent")
        .order("full_name", { ascending: true }),
      supabase
        .from("tutors")
        .select("registry_id,name,exam,zoom_host_email,active")
        .order("display_order", { ascending: true }),
      supabase
        .from("portal_sessions")
        .select(
          "id,user_id,tutor_registry_id,session_date,starts_at,duration_minutes,subject,title,notes,zoom_meeting_number,zoom_host_email,zoom_status",
        )
        .order("session_date", { ascending: false })
        .order("starts_at", { ascending: false })
        .limit(100),
      supabase
        .from("consultation_sessions")
        .select(
          "id,parent_id,session_date,starts_at,duration_minutes,actual_minutes,topic,title,notes,zoom_meeting_number,zoom_status",
        )
        .order("session_date", { ascending: false })
        .order("starts_at", { ascending: false })
        .limit(100),
      supabase
        .from("parent_student_links")
        .select("parent_id,student_id"),
    ]);

  return (
    <AdminSessionManager
      adminName={profile.full_name || profile.email || user.email || "관리자"}
      initialStudents={(students ?? []) as AdminStudent[]}
      initialTutors={(tutors ?? []) as AdminZoomTutor[]}
      initialLessons={(lessons ?? []) as AdminLesson[]}
      initialParents={(parents ?? []) as AdminParent[]}
      initialFamilyLinks={(familyLinks ?? []) as AdminFamilyLink[]}
      initialConsultations={(consultations ?? []) as AdminConsultation[]}
      zoomConfigured={zoomConfigurationStatus().configured}
    />
  );
}
