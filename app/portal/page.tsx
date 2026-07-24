import { redirect } from "next/navigation";
import { createClient } from "../../utils/supabase/server";
import PortalDashboard, { type PortalSession } from "./PortalDashboard";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: sessionRows }] = await Promise.all([
    supabase.from("profiles").select("full_name,email,role").eq("id", user.id).single(),
    supabase
      .from("portal_sessions")
      .select(
        "id,session_date,starts_at,duration_minutes,subject,title,session_type,location,notes,tutor_registry_id,tutors(name,university,photo_url)",
      )
      .eq("user_id", user.id)
      .order("session_date", { ascending: true })
      .order("starts_at", { ascending: true }),
  ]);

  const sessions: PortalSession[] = (sessionRows ?? []).map((row) => {
    const tutor = Array.isArray(row.tutors) ? row.tutors[0] : row.tutors;
    return {
      id: row.id,
      sessionDate: row.session_date,
      startsAt: row.starts_at,
      durationMinutes: row.duration_minutes,
      subject: row.subject,
      title: row.title,
      sessionType: row.session_type,
      location: row.location,
      notes: row.notes,
      tutorRegistryId: row.tutor_registry_id,
      tutor: tutor
        ? { name: tutor.name, university: tutor.university, photoUrl: tutor.photo_url }
        : null,
    };
  });

  return (
    <PortalDashboard
      user={{
        name: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "사용자",
        email: profile?.email || user.email || "",
        role: profile?.role === "admin" ? "admin" : "user",
      }}
      sessions={sessions}
    />
  );
}
